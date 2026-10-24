import {useState} from 'react';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {createDecisionProcessor,DecisionSurface,exerciseMessages,validateExerciseMessages} from './DecisionCatalog';
import {DecisionEvaluation} from './AdaptiveExplorer';
import {describePreference} from '../services/decisions';
import {PurchaseContext} from './ResearchPanel';
import type {DecisionRepository,SavedDecision} from '../services/decisions';
import type {ExerciseKind} from '../domain/exploration';
import type {PurchaseDecisionModel} from '../domain/purchaseDecision';
const model=():PurchaseDecisionModel=>({revision:0,goal:'Headphones',context:{purpose:'Commuting',budget:'400',currency:'USD',region:'US'},useCases:[],constraints:[],preferences:[],candidates:[{id:'a',label:'A',price:{amount:300,currency:'USD',observedAt:''},attributes:{},provisional:false},{id:'b',label:'B',price:{amount:450,currency:'USD',observedAt:''},attributes:{},provisional:false}]});
afterEach(cleanup);
function Harness({kind,onAction=vi.fn(),revision=0}:{kind:ExerciseKind;onAction?:ReturnType<typeof vi.fn>;revision?:number}) {
  const [draft,setDraft]=useState({});return <DecisionSurface kind={kind} exerciseKey="stable" scope={{model:{...model(),revision},draft,change:values=>setDraft(current=>({...current,...values})),disabled:false}} onAction={onAction}/>;
}
it('registers all four custom widgets and enforces catalog, references, properties and action membership',async()=>{
  for(const kind of ['PairwiseChoice','PriorityRanker','WhatIfExplorer','TradeoffMap'] as ExerciseKind[]) {
    const action=vi.fn(),{processor}=createDecisionProcessor(kind,'key',action);
    const surface=processor.model.surfacesMap.get('decision-exercise');expect(surface?.componentsModel.get('root')?.type).toBe(kind);
    await surface?.dispatchAction({event:{name:'decision-action',context:{type:'delete-account',payload:{}}}},'root');expect(action).not.toHaveBeenCalled();processor.dispose();
  }
  const invalid=exerciseMessages('PriorityRanker','key');invalid[1].updateComponents!.components[0].component='Unknown';expect(()=>validateExerciseMessages(invalid,'PriorityRanker','key')).toThrow();
});
it('retries invalid generation once and then renders the predefined safe surface',()=>{
  const generate=vi.fn(()=>[{createSurface:{catalogId:'untrusted'}}]);const result=createDecisionProcessor('PriorityRanker','key',vi.fn(),generate);
  expect(generate).toHaveBeenCalledTimes(2);expect(result.fallback).toBe(true);expect(result.processor.model.surfacesMap.size).toBe(1);result.processor.dispose();
});
it('saves a tie from pairwise without inventing a stronger preference',async()=>{
  const action=vi.fn();render(<Harness kind="PairwiseChoice" onAction={action}/>);fireEvent.click(await screen.findByText('I like them equally'));fireEvent.click(screen.getByText('Save preference'));await waitFor(()=>expect(action).toHaveBeenCalledWith('pairwise',{leftId:'a',rightId:'b',choice:'tie'}));
});
it('supports keyboard and drag ranking, with explicit ordinal submission',async()=>{
  const action=vi.fn();render(<Harness kind="PriorityRanker" onAction={action}/>);
  fireEvent.keyDown(await screen.findByRole('listitem',{name:'Fit for my use, position 2'}),{altKey:true,key:'ArrowUp'});
  expect(screen.getByLabelText('Criterion 1')).toHaveValue('Fit for my use');
  fireEvent.dragStart(screen.getByRole('listitem',{name:'Ownership experience, position 3'}));fireEvent.dragOver(screen.getByRole('listitem',{name:'Fit for my use, position 1'}));fireEvent.drop(screen.getByRole('listitem',{name:'Fit for my use, position 1'}));
  fireEvent.click(screen.getByText('Apply ranking'));await waitFor(()=>expect(action).toHaveBeenCalledWith('rank',expect.objectContaining({orderedIds:['ownership','fit','price']})));
});
it('keeps slider calculations local and preserves its draft through a model update',async()=>{
  const action=vi.fn(),view=render(<Harness kind="WhatIfExplorer" onAction={action}/>);
  fireEvent.click(await screen.findByText('Try a price, budget or measurement change'));
  fireEvent.change(await screen.findByLabelText('Adjust preview budget'),{target:{value:'500'}});expect(action).not.toHaveBeenCalled();expect(screen.getByLabelText('Preview budget')).toHaveValue(500);
  view.rerender(<Harness kind="WhatIfExplorer" onAction={action} revision={1}/>);expect(screen.getByLabelText('Preview budget')).toHaveValue(500);
  fireEvent.click(screen.getByText('Save scenario only'));await waitFor(()=>expect(action).toHaveBeenCalledWith('save-scenario',expect.objectContaining({scenario:expect.objectContaining({budget:500})})));
});
it('requires units and two axes and saves unknown measurements explicitly',async()=>{
  const action=vi.fn();render(<Harness kind="TradeoffMap" onAction={action}/>);
  expect(await screen.findByText('Explore a suggested tradeoff')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Add my own measurements'));
  expect(await screen.findByText('Save map and judgment')).toBeDisabled();fireEvent.change(screen.getByLabelText('Dimension name'),{target:{value:'Battery life'}});fireEvent.change(screen.getByLabelText('Unit'),{target:{value:'hours'}});fireEvent.click(screen.getByText('Add dimension'));
  fireEvent.change(screen.getByLabelText('A Battery life'),{target:{value:'30'}});fireEvent.change(screen.getByLabelText('B Battery life'),{target:{value:'20'}});
  expect(screen.getByText(/B is dominated/)).toBeInTheDocument();fireEvent.change(screen.getByLabelText('B Battery life'),{target:{value:''}});expect(screen.getByText(/No dominance established/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Save map and judgment'));await waitFor(()=>expect(action).toHaveBeenCalledWith('map',expect.objectContaining({quantities:expect.arrayContaining([expect.objectContaining({candidateId:'b',value:null})])})));
});

it('updates pristine purchase context after applying a scenario and keeps an edited context draft pinned to its earlier revision',async()=>{
  let saved:SavedDecision={id:'d',title:'Headphones',description:'',revision:0,canonical_model:model(),updated_at:'',archived_at:null};
  const repository={saveContext:vi.fn(async()=>{throw {code:'40001'};}),get:vi.fn(async()=>saved)} as unknown as DecisionRepository;
  const view=render(<PurchaseContext decision={saved} repository={repository} onSaved={vi.fn()}/>);
  saved={...saved,revision:1,canonical_model:{...saved.canonical_model,context:{...saved.canonical_model.context,budget:'500'}}};
  view.rerender(<PurchaseContext decision={saved} repository={repository} onSaved={vi.fn()}/>);expect(screen.getByLabelText('Budget or price range')).toHaveValue('500');
  fireEvent.change(screen.getByLabelText('Budget or price range'),{target:{value:'600'}});
  saved={...saved,revision:2,canonical_model:{...saved.canonical_model,context:{...saved.canonical_model.context,budget:'700'}}};
  view.rerender(<PurchaseContext decision={saved} repository={repository} onSaved={vi.fn()}/>);expect(screen.getByLabelText('Budget or price range')).toHaveValue('600');
  fireEvent.submit(screen.getByText('Apply purchase context').closest('form')!);
  await waitFor(()=>expect(repository.saveContext).toHaveBeenCalledWith('d',expect.objectContaining({expectedRevision:1,context:expect.objectContaining({budget:'600'})})));
  expect(await screen.findByText(/Your context draft is preserved/)).toBeInTheDocument();expect(screen.getByLabelText('Budget or price range')).toHaveValue('600');
});

it('restores a saved contender rank when reopening the ranker',async()=>{
  const m=model();m.preferences=[{id:'rank',kind:'candidate-rank',payload:{orderedIds:['b','a'],mode:'candidates'},provenance:'user-stated'}];
  render(<DecisionSurface kind="PriorityRanker" exerciseKey="resume-rank" scope={{model:m,draft:{mode:'candidates'},change:vi.fn(),disabled:false}} onAction={vi.fn()}/>);
  expect(await screen.findByRole('listitem',{name:'B, position 1'})).toBeInTheDocument();
});

it('names the actual budget and price experiment, preserves a custom title, and submits the descriptive title',async()=>{
  const action=vi.fn();render(<Harness kind="WhatIfExplorer" onAction={action}/>);
  fireEvent.click(await screen.findByText('Try a price, budget or measurement change'));
  expect(await screen.findByLabelText('Scenario name')).toHaveValue('Budget up to $400');
  fireEvent.change(screen.getByLabelText('Preview budget'),{target:{value:'500'}});
  expect(screen.getByLabelText('Scenario name')).toHaveValue('Raise budget from $400 to $500');
  fireEvent.change(screen.getByLabelText('B · assumed price'),{target:{value:'350'}});
  expect(screen.getByLabelText('Scenario name')).toHaveValue('Raise budget from $400 to $500 · $350 for B');
  fireEvent.change(screen.getByLabelText('Scenario name'),{target:{value:'Wait for a sale'}});
  fireEvent.change(screen.getByLabelText('Preview budget'),{target:{value:'550'}});
  expect(screen.getByLabelText('Scenario name')).toHaveValue('Wait for a sale');
  fireEvent.click(screen.getByText('Save scenario only'));
  await waitFor(()=>expect(action).toHaveBeenCalledWith('save-scenario',expect.objectContaining({scenario:expect.objectContaining({label:'Wait for a sale',budget:550})})));
  fireEvent.click(screen.getByText('Use suggested name'));
  fireEvent.click(screen.getByText('Save scenario only'));
  await waitFor(()=>expect(action).toHaveBeenLastCalledWith('save-scenario',expect.objectContaining({scenario:expect.objectContaining({label:'Raise budget from $400 to $550 · $350 for B'})})));
});

it('explains legacy numbered scenarios consistently in saved cards, the active evaluation and decision history',async()=>{
  const m=model();m.context!.budget='750';m.dimensions=[{id:'battery',label:'Battery life',unit:'hours',direction:'higher'}];
  const legacy={id:'legacy',label:'Scenario 2',budget:500,currency:'USD',prices:{b:350},assumptions:{a:{battery:30}},dimensionUnits:{battery:'hours'}};
  m.scenarios=[legacy];m.activeScenarioId='legacy';
  const decision:SavedDecision={id:'d',title:'Headphones',description:'',revision:1,canonical_model:m,updated_at:'',archived_at:null};
  render(<><DecisionSurface kind="WhatIfExplorer" exerciseKey="saved-scenarios" scope={{model:m,draft:{whatIfView:'numbers'},change:vi.fn(),disabled:false}} onAction={vi.fn()}/><DecisionEvaluation decision={decision}/></>);
  const name='Budget up to $500 · $350 for B · Battery life: 30 hours for A';
  expect(await screen.findByRole('button',{name:`Apply ${name}`})).toBeDisabled();
  expect(screen.getByText('Battery life: 30 hours for A',{exact:true})).toBeInTheDocument();
  expect(screen.getByText(`Applied scenario: ${name}`,{exact:false})).toBeInTheDocument();
  expect(screen.queryByText('Scenario 2',{exact:false})).not.toBeInTheDocument();
  expect(describePreference({id:'p',kind:'scenario',payload:{scenarioId:'legacy'},provenance:'user-stated'},m)).toContain(name);
  expect(legacy.label).toBe('Scenario 2');
});

it('offers contextual experiments by default and turns a choice into an explained conditional insight',async()=>{
  const action=vi.fn();render(<Harness kind="WhatIfExplorer" onAction={action}/>);
  expect(await screen.findByText('If you only used it occasionally')).toBeInTheDocument();
  expect(screen.getAllByText(/for Commuting/)).toHaveLength(2);
  expect(screen.queryByLabelText('Scenario name')).not.toBeInTheDocument();
  expect(screen.getAllByText('Try this experiment')).toHaveLength(3);
  fireEvent.click(screen.getAllByText('Try this experiment')[0]);
  fireEvent.click(screen.getByRole('button',{name:'A',exact:true}));
  expect(screen.getByText(/Under this condition, you would choose A/)).toBeInTheDocument();
  expect(action).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Save this insight'));
  await waitFor(()=>expect(action).toHaveBeenCalledWith('answer-what-if',expect.objectContaining({mode:'use',answer:'a',whatIf:true,candidateIds:['a','b'],question:expect.stringContaining('Commuting')})));
});

it('lets the user wait or look elsewhere in an unavailable-option experiment without inventing stock facts',async()=>{
  const action=vi.fn();render(<Harness kind="WhatIfExplorer" onAction={action}/>);
  fireEvent.click((await screen.findAllByText('Try this experiment'))[1]);
  expect(screen.queryByRole('button',{name:'A',exact:true})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Wait for A',exact:true}));
  expect(screen.getByText(/You would rather wait/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Save this insight'));await waitFor(()=>expect(action).toHaveBeenCalledWith('answer-what-if',expect.objectContaining({mode:'availability',answer:'wait'})));
});

it('keeps creating a custom question optional and gives it the same guided response flow',async()=>{
  const action=vi.fn();render(<Harness kind="WhatIfExplorer" onAction={action}/>);
  expect(screen.queryByLabelText('Your hypothetical situation')).not.toBeInTheDocument();
  fireEvent.click(await screen.findByText('Create my own what-if'));
  fireEvent.change(screen.getByLabelText('Your hypothetical situation'),{target:{value:'What if I mostly used these on flights?'}});
  fireEvent.click(screen.getByText('Explore this question'));fireEvent.click(screen.getByRole('button',{name:'B',exact:true}));
  fireEvent.click(screen.getByText('Save this insight'));await waitFor(()=>expect(action).toHaveBeenCalledWith('answer-what-if',expect.objectContaining({mode:'custom',answer:'b',question:'What if I mostly used these on flights?'})));
});
