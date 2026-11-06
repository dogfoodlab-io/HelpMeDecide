import {useEffect,useRef,useState} from 'react';
import {evaluateRequirements} from '../domain/productEvidence';
import type {Requirement,RequirementSuggestion} from '../domain/productEvidence.generated';
import {useProductEdit,type ProductEditorProps} from '../services/products';
function fallback(text:string):RequirementSuggestion[]{
  const result:RequirementSuggestion[]=[];
  const add=(label:string,key:string,value:string|number|boolean,quote:string,operator:Requirement['operator']='eq')=>result.push({label,key,operator,value,unit:null,required:true,contextQuote:quote});
  const noise=text.match(/noise[ -]cancell?(?:ing|ation)?|\bANC\b/i);if(noise)add('Active noise cancellation','noise-cancelling',true,noise[0]);
  const over=text.match(/over[ -]ear/i);if(over)add('Over-ear headphones','form-factor','over-ear',over[0],'contains');
  const comfort=text.match(/comfort(?:able)?|\bfit\b/i);if(comfort)add('Comfort I have checked myself','personal-comfort',true,comfort[0]);
  return result;
}
export function PurchaseRequirements(props:ProductEditorProps){
  const {decision,client}=props,model=decision.canonical_model,edit=useProductEdit(props);const rules=model.requirements??[];
  const [suggestions,setSuggestions]=useState<RequirementSuggestion[]>([]);
  useEffect(()=>{let active=true;async function load(){if(!client)return;const {data,error}=await client.from('decision_research_jobs').select('result').eq('decision_id',decision.id).eq('status','completed').order('created_at',{ascending:false}).limit(1);if(!error&&active)setSuggestions((data?.[0]?.result as {requirements?:RequirementSuggestion[]}|undefined)?.requirements??[]);}void load();const timer=setInterval(()=>void load(),6000);return()=>{active=false;clearInterval(timer);};},[client,decision.id,decision.revision]);
  const context=[model.context?.nonnegotiables,model.context?.purpose].filter(Boolean).join(' ');
  const available=[...suggestions,...fallback(context)].filter((s,i,all)=>!rules.some(r=>r.key===s.key)&&all.findIndex(x=>x.key===s.key)===i);
  const results=evaluateRequirements(model);
  async function add(items:RequirementSuggestion[]){const next=items.map(({contextQuote:_,...r})=>({...r,required:true,id:crypto.randomUUID(),provenance:'user-stated' as const}));await edit.save('requirements',{requirements:[...rules,...next]});}
  const [custom,setCustom]=useState(false);
  return <section className="panel purchase-requirements" aria-labelledby="requirements-heading"><p className="eyebrow">What an option must get right</p><h2 id="requirements-heading">Your must-haves</h2><p>Confirm the checks that matter. Each contender will show what meets them, what fails, and what still needs evidence or your own experience.</p>
    {rules.length>0&&<ul className="requirement-rules">{rules.map(rule=><li key={rule.id}><strong>{rule.label}</strong><span>{rule.operator==='lte'?'At most':rule.operator==='gte'?'At least':rule.operator==='contains'?'Includes':'Needs'} {typeof rule.value==='boolean'?(rule.value?'Yes':'No'):rule.value}{rule.unit?` ${rule.unit}`:''} · {rule.required?'Required':'Preference'}</span><small>{results.filter(r=>r.rule.id===rule.id&&r.verdict==='pass').length} meet it · {results.filter(r=>r.rule.id===rule.id&&r.verdict==='fail').length} fail · {results.filter(r=>r.rule.id===rule.id&&r.verdict==='unknown').length} need checking</small><div><button disabled={edit.disabled||edit.pending} onClick={()=>void edit.save('requirements',{requirements:rules.filter(r=>r.id!==rule.id)})}>Remove {rule.label}</button></div><details onToggle={event=>{if(event.currentTarget.open)edit.begin();}}><summary>Adjust this requirement</summary><RuleEditor initial={rule} disabled={edit.disabled||edit.pending} begin={edit.begin} onSave={next=>edit.save('requirements',{requirements:rules.map(r=>r.id===rule.id?next:r)})}/></details></li>)}</ul>}
    {!rules.length&&!available.length&&<p>No explicit checks yet. Research can suggest measurable requirements from your purchase context; you decide which become must-haves.</p>}
    {available.length>0&&<div className="requirement-suggestions"><h3>Suggested from what you told us</h3>{available.map((rule,i)=><div key={i}><p><strong>{rule.label}</strong>{typeof rule.value==='number'?` · ${rule.operator==='lte'?'at most':'at least'} ${rule.value} ${rule.unit??''}`:''}<small>From “{rule.contextQuote}”</small></p><button disabled={edit.disabled||edit.pending} onClick={()=>void add([rule])}>Make this a must-have</button></div>)}{available.length>1&&available.length+rules.length<=15&&<button disabled={edit.disabled||edit.pending} onClick={()=>void add(available)}>Use these suggested must-haves</button>}</div>}
    <details open={custom} onToggle={event=>setCustom(event.currentTarget.open)}><summary>Add another requirement</summary><NewRule model={model} disabled={edit.disabled||edit.pending||rules.length>=15} begin={edit.begin} onSave={async rule=>{const result=await edit.save('requirements',{requirements:[...rules,rule]});if(result)setCustom(false);return result;}}/></details>
    {edit.pending&&!edit.busy&&<button onClick={()=>void edit.retry()}>Retry saving these requirements</button>}{edit.stale&&<button onClick={edit.review}>Use latest decision for these requirements</button>}<p role="status">{edit.status}</p>
  </section>;
}
function NewRule({model,...props}:{model:ProductEditorProps['decision']['canonical_model'];disabled:boolean;begin:()=>void;onSave:(rule:Requirement)=>Promise<boolean>}){
  const facts=new Map(model.candidates.flatMap(c=>c.evidence?.facts??[]).filter(f=>f.provenance!=='superseded').map(f=>[f.key,f]));
  const [key,setKey]=useState('personal-comfort');const options=[{key:'personal-comfort',label:'Comfort I have checked myself',value:true,unit:null},...facts.values()];const f=options.find(f=>f.key===key)??options[0];
  const initial:Requirement={id:'new',key:f.key,label:f.label,value:f.value===null?true:f.value,operator:typeof f.value==='number'?'lte':'eq',unit:f.unit,required:true,provenance:'user-stated'};
  return <div><label>What matters?<select value={key} disabled={props.disabled} onChange={e=>{props.begin();setKey(e.target.value);}}>{options.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}</select></label><RuleEditor key={key} {...props} initial={initial} onSave={rule=>props.onSave({...rule,id:crypto.randomUUID()})}/></div>;
}
function RuleEditor({initial,disabled,begin,onSave}:{initial:Requirement;disabled:boolean;begin:()=>void;onSave:(rule:Requirement)=>Promise<boolean>}){
  const [value,setValue]=useState(String(initial.value)),[unit,setUnit]=useState(initial.unit??''),[operator,setOperator]=useState(initial.operator),[required,setRequired]=useState(initial.required);
  const dirty=useRef(false);
  const touch=()=>{dirty.current=true;begin();};
  useEffect(()=>{if(!dirty.current){setValue(String(initial.value));setUnit(initial.unit??'');setOperator(initial.operator);setRequired(initial.required);}},[initial.value,initial.unit,initial.operator,initial.required]);
  const numeric=typeof initial.value==='number',boolean=typeof initial.value==='boolean';
  return <form onSubmit={async event=>{event.preventDefault();if(numeric&&value==='')return;const saved=await onSave({...initial,operator,value:boolean?value==='true':numeric?Number(value):value,unit:unit||null,required});if(saved)dirty.current=false;}}><label>Check<select value={operator} disabled={disabled} onChange={e=>{touch();setOperator(e.target.value as Requirement['operator']);}}>{(numeric?['lte','gte','eq']:boolean?['eq']:['eq','contains']).map(op=><option key={op} value={op}>{({lte:'At most',gte:'At least',eq:'Exactly / yes or no',contains:'Includes'} as Record<string,string>)[op]}</option>)}</select></label><label>{numeric?'Limit':'Required value'}{boolean?<select value={value} disabled={disabled} onChange={e=>{touch();setValue(e.target.value);}}><option value="true">Yes</option><option value="false">No</option></select>:<input required type={numeric?'number':'text'} step="any" maxLength={120} value={value} disabled={disabled} onChange={e=>{touch();setValue(e.target.value);}}/>}</label>{!boolean&&<label>Unit (if measured)<input maxLength={30} value={unit} disabled={disabled} onChange={e=>{touch();setUnit(e.target.value);}}/></label>}<label className="alpha-check"><input type="checkbox" checked={required} disabled={disabled} onChange={e=>{touch();setRequired(e.target.checked);}}/>Must meet this requirement</label><button disabled={disabled||value===''}>Save requirement</button></form>;
}
