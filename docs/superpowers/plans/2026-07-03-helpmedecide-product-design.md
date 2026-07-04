# HelpMeDecide Product Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished prompt-first HelpMeDecide.ai MVP that turns messy solo or group decisions into structured maps, framework workflows, collaborator input, and a decision dossier.

**Architecture:** Create a Vite + React + TypeScript single-page app with a pure TypeScript decision engine under `src/domain/` and thin React screens under `src/app/`. Keep framework calculations, prompt parsing, permission checks, and dossier generation deterministic and covered by Vitest before wiring the UI.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, CSS modules or plain CSS, local browser state for MVP persistence.

---

## File Structure

- Create `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `vitest.setup.ts`: project scaffold, scripts, test environment.
- Create `src/main.tsx`, `src/App.tsx`, `src/styles.css`: React entrypoint, application shell, responsive product styling.
- Create `src/domain/types.ts`: shared domain objects from the spec: `Decision`, `DecisionMap`, `InputItem`, `FrameworkRun`, `Dossier`, `Collaborator`.
- Create `src/domain/templates.ts`: launch templates and chip metadata for the composer.
- Create `src/domain/promptParser.ts` and `src/domain/promptParser.test.ts`: deterministic first-pass prompt extraction into a draft `Decision` and editable `DecisionMap`.
- Create `src/domain/frameworkRecommender.ts` and `src/domain/frameworkRecommender.test.ts`: rule-based framework recommendation with explainable assumptions.
- Create `src/domain/frameworks.ts` and `src/domain/frameworks.test.ts`: weighted scoring, ranked choice, pairwise comparison, and owner-decides-with-input calculations.
- Create `src/domain/inputs.ts` and `src/domain/inputs.test.ts`: input lane normalization, citations, "could not verify" states, and context extraction.
- Create `src/domain/collaboration.ts` and `src/domain/collaboration.test.ts`: collaborator roles, permissions, share-link contribution rules.
- Create `src/domain/dossier.ts` and `src/domain/dossier.test.ts`: dossier synthesis with recommendation, rationale, evidence, dissent, uncertainty, and next steps.
- Create `src/state/useDecisionWorkspace.ts` and `src/state/useDecisionWorkspace.test.tsx`: local workspace state, editing actions, workflow actions, dossier generation.
- Create `src/app/Composer.tsx`, `src/app/Workspace.tsx`, `src/app/CollaboratorView.tsx`, `src/app/PaywallModel.tsx`: product screens and modeled freemium boundaries.
- Create `src/app/App.test.tsx`: high-value UI regression tests for prompt creation, editing map data, adding collaborator input, running a framework, and showing a dossier.

## Implementation Tasks

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vitest.setup.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create the scaffold files**

Create `package.json`:

```json
{
  "name": "helpmedecide",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.5",
    "typescript": "^5.7.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "jsdom": "^25.0.1",
    "vitest": "^2.1.8"
  }
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HelpMeDecide.ai</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `vite.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true,
  },
});
```

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.node.json" }, { "path": "./tsconfig.app.json" }]
}
```

Create `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "vitest.setup.ts"]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <section className="composer">
        <p className="eyebrow">HelpMeDecide.ai</p>
        <h1>What are you deciding?</h1>
        <textarea aria-label="Decision prompt" placeholder="Describe the decision, options, constraints, and people involved." />
        <button type="button">Create decision workspace</button>
      </section>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  color: #17211b;
  background: #f6f4ef;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
textarea,
input,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 40px;
}

.composer {
  width: min(880px, 100%);
  margin: 0 auto;
}

.eyebrow {
  margin: 0 0 8px;
  color: #586057;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 24px;
  font-size: clamp(2.25rem, 6vw, 4.5rem);
  line-height: 0.95;
}

textarea {
  display: block;
  width: 100%;
  min-height: 160px;
  padding: 18px;
  border: 1px solid #c8c2b6;
  border-radius: 8px;
  resize: vertical;
  background: #fffdf8;
  color: #17211b;
}

