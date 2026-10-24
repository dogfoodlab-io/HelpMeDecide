import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PurchaseAlpha, SavedWorkspace } from './PurchaseAlpha';
import type { DecisionRepository, SavedDecision } from '../services/decisions';
import { applyPairwiseObservation } from '../domain/purchaseDecision';

afterEach(() => { cleanup(); history.replaceState({}, '', '/'); });
function fixture(): SavedDecision {
  return { id: 'saved-watch', title: 'Choose a watch', description: 'daily wear', revision: 0, archived_at: null, updated_at: '', canonical_model: {
    goal: 'Choose a watch', revision: 0, useCases: [], constraints: [], preferences: [], candidates: [
      { id: 'a', label: 'Watch A', attributes: {}, provisional: false }, { id: 'b', label: 'Watch B', attributes: {}, provisional: false },
    ],
  } };
}
it('reports missing service configuration instead of claiming disconnected answers are saved', () => {
  render(<PurchaseAlpha client={null} />);
  expect(screen.getByText(/Connect the alpha service/)).toBeInTheDocument();
});
it('retries an uncertain save with the same action ID, then reloads durable preferences on remount', async () => {
  let stored = fixture();
  let failResponse = true;
  const choose = vi.fn(async (_id, command) => {
    const canonical_model = applyPairwiseObservation(stored.canonical_model, command);
    stored = { ...stored, revision: canonical_model.revision, canonical_model };
    if (failResponse) { failResponse = false; throw new Error('Response lost'); }
    return structuredClone(stored);
  });
  const repository: DecisionRepository = { applyExploration: vi.fn(), saveContext: vi.fn(), get: vi.fn(async () => structuredClone(stored)), list: vi.fn(async () => [structuredClone(stored)]), create: vi.fn(), setContenders: vi.fn(), choose, archive: vi.fn() };
  history.replaceState({}, '', '/?decision=saved-watch');
  const props = { repository, ownerId: 'owner', email: 'owner@example.test', signOut: vi.fn() };
  const view = render(<SavedWorkspace {...props} />);
  fireEvent.click(await screen.findByText('Compare two', {exact:true}));
  fireEvent.click(await screen.findByText('I prefer this one · Watch A'));
  fireEvent.click(screen.getByText('Save preference'));
  fireEvent.click(await screen.findByText('Retry saving answer'));
  await waitFor(() => expect(screen.getByText(/Preference saved\./)).toBeInTheDocument());
  expect(choose.mock.calls[0][1]).toEqual(choose.mock.calls[1][1]);
  expect(stored.canonical_model.preferences).toHaveLength(1);
  view.unmount();
  render(<SavedWorkspace {...props} />);
  expect(await screen.findByText('1 saved preferences')).toBeInTheDocument();
});
it('reloads a stale decision and preserves the draft for deliberate resubmission', async () => {
  let stored = fixture();
  const repository: DecisionRepository = { applyExploration: vi.fn(), saveContext: vi.fn(), get: vi.fn(async () => structuredClone(stored)), list: vi.fn(async () => [structuredClone(stored)]), create: vi.fn(), setContenders: vi.fn(), archive: vi.fn(), choose: vi.fn(async () => { stored.revision = 1; throw { code: '40001', message: 'stale' }; }) };
  history.replaceState({}, '', '/?decision=saved-watch');
  render(<SavedWorkspace repository={repository} ownerId="owner" email="owner@example.test" signOut={vi.fn()} />);
  fireEvent.click(await screen.findByText('Compare two', {exact:true}));
  fireEvent.click(await screen.findByText('I prefer this one · Watch A'));
  fireEvent.click(screen.getByText('Save preference'));
  expect(await screen.findByText(/Your draft is preserved/)).toBeInTheDocument();
  expect(screen.getByText('Save preference')).toBeDisabled();
  fireEvent.click(screen.getByText('Use latest revision for this draft'));
  expect(screen.getByText('I prefer this one · Watch A')).toHaveAttribute('aria-pressed','true');
});

