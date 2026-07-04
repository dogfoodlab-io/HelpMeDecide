import type { Decision, FrameworkRecommendation } from "./types";

export function recommendFramework(decision: Decision): FrameworkRecommendation {
  const prompt = decision.prompt.toLowerCase();
  const hasGroup =
    decision.visibility === "share-link" ||
    decision.visibility === "team" ||
    /\b(friends|team|our|group|we)\b/.test(prompt);
  const hasExplicitTradeoffs =
    /\bcheaper|closer|amenities|cost|quality|timeline|criteria|tradeoff\b/.test(
      prompt,
    );

  if (decision.decisionType === "professional" || prompt.includes("agency")) {
    return {
      type: "owner-decides-with-input",
      reason:
        "Use owner-decides-with-input because one accountable owner should make the final professional choice while stakeholder input is captured.",
      assumptions: [
        "The decision has a responsible owner.",
        "Stakeholder input matters but does not need to become a binding vote.",
      ],
    };
  }

  if (hasExplicitTradeoffs) {
    return {
      type: "weighted-scoring",
      reason:
        "Use weighted scoring because explicit criteria and tradeoffs should be compared consistently.",
      assumptions: [
        "The decision has explicit criteria or tradeoffs.",
        "Users can inspect and adjust weights before accepting the result.",
      ],
    };
  }

  if (hasGroup && decision.stakes === "low") {
    return {
      type: "ranked-choice",
      reason:
        "Use ranked choice because this is a low-stakes group preference decision with several viable options.",
      assumptions: [
        "Participants can rank acceptable options.",
        "The goal is preference aggregation rather than proof of objective superiority.",
      ],
    };
  }

  return {
    type: "pairwise-comparison",
    reason:
      "Use pairwise comparison because direct option-vs-option choices are easier when criteria are still subjective.",
    assumptions: [
      "The option set is small enough for direct comparisons.",
      "Close calls should be surfaced rather than hidden.",
    ],
  };
}
