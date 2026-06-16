import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../test/test-utils";
import ReportsPage from "./index";

describe("ReportsPage", () => {
  it("renders reports page layout", async () => {
    renderWithRouter(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Relatórios" })).toBeInTheDocument();
    });
  });
});
