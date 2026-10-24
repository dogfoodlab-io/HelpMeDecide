import type { PurchaseDecisionModel } from './purchaseDecision';
import type { Scenario } from './exploration';
import { explicitBudgetMaximum } from './purchaseBudget';

function money(value: number, currency: string): string {
  if (!/^[A-Z]{3}$/.test(currency)) return `${value} (currency not set)`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(value);
}

/** Describe saved assumptions themselves, without inventing an earlier baseline. */
export function scenarioDetails(model: PurchaseDecisionModel, scenario: Scenario): string[] {
  const details = [scenario.budget === null ? 'Budget not yet set' : `Budget up to ${money(scenario.budget, scenario.currency)}`];
  for (const [id, value] of Object.entries(scenario.prices)) {
    const candidate = model.candidates.find(item => item.id === id)?.label ?? 'A removed contender';
    details.push(value === null ? `Unconfirmed price for ${candidate}` : `${money(value, scenario.currency)} for ${candidate}`);
  }
  for (const [id, assumptions] of Object.entries(scenario.assumptions)) {
    const candidate = model.candidates.find(item => item.id === id)?.label ?? 'A removed contender';
    for (const [axisId, value] of Object.entries(assumptions)) {
      const axis = model.dimensions?.find(item => item.id === axisId);
      const unit = scenario.dimensionUnits?.[axisId] ?? axis?.unit ?? '';
      details.push(`${axis?.label ?? 'Removed measurement'}: ${value === null ? 'unknown' : `${value} ${unit}`.trim()} for ${candidate}`);
    }
  }
  return details;
}

function shortName(parts: string[]): string {
  const name = parts.join(' · ');
  return name.length <= 100 ? name : `${name.slice(0, 99).trimEnd()}…`;
}

/** Capture a useful default at creation; a user-entered name remains authoritative. */
export function suggestedScenarioName(model: PurchaseDecisionModel, scenario: Scenario): string {
  const details = scenarioDetails(model, scenario);
  const baseline = explicitBudgetMaximum(model.context?.budget);
  const sameCurrency = scenario.currency === model.context?.currency?.trim().toUpperCase();
  const budgetChanged = scenario.budget !== baseline || !sameCurrency;
  const assumptions = details.slice(1);
  if (budgetChanged && baseline !== null && scenario.budget !== null && sameCurrency) {
    return shortName([`${scenario.budget > baseline ? 'Raise' : 'Lower'} budget from ${money(baseline, scenario.currency)} to ${money(scenario.budget, scenario.currency)}`, ...assumptions]);
  }
  return shortName(budgetChanged || !assumptions.length ? details : assumptions);
}

export function scenarioName(model: PurchaseDecisionModel, scenario: Scenario): string {
  // Older numbered scenarios can be understood without changing saved data.
  return scenario.label.trim() && !/^scenario(?:\s+\d+)?$/i.test(scenario.label.trim())
    ? scenario.label
    : shortName(scenarioDetails(model, scenario));
}
