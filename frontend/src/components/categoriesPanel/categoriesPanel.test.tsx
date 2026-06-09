import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDoc, getDocs, setDoc } from "firebase/firestore";
import { describe, expect, it, vi } from "vitest";
import { createQuerySnapshot } from "../../test/firestore-mocks";
import CategoriesPanel from "./index";

describe("CategoriesPanel", () => {
  it("renders categories panel with presets", async () => {
    render(<CategoriesPanel />);

    await waitFor(() => {
      expect(screen.getByText("Categorias")).toBeInTheDocument();
      expect(screen.getByText("Finanças pessoais")).toBeInTheDocument();
      expect(screen.getByText("Negócio")).toBeInTheDocument();
    });
  });

  it("switches preset and saves definition", async () => {
    const user = userEvent.setup();

    render(<CategoriesPanel />);

    await user.click(screen.getByRole("button", { name: "Negócio" }));
    await user.click(screen.getByRole("button", { name: "Salvar definição" }));

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
      expect(screen.getByText("Definição salva com sucesso.")).toBeInTheDocument();
    });
  });

  it("adds a custom income category", async () => {
    const user = userEvent.setup();
    vi.mocked(getDocs).mockResolvedValue(
      createQuerySnapshot([]) as unknown as Awaited<ReturnType<typeof getDocs>>,
    );

    render(<CategoriesPanel />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Salário")).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText("Nova categoria de entrada"),
      "Freelance",
    );
    await user.click(
      screen.getAllByRole("button", { name: "Adicionar" })[0],
    );

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });
  });
});
