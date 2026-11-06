import {useMemo,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {productImageLoader,type ProductImageLoader} from '../services/productImages';
import {ProductPhoto} from './ProductPhoto';
import {factValue,requirementResult} from '../domain/productEvidence';
import type {ProductFact} from '../domain/productEvidence.generated';
import type {PurchaseCandidate,PurchaseDecisionModel} from '../domain/purchaseDecision';
import {useProductEdit,type ProductEditorProps} from '../services/products';
export const factText=(value:ProductFact['value'],unit:string|null)=>value===null?'Unknown':`${value===true?'Yes':value===false?'No':String(value)}${unit?` ${unit}`:''}`;
const date=(value:string)=>new Date(value).toLocaleDateString();
export function ProductCard({candidate,model,editor,provisional=false,imageClient,decisionId,imageLoader}:{candidate:PurchaseCandidate;model:PurchaseDecisionModel;editor?:ProductEditorProps;provisional?:boolean;imageClient?:SupabaseClient;decisionId?:string;imageLoader?:ProductImageLoader}){
  const evidence=candidate.evidence,client=imageClient??editor?.client,id=decisionId??editor?.decision.id;
  const version=JSON.stringify([candidate.url,evidence?.identity,evidence?.offers.map(o=>o.url),evidence?.facts.map(f=>f.sourceUrls)]);
  const loader=useMemo(()=>imageLoader??(client&&id?productImageLoader(client,id,version):undefined),[imageLoader,client,id,version]);
  const keys=[...new Set(evidence?.facts.filter(f=>f.provenance!=='superseded').map(f=>f.key)??[])];
  const rules=(model.requirements??[]).map(rule=>requirementResult(candidate,rule));
  return <article className="contender-card product-card"><ProductPhoto name={candidate.label} candidateId={candidate.id} initial={evidence?.image} loader={loader}/>
    <div className="product-card-body">{provisional&&<p className="provisional-tag">Suggested · review before using</p>}<h3>{candidate.label}</h3>
    {evidence&&<p className="product-identity">{[evidence.identity.brand,evidence.identity.model,evidence.identity.variant].filter(Boolean).join(' · ')||'Exact model not resolved'}{evidence.identity.match!=='exact'&&<strong> · {evidence.identity.match==='family'?'Model family only':'Identity needs review'}</strong>}</p>}
    <p className="product-price">{candidate.price?`${candidate.price.currency} ${candidate.price.amount.toLocaleString()}${candidate.price.provenance==='corrected'?' · your correction':''}`:'Price unknown'}</p>{candidate.price&&<small className="muted">Observed {date(candidate.price.observedAt)} · tax/shipping unconfirmed</small>}
    {!!rules.length&&<ul className="product-requirement-checks" aria-label={`${candidate.label} requirement checks`}>{rules.map(({rule,verdict,reason})=><li key={rule.id} data-verdict={verdict}><strong>{verdict==='pass'?'Meets':verdict==='fail'?'Doesn’t meet':'Needs checking'}:</strong> {rule.label}<small>{reason}</small></li>)}</ul>}
    {!!keys.length&&<dl className="product-facts">{keys.slice(0,6).map(key=>{const current=factValue(candidate,key);return <div key={key}><dt>{current.facts.at(-1)?.label??key}</dt><dd>{current.status==='known'?factText(current.value,current.unit):current.status==='conflicting'?'Sources disagree':'Not confirmed'}</dd></div>;})}</dl>}
    {evidence&&<details className="product-source-review"><summary>Offers, specifications & sources</summary>
      {evidence.offers.length?<ul className="product-offers">{evidence.offers.map((offer,i)=><li key={i}><a href={offer.url} target="_blank" rel="noreferrer">{offer.seller||'Product listing'}</a> · {offer.amount!==null?`${offer.currency} ${offer.amount}`:'Price unknown'}<br />{({'in-stock':'Reported in stock','out-of-stock':'Reported out of stock',preorder:'Preorder',unknown:'Availability unknown'} as const)[offer.availability]}{offer.region?` · ${offer.region}`:''}<small> · Retrieved {date(offer.observedAt)}</small></li>)}</ul>:<p>Current offers and stock still need checking.</p>}
      {evidence.image&&<p><a href={evidence.image.sourceUrl} target="_blank" rel="noreferrer">Product image source</a></p>}
      {keys.map(key=><div className="product-claim" key={key}><h4>{factValue(candidate,key).facts.at(-1)?.label??key}</h4>{factValue(candidate,key).facts.map((fact,i)=><div key={i}><p>{factText(fact.value,fact.unit)} <small className="muted">· {fact.provenance==='corrected'?'Your confirmation':fact.verification==='reported'?'Reported in saved evidence':fact.verification==='conflicting'?'Conflicting claim':'Unverified claim'} · {date(fact.observedAt)}</small></p>{fact.quote&&<blockquote>{fact.quote}</blockquote>}<div>{fact.sourceUrls.map((url,n)=><a key={url} href={url} target="_blank" rel="noreferrer">Source {n+1} · {new URL(url).hostname} </a>)}</div></div>)}</div>)}
      <p className="muted">Saved source excerpts support these reported values; they are not independent product verification. Your corrections take precedence.</p>
    </details>}
    {!evidence&&<p className="muted">Product details need research. Use “Fill in product details” below when saved sources are available.</p>}
    {editor&&!provisional&&<FactEditor {...editor} candidate={candidate}/>}</div>
  </article>;
}
function FactEditor(props:ProductEditorProps&{candidate:PurchaseCandidate}){
  const {candidate,decision}=props,edit=useProductEdit(props);const model=decision.canonical_model;
  const options=new Map((candidate.evidence?.facts??[]).filter(f=>f.provenance!=='superseded').map(f=>[f.key,{key:f.key,label:f.label,value:f.value,unit:f.unit}]));
  for(const r of model.requirements??[])if(!options.has(r.key))options.set(r.key,{key:r.key,label:r.label,value:typeof r.value==='boolean'?null:r.value,unit:r.unit});
  options.set('price',{key:'price',label:'Price',value:candidate.price?.amount??null,unit:candidate.price?.currency??model.context?.currency??'USD'});
  const [open,setOpen]=useState(false),[key,setKey]=useState('price'),[value,setValue]=useState(''),[unit,setUnit]=useState('');
  const field=options.get(key)??options.get('price')!;const rule=model.requirements?.find(r=>r.key===key);const boolean=typeof field.value==='boolean'||typeof rule?.value==='boolean'||key.startsWith('personal-');
  const numeric=key==='price'||typeof field.value==='number'||['lte','gte'].includes(rule?.operator??'');
  function choose(key:string){edit.begin();setKey(key);const current=key==='price'?{value:candidate.price?.amount??null,unit:candidate.price?.currency??model.context?.currency??'USD'}:factValue(candidate,key);setValue(current.value===null?'':String(current.value));setUnit(current.unit??options.get(key)?.unit??'');}
  return <div className="fact-editor"><button type="button" onClick={()=>{setOpen(!open);if(!open)choose(key);}} disabled={edit.busy||edit.pending}>{open?'Close fact review':'Review or correct a fact'}</button>{open&&<form onSubmit={async event=>{event.preventDefault();const parsed=value===''?null:boolean?value==='true':numeric?Number(value):value;if(await edit.save('correct-fact',{candidateId:candidate.id,fact:{key,label:field.label,value:parsed,unit:unit||null}}))setOpen(false);}}>
    <label>Which fact?<select value={key} disabled={edit.busy||edit.pending} onChange={e=>choose(e.target.value)}>{[...options.values()].map(f=><option value={f.key} key={f.key}>{f.label}</option>)}</select></label>
    {key.startsWith('personal-')&&<p>Answer from your own experience. Marketing claims cannot settle personal fit or comfort.</p>}
    <label>{boolean?'Your own check':'Correct value'}{boolean?<select aria-label="Your own check" value={value} disabled={edit.busy||edit.pending} onChange={e=>{edit.begin();setValue(e.target.value);}}><option value="">Not sure / unknown</option><option value="true">Yes</option><option value="false">No</option></select>:<input type={numeric?'number':'text'} step="any" value={value} maxLength={1000} disabled={edit.busy||edit.pending} placeholder="Leave blank if unknown" onChange={e=>{edit.begin();setValue(e.target.value);}}/>}</label>
    {!boolean&&(unit||numeric)&&<label>{key==='price'?'Currency':'Unit'}<input required={key==='price'&&value!==''} maxLength={30} value={unit} disabled={edit.busy||edit.pending} onChange={e=>{edit.begin();setUnit(key==='price'?e.target.value.toUpperCase():e.target.value);}}/></label>}
    <p className="muted">Saving makes this your authoritative correction. Later research won’t overwrite it. A blank value stays unknown.</p><button className="composer-submit" disabled={edit.disabled||edit.pending}>Save this fact</button>
  </form>}{edit.pending&&!edit.busy&&<button onClick={()=>void edit.retry()}>Retry saving the same fact</button>}{edit.stale&&<button onClick={edit.review}>Use latest decision for this correction</button>}<p role="status">{edit.status}</p></div>;
}
