import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDoc } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import ExitsCard from "./index";

describe("ExitsCard", () => {
  it("opens modal and validates expense form", async () => {
    const user = userEvent.setup();

    render(<ExitsCard selectedMonth={new Date(2026, 5, 1)} />);

    await waitFor(() => {
      expect(screen.getByText("Despesas")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Registrar saída" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(screen.getByText("Valor inválido")).toBeInTheDocument();
  });

  it("submits a valid expense transaction", async () => {
    const user = userEvent.setup();

    render(<ExitsCard selectedMonth={new Date(2026, 5, 1)} />);

    await user.click(screen.getByRole("button", { name: "Registrar saída" }));
    await user.type(screen.getByPlaceholderText("Valor"), "75");
    await user.selectOptions(
      screen.getByRole("combobox"),
      screen.getByRole("option", { name: "Alimentação" }),
    );
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });
  });
});
