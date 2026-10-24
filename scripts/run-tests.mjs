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
  purchaseDecision,
] = await Promise.all([
  import("../src/domain/templates.ts"),
  import("../src/domain/promptParser.ts"),
  import("../src/domain/frameworkRecommender.ts"),
  import("../src/domain/frameworks.ts"),
  import("../src/domain/inputs.ts"),
  import("../src/domain/collaboration.ts"),
  import("../src/domain/dossier.ts"),
  import("../src/domain/purchaseDecision.ts"),
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
const budget = await import('../src/domain/purchaseBudget.ts');
pending.push(test('research budget checks preserve unknowns and compare only matching currencies', () => {
  assert.equal(budget.explicitBudgetMaximum('under $600'),600);
  assert.equal(budget.explicitBudgetMaximum('500–800'),800);
  assert.equal(budget.explicitBudgetMaximum('about 600 but flexible'),null);
  assert.equal(budget.assessResearchPrice({amount:675,currency:'USD'},{budget:'under 600',currency:'USD'}),'fail');
  assert.equal(budget.assessResearchPrice({amount:415,currency:'USD'},{budget:'under 600',currency:'USD'}),'pass');
  assert.equal(budget.assessResearchPrice({amount:415,currency:'EUR'},{budget:'under 600',currency:'USD'}),'unknown');
  assert.equal(budget.assessResearchPrice(null,{budget:'under 600',currency:'USD'}),'unknown');
}));
const intake = await import('../src/domain/purchaseIntake.ts');
pending.push(test('purchase intake extracts natural lists without requiring between', () => {
  const prompt = "Help may choose a watch to buy. I'm looking at the Omega Speedmaster, the Hamilton Field Khaki, the Orient Bambino, the Tudor Black Bay, and the Christopher Ward Biscay GMT.";
  assert.deepEqual(intake.suppliedContenders(prompt).map(candidate => candidate.label), ['Omega Speedmaster','Hamilton Field Khaki','Orient Bambino','Tudor Black Bay','Christopher Ward Biscay GMT']);
  assert.deepEqual(intake.suppliedContenders('I am considering Sony WH-1000XM5 or Bose QuietComfort Ultra for commuting.').map(candidate => candidate.label), ['Sony WH-1000XM5','Bose QuietComfort Ultra']);
  assert.deepEqual(intake.suppliedContenders('Compare Seiko vs. Citizen under $600.').map(candidate => candidate.label), ['Seiko','Citizen']);
  assert.deepEqual(intake.suppliedContenders('I want a watch under $500.'), []);
  assert.equal(intake.suppliedContenders('Options: Seiko, seiko, Citizen').length, 2);
}));

pending.push(
  test("purchase constraints preserve unknown values and required failures", () => {
    const required = { id: "waterproof", label: "Water resistant", required: true, provenance: "user-stated" };
    assert.equal(purchaseDecision.assessConstraint(undefined, required), "unknown");
    assert.equal(purchaseDecision.assessConstraint(false, required), "fail");
    assert.equal(purchaseDecision.assessConstraint(true, required), "pass");
  }),
);

pending.push(
  test("Pareto dominance requires known values on every selected axis", () => {
    const candidates = [
      { id: "a", label: "A", attributes: { battery: 60 }, price: { amount: 500, currency: "USD", observedAt: "2026-10-23" }, provisional: false },
      { id: "b", label: "B", attributes: { battery: 40 }, price: { amount: 600, currency: "USD", observedAt: "2026-10-23" }, provisional: false },
      { id: "c", label: "C", attributes: { battery: null }, provisional: false },
    ];
    assert.deepEqual(purchaseDecision.findDominatedCandidates(candidates.slice(0, 2), [
      { key: "battery", direction: "higher" }, { key: "price", direction: "lower" },
    ]), ["b"]);
    assert.deepEqual(purchaseDecision.findDominatedCandidates(candidates, [
      { key: "battery", direction: "higher" }, { key: "price", direction: "lower" },
    ]), ["b"]);
  }),
);

pending.push(
  test("pairwise actions are revision-checked, idempotent, and ordinal", () => {
    const model = {
      revision: 2,
      goal: "Choose a watch",
      useCases: ["daily wear"],
      constraints: [],
      candidates: [
        { id: "a", label: "A", attributes: {}, provisional: false },
        { id: "b", label: "B", attributes: {}, provisional: false },
      ],
      preferences: [],
    };
    const input = { actionId: "action-1", expectedRevision: 2, leftId: "a", rightId: "b", choice: "tie" };
    const updated = purchaseDecision.applyPairwiseObservation(model, input);
    assert.equal(updated.revision, 3);
    assert.equal(updated.preferences[0].payload.choice, "tie");
    assert.equal(updated.preferences[0].provenance, "user-stated");
    assert.equal(purchaseDecision.applyPairwiseObservation(updated, input), updated);
    assert.throws(() => purchaseDecision.applyPairwiseObservation(updated, { ...input, choice: "left" }), /already used/);
    assert.throws(() => purchaseDecision.applyPairwiseObservation(updated, { ...input, actionId: "action-2" }), /out of date/);
    assert.throws(() => purchaseDecision.applyPairwiseObservation(model, { ...input, leftId: "missing" }), /different candidates/);
  }),
);

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

await Promise.all(pending);

if (process.exitCode) {
  process.exit(process.exitCode);
}
