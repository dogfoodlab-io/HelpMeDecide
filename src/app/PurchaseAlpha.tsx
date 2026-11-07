import {ProductCard} from './ProductCard';
import {PurchaseRequirements} from './PurchaseRequirements';
import { DecisionBriefPanel } from './DecisionBriefPanel';
import {outcomeLabel} from '../services/briefs';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { ResearchPanel, PurchaseContext } from './ResearchPanel';
import { ContenderEditor } from './ContenderEditor';
import { AdaptiveExplorer, DecisionEvaluation } from './AdaptiveExplorer';
import { createDecisionRepository, describePreference, type DecisionRepository, type SavedDecision } from '../services/decisions';

function errorText(error: unknown) {
  return error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Something went wrong. Please retry.';
}

export function PurchaseAlpha({ client }: { client: SupabaseClient | null }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!client);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!client) return;
    let active = true;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      if (active) { setSession(next); setReady(true); }
    });
    client.auth.getSession().then(({ data, error }) => {
      if (active) { if (error) setError(error.message); setSession(data.session); setReady(true); }
    }).catch(error => { if (active) { setError(errorText(error)); setReady(true); } });
    return () => { active = false; subscription.unsubscribe(); };
  }, [client]);
  const repository = useMemo(() => client ? createDecisionRepository(client) : null, [client]);
  if (!client) {
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const setupMessage = isLocal
      ? 'Local setup: add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local, then restart the app. See docs/QUICKSTART.md.'
      : 'The private workspace is unavailable because its production service connection has not been configured.';
    return <main className="alpha-shell"><Brand /><section className="alpha-welcome"><p className="eyebrow">Private purchase workspace</p><h1>A little clarity before<br />your next big purchase.</h1><p>Connect the alpha service to save decisions and resume them across visits.</p><div className="alpha-notice">{setupMessage}</div></section></main>;
  }
  if (!ready) return <main className="alpha-shell"><p role="status">Opening your workspace…</p></main>;
  return session && repository ? <SavedWorkspace client={client} key={session.user.id} repository={repository} ownerId={session.user.id} email={session.user.email ?? ''} signOut={() => client.auth.signOut().then(({ error }) => { if (error) throw error; })} /> : <SignIn client={client} initialError={error} />;
}
function Brand() { return <a className="alpha-brand" href="/">HelpMeDecide<span> / private alpha</span></a>; }
function SignIn({ client, initialError }: { client: SupabaseClient; initialError: string }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { error } = sent ? await client.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' }) : await client.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
      if (error) throw error;
      setSent(true);
    } catch (error) { setError(errorText(error)); } finally { setBusy(false); }
  }
  return <main className="alpha-shell"><Brand /><section className="alpha-welcome"><p className="eyebrow">For the purchases you want to get right</p><h1>Choose with<br />a clearer head.</h1><p>Keep your options, preferences, and unanswered questions together.</p><form className="alpha-auth panel" onSubmit={submit}><h2>{sent ? 'Check your email' : 'Your private workspace'}</h2><label>Email<input type="email" autoComplete="email" required value={email} disabled={sent} onChange={event => setEmail(event.target.value)} /></label>{sent && <label>Sign-in code<input inputMode="numeric" autoComplete="one-time-code" required value={token} onChange={event => setToken(event.target.value)} /></label>}<button className="composer-submit" disabled={busy}>{busy ? 'One moment…' : sent ? 'Open workspace' : 'Email me a code'}</button>{sent && <button type="button" disabled={busy} onClick={() => { setSent(false); setToken(''); }}>Use another email / resend</button>}<p className="muted">Invited accounts only. Your decisions are private.</p>{error && <p role="alert">{error}</p>}</form></section></main>;
}

