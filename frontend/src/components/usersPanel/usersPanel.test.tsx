import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UsersPanel from "./index";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    isAdmin: true,
    loading: false,
    firebaseUser: { uid: "admin-1" },
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock("../../services/api", () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      data: [
        {
          uid: "user-1",
          name: "Maria",
          email: "maria@example.com",
          role: "user",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    }),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("UsersPanel", () => {
  it("renders users table for admin", async () => {
    render(
      <UsersPanel />,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Usuários" })).toBeInTheDocument();
      expect(screen.getByText("Maria")).toBeInTheDocument();
      expect(screen.getByText("maria@example.com")).toBeInTheDocument();
    });
  });
});
