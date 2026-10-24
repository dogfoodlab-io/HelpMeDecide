# Verify descriptive What If names

Updated: 2026-10-24

The local app now names experiments from their budget, product-price and measurement assumptions. Examples include **Raise budget from $400 to $500**, **$350 for Sample headphones B**, and **Battery life: 30 hours for Sample headphones A**. Multiple changes can share one name; saved cards show the full assumptions beneath it.

## Quick check (2 minutes)

1. Open [the exercise sandbox](http://127.0.0.1:5174/?decision=27871f13-4b25-4ac3-a274-053f39ddf460), refresh, choose **What if**, then choose **Try a price, budget or measurement change**.
2. Change the preview budget. Expect **Scenario name** to describe the change automatically. Add an assumed product price and expect the name to include that experiment too.
3. Enter your own name, then change the budget again. Your custom name should stay intact. **Use suggested name** returns to automatic naming.
4. Choose **Save scenario only**, then refresh and return to **What if**. Expect the descriptive name and its assumption summary under **Saved scenarios**.
5. Existing entries named “Scenario 1,” “Scenario 2,” etc. should display their saved assumptions instead. If you explicitly apply one, the evaluation and saved decision record should identify it by the same descriptive name.

The sandbox uses fictional products and sample prices; research is cancelled for that decision. Saving a scenario alone leaves the actual budget unchanged. Explicitly applying it changes the decision as described in the [full exploration guide](./IMPLEMENTATION_STATUS.md).

Verified: production build, supported frontend regressions, 23 focused UI/domain tests, and a real-browser save/refresh check. Names fit the 390-pixel layout without page overflow. This update is local and has not been deployed.
