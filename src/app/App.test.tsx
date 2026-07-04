import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("App", () => {
  it("creates a prompt-first workspace and shows the decision map, input lanes, workflow, dossier, collaborator view, and freemium model", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByLabelText("Decision prompt"),
      "My friends and I are deciding where to go for a four-day trip in September. We care about food, walkability, nightlife, and keeping flights under $400.",
    );
    await user.click(screen.getByRole("button", { name: "Create decision workspace" }));

    expect(screen.getByText("Decision Map")).toBeInTheDocument();
    expect(screen.getByText("Flights under $400")).toBeInTheDocument();
    expect(screen.getByText("Opinions")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("AI Thinking")).toBeInTheDocument();
    expect(screen.getByText("Context")).toBeInTheDocument();
    expect(screen.getByText("Recommended workflow")).toBeInTheDocument();
    expect(screen.getByText("Collaborator share view")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Free helps you decide. Pro helps you decide with confidence and a professional artifact.",
      ),
    ).toBeInTheDocument();
  });
});
