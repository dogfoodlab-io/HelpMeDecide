# HelpMeDecide: recommendation and decision finish

Updated: 2026-10-24. Local implementation; committed separately in the frontend and backend repositories. No push or deployment performed.

## What this phase adds

- **Help me decide** requests a recommendation from OpenRouter using the saved contenders, context, research evidence and current preferences. No new search is started. It can recommend buying, waiting, not buying, or investigating a specific uncertainty.
- Generation runs in a durable background job. Closing the browser does not cancel it. Cancellation, a daily allowance, private ownership, stale revisions and duplicate requests are enforced on the server.
- Completed briefs are saved as immutable numbered versions, with their original evidence and preference snapshot. They explain the recommendation, proposed compromises, recorded answers, uncertainty, what could change the answer and next steps. Facts, preference understanding and recommendation stability are assessed separately.
- **What will you do?** records your own choice independently of the app’s recommendation. Writing a reason is optional. **Revisit my decision** reopens exploration and preserves history.
- **Print / save PDF** exports the selected brief, sources and a matching recorded choice. Changes to options, context, preferences or evidence mark an older brief out of date. Recording or reopening your choice alone does not.

## Quick live-result check: 2 minutes

These briefs are already generated; opening them does not make another AI request.

1. Open the [saved watch decision](http://127.0.0.1:5174/?decision=7a89a6d9-e22d-4d08-93c4-3432f4fdc40e). Expect **Buy · Citizen Garrison / Chandler BM8180-03E** in brief version 1. It should explain the saved preference over Seiko, the small-wrist use case and the saved price, with a concrete stock/return-policy check before buying.
2. Open the [saved headphone decision](http://127.0.0.1:5174/?decision=89205458-eadc-454d-bffc-e7e8d9016d7d). Expect **Buy · Bose QuietComfort SC Headphones** in **version 2**. It should use the saved Bose-over-Sony preference, distinguish variants and unknown prices, and correctly say that Sony at $349.99 fits a $350 maximum.
3. In either brief, follow the numbered evidence links and read **What remains uncertain** and **What could change the answer**. A known source link means the citation belongs to saved evidence, not that every product claim is independently verified. Prices are dated observations. Refresh or leave and return: the brief should remain.
4. Use the fictional fixture below to explore recording a choice, reopening, version history and export without changing these two live examples. **Update my Decision Brief** makes another paid provider request; it is unnecessary for this review.

## Exploratory check: 4 minutes, no AI request needed

Open the [fictional headphone verification decision](http://127.0.0.1:5174/?decision=33a21b59-3a30-4a92-a9e0-9262dbbcc654). This fixture has **two hand-authored, clearly labeled synthetic briefs**. They are interface test data, not AI output or purchasing advice. Automatic research is exhausted intentionally for this fixture.

1. Find **Your decision, brought together** beside the contender board (below the board on a narrow screen). Read the app’s recommendation and next step. You should be able to record a choice without creating anything or writing an answer.
2. Under **What will you do?**, choose **Wait**, then **Save my choice: Wait**. Refresh. Your choice should remain. The brief should still be current.
3. Choose **Revisit my decision**, then **Don’t buy**. Optionally add a reason, save and refresh. Try **Buy** to select a named contender, or **Investigate further**. Each outcome should save and reopen independently of the app’s recommendation.
4. Under **Saved briefs**, choose version 1. It should warn that it reflects the earlier budget. Version 2 should be current. Both versions retain their original explanations. If you edit the fixture’s budget, version 2 should also become out of date; switching versions must not change the actual budget.
5. Choose **Print / save PDF**. Expect the selected brief and source addresses, without sign-in controls, the sidebar or exercise controls. A recorded choice appears in the export when it matches the brief’s decision context. Verify the layout on a narrow screen as well.

Leave **Help me decide / Update my Decision Brief** alone during this no-provider check: those buttons make a real OpenRouter request.

## Live AI checks completed

With explicit permission, both saved test decisions were sent through the authenticated API, durable background job, OpenRouter generation, validation and immutable brief save. The watch has saved version 1; the headphone decision has saved version 2. Leaving the page and refreshing restored the generated result, and the 390-pixel headphone view had no horizontal overflow. References in both current briefs resolve to their own saved source records and current preference observations.

Live testing exposed two issues that were fixed before this verification was closed:

- The provider rejected the full contract’s `uniqueItems` rule. Generation now uses a compatible schema subset while the full server validator still rejects duplicate IDs and invalid references.
- The first headphone brief incorrectly described $349.99 as above $350. Synthesis now receives authoritative budget verdicts and exact differences from deterministic application logic. Regenerated headphone version 2 correctly says both Sony and Bose pass the saved budget check. Version 1 remains historical; use version 2 for review.

The initial failed jobs are retained as operational history. No user preference, contender, actual budget or final user choice was changed by generating these briefs. Provider generation is verified for these examples; the results are not a guarantee of general recommendation accuracy or current product facts.

## Evidence and boundaries

The production build, supported frontend regressions, **37 focused UI/domain tests**, **148 database checks**, **10 provider/evidence tests** and database lint pass. Browser checks used the synthetic fixture for all four outcomes, refresh, reopening, historical versions, stale indicators, source links, PDF export and 390-pixel layout. Mocked provider tests cover schema validation, unsupported citations, foreign contenders, over-budget recommendations, uncertainty, one repair attempt and no automatic replay after a timeout.

This is not a completed private-alpha release. Both live synthesis examples are verified. Broader quality evaluation and full watch/non-watch acceptance across changed priorities and all outcomes remain pending. Exercise suggestions remain rule-based. Research does not automatically populate comparable map measurements; full non-budget constraint/offer evaluation remains incomplete. Hosted Vercel/Supabase release, hosted email delivery, content-free monitoring, operational usage/cost visibility, recovery rehearsal and the five-user pilot remain outstanding. Implementation changes are committed locally; no push or deployment performed.
