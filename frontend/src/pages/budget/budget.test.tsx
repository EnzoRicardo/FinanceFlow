import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../test/test-utils";
import BudgetPage from "./index";

describe("BudgetPage", () => {
  it("renders budget page layout", async () => {
    renderWithRouter(<BudgetPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Orçamento" })).toBeInTheDocument();
    });
  });
});
