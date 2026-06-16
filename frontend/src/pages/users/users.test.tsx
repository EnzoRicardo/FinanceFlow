import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "../../test/test-utils";
import UsersPage from "./index";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    isAdmin: true,
    loading: false,
    firebaseUser: { uid: "admin-1" },
  }),
}));

vi.mock("../../services/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("UsersPage", () => {
  it("renders users page layout", async () => {
    renderWithRouter(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Usuários" })).toBeInTheDocument();
    });
  });
});
