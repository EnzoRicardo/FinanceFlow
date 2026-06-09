import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import StatementPage from "./index";

describe("StatementPage", () => {
  it("renders statement page layout", async () => {
    render(
      <MemoryRouter>
        <StatementPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Extrato" })).toBeInTheDocument();
    });
  });
});
