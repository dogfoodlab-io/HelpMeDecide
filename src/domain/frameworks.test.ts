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
    expect(result.rankedOptions[0]).toEqual({
      optionId: "b",
      label: "B",
      score: 21,
      rank: 1,
    });
    expect(result.inspectableCalculations).toContain(
      "B: cost 3 x 2 + quality 5 x 3 = 21",
    );
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
    expect(result.rankedOptions.map((option) => option.label)).toEqual([
      "C",
      "A",
      "B",
    ]);
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
    expect(result.explanation).toContain(
      "Owner selected A after reviewing 2 stakeholder inputs.",
    );
    expect(result.inspectableCalculations).toContain("Dissent: A may take longer");
  });
});
