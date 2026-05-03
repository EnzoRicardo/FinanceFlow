import { useEffect, useState } from "react";
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
import "./goalsPanel.css";

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
};

const BrazilianCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function GoalsPanel() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [submittingContribution, setSubmittingContribution] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    const q = query(
      collection(db, "goals"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Goal[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: String(d.name ?? "").trim(),
          targetAmount: Number(d.targetAmount) || 0,
          currentAmount: Number(d.currentAmount) || 0,
          deadline: d.deadline?.toDate ? d.deadline.toDate() : null,
        };
      });

      list.sort((a, b) => a.name.localeCompare(b.name));

      setGoals(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  async function createGoal() {
    if (creating) return;

    const user = auth.currentUser;
    if (!user) return;

    const name = newName.trim();
    const target = Number(newTarget);

    if (!name) {
      setError("Nome obrigatório");
      return;
    }

    if (!target || target <= 0) {
      setError("Valor alvo inválido");
      return;
    }

    let deadline: Timestamp | null = null;
    if (newDeadline) {
      const parsed = new Date(newDeadline + "T00:00:00");
      if (!isNaN(parsed.getTime())) {
        deadline = Timestamp.fromDate(parsed);
      }
    }

    setCreating(true);
    try {
      await addDoc(collection(db, "goals"), {
        userId: user.uid,
        name,
        targetAmount: target,
        currentAmount: 0,
        deadline,
        createdAt: Timestamp.now(),
      });

      setNewName("");
      setNewTarget("");
      setNewDeadline("");
      setError("");
    } catch (err) {
      setError("Erro ao criar meta");
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  function startContribution(goalId: string) {
    setContributingId(goalId);
    setContributionAmount("");
    setError("");
  }

  function cancelContribution() {
    setContributingId(null);
    setContributionAmount("");
  }

  async function submitContribution(goal: Goal) {
    if (submittingContribution) return;

    const value = Number(contributionAmount);
    if (!value || value <= 0) {
      setError("Valor inválido");
      return;
    }

    setSubmittingContribution(true);
    try {
      await updateDoc(doc(db, "goals", goal.id), {
        currentAmount: goal.currentAmount + value,
      });
      cancelContribution();
    } catch (err) {
      setError("Erro ao adicionar valor");
      console.error(err);
    } finally {
      setSubmittingContribution(false);
    }
  }

  async function removeGoal(id: string) {
    if (removingId) return;

    setRemovingId(id);
    try {
      await deleteDoc(doc(db, "goals", id));
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingId(null);
    }
  }

  function formatDeadline(date: Date | null) {
    if (!date) return null;
    return date.toLocaleDateString("pt-BR");
  }

  return (
    <div className="goalsPanel">
      <div className="goalsHeader">
        <h1 className="goalsTitle">Metas</h1>
        <p className="goalsSubtitle">
          Defina objetivos financeiros e acompanhe seu progresso.
        </p>

        {error ? <p className="goalsError">{error}</p> : null}
      </div>

      <div className="goalsCreateBlock">
        <h2 className="goalsSectionTitle">Nova meta</h2>

        <div className="goalsCreateRow">
          <input
            type="text"
            placeholder="Nome (ex: Viagem)"
            className="goalsInput"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <input
            type="number"
            placeholder="Valor alvo"
            className="goalsInput"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
          />

          <input
            type="date"
            className="goalsInput"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
          />

          <button
            type="button"
            className="goalsCreateButton"
            onClick={() => void createGoal()}
            disabled={creating}
          >
            {creating ? "Criando..." : "Criar"}
          </button>
        </div>
      </div>

      <div className="goalsListBlock">
        <h2 className="goalsSectionTitle">Suas metas</h2>

        {loading ? (
          <p className="goalsMessage">Carregando metas...</p>
        ) : goals.length === 0 ? (
          <p className="goalsMessage">Nenhuma meta criada ainda.</p>
        ) : (
          <ul className="goalsList">
            {goals.map((goal) => {
              const progress =
                goal.targetAmount > 0
                  ? Math.min(
                      100,
                      (goal.currentAmount / goal.targetAmount) * 100
                    )
                  : 0;
              const completed = goal.currentAmount >= goal.targetAmount;
              const isContributing = contributingId === goal.id;
              const deadlineText = formatDeadline(goal.deadline);

              return (
                <li key={goal.id} className="goalCard">
                  <div className="goalCardHeader">
                    <div>
                      <h3 className="goalName">{goal.name}</h3>
                      {deadlineText ? (
                        <span className="goalDeadline">
                          Prazo: {deadlineText}
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      className="goalRemoveButton"
                      onClick={() => void removeGoal(goal.id)}
                      disabled={removingId !== null}
                    >
                      {removingId === goal.id ? "Removendo..." : "Remover"}
                    </button>
                  </div>

                  <div className="goalProgressInfo">
                    <span>
                      {BrazilianCurrencyFormatter.format(goal.currentAmount)}
                      {" / "}
                      {BrazilianCurrencyFormatter.format(goal.targetAmount)}
                    </span>
                    <span
                      className={
                        completed ? "goalPercentDone" : "goalPercent"
                      }
                    >
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  <div className="goalProgressBar">
                    <div
                      className={
                        completed
                          ? "goalProgressFillDone"
                          : "goalProgressFill"
                      }
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {isContributing ? (
                    <div className="goalContributeRow">
                      <input
                        type="number"
                        placeholder="Valor"
                        className="goalsInput"
                        value={contributionAmount}
                        onChange={(e) =>
                          setContributionAmount(e.target.value)
                        }
                      />

                      <button
                        type="button"
                        className="goalContributeConfirm"
                        onClick={() => void submitContribution(goal)}
                        disabled={submittingContribution}
                      >
                        {submittingContribution ? "Salvando..." : "Confirmar"}
                      </button>

                      <button
                        type="button"
                        className="goalContributeCancel"
                        onClick={cancelContribution}
                        disabled={submittingContribution}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="goalContributeButton"
                      onClick={() => startContribution(goal.id)}
                      disabled={completed}
                    >
                      {completed ? "Meta atingida" : "Adicionar valor"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
