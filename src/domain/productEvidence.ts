import type {ProductEvidence,ProductFact,Requirement} from './productEvidence.generated.ts';
export type EvidenceCandidate={id:string;label:string;price?:{amount:number;currency:string;provenance?:string;observedAt?:string};evidence?:ProductEvidence};
export type ProductModel={candidates:EvidenceCandidate[];requirements?:Requirement[];context?:Record<string,string>};
export type EvidenceAxis={id:string;label:string;unit:string;direction:'higher'|'lower'|null};
const units:Record<string,{unit:string;factor:number}>={mm:{unit:'mm',factor:1},cm:{unit:'mm',factor:10},in:{unit:'mm',factor:25.4},inches:{unit:'mm',factor:25.4},g:{unit:'g',factor:1},kg:{unit:'g',factor:1000},oz:{unit:'g',factor:28.349523125},h:{unit:'hours',factor:1},hr:{unit:'hours',factor:1},hrs:{unit:'hours',factor:1},hour:{unit:'hours',factor:1},hours:{unit:'hours',factor:1},min:{unit:'hours',factor:1/60},minutes:{unit:'hours',factor:1/60},m:{unit:'m',factor:1},meters:{unit:'m',factor:1},metres:{unit:'m',factor:1}};
export function canonicalFactValue(key:string,value:ProductFact['value']):ProductFact['value']{
  if(key==='form-factor'&&typeof value==='string'){
    if(/over[ -]?ear|around[ -]?ear|circumaural/i.test(value))return 'over-ear';
    if(/in[ -]?ear|intra[ -]?aural/i.test(value))return 'in-ear';
    if(/on[ -]?ear|supra[ -]?aural/i.test(value))return 'on-ear';
  }
  if(key==='region'&&typeof value==='string'){if(/^(?:us|usa|united states)$/i.test(value))return'US';if(/^(?:uk|united kingdom)$/i.test(value))return'UK';}
  return value;
}
export function normalizeMeasurement(value:ProductFact['value'],unit:string|null,key=''){
  value=canonicalFactValue(key,value);
  if(key==='price')return{value,unit:unit?.trim().toUpperCase()||null};
  const name=unit?.trim().toLowerCase()??'';
  if(typeof value==='number'&&Number.isFinite(value)){
    if(key==='water-resistance'&&['bar','atm'].includes(name))return{value:value*10,unit:'m'};
    const lengths:Record<string,number>={mm:1,cm:10,m:1000,meters:1000,metres:1000,in:25.4,inches:25.4,ft:304.8,feet:304.8};
    if(lengths[name]){const meters=['water-resistance','wireless-range','cable-length'].includes(key);return{value:Math.round(value*lengths[name]/(meters?1000:1)*1000000)/1000000,unit:meters?'m':'mm'};}
    const normalized=units[name];if(normalized)return{value:Math.round(value*normalized.factor*1000000)/1000000,unit:normalized.unit};
  }
  return{value,unit:unit?.trim().toLowerCase()||null};
}
const equalValues=(a:{value:ProductFact['value'];unit:string|null},b:{value:ProductFact['value'];unit:string|null})=>a.unit===b.unit&&(typeof a.value==='number'&&typeof b.value==='number'?Math.abs(a.value-b.value)<=Math.max(0.0001,Math.abs(a.value)*0.000001):a.value===b.value);
export function factValue(candidate:EvidenceCandidate,key:string):{value:ProductFact['value'];unit:string|null;status:'known'|'unknown'|'conflicting';facts:ProductFact[]}{
  let facts=(candidate.evidence?.facts??[]).filter(f=>f.key===key&&f.provenance!=='superseded');
  if(!facts.length&&key==='price'&&candidate.price&&Number.isFinite(candidate.price.amount)&&candidate.price.amount>=0&&/^[A-Z]{3}$/.test(candidate.price.currency)){
    const priceFact:ProductFact={key,label:'Price',value:candidate.price.amount,unit:candidate.price.currency,sourceUrls:candidate.evidence?.offers.flatMap(o=>o.sourceUrls)??[],quote:'Saved price',observedAt:candidate.price.observedAt??'',provenance:candidate.price.provenance==='corrected'?'corrected':'researched',verification:candidate.price.provenance==='corrected'?'user-confirmed':'reported'};
    return{value:priceFact.value,unit:priceFact.unit,status:'known',facts:[priceFact]};
  }
  if(!facts.length&&candidate.evidence){
    const offers=candidate.evidence.offers;
    let value:ProductFact['value']=null;
    if(key==='price'&&candidate.price&&Number.isFinite(candidate.price.amount))facts=[{key,label:'Price',value:candidate.price.amount,unit:candidate.price.currency,sourceUrls:offers.flatMap(o=>o.sourceUrls),quote:'Saved price',observedAt:candidate.price.observedAt??'',provenance:candidate.price.provenance==='corrected'?'corrected':'researched',verification:candidate.price.provenance==='corrected'?'user-confirmed':'reported'}];
    if(key==='region'){const regions=[...new Set(offers.map(o=>canonicalFactValue('region',o.region)).filter(Boolean))];if(regions.length===1)value=regions[0];}
    if(key==='availability'){if(offers.some(o=>o.availability==='in-stock'))value='in-stock';else if(offers.length&&offers.every(o=>o.availability==='out-of-stock'))value='out-of-stock';}
    if(['brand','model','variant'].includes(key)&&candidate.evidence.identity.match==='exact')value=candidate.evidence.identity[key as 'brand'|'model'|'variant'];
    if(value!==null)facts=[{key,label:key,value,unit:null,sourceUrls:offers.flatMap(o=>o.sourceUrls),quote:'Reported in the saved product identity or offer',observedAt:offers[0]?.observedAt??'',provenance:'researched',verification:'reported'}];
  }
  const explicit=facts.filter(f=>['corrected','user-stated','accepted'].includes(f.provenance));
  const active=explicit.length?[explicit.at(-1)!]:facts;
  const known=active.filter(f=>f.value!==null&&['reported','user-confirmed'].includes(f.verification));
  const values=known.map(f=>normalizeMeasurement(f.value,f.unit,key));
  if(active.some(f=>f.verification==='conflicting')||values.some(v=>!equalValues(v,values[0])))return{value:null,unit:null,status:'conflicting',facts};
  if(!values.length)return{value:null,unit:null,status:'unknown',facts};
  return{...values[0],status:'known',facts};
}
export function requirementResult(candidate:EvidenceCandidate,rule:Requirement){
  const fact=factValue(candidate,rule.key);const target=normalizeMeasurement(rule.value,rule.unit,rule.key);
  if(fact.status!=='known')return{rule,candidateId:candidate.id,verdict:'unknown' as const,reason:fact.status==='conflicting'?'Sources disagree. Review or correct this fact.':'This requirement needs evidence or your own experience.'};
  // Subjective experience cannot be established by manufacturer copy.
  if(rule.key.startsWith('personal-')&&!fact.facts.some(f=>['corrected','user-stated','accepted'].includes(f.provenance)))return{rule,candidateId:candidate.id,verdict:'unknown' as const,reason:'This needs your personal check.'};
  if(fact.unit!==target.unit||typeof fact.value!==typeof target.value)return{rule,candidateId:candidate.id,verdict:'unknown' as const,reason:'The values are not comparable in the same units.'};
  let pass:boolean;
  if(rule.operator==='lte'||rule.operator==='gte'){
    if(typeof fact.value!=='number'||typeof target.value!=='number')return{rule,candidateId:candidate.id,verdict:'unknown' as const,reason:'A comparable measurement is missing.'};
    pass=rule.operator==='lte'?fact.value<=target.value:fact.value>=target.value;
  }else if(rule.operator==='contains'&&(typeof fact.value!=='string'||typeof target.value!=='string'))return{rule,candidateId:candidate.id,verdict:'unknown' as const,reason:'This text requirement needs a text value.'};
  else if(rule.operator==='contains')pass=typeof fact.value==='string'&&typeof target.value==='string'&&fact.value.toLowerCase().includes(target.value.toLowerCase());
  else pass=typeof fact.value==='string'&&typeof target.value==='string'?fact.value.toLowerCase()===target.value.toLowerCase():fact.value===target.value;
  return{rule,candidateId:candidate.id,verdict:pass?'pass' as const:'fail' as const,reason:`${fact.value===true?'Yes':fact.value===false?'No':String(fact.value)}${fact.unit?` ${fact.unit}`:''} · ${fact.facts.some(f=>['corrected','user-stated','accepted'].includes(f.provenance))?'your confirmation':'reported in saved sources'}`};
}
export const evaluateRequirements=(model:ProductModel)=>model.candidates.flatMap(c=>(model.requirements??[]).map(r=>requirementResult(c,r)));
export function evidenceAxes(model:ProductModel):EvidenceAxis[]{
  const axes=new Map<string,EvidenceAxis>();const currency=model.context?.currency?.trim().toUpperCase();
  if(currency)axes.set('price',{id:'price',label:'Price',unit:currency,direction:'lower'});
  // Only these dimensions have an explicit general direction. Size and other
  // neutral quantities can be plotted but must not imply a preference or dominance.
  const direction:Record<string,'higher'|'lower'>={'power-reserve':'higher','battery-life':'higher','water-resistance':'higher',weight:'lower'};
  for(const c of model.candidates)for(const f of c.evidence?.facts??[]){const fact=factValue(c,f.key);if(fact.status==='known'&&typeof fact.value==='number'&&fact.unit&&!axes.has(f.key))axes.set(f.key,{id:f.key,label:f.label,unit:fact.unit,direction:direction[f.key]??null});}
  return [...axes.values()].filter(axis=>model.candidates.filter(c=>axisQuantity(c,axis)!==null).length>=2);
}
export function axisQuantity(candidate:EvidenceCandidate,axis:EvidenceAxis):number|null{
  if(axis.id==='price')return candidate.price?.currency===axis.unit&&Number.isFinite(candidate.price.amount)?candidate.price.amount:null;
  const fact=factValue(candidate,axis.id);return fact.status==='known'&&fact.unit===axis.unit&&typeof fact.value==='number'?fact.value:null;
}
export function suggestedAxes(model:ProductModel):string[]{
  const axes=evidenceAxes(model);if(axes.length<2)return[];
  const criterion=(model.requirements??[]).map(r=>r.key);const preferred=axes.find(a=>a.id!=='price'&&criterion.includes(a.id))??axes.find(a=>a.id==='battery-life'||a.id==='weight'||a.id==='case-diameter')??axes.find(a=>a.id!=='price');
  return axes.some(a=>a.id==='price')&&preferred?['price',preferred.id]:axes.slice(0,2).map(a=>a.id);
}
export function evidenceDominance(model:ProductModel,ids:string[]){
  const axes=ids.map(id=>evidenceAxes(model).find(a=>a.id===id));if(axes.length!==2||ids[0]===ids[1]||axes.some(a=>!a?.direction))return[];
  return model.candidates.filter(b=>model.candidates.some(a=>a.id!==b.id&&axes.every(axis=>{const av=axisQuantity(a,axis!),bv=axisQuantity(b,axis!);return av!==null&&bv!==null&&(axis!.direction==='higher'?av>=bv:av<=bv);})&&axes.some(axis=>axisQuantity(a,axis!)!==axisQuantity(b,axis!)))).map(c=>c.id);
}
