# HelpMeDecide.ai Implementation Roadmap

Date: 2026-07-11

Status: Active planning baseline

Product specification: [Product Design](superpowers/specs/2026-07-03-helpmedecide-product-design.md)

## Purpose

This is the execution roadmap for turning the current HelpMeDecide prototype into a dependable private beta and then a launchable product. It is designed to be implemented over multiple focused sessions. It owns sequencing, scope, dependencies, release gates, and completion criteria; the product design document continues to own the product thesis and long-term boundaries.

The roadmap is intentionally ordered around one principle: make a single decision durable and useful end-to-end before broadening the number of workflows, collaborators, connectors, or paid surfaces.

## Product Outcome

A user can describe a decision in natural language, receive an editable Decision Map, add opinions, context, research, and AI analysis, run an appropriate decision framework, and produce a clear, inspectable Decision Dossier. The user can return later, invite collaborators when needed, and understand the evidence, disagreement, and uncertainty behind the recommendation.

## Current Baseline

Snapshot as of 2026-07-11. “Modeled” means domain logic or presentation exists; it does not mean the capability works end-to-end.

### Working or modeled

- Prompt-first composer and initial workspace presentation
- Deterministic prompt parsing into an in-memory Decision Map
- Framework recommendation rules
- Domain calculations for weighted scoring, ranked choice, pairwise comparison, and owner-decides-with-input
- Input normalization for Opinions, Data, AI Thinking, and Context
- Collaborator roles and permission rules in the domain layer
- Decision Dossier generation in the domain layer
- Launch-template and freemium concepts
- Unit and component tests for the current domain behavior
- Initial Supabase schema for decisions, options, criteria, and weighted scores, including owner-backed row-level security

### Not yet end-to-end

- Authentication, user identity, or account recovery
- Durable frontend persistence or loading a previous decision
- A stable frontend-to-backend data access layer
- Interactive editing of the full Decision Map
- Real AI extraction, follow-up questions, synthesis, or usage controls
- Runnable workflow UI for all four frameworks
- Persisted framework runs, responses, or dossiers
- Real share links, collaborator participation, or permission enforcement
- Web research, citations fetched from sources, or evidence verification
- Dossier sharing or export
- Billing, entitlements, analytics, deployment, monitoring, or operational support

### Repository reality

- `frontend/` and `backend/` are separate Git repositories.
- The frontend currently contains uncommitted product and presentation changes that must be reconciled before feature work is stacked on top.
- The backend has an initial migration staged but no first commit, and the migration has not yet been proven against a healthy local Supabase stack.

## Delivery Principles

1. **Vertical slices over layer completion.** A milestone should leave a user-visible path working across UI, domain, persistence, and tests.
2. **Structured state is canonical.** AI and chat interactions update typed decision objects; freeform transcripts are not the system of record.
3. **AI is assistive and inspectable.** Inferences, sources, assumptions, and uncertainty remain visible and editable.
4. **Authorization is enforced in the backend.** UI permissions are convenience, not security.
5. **One framework first, shared primitives second.** Weighted scoring proves the runner architecture before the other methods use it.
6. **No fake completion.** Placeholder cards, domain-only models, and mocked responses are described as modeled until the user path is connected.
7. **Every milestone is releasable.** A release gate includes tests, error states, and a short manual smoke path.

## Release Map

| Release | Outcome | Exit signal | Estimated focused sessions |
| --- | --- | --- | ---: |
| R0 — Trusted Baseline | Both repositories are reproducible and safe to extend | Clean known baseline, validated schema, repeatable checks | 1–2 |
| R1 — Persistent Solo Alpha | A user can create, edit, save, leave, and resume a decision | Durable authenticated golden path | 4–6 |
| R2 — AI-Assisted Setup | Real AI turns a prompt into an editable map and asks useful follow-ups | Structured, recoverable AI setup flow | 3–5 |
| R3 — Decision Engine Alpha | All four workflows can be completed and produce an inspectable dossier | End-to-end solo decision loop | 5–7 |
| R4 — Collaborative Beta | Owners can invite participants and incorporate their input safely | Real multi-user decision flow | 4–6 |
| R5 — Evidence Beta | Users can research claims and carry citations into the dossier | Source-backed decision flow | 3–5 |
| R6 — Private Beta Ready | The product can be deployed, observed, supported, and evaluated | Stable private-beta release | 3–5 |
| R7 — Launch Expansion | Teams, reusable assets, and monetization deepen proven usage | Evidence-driven launch scope | Prioritized after beta |

