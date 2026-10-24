import { GuidedWhatIf } from './GuidedWhatIf';
import { scenarioName, scenarioDetails, suggestedScenarioName } from '../domain/scenarioNames';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { A2uiSurface, createComponentImplementation, type ReactCatalogComponent } from '@a2ui/react/v0_9';
import { Catalog, MessageProcessor, type ComponentContext } from '@a2ui/web_core/v0_9';
import { z } from 'zod';
import { criteriaFor, dimensionsFor, evaluate, quantity, comparableAxes, type Criterion, type Dimension, type ExerciseKind, type Scenario } from '../domain/exploration';
import type { PurchaseDecisionModel } from '../domain/purchaseDecision';
type Draft=Record<string,any>;
type Scope={model:PurchaseDecisionModel;draft:Draft;change:(values:Draft)=>void;pair?:[string,string];disabled:boolean};
const ExerciseScope=createContext<Scope|null>(null);
const useExercise=()=>{const value=useContext(ExerciseScope);if(!value)throw new Error('Decision exercise context is missing');return value;};
const dispatch=(context:ComponentContext,type:string,payload:Record<string,unknown>)=>void context.dispatchAction({event:{name:'decision-action',context:{type,payload}}});
const number=(value:string)=>value.trim()===''||!Number.isFinite(Number(value))?null:Number(value);

function Pairwise({context}:{context:ComponentContext}) {
  const {model,draft,change,pair,disabled}=useExercise();
  const ids=draft.pair??pair??[model.candidates[0]?.id,model.candidates[1]?.id];
  const left=model.candidates.find(item=>item.id===ids[0]),right=model.candidates.find(item=>item.id===ids[1]);
  if(!left||!right)return <p>Add or adopt two contenders to compare.</p>;
  return <div className="decision-widget"><div className="alpha-pair-select">{[0,1].map(index=><label key={index}>{index?'Second contender':'First contender'}<select value={ids[index]} disabled={disabled} onChange={event=>change({pair:ids.map((id:string,i:number)=>i===index?event.target.value:id),choice:null})}>{model.candidates.map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}</select></label>)}</div>
    <div className="pairwise-options">{[['left',`I prefer this one · ${left.label}`],['right',`I prefer that one · ${right.label}`],['tie','I like them equally'],['neither','Neither feels right'],['unsure',"I'm not sure yet"]].map(([value,label])=><button type="button" disabled={disabled||left.id===right.id} aria-pressed={draft.choice===value} key={value} onClick={()=>change({choice:value})}>{label}</button>)}</div>
    <button type="button" className="composer-submit" disabled={disabled||!draft.choice||left.id===right.id} onClick={()=>dispatch(context,'pairwise',{leftId:left.id,rightId:right.id,choice:draft.choice})}>Save preference</button>
  </div>;
}

