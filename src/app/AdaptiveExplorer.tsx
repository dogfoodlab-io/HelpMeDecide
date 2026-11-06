import type {ProductCommand} from '../domain/productEvidence.generated';
import { experimentLearning } from '../domain/whatIf';
import type { WhatIfAnswer } from '../domain/exploration.generated';
import { scenarioName } from '../domain/scenarioNames';
import { useRef, useState } from 'react';
import { DecisionSurface } from './DecisionCatalog';
import { evaluate, nextExercise, type ExerciseCommand, type ExerciseKind, type NextExercise } from '../domain/exploration';
import type { PairwiseChoice } from '../domain/purchaseDecision';
import type { DecisionRepository, SavedDecision } from '../services/decisions';

const labels: Record<ExerciseKind,string> = {PairwiseChoice:'Compare two',PriorityRanker:'Rank priorities',WhatIfExplorer:'What if',TradeoffMap:'Tradeoff map'};
type Draft = Record<string,any>;
type Pending = {actionId:string;expectedRevision:number;type:string;payload:Record<string,unknown>};
const errorText=(error:unknown)=>error&&typeof error==='object'&&'message'in error?String(error.message):'Could not save. Please retry.';

export function AdaptiveExplorer({decision,repository,onSaved}:{decision:SavedDecision;repository:DecisionRepository;onSaved:(decision:SavedDecision)=>void}) {
  const model=decision.canonical_model;
  const guided=nextExercise(model);
  const [held,setHeld]=useState<NextExercise|null>(null);
  const [manual,setManual]=useState<ExerciseKind|null>(null);
  const [drafts,setDrafts]=useState<Record<string,Draft>>({});
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [pending,setPending]=useState<Pending|null>(null);
  const [stale,setStale]=useState(false);
  const lock=useRef(false);
  const exercise:NextExercise=manual?{kind:manual,key:`manual:${manual}`,title:manual==='WhatIfExplorer'?'What could change your mind?':labels[manual],reason:manual==='WhatIfExplorer'?'Explore a concrete situation to see which option feels right and what to check next.':'Revisit this exercise whenever it helps. Only submitted answers change your decision.'}:held??guided;
  const draft=drafts[exercise.key]??{};
  const disabled=busy||!!pending||stale||!!decision.archived_at;
  function change(values:Draft){if(!manual)setHeld(exercise);setDrafts(current=>({...current,[exercise.key]:{...current[exercise.key],_revision:current[exercise.key]?._revision??decision.revision,...values}}));}
  async function submit(type:string,payload:Record<string,unknown>) {
    if(type==='continue-guide'){setHeld(null);setManual(null);setMessage('');return;}
    if(type==='open-what-if'){setHeld(null);setManual('WhatIfExplorer');return;}
    if(lock.current||decision.archived_at||stale)return;
    const command=pending??{actionId:crypto.randomUUID(),expectedRevision:draft._revision??decision.revision,type,payload};
    lock.current=true;setPending(command);setBusy(true);setMessage('Saving your answer…');
    try {
      const next=command.type==='evidence-map'
        ?await (repository.applyProduct?repository.applyProduct(decision.id,command as ProductCommand):Promise.reject(new Error('Connect the saved workspace to save this comparison.')))
        :command.type==='pairwise'
        ?await repository.choose(decision.id,{actionId:command.actionId,expectedRevision:command.expectedRevision,leftId:String(command.payload.leftId),rightId:String(command.payload.rightId),choice:command.payload.choice as PairwiseChoice})
        :command.type==='context'
        ?await repository.saveContext(decision.id,{actionId:command.actionId,expectedRevision:command.expectedRevision,context:command.payload as Record<string,string>})
        :await repository.applyExploration(decision.id,command as ExerciseCommand);
      onSaved(next);setPending(null);setHeld(null);setDrafts(current=>{const copy={...current};delete copy[exercise.key];return copy;});
      if(command.type==='save-scenario'){setManual('WhatIfExplorer');setDrafts(current=>({...current,'manual:WhatIfExplorer':{whatIfView:'numbers'}}));}
      if(command.type==='answer-what-if'){setManual('WhatIfExplorer');setDrafts(current=>({...current,'manual:WhatIfExplorer':{whatIfView:'question',experiment:command.payload,_revision:next.revision}}));}
      const changed:Record<string,string>={'evidence-map':'Comparison saved with your judgment. Reported facts and actual requirements are unchanged.',rank:'Ranking saved. Your priority order now focuses the questions and research agenda.',pairwise:'Preference saved. This is personal appeal evidence; product facts still need verification.', 'save-scenario':'Scenario saved separately. Your preferences and research allowance are unchanged. Apply it only if you want it to affect evaluation.', 'clear-scenario':'Scenario assumptions removed. Your stated budget stays as applied; edit Purchase context to change it.', 'apply-scenario':'Scenario applied. The evaluation now labels its assumptions, and its budget becomes your stated budget.',map:'Map saved. Evaluation uses only comparable known values. Your written judgment is saved as preference evidence.',context:'Context saved. Research can now use this answer.',skip:'Skipped. The guide will not ask this question again.',reflection:'Reflection saved. This is part of your decision record.'};
      setMessage(command.type==='answer-what-if'?`Insight saved. ${experimentLearning(next.canonical_model,command.payload as unknown as WhatIfAnswer).insight}`:changed[command.type]??'Saved.');
    } catch(error) {
      if((error as {code?:string}).code==='40001') {
        try{onSaved(await repository.get(decision.id));setPending(null);setStale(true);setMessage('This decision changed. Your draft is preserved. Review the latest evaluation before trying again.');}
        catch{setMessage('Could not reload the latest decision. Retry when connected.');}
      } else if((error as {code?:string}).code==='22023') {setPending(null);setMessage(errorText(error));}
      else setMessage(`${errorText(error)} Your answer is still here. Retry uses the same action to avoid saving twice.`);
    } finally{lock.current=false;setBusy(false);}
  }
  const widget=Object.hasOwn(labels,exercise.kind);
  return <section className="panel alpha-exercise" aria-label="Adaptive exploration"><p className="eyebrow">02 / Explore one tradeoff at a time</p>
    <nav className="exercise-tabs" aria-label="Decision exercises"><button disabled={busy||!!pending} aria-pressed={!manual} onClick={()=>{setHeld(null);setManual(null);setMessage('');}}>Continue guide</button>{Object.entries(labels).map(([kind,label])=><button key={kind} disabled={busy||!!pending||model.candidates.length<2} aria-pressed={manual===kind} onClick={()=>{setHeld(null);setManual(kind as ExerciseKind);setMessage('');}}>{label}</button>)}</nav>
    <h2>{exercise.title}</h2><p>{exercise.reason}</p>
    {decision.archived_at&&<p>Reopen this decision to save more answers.</p>}
    {widget&&<DecisionSurface kind={exercise.kind as ExerciseKind} exerciseKey={exercise.key} scope={{model,draft,change,pair:exercise.pair,disabled}} onAction={(type,payload)=>void submit(type,payload)}/>}
    {exercise.kind==='context'&&<form onSubmit={event=>{event.preventDefault();void submit('context',{...model.context,[exercise.field!]:String(draft.answer??'').trim()});}}><label>{exercise.field==='currency'?'Currency code (e.g. USD)':exercise.field==='budget'?'Maximum or range (e.g. 600 or 400–600)':exercise.field==='region'?'Shopping country or region':'Main use'}<input required pattern={exercise.field==='currency'?'[A-Z]{3}':undefined} maxLength={exercise.field==='currency'?3:1000} value={draft.answer??''} disabled={disabled} onChange={event=>change({answer:exercise.field==='currency'?event.target.value.toUpperCase():event.target.value})}/></label><button className="composer-submit" disabled={disabled||!draft.answer?.trim()}>Save answer</button></form>}
    {exercise.kind==='reflection'&&<div className="reflection-suggestions"><p>You can start with one of these and edit it:</p>{(exercise.field==='future-self'?['It fits my everyday use without extra hassle.','I still enjoy using it months later.','I feel comfortable with what I spent.']:['I need to try it in person first.','I’m not sure I need to buy anything yet.','A better fit may be outside this shortlist.']).map(text=><button type="button" key={text} disabled={disabled} onClick={()=>change({answer:text})}>{text}</button>)}</div>}{exercise.kind==='reflection'&&<form onSubmit={event=>{event.preventDefault();void submit('reflection',{perspective:exercise.field,text:draft.answer});}}><label>Your reflection<textarea maxLength={1500} required value={draft.answer??''} disabled={disabled} onChange={event=>change({answer:event.target.value})}/></label><button className="composer-submit" disabled={disabled||!draft.answer?.trim()}>Save reflection</button></form>}
    {exercise.kind==='research'&&<p>Use the contender editor above or the research suggestions below. You can also answer context questions in Purchase context.</p>}
    {exercise.kind==='review'&&<p><a href="#decision-brief">Bring my decision together →</a><br />Your exploration is saved. Bring it together into a recommendation, or revisit an exercise when you want to explore further.</p>}
    {!manual&&!['research','review'].includes(exercise.kind)&&<button type="button" disabled={disabled} onClick={()=>void submit('skip',{key:exercise.key})}>Skip for now</button>}
    {pending&&!busy&&<button className="composer-submit" onClick={()=>void submit(pending.type,pending.payload)}>Retry saving answer</button>}
    {stale&&<button onClick={()=>{setDrafts(current=>({...current,[exercise.key]:{...current[exercise.key],_revision:decision.revision}}));setStale(false);setMessage('Latest decision reviewed. You may now submit your preserved draft.');}}>Use latest revision for this draft</button>}
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}

