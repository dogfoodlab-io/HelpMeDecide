import type { DecisionType } from "./types";

export interface LaunchTemplate {
  id: string;
  label: string;
  decisionType: DecisionType;
  promptSeed: string;
}

export const launchTemplates: LaunchTemplate[] = [
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
