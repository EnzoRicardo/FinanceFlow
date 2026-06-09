import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ReportsPage from "./index";

describe("ReportsPage", () => {
  it("renders reports page layout", async () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Relatórios" })).toBeInTheDocument();
    });
  });
});