function Ranker({context}:{context:ComponentContext}) {
  const {model,draft,change,disabled}=useExercise();const mode=draft.mode??'criteria';
  const candidateItems=model.candidates.map(({id,label})=>({id,label}));
  const savedOrder=[...model.preferences].reverse().find(item=>item.kind==='candidate-rank')?.payload.orderedIds as string[]|undefined;
  const orderedCandidates=savedOrder?[...savedOrder.flatMap(id=>candidateItems.filter(item=>item.id===id)),...candidateItems.filter(item=>!savedOrder.includes(item.id))]:candidateItems;
  const base:Criterion[]=mode==='criteria'?criteriaFor(model):orderedCandidates;
  const items:Criterion[]=draft.items??base;
  const dragged=useRef<number|null>(null);
  function move(from:number,to:number){if(to<0||to>=items.length||disabled)return;const next=[...items];const[item]=next.splice(from,1);next.splice(to,0,item);change({items:next,announcement:`${item.label} moved to position ${to+1}`});}
  return <div className="decision-widget"><label>What to rank<select value={mode} disabled={disabled} onChange={event=>change({mode:event.target.value,items:undefined})}><option value="criteria">Criteria</option><option value="candidates">Contenders</option></select></label><p>Drag to reorder, use the arrow buttons, or press Alt + ↑ / ↓ on a row. Put the most important thing first. We’ll use this to focus the questions and evidence.</p>
    <ol className="priority-list">{items.map((item,index)=><li key={item.id} draggable={!disabled} tabIndex={0} aria-label={`${item.label}, position ${index+1}`} onDragStart={()=>{dragged.current=index;}} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();if(dragged.current!==null)move(dragged.current,index);dragged.current=null;}} onKeyDown={event=>{if(event.altKey&&(event.key==='ArrowUp'||event.key==='ArrowDown')){event.preventDefault();move(index,index+(event.key==='ArrowUp'?-1:1));}}}>
      <span className="rank-number">{index+1}</span>{mode==='criteria'?<input aria-label={`Criterion ${index+1}`} value={item.label} maxLength={100} disabled={disabled} onChange={event=>change({items:items.map((current,i)=>i===index?{...current,label:event.target.value}:current)})}/>:<span>{item.label}</span>}
      <button type="button" disabled={disabled||index===0} aria-label={`Move ${item.label} up`} onClick={()=>move(index,index-1)}>↑</button><button type="button" disabled={disabled||index===items.length-1} aria-label={`Move ${item.label} down`} onClick={()=>move(index,index+1)}>↓</button>
      {mode==='criteria'&&<button type="button" disabled={disabled||items.length<=2} aria-label={`Remove ${item.label}`} onClick={()=>change({items:items.filter(current=>current.id!==item.id)})}>×</button>}
    </li>)}</ol>
    <p aria-live="polite">{draft.announcement??''}</p>{mode==='criteria'&&<button type="button" disabled={disabled||items.length>=8} onClick={()=>change({items:[...items,{id:crypto.randomUUID(),label:'New criterion'}]})}>+ Add criterion</button>}
    <button type="button" className="composer-submit" disabled={disabled||items.length<2||items.some(item=>!item.label.trim())} onClick={()=>dispatch(context,'rank',{mode,orderedIds:items.map(item=>item.id),...(mode==='criteria'?{criteria:items}:{})})}>Apply ranking</button>
  </div>;
}

function WhatIf({context}:{context:ComponentContext}) {
  const scope=useExercise();
  if(scope.draft.whatIfView==='numbers')return <div><button type="button" disabled={scope.disabled} onClick={()=>scope.change({whatIfView:'suggestions'})}>← Suggested experiments</button><NumericWhatIf context={context}/></div>;
  return <GuidedWhatIf scope={scope} onAnswer={payload=>dispatch(context,'answer-what-if',payload)} onNumbers={()=>scope.change({whatIfView:'numbers'})} onContinue={()=>dispatch(context,'continue-guide',{})}/>;
}

