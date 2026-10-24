# HelpMeDecide Purchase Alpha

Date: 2026-10-23

Status: Active product and release target

This document supersedes the team-first beta scope in `PROJECT_KICKOFF.md`, the release sequence in `ROADMAP.md`, and the generalized protocol-runtime proof in `superpowers/plans/2026-07-14-general-protocol-runtime.md` as the current implementation and release gates. Those documents remain historical context; their collaboration, billing, team workflow, and third-party protocol-authoring requirements do not block this alpha.

## Non-negotiable experience gate

The app must make the decision process intuitive and frictionless. It proposes the structure and the next useful action; users react, judge, correct or customize. Every exercise must answer: why this question, what can I do now, what did my answer change, and what comes next?

Default flows must include concrete, decision-specific suggestions. Blank scenario editors, empty criteria builders and manual measurement setup are secondary tools. Personal answers can be short choices with optional explanation. Unknowns, ties and skips are valid. User testing of clarity is a release gate separate from build and database checks.

## Product outcome

Help an invited solo user discover or compare ordinary retail products, understand their own preferences and tradeoffs, and save an explainable decision. Launch broadly across personal purchases, with watches as the first complete category and a second category used to verify that the model is reusable. The product recommends and records the user’s choice; checkout stays outside the alpha.

Support three entry paths: find options, compare supplied options, and explore alternatives. Begin from natural language and ask short, editable questions about purpose, use, budget, region, currency, and non-negotiables. Keep a persistent contender board, decision model, research agenda, and recommendation beside the conversation. Start with three to five diverse options. Treat research discoveries as provisional until the user accepts them; preserve user-confirmed facts and corrections.

The saved Decision Brief records a recommendation, evidence, accepted tradeoffs, uncertainty, and what could change the answer. The user records one of `buy`, `wait`, `dont-buy`, or `investigate-further`. Use separate qualitative assessments of fact coverage, preference understanding, and recommendation stability.

## Canonical decision model

Keep purchase context, structured constraints, candidates and offers, preference observations, source-backed claims, research questions, scenarios, and versioned briefs in typed canonical state. Record provenance (`user-stated`, `inferred`, `researched`, `accepted`, `corrected`, or `superseded`). Constraint evaluation returns pass, fail, or unknown; missing values remain unknown. Rankings stay ordinal. Pareto dominance is calculated only when every selected comparison value and direction is known. The system may preserve ties, conflicting preferences, multiple leaders, and insufficient evidence.

## Adaptive UI and research

Use A2UI v0.9.1-compatible messages as a presentation layer, with an allowlisted catalog containing Pairwise Choice, Priority Ranker, What-If Explorer, Tradeoff Map, and small question/layout components. The React shell owns navigation, save controls, and the persistent contender board. Validate protocol version, catalog membership, schemas, references, and actions. Bind each domain action to a unique action ID and expected decision revision; preserve drafts through updates and fall back to a predefined exercise after one invalid-generation retry. Slider calculations run locally and request AI help only after an explicit meaningful submission.

Ask one useful question or show one exercise at a time. Explain the effect of answers, allow skipping, and do not repeat answered or dismissed questions. The first future-self and devil’s-advocate exercises are short prompts. Dedicated simulators, auctions, tournaments, collaboration, screenshot upload, billing, and cross-decision preference sharing are deferred.

Run research as bounded background work. Use server-side OpenRouter Responses API with the `openrouter:web_search` server tool and a separate validated extraction step. Pin the search engine to Exa so `max_uses: 6` is enforced; use a configurable model, initially `openai/gpt-5.5`. This provider choice supersedes direct OpenAI API calls. Save clickable sources and retrieval dates. Default to one initial pass and at most two automatic follow-ups per decision, capped at six search calls per pass and a configurable daily user limit. Require an explicit action for additional passes. Preserve conflicting and unverified claims; prefer manufacturer specifications and independent ownership evidence. Protect fetched URLs from private network targets and unsafe redirects. Retrieved pages are evidence, never instructions. Stop on exhausted allowance, no valuable open question, or a difference that requires personal experience.

Show progress, remaining allowance, partial results, pause, cancel, and failure states. Research must continue after the browser closes and use idempotent result writes and bounded retries.

## Delivery slices and gates

1. **Baseline and private model.** Preserve existing checkout changes and keep frontend/backend repositories separate. Supersede the older release gates with this document. Extend Supabase tables with owner-scoped RLS and explicit API grants; prove local migration and user isolation.
2. **Saved A2UI interaction.** Add email OTP for invited solo users, canonical model, repository boundary, durable decision commands, and Pairwise Choice. Gate: an authenticated choice updates the decision, survives refresh, deduplicates retries, rejects stale revisions, and cannot affect another owner’s data.
3. **Discovery and evidence.** Accept product URLs, names, and descriptions. Add contender cards, bounded background research, source review and research controls. Gate: a user without candidates receives a diverse, sourced shortlist and can adopt it.
4. **Adaptive exploration.** Add Priority Ranker, What-If Explorer, Tradeoff Map, and a next-action planner. Gate: applied preferences visibly affect evaluation or the research agenda without an endless interview.
5. **Brief and private alpha.** Add versioned briefs, final user outcome, reopen/print, stale-result indicators, Vercel deployment, separate Supabase alpha project, content-free error monitoring, usage and research shutdown controls, and recovery instructions. Gate: watch and non-watch end-to-end decisions cover discovery, supplied contenders, changed priorities, saved briefs, and wait/don’t-buy outcomes.

Pilot with five invited users. Aim for four users to complete a real decision without operator intervention and explain their accepted tradeoff and remaining uncertainty. Measure completion, question burden, research usefulness, and cost alongside reported confidence.

## Release boundaries

The alpha is free, private by default, and limited to ordinary retail purchases. Team-first onboarding, collaborators, checkout, subscriptions, billing, shared preference profiles, third-party protocol authoring, and generalized protocol-runtime portability are not alpha acceptance gates. Do not imply that activity, spend, or an AI recommendation proves value or causation.

## Current implementation checkpoint

As of 2026-10-24, slices 1–3 and the local adaptive exploration slice are implemented and locally verified. What If proposes contextual situations; custom authoring is secondary. Maps enter the automatic guide only with comparable measurements. Final recommendation synthesis, durable generation jobs, immutable brief versions, all four user outcomes, reopening, stale indicators and print export are implemented locally. Brief interface and authorization checks pass using synthetic fixtures and mocked provider tests. Live OpenRouter synthesis is now verified on saved watch and headphone test decisions, including persistence, saved citations, current preference references and a corrected budget calculation; broader acceptance remains outstanding. This is not release or pilot acceptance. Richer AI exercise planning, complete non-budget constraint/offer evaluation, hosted deployment, operational monitoring and the pilot remain outstanding. See IMPLEMENTATION_STATUS.md for the exploratory guide and exact evidence.