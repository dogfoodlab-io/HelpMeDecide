import { savedExperimentAnswers, experimentLearning } from './whatIf';
import type { PurchaseCandidate, PurchaseDecisionModel } from './purchaseDecision';
import { explicitBudgetMaximum } from './purchaseBudget';

export type ExerciseKind='PairwiseChoice'|'PriorityRanker'|'WhatIfExplorer'|'TradeoffMap';
import type { Criterion, Dimension, Scenario } from './exploration.generated';
export type { Criterion, Dimension, Quantity, Scenario, ExerciseCommand } from './exploration.generated';
export const defaultCriteria:Criterion[]=[{id:'price',label:'Price'},{id:'fit',label:'Fit for my use'},{id:'ownership',label:'Ownership experience'}];
export const criteriaFor=(model:PurchaseDecisionModel)=>model.criteria?.length?model.criteria:defaultCriteria;
export const dimensionsFor=(model:PurchaseDecisionModel):Dimension[]=>[{id:'price',label:'Price',unit:model.context?.currency?.trim().toUpperCase()??'',direction:'lower'},...(model.dimensions??[])];
export function quantity(model:PurchaseDecisionModel,candidate:PurchaseCandidate,axis:Dimension,scenario?:Scenario):number|null {
  if(axis.id==='price') {
    if(scenario && Object.hasOwn(scenario.prices,candidate.id)){const value=scenario.prices[candidate.id];return scenario.currency===axis.unit&&typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null;}
    return candidate.price?.currency===axis.unit && Number.isFinite(candidate.price.amount)&&candidate.price.amount>=0?candidate.price.amount:null;
  }
  if(scenario && Object.hasOwn(scenario.assumptions[candidate.id]??{},axis.id)){const value=scenario.assumptions[candidate.id][axis.id];return scenario.dimensionUnits?.[axis.id]===axis.unit&&typeof value==='number'&&Number.isFinite(value)?value:null;}
  const data=candidate.quantities?.[axis.id];
  return data && data.unit===axis.unit && data.value!==null && Number.isFinite(data.value)?data.value:null;
}
export function comparableAxes(model:PurchaseDecisionModel):string[] {
  const axes=dimensionsFor(model);
  for(let a=0;a<axes.length;a++)for(let b=a+1;b<axes.length;b++) {
    if(axes[a].unit&&axes[b].unit&&model.candidates.filter(candidate=>quantity(model,candidate,axes[a])!==null&&quantity(model,candidate,axes[b])!==null).length>=2)return [axes[a].id,axes[b].id];
  }
  return [];
}
export function evaluate(model:PurchaseDecisionModel,scenario?:Scenario,axisIds?:string[]) {
  const applied=scenario??model.scenarios?.find(item=>item.id===model.activeScenarioId);
  const maximum=applied?applied.budget:explicitBudgetMaximum(model.context?.budget);
  const currency=applied?.currency||model.context?.currency?.trim().toUpperCase()||'';
  const priceAxis:Dimension={id:'price',label:'Price',unit:currency,direction:'lower'};
  const budget=model.candidates.map(candidate=>{
    const price=quantity(model,candidate,priceAxis,applied);
    return {id:candidate.id,label:candidate.label,price,verdict:maximum===null||price===null||!currency?'unknown' as const:price<=maximum?'pass' as const:'fail' as const};
  });
  const axes=dimensionsFor(model).map(axis=>axis.id==='price'?{...axis,unit:currency}:axis).filter(axis=>(axisIds??model.selectedAxes??[]).includes(axis.id));
  const dominates=(a:PurchaseCandidate,b:PurchaseCandidate)=>{
    if(axes.length!==2 || !axes.every(axis=>!!axis.unit))return false;
    let strict=false;
    for(const axis of axes){const av=quantity(model,a,axis,applied),bv=quantity(model,b,axis,applied);if(av===null||bv===null||!Number.isFinite(av)||!Number.isFinite(bv))return false;if(axis.direction==='higher'?av<bv:av>bv)return false;if(av!==bv)strict=true;}
    return strict;
  };
  const dominated=model.candidates.filter(candidate=>model.candidates.some(other=>other.id!==candidate.id&&dominates(other,candidate))).map(candidate=>candidate.id);
  const edges=new Map<string,Set<string>>();
  for(const pref of model.preferences.filter(pref=>pref.kind==='pairwise'&&pref.provenance!=='superseded')) {
    const {leftId,rightId,choice}=pref.payload;if(choice!=='left'&&choice!=='right')continue;
    const winner=String(choice==='left'?leftId:rightId),loser=String(choice==='left'?rightId:leftId);
    edges.set(winner,new Set([...(edges.get(winner)??[]),loser]));
  }
  const reaches=(start:string,target:string,seen=new Set<string>()):boolean=>{
    if(seen.has(start))return false;seen.add(start);
    return [...(edges.get(start)??[])].some(next=>next===target||reaches(next,target,seen));
  };
  const contradictory=[...edges].some(([winner,losers])=>[...losers].some(loser=>reaches(loser,winner)));
  const ranking=[...model.preferences].reverse().find(pref=>pref.kind==='criteria-rank');
  const priorities=(ranking?.payload.orderedIds as string[]|undefined)?.map(id=>(ranking?.payload.criteria as Criterion[]|undefined)?.find(criterion=>criterion.id===id)?.label??criteriaFor(model).find(criterion=>criterion.id===id)?.label??id)??[];
  const agenda=[
    ...(priorities.length?[`Research ${priorities[0]} first. This priority order guides which evidence to collect.`]:['Clarify which criteria matter most.']),
    ...savedExperimentAnswers(model).map(answer=>experimentLearning(model,answer).nextCheck),
    ...budget.filter(item=>item.verdict==='unknown').map(item=>`Confirm a comparable ${currency||'local-currency'} price for ${item.label}.`),
    ...axes.flatMap(axis=>model.candidates.filter(candidate=>quantity(model,candidate,axis,applied)===null).map(candidate=>`Find ${axis.label} (${axis.unit||'unit not set'}) for ${candidate.label}.`)),
    ...(contradictory?['Preferences conflict. Revisit the tradeoff or try the products; do not force a single winner.']:[]),
  ];
  return {maximum,currency,budget,dominated,axes,contradictory,priorities,agenda,assumed:!!applied};
}
export type NextExercise={kind:ExerciseKind|'context'|'research'|'reflection'|'review';key:string;title:string;reason:string;pair?:[string,string];field?:string};
export function nextExercise(model:PurchaseDecisionModel):NextExercise {
  const skipped=new Set(model.skippedExercises??[]);
  for(const [field,title] of [['purpose','What will you use this for?'],['budget','What is your budget?'],['currency','Which currency are you shopping in?'],['region','Where are you shopping?']]) {
    if(!model.context?.[field]?.trim()&&!skipped.has(`context:${field}`))return {kind:'context',key:`context:${field}`,field,title,reason:'This keeps research relevant to your use and market.'};
  }
  if(model.candidates.length<2)return {kind:'research',key:'research',title:'Build a shortlist',reason:'Adopt at least two researched contenders, or add your own, before comparing.'};
  const ranked=model.preferences.some(pref=>pref.kind==='criteria-rank');
  if(!ranked&&!skipped.has('priorities'))return {kind:'PriorityRanker',key:'priorities',title:'Put what matters first',reason:'Put the most important thing first so we can focus the questions and research.'};
  const answered=new Set(model.preferences.filter(pref=>pref.kind==='pairwise').map(pref=>[String(pref.payload.leftId),String(pref.payload.rightId)].sort().join('|')));
  const pairs:Array<[string,string]>=[];for(let a=0;a<model.candidates.length;a++)for(let b=a+1;b<model.candidates.length;b++)pairs.push([model.candidates[a].id,model.candidates[b].id]);
  const pair=pairs.find(pair=>!answered.has([...pair].sort().join('|'))&&!skipped.has(`pair:${[...pair].sort().join('|')}`));
  if(pair&&answered.size<1)return {kind:'PairwiseChoice',key:`pair:${[...pair].sort().join('|')}`,pair,title:'Which would you rather own?',reason:'An appeal judgment helps separate personal preference from researched facts.'};
  if(!savedExperimentAnswers(model).length&&!skipped.has('scenario'))return {kind:'WhatIfExplorer',key:'scenario',title:'What could change your mind?',reason:'Choose a suggested situation to explore. We’ll show what your answer changes.'};
  if(!(model.selectedAxes?.length)&&comparableAxes(model).length===2&&!skipped.has('map'))return {kind:'TradeoffMap',key:'map',title:'Make the compromise visible',reason:'Compare two dimensions with known units. Missing measurements remain unknown.'};
  for(const perspective of ['future-self','devils-advocate'])if(!(perspective==='future-self'&&savedExperimentAnswers(model).some(answer=>['use','longevity'].includes(answer.mode)))&&!model.reflections?.some(item=>item.perspective===perspective)&&!skipped.has(`reflection:${perspective}`))return {kind:'reflection',key:`reflection:${perspective}`,field:perspective,title:perspective==='future-self'?'Imagine yourself six months from now':'What is the strongest reason to wait?',reason:perspective==='future-self'?'What would make you glad you chose it, and what might you regret?':'Name the downside, unnecessary purchase, or missing experience that could change your mind.'};
  return {kind:'review',key:'review',title:'You have enough to review the tradeoffs',reason:'No more automatic questions. Review the evaluation, investigate an unknown, or explicitly reopen an exercise.'};
}