it('repairs an existing empty decision from a natural list and unlocks saved comparisons', async () => {
  let stored = fixture(); stored.canonical_model.candidates = [];
  stored.description = "Help may choose a watch to buy. I'm looking at the Omega Speedmaster, the Hamilton Field Khaki, the Orient Bambino, the Tudor Black Bay, and the Christopher Ward Biscay GMT.";
  const repository: DecisionRepository = {
    applyExploration: vi.fn(), saveContext: vi.fn(), get: vi.fn(async () => structuredClone(stored)), list: vi.fn(async () => [structuredClone(stored)]), create: vi.fn(), archive: vi.fn(), choose: vi.fn(),
    setContenders: vi.fn(async (_id, command) => {
      stored = { ...stored, revision: 1, canonical_model: { ...stored.canonical_model, revision: 1, candidates: command.candidates.map(candidate => ({ ...candidate, attributes: {}, provisional: false })) } };
      return structuredClone(stored);
    }),
  };
  history.replaceState({}, '', '/?decision=saved-watch');
  const props = { repository, ownerId: 'owner', email: 'owner@example.test', signOut: vi.fn() };
  const view = render(<SavedWorkspace {...props} />);
  expect(await screen.findByDisplayValue('Omega Speedmaster')).toBeInTheDocument();
  expect(screen.getByDisplayValue('Christopher Ward Biscay GMT')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Save contenders', { exact: true }));
  expect(await screen.findByText('Compare two', {exact:true})).toBeEnabled();
  expect(stored.canonical_model.candidates).toHaveLength(5);
  view.unmount(); render(<SavedWorkspace {...props} />);
  expect(await screen.findByText('5 contenders to explore')).toBeInTheDocument();
  expect(screen.getByText('Edit contenders')).toBeInTheDocument();
});
it('keeps an actionable editor when a prompt contains no supplied contenders', async () => {
  const stored = fixture(); stored.canonical_model.candidates = [];
  const repository: DecisionRepository = { applyExploration: vi.fn(), saveContext: vi.fn(), get: vi.fn(async () => stored), list: vi.fn(async () => [stored]), create: vi.fn(), archive: vi.fn(), choose: vi.fn(), setContenders: vi.fn() };
  history.replaceState({}, '', '/?decision=saved-watch');
  render(<SavedWorkspace repository={repository} ownerId="owner" email="owner@example.test" signOut={vi.fn()} />);
  fireEvent.click(await screen.findByText('+ Add contender'));
  expect(screen.getByLabelText('Contender 1')).toBeInTheDocument();
});

it('saves a guided experiment with response-loss retry and restores the learned insight on refresh',async()=>{
  let stored=fixture();stored.canonical_model.context={purpose:'Everyday wear',budget:'600',currency:'USD',region:'US'};
  let lost=true;
  const applyExploration=vi.fn(async(_id,command)=>{
    if(!stored.canonical_model.preferences.some(item=>item.id===command.actionId)) {
      stored={...stored,revision:stored.revision+1,canonical_model:{...stored.canonical_model,revision:stored.revision+1,preferences:[...stored.canonical_model.preferences,{id:command.actionId,kind:'judgment',payload:command.payload,provenance:'user-stated'}]}};
    }
    if(lost){lost=false;throw new Error('Response lost');}
    return structuredClone(stored);
  });
  const repository:DecisionRepository={applyExploration,saveContext:vi.fn(),get:vi.fn(async()=>structuredClone(stored)),list:vi.fn(async()=>[structuredClone(stored)]),create:vi.fn(),setContenders:vi.fn(),choose:vi.fn(),archive:vi.fn()};
  history.replaceState({},'','/?decision=saved-watch');const props={repository,ownerId:'owner',email:'owner@example.test',signOut:vi.fn()};const view=render(<SavedWorkspace {...props}/>);
  fireEvent.click(await screen.findByText('What if',{exact:true}));fireEvent.click((await screen.findAllByText('Try this experiment'))[0]);fireEvent.click(screen.getByRole('button',{name:'Watch B',exact:true}));fireEvent.click(screen.getByText('Save this insight'));
  fireEvent.click(await screen.findByText('Retry saving answer'));expect(await screen.findByText('Continue with my decision')).toBeInTheDocument();
  expect(applyExploration.mock.calls[0][1]).toEqual(applyExploration.mock.calls[1][1]);expect(stored.canonical_model.preferences).toHaveLength(1);expect(stored.canonical_model.context?.budget).toBe('600');
  view.unmount();render(<SavedWorkspace {...props}/>);fireEvent.click(await screen.findByText('What if',{exact:true}));expect(await screen.findByText('Insight saved',{exact:true})).toBeInTheDocument();expect(screen.getByText(/If you only used it occasionally: Under this condition, you would choose Watch B/)).toBeInTheDocument();
});
