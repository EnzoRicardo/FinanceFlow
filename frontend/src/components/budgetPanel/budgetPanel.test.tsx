import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDoc } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import BudgetPanel from "./index";

describe("BudgetPanel", () => {
  it("renders budget panel", async () => {
    render(<BudgetPanel />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Orçamento" })).toBeInTheDocument();
      expect(screen.getByText("Nenhum orçamento criado ainda.")).toBeInTheDocument();
    });
  });

  it("validates budget creation form", async () => {
    const user = userEvent.setup();

    render(<BudgetPanel />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Orçamento" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Criar" }));
    expect(
      screen.getByText("Selecione uma categoria", { selector: "p.budgetError" }),
    ).toBeInTheDocument();
  });

  it("changes selected month", async () => {
    const user = userEvent.setup();

    render(<BudgetPanel />);

    const monthButtons = screen.getAllByRole("button").filter((button) =>
      button.className.includes("budgetMonthButton"),
    );
    await user.click(monthButtons[0]);
  });

  it("creates a budget for a category", async () => {
    const user = userEvent.setup();

    render(<BudgetPanel />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Orçamento" })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByRole("combobox"), "Alimentação");
    await user.type(screen.getByPlaceholderText("Limite mensal"), "500");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });
  });
});
