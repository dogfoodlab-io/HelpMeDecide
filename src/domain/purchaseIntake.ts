import type { PurchaseCandidate } from './purchaseDecision';

/** Conservative intake of user-supplied lists; these are names, never researched facts. */
export function suppliedContenders(prompt: string): PurchaseCandidate[] {
  const marker = /\b(?:between|compare|comparing|considering|looking at|looking into|options(?: are)?\s*:|contenders(?: are)?\s*:)\s*/i.exec(prompt);
  if (!marker) return [];
  let list = prompt.slice(marker.index + marker[0].length).replace(/\bvs\./gi, 'vs');
  list = list.split(/(?:[.!?](?:\s|$)|\s+for\s+|\s+(?:with (?:a |my )?budget|under\s+[$€£]|my budget|i care|i want|i need)\b)/i)[0];
  const labels = list.split(/,|;|\n|\s+(?:and|or|vs\.?|versus)\s+/i)
    .map(label => label.trim().replace(/^(?:and\s+|or\s+)?(?:the\s+)?/i, '').replace(/^[-•]\s*/, '').trim())
    .filter(label => label.length > 1 && label.length <= 160);
  if (labels.length < 2) return [];
  const unique = [...new Map(labels.map(label => [label.toLocaleLowerCase(), label])).values()];
  return unique.slice(0, 20).map((label, index) => ({
    id: `candidate-${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/,'')}`,
    label, attributes: {}, provisional: false,
  }));
}

export function contenderTitle(candidates: Pick<PurchaseCandidate, 'label'>[], fallback: string): string {
  if (!candidates.length) return fallback.slice(0, 90);
  if (candidates.length === 1) return candidates[0].label;
  if (candidates.length === 2) return `${candidates[0].label} or ${candidates[1].label}`;
  return `${candidates[0].label} + ${candidates.length - 1} alternatives`;
}
