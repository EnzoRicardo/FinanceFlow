import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createQuerySnapshot,
  mockOnSnapshotData,
} from "../../test/firestore-mocks";
import GoalsPanel from "./index";

describe("GoalsPanel", () => {
  beforeEach(() => {
    vi.mocked(onSnapshot).mockImplementation(((
      _ref: unknown,
      callback: (snapshot: ReturnType<typeof createQuerySnapshot>) => void,
    ) => {
      callback(createQuerySnapshot([]));
      return vi.fn();
    }) as unknown as typeof onSnapshot);
  });

  it("renders empty goals state", async () => {
    render(<GoalsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Metas")).toBeInTheDocument();
      expect(screen.getByText("Nenhuma meta criada ainda.")).toBeInTheDocument();
    });
  });

  it("validates goal creation form", async () => {
    const user = userEvent.setup();

    render(<GoalsPanel />);

    await user.click(screen.getByRole("button", { name: "Criar" }));
    expect(screen.getByText("Nome obrigatório")).toBeInTheDocument();
  });

  it("creates a new goal", async () => {
    const user = userEvent.setup();

    render(<GoalsPanel />);

    await user.type(screen.getByPlaceholderText("Nome (ex: Viagem)"), "Viagem");
    await user.type(screen.getByPlaceholderText("Valor alvo"), "5000");
    await user.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });
  });

  it("renders goals and accepts contributions", async () => {
    const user = userEvent.setup();
    mockOnSnapshotData([
      {
        id: "goal-1",
        data: {
          name: "Viagem",
          targetAmount: 5000,
          currentAmount: 1000,
          deadline: { toDate: () => new Date("2026-12-31") },
        },
      },
    ]);

    render(<GoalsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Viagem")).toBeInTheDocument();
      expect(screen.getByText(/Prazo:/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Guardar dinheiro" }));
    await user.type(screen.getByPlaceholderText("Valor a guardar"), "500");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(writeBatch).toHaveBeenCalled();
      const batch = vi.mocked(writeBatch).mock.results.at(-1)?.value as {
        commit: ReturnType<typeof vi.fn>;
      };
      expect(batch.commit).toHaveBeenCalled();
    });
  });
});
