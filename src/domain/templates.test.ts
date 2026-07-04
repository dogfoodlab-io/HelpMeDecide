import { describe, expect, it } from "vitest";
import { launchTemplates } from "./templates";

describe("launchTemplates", () => {
  it("includes the six MVP launch templates from the product spec", () => {
    expect(launchTemplates.map((template) => template.label)).toEqual([
      "Choose a name or creative direction",
      "Pick a restaurant or activity",
      "Plan a group trip",
      "Compare vendors or tools",
      "Decide between personal options",
      "Make a team preference decision",
    ]);
  });
});
