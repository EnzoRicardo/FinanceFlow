import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../test/test-utils";
import StatementPage from "./index";

describe("StatementPage", () => {
  it("renders statement page layout", async () => {
    renderWithRouter(<StatementPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Extrato" })).toBeInTheDocument();
    });
  });
});
