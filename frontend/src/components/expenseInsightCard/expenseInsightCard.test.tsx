import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockOnSnapshotData } from "../../test/firestore-mocks";
import ExpenseInsightCard from "./index";

describe("ExpenseInsightCard", () => {
  it("renders empty state when there are no expenses", async () => {
    render(<ExpenseInsightCard selectedMonth={new Date(2026, 5, 1)} />);

    await waitFor(() => {
      expect(screen.getByText("Despesas por categoria")).toBeInTheDocument();
      expect(screen.getByText("Sem despesas no período.")).toBeInTheDocument();
    });
  });

  it("renders chart when expenses exist", async () => {
    mockOnSnapshotData([
      {
        id: "tx-1",
        data: { type: "expense", amount: 200, category: "Alimentação" },
      },
      {
        id: "tx-2",
        data: { type: "expense", amount: 50, category: "Transporte" },
      },
    ]);

    render(<ExpenseInsightCard selectedMonth={new Date(2026, 5, 1)} />);

    await waitFor(() => {
      expect(screen.queryByText("Sem despesas no período.")).not.toBeInTheDocument();
    });
  });
});