export function DecisionEvaluation({decision}:{decision:SavedDecision}) {
  const model=decision.canonical_model,assessment=evaluate(model);
  const applied=model.scenarios?.find(item=>item.id===model.activeScenarioId);
  return <section className="panel alpha-insight" aria-label="Decision evaluation"><p className="eyebrow">What your answers changed</p><h2>{assessment.priorities.length?`${assessment.priorities[0]} comes first.`:'Your decision, taking shape.'}</h2>
    {assessment.priorities.length>0&&<p>Priority order: {assessment.priorities.join(' → ')}.</p>}
    {assessment.assumed&&<p className="provisional-tag">Applied scenario: {applied?scenarioName(model,applied):'saved assumptions'} · calculations include assumptions. These do not verify product facts.</p>}
    <h3>Budget fit</h3><p className="muted">{assessment.maximum===null?'Budget maximum unknown':`Maximum ${assessment.currency||'currency unknown'} ${assessment.maximum}`} · before tax and shipping</p><ul>{assessment.budget.map(item=><li key={item.id}>{item.label}: <strong>{item.verdict==='pass'?'within stated budget':item.verdict==='fail'?'above stated budget':'unknown'}</strong></li>)}</ul>
    {assessment.requirements.length>0&&<><h3>Must-have checks</h3><ul>{assessment.requirements.map(r=><li key={`${r.candidateId}-${r.rule.id}`}>{model.candidates.find(c=>c.id===r.candidateId)?.label} · {r.rule.label}: <strong>{r.verdict==='pass'?'meets':r.verdict==='fail'?'doesn’t meet':'needs checking'}</strong></li>)}</ul></>}
    {assessment.contradictory&&<p role="note">Your comparisons conflict. Keep both judgments while you explore why; there is no forced winner.</p>}
    <p>{assessment.dominated.length?`${assessment.dominated.map(id=>model.candidates.find(candidate=>candidate.id===id)?.label).join(', ')} is dominated on the selected dimensions only.`:'No dominance established. More than one option can remain a good fit.'}</p>
    <h3>Research agenda</h3><ul>{assessment.agenda.map((item,index)=><li key={index}>{item}</li>)}</ul><p className="muted">Personal rankings guide attention. A recommendation still needs evidence about your accepted tradeoffs.</p>
  </section>;
}
