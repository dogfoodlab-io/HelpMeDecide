// Generated from backend/contracts/research-result.v1.schema.json.
export type ResearchResult = { "summary": string; "findings": Array<{ "label": string; "url": string; "summary": string; "price": { "amount": number; "currency": string } | null; "availability": string; "unknowns": Array<string>; "sources": Array<{ "url": string; "title": string }> }>; "unknowns": Array<string> };
