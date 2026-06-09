import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockOnSnapshotData } from "../../test/firestore-mocks";
import RecentTransactions from "./index";

describe("RecentTransactions", () => {
  it("renders empty state when there are no transactions", async () => {
    render(<RecentTransactions selectedMonth={new Date(2026, 5, 1)} />);

    await waitFor(() => {
      expect(screen.getByText("Transações recentes")).toBeInTheDocument();
      expect(screen.getByText("Nenhuma transação no período.")).toBeInTheDocument();
    });
  });

  it("renders recent transactions list", async () => {
    mockOnSnapshotData([
      {
        id: "tx-1",
        data: {
          type: "expense",
          amount: 80,
          category: "Transporte",
          createdAt: { toDate: () => new Date("2026-06-05") },
        },
      },
    ]);

    render(<RecentTransactions selectedMonth={new Date(2026, 5, 1)} />);

    await waitFor(() => {
      expect(screen.getByText("Transporte")).toBeInTheDocument();
      expect(screen.getByText("Saída")).toBeInTheDocument();
    });
  });
});
