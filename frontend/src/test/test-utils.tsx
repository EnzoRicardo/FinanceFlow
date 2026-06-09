import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";

type Options = RenderOptions & {
  routerProps?: MemoryRouterProps;
};

export function renderWithRouter(ui: React.ReactElement, options: Options = {}) {
  const { routerProps, ...renderOptions } = options;

  return render(
    <MemoryRouter {...routerProps}>{ui}</MemoryRouter>,
    renderOptions,
  );
}
