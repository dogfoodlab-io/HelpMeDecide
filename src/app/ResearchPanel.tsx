import {ProductCard} from './ProductCard';
import type {ProductEvidence} from '../domain/productEvidence.generated';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DecisionRepository, SavedDecision } from '../services/decisions';
import { assessResearchPrice } from '../domain/purchaseBudget';
import type { ResearchResult } from '../domain/research.generated';

type Job = { id:string; status:string; decision_revision:number; automatic:boolean; queries_used:number; query_budget:number; attempts:number; error_code:string|null; created_at:string; result:ResearchResult|null; web_response:{sources:Array<{url:string;title:string}>}|null };
type Finding = { id:string; job_id:string; candidate:ResearchResult['findings'][number]&{details?:ProductEvidence}; state:'provisional'|'adopted'|'dismissed';created_at:string };
type Allowance = {configured:boolean;enabled:boolean;dailyLimit:number;dailyUsed:number};
const errors:Record<string,string> = {'provider-timeout':'The research provider timed out. A search may have run; its allowance is reserved to prevent accidental duplicate charges.','search-outcome-unknown':'A search response was lost. This pass will not repeat the search automatically.','no-supported-sources':'No usable source citations were returned.','fabricated-citation':'A finding referred to an unsupported source and was rejected.','provider-auth':'The research provider credentials need attention.','provider-rate-limit':'The research provider is currently limiting requests.'};
const message = (error:unknown) => error && typeof error==='object' && 'message' in error ? String(error.message) : 'Could not contact research. Please retry.';