Session estimates are planning ranges, not calendar promises. A focused session should normally complete one independently verifiable vertical slice.

## R0 — Trusted Baseline

**Goal:** remove ambiguity about the starting point and make both repositories reproducible.

### Work packages

#### R0.1 Reconcile the frontend baseline

- Review the existing uncommitted frontend changes as one intentional product increment.
- Confirm that generated assets and the `backend` link are ignored or tracked intentionally.
- Run the full frontend test and production-build checks.
- Commit only the accepted frontend scope.

**Acceptance criteria**

- The frontend working tree is clean after the intended baseline commit.
- `npm test` and `npm run build` pass from a fresh dependency install.
- The landing-to-workspace smoke path works without console errors.

#### R0.2 Prove and commit the backend baseline

- Start or connect to a local Supabase stack.
- Apply the initial migration from an empty database.
- Add database tests for ownership isolation and core constraints.
- Commit the backend scaffold and validated migration as its first commit.

**Acceptance criteria**

- A clean local database can apply all migrations without manual SQL.
- One user cannot read or mutate another user’s decision data.
- Schema reset and database tests have documented commands.

#### R0.3 Establish cross-repo contracts and checks

- Record environment-variable names and local setup without committing secrets.
- Define the frontend data-access boundary so components do not call Supabase directly.
- Add continuous integration for frontend tests/build and backend migration/database checks where practical.
- Document which changes require coordinated frontend and backend delivery.

**Exit gate**

- Another session can begin from documented setup and get the same passing result.

## R1 — Persistent Solo Alpha

**Goal:** one authenticated user can create a decision, edit its map, leave, and resume without data loss.

### R1.1 Authentication shell

- Add Supabase client configuration behind a small infrastructure module.
- Implement email magic-link or one-time-password sign-in for the alpha.
- Add session loading, signed-in/signed-out states, sign-out, and expired-session recovery.
- Preserve an in-progress composer prompt through the sign-in transition.

**Acceptance criteria**

- Anonymous users can explore the landing page but must establish identity before durable save.
- Refreshing a signed-in page restores the session without flashing protected content.
- Authentication errors are actionable and do not destroy draft input.

### R1.2 Align the persistence model with the domain

- Extend the schema for constraints, stakeholders, assumptions, risks, open questions, confidence, and uncertainty.
- Choose normalized tables versus versioned JSON deliberately; preserve queryable ownership and stable IDs.
- Add migration tests and generated or hand-maintained TypeScript database types.
- Define mapping functions between database records and domain objects.

**Acceptance criteria**

- Every field in the editable MVP Decision Map has an explicit durable representation.
- Domain-to-database round trips are covered by tests.
- Migration changes remain backward-safe for existing local data where applicable.

### R1.3 Decision repository and save lifecycle

- Introduce a repository interface with create, get, list, update, archive, and delete operations.
- Implement Supabase and in-memory test adapters.
- Add explicit save states: unsaved, saving, saved, and failed.
- Use debounced autosave with retry, while retaining a manual retry action.

**Acceptance criteria**

- Creating a decision writes it once and routes to a stable decision URL.
- Edits survive refresh and a second browser session.
- A failed save is visible and recoverable without silently losing edits.

### R1.4 Editable workspace and decision history

