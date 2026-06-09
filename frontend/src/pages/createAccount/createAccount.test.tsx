import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { api } from "../../services/api";
import CreateAccount from "./index";

describe("CreateAccount", () => {
  it("renders registration form", () => {
    render(
      <MemoryRouter>
        <CreateAccount />
      </MemoryRouter>,
    );

    expect(screen.getByPlaceholderText("Nome")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar conta" })).toBeInTheDocument();
  });

  it("submits registration data", async () => {
    const user = userEvent.setup();
    const postSpy = vi.spyOn(api, "post").mockResolvedValue({
      data: { uid: "user-123" },
    } as Awaited<ReturnType<typeof api.post>>);

    render(
      <MemoryRouter>
        <CreateAccount />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Nome"), "Maria");
    await user.type(screen.getByPlaceholderText("Email"), "maria@test.com");
    await user.type(screen.getByPlaceholderText("Senha"), "senha123");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith("/auth/register", {
        name: "Maria",
        email: "maria@test.com",
        password: "senha123",
      });
    });
  });

  it("handles API validation errors", async () => {
    const user = userEvent.setup();
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);
    vi.spyOn(api, "post").mockRejectedValue({
      response: { data: { detail: "E-mail já registrado." } },
    });

    render(
      <MemoryRouter>
        <CreateAccount />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText("Nome"), "Maria");
    await user.type(screen.getByPlaceholderText("Email"), "maria@test.com");
    await user.type(screen.getByPlaceholderText("Senha"), "senha123");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });
});