function NumericWhatIf({context}:{context:ComponentContext}) {
  const {model,draft,change,disabled}=useExercise();const baseline=evaluate({...model,activeScenarioId:undefined});
  const budget=draft.budget===undefined?baseline.maximum:draft.budget;const currency=draft.currency??baseline.currency;
  const scenario:Scenario={id:'preview',label:'',budget,currency,prices:draft.prices??{},assumptions:draft.assumptions??{},dimensionUnits:Object.fromEntries((model.dimensions??[]).map(axis=>[axis.id,axis.unit]))};
  const suggestedName=suggestedScenarioName(model,scenario);
  scenario.label=draft.label??suggestedName;
  const preview=evaluate(model,scenario);
  const upper=Math.max(1000,(baseline.maximum??0)*2,...model.candidates.map(candidate=>(candidate.price?.amount??0)*1.5));
  return <div className="decision-widget"><p className="scenario-label">Preview only · local calculations</p><label>Scenario name<input maxLength={100} value={scenario.label} disabled={disabled} onChange={event=>change({label:event.target.value})}/></label><p className="muted">The suggested name describes your changes. You can give it your own name.</p>{draft.label!==undefined&&<button type="button" disabled={disabled} onClick={()=>change({label:undefined})}>Use suggested name</button>}<label>Scenario currency<input maxLength={3} placeholder="e.g. USD" value={currency} disabled={disabled} onChange={event=>change({currency:event.target.value.toUpperCase()})}/></label>
    <label>Preview budget<input type="number" min="1" value={budget??''} disabled={disabled} onChange={event=>change({budget:number(event.target.value)})}/></label><input aria-label="Adjust preview budget" type="range" min="10" max={Math.ceil(upper)} step="10" value={budget??10} disabled={disabled} onChange={event=>change({budget:Number(event.target.value)})}/><output>{budget===null?'Budget unknown':`${currency||'Choose currency'} ${budget}`}</output>
    <details><summary>Preview product prices or a price premium</summary>{model.candidates.map(candidate=><label key={candidate.id}>{candidate.label} · assumed price<input type="number" min="0" placeholder="Unknown" value={Object.hasOwn(scenario.prices,candidate.id)?scenario.prices[candidate.id]??'':candidate.price?.currency===currency?candidate.price?.amount??'':''} disabled={disabled} onChange={event=>change({prices:{...scenario.prices,[candidate.id]:number(event.target.value)}})}/></label>)}</details>
    {!!model.dimensions?.length&&<details><summary>Preview uncertain assumptions</summary>{model.candidates.flatMap(candidate=>(model.dimensions??[]).map(axis=><label key={`${candidate.id}-${axis.id}`}>{candidate.label} · {axis.label} ({axis.unit})<input type="number" step="any" placeholder="Unknown" disabled={disabled} value={Object.hasOwn(scenario.assumptions[candidate.id]??{},axis.id)?scenario.assumptions[candidate.id][axis.id]??'':quantity(model,candidate,axis)??''} onChange={event=>change({assumptions:{...scenario.assumptions,[candidate.id]:{...scenario.assumptions[candidate.id],[axis.id]:number(event.target.value)}}})}/></label>))}</details>}
    <table className="evaluation-table"><caption>Baseline versus this preview · quoted prices before tax and shipping</caption><thead><tr><th>Contender</th><th>Baseline budget fit</th><th>Preview budget fit</th></tr></thead><tbody>{preview.budget.map((item,index)=><tr key={item.id}><th>{item.label}</th><td>{baseline.budget[index].verdict}</td><td>{item.verdict}</td></tr>)}</tbody></table>
    <button type="button" className="composer-submit" disabled={disabled||!scenario.label.trim()||((budget!==null||Object.values(scenario.prices).some(value=>value!==null))&&!/^[A-Z]{3}$/.test(currency))} onClick={()=>dispatch(context,'save-scenario',{scenario:{...scenario,id:crypto.randomUUID()}})}>Save scenario only</button><p className="muted">Saving adds no preference and starts no research. Apply a saved scenario to make its budget an explicit preference; assumed measurements remain assumptions.</p>
    {model.activeScenarioId&&<button type="button" disabled={disabled} onClick={()=>dispatch(context,'clear-scenario',{})}>Stop using scenario assumptions</button>}
    {!!model.scenarios?.length&&<div className="saved-scenarios"><h3>Saved scenarios</h3>{model.scenarios.map(saved=>{const name=scenarioName(model,saved);return <div key={saved.id}><div className="saved-scenario-description"><strong>{name}</strong>{model.activeScenarioId===saved.id&&<span> · applied</span>}<ul>{scenarioDetails(model,saved).map((detail,index)=><li key={index}>{detail}</li>)}</ul></div><button type="button" disabled={disabled||model.activeScenarioId===saved.id} onClick={()=>dispatch(context,'apply-scenario',{scenarioId:saved.id})}>Apply {name}</button></div>;})}</div>}
  </div>;
}

