import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [
  templates,
  promptParser,
  recommender,
  frameworks,
  inputs,
  collaboration,
  dossier,
] = await Promise.all([
  import("../src/domain/templates.ts"),
  import("../src/domain/promptParser.ts"),
  import("../src/domain/frameworkRecommender.ts"),
  import("../src/domain/frameworks.ts"),
  import("../src/domain/inputs.ts"),
  import("../src/domain/collaboration.ts"),
  import("../src/domain/dossier.ts"),
]);

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === "function") {
      return result.then(
        () => console.log(`ok - ${name}`),
        (error) => {
          console.error(`not ok - ${name}`);
          console.error(error);
          process.exitCode = 1;
        },
      );
    }
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

const pending = [];

pending.push(
  test("template catalogs match product surfaces", () => {
    assert.deepEqual(
      templates.launchTemplates.map((template) => template.label),
      [
        "Choose a name or creative direction",
        "Pick a restaurant or activity",
        "Plan a group trip",
        "Compare vendors or tools",
        "Decide between personal options",
        "Make a team preference decision",
      ],
    );
    assert.deepEqual(
      templates.composerTemplateChips.map((template) => template.label),
      [
        "Choose as a group",
        "Compare options",
        "Research a decision",
        "Pick a name or creative direction",
        "Plan a trip or event",
        "Make a personal decision",
        "Make a team decision",
      ],
    );
  }),
);

pending.push(
  test("prompt parser extracts required examples and regressions", () => {
    const trip = promptParser.createDecisionFromPrompt({
      prompt:
        "My friends and I are deciding where to go for a four-day trip in September. We care about food, walkability, nightlife, and keeping flights under $400.",
      ownerId: "owner-1",
      now: "2026-07-03T12:00:00.000Z",
    });
    assert.equal(trip.decisionType, "travel");
    assert.equal(trip.visibility, "share-link");
    assert.deepEqual(
      trip.map.criteria.map((criterion) => criterion.label),
      ["food", "walkability", "nightlife"],
    );
    assert.ok(trip.map.constraints.includes("Flights under $400"));

    const vendor = promptParser.createDecisionFromPrompt({
      prompt:
        "Help our team choose between Agency Alpha, Studio Beta, and Group Gamma for a rebrand.",
      ownerId: "owner-1",
      now: "2026-07-03T12:00:00.000Z",
    });
    assert.equal(vendor.visibility, "team");
    assert.deepEqual(
      vendor.map.options.map((option) => option.label),
      ["Agency Alpha", "Studio Beta", "Group Gamma"],
    );

    const first = promptParser.createDecisionFromPrompt({
      prompt: "Help me compare two personal options.",
      ownerId: "owner-1",
      now: "2026-07-03T12:00:00.123Z",
    });
    const second = promptParser.createDecisionFromPrompt({
      prompt: "Help me compare two personal options.",
      ownerId: "owner-1",
      now: "2026-07-03T12:00:00.456Z",
    });
    assert.notEqual(first.id, second.id);
  }),
);

pending.push(
  test("framework recommendation uses normalized decision state", () => {
    const decide = (prompt) =>
      promptParser.createDecisionFromPrompt({
        prompt,
        ownerId: "owner-1",
        now: "2026-07-03T12:00:00.000Z",
      });

    assert.equal(
      recommender.recommendFramework(
        decide("My friends and I need to pick a restaurant or activity tonight."),
      ).type,
      "ranked-choice",
    );
    assert.equal(
      recommender.recommendFramework(
        decide(
          "I am deciding which apartment to pick. One is cheaper, one is closer to work, and one has better amenities.",
        ),
      ).type,
      "weighted-scoring",
    );
    assert.equal(
      recommender.recommendFramework(
        decide("Help our team choose between three agencies for a rebrand."),
      ).type,
      "owner-decides-with-input",
    );
    assert.equal(
      recommender.recommendFramework(
        decide(
          "My friends and I need to pick a restaurant. We care about fit, cost, and confidence.",
        ),
      ).type,
      "weighted-scoring",
    );
  }),
);

pending.push(
  test("framework calculations produce inspectable winners", () => {
    const weighted = frameworks.calculateWeightedScoring({
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
    assert.equal(weighted.winnerId, "b");

    const ranked = frameworks.calculateRankedChoice({
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
    assert.equal(ranked.winnerId, "b");
  }),
);

pending.push(
  test("input, collaboration, and dossier helpers cover trust artifacts", () => {
    const normalized = inputs.normalizeInputItem({
      id: "input-1",
      lane: "data",
      title: "Flight prices",
      body: "Flights are currently $356 round trip.",
      sourceUrl: "https://example.com/flights",
      verified: true,
      createdBy: "owner-1",
      createdAt: "2026-07-03T12:00:00.000Z",
    });
    assert.equal(normalized.evidence[0].citationLabel, "example.com");

    const viewer = collaboration.createCollaborator({
      id: "c2",
      name: "Lee",
      role: "viewer",
    });
    assert.equal(collaboration.canCollaborator(viewer, "comment"), false);

    const decision = promptParser.createDecisionFromPrompt({
      prompt: "Help our team choose between Agency Alpha and Studio Beta for a rebrand.",
      ownerId: "owner-1",
      now: "2026-07-03T12:00:00.000Z",
    });
    decision.map.opinions.push({
      id: "o1",
      collaboratorId: "c1",
      summary: "Concern: Studio Beta may be slower.",
      sentiment: "concern",
    });
    const generated = dossier.generateDossier(decision, {
      winnerId: "option-agency-alpha",
      rankedOptions: [
        { optionId: "option-agency-alpha", label: "Agency Alpha", score: 10, rank: 1 },
      ],
      explanation: "Agency Alpha ranked highest.",
      inspectableCalculations: ["Agency Alpha: 10"],
    });
    assert.equal(generated.recommendedOption, "Agency Alpha");
    assert.deepEqual(generated.dissent, ["Concern: Studio Beta may be slower."]);
  }),
);

pending.push(
  test("app source wires the prompt-first workspace", async () => {
    const [app, composer, workspace, paywall] = await Promise.all([
      readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
      readFile(new URL("../src/app/Composer.tsx", import.meta.url), "utf8"),
      readFile(new URL("../src/app/Workspace.tsx", import.meta.url), "utf8"),
      readFile(new URL("../src/app/PaywallModel.tsx", import.meta.url), "utf8"),
    ]);

    assert.match(app, /useDecisionWorkspace/);
    assert.match(composer, /What are you deciding\?/);
    assert.match(composer, /composerTemplateChips/);
    assert.match(workspace, /Decision Map/);
    assert.match(workspace, /Recommended workflow/);
    assert.match(paywall, /Free helps you decide/);
  }),
);

await Promise.all(pending);

if (process.exitCode) {
  process.exit(process.exitCode);
}
