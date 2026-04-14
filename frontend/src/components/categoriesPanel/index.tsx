import { useState } from "react";
import "./categoriesPanel.css"

export type CategoryType = "income" | "expense";
export type PresetType = "personal" | "business" | "custom";

export type Category = {
    id: string;
    name: string;
    type: CategoryType;
    isDefault: boolean;
}

export const personalIncomeCategories: Category[] = [
  { id: "pi-1", name: "Salário", type: "income", isDefault: true },
  { id: "pi-2", name: "Dividendos", type: "income", isDefault: true },
  { id: "pi-3", name: "Investimentos", type: "income", isDefault: true },
  { id: "pi-4", name: "Presentes", type: "income", isDefault: true },
  { id: "pi-5", name: "Outros", type: "income", isDefault: true },
];

export const personalExpenseCategories: Category[] = [
  { id: "pe-1", name: "Moradia", type: "expense", isDefault: true },
  { id: "pe-2", name: "Alimentação", type: "expense", isDefault: true },
  { id: "pe-3", name: "Transporte", type: "expense", isDefault: true },
  { id: "pe-4", name: "Lazer", type: "expense", isDefault: true },
  { id: "pe-5", name: "Saúde", type: "expense", isDefault: true },
  { id: "pe-6", name: "Outros", type: "expense", isDefault: true },
];

export const businessIncomeCategories: Category[] = [
  { id: "bi-1", name: "Vendas", type: "income", isDefault: true },
  { id: "bi-2", name: "Serviços", type: "income", isDefault: true },
  { id: "bi-3", name: "Reembolsos", type: "income", isDefault: true },
  { id: "bi-4", name: "Investimentos", type: "income", isDefault: true },
  { id: "bi-5", name: "Outros", type: "income", isDefault: true },
];

export const businessExpenseCategories: Category[] = [
  { id: "be-1", name: "Mercadoria", type: "expense", isDefault: true },
  { id: "be-2", name: "Fornecedores", type: "expense", isDefault: true },
  { id: "be-3", name: "Transporte", type: "expense", isDefault: true },
  { id: "be-4", name: "Marketing", type: "expense", isDefault: true },
  { id: "be-5", name: "Operacional", type: "expense", isDefault: true },
  { id: "be-6", name: "Outros", type: "expense", isDefault: true },
];

export function buildPresetCategories(preset: PresetType): Category[] {
    if (preset === "personal") {
        return [...personalIncomeCategories, ...personalExpenseCategories];
    }

    if (preset === "business") {
        return [...businessExpenseCategories, ...businessIncomeCategories];
    }

    return [];
}

export default function CategoriesPanel() {
    const [selectedPreset, setSelectedPreset] = useState<PresetType>("personal");
    const [categories, setCategories]= useState<Category[]>(
        buildPresetCategories("personal")
    );
    const [newIncomeCategory, setNewIncomeCategory] = useState("")
    const [newExpenseCategory, setNewExpenseCategory] = useState("")

    function applyPreset(preset: PresetType) {
        setSelectedPreset(preset);
        setCategories(buildPresetCategories(preset));
    }

    function addCategory(type: CategoryType) {
        const rawName = type === "income" ? newIncomeCategory : newExpenseCategory;
        const name = rawName.trim();

        if (!name) return;

        const alreadyExists = categories.some(
            (category) => {
                category.type === type &&
                category.name.toLowerCase() === name.toLowerCase()
            }
        )

        if (alreadyExists) return;

        const newCategory: Category = {
            id: crypto.randomUUID(),
            name, 
            type,
            isDefault: false,
        } ;

        setCategories((prev) => [...prev, newCategory]);

        if (type === "income") {
            setNewIncomeCategory("")
        } else {
            setNewExpenseCategory("")
        }

        setSelectedPreset("custom")
    }

    function removeCategory(id: string){
        setCategories((prev) => prev.filter((category) => category.id !== id))
        setSelectedPreset("custom");
    }

    function updateCategory(id: string, newName: string){
        const formattedName = newName.trim();
        if (!formattedName) return;

        setCategories((prev) => 
           prev.map((category) => 
            category.id === id ? {...category, name: formattedName} : category
           )
        );

        setSelectedPreset("custom");
    }

    const incomeCategories = categories.filter(
        (category) => category.type === "income"
    )

    const expenseCategories = categories.filter(
        (category) => category.type === "expense"
    )

    return (
        <div className="categoriesPanel">
            <div className="categoriesHeader">
                <h1 className="categoriesTitle">Categorias</h1>
                <p className="categoriesSubtitle">
                Escolha um modelo base e personalize suas categorias de entrada e
                despesa.
                </p>
            </div>

            <div className="presetSection">
                <h2 className="sectionTitle">Modo de uso</h2>

                <div className="presetButtons">
                <button
                    className={`presetButton ${
                    selectedPreset === "personal" ? "activePreset" : ""
                    }`}
                    onClick={() => applyPreset("personal")}
                >
                    Finanças pessoais
                </button>

                <button
                    className={`presetButton ${
                    selectedPreset === "business" ? "activePreset" : ""
                    }`}
                    onClick={() => applyPreset("business")}
                >
                    Negócio
                </button>

                <button
                    className={`presetButton ${
                    selectedPreset === "custom" ? "activePreset" : ""
                    }`}
                    onClick={() => setSelectedPreset("custom")}
                >
                    Personalizado
                </button>
                </div>
            </div>

            <div className="categoriesGrid">
                <div className="categoryBlock">
                    <div className="categoryBlockHeader">
                        <h2 className="sectionTitle">Entradas</h2>
                    </div>

                    <div className="categoryList">
                        {incomeCategories.map((category) => (
                        <div key={category.id} className="categoryItem">
                            <input
                                className="categoryInput"
                                defaultValue={category.name}
                                onBlur={(e) => updateCategory(category.id, e.target.value)}
                            />

                            <button
                                className="removeCategoryButton"
                                onClick={() => removeCategory(category.id)}
                            >
                            Remover
                            </button>
                        </div>
                        ))}
                    </div>

                    <div className="addCategoryRow">
                        <input
                            type="text"
                            placeholder="Nova categoria de entrada"
                            className="newCategoryInput"
                            value={newIncomeCategory}
                            onChange={(e) => setNewIncomeCategory(e.target.value)}
                        />

                        <button
                            className="addCategoryButton"
                            onClick={() => addCategory("income")}
                        >
                        Adicionar
                        </button>
                    </div>
                    </div>

                    <div className="categoryBlock">
                        <div className="categoryBlockHeader">
                            <h2 className="sectionTitle">Despesas</h2>
                        </div>

                        <div className="categoryList">
                            {expenseCategories.map((category) => (
                            <div key={category.id} className="categoryItem">
                                <input
                                    className="categoryInput"
                                    defaultValue={category.name}
                                    onBlur={(e) => updateCategory(category.id, e.target.value)}
                                />

                                <button
                                    className="removeCategoryButton"
                                    onClick={() => removeCategory(category.id)}
                                >
                                Remover
                                </button>
                            </div>
                            ))}
                        </div>

                        <div className="addCategoryRow">
                            <input
                                type="text"
                                placeholder="Nova categoria de despesa"
                                className="newCategoryInput"
                                value={newExpenseCategory}
                                onChange={(e) => setNewExpenseCategory(e.target.value)}
                            />

                            <button
                                className="addCategoryButton"
                                onClick={() => addCategory("expense")}
                            >
                            Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
    );
};