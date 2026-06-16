import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithRouter } from "../test/test-utils";
import AppRoutes from "./index";

describe("AppRoutes", () => {
  it("renders login page", () => {
    renderWithRouter(<AppRoutes />, {
      routerProps: { initialEntries: ["/login"] },
    });

    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("renders register page", () => {
    renderWithRouter(<AppRoutes />, {
      routerProps: { initialEntries: ["/register"] },
    });

    expect(screen.getByRole("button", { name: "Criar conta" })).toBeInTheDocument();
  });

  it("renders home page", async () => {
    renderWithRouter(<AppRoutes />, {
      routerProps: { initialEntries: ["/home"] },
    });

    await waitFor(() => {
      expect(screen.getByText(/Olá,/i)).toBeInTheDocument();
    });
  });
});
