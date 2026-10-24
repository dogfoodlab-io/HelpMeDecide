import type { Verdict } from './purchaseDecision';

/** Evaluate only an unambiguous explicit limit; prose and currencies stay unknown. */
export function explicitBudgetMaximum(value: string | undefined): number | null {
  if (!value) return null;
  const text=value.trim().replace(/,/g,'').replace(/[$€£]/g,'').replace(/\b(?:USD|EUR|GBP|CAD|AUD|JPY)\b/gi,'').trim();
  const single=text.match(/^(?:(?:under|below|up to|max(?:imum)?(?: budget)?(?: of)?|less than|budget(?: of)?)\s*:?\s*)?(\d+(?:\.\d+)?)$/i);
  const range=text.match(/^(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)$/i);
  const maximum=single ? Number(single[1]) : range && Number(range[2])>=Number(range[1]) ? Number(range[2]) : null;
  return maximum!==null && Number.isFinite(maximum) && maximum>0 ? maximum : null;
}
export function assessResearchPrice(price:{amount:number;currency:string}|null,context:Record<string,string>|undefined):Verdict {
  const maximum=explicitBudgetMaximum(context?.budget);
  if(maximum===null || !price || !Number.isFinite(price.amount) || price.amount<0 || !context?.currency || price.currency!==context.currency.trim().toUpperCase())return 'unknown';
  return price.amount<=maximum?'pass':'fail';
}
