import {expect,it} from 'vitest';
import {suggestedExperiments,experimentOptions,savedExperimentAnswers,experimentLearning} from './whatIf';
import {evaluate,nextExercise} from './exploration';
import type {PurchaseDecisionModel} from './purchaseDecision';
const model=():PurchaseDecisionModel=>({revision:0,goal:'Choose a watch',context:{purpose:'Everyday wear',budget:'600',currency:'USD',region:'UK'},useCases:[],constraints:[],preferences:[],candidates:[{id:'a',label:'Watch A',attributes:{},provisional:false},{id:'b',label:'Watch B',attributes:{},provisional:false},{id:'c',label:'Watch C',attributes:{},provisional:false}]});
it('offers non-budget situations grounded in all supplied contenders and the actual top priority',()=>{
  const m=model();m.preferences=[{id:'rank',kind:'criteria-rank',provenance:'user-stated',payload:{orderedIds:['comfort','price'],criteria:[{id:'comfort',label:'Comfort'},{id:'price',label:'Price'}]}}];
  const experiments=suggestedExperiments(m);expect(experiments).toHaveLength(3);expect(experiments.map(item=>item.mode)).toEqual(['use','availability','priority']);expect(experiments[0].question).toContain('Everyday wear');expect(experiments[2].question).toContain('Comfort');expect(experiments[2].why).toContain('actual priorities stay as stated');expect(experiments[0].candidateIds).toEqual(['a','b','c']);
});
it('tests the explicitly preferred contender as a hypothetical unavailable option and offers the other contenders',()=>{
  const m=model();m.preferences=[{id:'pref',kind:'pairwise',provenance:'user-stated',payload:{leftId:'a',rightId:'c',choice:'right'}}];
  const experiment=suggestedExperiments(m)[1];expect(experiment.question).toContain('Watch C is unavailable');expect(experiment.why).toContain('previously preferred Watch C');expect(experimentOptions(m,experiment).map(item=>item.id)).toEqual(['a','b','wait','alternatives','unsure']);
});
it('keeps only current conditional insights in the research agenda and avoids repeating a covered future-use question',()=>{
  const m=model();m.skippedExercises=['priorities','pair:a|b','pair:a|c','pair:b|c'];
  const experiment=suggestedExperiments(m)[0];
  const old={...experiment,whatIf:true as const,answer:'a',note:''},current={...experiment,whatIf:true as const,answer:'b',note:''};
  m.preferences=[{id:'old',kind:'judgment',provenance:'superseded',payload:old},{id:'current',kind:'judgment',provenance:'user-stated',payload:current}];
  expect(savedExperimentAnswers(m)).toEqual([current]);const result=evaluate(m);expect(result.agenda.some(item=>item.includes('Watch B'))).toBe(true);expect(result.agenda.some(item=>item.includes('about Watch A'))).toBe(false);expect(m.context?.budget).toBe('600');expect(nextExercise(m).key).toBe('reflection:devils-advocate');
});
it('preserves uncertainty and the need for experience instead of inferring a winner',()=>{
  const m=model(),experiment=suggestedExperiments(m)[0];
  const learning=experimentLearning(m,{...experiment,whatIf:true,answer:'unsure',note:''});expect(learning.insight).toContain('preserve that uncertainty');expect(learning.nextCheck).toContain('hands-on experience');expect(learning).not.toHaveProperty('winner');
});
