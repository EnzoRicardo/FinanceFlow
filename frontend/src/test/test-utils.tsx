import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthProvider";

type Options = RenderOptions & {
  routerProps?: MemoryRouterProps;
};

export function renderWithRouter(ui: React.ReactElement, options: Options = {}) {
  const { routerProps, ...renderOptions } = options;

  return render(
    <MemoryRouter {...routerProps}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
    renderOptions,
  );
}
