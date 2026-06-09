import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import BudgetPage from "./index";

describe("BudgetPage", () => {
  it("renders budget page layout", async () => {
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Orçamento" })).toBeInTheDocument();
    });
  });
});
