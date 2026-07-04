import type { Decision, Dossier, FrameworkResult } from "./types";

export function generateDossier(
  decision: Decision,
  result: FrameworkResult,
): Dossier {
  const recommended =
    result.rankedOptions.find((option) => option.optionId === result.winnerId) ??
    result.rankedOptions[0];
  const evidenceSummary = decision.map.evidence.map((item) => item.summary);
  const opinionSummary = decision.map.opinions.map((item) => item.summary);
  const dissent = decision.map.opinions
    .filter(
      (item) =>
        item.sentiment === "concern" ||
        item.summary.toLowerCase().includes("concern"),
    )
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
    nextSteps: [
      "Review the recommendation.",
      "Confirm unresolved risks.",
      "Share the final decision with stakeholders.",
    ],
    citations: decision.map.evidence.filter((item) => item.sourceUrl),
  };
}