- Make goal, options, criteria, weights, constraints, and open questions editable.
- Support add, edit, reorder, and remove interactions with sensible confirmation rules.
- Add a “My decisions” list with status, updated time, and resume action.
- Support archive and delete with clear semantics.

**Acceptance criteria**

- A user can complete the full map-editing path with keyboard and pointer input.
- Empty, loading, error, and not-found states are designed and tested.
- Archived decisions are excluded from the default active list but recoverable.

### R1.5 Solo-alpha hardening

- Add route-level error handling and basic accessibility checks.
- Add integration coverage for create → edit → refresh → resume.
- Add seed/demo data for manual testing.
- Verify responsive behavior on common mobile and desktop widths.

**R1 exit gate**

A signed-in user can create, edit, save, close, and resume a private decision. No AI or collaboration is required for this gate.

## R2 — AI-Assisted Setup

**Goal:** replace deterministic-only setup with real, structured AI assistance while retaining deterministic fallbacks and user control.

### R2.1 AI service boundary

- Put model credentials and model calls behind a backend function; never expose provider secrets to the browser.
- Define versioned structured-output schemas for Decision Map extraction and follow-up suggestions.
- Record model, prompt version, latency, token usage, and outcome without logging sensitive prompt content by default.
- Add timeouts, rate limits, retries only where safe, and a deterministic fallback.

**Acceptance criteria**

- Malformed or unavailable model output cannot corrupt a saved decision.
- Structured output is validated before it reaches the domain model.
- The UI distinguishes an AI suggestion from a user-confirmed fact.

### R2.2 Prompt-to-map extraction

- Send the initial prompt through the AI boundary.
- Extract goal, type, stakes, options, criteria, constraints, stakeholders, assumptions, and open questions.
- Show a review state that highlights inferred fields and lets users accept, edit, or remove them.
- Preserve the original prompt and parser version for traceability.

**Acceptance criteria**

- Representative launch prompts produce useful editable maps.
- Explicit user input is not silently overwritten by later AI output.
- Failure falls back to the existing deterministic parser and remains usable.

### R2.3 Next-best-question loop

- Rank missing information by expected decision value.
- Ask one focused question at a time with skip and “not relevant” controls.
- Update the map from each answer and explain what changed.
- Stop prompting when the decision is sufficiently configured or the user chooses to proceed.

**Acceptance criteria**

- The flow feels shorter than a generic intake form.
- Questions do not repeat after being answered or dismissed.
- Users can always inspect and edit the resulting structured state.

### R2.4 AI Thinking lane

- Add deliberate actions for option generation, criteria discovery, tradeoff analysis, blind spots, and assumption review.
- Store each output as a typed input item with provenance and acceptance state.
- Require user confirmation before suggestions become canonical map content.

**R2 exit gate**

A user can start with a messy prompt, review an AI-generated map, answer useful follow-ups, and deliberately incorporate AI suggestions. The path remains usable if AI is unavailable.

## R3 — Decision Engine Alpha

**Goal:** turn the modeled calculations into complete, inspectable user workflows and a durable Decision Dossier.

### R3.1 Framework-run persistence and runner shell

- Add schema and repository support for framework runs, configurations, responses, results, and calculation version.
- Build a common runner state machine: configure, collect, review, calculate, complete, reopen.
- Allow users to accept the recommended framework or override it with an explanation of tradeoffs.
- Snapshot relevant options and criteria so historical results remain explainable after later edits.

### R3.2 Weighted scoring vertical slice

- Add criteria-weight editing and normalization guidance.
- Add an option-by-criterion score table with notes and incomplete-state handling.
- Show rankings, score contributions, ties, and basic sensitivity to weight changes.
- Persist, resume, recalculate, and inspect the run.

**Acceptance criteria**

- The visible calculation matches the tested domain result for the same inputs.
- Missing scores cannot masquerade as zero without explicit user choice.
- Users can trace the winning score back to inputs and weights.

### R3.3 Remaining initial frameworks

