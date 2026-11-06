import {useRef,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {ProductCommand} from '../domain/productEvidence.generated';
import type {DecisionRepository,SavedDecision} from './decisions';
export type ProductPayload=ProductCommand['payload'];
export interface ProductRepository{apply(id:string,command:ProductCommand):Promise<void>}
export function createProductRepository(client:SupabaseClient):ProductRepository{return{async apply(id,command){const {error}=await client.functions.invoke('product-api',{body:{decisionId:id,command}});if(error){const detail=await(error as unknown as {context?:Response}).context?.json().catch(()=>null);if(detail?.error)throw {message:detail.error,code:detail.code};throw error;}}};}
export type ProductEditorProps={client?:SupabaseClient;productRepository?:ProductRepository;decision:SavedDecision;repository:DecisionRepository;onSaved:(d:SavedDecision)=>void};
const message=(e:unknown)=>e&&typeof e==='object'&&'message'in e?String(e.message):'Could not save. Please retry.';
export function useProductEdit(props:ProductEditorProps){
  const {decision,repository,onSaved}=props;const service=props.productRepository??(props.client?createProductRepository(props.client):null);
  const revision=useRef<number|null>(null),pending=useRef<ProductCommand|null>(null),lock=useRef(false);
  const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[stale,setStale]=useState(false);
  const begin=()=>{revision.current??=decision.revision;};
  async function save(type:ProductCommand['type'],payload:ProductPayload){
    if(!service||lock.current||stale)return false;lock.current=true;setBusy(true);setStatus('');begin();
    pending.current??={actionId:crypto.randomUUID(),expectedRevision:revision.current!,type,payload} as ProductCommand;
    try{await service.apply(decision.id,pending.current);onSaved(await repository.get(decision.id));pending.current=null;revision.current=null;setStatus('Saved. Your comparison and requirement checks now use this answer.');return true;}
    catch(e){if(e&&typeof e==='object'&&'code'in e&&e.code==='40001'){pending.current=null;setStale(true);try{onSaved(await repository.get(decision.id));}catch{/* Preserve the draft and original conflict. */}setStatus('The decision changed. Your draft is preserved; review the latest details before saving.');}else{if(e&&typeof e==='object'&&'code'in e&&['22023','23505'].includes(String(e.code)))pending.current=null;setStatus(message(e));}return false;}
    finally{lock.current=false;setBusy(false);}
  }
  function review(){revision.current=decision.revision;setStale(false);setStatus('Latest decision reviewed. Your draft is ready to save.');}
  return{begin,save,busy,status,stale,review,pending:!!pending.current,disabled:busy||stale||!!decision.archived_at||!service,retry:()=>pending.current?save(pending.current.type,pending.current.payload):Promise.resolve(false)};
}
