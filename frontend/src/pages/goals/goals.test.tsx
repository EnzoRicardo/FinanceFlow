import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../../test/test-utils";
import GoalsPage from "./index";

describe("GoalsPage", () => {
  it("renders goals page layout", async () => {
    renderWithRouter(<GoalsPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Metas" })).toBeInTheDocument();
    });
  });
});
