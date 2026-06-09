import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Home from "./index";

describe("Home", () => {
  it("renders dashboard sections", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Olá,/i)).toBeInTheDocument();
    expect(screen.getByText("Receita")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Despesas por categoria")).toBeInTheDocument();
    expect(screen.getByText("Transações recentes")).toBeInTheDocument();
  });

  it("changes selected month from header", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    const monthButtons = screen
      .getAllByRole("button")
      .filter((button) => button.className.includes("monthButton"));

    expect(monthButtons.length).toBeGreaterThan(0);
    await user.click(monthButtons[0]);

    expect(screen.getByText(/Olá,/i)).toBeInTheDocument();
  });
});
