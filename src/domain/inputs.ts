import type { EvidenceItem, InputItem, OpinionItem } from "./types";

interface NormalizedInput {
  evidence: EvidenceItem[];
  opinions: OpinionItem[];
  assumptions: string[];
  risks: string[];
  openQuestions: string[];
  uncertainty: string[];
}

function citationLabel(sourceUrl: string | undefined): string | undefined {
  if (!sourceUrl) return undefined;
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return sourceUrl;
  }
}

export function normalizeInputItem(item: InputItem): NormalizedInput {
  const empty: NormalizedInput = {
    evidence: [],
    opinions: [],
    assumptions: [],
    risks: [],
    openQuestions: [],
    uncertainty: [],
  };

  if (item.lane === "data") {
    if (item.verified === false || item.body.toLowerCase().includes("could not verify")) {
      return { ...empty, uncertainty: [`Could not verify: ${item.title}`] };
    }

    return {
      ...empty,
      evidence: [
        {
          id: `evidence-${item.id}`,
          summary: `${item.title}: ${item.body}`,
          sourceUrl: item.sourceUrl,
          citationLabel: citationLabel(item.sourceUrl),
          verified: item.verified === true,
        },
      ],
    };
  }

  if (item.lane === "opinion") {
    return {
      ...empty,
      opinions: [
        {
          id: `opinion-${item.id}`,
          collaboratorId: item.createdBy,
          summary: `${item.title}: ${item.body}`,
          sentiment: item.body.toLowerCase().includes("concern")
            ? "concern"
            : "neutral",
        },
      ],
    };
  }

  if (item.lane === "ai-thinking") {
    return { ...empty, assumptions: [`AI inference: ${item.body}`] };
  }

  return { ...empty, openQuestions: item.body.includes("?") ? [item.body] : [] };
}