- **Ranked choice:** collect ordered preferences and explain the chosen aggregation method.
- **Pairwise comparison:** present pairs, track completion, aggregate results, and flag cycles or inconsistencies.
- **Owner-decides-with-input:** summarize stakeholder input and dissent, then record the accountable owner’s choice and rationale.
- Share runner primitives while keeping framework-specific validation explicit.

**Acceptance criteria**

- Each framework has a start-to-finish UI, persisted draft state, inspectable result, and focused tests.
- Changing framework never silently discards collected input.
- Ties and insufficient-input states are intentional product states.

### R3.4 Durable Decision Dossier

- Persist dossier versions linked to the inputs and framework run that produced them.
- Build sections for summary, recommendation, ranking, rationale, evidence, opinions, dissent, risks, assumptions, uncertainty, and next steps.
- Allow owner edits without erasing the generated version or provenance.
- Add print-quality browser export first; evaluate generated PDF only after print output is reliable.

### R3.5 Decision completion lifecycle

- Add decide, reopen, and archive transitions.
- Capture the chosen option, decision timestamp, owner rationale, and optional follow-up date.
- Make stale results visible when underlying map inputs change.
- Add the complete integration path: create → configure → run → dossier → decide → resume.

**R3 exit gate**

A solo user can complete any initial framework, inspect the calculation, generate a durable dossier, and record a final decision.

## R4 — Collaborative Beta

**Goal:** owners can safely gather structured input from people who may not have full accounts or workspace access.

### R4.1 Collaboration and authorization model

- Extend the schema for collaborators, invitations, share tokens, roles, grants, expiration, and revocation.
- Decide which participant actions require an account versus a scoped guest identity.
- Enforce every permission through RLS or trusted backend functions.
- Add authorization tests for owner, participant, viewer, expired link, and revoked link.

### R4.2 Invitation and participant experience

- Let an owner invite by link and optionally by email.
- Provide a narrow participant view with context, requested actions, progress, and submission state.
- Support allowed actions: add options, answer prompts, rank, score, compare, comment, and flag concerns.
- Make identity and visibility expectations clear before submission.

### R4.3 Multi-participant collection

- Persist participant-specific responses separately from aggregate results.
- Show owner progress, reminders, late responses, and close/reopen collection controls.
- Aggregate rankings and scores with transparent rules.
- Preserve minority opinions and dissent in the dossier.

### R4.4 Concurrency, privacy, and abuse controls

- Handle simultaneous edits with explicit conflict behavior.
- Use realtime updates only where they materially improve the flow; polling is acceptable initially.
- Add token rotation, expiration, revocation, basic rate limiting, and report/block controls as appropriate.
- Minimize personal data and document retention behavior.

**R4 exit gate**

An owner can invite at least two participants, collect different responses, close the collection, inspect aggregation and dissent, and generate a dossier without exposing owner-only data.

## R5 — Evidence Beta

**Goal:** decisions can incorporate source-backed external information with clear verification and uncertainty states.

### R5.1 Evidence model and manual sources

- Extend evidence records with claim, source URL, title, publisher, retrieved time, excerpt or summary, verification state, and provenance.
- Let users add links and notes manually before automated research exists.
- Distinguish source content, AI summary, user interpretation, and unsupported assertion.

### R5.2 Research service

- Add a backend research boundary with provider abstraction, allowlisted fetch behavior, timeouts, and usage controls.
- Generate research questions from the Decision Map and let users approve or edit them.
- Return source-linked findings and explicit “could not verify” results.
- Protect against prompt injection in retrieved content and avoid treating search snippets as verified claims.

### R5.3 Data lane and evidence review

- Build research request, progress, result, error, and retry states.
- Let users accept findings into criteria, option facts, constraints, risks, or evidence.
- Detect obviously stale or conflicting evidence and surface it for review.
- Carry citations through framework review and the final dossier.

### R5.4 First focused research recipe

