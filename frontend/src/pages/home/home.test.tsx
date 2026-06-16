import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../test/test-utils";
import Home from "./index";

describe("Home", () => {
  it("renders dashboard sections", async () => {
    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Olá,/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Receita")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Despesas por categoria")).toBeInTheDocument();
    expect(screen.getByText("Transações recentes")).toBeInTheDocument();
  });

  it("changes selected month from header", async () => {
    const user = userEvent.setup();

    renderWithRouter(<Home />);

    await waitFor(() => {
      expect(screen.getByText(/Olá,/i)).toBeInTheDocument();
    });

    const monthButtons = screen
      .getAllByRole("button")
      .filter((button) => button.className.includes("monthButton"));

    expect(monthButtons.length).toBeGreaterThan(0);
    await user.click(monthButtons[0]);

    expect(screen.getByText(/Olá,/i)).toBeInTheDocument();
  });
});
