import {createProductRepository} from './products';
import type {ProductCommand} from '../domain/productEvidence.generated';
import { experimentLearning } from '../domain/whatIf';
import type { WhatIfAnswer } from '../domain/exploration.generated';
import { scenarioName } from '../domain/scenarioNames';
import type { ExerciseCommand } from '../domain/exploration';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { suppliedContenders, contenderTitle } from '../domain/purchaseIntake';
import { createDecisionFromPrompt } from '../domain/promptParser';
import type { PairwiseChoice, PreferenceObservation, PurchaseDecisionModel } from '../domain/purchaseDecision';

export interface SavedDecision {
  id: string;
  title: string;
  description: string;
  revision: number;
  canonical_model: PurchaseDecisionModel;
  archived_at: string | null;
  updated_at: string;
}
export interface PairwiseCommand {
  actionId: string;
  expectedRevision: number;
  leftId: string;
  rightId: string;
  choice: PairwiseChoice;
}
export interface ContenderCommand { actionId: string; expectedRevision: number; candidates: Array<{ id: string; label: string }> }
export interface DecisionRepository {
  applyProduct?(id: string, command: ProductCommand): Promise<SavedDecision>;
  applyExploration(id: string, command: ExerciseCommand): Promise<SavedDecision>;
  saveContext(id: string, command: {actionId: string; expectedRevision: number; context: Record<string,string>}): Promise<SavedDecision>;
  setContenders(id: string, command: ContenderCommand): Promise<SavedDecision>;
  list(): Promise<SavedDecision[]>;
  get(id: string): Promise<SavedDecision>;
  create(id: string, prompt: string, ownerId: string): Promise<SavedDecision>;
  choose(id: string, command: PairwiseCommand): Promise<SavedDecision>;
  archive(id: string, archived: boolean): Promise<void>;
}
export function initialPurchaseModel(prompt: string, ownerId: string): PurchaseDecisionModel {
  const parsed = createDecisionFromPrompt({ prompt, ownerId, now: new Date().toISOString() });
  return {
    revision: 0, goal: parsed.map.goal, useCases: [],
    context: initialContext(prompt),
    constraints: parsed.map.constraints.map((label, i) => ({ id: `constraint-${i}`, label, required: true, provenance: 'inferred' })),
    candidates: suppliedContenders(prompt),
    preferences: [],
  };
}
export function initialContext(prompt:string):Record<string,string>{
  const result:Record<string,string>={};
  const budget=prompt.match(/\b(?:under|below|up to|maximum(?: of)?|budget(?: of)?)\s*[$€£]?\s*(\d[\d,]*(?:\.\d+)?)/i);if(budget)result.budget=budget[1].replace(/,/g,'');
  const currency=prompt.match(/\b(USD|EUR|GBP|CAD|AUD|JPY)\b/i);if(currency)result.currency=currency[1].toUpperCase();
  const region=prompt.match(/\b(United States|United Kingdom|Canada|Australia|Japan)\b/i);if(region)result.region=region[1];
  const purpose=prompt.match(/\bfor\s+(.+?)(?=\s+(?:under|below|up to)\b|[.!]|$)/i);if(purpose)result.purpose=purpose[1].trim();
  return result;
}
const fields = 'id,title,description,revision,canonical_model,archived_at,updated_at';
export function createDecisionRepository(client: SupabaseClient): DecisionRepository {
  const get = async (id: string): Promise<SavedDecision> => {
    const { data, error } = await client.from('decisions').select(fields).eq('id', id).single();
    if (error) throw error;
    return data as unknown as SavedDecision;
  };
  return {
    get,
    async applyProduct(id,command){await createProductRepository(client).apply(id,command);return get(id);},
    async applyExploration(id, command) {
      const {error} = command.type==='answer-what-if'
        ? await client.rpc('answer_what_if', {p_decision_id:id,p_action_id:command.actionId,p_revision:command.expectedRevision,p_payload:command.payload})
        : await client.rpc('apply_exploration_command', {p_decision_id:id,p_action_id:command.actionId,p_expected_revision:command.expectedRevision,p_type:command.type,p_payload:command.payload});
      if(error) throw error;
      return get(id);
    },
    async saveContext(id, command) {
      const {error} = await client.rpc('set_purchase_context', {p_decision_id:id,p_action_id:command.actionId,p_revision:command.expectedRevision,p_context:command.context});
      if(error) throw error;
      return get(id);
    },
    async setContenders(id, command) {
      const { error } = await client.rpc('set_decision_contenders', {
        p_decision_id: id, p_action_id: command.actionId,
        p_expected_revision: command.expectedRevision, p_candidates: command.candidates,
      });
      if (error) throw error;
      return get(id);
    },
    async list() {
      const { data, error } = await client.from('decisions').select(fields).order('updated_at', { ascending: false });
      if (error) throw error;
      return data as unknown as SavedDecision[];
    },
    async create(id, prompt, ownerId) {
      const model = initialPurchaseModel(prompt, ownerId);
      const { error } = await client.from('decisions').insert({ id, user_id: ownerId, title: contenderTitle(model.candidates, model.goal), description: prompt, status: 'active', canonical_model: model });
      // Retrying after an uncertain network response uses the same decision ID.
      if (error && error.code !== '23505') throw error;
      return get(id);
    },
    async choose(id, command) {
      const { data, error } = await client.rpc('apply_decision_command', {
        p_decision_id: id, p_action_id: command.actionId, p_expected_revision: command.expectedRevision,
        p_command_type: 'pairwise', p_payload: { leftId: command.leftId, rightId: command.rightId, choice: command.choice },
      });
      if (error) throw error;
      // Read the current model, including any subsequently committed commands.
      const decision = await get(id);
      if (decision.revision < (data as { revision: number }).revision) throw new Error('The saved decision could not be reloaded. Retry to check it.');
      return decision;
    },
    async archive(id, archived) {
      const { data, error } = await client.from('decisions').update({ archived_at: archived ? new Date().toISOString() : null }).eq('id', id).select('id').single();
      if (error) throw error;
      if (!data) throw new Error('Decision not found.');
    },
  };
}

