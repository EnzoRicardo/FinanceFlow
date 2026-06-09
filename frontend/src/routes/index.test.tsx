import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AppRoutes from "./index";

describe("AppRoutes", () => {
  it("renders login page", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("renders register page", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Criar conta" })).toBeInTheDocument();
  });

  it("renders home page", () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Olá,/i)).toBeInTheDocument();
  });
});
