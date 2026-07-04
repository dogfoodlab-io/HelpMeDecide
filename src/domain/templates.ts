import type { DecisionType } from "./types";

export interface LaunchTemplate {
  id: string;
  label: string;
  decisionType: DecisionType;
  promptSeed: string;
}

export interface ComposerTemplateChip {
  id: string;
  label: string;
  decisionType: DecisionType;
  promptSeed: string;
}

export const composerTemplateChips: readonly ComposerTemplateChip[] = [
  {
    id: "choose-as-group",
    label: "Choose as a group",
    decisionType: "social",
    promptSeed: "Help my group choose between options and capture everyone's preferences.",
  },
  {
    id: "compare-options",
    label: "Compare options",
    decisionType: "personal",
    promptSeed: "Help me compare options using criteria, tradeoffs, and confidence.",
  },
  {
    id: "research-decision",
    label: "Research a decision",
    decisionType: "professional",
    promptSeed: "Help me research a decision with evidence, citations, and uncertainty.",
  },
  {
    id: "name-creative-direction",
    label: "Pick a name or creative direction",
    decisionType: "creative",
    promptSeed: "Help me choose between names, concepts, or creative directions.",
  },
  {
    id: "trip-event",
    label: "Plan a trip or event",
    decisionType: "travel",
    promptSeed: "Help my group choose a trip, event plan, destination, or itinerary.",
  },
  {
    id: "personal-decision",
    label: "Make a personal decision",
    decisionType: "personal",
    promptSeed: "Help me make a personal decision with clear tradeoffs and next steps.",
  },
  {
    id: "team-decision",
    label: "Make a team decision",
    decisionType: "team",
    promptSeed: "Help my team make a decision with stakeholder input and a clear rationale.",
  },
];

export const launchTemplates: readonly LaunchTemplate[] = [
  {
    id: "creative-direction",
    label: "Choose a name or creative direction",
    decisionType: "creative",
    promptSeed: "Help me choose between names, concepts, or creative directions.",
  },
  {
    id: "restaurant-activity",
    label: "Pick a restaurant or activity",
    decisionType: "social",
    promptSeed: "Help my group pick a restaurant, activity, or shared plan.",
  },
  {
    id: "group-trip",
    label: "Plan a group trip",
    decisionType: "travel",
    promptSeed: "Help my group choose a destination or itinerary.",
  },
  {
    id: "vendors-tools",
    label: "Compare vendors or tools",
    decisionType: "professional",
    promptSeed: "Help our team compare vendors, agencies, venues, or tools.",
  },
  {
    id: "personal-options",
    label: "Decide between personal options",
    decisionType: "personal",
    promptSeed: "Help me compare personal options with clear tradeoffs.",
  },
  {
    id: "team-preference",
    label: "Make a team preference decision",
    decisionType: "team",
    promptSeed:
      "Help my team make a preference-heavy decision with input from stakeholders.",
  },
];
