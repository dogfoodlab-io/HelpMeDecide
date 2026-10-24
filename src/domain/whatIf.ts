import type { PurchaseDecisionModel } from './purchaseDecision';
import type { WhatIfAnswer } from './exploration.generated';

export type Experiment = Omit<WhatIfAnswer, 'answer' | 'note' | 'whatIf'>;
const excerpt = (value:string,length=140)=>value.length>length?`${value.slice(0,length-1).trimEnd()}…`:value;

export function suggestedExperiments(model:PurchaseDecisionModel):Experiment[] {
  if(model.candidates.length<2)return [];
  const pair=[...model.preferences].reverse().find(item=>item.kind==='pairwise'&&item.provenance!=='superseded'&&['left','right'].includes(String(item.payload.choice)));
  const preferred=pair?String(pair.payload.choice==='left'?pair.payload.leftId:pair.payload.rightId):null;
  const first=model.candidates.find(item=>item.id===preferred)??model.candidates[0];
  const candidateIds=[first.id,...model.candidates.filter(item=>item.id!==first.id).map(item=>item.id)];
  const purpose=model.context?.purpose?.trim();
  const ranked=[...model.preferences].reverse().find(item=>item.kind==='criteria-rank'&&item.provenance!=='superseded');
  const topId=(ranked?.payload.orderedIds as string[]|undefined)?.[0];
  const top=(ranked?.payload.criteria as Array<{id:string;label:string}>|undefined)?.find(item=>item.id===topId)?.label??model.criteria?.find(item=>item.id===topId)?.label;
  const requirement=model.context?.nonnegotiables?.trim();
  const proposal=(mode:Experiment['mode'],key:string,title:string,question:string,why:string):Experiment=>({experimentId:`${mode}:${JSON.stringify([key,candidateIds])}`,mode,title,question,why,candidateIds});
  const frequent=/\b(daily|everyday|every day|commut\w*|workdays|most days|regular\w*)\b/i.test(purpose??'');
  const use=proposal('use',`${frequent?'less':'more'}:${purpose??'everyday'}`,frequent?'If you only used it occasionally':'If you used it every day',frequent?`Imagine using this only occasionally, instead of for ${excerpt(purpose!)}. Which option would still feel worth owning?`:purpose?`Imagine using this every day for ${excerpt(purpose)}, more often than expected. Which would you choose to live with?`:'Imagine using this every day. Which option would feel easiest to live with?',purpose?`You said this purchase is for ${excerpt(purpose)}. This checks how ${frequent?'less':'more'} frequent use could change your choice.`:'This checks how frequent use could change which option feels right.');
  const availability=proposal('availability',first.id,`If ${excerpt(first.label,70)} were unavailable`,`Imagine ${first.label} is unavailable. Would you choose another option, wait for it, or keep looking?`,preferred===first.id?`You previously preferred ${first.label}. This tests whether another option would be an acceptable substitute.`:'This tests whether another option is an acceptable substitute. Unavailability is hypothetical; this is not a stock report.');
  const third=top
    ?proposal('priority',top,`If ${excerpt(top,70)} mattered less`,`Imagine “${top}” mattered less for this purchase. Which option would you choose?`,`You ranked “${top}” first. This checks how much your choice depends on it; your actual priorities stay as stated.`)
    :requirement
    ?proposal('requirement',requirement,'If you had to accept a compromise',`Imagine compromising on “${excerpt(requirement)}”. Would any contender still feel acceptable?`,`You listed this as a requirement. This tests your boundary; it does not relax the real requirement.`)
    :proposal('longevity','long-term','Living with the choice for years','Imagine keeping this purchase for several years. Which option would you feel comfortable keeping?','This checks how your initial preference holds up when you picture longer ownership.');
  return [use,availability,third];
}

export function experimentOptions(model:PurchaseDecisionModel,experiment:Experiment) {
  const choices=experiment.candidateIds.filter(id=>experiment.mode!=='availability'||id!==experiment.candidateIds[0]).map(id=>({id,label:model.candidates.find(candidate=>candidate.id===id)?.label??'Removed contender'}));
  return [...choices,...(experiment.mode==='availability'?[{id:'wait',label:`Wait for ${model.candidates.find(item=>item.id===experiment.candidateIds[0])?.label??'that option'}`},{id:'alternatives',label:'Keep looking for alternatives'}]:[{id:'tie',label:'These feel equally good'},{id:'neither',label:'None of these feels right'}]),{id:'unsure',label:'I’m not sure yet'}];
}

export function experimentLearning(model:PurchaseDecisionModel,answer:WhatIfAnswer):{insight:string;nextCheck:string} {
  const candidate=model.candidates.find(item=>item.id===answer.answer)?.label;
  if(candidate)return {insight:`Under this condition, you would choose ${candidate}. This is a preference for this situation, rather than a final purchase decision.`,nextCheck:`Check evidence about ${candidate} against this question: ${answer.question}`};
  if(answer.candidateIds.includes(answer.answer))return {insight:'The contender you selected has since left the board. Review the current options before relying on this insight.',nextCheck:`Revisit the saved question against the current shortlist: ${answer.question}`};
  if(answer.answer==='wait')return {insight:'You would rather wait than substitute another contender in this situation.',nextCheck:`Check availability and your acceptable waiting time for ${model.candidates.find(item=>item.id===answer.candidateIds[0])?.label??'the unavailable option'}.`};
  if(['neither','alternatives'].includes(answer.answer))return {insight:'Your current shortlist would not settle this situation. Looking for alternatives is worthwhile.',nextCheck:`Look for alternatives that address this concern: ${answer.question}`};
  if(answer.answer==='tie')return {insight:'This situation does not separate the options for you. It does not establish one overall winner.',nextCheck:'Focus on a different unresolved tradeoff before adding more questions about this one.'};
  return {insight:'You are unsure in this situation. We will preserve that uncertainty rather than invent a preference.',nextCheck:`Find the missing evidence or hands-on experience needed to answer: ${answer.question}`};
}

export function savedExperimentAnswers(model:PurchaseDecisionModel):WhatIfAnswer[] {
  return model.preferences.filter(item=>item.kind==='judgment'&&item.provenance!=='superseded'&&item.payload.whatIf===true&&typeof item.payload.experimentId==='string'&&typeof item.payload.question==='string'&&typeof item.payload.answer==='string'&&Array.isArray(item.payload.candidateIds)).map(item=>item.payload as unknown as WhatIfAnswer);
}
