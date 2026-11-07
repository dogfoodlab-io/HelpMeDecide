# HelpMeDecide: remaining private-alpha work

Reviewed against the purchase-alpha plan and current implementation on 2026-10-24.

The local foundation works: invited-user OTP entry, private saved decisions, contender editing, bounded background OpenRouter research, source review/adoption, all four A2UI exercises, saved preferences/scenarios, versioned AI briefs, all four user outcomes, reopening and print export. Real watch and headphone research and brief generation have been exercised locally. These checks do not establish that the complete alpha is ready for invited users.

## Build next

**Checkpoint, 2026-10-24:** items 1–3 are now implemented and locally verified. See the product-evidence verification guide for the working flows and limits. The next implementation scope is item 4. Broader retail coverage and pilot acceptance remain release checks, not claims of universal product-data completeness.


| Priority | Remaining work | Done when |
|---|---|---|
| 1 · implemented locally | **Make product intake and the contender board complete.** Resolve names, URLs and descriptions to exact models/variants. Present images when available, dated offers, availability, relevant attributes and sources together. Reconcile duplicate discoveries with existing contenders. | Both a watch and a non-watch purchase produce a useful 3–5-option shortlist or a clear evidence-limited explanation, without manual data assembly or a special prompt format. |
| 2 · implemented locally | **Structured requirements and corrections implemented.** Typed numeric/boolean/text checks, comparable attributes/units, offers and source claims share versioned contracts. Natural-language context proposes concrete checks that the user confirms; arbitrary prose does not become an invented threshold. | Required constraints evaluate to pass/fail/unknown for each contender; missing values stay unknown; user corrections supersede research cleanly; a known constraint failure cannot be recommended as satisfying that constraint. |
| 3 · implemented locally | **Evidence-backed comparisons implemented.** Typed research facts now populate maps and tables automatically, with field-level source excerpts, unknown/conflicting values and authoritative correction controls. | A useful tradeoff map and comparison can be proposed from saved evidence without asking the user to define dimensions or enter specifications. Unknown or incompatible measurements remain visibly unavailable. |
| 4 | **Complete adaptive assistance.** Current next-step planning and What If suggestions use rules/templates. Ground criteria, scenarios and exercises in consequential differences, missing evidence and sensitivity; reuse known context. Validate any generated A2UI and retain the existing fallback/draft protections. | The app proposes concrete situations and useful choices, explains each consequence, asks one useful question at a time and stops when more questioning or research would not help. Custom authoring remains secondary. |
| 5 | **Tighten research usefulness and freshness.** Allowances, background execution, cancellation and bounded retries exist. Add explicit selection of worthwhile unanswered research questions and stopping decisions, stronger exact-variant/source reconciliation, and consistent stale-evidence treatment. | Changed priorities produce targeted follow-ups; no useful question or a need for personal experience produces a clear stop/next action; conflicting sources and dated prices remain visible. |
| 6 | **Finish save/recovery polish and recommendation quality.** Submitted commands retry safely, but most editing is explicit-save and unsaved drafts do not have durable refresh recovery. Improve save-state clarity, preserved drafts and cross-tab recovery; review briefs for unsupported claims and accepted-versus-proposed tradeoffs. | Refresh/network interruption cannot silently lose a meaningful draft or duplicate a contribution; known edits invalidate older recommendations correctly; briefs are concise, useful and honest about unresolved evidence. |

## Validate and release

| Priority | Remaining work | Done when |
|---|---|---|
| 7 | **Finish release coverage and repeatable CI.** Current supported checks pass, but some legacy prototype App tests still target the former UI and are outside the supported runner. Retire/update those paths and add reproducible browser acceptance and backend checks. | CI covers the active app, all four widgets and keyboard use, streamed/update draft preservation, stale actions, ownership, cancellation and worker recovery. Research cases cover variants, inaccessible URLs, stale/conflicting prices, malicious content, timeouts and exhausted limits. |
| 8 | **Run the complete acceptance matrix.** Two successful live examples and synthetic outcome tests are only part of the gate. | Watch and non-watch journeys each cover discovery, supplied contenders, alternatives, changed priorities, saved briefs, refresh/resume, and wait/don’t-buy outcomes without operator help. Ordinary-retail scope and responsive/accessibility behavior are checked. |
| 9 | **Provision the separate hosted alpha.** Deploy the frontend to Vercel and backend to a separate Supabase alpha project. Configure migrations/grants, invite-only authentication, signup restrictions, real email delivery, origins, server secrets, worker scheduling and published decision URLs. | A fresh invited user completes a decision from the hosted URL; another account cannot access it; closing the browser does not lose background work. Verify the deployment independently of local success. |
| 10 | **Add privacy-safe operations and release controls.** Add content-free error monitoring and decision/research usage and cost visibility. Audit analytics payloads. Existing local shutdown/recovery mechanisms need hosted verification and an operator runbook. | Completion, question burden, research usefulness and cost can be measured without decision text in telemetry. Cancellation, global research shutdown, stalled-job recovery and provider failure handling are rehearsed on the alpha environment. |
| 11 | **Run the five-user pilot and fix observed friction.** | At least four of five invited users complete a real purchase decision without intervention and can explain the accepted tradeoff and remaining uncertainty. Record completion, question burden, research usefulness, cost and reported confidence. |

Next: 4–6, then acceptance/CI and hosted operations, then the pilot. Extend product/source coverage and validate the delivered 1–3 flows during those later acceptance checks. Hosted setup can proceed alongside product work, but it does not replace acceptance.

## Outside this alpha

Collaboration, billing, checkout/purchasing, screenshot uploads, dedicated future-self/devil’s-advocate simulators, auctions/tournaments, cross-decision preference sharing and a generalized third-party protocol runtime remain deferred. They are not release blockers for this purchase alpha.

## Current verification

Production build and supported frontend checks pass, including 44 focused UI/domain tests. The local database suite has 175 passing checks; provider/evidence tests have 23 passing checks; backend type checks pass. The live watch brief favors Citizen and the corrected headphone brief favors Bose. See IMPLEMENTATION_STATUS.md for the exploratory guide and the limits of those results.

The earlier baseline and product-evidence phase are committed separately in the backend and frontend repositories. Hosting, deployment and pilot acceptance are still outstanding.
