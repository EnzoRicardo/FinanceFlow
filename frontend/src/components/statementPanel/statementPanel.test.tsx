import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockGetDocsData } from "../../test/firestore-mocks";
import StatementPanel from "./index";

describe("StatementPanel", () => {
  it("renders statement filters and empty state", async () => {
    const user = userEvent.setup();

    render(<StatementPanel />);

    await waitFor(() => {
      expect(screen.getByText("Extrato")).toBeInTheDocument();
      expect(screen.getByText("Nenhuma transação encontrada.")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Entradas" }));
    await user.click(screen.getByRole("button", { name: "Saídas" }));
    await user.click(screen.getByRole("button", { name: "Todas" }));

    expect(screen.getByText("Nenhuma transação encontrada.")).toBeInTheDocument();
  });

  it("renders transactions from firestore", async () => {
    mockGetDocsData([
      {
        id: "tx-1",
        data: {
          type: "income",
          amount: 2500,
          category: "Salário",
          createdAt: { toDate: () => new Date("2026-06-01T10:30:00") },
        },
      },
      {
        id: "tx-2",
        data: {
          type: "expense",
          amount: 120,
          category: "Alimentação",
          createdAt: { toDate: () => new Date("2026-06-02T15:00:00") },
        },
      },
    ]);

    render(<StatementPanel />);

    await waitFor(() => {
      expect(screen.getByText("Salário")).toBeInTheDocument();
      expect(screen.getByText("Alimentação")).toBeInTheDocument();
      expect(screen.getByText("Entrada")).toBeInTheDocument();
      expect(screen.getByText("Saída")).toBeInTheDocument();
    });
  });
});
