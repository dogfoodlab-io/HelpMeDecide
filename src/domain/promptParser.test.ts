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

  it("uses the timestamp to avoid id collisions for repeated prompts", () => {
    const prompt = "Help me compare two personal options.";

    const first = createDecisionFromPrompt({
      prompt,
      ownerId: "owner-1",
      now: "2026-07-03T12:00:00.000Z",
    });
    const second = createDecisionFromPrompt({
      prompt,
      ownerId: "owner-1",
      now: "2026-07-03T12:01:00.000Z",
    });

    expect(first.id).not.toBe(second.id);
    expect(first.id).toContain("decision-help-me-compare-two-personal-options-2026-07-03t12-00-00");
  });

  it("distinguishes team workspaces from ad hoc share-link groups", () => {
    const teamDecision = createDecisionFromPrompt({
      prompt: "Help our team choose between two offsite activities.",
      ownerId: "owner-1",
      now: "2026-07-03T12:00:00.000Z",
    });
    const friendDecision = createDecisionFromPrompt({
      prompt: "My friends and I need to pick a restaurant tonight.",
      ownerId: "owner-1",
      now: "2026-07-03T12:00:00.000Z",
    });

    expect(teamDecision.visibility).toBe("team");
    expect(friendDecision.visibility).toBe("share-link");
  });
});
