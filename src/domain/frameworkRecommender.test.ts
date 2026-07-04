import { describe, expect, it } from "vitest";
import type { Decision } from "./types";
import { recommendFramework } from "./frameworkRecommender";
import { createDecisionFromPrompt } from "./promptParser";

function decision(prompt: string): Decision {
  return createDecisionFromPrompt({
    prompt,
    ownerId: "owner-1",
    now: "2026-07-03T12:00:00.000Z",
  });
}

describe("recommendFramework", () => {
  it("recommends ranked choice for low-stakes group preference decisions", () => {
    const result = recommendFramework(
      decision("My friends and I need to pick a restaurant or activity tonight."),
    );

    expect(result.type).toBe("ranked-choice");
    expect(result.reason).toContain("low-stakes group preference");
  });

  it("recommends weighted scoring when criteria and tradeoffs are explicit", () => {
    const result = recommendFramework(
      decision(
        "I am deciding which apartment to pick. One is cheaper, one is closer to work, and one has better amenities.",
      ),
    );

    expect(result.type).toBe("weighted-scoring");
    expect(result.assumptions).toContain(
      "The decision has explicit criteria or tradeoffs.",
    );
  });

  it("recommends owner-decides-with-input for professional choices with accountable owner", () => {
    const result = recommendFramework(
      decision("Help our team choose between three agencies for a rebrand."),
    );

    expect(result.type).toBe("owner-decides-with-input");
    expect(result.reason).toContain("one accountable owner");
  });
});
