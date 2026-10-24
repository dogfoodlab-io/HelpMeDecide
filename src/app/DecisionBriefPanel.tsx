import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createBriefRepository,outcomeLabel,type BriefRepository,type BriefState,type SavedBrief,type Outcome,type OutcomePayload,type FinalChoice} from '../services/briefs';
import {describePreference,type DecisionRepository,type SavedDecision} from '../services/decisions';

const errorText=(error:unknown)=>error&&typeof error==='object'&&'message'in error?String(error.message):'Could not save this step. Please retry.';
const staleError=(error:unknown)=>!!error&&typeof error==='object'&&'code'in error&&error.code==='40001';
const failureText:Record<string,string>={
  'response-not-saved':'The response wasn’t saved. To avoid repeating a paid request, it stopped. You can try again.',
  'provider-timeout':'The assistant took too long to respond. You can try again.',
  'unsupported-brief-reference':'The answer referred to evidence that wasn’t saved, so it was rejected.',
  'over-budget-recommendation':'The proposed answer exceeded your stated budget, so it was rejected.',
  'provider-schema':'Decision assistance needs a server compatibility fix. Your saved work is safe.',
  'provider-auth':'Decision assistance needs a server configuration fix.',
};
export function DecisionBriefPanel({client,briefRepository,decision,repository,onSaved}:{client?:SupabaseClient;briefRepository?:BriefRepository;decision:SavedDecision;repository:DecisionRepository;onSaved:(value:SavedDecision)=>void}) {
  const service=useMemo(()=>briefRepository??(client?createBriefRepository(client):null),[client,briefRepository]);
  const [state,setState]=useState<BriefState|null>(null);
  const [selected,setSelected]=useState<string|null>(null);
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [stale,setStale]=useState(false);
  const [draftRevision,setDraftRevision]=useState<number|null>(null);
  const [outcome,setOutcome]=useState<Outcome|null>(null);const [candidate,setCandidate]=useState('');const [note,setNote]=useState('');
  const active=useRef(true);const lock=useRef(false);
  const pending=useRef<{kind:'start'|'choice';actionId:string;revision:number;payload?:OutcomePayload}|null>(null);
  const load=useCallback(async()=>{if(!service)return;const value=await service.load(decision.id);if(active.current)setState(value);},[service,decision.id]);
  useEffect(()=>{active.current=true;void load().catch(e=>{if(active.current)setError(errorText(e));});const timer=setInterval(()=>void load().catch(e=>{if(active.current)setError(errorText(e));}),5000);return()=>{active.current=false;clearInterval(timer);};},[load,decision.revision]);
  const current=state?.briefs.find(b=>b.id===selected)??state?.briefs[0];
  const outOfDate=!!current&&current.basis_hash!==state?.basisHash;
  const job=state?.jobs.find(j=>['queued','running'].includes(j.status));
  const lastJob=state?.jobs[0];const finalChoice=decision.canonical_model.finalChoice;
  const disabled=busy||!!decision.archived_at;
  async function perform(kind:'start'|'choice',payload?:OutcomePayload){
    if(!service||lock.current)return;lock.current=true;setBusy(true);setError('');
    if(!pending.current)pending.current={kind,actionId:crypto.randomUUID(),revision:kind==='choice'?(draftRevision??decision.revision):decision.revision,payload};
    const command=pending.current;
    try{
      if(command.kind==='start'){await service.start(decision.id,command.actionId,command.revision);setSelected(null);}
      else{await service.choose(decision.id,command.actionId,command.revision,command.payload!);onSaved(await repository.get(decision.id));setOutcome(null);setNote('');setDraftRevision(null);}
      pending.current=null;await load();
    }catch(e){
      if(staleError(e)){setStale(true);pending.current=null;try{onSaved(await repository.get(decision.id));await load();}catch{/* Keep the original actionable stale message. */}setError('This decision changed. Your draft is preserved. Review the latest details before saving it.');}
      else {if(e&&typeof e==='object'&&'code'in e&&['22023','23505'].includes(String(e.code)))pending.current=null;setError(errorText(e));}
    }finally{lock.current=false;setBusy(false);}
  }
  async function cancel(){if(!service||!job||lock.current)return;lock.current=true;setBusy(true);setError('');try{await service.cancel(job.id);await load();}catch(e){setError(errorText(e));}finally{lock.current=false;setBusy(false);}}
  function selectOutcome(value:Outcome){setOutcome(value);setDraftRevision(decision.revision);setCandidate(current?.brief.candidateIds[0]??decision.canonical_model.candidates[0]?.id??'');}
  return <section className="panel brief-panel" id="decision-brief" aria-labelledby="brief-heading"><p className="eyebrow">Your decision, brought together</p><h2 id="brief-heading">What should you do next?</h2>
    <p>Bring your options, evidence and preferences together into a recommendation you can explain. You can decide now or keep exploring.</p>
    {!service&&<p>Decision assistance is unavailable in this preview.</p>}
    {service&&<div className="brief-controls">
      {!job&&<button className="composer-submit" disabled={disabled||!state?.enabled||!decision.canonical_model.candidates.length||stale||!!pending.current||!!state&&state.dailyUsed>=state.dailyLimit} onClick={()=>void perform('start')}>{current?'Update my Decision Brief':'Help me decide'}</button>}
      {!decision.canonical_model.candidates.length&&<p>Add a contender or review the research suggestions first.</p>}
      {state&&!state.enabled&&<p>Decision assistance is temporarily paused. Your saved work is safe.</p>}
      {state&&<p className="muted">{Math.max(0,state.dailyLimit-state.dailyUsed)} brief requests left today. Uses saved evidence; it won’t start another search.</p>}
      {job&&<div role="status"><p>{job.status==='queued'?'Your brief is next in line…':'Bringing your evidence and preferences together…'} You can leave this page and return.</p><button disabled={busy} onClick={()=>void cancel()}>Cancel this brief</button></div>}
      {lastJob?.status==='failed'&&!job&&<p role="alert">{failureText[lastJob.errorCode??'']??'The assistant couldn’t produce a reliable brief. Your work is saved. You can try again.'}</p>}
      {lastJob?.status==='cancelled'&&!job&&<p>The brief was cancelled. Your existing brief and decision are saved.</p>}
      {error&&<p role="alert">{error}</p>}
      {pending.current&&!stale&&<button disabled={busy} onClick={()=>void perform(pending.current!.kind)}>Retry the same step</button>}
      {stale&&<button disabled={busy} onClick={()=>{setStale(false);setError('');setDraftRevision(decision.revision);}}>I’ve reviewed the latest decision</button>}
    </div>}
    {current&&<div className="brief-controls brief-summary"><p className="eyebrow">The app’s recommendation{outOfDate?' · needs an update':''}</p><h3>{outcomeLabel[current.brief.outcome]}{current.brief.candidateIds.length?` · ${current.brief.candidateIds.map(id=>current.snapshot.model.candidates.find(c=>c.id===id)?.label??'Unknown contender').join(' / ')}`:''}</h3><p>{current.brief.recommendation}</p><p><strong>Next:</strong> {current.brief.nextSteps[0]}</p>{outOfDate&&<p>This recommendation reflects an earlier version of your decision. Update the brief to include your latest changes.</p>}<a href="#saved-brief-document">Read the evidence, tradeoffs and uncertainty ↓</a></div>}
    <div className="brief-controls final-choice">
    {finalChoice?<><p className="eyebrow">Your recorded choice</p><h3>{outcomeLabel[finalChoice.outcome]}{finalChoice.candidateLabel?` · ${finalChoice.candidateLabel}`:''}</h3>{finalChoice.note&&<p>{finalChoice.note}</p>}<p className="muted">Recorded {new Date(finalChoice.recordedAt).toLocaleString()}. {state&&finalChoice.basisHash!==state.basisHash?'Your decision has changed since this choice. Revisit it before acting.':''}</p><button disabled={disabled||stale||!!pending.current} onClick={()=>void perform('choice',{outcome:'reopen',candidateId:null,briefId:null,note:''})}>Revisit my decision</button></>:<>
      <h3>What will you do?</h3><p>This is your choice. You can record it without asking for a brief.</p><div className="brief-outcomes">{(Object.keys(outcomeLabel) as Outcome[]).map(value=><button key={value} aria-pressed={outcome===value} disabled={disabled||!!pending.current} onClick={()=>selectOutcome(value)}>{outcomeLabel[value]}</button>)}</div>
      {outcome&&<div className="brief-choice-draft">{outcome==='buy'&&<label>Which contender?<select value={candidate} disabled={disabled||!!pending.current} onChange={e=>setCandidate(e.target.value)}>{decision.canonical_model.candidates.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label>}<label>Add a reason (optional)<textarea maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} placeholder="Your reason is optional; your saved preferences are already included." disabled={disabled||!!pending.current}/></label><button className="composer-submit" disabled={disabled||stale||!!pending.current||(outcome==='buy'&&!candidate)} onClick={()=>void perform('choice',{outcome,candidateId:outcome==='buy'?candidate:null,briefId:current&&!outOfDate?current.id:null,note})}>Save my choice: {outcomeLabel[outcome]}</button><button disabled={busy||!!pending.current} onClick={()=>setOutcome(null)}>Keep exploring</button></div>}
    </>}
    </div>
    {current&&<>
      <div className="brief-controls brief-version"><label>Saved briefs<select aria-label="Saved briefs" value={current.id} onChange={e=>setSelected(e.target.value)}>{state?.briefs.map(b=><option value={b.id} key={b.id}>Version {b.version} · {new Date(b.created_at).toLocaleString()}</option>)}</select></label><button onClick={()=>{document.body.classList.add('printing-decision-brief');const cleanup=()=>document.body.classList.remove('printing-decision-brief');window.addEventListener('afterprint',cleanup,{once:true});window.print();cleanup();}}>Print / save PDF</button></div>
      <BriefDocument value={current} outdated={outOfDate} choice={finalChoice?.basisHash===current.basis_hash?finalChoice:undefined} />
    </>}

  </section>;
}
export function BriefDocument({value,outdated,choice}:{value:SavedBrief;outdated:boolean;choice?:FinalChoice}){
  const b=value.brief;const snapshot=value.snapshot;
  const preferences=snapshot.model.preferences.filter(p=>p.provenance!=='superseded');
  const sourceIds=new Set(b.reasons.flatMap(r=>r.sourceIds));
  const sources=snapshot.sources.filter(s=>sourceIds.has(s.id));
  const label=(id:string)=>snapshot.model.candidates.find(c=>c.id===id)?.label??'Unknown contender';
  return <article id="saved-brief-document" className="brief-document" aria-label={`Decision Brief version ${value.version}`}>
    {outdated&&<p className="alpha-notice">This is an earlier picture of your decision. Your options, evidence or preferences have changed. Update the brief before relying on it.</p>}
    <p className="eyebrow">Decision Brief · version {value.version}</p><h3>{b.title}</h3><p className="muted">{snapshot.title} · Saved {new Date(value.created_at).toLocaleString()}</p><strong>{outcomeLabel[b.outcome]}{b.candidateIds.length?` · ${b.candidateIds.map(label).join(' / ')}`:''}</strong><p>{b.recommendation}</p>
    {choice&&<div><h4>Your recorded choice</h4><p>{outcomeLabel[choice.outcome]}{choice.candidateLabel?` · ${choice.candidateLabel}`:''}{choice.note?` — ${choice.note}`:''}</p></div>}
    <h4>Why this fits</h4><ul>{b.reasons.map((reason,i)=><li key={i}>{reason.text}{reason.sourceIds.map(id=>{const source=sources.find(s=>s.id===id);return source?<a key={id} href={source.url} target="_blank" rel="noreferrer"> [{sources.indexOf(source)+1}]</a>:null;})}{reason.preferenceIds.length>0&&<small className="muted"> · Based on your saved answers</small>}</li>)}</ul>
    {b.tradeoffsToConsider.length>0&&<><h4>Tradeoffs to consider</h4><ul>{b.tradeoffsToConsider.map((text,i)=><li key={i}>{text}</li>)}</ul></>}
    <h4>What you’ve told us</h4>{preferences.length?<ul>{preferences.map(p=><li key={p.id}>{describePreference(p,snapshot.model)}</li>)}</ul>:<p>No explicit preferences saved yet. This recommendation is provisional.</p>}
    {snapshot.model.context&&<p className="muted">{Object.entries(snapshot.model.context).filter(([,v])=>v).map(([k,v])=>`${k==='nonnegotiables'?'Must-haves':k[0].toUpperCase()+k.slice(1)}: ${v}`).join(' · ')}</p>}
    <h4>What remains uncertain</h4>{b.uncertainties.length?<ul>{b.uncertainties.map((text,i)=><li key={i}>{text}</li>)}</ul>:<p>No additional uncertainty was identified in this synthesis. Prices and availability may still change.</p>}
    <h4>What could change the answer</h4><ul>{b.whatWouldChangeAnswer.map((text,i)=><li key={i}>{text}</li>)}</ul><h4>Your next step</h4><ol>{b.nextSteps.map((text,i)=><li key={i}>{text}</li>)}</ol>
    <dl className="brief-assessments">{(['facts','preferences','stability'] as const).map(key=><div key={key}><dt>{key==='stability'?'Recommendation stability':key==='facts'?'Factual evidence':'Understanding your preferences'} · {b.assessments[key].level}</dt><dd>{b.assessments[key].explanation}</dd></div>)}</dl>
    {sources.length>0&&<><h4>Saved sources</h4><ol className="brief-sources">{sources.map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.title||new URL(s.url).hostname}</a><small> · Retrieved {new Date(s.retrieved_at).toLocaleDateString()}</small></li>)}</ol><p className="muted">Citations link to saved research evidence; they do not guarantee that every claim is verified or that today’s price is unchanged.</p></>}
  </article>;
}
