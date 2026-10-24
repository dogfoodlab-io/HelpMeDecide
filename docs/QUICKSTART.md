# Purchase alpha: current implementation and local validation

The local app connects invited email OTP, private saved decisions, contenders, real OpenRouter research, and all four custom A2UI exercises. What If now starts with three app-proposed situations and a guided answer flow; custom scenarios and numeric configuration are optional. Guided exploration is implemented and verified locally. Recommendation synthesis, versioned briefs, final outcomes, reopening and print export are now implemented locally. Live OpenRouter synthesis has now been verified on the saved watch and headphone test decisions; their generated briefs survive refresh and resume. The full purchase alpha remains unfinished, including hosted release and pilot acceptance. Start with **IMPLEMENTATION_STATUS.md** for the current 5–8 minute exploratory guide and a clear completed/remaining table.

## Explore the running local build

- App: http://127.0.0.1:5174
- Local email inbox: http://127.0.0.1:56324
- Local test account: `explore@example.test`

Choose “Email me a code”, open the local inbox, and enter the six-digit code. No email leaves the local environment. Use the watch or headphones example and create a workspace. The guide asks one missing context question or presents one exercise at a time. Use the exercise tabs to compare, rank, preview scenarios or map tradeoffs. Submit an answer to save it. Refresh: the preference and decision URL should survive. Try archive/reopen and a second decision. Natural lists such as “I am looking at A, B, and C” are supported. Use **Edit contenders** to correct names or add an option. Existing empty decisions show a recoverable shortlist editor: review the detected names and choose **Save contenders**. If no names can be extracted, use **+ Add contender**; no special prompt wording is required.

The isolated local backend lives at `/Users/raz/Documents/Codex/2026-10-23/ap/work/helpmedecide-alpha-local`. Its API port is 56321 and its database port is 56322. It is separate from other local Supabase projects. Stop it with `supabase stop --workdir /Users/raz/Documents/Codex/2026-10-23/ap/work/helpmedecide-alpha-local`.

## Run from a fresh checkout

1. Install Node.js, Docker, and the Supabase CLI. Start Docker.
2. In the companion backend, run `supabase start`. Fresh local environments apply all migrations. For an existing local environment use `supabase migration up --local`; do not reset a database containing wanted decisions.
3. Use `supabase status` to get the local API URL and anon/publishable key. In the frontend copy `.env.example` to `.env.local` and fill both values. Never put the service-role key in frontend environment variables.
4. Provision an invited account through Supabase Auth admin tools. The browser sign-in explicitly disables account creation. For a hosted alpha, disable public signups, configure SMTP, and configure the Magic Link email template to contain `{{ .Token }}`. The local backend config already uses an OTP template. Hosted email delivery has not been configured or tested.
5. Run `npm ci` and `npm run dev` in the frontend. Open the address Vite prints. If 5173 is occupied it chooses another port. Email OTP entry does not require a redirect.

For production builds the custom build script reads `.env.production`, `.env.local`, and process environment through Vite's environment loader. Both VITE_SUPABASE values are public client settings; database RLS and command authorization enforce ownership.

## Automated validation

Frontend: `npm test` and `npm run build`.
Backend: `supabase test db` and `supabase db lint --local --fail-on error`.

The focused frontend suite verifies the four custom A2UI widgets, keyboard/drag ranking, safe invalid-message fallback, local scenario previews, comparable quantities, finite guidance, response-loss retries, refresh/resume and stale-revision recovery preserving drafts. Frontend exploration types are generated from the versioned backend exploration contract and checked for drift. Database tests verify command persistence, duplicate suppression, stale revisions, cross-user isolation, canonical revision consistency, protection against direct revision updates, and archive permission.

A separate live validation was performed against the isolated local backend using real OTP verification and Data API calls for create/save/retry/reload/cross-user denial/archive/reopen. A real browser journey covered email-code sign-in, decision creation, A2UI choice submission, and refresh/resume.

## Remaining product validation

