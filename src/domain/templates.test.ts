import { describe, expect, it } from "vitest";
import { composerTemplateChips, launchTemplates } from "./templates";

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

  it("provides complete metadata for each launch template", () => {
    expect(new Set(launchTemplates.map((template) => template.id)).size).toBe(
      launchTemplates.length,
    );

    launchTemplates.forEach((template) => {
      expect(template.id).toMatch(/^[a-z0-9-]+$/);
      expect(template.decisionType).toMatch(
        /^(creative|social|travel|professional|personal|team)$/,
      );
      expect(template.promptSeed.trim().length).toBeGreaterThan(20);
    });
  });
});

describe("composerTemplateChips", () => {
  it("includes the seven home composer chips from the product surface spec", () => {
    expect(composerTemplateChips.map((template) => template.label)).toEqual([
      "Choose as a group",
      "Compare options",
      "Research a decision",
      "Pick a name or creative direction",
      "Plan a trip or event",
      "Make a personal decision",
      "Make a team decision",
    ]);
  });

  it("provides complete metadata for each composer chip", () => {
    expect(
      new Set(composerTemplateChips.map((template) => template.id)).size,
    ).toBe(composerTemplateChips.length);

    composerTemplateChips.forEach((template) => {
      expect(template.id).toMatch(/^[a-z0-9-]+$/);
      expect(template.decisionType).toMatch(
        /^(creative|social|travel|professional|personal|team)$/,
      );
      expect(template.promptSeed.trim().length).toBeGreaterThan(20);
    });
  });
});
