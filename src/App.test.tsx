import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the prompt-first composer scaffold", () => {
    render(<App />);

    expect(screen.getByText("HelpMeDecide.ai")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What are you deciding?" })).toBeInTheDocument();
    expect(screen.getByLabelText("Decision prompt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create decision workspace" })).toBeInTheDocument();
  });
});
