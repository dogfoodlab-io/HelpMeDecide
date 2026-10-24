import type { Criterion, Dimension, Quantity, Scenario } from './exploration';
export type EvidenceProvenance = "user-stated" | "inferred" | "researched" | "accepted" | "corrected" | "superseded";
export type Verdict = "pass" | "fail" | "unknown";
export type PairwiseChoice = "left" | "right" | "tie" | "neither" | "unsure";

export interface PurchaseConstraint {
  id: string;
  label: string;
  required: boolean;
  provenance: EvidenceProvenance;
}

export interface PurchaseCandidate {
  sourceFindingId?: string;
  id: string;
  label: string;
  url?: string;
  price?: { amount: number; currency: string; observedAt: string; provenance?: EvidenceProvenance };
  quantities?: Record<string, Quantity>;
  attributes: Record<string, string | number | null>;
  provisional: boolean;
}

export interface PreferenceObservation {
  id: string;
  kind: "pairwise" | "criteria-rank" | "candidate-rank" | "scenario" | "judgment";
  payload: Record<string, unknown>;
  provenance: EvidenceProvenance;
  context?: string;
}

export interface PurchaseDecisionModel {
  finalChoice?: import('../services/briefs').FinalChoice;
  criteria?: Criterion[];
  dimensions?: Dimension[];
  scenarios?: Scenario[];
  activeScenarioId?: string;
  selectedAxes?: string[];
  skippedExercises?: string[];
  reflections?: Array<{perspective: string; text: string}>;
  context?: Record<string, string>;
  revision: number;
  goal: string;
  purpose?: string;
  useCases: string[];
  region?: string;
  currency?: string;
  budget?: { amount: number; hardLimit: boolean };
  constraints: PurchaseConstraint[];
  candidates: PurchaseCandidate[];
  preferences: PreferenceObservation[];
}

export interface CandidateAssessment {
  candidateId: string;
  constraints: Record<string, Verdict>;
}

export type PurchaseRecommendation =
  | { outcome: "buy"; candidateIds: string[]; rationale: string[]; unknowns: string[] }
  | { outcome: "wait" | "dont-buy" | "investigate-further"; candidateIds: string[]; rationale: string[]; unknowns: string[] };

export function assessConstraint(value: unknown, constraint: PurchaseConstraint): Verdict {
  if (value === undefined || value === null || value === "") return "unknown";
  if (constraint.required && value === false) return "fail";
  return "pass";
}

export function findDominatedCandidates(
  candidates: PurchaseCandidate[],
  axes: Array<{ key: string; direction: "higher" | "lower" }>,
): string[] {
  const dominates = (a: PurchaseCandidate, b: PurchaseCandidate) => {
    let strictlyBetter = false;
    for (const axis of axes) {
      const av = axis.key === "price" ? a.price?.amount : a.attributes[axis.key];
      const bv = axis.key === "price" ? b.price?.amount : b.attributes[axis.key];
      if (typeof av !== "number" || typeof bv !== "number" || !Number.isFinite(av) || !Number.isFinite(bv)) return false;
      if (axis.key === "price" && (!a.price?.currency || a.price.currency !== b.price?.currency)) return false;
      const better = axis.direction === "higher" ? av >= bv : av <= bv;
      if (!better) return false;
      if (av !== bv) strictlyBetter = true;
    }
    return strictlyBetter;
  };
  return candidates.filter((candidate) => candidates.some((other) => other.id !== candidate.id && dominates(other, candidate))).map(({ id }) => id);
}

export function applyPairwiseObservation(
  model: PurchaseDecisionModel,
  input: { actionId: string; expectedRevision: number; leftId: string; rightId: string; choice: PairwiseChoice; context?: string },
): PurchaseDecisionModel {
  const previousAction = model.preferences.find((item) => item.id === input.actionId);
  if (previousAction) {
    const samePayload = previousAction.kind === "pairwise"
      && previousAction.payload.leftId === input.leftId
      && previousAction.payload.rightId === input.rightId
      && previousAction.payload.choice === input.choice
      && previousAction.context === input.context;
    if (!samePayload) throw new Error("Action ID is already used for a different command.");
    return model;
  }
  if (input.expectedRevision !== model.revision) throw new Error("This comparison is out of date. Refresh the decision and try again.");
  const ids = new Set(model.candidates.map(({ id }) => id));
  if (!ids.has(input.leftId) || !ids.has(input.rightId) || input.leftId === input.rightId) throw new Error("Choose two different candidates in this decision.");
  return {
    ...model,
    revision: model.revision + 1,
    preferences: [...model.preferences, {
      id: input.actionId,
      kind: "pairwise",
      payload: { leftId: input.leftId, rightId: input.rightId, choice: input.choice },
      provenance: "user-stated",
      context: input.context,
    }],
  };
}
