# HelpMeDecide.ai Comprehensive Beta Kickoff

> **Superseded for current implementation:** the active product and release target is [HelpMeDecide Purchase Alpha](PRODUCT_ALPHA.md), dated 2026-10-23. Its invited-solo purchase scope replaces this document’s team-first beta audience, billing requirements, and release gates. Keep this file as historical planning context; its requirements do not block the purchase alpha.

## Summary

- Position HelpMeDecide as an adaptive decision workspace: it frames the decision, identifies missing inputs, recommends a method, gathers evidence and stakeholder input, runs the workflow, and produces an inspectable Decision Dossier.
- Target founders and small teams first, anchored on vendor and tool selection. AI advises; a named owner remains accountable for the final choice.
- Ship a complete self-serve beta before external recruitment: Google/email authentication, team workspaces, owner/member/guest access, automated research, all four modeled frameworks, dossiers, freemium limits, billing, and production operations.
- Define initial success as 10 qualified decision owners completing a real vendor/tool decision and recording a second decision within 30 days.
- Defer scenario simulations, complex decision trees, native apps, broad integrations, regulated advice, and enterprise permission hierarchies until repeat usage validates expansion.

## Product and Experience

- Start every decision with “What are you deciding?” and convert the answer into an editable Decision Map containing options, criteria, constraints, stakeholders, assumptions, risks, open questions, confidence, and uncertainty.
- Ask one next-best question at a time. AI-generated content remains visibly inferred until accepted by a user.
- Support four complete methods:
  - Weighted scoring with sensitivity analysis.
  - Ranked choice with transparent rounds and tie handling.
  - Pairwise comparison with cycle/inconsistency detection.
  - Owner-decides-with-input with dissent and rationale capture.
- Give workspaces three access levels:
  - `owner`: manages workspace, billing, membership, decisions, and final outcomes.
  - `member`: creates and contributes to workspace decisions.
  - `guest`: token-scoped access to requested actions on one decision.
- Research is deliberately triggered by the user. The system generates research questions, searches the web, extracts comparable claims, displays clickable citations, and requires acceptance before evidence influences the canonical Decision Map.
- The final dossier records the recommendation, ranking, rationale, evidence, dissent, uncertainty, sensitivity, owner’s actual choice, and next steps. It must distinguish generated recommendations from the accountable human decision.

## Implementation Sequence

1. **Trusted baseline**
   - Review and preserve the existing frontend changes, then land them as an intentional baseline commit.
   - Keep the currently passing frontend test and production-build gates.
   - Restore Docker/Supabase operability, apply the staged migration from an empty database, add ownership/RLS tests, and create the backend’s first commit.
   - Establish CI and document coordinated frontend/backend contracts.

2. **Identity, persistence, and workspaces**
   - Add Google OAuth and email magic-link authentication through Supabase.
   - Implement durable decisions, autosave/retry, history, archive/delete, and stable decision URLs.
   - Add workspaces, membership, invitations, expiring guest links, and backend-enforced authorization.
   - Provide repository interfaces so React components never call Supabase directly.

3. **AI-assisted decision setup**
   - Add server-side OpenAI Responses API integration behind an adapter.
   - Use versioned Structured Output schemas for Decision Map extraction, next-best questions, input normalization, and dossier synthesis. OpenAI documents Responses API parsing into typed schemas and explicit refusal/incomplete-response handling. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
   - Default the configurable model to `gpt-5.6-terra`; record model, prompt version, latency, token usage, and outcome for evaluation without logging private decision content.
   - Preserve the deterministic parser as an outage and malformed-output fallback.

4. **Collaboration and all four workflows**
   - Persist framework configuration, participant responses, calculation version, snapshots, results, dissent, and completion state.
   - Build a shared runner state machine—configure, collect, review, calculate, complete, reopen—with framework-specific validation.
   - Support member and guest scoring, ranking, comparison, comments, concerns, reminders, and close/reopen controls.
   - Never discard collected input silently when changing methods.

5. **Research and Decision Dossiers**
   - Implement research jobs using Responses API `web_search`, storing source annotations and making citations visibly clickable as required by the API guidance. [OpenAI web search](https://developers.openai.com/api/docs/guides/tools-web-search)
   - Model source, claim, AI summary, user interpretation, retrieval time, verification state, and provenance separately.
   - Treat conflicting, stale, unsupported, and “could not verify” findings as first-class states.
   - Persist versioned dossiers linked to the exact evidence, participant responses, and framework run used to generate them.

6. **Freemium, billing, and private beta**
   - Implement Stripe checkout, customer portal, idempotent webhooks, entitlement checks, and a usage ledger.
   - Default pricing hypothesis:
     - Free: one workspace, three members, two active decisions, three research runs monthly, all four methods, and shareable web dossiers.
     - Team: `$49/workspace/month`, five included members, unlimited decisions, 25 research runs monthly, guest links, exports, and complete decision history; `$8/month` per additional member.
   - Deploy preview, staging, and production environments with error reporting, privacy-safe analytics, health checks, rollback instructions, account deletion, and rate/cost limits.
   - Recruit the first cohort through founder-network outreach to teams with an active vendor/tool decision. Onboarding remains self-serve; feedback prompts and short interviews may measure outcomes without turning the product into a concierge service.

## Interfaces, Testing, and Release Gates

- Extend the shared domain with `Workspace`, `WorkspaceMembership`, `DecisionInvitation`, `InputItem`, `FrameworkRun`, `FrameworkResponse`, `ResearchJob`, `EvidenceSource`, `EvidenceClaim`, `DossierVersion`, `Entitlement`, and `UsageEvent`.
- Add backend services for `AuthSession`, `WorkspaceRepository`, `DecisionRepository`, `FrameworkRepository`, `ResearchService`, `AIService`, `EntitlementService`, and `BillingService`.
- Add Supabase functions for decision assistance, decision research, and Stripe webhooks. Provider credentials and service-role access remain server-side.
- Test:
  - All framework calculations, ties, incomplete inputs, ranked-choice elimination, pairwise cycles, and sensitivity results.
  - RLS isolation for owners, members, guests, expired/revoked links, and cross-workspace access.
  - AI schema validation, refusals, timeouts, fallback behavior, prompt-version regressions, research citations, and unsupported claims.
  - Billing webhook replay, upgrades, downgrades, cancellations, limits, and research-credit accounting.
  - End-to-end Google/email sign-in, workspace creation, invitation, guest contribution, research, each framework, dossier generation, final owner decision, refresh, and resume.
  - Keyboard accessibility, mobile/desktop layouts, save failures, AI/research outages, and production smoke paths.
- Do not open the external beta until all four workflows, workspace authorization, automated research, dossiers, entitlements, monitoring, and recovery paths pass their release gates.
- Keep decision content private by default, exclude it from analytics and application logs, and do not opt API data into model training. OpenAI states that API inputs and outputs are not used for training by default, while normal retention controls still apply. [OpenAI business data privacy](https://openai.com/business-data/)
- Treat the unanswered commercial questions as accepted recommended defaults: real checkout, Free-plus-Team plans, and founder-network cohort recruitment.
