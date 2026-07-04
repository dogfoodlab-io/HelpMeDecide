import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the public landing page with the prompt-first composer", () => {
    render(<App />);

    expect(screen.getByText("HelpMeDecide.ai")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Decide with structure before the group chat wins.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "HelpMeDecide.ai turns messy choices into a decision map, the right framework, useful input lanes, and a shareable dossier.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What are you deciding?" })).toBeInTheDocument();
    expect(screen.getByLabelText("Decision prompt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create decision workspace" })).toBeInTheDocument();
  });
});
