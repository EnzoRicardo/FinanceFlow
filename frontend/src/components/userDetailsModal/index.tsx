import { useEffect, useState, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { api } from "../../services/api";
import type { UserDetails, UserDetailsTab, UserProfile } from "../../types/user";
import "./userDetailsModal.css";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const PAGE_SIZE = 5;

const TABS: { id: UserDetailsTab; label: string }[] = [
  { id: "transactions", label: "Transações" },
  { id: "accounts", label: "Contas" },
  { id: "goals", label: "Metas" },
  { id: "categories", label: "Categorias" },
  { id: "budgets", label: "Orçamentos" },
];

const INITIAL_PAGES: Record<UserDetailsTab, number> = {
  transactions: 1,
  accounts: 1,
  goals: 1,
  categories: 1,
  budgets: 1,
};

type UserDetailsModalProps = {
  user: UserProfile;
  onClose: () => void;
};

type PaginatedSectionProps = {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  children: ReactNode;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function roleLabel(role: UserProfile["role"]) {
  return role === "admin" ? "Administrador" : "Usuário";
}

function getErrorMessage(err: unknown, fallback: string) {
  const detail = isAxiosError(err) ? err.response?.data?.detail : undefined;
  return typeof detail === "string" ? detail : fallback;
}

function paginate<T>(items: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;

  return {
    items: items.slice(start, start + PAGE_SIZE),
    currentPage,
    totalPages,
  };
}

function PaginatedSection({
  page,
  totalItems,
  onPageChange,
  children,
}: PaginatedSectionProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  return (
    <div className="userDetailsSection">
      {children}

      {totalItems > 0 && (
        <div className="userDetailsPagination">
          <span className="userDetailsPaginationInfo">
            Página {currentPage} de {totalPages} · {totalItems} registro
            {totalItems === 1 ? "" : "s"}
          </span>

          <div className="userDetailsPaginationActions">
            <button
              type="button"
              className="userDetailsPaginationButton"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              className="userDetailsPaginationButton"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<UserDetailsTab>("transactions");
  const [pages, setPages] = useState(INITIAL_PAGES);

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<UserDetails>(`/users/${user.uid}/details`);
        setDetails(response.data);
        setPages(INITIAL_PAGES);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Erro ao carregar detalhes do usuário."));
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [user.uid]);

  function handleTabChange(tab: UserDetailsTab) {
    setActiveTab(tab);
  }

  function handlePageChange(tab: UserDetailsTab, page: number) {
    setPages((current) => ({ ...current, [tab]: page }));
  }

  const summary = details?.summary;

  const transactionsPage = paginate(details?.transactions ?? [], pages.transactions);
  const accountsPage = paginate(details?.accounts ?? [], pages.accounts);
  const goalsPage = paginate(details?.goals ?? [], pages.goals);
  const categoriesPage = paginate(details?.categories ?? [], pages.categories);
  const budgetsPage = paginate(details?.budgets ?? [], pages.budgets);

  return (
    <div className="userDetailsOverlay" onClick={onClose}>
      <div
        className="userDetailsModal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="userDetailsHeader">
          <div>
            <h2 className="userDetailsTitle">{user.name || "Usuário sem nome"}</h2>
            <p className="userDetailsEmail">{user.email}</p>
            <div className="userDetailsMeta">
              <span
                className={`userDetailsRoleBadge ${
                  user.role === "admin" ? "admin" : "user"
                }`}
              >
                {roleLabel(user.role)}
              </span>
              <span>Cadastro: {formatDate(user.createdAt)}</span>
            </div>
          </div>

          <button
            type="button"
            className="userDetailsCloseButton"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {error && <p className="userDetailsError">{error}</p>}
        {loading && <p className="userDetailsLoading">Carregando detalhes...</p>}

        {!loading && details && (
          <>
            <div className="userDetailsSummary">
              <div className="userDetailsSummaryCard">
                <strong>{summary?.transactionsCount ?? 0}</strong>
                <span>Transações</span>
              </div>
              <div className="userDetailsSummaryCard">
                <strong>{summary?.accountsCount ?? 0}</strong>
                <span>Contas</span>
              </div>
              <div className="userDetailsSummaryCard">
                <strong>{summary?.goalsCount ?? 0}</strong>
                <span>Metas</span>
              </div>
              <div className="userDetailsSummaryCard">
                <strong>{summary?.categoriesCount ?? 0}</strong>
                <span>Categorias</span>
              </div>
              <div className="userDetailsSummaryCard">
                <strong>{summary?.budgetsCount ?? 0}</strong>
                <span>Orçamentos</span>
              </div>
            </div>

            <div className="userDetailsTabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`userDetailsTab ${
                    activeTab === tab.id ? "active" : ""
                  }`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="userDetailsContent">
              {activeTab === "transactions" && (
                <PaginatedSection
                  page={transactionsPage.currentPage}
                  totalItems={details.transactions.length}
                  onPageChange={(page) => handlePageChange("transactions", page)}
                >
                  <div className="userDetailsTableWrapper">
                    <table className="userDetailsTable">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Categoria</th>
                          <th>Tipo</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.transactions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="userDetailsEmpty">
                              Nenhuma transação cadastrada.
                            </td>
                          </tr>
                        ) : (
                          transactionsPage.items.map((item) => (
                            <tr key={item.id}>
                              <td>{formatDate(item.createdAt)}</td>
                              <td>{item.category || "—"}</td>
                              <td>
                                <span
                                  className={`userDetailsTypeBadge ${
                                    item.type === "income" ? "income" : "expense"
                                  }`}
                                >
                                  {item.type === "income" ? "Receita" : "Despesa"}
                                </span>
                              </td>
                              <td>{BRL.format(item.amount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </PaginatedSection>
              )}

              {activeTab === "accounts" && (
                <PaginatedSection
                  page={accountsPage.currentPage}
                  totalItems={details.accounts.length}
                  onPageChange={(page) => handlePageChange("accounts", page)}
                >
                  <div className="userDetailsTableWrapper">
                    <table className="userDetailsTable">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Tipo</th>
                          <th>Saldo inicial</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.accounts.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="userDetailsEmpty">
                              Nenhuma conta cadastrada.
                            </td>
                          </tr>
                        ) : (
                          accountsPage.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>{item.type || "—"}</td>
                              <td>{BRL.format(item.initialBalance)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </PaginatedSection>
              )}

              {activeTab === "goals" && (
                <PaginatedSection
                  page={goalsPage.currentPage}
                  totalItems={details.goals.length}
                  onPageChange={(page) => handlePageChange("goals", page)}
                >
                  <div className="userDetailsTableWrapper">
                    <table className="userDetailsTable">
                      <thead>
                        <tr>
                          <th>Meta</th>
                          <th>Atual</th>
                          <th>Alvo</th>
                          <th>Prazo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.goals.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="userDetailsEmpty">
                              Nenhuma meta cadastrada.
                            </td>
                          </tr>
                        ) : (
                          goalsPage.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>{BRL.format(item.currentAmount)}</td>
                              <td>{BRL.format(item.targetAmount)}</td>
                              <td>{formatDate(item.deadline)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </PaginatedSection>
              )}

              {activeTab === "categories" && (
                <PaginatedSection
                  page={categoriesPage.currentPage}
                  totalItems={details.categories.length}
                  onPageChange={(page) => handlePageChange("categories", page)}
                >
                  <div className="userDetailsTableWrapper">
                    <table className="userDetailsTable">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.categories.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="userDetailsEmpty">
                              Nenhuma categoria cadastrada.
                            </td>
                          </tr>
                        ) : (
                          categoriesPage.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.name}</td>
                              <td>
                                {item.type === "income"
                                  ? "Receita"
                                  : item.type === "expense"
                                    ? "Despesa"
                                    : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </PaginatedSection>
              )}

              {activeTab === "budgets" && (
                <PaginatedSection
                  page={budgetsPage.currentPage}
                  totalItems={details.budgets.length}
                  onPageChange={(page) => handlePageChange("budgets", page)}
                >
                  <div className="userDetailsTableWrapper">
                    <table className="userDetailsTable">
                      <thead>
                        <tr>
                          <th>Categoria</th>
                          <th>Limite mensal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.budgets.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="userDetailsEmpty">
                              Nenhum orçamento cadastrado.
                            </td>
                          </tr>
                        ) : (
                          budgetsPage.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.category}</td>
                              <td>{BRL.format(item.monthlyLimit)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </PaginatedSection>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
