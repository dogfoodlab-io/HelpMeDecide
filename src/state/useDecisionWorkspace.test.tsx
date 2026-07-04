import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDecisionWorkspace } from "./useDecisionWorkspace";

describe("useDecisionWorkspace", () => {
  it("creates a workspace, edits map options, adds input, runs a workflow, and generates a dossier", () => {
    const { result } = renderHook(() =>
      useDecisionWorkspace("2026-07-03T12:00:00.000Z"),
    );

    act(() => {
      result.current.createFromPrompt(
        "I am deciding which apartment to pick. One is cheaper, one is closer to work, and one has better amenities.",
      );
    });

    expect(result.current.decision?.map.criteria.map((criterion) => criterion.label)).toContain(
      "quality",
    );

    act(() => {
      result.current.addOption("Apartment A");
      result.current.addOption("Apartment B");
      result.current.runWeightedScoring({
        "option-apartment-a": { quality: 3, cost: 5, distance: 4 },
        "option-apartment-b": { quality: 5, cost: 3, distance: 5 },
      });
    });

    expect(result.current.frameworkRun?.results?.winnerId).toBe("option-apartment-b");

    act(() => {
      result.current.generateFinalDossier();
    });

    expect(result.current.dossier?.recommendedOption).toBe("Apartment B");
  });
});
