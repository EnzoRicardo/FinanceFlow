import { render, screen, waitFor } from "@testing-library/react";
import { onSnapshot } from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";
import { createQuerySnapshot } from "../../test/firestore-mocks";
import TotalCard from "./index";

describe("TotalCard", () => {
  it("renders total balance", async () => {
    render(<TotalCard selectedMonth={new Date(2026, 5, 1)} />);

    await waitFor(() => {
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
    });
  });

  it("calculates balance from income and expenses", async () => {
    vi.mocked(onSnapshot).mockImplementation(((
      _ref: unknown,
      callback: (snapshot: ReturnType<typeof createQuerySnapshot>) => void,
    ) => {
      callback(
        createQuerySnapshot([
          { id: "1", data: { type: "income", amount: 1000 } },
          { id: "2", data: { type: "expense", amount: 250 } },
        ]),
      );
      return vi.fn();
    }) as unknown as typeof onSnapshot);

    render(<TotalCard selectedMonth={new Date(2026, 5, 1)} />);

    await waitFor(() => {
      expect(screen.getByText("R$ 750,00")).toBeInTheDocument();
    });
  });
});
