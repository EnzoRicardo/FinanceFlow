import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import "./accountsPanel.css";

type AccountType = "Corrente" | "Poupança" | "Carteira" | "Cartão";

type Account = {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
};

type Transaction = {
  type: "income" | "expense";
  amount: number;
  accountId: string | null;
  createdAt: Date;
};

const ACCOUNT_TYPES: AccountType[] = ["Corrente", "Poupança", "Carteira", "Cartão"];

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default function AccountsPanel() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<AccountType>("Corrente");
  const [newInitial, setNewInitial] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<AccountType>("Corrente");
  const [editInitial, setEditInitial] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setLoadingAccounts(true);

    const q = query(
      collection(db, "accounts"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Account[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: String(d.name ?? "").trim(),
          type: (d.type as AccountType) ?? "Carteira",
          initialBalance: Number(d.initialBalance) || 0,
        };
      });

      list.sort((a, b) => a.name.localeCompare(b.name));
      setAccounts(list);
      setLoadingAccounts(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    setLoadingTx(true);

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Transaction[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          type: d.type === "income" ? "income" : "expense",
          amount: Number(d.amount) || 0,
          accountId: d.accountId ?? null,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(),
        };
      });

      setTransactions(list);
      setLoadingTx(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  function previousMonth() {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1)
    );
  }

  type AccountStats = {
    balance: number;
    monthIncome: number;
    monthExpense: number;
  };

  const statsByAccount = useMemo(() => {
    const map = new Map<string, AccountStats>();

    accounts.forEach((acc) => {
      map.set(acc.id, {
        balance: acc.initialBalance,
        monthIncome: 0,
        monthExpense: 0,
      });
    });

    const unassigned: AccountStats = {
      balance: 0,
      monthIncome: 0,
      monthExpense: 0,
    };

    transactions.forEach((t) => {
      const target = t.accountId ? map.get(t.accountId) : null;
      const stats = target ?? unassigned;
      const isCurrentMonth = isSameMonth(t.createdAt, selectedMonth);

      if (t.type === "income") {
        stats.balance += t.amount;
        if (isCurrentMonth) stats.monthIncome += t.amount;
      } else {
        stats.balance -= t.amount;
        if (isCurrentMonth) stats.monthExpense += t.amount;
      }
    });

    return { map, unassigned };
  }, [accounts, transactions, selectedMonth]);

  const totalBalance = useMemo(() => {
    let sum = 0;
    statsByAccount.map.forEach((s) => (sum += s.balance));
    return sum;
  }, [statsByAccount]);

  const totalMonthExpense = useMemo(() => {
    let sum = 0;
    statsByAccount.map.forEach((s) => (sum += s.monthExpense));
    sum += statsByAccount.unassigned.monthExpense;
    return sum;
  }, [statsByAccount]);

  const totalMonthIncome = useMemo(() => {
    let sum = 0;
    statsByAccount.map.forEach((s) => (sum += s.monthIncome));
    sum += statsByAccount.unassigned.monthIncome;
    return sum;
  }, [statsByAccount]);

  const hasUnassigned =
    statsByAccount.unassigned.monthExpense > 0 ||
    statsByAccount.unassigned.monthIncome > 0;

  async function createAccount() {
    if (creating) return;

    const user = auth.currentUser;
    if (!user) return;

    const name = newName.trim();
    if (!name) {
      setError("Nome obrigatório");
      return;
    }

    const initial = newInitial === "" ? 0 : Number(newInitial);
    if (isNaN(initial)) {
      setError("Saldo inicial inválido");
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, "accounts"), {
        userId: user.uid,
        name,
        type: newType,
        initialBalance: initial,
        createdAt: Timestamp.now(),
      });

      setNewName("");
      setNewType("Corrente");
      setNewInitial("");
      setError("");
    } catch (err) {
      setError("Erro ao criar conta");
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(account: Account) {
    setEditingId(account.id);
    setEditName(account.name);
    setEditType(account.type);
    setEditInitial(String(account.initialBalance));
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditInitial("");
  }

  async function saveEdit(accountId: string) {
    if (submittingEdit) return;

    const name = editName.trim();
    if (!name) {
      setError("Nome obrigatório");
      return;
    }

    const initial = editInitial === "" ? 0 : Number(editInitial);
    if (isNaN(initial)) {
      setError("Saldo inicial inválido");
      return;
    }

    setSubmittingEdit(true);
    try {
      await updateDoc(doc(db, "accounts", accountId), {
        name,
        type: editType,
        initialBalance: initial,
      });
      cancelEdit();
    } catch (err) {
      setError("Erro ao atualizar conta");
      console.error(err);
    } finally {
      setSubmittingEdit(false);
    }
  }

  async function removeAccount(id: string) {
    if (removingId) return;

    setRemovingId(id);
    try {
      await deleteDoc(doc(db, "accounts", id));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  }

  const loading = loadingAccounts || loadingTx;

  return (
    <div className="accountsPanel">
      <div className="accountsHeader">
        <h1 className="accountsTitle">Contas</h1>
        <p className="accountsSubtitle">
          Acompanhe o saldo e os gastos de cada cartão ou carteira.
        </p>
        {error ? <p className="accountsError">{error}</p> : null}
      </div>

      <div className="accountsTotalRow">
        <div className="accountsTotalCard">
          <span className="accountsTotalLabel">Saldo total</span>
          <span
            className={`accountsTotalValue ${totalBalance < 0 ? "negative" : ""}`}
          >
            {BRL.format(totalBalance)}
          </span>
        </div>

        <div className="accountsTotalCard">
          <span className="accountsTotalLabel">Recebido no mês</span>
          <span className="accountsTotalValue income">
            {BRL.format(totalMonthIncome)}
          </span>
        </div>

        <div className="accountsTotalCard">
          <span className="accountsTotalLabel">Gasto no mês</span>
          <span className="accountsTotalValue expense">
            {BRL.format(totalMonthExpense)}
          </span>
        </div>
      </div>

      <div className="accountsMonthSelector">
        <button type="button" className="accountsMonthButton" onClick={previousMonth}>
          ‹
        </button>
        <span className="accountsMonthLabel">{formatMonthYear(selectedMonth)}</span>
        <button type="button" className="accountsMonthButton" onClick={nextMonth}>
          ›
        </button>
      </div>

      <div className="accountsCreateBlock">
        <h2 className="accountsSectionTitle">Nova conta</h2>
        <div className="accountsCreateRow">
          <input
            type="text"
            placeholder="Nome (ex: Nubank)"
            className="accountsInput"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <select
            className="accountsSelect"
            value={newType}
            onChange={(e) => setNewType(e.target.value as AccountType)}
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Saldo inicial"
            className="accountsInput"
            value={newInitial}
            onChange={(e) => setNewInitial(e.target.value)}
          />

          <button
            type="button"
            className="accountsCreateButton"
            onClick={() => void createAccount()}
            disabled={creating}
          >
            {creating ? "Criando..." : "Criar"}
          </button>
        </div>
      </div>

      <div className="accountsListBlock">
        <h2 className="accountsSectionTitle">Suas contas</h2>

        {loading ? (
          <p className="accountsMessage">Carregando contas...</p>
        ) : accounts.length === 0 ? (
          <p className="accountsMessage">Nenhuma conta criada ainda.</p>
        ) : (
          <ul className="accountsGrid">
            {accounts.map((account) => {
              const stats = statsByAccount.map.get(account.id) ?? {
                balance: account.initialBalance,
                monthIncome: 0,
                monthExpense: 0,
              };
              const isEditing = editingId === account.id;
              const monthNet = stats.monthIncome - stats.monthExpense;

              if (isEditing) {
                return (
                  <li key={account.id} className="accountCard">
                    <div className="accountEditForm">
                      <input
                        type="text"
                        className="accountsInput"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nome"
                      />
                      <select
                        className="accountsSelect"
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as AccountType)}
                      >
                        {ACCOUNT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        className="accountsInput"
                        value={editInitial}
                        onChange={(e) => setEditInitial(e.target.value)}
                        placeholder="Saldo inicial"
                      />
                      <div className="accountEditActions">
                        <button
                          type="button"
                          className="accountEditCancel"
                          onClick={cancelEdit}
                          disabled={submittingEdit}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="accountEditConfirm"
                          onClick={() => void saveEdit(account.id)}
                          disabled={submittingEdit}
                        >
                          {submittingEdit ? "Salvando..." : "Salvar"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li key={account.id} className="accountCard">
                  <div className="accountCardHeader">
                    <div className="accountCardInfo">
                      <span
                        className={`accountTypeBadge type-${account.type.toLowerCase()}`}
                      >
                        {account.type}
                      </span>
                      <h3 className="accountName">{account.name}</h3>
                    </div>
                    <button
                      type="button"
                      className="accountRemoveButton"
                      onClick={() => void removeAccount(account.id)}
                      disabled={removingId !== null}
                    >
                      {removingId === account.id ? "..." : "Remover"}
                    </button>
                  </div>

                  <div className="accountBalanceBlock">
                    <span className="accountBalanceLabel">Saldo atual</span>
                    <span
                      className={`accountBalanceValue ${stats.balance < 0 ? "negative" : ""}`}
                    >
                      {BRL.format(stats.balance)}
                    </span>
                  </div>

                  <div className="accountMonthStats">
                    <div className="accountMonthStat">
                      <span className="accountMonthLabel">Recebido</span>
                      <span className="accountMonthIncome">
                        + {BRL.format(stats.monthIncome)}
                      </span>
                    </div>

                    <div className="accountMonthStat">
                      <span className="accountMonthLabel">Gasto</span>
                      <span className="accountMonthExpense">
                        − {BRL.format(stats.monthExpense)}
                      </span>
                    </div>

                    <div className="accountMonthStat">
                      <span className="accountMonthLabel">Saldo do mês</span>
                      <span
                        className={
                          monthNet >= 0
                            ? "accountMonthIncome"
                            : "accountMonthExpense"
                        }
                      >
                        {monthNet >= 0 ? "+" : "−"} {BRL.format(Math.abs(monthNet))}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="accountEditButton"
                    onClick={() => startEdit(account)}
                  >
                    Editar
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {hasUnassigned ? (
          <div className="accountsUnassigned">
            <span className="accountsUnassignedTitle">Sem conta atribuída (mês)</span>
            <span className="accountsUnassignedDetail">
              Recebido:{" "}
              <strong className="accountMonthIncome">
                {BRL.format(statsByAccount.unassigned.monthIncome)}
              </strong>
              {" · "}Gasto:{" "}
              <strong className="accountMonthExpense">
                {BRL.format(statsByAccount.unassigned.monthExpense)}
              </strong>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
