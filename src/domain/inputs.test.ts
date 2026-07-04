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

    expect(result.uncertainty).toEqual([
      "Could not verify: Restaurant availability",
    ]);
  });
});
