import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signOut } from "firebase/auth";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SideBar from "./index";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("SideBar", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    localStorage.setItem("token", "fake-token");
  });

  it("renders menu and user initials", async () => {
    render(
      <MemoryRouter>
        <SideBar />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("MS")).toBeInTheDocument();
    });
  });

  it("navigates through menu items", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SideBar />
      </MemoryRouter>,
    );

    await user.click(screen.getByText("Extrato"));
    await user.click(screen.getByText("Categorias"));

    expect(mockNavigate).toHaveBeenCalledWith("/statement");
    expect(mockNavigate).toHaveBeenCalledWith("/categories");
  });

  it("logs out and redirects to login", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SideBar />
      </MemoryRouter>,
    );

    await user.click(screen.getByText("Sair"));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/login");
      expect(localStorage.getItem("token")).toBeNull();
    });
  });
});
