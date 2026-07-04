export type DecisionType =
  | "creative"
  | "social"
  | "travel"
  | "professional"
  | "personal"
  | "team";

export type DecisionStakes = "low" | "medium" | "high";
export type DecisionStatus =
  | "draft"
  | "collecting-inputs"
  | "running-workflow"
  | "decided";
export type Visibility = "private" | "share-link" | "team";
export type InputLane = "opinion" | "data" | "ai-thinking" | "context";
export type FrameworkType =
  | "weighted-scoring"
  | "ranked-choice"
  | "pairwise-comparison"
  | "owner-decides-with-input";
export type CollaboratorRole = "owner" | "participant" | "viewer";

export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
}

export interface Criterion {
  id: string;
  label: string;
  weight: number;
}

export interface Stakeholder {
  id: string;
  name: string;
  role: CollaboratorRole;
}

export interface EvidenceItem {
  id: string;
  summary: string;
  sourceUrl?: string;
  citationLabel?: string;
  verified: boolean;
}

export interface OpinionItem {
  id: string;
  collaboratorId: string;
  summary: string;
  sentiment: "support" | "concern" | "neutral";
}

export interface DecisionMap {
  goal: string;
  options: DecisionOption[];
  criteria: Criterion[];
  constraints: string[];
  stakeholders: Stakeholder[];
  evidence: EvidenceItem[];
  opinions: OpinionItem[];
  assumptions: string[];
  risks: string[];
  openQuestions: string[];
  confidence: number;
  uncertainty: string[];
}

export interface Decision {
  id: string;
  prompt: string;
  ownerId: string;
  status: DecisionStatus;
  decisionType: DecisionType;
  stakes: DecisionStakes;
  visibility: Visibility;
  map: DecisionMap;
  createdAt: string;
  updatedAt: string;
}

export interface InputItem {
  id: string;
  lane: InputLane;
  title: string;
  body: string;
  sourceUrl?: string;
  verified?: boolean;
  createdBy: string;
  createdAt: string;
}

export interface FrameworkRecommendation {
  type: FrameworkType;
  reason: string;
  assumptions: string[];
}

export interface FrameworkRun {
  id: string;
  type: FrameworkType;
  status: "configured" | "collecting" | "complete";
  recommendation: FrameworkRecommendation;
  results: FrameworkResult | null;
}

export interface RankedOption {
  optionId: string;
  label: string;
  score: number;
  rank: number;
}

export interface FrameworkResult {
  winnerId: string | null;
  rankedOptions: RankedOption[];
  explanation: string;
  inspectableCalculations: string[];
}

export interface Dossier {
  decisionId: string;
  summary: string;
  recommendedOption: string;
  rankedOptions: RankedOption[];
  rationale: string[];
  evidenceSummary: string[];
  opinionSummary: string[];
  dissent: string[];
  risksAndAssumptions: string[];
  uncertainty: string[];
  nextSteps: string[];
  citations: EvidenceItem[];
}

export interface Collaborator {
  id: string;
  name: string;
  role: CollaboratorRole;
  permissions: CollaboratorPermission[];
  responseState: "invited" | "started" | "submitted";
}

export type CollaboratorPermission =
  | "read-context"
  | "add-options"
  | "answer-prompts"
  | "vote"
  | "comment"
  | "flag-concerns"
  | "view-outcome";
