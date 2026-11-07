# HelpMeDecide: product evidence, must-haves and sourced comparisons

Implementation and local verification recorded 2026-10-24. The frontend changes are committed as `de91710`; the coordinated backend changes are committed as `3937abb`. Deployment and pilot acceptance remain outstanding.

## What is available

- Rich contender cards show a resolved brand/model/variant, dated prices and offers, reported availability, decision-relevant specifications and source excerpts. Images appear when a supported public manufacturer preview can be retrieved; otherwise the card explicitly says the image is unavailable.
- New research produces a versioned, typed product-evidence result. It resolves supplied names, links and descriptions, proposes exact products, and can enrich an existing contender rather than duplicate it. Adopting enriched details preserves the contender ID, personal preferences, user label and authoritative corrections.
- **Your must-haves** offers concrete checks from the context already supplied. Confirm one with **Make this a must-have**, or confirm the group. Each product then shows **Meets**, **Doesn’t meet**, or **Needs checking**. Numeric limits, yes/no requirements and text matches are supported. Editing or adding a requirement is secondary.
- Research-backed facts and personal experience remain distinct. Manufacturer comfort copy cannot prove comfort for you. Conflicting supported claims stay unresolved until reviewed; missing values never become zero. Explicit corrections survive later research.
- **Tradeoff map** proposes axes from comparable saved measurements and prices, with a populated table and plot. There are no measurement-entry fields in this default path. Unknown/incompatible/conflicting points stay in the table and are excluded from the plot. Neutral dimensions such as case size do not imply that smaller or larger is universally better.
- The brief generator receives deterministic requirement results and rejects a buy recommendation for a contender with a known required failure.

## Quick exploratory guide: 5 minutes

1. Open the [watch decision](http://127.0.0.1:5174/?decision=7a89a6d9-e22d-4d08-93c4-3432f4fdc40e). Its adopted contenders now contain real source-backed product details. Open **Offers, specifications & sources**. Expect Citizen BM8180-03E and the researched Seiko SRPK89 variant, quoted measurements, original source dates, and a Seiko product image. The existing user-entered family label is preserved; the resolved model is shown beneath it.
2. Choose **Tradeoff map**. Expect a ready-to-use price versus case-width comparison: Citizen 37 mm and Seiko 37.4 mm. No dimensions or measurements need to be authored. The view should explain that size is a difference, not a universal better/worse ranking.
3. Open the [headphone decision](http://127.0.0.1:5174/?decision=89205458-eadc-454d-bffc-e7e8d9016d7d) and choose **Tradeoff map**. Expect sourced prices and battery-life figures. Sennheiser’s unknown current price keeps it off the two-axis plot while retaining its row in the table. Open the Bose card for its image and source evidence. Some facts remain unconfirmed because their value was not established by the saved excerpt.
4. Open the [fictional evidence sandbox](http://127.0.0.1:5174/?decision=401667b6-ec56-4bfb-8bdc-3d911aca8516). It already has a 25-hour battery requirement. On Sample A choose **Review or correct a fact**, select **Battery life**, enter **20**, and save. Expect **Doesn’t meet**. Change it to **30** and expect **Meets**. Refresh: the correction should remain. A later fictional source reporting 18 hours has already been adopted during verification; the explicit 30-hour correction remains authoritative.
5. In the sandbox, inspect Sample C’s conflicting weight reports. Expect **Sources disagree**. In the map choose weight as an axis: that value must remain unknown, not zero. Choose a ready-made tradeoff judgment, save the comparison and refresh. The selected axes and judgment should persist.
6. For a personal check, use **Your must-haves** to confirm the suggested comfort requirement if it is not already active. On Sample B choose **Review or correct a fact → Comfort I have checked myself**. **No** produces a failure, **Yes** passes, and **Not sure / unknown** remains unresolved. These are fictional verification answers, not real experience with the products.

The sandbox has fictional products, prices and sources, with automatic research disabled. None of these exploratory steps requires a provider request. Opening existing live cards/maps also makes no new AI request. **Fill in product details from saved sources** is an explicit, allowance-limited extraction request; it reuses stored research without another search. The existing local test account has exhausted its normal daily research allowance during verification; viewing, editing, requirement checks and maps remain available.

Existing Decision Briefs on the watch/headphone examples are now marked out of date because the underlying evidence changed. That is expected; they are historical snapshots, not summaries of the newly enriched cards.

## Verification performed

- Production build and supported frontend regressions pass, including **44 UI/domain tests**.
- **175 database checks** pass, including ownership, retry identity, stale revisions, correction history, enrichment without duplicate contenders, and zero-search evidence reuse.
- **23 provider/evidence/domain tests** pass, including source quotation checks, foreign-reference rejection, unit conversion and roundoff, conflicting facts, subjective comfort, original retrieval dates, hard-failure recommendation guards, and image URL/redirect/size restrictions.
- Backend type checks and database lint pass.
- Real OpenRouter extraction reused the approved saved watch/headphone evidence. It returned 3 watch and 4 headphone findings. Two existing watch contenders and four existing headphone contenders were enriched without changing their IDs or increasing their counts. Source images loaded for Seiko and Bose. The real maps populated without manual measurement setup.
- A browser saved a correction, adopted a later conflicting claim, confirmed that the correction stayed authoritative, saved a map judgment, recorded a personal comfort failure and restored those states after refresh. Both live layouts were checked at 390 pixels without horizontal overflow; portrait images stay inside their reserved preview area.

## Limits and remaining alpha work

Product identity and quoted facts still need human review; a quotation is not independent verification of every claim. Source availability, exact variant coverage and measurement conditions vary. Unknown stock/prices remain unknown. Only supported units are normalized; incompatible measurements are not silently converted. Image previews are deliberately restricted to trusted manufacturer/asset hosts and bounded requests; unsupported or inaccessible images use a fallback.

Requirement suggestions are not silently installed as hard rules. The user confirms the proposed check and can adjust or remove it. Typed requirements and corrections are authoritative; arbitrary prose does not become a made-up numeric threshold. More adaptive planning, targeted research stopping/freshness work, durable draft recovery, broader journey acceptance, hosted deployment, monitoring and the five-user pilot remain on the alpha punch list.
