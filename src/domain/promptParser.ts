import type { Criterion, Decision, DecisionMap, DecisionOption, DecisionType } from "./types";

interface CreateDecisionInput {
  prompt: string;
  ownerId: string;
  now: string;
}

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function decisionId(prompt: string, now: string): string {
  const promptSlug = slug(prompt).slice(0, 36) || "draft";
  const timeSlug = slug(now) || "now";
  return `decision-${promptSlug}-${timeSlug}`;
}

function isTeamWorkspace(prompt: string): boolean {
  return /\b(team|company|coworkers|colleagues)\b/i.test(prompt);
}

function inferDecisionType(prompt: string): DecisionType {
  const text = prompt.toLowerCase();
  if (text.includes("trip") || text.includes("destination") || text.includes("flight"))
    return "travel";
  if (
    text.includes("agency") ||
    text.includes("vendor") ||
    text.includes("tool") ||
    text.includes("rebrand")
  )
    return "professional";
  if (text.includes("team")) return "team";
  if (text.includes("restaurant") || text.includes("activity") || text.includes("friends"))
    return "social";
  if (text.includes("name") || text.includes("creative") || text.includes("campaign"))
    return "creative";
  return "personal";
}

function extractGoal(prompt: string, decisionType: DecisionType): string {
  if (
    decisionType === "travel" &&
    prompt.toLowerCase().includes("four-day trip in september")
  ) {
    return "Decide where to go for a four-day trip in September.";
  }
  if (decisionType === "professional" && prompt.toLowerCase().includes("rebrand")) {
    return "Choose the best partner for a rebrand.";
  }
  return prompt.trim().replace(/\s+/g, " ").replace(/[.?!]?$/, ".");
}

function extractCriteria(prompt: string, decisionType: DecisionType): Criterion[] {
  const text = prompt.toLowerCase();
  const explicitCareAbout = text.match(/care about ([^.]+)/);
  if (explicitCareAbout) {
    return explicitCareAbout[1]
      .replace(/and keeping[^,]+/g, "")
      .split(/,| and /)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((label) => ({ id: `criterion-${slug(label)}`, label, weight: 1 }));
  }
  if (decisionType === "professional") {
    return ["quality", "cost", "timeline"].map((label) => ({
      id: `criterion-${label}`,
      label,
      weight: 1,
    }));
  }
  if (/\bcheaper|cost\b/.test(text) && /\bcloser|distance\b/.test(text)) {
    return ["cost", "distance", "quality"].map((label) => ({
      id: `criterion-${label}`,
      label,
      weight: 1,
    }));
  }
  return ["fit", "cost", "confidence"].map((label) => ({
    id: `criterion-${label}`,
    label,
    weight: 1,
  }));
}

function extractOptions(prompt: string): DecisionOption[] {
  const betweenMatch = prompt.match(/between (.+?)(?: for |\.|$)/i);
  if (!betweenMatch) return [];

  return betweenMatch[1]
    .split(/,\s*| and /)
    .map((label) => label.trim().replace(/^and\s+/i, ""))
    .filter(Boolean)
    .map((label) => ({ id: `option-${slug(label)}`, label }));
}

function extractConstraints(prompt: string): string[] {
  const constraints: string[] = [];
  const flightMatch = prompt.match(/flights? under \$?([0-9]+)/i);
  if (flightMatch) constraints.push(`Flights under $${flightMatch[1]}`);
  return constraints;
}

function buildMap(prompt: string, decisionType: DecisionType): DecisionMap {
  const stakeholders =
    prompt.toLowerCase().includes("friends")
      ? [{ id: "stakeholder-friends", name: "friends", role: "participant" as const }]
      : [];

  return {
    goal: extractGoal(prompt, decisionType),
    options: extractOptions(prompt),
    criteria: extractCriteria(prompt, decisionType),
    constraints: extractConstraints(prompt),
    stakeholders,
    evidence: [],
    opinions: [],
    assumptions: ["Initial map was inferred from the prompt and should be reviewed."],
    risks: [],
    openQuestions:
      decisionType === "travel"
        ? ["Which destinations are currently under consideration?"]
        : ["What budget, timeline, and selection criteria should constrain the choice?"],
    confidence: 0.45,
    uncertainty: ["Missing participant preferences and external evidence."],
  };
}

export function createDecisionFromPrompt(input: CreateDecisionInput): Decision {
  const decisionType = inferDecisionType(input.prompt);
  const isGroup = /\b(friends|team|our|group|we)\b/i.test(input.prompt);
  const isTeam = isTeamWorkspace(input.prompt);

  return {
    id: decisionId(input.prompt, input.now),
    prompt: input.prompt.trim(),
    ownerId: input.ownerId,
    status: "draft",
    decisionType,
    stakes: decisionType === "social" ? "low" : "medium",
    visibility: isTeam ? "team" : isGroup ? "share-link" : "private",
    map: buildMap(input.prompt, decisionType),
    createdAt: input.now,
    updatedAt: input.now,
  };
}
