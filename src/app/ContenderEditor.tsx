import { useRef, useState, type FormEvent } from 'react';
import { suppliedContenders } from '../domain/purchaseIntake';
import type { ContenderCommand, DecisionRepository, SavedDecision } from '../services/decisions';

export function ContenderEditor({ decision, repository, onSaved }: { decision: SavedDecision; repository: DecisionRepository; onSaved: (decision: SavedDecision) => void }) {
  const existing = decision.canonical_model.candidates;
  const [editing, setEditing] = useState(!existing.length);
  const [rows, setRows] = useState(() => (existing.length ? existing : suppliedContenders(decision.description)).map(({ id, label }) => ({ id, label })));
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef<ContenderCommand | null>(null);
  const locked = useRef(false);
  const used = new Set(decision.canonical_model.preferences.flatMap(preference => [preference.payload.leftId, preference.payload.rightId]));
  async function save(event: FormEvent) {
    event.preventDefault(); if (locked.current) return;
    if (new Set(rows.map(row => row.label.trim().toLowerCase())).size !== rows.length) { setMessage('Each contender needs a different name. Correct the duplicate and save again.'); return; }
    locked.current = true; setBusy(true); setMessage('Saving contenders…');
    const command = pending.current ?? { actionId: crypto.randomUUID(), expectedRevision: decision.revision, candidates: rows.map(row => ({ ...row, label: row.label.trim() })) };
    pending.current = command;
    try {
      const saved = await repository.setContenders(decision.id, command);
      onSaved(saved); pending.current = null; setEditing(false); setMessage('Contenders saved. You can now compare them below.');
    } catch (error) {
      const failure = error as { code?: string; message?: string };
      if (failure.code === '40001') {
        try { onSaved(await repository.get(decision.id)); pending.current = null; setMessage('This decision changed elsewhere. Your edits are preserved; review them and save again.'); }
        catch { setMessage('Could not refresh this decision. Retry when connected.'); }
      } else if (failure.code === '22023') { pending.current = null; setMessage(`${failure.message} Review your edits and save again.`); }
      else setMessage(`${failure.message ?? 'Could not save.'} Your edits are still here. Retry to save them.`);
    } finally { locked.current = false; setBusy(false); }
  }
  function edit() { setRows(existing.map(({ id, label }) => ({ id, label }))); setEditing(true); setMessage(''); }
  if (decision.archived_at) return <p className="muted">Reopen this decision to change contenders.</p>;
  return <div className="contender-editor">
    {!editing ? <button type="button" onClick={edit}>Edit contenders</button> : <form onSubmit={save}>
      <h3>{existing.length ? 'Edit your contenders' : rows.length ? 'I found these options in your prompt' : 'Add your first contenders'}</h3>
      <p>{rows.length && !existing.length ? 'Review the names, make any corrections, then save to start comparing.' : 'Add a product name or description for each option. You can change these later.'}</p>
      <fieldset disabled={busy || !!pending.current}>
        {rows.map((row, index) => <div className="contender-edit-row" key={row.id}>
          <label>Contender {index + 1}<input required maxLength={160} value={row.label} onChange={event => setRows(current => current.map(item => item.id === row.id ? { ...item, label: event.target.value } : item))} /></label>
          <button type="button" disabled={used.has(row.id)} title={used.has(row.id) ? 'This contender is referenced by a saved preference' : undefined} aria-label={`Remove contender ${index + 1}`} onClick={() => setRows(current => current.filter(item => item.id !== row.id))}>Remove</button>
        </div>)}
        <button type="button" disabled={rows.length >= 20} onClick={() => setRows(current => [...current, { id: crypto.randomUUID(), label: '' }])}>+ Add contender</button>
      </fieldset>
      <div className="contender-edit-actions"><button className="composer-submit" disabled={busy || rows.length < 1 || rows.some(row => !row.label.trim())}>{busy ? 'Saving…' : pending.current ? 'Retry saving contenders' : 'Save contenders'}</button>
      {existing.length > 0 && !pending.current && <button type="button" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>}</div>
      <p className="muted">At least two contenders unlock the comparison. Names used in saved preferences can be corrected; those contenders cannot be removed.</p>
    </form>}
    <p role="status">{message}</p>
  </div>;
}