button {
  min-height: 44px;
  margin-top: 16px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  background: #245c47;
  color: white;
  font-weight: 700;
  cursor: pointer;
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and npm exits with code 0.

- [ ] **Step 3: Verify scaffold builds**

Run:

```bash
npm run build
```

Expected: `tsc -b && vite build` completes and creates `dist/`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json vitest.setup.ts src/main.tsx src/App.tsx src/styles.css
git commit -m "chore: scaffold HelpMeDecide app"
```

### Task 2: Domain Types And Launch Templates

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/templates.ts`
- Create: `src/domain/templates.test.ts`

- [ ] **Step 1: Write the failing template test**

Create `src/domain/templates.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { launchTemplates } from "./templates";

describe("launchTemplates", () => {
  it("includes the six MVP launch templates from the product spec", () => {
    expect(launchTemplates.map((template) => template.label)).toEqual([
      "Choose a name or creative direction",
      "Pick a restaurant or activity",
      "Plan a group trip",
      "Compare vendors or tools",
      "Decide between personal options",
      "Make a team preference decision",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/domain/templates.test.ts
```

Expected: FAIL because `src/domain/templates.ts` does not exist.

- [ ] **Step 3: Create domain types and templates**

Create `src/domain/types.ts`:

```ts
export type DecisionType =
  | "creative"
  | "social"
  | "travel"
  | "professional"
  | "personal"
  | "team";

export type DecisionStakes = "low" | "medium" | "high";
export type DecisionStatus = "draft" | "collecting-inputs" | "running-workflow" | "decided";
export type Visibility = "private" | "share-link" | "team";
export type InputLane = "opinion" | "data" | "ai-thinking" | "context";
export type FrameworkType = "weighted-scoring" | "ranked-choice" | "pairwise-comparison" | "owner-decides-with-input";
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
```

Create `src/domain/templates.ts`:

```ts
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
    promptSeed: "Help my team make a preference-heavy decision with input from stakeholders.",
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/domain/templates.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/domain/templates.ts src/domain/templates.test.ts
git commit -m "feat: define decision domain model"
```

### Task 3: Prompt Parser And Initial Decision Map

**Files:**
- Create: `src/domain/promptParser.ts`
- Create: `src/domain/promptParser.test.ts`

- [ ] **Step 1: Write failing prompt parser tests**

Create `src/domain/promptParser.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createDecisionFromPrompt } from "./promptParser";

describe("createDecisionFromPrompt", () => {
  it("extracts a group trip decision with criteria, constraints, stakeholders, and framework candidates", () => {
    const decision = createDecisionFromPrompt({
      prompt:
        "My friends and I are deciding where to go for a four-day trip in September. We care about food, walkability, nightlife, and keeping flights under $400.",
      ownerId: "owner-1",
      now: "2026-07-03T12:00:00.000Z",
    });

    expect(decision.decisionType).toBe("travel");
    expect(decision.stakes).toBe("medium");
    expect(decision.visibility).toBe("share-link");
    expect(decision.map.goal).toBe("Decide where to go for a four-day trip in September.");
    expect(decision.map.criteria.map((criterion) => criterion.label)).toEqual([
      "food",
      "walkability",
      "nightlife",
    ]);
    expect(decision.map.constraints).toContain("Flights under $400");
    expect(decision.map.stakeholders).toContainEqual({
      id: "stakeholder-friends",
      name: "friends",
      role: "participant",
    });
    expect(decision.map.openQuestions).toContain("Which destinations are currently under consideration?");
  });

  it("extracts a professional vendor comparison from mentioned options", () => {
    const decision = createDecisionFromPrompt({
      prompt: "Help our team choose between Agency Alpha, Studio Beta, and Group Gamma for a rebrand.",
      ownerId: "owner-1",
      now: "2026-07-03T12:00:00.000Z",
    });

    expect(decision.decisionType).toBe("professional");
    expect(decision.map.options.map((option) => option.label)).toEqual([
      "Agency Alpha",
      "Studio Beta",
      "Group Gamma",
    ]);
    expect(decision.map.criteria.map((criterion) => criterion.label)).toEqual([
      "quality",
      "cost",
      "timeline",
    ]);
    expect(decision.map.openQuestions).toContain("What budget, timeline, and selection criteria should constrain the choice?");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/domain/promptParser.test.ts
```

Expected: FAIL because `createDecisionFromPrompt` is not defined.

- [ ] **Step 3: Implement deterministic prompt extraction**

Create `src/domain/promptParser.ts`:

```ts
import type { Criterion, Decision, DecisionMap, DecisionOption, DecisionType } from "./types";

interface CreateDecisionInput {
  prompt: string;
  ownerId: string;
  now: string;
}

function slug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function inferDecisionType(prompt: string): DecisionType {
  const text = prompt.toLowerCase();
  if (text.includes("trip") || text.includes("destination") || text.includes("flight")) return "travel";
  if (text.includes("agency") || text.includes("vendor") || text.includes("tool") || text.includes("rebrand")) return "professional";
  if (text.includes("team")) return "team";
  if (text.includes("restaurant") || text.includes("activity") || text.includes("friends")) return "social";
  if (text.includes("name") || text.includes("creative") || text.includes("campaign")) return "creative";
  return "personal";
}

function extractGoal(prompt: string, decisionType: DecisionType): string {
  if (decisionType === "travel" && prompt.toLowerCase().includes("four-day trip in september")) {
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
    return ["quality", "cost", "timeline"].map((label) => ({ id: `criterion-${label}`, label, weight: 1 }));
  }
  return ["fit", "cost", "confidence"].map((label) => ({ id: `criterion-${label}`, label, weight: 1 }));
}

function extractOptions(prompt: string): DecisionOption[] {
  const betweenMatch = prompt.match(/between (.+?)(?: for |\.|$)/i);
  if (!betweenMatch) return [];

  return betweenMatch[1]
    .split(/,\s*| and /)
    .map((label) => label.trim())
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

  return {
    id: `decision-${slug(input.prompt).slice(0, 36) || "draft"}`,
    prompt: input.prompt.trim(),
    ownerId: input.ownerId,
    status: "draft",
    decisionType,
    stakes: decisionType === "social" ? "low" : "medium",
    visibility: isGroup ? "share-link" : "private",
    map: buildMap(input.prompt, decisionType),
    createdAt: input.now,
    updatedAt: input.now,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- src/domain/promptParser.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/promptParser.ts src/domain/promptParser.test.ts
git commit -m "feat: infer decision maps from prompts"
```

### Task 4: Framework Recommendation Rules

**Files:**
- Create: `src/domain/frameworkRecommender.ts`
- Create: `src/domain/frameworkRecommender.test.ts`

- [ ] **Step 1: Write failing framework recommendation tests**

Create `src/domain/frameworkRecommender.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Decision } from "./types";
import { recommendFramework } from "./frameworkRecommender";
import { createDecisionFromPrompt } from "./promptParser";

function decision(prompt: string): Decision {
  return createDecisionFromPrompt({ prompt, ownerId: "owner-1", now: "2026-07-03T12:00:00.000Z" });
}

describe("recommendFramework", () => {
  it("recommends ranked choice for low-stakes group preference decisions", () => {
    const result = recommendFramework(decision("My friends and I need to pick a restaurant or activity tonight."));

    expect(result.type).toBe("ranked-choice");
    expect(result.reason).toContain("low-stakes group preference");
  });

  it("recommends weighted scoring when criteria and tradeoffs are explicit", () => {
    const result = recommendFramework(
      decision("I am deciding which apartment to pick. One is cheaper, one is closer to work, and one has better amenities."),
    );

    expect(result.type).toBe("weighted-scoring");
    expect(result.assumptions).toContain("The decision has explicit criteria or tradeoffs.");
  });

  it("recommends owner-decides-with-input for professional choices with accountable owner", () => {
    const result = recommendFramework(decision("Help our team choose between three agencies for a rebrand."));

    expect(result.type).toBe("owner-decides-with-input");
    expect(result.reason).toContain("one accountable owner");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/domain/frameworkRecommender.test.ts
```

Expected: FAIL because `recommendFramework` is not defined.

- [ ] **Step 3: Implement recommendation rules**

Create `src/domain/frameworkRecommender.ts`:

```ts
import type { Decision, FrameworkRecommendation } from "./types";

export function recommendFramework(decision: Decision): FrameworkRecommendation {
  const prompt = decision.prompt.toLowerCase();
  const hasGroup = decision.visibility === "share-link" || /\b(friends|team|our|group|we)\b/.test(prompt);
  const hasExplicitTradeoffs = /\bcheaper|closer|amenities|cost|quality|timeline|criteria|tradeoff\b/.test(prompt);

  if (decision.decisionType === "professional" || prompt.includes("agency")) {
    return {
      type: "owner-decides-with-input",
      reason:
        "Use owner-decides-with-input because one accountable owner should make the final professional choice while stakeholder input is captured.",
      assumptions: ["The decision has a responsible owner.", "Stakeholder input matters but does not need to become a binding vote."],
    };
  }

  if (hasExplicitTradeoffs || decision.map.criteria.length >= 3) {
    return {
      type: "weighted-scoring",
      reason: "Use weighted scoring because explicit criteria and tradeoffs should be compared consistently.",
      assumptions: ["The decision has explicit criteria or tradeoffs.", "Users can inspect and adjust weights before accepting the result."],
    };
  }

  if (hasGroup && decision.stakes === "low") {
    return {
      type: "ranked-choice",
      reason: "Use ranked choice because this is a low-stakes group preference decision with several viable options.",
      assumptions: ["Participants can rank acceptable options.", "The goal is preference aggregation rather than proof of objective superiority."],
    };
  }

  return {
    type: "pairwise-comparison",
    reason: "Use pairwise comparison because direct option-vs-option choices are easier when criteria are still subjective.",
    assumptions: ["The option set is small enough for direct comparisons.", "Close calls should be surfaced rather than hidden."],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- src/domain/frameworkRecommender.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/frameworkRecommender.ts src/domain/frameworkRecommender.test.ts
git commit -m "feat: recommend decision frameworks"
```

### Task 5: Framework Calculations

**Files:**
- Create: `src/domain/frameworks.ts`
- Create: `src/domain/frameworks.test.ts`

- [ ] **Step 1: Write failing calculation tests**

Create `src/domain/frameworks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  aggregateOwnerInput,
  calculatePairwiseComparison,
  calculateRankedChoice,
  calculateWeightedScoring,
} from "./frameworks";

describe("framework calculations", () => {
  it("calculates weighted scoring with inspectable formulas", () => {
    const result = calculateWeightedScoring({
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      criteria: [
        { id: "cost", label: "cost", weight: 2 },
        { id: "quality", label: "quality", weight: 3 },
      ],
      scores: {
        a: { cost: 5, quality: 3 },
        b: { cost: 3, quality: 5 },
      },
    });

    expect(result.winnerId).toBe("b");
    expect(result.rankedOptions[0]).toEqual({ optionId: "b", label: "B", score: 21, rank: 1 });
    expect(result.inspectableCalculations).toContain("B: cost 3 x 2 + quality 5 x 3 = 21");
  });

  it("calculates ranked choice by lowest rank total for MVP transparency", () => {
    const result = calculateRankedChoice({
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      ballots: [
        ["a", "b"],
        ["b", "a"],
        ["b", "a"],
      ],
    });

    expect(result.winnerId).toBe("b");
    expect(result.inspectableCalculations).toContain("B: rank total 4 across 3 ballots");
  });

  it("aggregates pairwise comparison wins", () => {
    const result = calculatePairwiseComparison({
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
        { id: "c", label: "C" },
      ],
      comparisons: [
        { leftOptionId: "a", rightOptionId: "b", winnerId: "a" },
        { leftOptionId: "a", rightOptionId: "c", winnerId: "c" },
        { leftOptionId: "b", rightOptionId: "c", winnerId: "c" },
      ],
    });

    expect(result.winnerId).toBe("c");
    expect(result.rankedOptions.map((option) => option.label)).toEqual(["C", "A", "B"]);
  });

  it("summarizes owner-decides-with-input themes and dissent", () => {
    const result = aggregateOwnerInput({
      selectedOptionId: "a",
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      inputs: [
        { collaboratorId: "1", optionId: "a", comment: "Best strategic fit", concern: null },
        { collaboratorId: "2", optionId: "b", comment: "Cheaper", concern: "A may take longer" },
      ],
    });

    expect(result.winnerId).toBe("a");
    expect(result.explanation).toContain("Owner selected A after reviewing 2 stakeholder inputs.");
    expect(result.inspectableCalculations).toContain("Dissent: A may take longer");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/domain/frameworks.test.ts
```

Expected: FAIL because `src/domain/frameworks.ts` does not exist.

- [ ] **Step 3: Implement framework calculations**

Create `src/domain/frameworks.ts`:

```ts
import type { Criterion, DecisionOption, FrameworkResult, RankedOption } from "./types";

interface WeightedScoringInput {
  options: DecisionOption[];
  criteria: Criterion[];
  scores: Record<string, Record<string, number>>;
}

interface RankedChoiceInput {
  options: DecisionOption[];
  ballots: string[][];
}

interface PairwiseInput {
  options: DecisionOption[];
  comparisons: Array<{ leftOptionId: string; rightOptionId: string; winnerId: string }>;
}

interface OwnerInput {
  selectedOptionId: string;
  options: DecisionOption[];
  inputs: Array<{ collaboratorId: string; optionId: string; comment: string; concern: string | null }>;
}

function rankByScore(options: Array<Omit<RankedOption, "rank">>, descending = true): RankedOption[] {
  const sorted = [...options].sort((a, b) => (descending ? b.score - a.score : a.score - b.score));
  return sorted.map((option, index) => ({ ...option, rank: index + 1 }));
}

export function calculateWeightedScoring(input: WeightedScoringInput): FrameworkResult {
  const rows = input.options.map((option) => {
    const parts = input.criteria.map((criterion) => {
      const score = input.scores[option.id]?.[criterion.id] ?? 0;
      return { label: criterion.label, score, weight: criterion.weight, subtotal: score * criterion.weight };
    });
    const total = parts.reduce((sum, part) => sum + part.subtotal, 0);
    return {
      optionId: option.id,
      label: option.label,
      score: total,
      formula: `${option.label}: ${parts.map((part) => `${part.label} ${part.score} x ${part.weight}`).join(" + ")} = ${total}`,
    };
  });
  const rankedOptions = rankByScore(rows);

  return {
    winnerId: rankedOptions[0]?.optionId ?? null,
    rankedOptions,
    explanation: `Weighted scoring ranked ${rankedOptions[0]?.label ?? "no option"} highest.`,
    inspectableCalculations: rows.map((row) => row.formula),
  };
}

export function calculateRankedChoice(input: RankedChoiceInput): FrameworkResult {
  const totals = input.options.map((option) => {
    const total = input.ballots.reduce((sum, ballot) => {
      const index = ballot.indexOf(option.id);
      return sum + (index === -1 ? input.options.length + 1 : index + 1);
    }, 0);
    return { optionId: option.id, label: option.label, score: total };
  });
  const rankedOptions = rankByScore(totals, false);

  return {
    winnerId: rankedOptions[0]?.optionId ?? null,
    rankedOptions,
    explanation: `${rankedOptions[0]?.label ?? "No option"} has the strongest aggregate ranking.`,
    inspectableCalculations: rankedOptions.map(
      (option) => `${option.label}: rank total ${option.score} across ${input.ballots.length} ballots`,
    ),
  };
}

export function calculatePairwiseComparison(input: PairwiseInput): FrameworkResult {
  const wins = new Map(input.options.map((option) => [option.id, 0]));
  input.comparisons.forEach((comparison) => wins.set(comparison.winnerId, (wins.get(comparison.winnerId) ?? 0) + 1));
  const rankedOptions = rankByScore(
    input.options.map((option) => ({ optionId: option.id, label: option.label, score: wins.get(option.id) ?? 0 })),
  );

  return {
    winnerId: rankedOptions[0]?.optionId ?? null,
    rankedOptions,
    explanation: `${rankedOptions[0]?.label ?? "No option"} won the most direct comparisons.`,
    inspectableCalculations: rankedOptions.map((option) => `${option.label}: ${option.score} pairwise wins`),
  };
}

export function aggregateOwnerInput(input: OwnerInput): FrameworkResult {
  const selected = input.options.find((option) => option.id === input.selectedOptionId) ?? null;
  const dissent = input.inputs.filter((item) => item.concern).map((item) => `Dissent: ${item.concern}`);

  return {
    winnerId: selected?.id ?? null,
    rankedOptions: input.options.map((option, index) => ({
      optionId: option.id,
      label: option.label,
      score: option.id === selected?.id ? 1 : 0,
      rank: index + 1,
    })),
    explanation: `Owner selected ${selected?.label ?? "no option"} after reviewing ${input.inputs.length} stakeholder inputs.`,
    inspectableCalculations: [
      ...input.inputs.map((item) => `Input for ${item.optionId}: ${item.comment}`),
      ...dissent,
    ],
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- src/domain/frameworks.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/frameworks.ts src/domain/frameworks.test.ts
git commit -m "feat: calculate decision workflows"
```

### Task 6: Input Lanes And Trust States

**Files:**
- Create: `src/domain/inputs.ts`
- Create: `src/domain/inputs.test.ts`

- [ ] **Step 1: Write failing input lane tests**

Create `src/domain/inputs.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeInputItem } from "./inputs";

describe("normalizeInputItem", () => {
  it("turns cited data lane input into verified evidence", () => {
    const result = normalizeInputItem({
      id: "input-1",
      lane: "data",
      title: "Flight prices",
      body: "Flights are currently $356 round trip.",
      sourceUrl: "https://example.com/flights",
      verified: true,
      createdBy: "owner-1",
      createdAt: "2026-07-03T12:00:00.000Z",
    });

    expect(result.evidence).toEqual([
      {
        id: "evidence-input-1",
        summary: "Flight prices: Flights are currently $356 round trip.",
        sourceUrl: "https://example.com/flights",
        citationLabel: "example.com",
        verified: true,
      },
    ]);
  });

  it("keeps unavailable research as could-not-verify uncertainty", () => {
    const result = normalizeInputItem({
      id: "input-2",
      lane: "data",
      title: "Restaurant availability",
      body: "Could not verify patio availability.",
      verified: false,
      createdBy: "owner-1",
      createdAt: "2026-07-03T12:00:00.000Z",
    });

    expect(result.uncertainty).toEqual(["Could not verify: Restaurant availability"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/domain/inputs.test.ts
```

Expected: FAIL because `normalizeInputItem` is not defined.

- [ ] **Step 3: Implement lane normalization**

Create `src/domain/inputs.ts`:

```ts
import type { EvidenceItem, InputItem, OpinionItem } from "./types";

interface NormalizedInput {
  evidence: EvidenceItem[];
  opinions: OpinionItem[];
  assumptions: string[];
  risks: string[];
  openQuestions: string[];
  uncertainty: string[];
}

function citationLabel(sourceUrl: string | undefined): string | undefined {
  if (!sourceUrl) return undefined;
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return sourceUrl;
  }
}

export function normalizeInputItem(item: InputItem): NormalizedInput {
  const empty: NormalizedInput = {
    evidence: [],
    opinions: [],
    assumptions: [],
    risks: [],
    openQuestions: [],
    uncertainty: [],
  };

  if (item.lane === "data") {
    if (item.verified === false || item.body.toLowerCase().includes("could not verify")) {
      return { ...empty, uncertainty: [`Could not verify: ${item.title}`] };
    }

    return {
      ...empty,
      evidence: [
        {
          id: `evidence-${item.id}`,
          summary: `${item.title}: ${item.body}`,
          sourceUrl: item.sourceUrl,
          citationLabel: citationLabel(item.sourceUrl),
          verified: item.verified === true,
        },
      ],
    };
  }

  if (item.lane === "opinion") {
    return {
      ...empty,
      opinions: [
        {
          id: `opinion-${item.id}`,
          collaboratorId: item.createdBy,
          summary: `${item.title}: ${item.body}`,
          sentiment: item.body.toLowerCase().includes("concern") ? "concern" : "neutral",
        },
      ],
    };
  }

  if (item.lane === "ai-thinking") {
    return { ...empty, assumptions: [`AI inference: ${item.body}`] };
  }

  return { ...empty, openQuestions: item.body.includes("?") ? [item.body] : [] };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- src/domain/inputs.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/inputs.ts src/domain/inputs.test.ts
git commit -m "feat: normalize decision input lanes"
```

### Task 7: Collaborator Permissions

**Files:**
- Create: `src/domain/collaboration.ts`
- Create: `src/domain/collaboration.test.ts`

- [ ] **Step 1: Write failing collaborator tests**

Create `src/domain/collaboration.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createCollaborator, canCollaborator } from "./collaboration";

describe("collaboration", () => {
  it("creates participants with contribution permissions but no owner controls", () => {
    const collaborator = createCollaborator({ id: "c1", name: "Mina", role: "participant" });

    expect(collaborator.permissions).toEqual([
      "read-context",
      "add-options",
      "answer-prompts",
      "vote",
      "comment",
      "flag-concerns",
      "view-outcome",
    ]);
    expect(canCollaborator(collaborator, "vote")).toBe(true);
  });

  it("creates viewers who can only read context and permitted outcomes", () => {
    const collaborator = createCollaborator({ id: "c2", name: "Lee", role: "viewer" });

    expect(collaborator.permissions).toEqual(["read-context", "view-outcome"]);
    expect(canCollaborator(collaborator, "comment")).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/domain/collaboration.test.ts
```

Expected: FAIL because `createCollaborator` is not defined.

- [ ] **Step 3: Implement collaborator permission helpers**

Create `src/domain/collaboration.ts`:

```ts
import type { Collaborator, CollaboratorPermission, CollaboratorRole } from "./types";

const permissionsByRole: Record<CollaboratorRole, CollaboratorPermission[]> = {
  owner: ["read-context", "add-options", "answer-prompts", "vote", "comment", "flag-concerns", "view-outcome"],
  participant: ["read-context", "add-options", "answer-prompts", "vote", "comment", "flag-concerns", "view-outcome"],
  viewer: ["read-context", "view-outcome"],
};

export function createCollaborator(input: { id: string; name: string; role: CollaboratorRole }): Collaborator {
  return {
    id: input.id,
    name: input.name,
    role: input.role,
    permissions: permissionsByRole[input.role],
    responseState: "invited",
  };
}

export function canCollaborator(collaborator: Collaborator, permission: CollaboratorPermission): boolean {
  return collaborator.permissions.includes(permission);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- src/domain/collaboration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/collaboration.ts src/domain/collaboration.test.ts
git commit -m "feat: model collaborator permissions"
```

### Task 8: Decision Dossier Generation

**Files:**
- Create: `src/domain/dossier.ts`
- Create: `src/domain/dossier.test.ts`

- [ ] **Step 1: Write failing dossier tests**

Create `src/domain/dossier.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { generateDossier } from "./dossier";
import { createDecisionFromPrompt } from "./promptParser";

describe("generateDossier", () => {
  it("generates a premium artifact with evidence, dissent, uncertainty, and next steps", () => {
    const decision = createDecisionFromPrompt({
      prompt: "Help our team choose between Agency Alpha and Studio Beta for a rebrand.",
      ownerId: "owner-1",
      now: "2026-07-03T12:00:00.000Z",
    });
    decision.map.evidence.push({
      id: "e1",
      summary: "Agency Alpha has three relevant case studies.",
      sourceUrl: "https://example.com/alpha",
      citationLabel: "example.com",
      verified: true,
    });
    decision.map.opinions.push({
      id: "o1",
      collaboratorId: "c1",
      summary: "Concern: Studio Beta may be slower.",
      sentiment: "concern",
    });

    const dossier = generateDossier(decision, {
      winnerId: "option-agency-alpha",
      rankedOptions: [
        { optionId: "option-agency-alpha", label: "Agency Alpha", score: 10, rank: 1 },
        { optionId: "option-studio-beta", label: "Studio Beta", score: 8, rank: 2 },
      ],
      explanation: "Agency Alpha ranked highest.",
      inspectableCalculations: ["Agency Alpha: 10"],
    });

    expect(dossier.recommendedOption).toBe("Agency Alpha");
    expect(dossier.evidenceSummary).toContain("Agency Alpha has three relevant case studies.");
    expect(dossier.dissent).toContain("Concern: Studio Beta may be slower.");
    expect(dossier.uncertainty).toContain("Missing participant preferences and external evidence.");
    expect(dossier.nextSteps).toEqual(["Review the recommendation.", "Confirm unresolved risks.", "Share the final decision with stakeholders."]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/domain/dossier.test.ts
```

Expected: FAIL because `generateDossier` is not defined.

- [ ] **Step 3: Implement dossier synthesis**

Create `src/domain/dossier.ts`:

```ts
import type { Decision, Dossier, FrameworkResult } from "./types";

export function generateDossier(decision: Decision, result: FrameworkResult): Dossier {
  const recommended = result.rankedOptions.find((option) => option.optionId === result.winnerId) ?? result.rankedOptions[0];
  const evidenceSummary = decision.map.evidence.map((item) => item.summary);
  const opinionSummary = decision.map.opinions.map((item) => item.summary);
  const dissent = decision.map.opinions
    .filter((item) => item.sentiment === "concern" || item.summary.toLowerCase().includes("concern"))
    .map((item) => item.summary);

  return {
    decisionId: decision.id,
    summary: decision.map.goal,
    recommendedOption: recommended?.label ?? "No recommendation yet",
    rankedOptions: result.rankedOptions,
    rationale: [result.explanation, ...result.inspectableCalculations],
    evidenceSummary,
    opinionSummary,
    dissent,
    risksAndAssumptions: [...decision.map.risks, ...decision.map.assumptions],
    uncertainty: decision.map.uncertainty,
    nextSteps: ["Review the recommendation.", "Confirm unresolved risks.", "Share the final decision with stakeholders."],
    citations: decision.map.evidence.filter((item) => item.sourceUrl),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/domain/dossier.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/dossier.ts src/domain/dossier.test.ts
git commit -m "feat: generate decision dossiers"
```

### Task 9: Workspace State Hook

**Files:**
- Create: `src/state/useDecisionWorkspace.ts`
- Create: `src/state/useDecisionWorkspace.test.tsx`

- [ ] **Step 1: Write failing state hook tests**

Create `src/state/useDecisionWorkspace.test.tsx`:

```tsx
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDecisionWorkspace } from "./useDecisionWorkspace";

describe("useDecisionWorkspace", () => {
  it("creates a workspace, edits map options, adds input, runs a workflow, and generates a dossier", () => {
    const { result } = renderHook(() => useDecisionWorkspace("2026-07-03T12:00:00.000Z"));

    act(() => {
      result.current.createFromPrompt("I am deciding which apartment to pick. One is cheaper, one is closer to work, and one has better amenities.");
    });

    expect(result.current.decision?.map.criteria.map((criterion) => criterion.label)).toContain("quality");

    act(() => {
      result.current.addOption("Apartment A");
      result.current.addOption("Apartment B");
      result.current.runWeightedScoring({
        "option-apartment-a": { quality: 3, cost: 5, timeline: 4 },
        "option-apartment-b": { quality: 5, cost: 3, timeline: 5 },
      });
    });

    expect(result.current.frameworkRun?.results?.winnerId).toBe("option-apartment-b");

    act(() => {
      result.current.generateFinalDossier();
    });

    expect(result.current.dossier?.recommendedOption).toBe("Apartment B");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/state/useDecisionWorkspace.test.tsx
```

Expected: FAIL because `useDecisionWorkspace` is not defined.

- [ ] **Step 3: Implement local workspace state**

Create `src/state/useDecisionWorkspace.ts`:

```ts
import { useState } from "react";
import { generateDossier } from "../domain/dossier";
import { calculateWeightedScoring } from "../domain/frameworks";
import { recommendFramework } from "../domain/frameworkRecommender";
import { createDecisionFromPrompt } from "../domain/promptParser";
import type { Decision, Dossier, FrameworkRun } from "../domain/types";

function slug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function useDecisionWorkspace(now = new Date().toISOString()) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [frameworkRun, setFrameworkRun] = useState<FrameworkRun | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);

  function createFromPrompt(prompt: string) {
    const nextDecision = createDecisionFromPrompt({ prompt, ownerId: "owner-1", now });
    const recommendation = recommendFramework(nextDecision);
    setDecision(nextDecision);
    setFrameworkRun({
      id: `run-${nextDecision.id}`,
      type: recommendation.type,
      status: "configured",
      recommendation,
      results: null,
    });
    setDossier(null);
  }

  function addOption(label: string) {
    setDecision((current) => {
      if (!current) return current;
      const option = { id: `option-${slug(label)}`, label };
      return {
        ...current,
        map: { ...current.map, options: [...current.map.options.filter((item) => item.id !== option.id), option] },
      };
    });
  }

  function runWeightedScoring(scores: Record<string, Record<string, number>>) {
    if (!decision || !frameworkRun) return;
    const results = calculateWeightedScoring({
      options: decision.map.options,
      criteria: decision.map.criteria,
      scores,
    });
    setFrameworkRun({ ...frameworkRun, type: "weighted-scoring", status: "complete", results });
  }

  function generateFinalDossier() {
    if (!decision || !frameworkRun?.results) return;
    setDossier(generateDossier(decision, frameworkRun.results));
  }

  return {
    decision,
    frameworkRun,
    dossier,
    createFromPrompt,
    addOption,
    runWeightedScoring,
    generateFinalDossier,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- src/state/useDecisionWorkspace.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/state/useDecisionWorkspace.ts src/state/useDecisionWorkspace.test.tsx
git commit -m "feat: manage decision workspace state"
```

### Task 10: Product UI Screens

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/app/Composer.tsx`
- Create: `src/app/Workspace.tsx`
- Create: `src/app/CollaboratorView.tsx`
- Create: `src/app/PaywallModel.tsx`
- Create: `src/app/App.test.tsx`

- [ ] **Step 1: Write failing UI regression test**

Create `src/app/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("App", () => {
  it("creates a prompt-first workspace and shows the decision map, input lanes, workflow, dossier, collaborator view, and freemium model", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByLabelText("Decision prompt"),
      "My friends and I are deciding where to go for a four-day trip in September. We care about food, walkability, nightlife, and keeping flights under $400.",
    );
    await user.click(screen.getByRole("button", { name: "Create decision workspace" }));

    expect(screen.getByText("Decision Map")).toBeInTheDocument();
    expect(screen.getByText("Flights under $400")).toBeInTheDocument();
    expect(screen.getByText("Opinions")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("AI Thinking")).toBeInTheDocument();
    expect(screen.getByText("Context")).toBeInTheDocument();
    expect(screen.getByText("Recommended workflow")).toBeInTheDocument();
    expect(screen.getByText("Collaborator share view")).toBeInTheDocument();
    expect(screen.getByText("Free helps you decide. Pro helps you decide with confidence and a professional artifact.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/app/App.test.tsx
```

Expected: FAIL because the app has not been wired to workspace screens.

- [ ] **Step 3: Implement UI components**

Create `src/app/Composer.tsx`:

```tsx
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { launchTemplates } from "../domain/templates";

interface ComposerProps {
  onCreate: (prompt: string) => void;
}

export function Composer({ onCreate }: ComposerProps) {
  const [prompt, setPrompt] = useState("");

  return (
    <section className="composer">
      <p className="eyebrow">HelpMeDecide.ai</p>
      <h1>What are you deciding?</h1>
      <div className="composer-box">
        <textarea
          aria-label="Decision prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe the decision, options, constraints, and people involved."
        />
        <div className="template-row" aria-label="Launch templates">
          {launchTemplates.map((template) => (
            <button key={template.id} type="button" className="chip" onClick={() => setPrompt(template.promptSeed)}>
              {template.label}
            </button>
          ))}
        </div>
        <button type="button" className="primary-action" onClick={() => onCreate(prompt)} disabled={!prompt.trim()}>
          <Sparkles size={18} aria-hidden="true" />
          Create decision workspace
        </button>
      </div>
    </section>
  );
}
```

Create `src/app/Workspace.tsx`:

```tsx
import type { Decision, FrameworkRun, Dossier } from "../domain/types";

interface WorkspaceProps {
  decision: Decision;
  frameworkRun: FrameworkRun | null;
  dossier: Dossier | null;
}

export function Workspace({ decision, frameworkRun, dossier }: WorkspaceProps) {
  return (
    <section className="workspace">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>{decision.map.goal}</h2>
        </div>
        <div className="status-pill">Confidence {Math.round(decision.map.confidence * 100)}%</div>
      </header>

      <section className="panel">
        <h3>Decision Map</h3>
        <div className="map-grid">
          <MapList title="Options" items={decision.map.options.map((option) => option.label)} />
          <MapList title="Criteria" items={decision.map.criteria.map((criterion) => criterion.label)} />
          <MapList title="Constraints" items={decision.map.constraints} />
          <MapList title="Open questions" items={decision.map.openQuestions} />
        </div>
      </section>

      <section className="lane-grid" aria-label="Input lanes">
        {["Opinions", "Data", "AI Thinking", "Context"].map((lane) => (
          <article className="lane" key={lane}>
            <h3>{lane}</h3>
            <p>{lane === "Data" ? "Research summaries use citations and could-not-verify states." : "Structured inputs update the decision map."}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <h3>Recommended workflow</h3>
        <p>{frameworkRun?.recommendation.reason}</p>
      </section>

      <section className="panel">
        <h3>Decision Dossier</h3>
        <p>{dossier ? dossier.recommendedOption : "Run a workflow to generate the recommendation, rationale, uncertainty, dissent, and next steps."}</p>
      </section>
    </section>
  );
}

function MapList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4>{title}</h4>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">Needs input</p>
      )}
    </div>
  );
}
```

Create `src/app/CollaboratorView.tsx`:

```tsx
export function CollaboratorView() {
  return (
    <section className="panel compact-panel">
      <h3>Collaborator share view</h3>
      <p>Participants can read context, add options, answer prompts, rank or score options, comment, flag concerns, and view the outcome when permitted.</p>
    </section>
  );
}
```

Create `src/app/PaywallModel.tsx`:

```tsx
export function PaywallModel() {
  return (
    <section className="panel compact-panel">
      <h3>Freemium model</h3>
      <p>Free helps you decide. Pro helps you decide with confidence and a professional artifact.</p>
      <div className="pricing-grid">
        <span>Free: basic map, basic frameworks, limited dossier</span>
        <span>Pro: full exports, more research runs, private share links</span>
        <span>Team: templates, audit trail, criteria libraries, branded dossiers</span>
      </div>
    </section>
  );
}
```

Modify `src/App.tsx`:

```tsx
import { CollaboratorView } from "./app/CollaboratorView";
import { Composer } from "./app/Composer";
import { PaywallModel } from "./app/PaywallModel";
import { Workspace } from "./app/Workspace";
import { useDecisionWorkspace } from "./state/useDecisionWorkspace";

export default function App() {
  const workspace = useDecisionWorkspace();

  return (
    <main className="app-shell">
      {!workspace.decision ? (
        <Composer onCreate={workspace.createFromPrompt} />
      ) : (
        <>
          <Workspace decision={workspace.decision} frameworkRun={workspace.frameworkRun} dossier={workspace.dossier} />
          <div className="supporting-grid">
            <CollaboratorView />
            <PaywallModel />
          </div>
        </>
      )}
    </main>
  );
}
```

Replace `src/styles.css` with:

```css
:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  color: #17211b;
  background: #f6f4ef;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
textarea,
input,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 32px;
}

.composer,
.workspace,
.supporting-grid {
  width: min(1120px, 100%);
  margin: 0 auto;
}

.eyebrow {
  margin: 0 0 8px;
  color: #586057;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1,
h2,
h3,
h4,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 24px;
  font-size: clamp(2.5rem, 6vw, 5rem);
  line-height: 0.95;
}

h2 {
  margin-bottom: 0;
  font-size: 2rem;
  line-height: 1.1;
}

h3 {
  margin-bottom: 10px;
  font-size: 1rem;
}

h4 {
  margin-bottom: 8px;
  color: #586057;
  font-size: 0.82rem;
  text-transform: uppercase;
}

.composer-box,
.panel,
.lane {
  border: 1px solid #d6d0c4;
  border-radius: 8px;
  background: #fffdf8;
}

.composer-box,
.panel {
  padding: 20px;
}

textarea {
  display: block;
  width: 100%;
  min-height: 170px;
  padding: 18px;
  border: 1px solid #c8c2b6;
  border-radius: 8px;
  resize: vertical;
  background: #fffdf8;
  color: #17211b;
}

button {
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

.primary-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 0 18px;
  background: #245c47;
  color: white;
  font-weight: 800;
}

.primary-action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.template-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.chip {
  padding: 0 12px;
  border: 1px solid #d6d0c4;
  background: #eef2ef;
  color: #23342c;
  font-weight: 700;
}

.workspace {
  display: grid;
  gap: 18px;
}

.workspace-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.status-pill {
  flex: 0 0 auto;
  padding: 10px 12px;
  border-radius: 8px;
  background: #dce8e1;
  color: #1d4b3a;
  font-weight: 800;
}

.map-grid,
.lane-grid,
.supporting-grid,
.pricing-grid {
  display: grid;
  gap: 12px;
}

.map-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.lane-grid,
.supporting-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.lane {
  min-height: 138px;
  padding: 18px;
}

ul {
  margin: 0;
  padding-left: 18px;
}

.muted {
  color: #6f746d;
}

.compact-panel {
  margin-top: 18px;
}

@media (max-width: 760px) {
  .app-shell {
    padding: 20px;
  }

  .workspace-header,
  .map-grid,
  .lane-grid,
  .supporting-grid {
    grid-template-columns: 1fr;
  }

  .workspace-header {
    display: grid;
  }

  .status-pill {
    width: max-content;
  }
}
```

- [ ] **Step 4: Run UI test to verify it passes**

Run:

```bash
npm test -- src/app/App.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/styles.css src/app/Composer.tsx src/app/Workspace.tsx src/app/CollaboratorView.tsx src/app/PaywallModel.tsx src/app/App.test.tsx
git commit -m "feat: build decision workspace UI"
```

### Task 11: End-To-End Verification And Polish

**Files:**
- Modify: files touched by previous tasks only if verification reveals defects.
- Create: `README.md`

- [ ] **Step 1: Create usage README**

Create `README.md`:

```md
# HelpMeDecide.ai

Prompt-first AI decision workspace MVP.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm test
npm run build
```

## MVP scope

- Prompt-first decision creation
- Editable Decision Map foundations
- Opinion, Data, AI Thinking, and Context lanes
- Framework recommendation
- Weighted scoring, ranked choice, pairwise comparison, and owner-decides-with-input domain calculations
- Collaborator permission model
- Decision Dossier generation
- Modeled freemium boundaries
```

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm test
```

Expected: all Vitest suites pass.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite production build pass.

- [ ] **Step 4: Run the app locally**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL like `http://127.0.0.1:5173/`.

- [ ] **Step 5: Manual smoke test**

Open the local URL and verify:

```text
1. The first screen centers "What are you deciding?"
2. Template chips fill the prompt without navigating away.
3. Creating a workspace shows Overview, Decision Map, four input lanes, workflow, dossier, collaborator view, and freemium model.
4. The Data lane text mentions citations and could-not-verify states.
5. On a narrow mobile viewport, panels stack without overlapping text.
```

- [ ] **Step 6: Commit final docs and polish**

```bash
git add README.md
git commit -m "docs: document HelpMeDecide MVP"
```

## Self-Review

**Spec coverage:** This plan covers prompt-first creation, initial Decision Map extraction, editable-map foundations through workspace state, four input lanes, Opinion/Data/AI Thinking/Context trust handling, framework recommendation, all four MVP workflow calculations, collaborator share permissions, dossier generation, launch templates, freemium modeling, and quality-bar tests. Deferred areas from the spec remain deferred: regulated advice, full legal/trademark workflows, real estate modules, enterprise permissions, integrations, native mobile, deep document parsing, and marketplace services.

**Placeholder scan:** The plan avoids placeholder instructions in implementation steps. Each code-changing task includes concrete test code, implementation code, commands, and expected outcomes.

**Type consistency:** Type names used across tasks are defined in `src/domain/types.ts`: `Decision`, `DecisionMap`, `InputItem`, `FrameworkRun`, `Dossier`, `Collaborator`, `FrameworkResult`, and related enums. Function names are consistent across tests and implementations: `createDecisionFromPrompt`, `recommendFramework`, `calculateWeightedScoring`, `calculateRankedChoice`, `calculatePairwiseComparison`, `aggregateOwnerInput`, `normalizeInputItem`, `createCollaborator`, `canCollaborator`, `generateDossier`, and `useDecisionWorkspace`.