function Tradeoff({context}:{context:ComponentContext}) {
  const {model,draft,change,disabled}=useExercise();
  if(comparableAxes(model).length===2||draft.mapEditor)return <TradeoffEditor context={context}/>;
  return <div className="guided-map-empty"><h3>Start with the tradeoff, then the measurements</h3><p>There aren’t comparable measurements for these contenders yet. We can first explore which compromise you would accept, using questions about the options already on your board.</p><button type="button" className="composer-submit" disabled={disabled} onClick={()=>dispatch(context,'open-what-if',{})}>Explore a suggested tradeoff</button><details><summary>I have measurements to add</summary><p>If you already know comparable values, you can add them and build your own map.</p><button type="button" disabled={disabled} onClick={()=>change({mapEditor:true})}>Add my own measurements</button></details></div>;
}

function TradeoffEditor({context}:{context:ComponentContext}) {
  const {model,draft,change,disabled}=useExercise();const dimensions:Dimension[]=draft.dimensions??model.dimensions??[];
  const axes:string[]=draft.axes??model.selectedAxes??(comparableAxes(model).length===2?comparableAxes(model):['price',dimensions[0]?.id??'']);
  const virtual:PurchaseDecisionModel={...model,activeScenarioId:undefined,dimensions,selectedAxes:axes,candidates:model.candidates.map(candidate=>({...candidate,quantities:{...candidate.quantities,...Object.fromEntries(dimensions.filter(axis=>Object.hasOwn(draft.quantities?.[candidate.id]??{},axis.id)).map(axis=>[axis.id,{value:draft.quantities[candidate.id][axis.id],unit:axis.unit,provenance:'user-stated' as const}]))},...(draft.prices?.[candidate.id]!==undefined&&draft.prices[candidate.id]!==null&&/^[A-Z]{3}$/.test(model.context?.currency??'')?{price:{amount:draft.prices[candidate.id],currency:model.context!.currency,observedAt:new Date().toISOString()}}:{})}))};
  const options=dimensionsFor(virtual);const selected=axes.map(id=>options.find(axis=>axis.id===id));const assessment=evaluate(virtual,undefined,axes);
  const points=virtual.candidates.map(candidate=>({candidate,x:selected[0]?quantity(virtual,candidate,selected[0]):null,y:selected[1]?quantity(virtual,candidate,selected[1]):null}));
  const known=points.filter(point=>point.x!==null&&point.y!==null);
  const extent=(key:'x'|'y')=>{const values=known.map(point=>point[key]!);const min=Math.min(...values),max=Math.max(...values);return {min,max,range:max-min||1};};const xExtent=extent('x'),yExtent=extent('y');
  function addDimension(){const dimension:Dimension={id:crypto.randomUUID(),label:draft.newLabel??'',unit:draft.newUnit??'',direction:draft.newDirection??'higher'};change({dimensions:[...dimensions,dimension],axes:[axes[0]||'price',dimension.id],newLabel:'',newUnit:''});}
  return <div className="decision-widget"><p>Map your product facts and entered measurements. Use the same units for both contenders. Scenario assumptions stay in What if and the evaluation panel.</p><div className="alpha-pair-select">{[0,1].map(index=><label key={index}>{index?'Vertical axis':'Horizontal axis'}<select disabled={disabled} value={axes[index]??''} onChange={event=>change({axes:axes.map((id,i)=>i===index?event.target.value:id)})}><option value="">Choose a dimension</option>{options.map(axis=><option key={axis.id} value={axis.id}>{axis.label} ({axis.unit||'currency unknown'}) · {axis.direction} is better</option>)}</select></label>)}</div>
    {dimensions.length<5&&<details open={!dimensions.length}><summary>Add a measurable dimension</summary><div className="dimension-editor"><label>Dimension name<input value={draft.newLabel??''} disabled={disabled} maxLength={80} placeholder="e.g. Battery life" onChange={event=>change({newLabel:event.target.value})}/></label><label>Unit<input value={draft.newUnit??''} disabled={disabled} maxLength={30} placeholder="e.g. hours" onChange={event=>change({newUnit:event.target.value})}/></label><label>Preferred direction<select value={draft.newDirection??'higher'} disabled={disabled} onChange={event=>change({newDirection:event.target.value})}><option value="higher">Higher is better</option><option value="lower">Lower is better</option></select></label><button type="button" disabled={disabled||!draft.newLabel?.trim()||!draft.newUnit?.trim()} onClick={addDimension}>Add dimension</button></div></details>}
    {selected.every(Boolean)&&axes[0]!==axes[1]?<><svg className="tradeoff-chart" viewBox="0 0 520 290" role="img" aria-label={`${selected[0]!.label} versus ${selected[1]!.label}; ${known.length} contenders with known comparable values`}><line x1="70" y1="240" x2="480" y2="240"/><line x1="70" y1="30" x2="70" y2="240"/><text x="260" y="282" textAnchor="middle">{selected[0]!.label} ({selected[0]!.unit||'unknown unit'})</text><text x="15" y="20">{selected[1]!.label} ({selected[1]!.unit})</text>{known.map((point,index)=><g key={point.candidate.id}><circle cx={80+(point.x!-xExtent.min)/xExtent.range*380} cy={225-(point.y!-yExtent.min)/yExtent.range*170} r="8"/><text x={92+(point.x!-xExtent.min)/xExtent.range*380} y={225-(point.y!-yExtent.min)/yExtent.range*170}>{index+1}</text><title>{point.candidate.label}: {point.x} {selected[0]!.unit}, {point.y} {selected[1]!.unit}</title></g>)}</svg><ol className="map-legend">{known.map(point=><li key={point.candidate.id}>{point.candidate.label}: {point.x} {selected[0]!.unit}, {point.y} {selected[1]!.unit}</li>)}</ol>{!known.length&&<p>No contender has known values on both axes yet. Add measurements below or keep them unknown.</p>}</>:<p>Choose two different dimensions to see the map.</p>}
    <div className="table-scroll"><table className="evaluation-table"><caption>Editable measurements · blank means unknown; saving marks your inputs as user-stated</caption><thead><tr><th>Contender</th><th>Price ({model.context?.currency||'choose currency first'})</th>{dimensions.map(axis=><th key={axis.id}>{axis.label} ({axis.unit})</th>)}</tr></thead><tbody>{virtual.candidates.map(candidate=><tr key={candidate.id}><th>{candidate.label}</th><td><input type="number" min="0" aria-label={`${candidate.label} price`} disabled={disabled||!/^[A-Z]{3}$/.test(model.context?.currency??'')} placeholder="Unknown" value={Object.hasOwn(draft.prices??{},candidate.id)?draft.prices[candidate.id]??'':candidate.price?.currency===model.context?.currency?candidate.price?.amount??'':''} onChange={event=>change({prices:{...draft.prices,[candidate.id]:number(event.target.value)}})}/></td>{dimensions.map(axis=><td key={axis.id}><input type="number" step="any" aria-label={`${candidate.label} ${axis.label}`} disabled={disabled} placeholder="Unknown" value={Object.hasOwn(draft.quantities?.[candidate.id]??{},axis.id)?draft.quantities[candidate.id][axis.id]??'':quantity(model,candidate,axis)??''} onChange={event=>change({quantities:{...draft.quantities,[candidate.id]:{...draft.quantities?.[candidate.id],[axis.id]:number(event.target.value)}}})}/></td>)}</tr>)}</tbody></table></div>
    <p>{assessment.dominated.length?`${assessment.dominated.map(id=>model.candidates.find(candidate=>candidate.id===id)?.label).join(', ')} is dominated on these two dimensions only. This does not decide overall fit.`:'No dominance established on the selected axes. Unknowns and ties cannot establish dominance.'}</p><label>Your explicit tradeoff judgment<textarea maxLength={1500} value={draft.judgment??''} disabled={disabled} placeholder="What compromise would you accept? Optional." onChange={event=>change({judgment:event.target.value})}/></label>
    <button type="button" className="composer-submit" disabled={disabled||!selected.every(Boolean)||axes[0]===axes[1]} onClick={()=>dispatch(context,'map',{dimensions,axes,judgment:draft.judgment??'',quantities:Object.entries(draft.quantities??{}).flatMap(([candidateId,values])=>Object.entries(values as Record<string,number|null>).map(([dimensionId,value])=>({candidateId,dimensionId,value}))),prices:Object.entries(draft.prices??{}).filter(([,amount])=>amount!==null).map(([candidateId,amount])=>({candidateId,amount,currency:model.context?.currency}))})}>Save map and judgment</button>
  </div>;
}

