import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import CategoriesPage from "./index";

describe("CategoriesPage", () => {
  it("renders categories page layout", async () => {
    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Categorias" })).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });
});
