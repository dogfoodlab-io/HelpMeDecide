import { describe, expect, it, vi } from "vitest";
import { createPairwiseChoiceProcessor } from "./A2uiPairwiseChoice";

describe("A2UI pairwise choice", () => {
  it("processes an allowlisted surface and dispatches its choice action", async () => {
    const onChoice = vi.fn();
    const processor = createPairwiseChoiceProcessor("Watch A", "Watch B", onChoice);
    try {
      const surface = processor.model.surfacesMap.get("pairwise-choice");
      expect(surface).toBeDefined();
      expect(surface?.componentsModel.get("root")?.type).toBe("Column");
      await surface?.dispatchAction({ event: { name: "pairwise-choice", context: { choice: "left" } } }, "choice-left");
      expect(onChoice).toHaveBeenCalledWith("left");
    } finally {
      processor.dispose();
    }
  });
});