Do not mark the overall alpha accepted based on this gate. Real automatic product research is connected and locally verified. The recommendation/brief pipeline has contract and authorization coverage, and live OpenRouter synthesis has now been verified on both saved watch and headphone test decisions. Use the clearly labeled synthetic brief fixture in IMPLEMENTATION_STATUS.md for a no-provider exploratory check. Unknown specifications and prices stay unknown; a preference statement is not a verified product fact. The original watch and non-watch research-to-brief acceptance journeys and the five-user pilot remain outstanding.


## Research phase

Open **Purchase context · budget, region & requirements** to supply research context and save it. **Research & evidence** shows setup status, allowance, queued/running/checking progress, pause/resume/cancel, dated source links, and adopt/dismiss controls. Live generation is enabled in the current local environment. See `IMPLEMENTATION_STATUS.md` for the exact exploratory checks and what has versus has not been verified.

## Adaptive exploration implementation

`src/domain/exploration.ts` evaluates explicit budget limits, comparable quantities and two-axis Pareto dominance without converting priority order into weights. It selects a finite sequence of context questions, exercises and reflections, honoring saved skips, conditional insights and the availability of comparable map data. Unknown values and mismatched currencies/units remain unknown.

`src/app/DecisionCatalog.tsx` registers four custom widgets against the pinned A2UI renderer and core packages (0.14.0, protocol v0.9.1). Current messages are app-authored. Validation restricts catalog membership, component properties, references and permitted actions; invalid generation is retried once and falls back to a predefined surface. `AdaptiveExplorer` translates submitted actions into owner-authorized revision-checked commands. Unsaved drafts survive model updates; stale saves require deliberate review. Slider movement does not call AI.

The additive backend migration `20261024033559_adaptive_exploration.sql` adds `apply_exploration_command` with explicit authenticated grants, durable command history and canonical state updates. Scenario saves are isolated; only explicit application changes preferences/context. The migration also retires active scenario assumptions on context edits and rejects pairwise edits to archived decisions. Apply it with local migration-up; do not reset a database with wanted decisions.

Map measurements are currently manual. The map displays product facts and entered measurements; scenario assumptions are separately labeled in the decision evaluation. Research summaries do not automatically populate map axes. AI-generated conversational guidance and complete non-budget constraint/offer handling remain future work. Final synthesis is implemented and verified locally with real OpenRouter calls for both categories.

### App-led What If

Open **What if** and choose a proposed situation. No scenario authoring or numeric setup is required. Choose a response, read what it tells us and the next useful check, then **Save this insight**. **Continue with my decision** returns to the guide. The secondary controls offer custom questions and the earlier numeric experiment editor.

`src/domain/whatIf.ts` proposes grounded hypothetical questions from saved context and interprets conditional responses. `GuidedWhatIf.tsx` renders that flow through the custom A2UI WhatIf component. The versioned exploration contract generates `WhatIfAnswer`; `answer_what_if` saves it through an owner-authorized, revision-checked, idempotent command. It preserves the question, does not change real constraints or product facts, and marks replaced answers superseded. Current answers add a next evidence check to the agenda and can trigger the existing bounded research follow-up. Research instructions preserve the hypothetical context.

The mandatory experience contract is in `AGENTS.md` and `PRODUCT_ALPHA.md`. Every future feature must have a concrete app-led default, optional customization, an explanation of its consequence and a browser-verifiable next step. Source/build checks do not replace user acceptance.

## Saved recommendation and final choice

Use **Help me decide** to request a saved recommendation from existing evidence, without another search. The request runs in the background. Record your own **Buy**, **Wait**, **Don’t buy** or **Investigate further** choice separately; a written reason is optional. **Revisit my decision** reopens exploration. Saved brief versions retain their original context and sources; changes mark earlier versions out of date. **Print / save PDF** exports the selected brief. See IMPLEMENTATION_STATUS.md for the current no-provider verification fixture and the completed live synthesis examples and current release boundaries.