- Choose one launch template with tractable structured research, such as vendor/tool comparison or restaurant/activity selection.
- Define the standard questions, source expectations, and comparison layout.
- Measure whether research changes confidence or the final choice.

**R5 exit gate**

A user can request research, inspect its sources, reject or accept findings, see uncertainty when facts cannot be verified, and produce a dossier with working citations.

## R6 — Private Beta Ready

**Goal:** make the product operable and measurable for invited real users.

### R6.1 Deployment and environments

- Define local, preview, staging, and production configuration.
- Add automated frontend deployment and controlled Supabase migration deployment.
- Document rollback, secret rotation, and environment ownership.
- Add domain, HTTPS, redirect, email-delivery, and CORS checks.

### R6.2 Product analytics and feedback

- Define a minimal privacy-conscious event taxonomy for activation and failure points.
- Measure prompt submitted, map confirmed, framework started/completed, collaborator response, dossier generated, and decision recorded.
- Add in-product feedback tied to the current decision stage, without including private decision content by default.
- Create a simple beta scorecard.

### R6.3 Reliability and support

- Add client and backend error reporting with correlation IDs and sensitive-data filtering.
- Add health checks, function latency/error monitoring, and database capacity alerts.
- Write operational runbooks for auth failure, AI outage, research outage, bad migration, and accidental exposure.
- Add data export and account/deletion handling appropriate for beta.

### R6.4 Onboarding and templates

- Turn the six launch templates into complete starting configurations, not only prompt chips.
- Add a guided first decision and a useful demo decision.
- Improve empty states and next-action guidance based on beta observation.
- Keep the product usable for both solo and group decisions and credible for professional users.

### R6.5 Entitlement boundary

- Instrument usage before building complex billing.
- Define enforceable Free and Pro limits for saved decisions, collaborators, research runs, and exports.
- Add entitlement checks behind a provider-neutral interface.
- Defer payment-provider integration until beta usage validates the upgrade moments, unless payment testing is itself a beta goal.

### Private-beta release criteria

- A new invited user can reach a completed decision without operator intervention.
- Core-path automated checks pass in CI and the production smoke test passes.
- Authorization tests cover every shared resource.
- Error monitoring and rollback procedures are active.
- No known critical data-loss, cross-user access, or secret-exposure issue remains.
- At least five representative decisions have been run end-to-end using real-world inputs.

### Beta scorecard

The first scorecard should answer:

- **Activation:** What percentage of signed-in users confirm a Decision Map?
- **Core value:** What percentage start and complete a framework?
- **Artifact value:** What percentage generate, revisit, share, or export a dossier?
- **Collaboration:** For shared decisions, how many invited people submit input?
- **Decision quality proxy:** Do users report higher clarity or confidence after the workflow?
- **Reliability:** Where do saves, AI calls, research calls, or invitations fail?
- **Retention signal:** Do users create or revisit another decision within 30 days?

Targets should be set after the first small cohort establishes a baseline; invented targets would create false precision.

## R7 — Launch Expansion

R7 is an evidence-driven backlog, not a commitment to build everything listed.

### Likely expansion tracks

- Team workspaces, admin roles, audit trail, and centralized billing
- Reusable team templates and criteria libraries
- Richer travel, food, event, and creative recipes
- Majority vote, dot voting, veto/consent, pro/con, risk matrix, regret minimization, and sensitivity analysis
- Google Drive, Slack, Notion, and calendar integrations
- Deeper document parsing and attachment extraction
- Paid research packs for travel, vendors, major purchases, or naming availability
- Branded dossiers and richer exports
- Specialized high-stakes flows only after safety boundaries and evidence quality are proven

### Prioritization rule

An expansion item enters an implementation milestone only when it has:

1. repeated user demand or a clear strategic need;
2. a defined user outcome and success measure;
3. identified authorization, data, and AI risks;
4. a small first vertical slice;
5. an explicit reason it outranks reliability or core-flow improvements.

## Cross-Cutting Backlog

