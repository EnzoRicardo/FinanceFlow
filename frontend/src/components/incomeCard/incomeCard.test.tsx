import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDoc } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import IncomeCard from "./index";

describe("IncomeCard", () => {
  it("opens modal and validates income form", async () => {
    const user = userEvent.setup();

    render(<IncomeCard selectedMonth={new Date(2026, 5, 1)} />);

    await waitFor(() => {
      expect(screen.getByText("Receita")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(screen.getByText("Registrar entrada")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByText("Valor inválido")).toBeInTheDocument();
  });

  it("submits a valid income transaction", async () => {
    const user = userEvent.setup();

    render(<IncomeCard selectedMonth={new Date(2026, 5, 1)} />);

    await user.click(screen.getByRole("button", { name: "Adicionar" }));
    await user.type(screen.getByPlaceholderText("Valor"), "150");
    await user.selectOptions(
      screen.getByRole("combobox"),
      screen.getByRole("option", { name: "Salário" }),
    );
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });
  });
});