export function describePreference(preference: PreferenceObservation, model: PurchaseDecisionModel): string {
  const label = (id: unknown) => model.candidates.find(candidate => candidate.id === id)?.label ?? 'Unknown contender';
  if (preference.kind === 'criteria-rank' || preference.kind === 'candidate-rank') {
    const ids = preference.payload.orderedIds as string[];
    const criteria = (preference.payload.criteria ?? model.criteria ?? []) as Array<{id:string;label:string}>;
    return `${preference.kind === 'criteria-rank' ? 'Priority order' : 'Contender order'}: ${ids.map(id => preference.kind === 'criteria-rank' ? criteria.find(item=>item.id===id)?.label ?? id : label(id)).join(' → ')}.`;
  }
  if (preference.kind === 'scenario') {
    const scenario=model.scenarios?.find(item=>item.id===preference.payload.scenarioId);
    return `Applied scenario: ${scenario?scenarioName(model,scenario):'scenario no longer available'}. Assumed values remain assumptions.`;
  }
  if (preference.kind === 'judgment'&&preference.payload.whatIf===true) return `${preference.provenance==='superseded'?'Earlier answer · ':''}${String(preference.payload.title)}: ${experimentLearning(model,preference.payload as unknown as WhatIfAnswer).insight}`;
  if (preference.kind === 'judgment') return String(preference.payload.judgment ?? preference.payload.text ?? 'Tradeoff judgment saved.');
  const { leftId, rightId, choice } = preference.payload;
  if (choice === 'left' || choice === 'right') return `You preferred ${label(choice === 'left' ? leftId : rightId)} over ${label(choice === 'left' ? rightId : leftId)}.`;
  if (choice === 'tie') return `${label(leftId)} and ${label(rightId)} felt equally appealing.`;
  if (choice === 'neither') return `Neither ${label(leftId)} nor ${label(rightId)} felt right. Explore alternatives.`;
  return `You were unsure between ${label(leftId)} and ${label(rightId)}. More experience or evidence could help.`;
}

export function configuredClient(): SupabaseClient | null {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  const url = env?.VITE_SUPABASE_URL;
  const key = env?.VITE_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createClient(url, key) : null;
}
