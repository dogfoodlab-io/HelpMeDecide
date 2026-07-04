import { describe, expect, it } from "vitest";
import { canCollaborator, createCollaborator } from "./collaboration";

describe("collaboration", () => {
  it("creates participants with contribution permissions but no owner controls", () => {
    const collaborator = createCollaborator({
      id: "c1",
      name: "Mina",
      role: "participant",
    });

    expect(collaborator.permissions).toEqual([
      "read-context",
      "add-options",
      "answer-prompts",
      "vote",
      "comment",
      "flag-concerns",
      "view-outcome",
    ]);
    expect(canCollaborator(collaborator, "vote")).toBe(true);
  });

  it("creates viewers who can only read context and permitted outcomes", () => {
    const collaborator = createCollaborator({
      id: "c2",
      name: "Lee",
      role: "viewer",
    });

    expect(collaborator.permissions).toEqual(["read-context", "view-outcome"]);
    expect(canCollaborator(collaborator, "comment")).toBe(false);
  });
});