export function ResearchPanel({client,decision,repository,onSaved}:{client:SupabaseClient;decision:SavedDecision;repository:DecisionRepository;onSaved:(value:SavedDecision)=>void}) {
  const [jobs,setJobs]=useState<Job[]>([]);
  const [findings,setFindings]=useState<Finding[]>([]);
  const [allowance,setAllowance]=useState<Allowance|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [showDismissed,setShowDismissed]=useState(false);
  const active=useRef(true);
  const automaticKey=useRef('');
  const manualKey=useRef<string|null>(null);
  const detailsRequest=useRef<{actionId:string;revision:number}|null>(null);
  const pendingReview=useRef<{id:string;actionId:string;revision:number;adopt:boolean}|null>(null);
  const call=useCallback(async (body:Record<string,unknown>) => {
    const {data,error}=await client.functions.invoke('research-api',{body});
    if(error) {
      const response=(error as unknown as {context?:Response}).context;
      if(response?.json) { const detail=await response.json().catch(()=>null); if(detail?.error) throw Object.assign(new Error(detail.error),{code:detail.code}); }
      throw error;
    }
    return data;
  },[client]);
  const load=useCallback(async () => {
    const [jobRows,findingRows,status]=await Promise.all([
      client.from('decision_research_jobs').select('id,status,decision_revision,automatic,queries_used,query_budget,attempts,error_code,created_at,result,web_response').eq('decision_id',decision.id).order('created_at',{ascending:false}),
      client.from('decision_research_findings').select('id,job_id,candidate,state,created_at').eq('decision_id',decision.id).order('created_at',{ascending:false}),
      call({action:'status'}),
    ]);
    if(jobRows.error) throw jobRows.error; if(findingRows.error) throw findingRows.error;
    if(active.current) { setJobs(jobRows.data as Job[]);setFindings(findingRows.data as Finding[]);setAllowance(status);setLoaded(true); }
  },[client,decision.id,call]);
  useEffect(()=>{
    active.current=true;
    void load().catch(error=>{if(active.current)setError(message(error));});
    const timer=setInterval(()=>{void load().catch(error=>{if(active.current)setError(message(error));});},6000);
    return()=>{active.current=false;clearInterval(timer);};
  },[load]);
  useEffect(()=>{
    if(!loaded || !allowance?.configured || !allowance.enabled || decision.archived_at || decision.canonical_model.finalChoice || jobs.some(job=>['queued','running','paused'].includes(job.status)) || jobs.filter(job=>job.automatic).length>=3) return;
    const key=`auto-${decision.id}-${decision.revision}`;
    if(automaticKey.current===key || allowance.dailyUsed>=allowance.dailyLimit) return;
    automaticKey.current=key;
    void call({action:'start',decisionId:decision.id,key,automatic:true}).then(load).catch(error=>{if(active.current)setError(message(error));});
  },[loaded,allowance,decision.id,decision.revision,decision.archived_at,decision.canonical_model.finalChoice,jobs,call,load]);
  async function command(body:Record<string,unknown>) {
    if(busy)return;setBusy(true);setError('');
    try{await call(body);await load();return true;}catch(error){setError(message(error));return false;}finally{setBusy(false);}
  }
  async function manualStart() {
    manualKey.current??=crypto.randomUUID();
    if(await command({action:'start',decisionId:decision.id,key:manualKey.current,automatic:false}))manualKey.current=null;
  }
  async function fillDetails(){
    if(busy)return;setBusy(true);setError('');detailsRequest.current??={actionId:crypto.randomUUID(),revision:decision.revision};
    try{await call({action:'details',decisionId:decision.id,...detailsRequest.current});detailsRequest.current=null;await load();}
    catch(e){if((e as {code?:string}).code==='40001'){detailsRequest.current=null;onSaved(await repository.get(decision.id));setError('The decision changed. Review the latest board, then request details again.');}else{if(['22023','P0001'].includes((e as {code?:string}).code??''))detailsRequest.current=null;setError(message(e));}}
    finally{setBusy(false);}
  }
  async function review(finding:Finding,adopt:boolean) {
    if(busy)return;setBusy(true);setError('');
    const action=pendingReview.current??{id:finding.id,actionId:crypto.randomUUID(),revision:decision.revision,adopt};pendingReview.current=action;
    try {
      const {error}=await client.rpc('review_research_finding',{p_finding:action.id,p_action_id:action.actionId,p_revision:action.revision,p_adopt:action.adopt});
      if(error)throw error;
      onSaved(await repository.get(decision.id));pendingReview.current=null;await load();
    }catch(error){
      if((error as {code?:string}).code==='40001') { onSaved(await repository.get(decision.id));pendingReview.current=null;setError('The decision changed. Review the latest board before trying again.'); }
      else { if((error as {code?:string}).code==='22023')pendingReview.current=null;setError(message(error)); }
    }finally{setBusy(false);}
  }
  const running=jobs.find(job=>['queued','running','paused'].includes(job.status));
  const latest=jobs[0];
  return <section className="panel research-panel" aria-label="Product research"><p className="eyebrow">Research & evidence</p><h2>{findings.length?'A shortlist to review':'Find the options worth exploring'}</h2>
    <p>Research suggestions stay separate until you adopt them. Prices and availability are dated findings, and may change.</p>
    {allowance && !allowance.configured && <p className="alpha-notice">Live research is awaiting service setup. Your contenders and preferences continue to save.</p>}
    {allowance && <p className="muted">{Math.max(0,allowance.dailyLimit-allowance.dailyUsed)} of {allowance.dailyLimit} research passes left today · {Math.max(0,3-jobs.filter(job=>job.automatic).length)} automatic passes left for this decision · up to 6 search calls per pass</p>}
    {allowance?.enabled===false && <p>Research is temporarily turned off.</p>}
    <div className="research-actions"><button className="composer-submit" disabled={busy||!!running||!allowance?.configured||!allowance.enabled||(allowance.dailyUsed>=allowance.dailyLimit&&!manualKey.current)||!!decision.archived_at} onClick={()=>void manualStart()}>{manualKey.current?'Retry research request':jobs.length?'Research again':'Research this decision'}</button>
      {running && <><span role="status">{running.status==='queued'?'Waiting for background research…':running.status==='paused'?'Research paused':running.web_response?'Sources found. Checking the findings…':'Searching sources…'}</span><button disabled={busy} onClick={()=>void command({action:'control',jobId:running.id,control:running.status==='paused'?'resume':'pause'})}>{running.status==='paused'?'Resume':'Pause'}</button><button disabled={busy} onClick={()=>void command({action:'control',jobId:running.id,control:'cancel'})}>Cancel research</button></>}
    </div>
    {jobs.some(job=>job.status==='completed'&&job.web_response)&&<p><button disabled={busy||!!running||!allowance?.configured||!!decision.archived_at||!allowance.enabled||allowance.dailyUsed>=allowance.dailyLimit} onClick={()=>void fillDetails()}>{detailsRequest.current?'Retry product details request':'Fill in product details from saved sources'}</button><small className="muted"> Checks existing research for exact models, offers and comparable specifications; uses one pass, no new search.</small></p>}
    {running && <p className="muted">You can close this page; research continues in the background. Pausing may allow an in-flight request to finish, but suggestions will wait for resume.</p>}
    {latest?.status==='failed' && <p role="alert">{errors[latest.error_code??'']??'This research pass could not finish. You can explicitly request another pass.'}</p>}
    {latest?.status==='cancelled' && <p>Research cancelled. Your existing contenders and preferences are unchanged.</p>}
    {latest?.result && <><p>{latest.result.summary}</p>{latest.decision_revision!==decision.revision && <p className="provisional-tag">Based on an earlier decision revision. Review it against your current preferences.</p>}<ul>{latest.result.unknowns.map((value,index)=><li key={index}>{value}</li>)}</ul></>}
    {error && <div role="alert" className="alpha-notice">{error}<button disabled={busy} onClick={()=>void load().then(()=>setError('')).catch(error=>setError(message(error)))}>Retry connection</button></div>}
    {pendingReview.current && error && <button disabled={busy} onClick={()=>{const f=findings.find(item=>item.id===pendingReview.current?.id);if(f)void review(f,pendingReview.current!.adopt);}}>Retry saving review</button>}
    <label className="alpha-check"><input type="checkbox" checked={showDismissed} onChange={event=>setShowDismissed(event.target.checked)}/>Show dismissed findings</label>
    <div className="research-findings">{findings.filter(finding=>showDismissed||finding.state!=='dismissed').map(finding=><article key={finding.id} className="research-finding"><p className="eyebrow">{finding.state==='provisional'?'Suggested · review':finding.state}</p><h3>{finding.candidate.details?.targetCandidateId?`Update ${decision.canonical_model.candidates.find(c=>c.id===finding.candidate.details?.targetCandidateId)?.label??finding.candidate.label}`:finding.candidate.label}</h3>{finding.candidate.details&&<ProductCard provisional imageClient={client} decisionId={decision.id} model={decision.canonical_model} candidate={{id:finding.id,label:finding.candidate.label,url:finding.candidate.url,attributes:{},provisional:true,evidence:finding.candidate.details,...(finding.candidate.price?{price:{...finding.candidate.price,observedAt:finding.created_at}}:{})}}/>}<p className="provisional-tag">{assessResearchPrice(finding.candidate.price,decision.canonical_model.context)==='fail' ? 'Above your stated budget — adjust your budget before adopting' : assessResearchPrice(finding.candidate.price,decision.canonical_model.context)==='pass' ? 'Researched price is within your budget · tax/shipping unverified' : 'Budget fit unknown · confirm price and currency'}</p><p>{finding.candidate.summary}</p><p>{finding.candidate.price?`${finding.candidate.price.currency} ${finding.candidate.price.amount} · researched price`:'Price could not be verified'} · {finding.candidate.availability}</p><ul>{finding.candidate.unknowns.map((value,index)=><li key={index}>{value}</li>)}</ul><ul className="research-sources">{finding.candidate.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul><small>Retrieved {new Date(finding.candidate.details?.offers[0]?.observedAt??finding.candidate.details?.facts[0]?.observedAt??finding.created_at).toLocaleDateString()} · Source-backed, not independently verified</small>{finding.state==='provisional'&&<div className="research-actions"><button disabled={busy||!!decision.archived_at||!!pendingReview.current||assessResearchPrice(finding.candidate.price,decision.canonical_model.context)==='fail'} onClick={()=>void review(finding,true)}>{finding.candidate.details?.targetCandidateId?'Use these product details':'Adopt contender'}</button><button disabled={busy||!!decision.archived_at||!!pendingReview.current} onClick={()=>void review(finding,false)}>Dismiss</button></div>}</article>)}</div>
    {running?.web_response && !findings.some(finding=>finding.job_id===running.id) && <details><summary>Sources found so far</summary><ul>{running.web_response.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul></details>}
  </section>;
}

export function PurchaseContext({decision,repository,onSaved}:{decision:SavedDecision;repository:DecisionRepository;onSaved:(value:SavedDecision)=>void}) {
  const [values,setValues]=useState<Record<string,string>>(()=>decision.canonical_model.context??{});
  const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');
  const pending=useRef<{actionId:string;revision:number;context:Record<string,string>}|null>(null);
  const dirty=useRef(false),revision=useRef(decision.revision);
  const [needsReview,setNeedsReview]=useState(false);
  useEffect(()=>{
    if(!dirty.current&&!pending.current){setValues(decision.canonical_model.context??{});revision.current=decision.revision;}
  },[decision.revision,decision.canonical_model.context]);
  async function save(event:FormEvent) {
    event.preventDefault();if(busy||needsReview)return;setBusy(true);setStatus('Saving purchase context…');
    pending.current??={actionId:crypto.randomUUID(),revision:revision.current,context:values};
    try {const action=pending.current;const next=await repository.saveContext(decision.id,{actionId:action.actionId,expectedRevision:action.revision,context:action.context});dirty.current=false;revision.current=next.revision;setValues(next.canonical_model.context??{});onSaved(next);pending.current=null;setStatus('Saved. Applied changes can trigger a research follow-up within your allowance.');}
    catch(error){if((error as {code?:string}).code==='40001'){try{onSaved(await repository.get(decision.id));pending.current=null;setNeedsReview(true);setStatus('The decision changed. Your context draft is preserved; review the latest evaluation before saving again.');}catch{setStatus('Could not reload the latest context. Your draft is preserved; retry when connected.');}}else {if((error as {code?:string}).code==='22023')pending.current=null;setStatus(message(error));}}
    finally{setBusy(false);}
  }
  return <section className="panel"><details><summary>Purchase context · budget, region & requirements</summary><form onSubmit={save} className="purchase-context"><p>Give research the context that matters. Leave anything you haven’t decided blank.</p><fieldset disabled={busy||!!pending.current||!!decision.archived_at}>{[['purpose','What will you use it for?'],['budget','Budget or price range'],['currency','Shopping currency'],['region','Shopping country / region'],['nonnegotiables','Nonnegotiables']].map(([key,label])=><label key={key}>{label}<input maxLength={1000} value={values[key]??''} onChange={event=>{dirty.current=true;setValues(current=>({...current,[key]:event.target.value}));}}/></label>)}</fieldset><button disabled={busy||needsReview||!!decision.archived_at}>{busy?'Saving…':pending.current?'Retry saving context':'Apply purchase context'}</button>{needsReview&&<button type="button" onClick={()=>{revision.current=decision.revision;setNeedsReview(false);setStatus('Latest decision reviewed. Your preserved context draft is ready to apply.');}}>Use latest revision for context draft</button>}<p role="status">{status}</p></form></details></section>;
}