These concerns apply to every release rather than living in a final cleanup phase.

### Accessibility

- Keyboard-complete critical flows
- Visible focus and semantic labels
- Screen-reader announcements for save, calculation, and async AI/research states
- Contrast and reduced-motion support

### Security and privacy

- RLS and backend authorization tests with each new table
- No provider secrets or service-role keys in the browser
- Sensitive-content filtering in logs and analytics
- Share-link expiration and revocation
- Data export, retention, and deletion behavior

### Trust and explainability

- Provenance on AI and research outputs
- User edits remain distinguishable from generated suggestions
- Inspectable calculations and versioned algorithms
- “Could not verify,” stale result, dissent, and uncertainty as first-class states

### Quality

- Domain unit tests for deterministic logic
- Repository and mapping tests for persistence
- Database tests for constraints and authorization
- Component tests for editing and error states
- A small number of high-value end-to-end tests for release gates

### Performance and cost

- Avoid model or research calls on every keystroke
- Record latency and cost per assisted action
- Keep initial workspace load responsive as maps and evidence grow
- Put explicit limits and cancellation around external calls

## Session Execution Protocol

Use this protocol whenever implementation resumes in a later session.

### Start of session

1. Read this roadmap and the product design specification.
2. Inspect both repository statuses; never assume the prior session left clean trees.
3. Identify the current release and the smallest unfinished work package that produces a verifiable increment.
4. State the slice, affected repositories, dependencies, and acceptance criteria before editing.

### During the session

- Prefer one vertical slice over several disconnected partial layers.
- Add or update tests alongside behavior.
- Keep schema and frontend contract changes coordinated but separately commit-ready.
- Record newly discovered product decisions in the relevant specification, not only in code comments.
- Do not start a later release to avoid finishing an error state, migration, or authorization test in the current release.

### End of session

1. Run checks proportionate to the affected scope.
2. Manually exercise the slice’s primary path and one failure path.
3. Update the status table and progress log below.
4. Record remaining risk or blocker with the exact evidence.
5. Leave each repository clean or clearly report intentional uncommitted work.

## Roadmap Status

Allowed states: `Not started`, `In progress`, `Blocked`, `Complete`.

| Release | Status | Current focus | Last verified |
| --- | --- | --- | --- |
| R0 — Trusted Baseline | Not started | Reconcile existing frontend changes and validate the initial backend migration | 2026-07-11 |
| R1 — Persistent Solo Alpha | Not started | Depends on R0 | — |
| R2 — AI-Assisted Setup | Not started | Depends on persistent decisions | — |
| R3 — Decision Engine Alpha | Not started | Depends on persistence; runner shell can overlap late R2 | — |
| R4 — Collaborative Beta | Not started | Depends on durable runs and authorization model | — |
| R5 — Evidence Beta | Not started | Manual evidence may begin in R3; automated research follows R4 | — |
| R6 — Private Beta Ready | Not started | Operational work grows throughout earlier releases | — |
| R7 — Launch Expansion | Not started | Prioritize from beta evidence | — |

## Progress Log

Append concise entries; do not rewrite history to make progress look cleaner.

### 2026-07-11 — Roadmap baseline

- Audited the product specification, current frontend domain/UI implementation, and initial backend migration.
- Converted the prior Now/Next/Later boundaries into sequenced releases with acceptance criteria and dependencies.
- Set R0 as the implementation starting point because the current frontend and backend baselines are not yet clean, jointly reproducible release artifacts.

## Explicitly Out of Scope Before Private Beta

- Native mobile applications
- Complex enterprise organization hierarchies
- Marketplace or human concierge services
- Broad connector catalog
- Specialized legal, medical, regulated financial, or real-estate advice
- Fully autonomous decision-making on the user’s behalf
- Sophisticated billing architecture before upgrade demand is validated

These exclusions can be revisited through roadmap prioritization, but they should not quietly enter an implementation session as incidental scope.
