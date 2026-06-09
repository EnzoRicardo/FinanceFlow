import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TopHeader from "./index";

describe("TopHeader", () => {
  it("renders greeting and month navigation", async () => {
    const user = userEvent.setup();
    const onPreviousMonth = vi.fn();
    const onNextMonth = vi.fn();
    const selectedMonth = new Date(2026, 5, 1);

    render(
      <TopHeader
        selectedMonth={selectedMonth}
        onPreviousMonth={onPreviousMonth}
        onNextMonth={onNextMonth}
      />,
    );

    expect(screen.getByText(/Olá, Maria Silva!/i)).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    await user.click(buttons[1]);

    expect(onPreviousMonth).toHaveBeenCalled();
    expect(onNextMonth).toHaveBeenCalled();
  });
});
