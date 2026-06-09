import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "./defaultCategories";

describe("DEFAULT_CATEGORIES", () => {
  it("defines personal and business presets", () => {
    expect(DEFAULT_CATEGORIES.personal.income).toContain("Salário");
    expect(DEFAULT_CATEGORIES.personal.expenses).toContain("Alimentação");
    expect(DEFAULT_CATEGORIES.business.income).toContain("Vendas");
    expect(DEFAULT_CATEGORIES.business.expenses).toContain("Fornecedores");
  });
});
