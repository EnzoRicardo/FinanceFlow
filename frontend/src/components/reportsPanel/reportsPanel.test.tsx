import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockOnSnapshotData } from "../../test/firestore-mocks";
import ReportsPanel from "./index";

function monthDate(monthOffset: number, day = 15) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + monthOffset, day);
}

describe("ReportsPanel", () => {
  it("renders empty reports state", async () => {
    render(<ReportsPanel />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Relatórios" })).toBeInTheDocument();
      expect(screen.getByText("Sem dados nos últimos 6 meses.")).toBeInTheDocument();
    });
  });

  it("renders summary and charts when data exists", async () => {
    mockOnSnapshotData([
      {
        id: "tx-1",
        data: {
          type: "income",
          amount: 3000,
          category: "Salário",
          createdAt: { toDate: () => monthDate(0) },
        },
      },
      {
        id: "tx-2",
        data: {
          type: "expense",
          amount: 500,
          category: "Alimentação",
          createdAt: { toDate: () => monthDate(0) },
        },
      },
      {
        id: "tx-3",
        data: {
          type: "expense",
          amount: 200,
          category: "Transporte",
          createdAt: { toDate: () => monthDate(-1) },
        },
      },
    ]);

    render(<ReportsPanel />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Receitas vs Despesas (últimos 6 meses)" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Despesas por categoria")).toBeInTheDocument();
      expect(screen.getAllByText("Alimentação").length).toBeGreaterThan(0);
      expect(screen.queryByText("Sem dados nos últimos 6 meses.")).not.toBeInTheDocument();
    });
  });

  it("changes selected month", async () => {
    const user = userEvent.setup();

    render(<ReportsPanel />);

    const monthButtons = screen
      .getAllByRole("button")
      .filter((button) => button.className.includes("reportsMonthButton"));

    await user.click(monthButtons[0]);

    expect(screen.getByRole("heading", { name: "Relatórios" })).toBeInTheDocument();
  });
});
