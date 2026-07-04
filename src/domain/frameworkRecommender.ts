import type { Decision, FrameworkRecommendation } from "./types";

function hasGroupInput(decision: Decision): boolean {
  return decision.visibility === "share-link" || decision.visibility === "team";
}

function hasExplicitDecisionTradeoffs(decision: Decision): boolean {
  return decision.map.criteria.some((criterion) => criterion.source === "explicit");
}

function isProfessionalOwnerDecision(decision: Decision): boolean {
  return decision.decisionType === "professional";
}

export function recommendFramework(decision: Decision): FrameworkRecommendation {
  const hasGroup = hasGroupInput(decision);
  const hasExplicitTradeoffs = hasExplicitDecisionTradeoffs(decision);

  if (isProfessionalOwnerDecision(decision)) {
    return {
      type: "owner-decides-with-input",
      reason:
        "Use owner-decides-with-input because one accountable owner should make the final professional choice while stakeholder input is captured. This professional decision takes precedence over scoring or voting workflows.",
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
        "Use weighted scoring because explicit criteria and tradeoffs should be compared consistently. Criteria-based scoring takes precedence over group preference aggregation.",
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
