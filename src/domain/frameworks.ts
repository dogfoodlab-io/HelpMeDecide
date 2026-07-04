import type {
  Criterion,
  DecisionOption,
  FrameworkResult,
  RankedOption,
} from "./types";

interface WeightedScoringInput {
  options: DecisionOption[];
  criteria: Criterion[];
  scores: Record<string, Record<string, number>>;
}

interface RankedChoiceInput {
  options: DecisionOption[];
  ballots: string[][];
}

interface PairwiseInput {
  options: DecisionOption[];
  comparisons: Array<{
    leftOptionId: string;
    rightOptionId: string;
    winnerId: string;
  }>;
}

interface OwnerInput {
  selectedOptionId: string;
  options: DecisionOption[];
  inputs: Array<{
    collaboratorId: string;
    optionId: string;
    comment: string;
    concern: string | null;
  }>;
}

function rankByScore(
  options: Array<Omit<RankedOption, "rank">>,
  descending = true,
): RankedOption[] {
  const sorted = [...options].sort((a, b) =>
    descending ? b.score - a.score : a.score - b.score,
  );
  return sorted.map((option, index) => ({ ...option, rank: index + 1 }));
}

export function calculateWeightedScoring(
  input: WeightedScoringInput,
): FrameworkResult {
  const rows = input.options.map((option) => {
    const parts = input.criteria.map((criterion) => {
      const score = input.scores[option.id]?.[criterion.id] ?? 0;
      return {
        label: criterion.label,
        score,
        weight: criterion.weight,
        subtotal: score * criterion.weight,
      };
    });
    const total = parts.reduce((sum, part) => sum + part.subtotal, 0);
    return {
      optionId: option.id,
      label: option.label,
      score: total,
      formula: `${option.label}: ${parts
        .map((part) => `${part.label} ${part.score} x ${part.weight}`)
        .join(" + ")} = ${total}`,
    };
  });
  const rankedOptions = rankByScore(rows);

  return {
    winnerId: rankedOptions[0]?.optionId ?? null,
    rankedOptions,
    explanation: `Weighted scoring ranked ${rankedOptions[0]?.label ?? "no option"} highest.`,
    inspectableCalculations: rows.map((row) => row.formula),
  };
}

export function calculateRankedChoice(input: RankedChoiceInput): FrameworkResult {
  const totals = input.options.map((option) => {
    const total = input.ballots.reduce((sum, ballot) => {
      const index = ballot.indexOf(option.id);
      return sum + (index === -1 ? input.options.length + 1 : index + 1);
    }, 0);
    return { optionId: option.id, label: option.label, score: total };
  });
  const rankedOptions = rankByScore(totals, false);

  return {
    winnerId: rankedOptions[0]?.optionId ?? null,
    rankedOptions,
    explanation: `${rankedOptions[0]?.label ?? "No option"} has the strongest aggregate ranking.`,
    inspectableCalculations: rankedOptions.map(
      (option) => `${option.label}: rank total ${option.score} across ${input.ballots.length} ballots`,
    ),
  };
}

export function calculatePairwiseComparison(input: PairwiseInput): FrameworkResult {
  const wins = new Map(input.options.map((option) => [option.id, 0]));
  input.comparisons.forEach((comparison) =>
    wins.set(comparison.winnerId, (wins.get(comparison.winnerId) ?? 0) + 1),
  );
  const rankedOptions = rankByScore(
    input.options.map((option) => ({
      optionId: option.id,
      label: option.label,
      score: wins.get(option.id) ?? 0,
    })),
  );

  return {
    winnerId: rankedOptions[0]?.optionId ?? null,
    rankedOptions,
    explanation: `${rankedOptions[0]?.label ?? "No option"} won the most direct comparisons.`,
    inspectableCalculations: rankedOptions.map(
      (option) => `${option.label}: ${option.score} pairwise wins`,
    ),
  };
}

export function aggregateOwnerInput(input: OwnerInput): FrameworkResult {
  const selected =
    input.options.find((option) => option.id === input.selectedOptionId) ?? null;
  const dissent = input.inputs
    .filter((item) => item.concern)
    .map((item) => `Dissent: ${item.concern}`);

  return {
    winnerId: selected?.id ?? null,
    rankedOptions: input.options.map((option, index) => ({
      optionId: option.id,
      label: option.label,
      score: option.id === selected?.id ? 1 : 0,
      rank: index + 1,
    })),
    explanation: `Owner selected ${selected?.label ?? "no option"} after reviewing ${input.inputs.length} stakeholder inputs.`,
    inspectableCalculations: [
      ...input.inputs.map((item) => `Input for ${item.optionId}: ${item.comment}`),
      ...dissent,
    ],
  };
}
