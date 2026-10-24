import type { SupabaseClient } from '@supabase/supabase-js';
import type { DecisionBrief } from '../domain/brief.generated';
import type { PurchaseDecisionModel } from '../domain/purchaseDecision';
export type Outcome='buy'|'wait'|'dont-buy'|'investigate-further';
export type FinalChoice={outcome:Outcome;candidateId:string|null;candidateLabel:string|null;briefId:string|null;note:string;recordedAt:string;basisHash:string};
export type OutcomePayload={outcome:Outcome|'reopen';candidateId:string|null;briefId:string|null;note:string};
export type BriefSnapshot={title:string;description:string;model:PurchaseDecisionModel;sources:Array<{id:string;url:string;title:string;retrieved_at:string}>};
export type SavedBrief={id:string;version:number;revision:number;basis_hash:string;brief:DecisionBrief;snapshot:BriefSnapshot;created_at:string};
export type BriefState={basisHash:string;enabled:boolean;dailyLimit:number;dailyUsed:number;briefs:SavedBrief[];jobs:Array<{id:string;actionId:string;revision:number;status:string;errorCode:string|null}>};
export interface BriefRepository {
  load(id:string):Promise<BriefState>;
  start(id:string,actionId:string,revision:number):Promise<void>;
  cancel(jobId:string):Promise<void>;
  choose(id:string,actionId:string,revision:number,payload:OutcomePayload):Promise<void>;
}
export function createBriefRepository(client:SupabaseClient):BriefRepository {
  return {
    async load(id){const {data,error}=await client.rpc('get_decision_brief_state',{p_decision_id:id});if(error)throw error;return data as BriefState;},
    async start(id,actionId,revision){
      const {error}=await client.functions.invoke('research-api',{body:{action:'brief',decisionId:id,actionId,revision}});
      if(error){const detail=await (error as unknown as {context?:Response}).context?.json().catch(()=>null);if(detail?.error)throw {message:detail.error,code:detail.code};throw error;}
    },
    async cancel(jobId){const {error}=await client.rpc('cancel_decision_brief',{p_job:jobId});if(error)throw error;},
    async choose(id,actionId,revision,payload){const {error}=await client.rpc('record_decision_outcome',{p_decision_id:id,p_action_id:actionId,p_revision:revision,p_payload:payload});if(error)throw error;},
  };
}
export const outcomeLabel:Record<Outcome,string>={buy:'Buy',wait:'Wait','dont-buy':'Don’t buy','investigate-further':'Investigate further'};
