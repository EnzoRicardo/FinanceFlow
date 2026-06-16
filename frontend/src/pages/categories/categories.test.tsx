import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../test/test-utils";
import CategoriesPage from "./index";

describe("CategoriesPage", () => {
  it("renders categories page layout", async () => {
    renderWithRouter(<CategoriesPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Categorias" })).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });
});
