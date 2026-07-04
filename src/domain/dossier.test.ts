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
    expect(dossier.evidenceSummary).toContain(
      "Agency Alpha has three relevant case studies.",
    );
    expect(dossier.dissent).toContain("Concern: Studio Beta may be slower.");
    expect(dossier.uncertainty).toContain(
      "Missing participant preferences and external evidence.",
    );
    expect(dossier.nextSteps).toEqual([
      "Review the recommendation.",
      "Confirm unresolved risks.",
      "Share the final decision with stakeholders.",
    ]);
  });
});
