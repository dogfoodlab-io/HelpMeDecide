<!-- bmad:context -->
<!-- Verified 2026-08-20 against 34bd5a82bfa6f181c4dd908164df65d7b0ae4e4b. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## helpmedecide.ai frontend

The React frontend for the prompt-first decision workspace. It coordinates with the Supabase backend through `backend/`, but each directory is an independently versioned repository. Product scope and release gates live in `docs/ROADMAP.md`.

## Policy

- Keep provider credentials and Supabase service-role access out of the browser; enforce authorization in backend code and RLS.
- Keep sensitive decision content out of logs and analytics by default.
- Do not add regulated advice or autonomous decision-making before an explicit roadmap decision.

## Where things are

- For cross-stack work, inspect and commit `frontend/` and `backend/` separately; `backend/` is a symlink to the companion repository.

## Conventions that differ from defaults

- Keep typed decision objects canonical; freeform AI or chat transcripts are never the system of record.
- Keep AI inferences, sources, assumptions, and uncertainty visible and editable; never present mocked or disconnected flows as end-to-end behavior.

<!-- /bmad:context -->

## Mandatory product experience contract (user instruction, 2026-10-24)

- Intuitive, frictionless guidance is the core product requirement for every generated feature and revision.
- The app does the structuring work: propose relevant contenders, criteria, scenarios, questions and next steps from the saved decision. Give concrete choices to react to, with a useful explanation of why the question matters.
- Present a useful default before offering customization. Creating scenarios, defining criteria or dimensions, and configuring generic tools must be optional secondary paths.
- Ask one useful question at a time. Explain what an answer changes and provide a clear next action. Support uncertainty, ties, skipping, editing and returning without losing work.
- Reuse information already supplied. Do not ask users to reauthor known context or repeat an answered or dismissed question.
- Show consequences clearly. Keep experiments separate from actual budgets, requirements and confirmed facts; changing an actual decision setting must be explicit.
- Use plain language in product UI. Keep implementation, protocol, scoring and storage details out of ordinary purchase flows.
- A technical implementation is not a completed product experience. Verify the default journey in a real browser without authoring configuration, include a short exploratory verification guide after every implementation phase, and distinguish that evidence from user acceptance.