const widgets={PairwiseChoice:Pairwise,PriorityRanker:Ranker,WhatIfExplorer:WhatIf,TradeoffMap:Tradeoff};
export const decisionCatalogId='https://helpmedecide.ai/catalogs/purchase-alpha/v1.json';
export const decisionCatalog=new Catalog<ReactCatalogComponent>(decisionCatalogId,'0.9',Object.entries(widgets).map(([name,View])=>createComponentImplementation({name,schema:z.object({exerciseKey:z.string().min(1).max(500)}).strict()},({context})=><View context={context}/>)));
export function exerciseMessages(kind:ExerciseKind,key:string) {return [{version:'v0.9.1',createSurface:{surfaceId:'decision-exercise',catalogId:decisionCatalogId}},{version:'v0.9.1',updateComponents:{surfaceId:'decision-exercise',components:[{id:'root',component:kind,exerciseKey:key}]}}];}
export function validateExerciseMessages(messages:unknown,kind:ExerciseKind,key:string) {
  if(JSON.stringify(messages)!==JSON.stringify(exerciseMessages(kind,key)))throw new Error('Exercise messages are outside the permitted catalog, properties, or references.');
}
export function createDecisionProcessor(kind:ExerciseKind,key:string,onAction:(type:string,payload:Record<string,unknown>)=>void,generate:()=>unknown=()=>exerciseMessages(kind,key)) {
  let messages:unknown;let fallback=false;
  for(let attempt=0;attempt<2;attempt++){try{messages=generate();validateExerciseMessages(messages,kind,key);break;}catch{messages=undefined;}}
  if(!messages){messages=exerciseMessages(kind,key);fallback=true;}
  const permitted:Record<ExerciseKind,string[]>={PairwiseChoice:['pairwise'],PriorityRanker:['rank'],WhatIfExplorer:['save-scenario','apply-scenario','clear-scenario','answer-what-if','continue-guide'],TradeoffMap:['map','open-what-if']};
  const processor=new MessageProcessor<ReactCatalogComponent>([decisionCatalog],action=>{
    if(action.name!=='decision-action')return;
    const payload=z.record(z.unknown()).safeParse(action.context.payload);
    if(!payload.success||!permitted[kind].includes(String(action.context.type)))return;
    onAction(String(action.context.type),payload.data);
  });
  processor.processMessages(messages as Parameters<typeof processor.processMessages>[0]);
  return {processor,fallback};
}
export function DecisionSurface({kind,exerciseKey,scope,onAction}:{kind:ExerciseKind;exerciseKey:string;scope:Scope;onAction:(type:string,payload:Record<string,unknown>)=>void}) {
  const callback=useRef(onAction);callback.current=onAction;
  const {processor,fallback}=useMemo(()=>createDecisionProcessor(kind,exerciseKey,(type,payload)=>callback.current(type,payload)),[kind,exerciseKey]);
  const [surface,setSurface]=useState(()=>processor.model.surfacesMap.get('decision-exercise'));
  useEffect(()=>{setSurface(processor.model.surfacesMap.get('decision-exercise'));return()=>processor.dispose();},[processor]);
  return <ExerciseScope.Provider value={scope}>{fallback&&<p role="status">Using a predefined exercise after an invalid update.</p>}{surface?<A2uiSurface surface={surface}/>:<p role="alert">Could not render this exercise. Choose another exercise or retry.</p>}</ExerciseScope.Provider>;
}
