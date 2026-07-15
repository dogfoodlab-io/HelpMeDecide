import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the public landing page with the prompt-first composer", () => {
    render(<App />);

    expect(screen.getByText("HelpMeDecide.ai")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Make the call. Keep the receipts.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "HelpMeDecide turns scattered opinions, evidence, and constraints into the right process — then a clear recommendation everyone can inspect.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "One-size-fits-all voting is where good decisions go to die." })).toBeInTheDocument();
    expect(screen.getByText("Weighted scoring")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Northline wins if timeline weight rises above 31%.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What are you deciding?" })).toBeInTheDocument();
    expect(screen.getByLabelText("Decision prompt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create decision workspace" })).toBeInTheDocument();
  });
});