export function SavedWorkspace({ client, repository, ownerId, email, signOut }: { client?: SupabaseClient; repository: DecisionRepository; ownerId: string; email: string; signOut: () => Promise<unknown> }) {
  const [decisions, setDecisions] = useState<SavedDecision[]>([]);
  const [selected, setSelected] = useState<SavedDecision | null>(null);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const creation = useRef<{ id: string; prompt: string } | null>(null);
  const navigation = useRef(0);
  const reloadList = useCallback(async () => setDecisions(await repository.list()), [repository]);
  const open = useCallback(async (id: string | null) => {
    const request = ++navigation.current;
    setSelected(null); setError(''); setBusy(true);
    try { const value = id ? await repository.get(id) : null; if (request === navigation.current) setSelected(value); }
    catch (error) { if (request === navigation.current) setError(errorText(error)); }
    finally { if (request === navigation.current) setBusy(false); }
  }, [repository]);
  useEffect(() => {
    reloadList().catch(error => setError(errorText(error)));
    const navigate = () => { void open(new URL(location.href).searchParams.get('decision')); };
    navigate(); window.addEventListener('popstate', navigate);
    return () => { navigation.current++; window.removeEventListener('popstate', navigate); };
  }, [open, reloadList]);
  function navigate(id: string | null) {
    const url = new URL(location.href); if (id) url.searchParams.set('decision', id); else url.searchParams.delete('decision');
    history.pushState({}, '', url); void open(id);
  }
  async function create(event: FormEvent) {
    event.preventDefault(); if (!prompt.trim() || busy) return;
    setBusy(true); setError('');
    if (!creation.current || creation.current.prompt !== prompt.trim()) creation.current = { id: crypto.randomUUID(), prompt: prompt.trim() };
    try {
      const decision = await repository.create(creation.current.id, creation.current.prompt, ownerId);
      creation.current = null; setSelected(decision);
      const url = new URL(location.href); url.searchParams.set('decision', decision.id); history.pushState({}, '', url);
      await reloadList();
    } catch (error) { setError(errorText(error)); } finally { setBusy(false); }
  }
  async function archive() {
    if (!selected) return; setBusy(true); setError('');
    try { await repository.archive(selected.id, !selected.archived_at); const updated = await repository.get(selected.id); setSelected(updated); await reloadList(); }
    catch (error) { setError(errorText(error)); } finally { setBusy(false); }
  }
  return <main className="alpha-shell"><header className="alpha-topbar"><Brand /><div><span className="muted">{email}</span><button onClick={() => signOut().catch(error => setError(errorText(error)))}>Sign out</button></div></header><div className="alpha-layout"><aside className="alpha-sidebar"><button className="composer-submit" onClick={() => navigate(null)} disabled={busy}>+ New decision</button><h2>Your decisions</h2><label className="alpha-check"><input type="checkbox" checked={showArchived} onChange={event => setShowArchived(event.target.checked)} />Include archived</label><nav aria-label="Saved decisions">{decisions.filter(item => showArchived || !item.archived_at).map(item => <button key={item.id} aria-current={selected?.id === item.id ? 'page' : undefined} onClick={() => navigate(item.id)} disabled={busy}>{item.title}<small>{item.archived_at ? 'Archived' : `${item.canonical_model.preferences.length} preferences saved`}</small></button>)}</nav>{!decisions.length && <p className="muted">Your next decision starts here.</p>}</aside><div className="alpha-main">{error && <div className="alpha-notice" role="alert">{error}<button onClick={() => { void open(new URL(location.href).searchParams.get('decision')); void reloadList().catch(error => setError(errorText(error))); }}>Retry loading</button></div>}{busy && <p role="status">Saving or opening your decision…</p>}{selected ? <><div className="alpha-heading"><p className="eyebrow">Private · saved workspace</p><button disabled={busy} onClick={archive}>{selected.archived_at ? 'Reopen decision' : 'Archive'}</button></div><DecisionBoard client={client} key={selected.id} decision={selected} repository={repository} onSaved={decision => { setSelected(decision); void reloadList().catch(error => setError(errorText(error))); }} /></> : !busy && <section className="alpha-start"><p className="eyebrow">Make room for a better decision</p><h1>What are you<br />thinking of buying?</h1><p>Start with what you know. Include the options you have in mind and what matters to you.</p><form onSubmit={create}><label htmlFor="purchase-prompt">Your purchase decision</label><textarea id="purchase-prompt" required value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="Help me choose between Seiko Prospex and Citizen Promaster for everyday wear under $600…" /><button className="composer-submit" disabled={!prompt.trim() || busy}>Create saved workspace →</button></form><div className="alpha-examples"><button onClick={() => setPrompt('Help me choose between Seiko Prospex and Citizen Promaster for everyday wear under $600. I care about comfort and durability.')}>Try a watch decision</button><button onClick={() => setPrompt('Help me choose between Sony WH-1000XM5 and Bose QuietComfort Ultra for commuting under $400. I care about comfort and noise cancellation.')}>Try headphones</button></div><p className="muted">Start with a purchase goal, product names, or public product links. Research suggestions will be yours to review.</p></section>}</div></div></main>;
}

function DecisionBoard({ client, decision, repository, onSaved }: { client?: SupabaseClient; decision: SavedDecision; repository: DecisionRepository; onSaved: (decision: SavedDecision) => void }) {
  const model = decision.canonical_model;
  return <section><h1 className="alpha-decision-title">{decision.title}</h1><p className="muted">{decision.description}</p><div className="alpha-facts"><span>Facts <b>Review saved evidence</b></span><span>Preferences <b>{model.preferences.length ? `${model.preferences.length} observations` : 'Still exploring'}</b></span><span>Decision <b>{model.finalChoice?outcomeLabel[model.finalChoice.outcome]:'Still exploring'}</b></span></div><div className="alpha-board"><div>{client && <PurchaseContext decision={decision} repository={repository} onSaved={onSaved} />}<PurchaseRequirements client={client} decision={decision} repository={repository} onSaved={onSaved} /><section className="panel"><p className="eyebrow">01 / Your contenders</p><h2>{model.candidates.length ? `${model.candidates.length} contenders to explore` : "Let’s build your shortlist"}</h2><div className="contender-grid">{model.candidates.map(candidate=><ProductCard key={candidate.id} candidate={candidate} model={model} editor={{client,decision,repository,onSaved}}/>)}</div><ContenderEditor decision={decision} repository={repository} onSaved={onSaved} />{model.candidates.length === 1 && <p>Add one more contender to start a comparison.</p>}</section>{!model.finalChoice&&<AdaptiveExplorer decision={decision} repository={repository} onSaved={onSaved} />}{client && <ResearchPanel client={client} decision={decision} repository={repository} onSaved={onSaved} />}</div><aside><DecisionBriefPanel client={client} decision={decision} repository={repository} onSaved={onSaved} /><DecisionEvaluation decision={decision} /><section className="panel"><p className="eyebrow">Your decision record</p><h2>{model.preferences.length} saved preferences</h2><ol className="alpha-observations">{model.preferences.map(preference => <li key={preference.id}>{describePreference(preference, model)}</li>)}</ol><small className="muted">Saved revision {decision.revision} · Reopen this URL to resume</small></section>{model.constraints.length > 0 && <section className="panel"><h2>Constraints to confirm</h2>{model.constraints.map(constraint => <p key={constraint.id}>{constraint.label}<small className="muted"> · inferred from your prompt</small></p>)}</section>}</aside></div></section>;
}
