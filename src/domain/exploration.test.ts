import {describe,it,expect} from 'vitest';
import {evaluate,nextExercise,quantity,type Scenario} from './exploration';
import {findDominatedCandidates,type PurchaseDecisionModel} from './purchaseDecision';
export const model=():PurchaseDecisionModel=>({revision:0,goal:'Headphones',context:{purpose:'Commuting',budget:'400',currency:'USD',region:'US'},useCases:[],constraints:[],preferences:[],candidates:[{id:'a',label:'A',price:{amount:300,currency:'USD',observedAt:''},attributes:{},provisional:false},{id:'b',label:'B',price:{amount:450,currency:'USD',observedAt:''},attributes:{},provisional:false}]});
describe('canonical exploration evaluation',()=>{
  it('keeps a saved scenario isolated until applied, including explicit unknowns',()=>{
    const m=model();const scenario:Scenario={id:'s',label:'More room',budget:500,currency:'USD',prices:{},assumptions:{}};
    m.scenarios=[scenario];expect(evaluate(m).budget.map(x=>x.verdict)).toEqual(['pass','fail']);
    expect(evaluate(m,scenario).budget.map(x=>x.verdict)).toEqual(['pass','pass']);
    expect(m.context?.budget).toBe('400');expect(m.preferences).toHaveLength(0);
    m.activeScenarioId='s';expect(evaluate(m).assumed).toBe(true);
    expect(evaluate(m,{...scenario,budget:null}).budget[0].verdict).toBe('unknown');
    expect(evaluate(m,{...scenario,prices:{a:null}}).budget[0].price).toBeNull();
  });
  it('preserves ranking as ordinal evidence without deriving weights or a winner',()=>{
    const m=model();m.preferences=[{id:'rank',kind:'criteria-rank',provenance:'user-stated',payload:{orderedIds:['fit','price'],criteria:[{id:'price',label:'Price'},{id:'fit',label:'Comfort'}]}}];
    const result=evaluate(m);expect(result.priorities).toEqual(['Comfort','Price']);expect(result.agenda[0]).toContain('Comfort first');expect(result).not.toHaveProperty('weights');expect(result).not.toHaveProperty('winner');
  });
  it('requires known comparable units and strict improvement for dominance',()=>{
    const m=model();m.dimensions=[{id:'battery',label:'Battery',unit:'hours',direction:'higher'}];m.selectedAxes=['price','battery'];
    m.candidates[0].quantities={battery:{value:30,unit:'hours',provenance:'user-stated'}};
    expect(evaluate(m).dominated).toEqual([]);
    m.candidates[1].quantities={battery:{value:20,unit:'minutes',provenance:'user-stated'}};expect(evaluate(m).dominated).toEqual([]);
    m.candidates[1].quantities.battery.unit='hours';expect(evaluate(m).dominated).toEqual(['b']);
    m.candidates[1].price!.currency='EUR';expect(evaluate(m).budget[1].verdict).toBe('unknown');expect(evaluate(m).dominated).toEqual([]);
    expect(findDominatedCandidates(m.candidates,[{key:'price',direction:'lower'}])).toEqual([]);
    m.candidates[1].price={...m.candidates[0].price!};m.candidates[1].quantities.battery.value=30;expect(evaluate(m).dominated).toEqual([]);
  });
  it('does not reuse an assumed measurement after its unit changes',()=>{
    const m=model(),axis={id:'battery',label:'Battery',unit:'hours',direction:'higher' as const};
    const s:Scenario={id:'s',label:'s',budget:500,currency:'USD',prices:{},assumptions:{a:{battery:20}},dimensionUnits:{battery:'minutes'}};
    expect(quantity(m,m.candidates[0],axis,s)).toBeNull();
  });
  it('retains conflicting pairwise evidence, including cycles',()=>{
    const m=model();m.preferences=[['a','b'],['b','c'],['c','a']].map(([leftId,rightId],i)=>({id:String(i),kind:'pairwise',payload:{leftId,rightId,choice:'left'},provenance:'user-stated'}));
    expect(evaluate(m).contradictory).toBe(true);
    m.preferences[2].payload.choice='tie';expect(evaluate(m).contradictory).toBe(false);
  });
  it('asks only one useful question and stops after durable skips',()=>{
    const m=model();delete m.context!.purpose;expect(nextExercise(m).key).toBe('context:purpose');
    m.skippedExercises=['context:purpose','priorities','pair:a|b','scenario','map','reflection:future-self','reflection:devils-advocate'];expect(nextExercise(m).kind).toBe('review');
  });
  it('moves from priorities to a comparison and does not repeat an answered tie or uncertainty',()=>{
    const m=model();expect(nextExercise(m).kind).toBe('PriorityRanker');m.skippedExercises=['priorities'];expect(nextExercise(m).kind).toBe('PairwiseChoice');
    m.preferences=[{id:'p',kind:'pairwise',payload:{leftId:'a',rightId:'b',choice:'unsure'},provenance:'user-stated'}];expect(nextExercise(m).kind).toBe('WhatIfExplorer');
  });
});
