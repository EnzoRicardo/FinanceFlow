import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import GoalsPage from "./index";

describe("GoalsPage", () => {
  it("renders goals page layout", async () => {
    render(
      <MemoryRouter>
        <GoalsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Metas" })).toBeInTheDocument();
    });
  });
});
