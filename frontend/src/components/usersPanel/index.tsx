import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import UserDetailsModal from "../userDetailsModal";
import { api } from "../../services/api";
import type { UserProfile, UserRole } from "../../types/user";
import "./usersPanel.css";

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

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg ?? String(item)).join("\n");
  }

  return fallback;
}

export default function UsersPanel() {
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading, firebaseUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("user");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailsUser, setDetailsUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAdmin) {
      navigate("/home");
    }
  }, [authLoading, isAdmin, navigate]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<UserProfile[]>("/users");
      setUsers(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erro ao carregar usuários. Tente novamente."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    loadUsers();
  }, [authLoading, isAdmin, loadUsers]);

  function openEditModal(user: UserProfile) {
    setEditingUser(user);
    setEditName(user.name ?? "");
    setEditRole(user.role);
  }

  function closeEditModal() {
    if (saving) return;
    setEditingUser(null);
    setEditName("");
    setEditRole("user");
  }

  async function handleSaveEdit() {
    if (!editingUser || saving) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setError("Nome é obrigatório.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await api.patch<UserProfile>(`/users/${editingUser.uid}`, {
        name: trimmedName,
        role: editRole,
      });

      setUsers((current) =>
        current.map((user) =>
          user.uid === editingUser.uid ? response.data : user,
        ),
      );
      closeEditModal();

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Usuário atualizado com sucesso!",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erro ao atualizar usuário."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: UserProfile) {
    if (deletingId) return;

    const result = await Swal.fire({
      title: "Excluir usuário?",
      text: `Deseja excluir a conta de ${user.name || user.email}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
      buttonsStyling: false,
      customClass: {
        popup: "ff-popup",
        title: "ff-title",
        htmlContainer: "ff-text",
        confirmButton: "ff-confirm",
        cancelButton: "ff-cancel",
      },
    });

    if (!result.isConfirmed) return;

    setDeletingId(user.uid);
    setError("");

    try {
      await api.delete(`/users/${user.uid}`);
      setUsers((current) => current.filter((item) => item.uid !== user.uid));

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Usuário excluído com sucesso!",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Erro ao excluir usuário."));
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading || !isAdmin) {
    return null;
  }

  const isEditingSelf = editingUser?.uid === firebaseUser?.uid;

  return (
    <div className="usersPanel">
      <div className="usersHeader">
        <h1 className="usersTitle">Usuários</h1>
        <p className="usersSubtitle">
          Gerencie contas cadastradas no FinanceFlow.
        </p>
      </div>

      {error && <p className="usersError">{error}</p>}
      {loading && <p className="usersLoading">Carregando usuários...</p>}

      {!loading && (
        <div className="usersTableWrapper">
          <table className="usersTable">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Cadastro</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="usersEmpty">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.uid === firebaseUser?.uid;

                  return (
                    <tr key={user.uid}>
                      <td>{user.name || "—"}</td>
                      <td>{user.email || "—"}</td>
                      <td>
                        <span
                          className={`usersRoleBadge ${
                            user.role === "admin" ? "admin" : "user"
                          }`}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="usersActions">
                          <button
                            type="button"
                            className="usersActionButton details"
                            onClick={() => setDetailsUser(user)}
                          >
                            Detalhes
                          </button>
                          <button
                            type="button"
                            className="usersActionButton edit"
                            onClick={() => openEditModal(user)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="usersActionButton delete"
                            disabled={isSelf || deletingId === user.uid}
                            onClick={() => handleDelete(user)}
                          >
                            {deletingId === user.uid ? "Excluindo..." : "Excluir"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {detailsUser && (
        <UserDetailsModal
          user={detailsUser}
          onClose={() => setDetailsUser(null)}
        />
      )}

      {editingUser && (
        <div className="usersModalOverlay" onClick={closeEditModal}>
          <div
            className="usersModal"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="usersModalTitle">Editar usuário</h2>
            <p className="usersModalEmail">{editingUser.email}</p>

            <label className="usersField">
              <span>Nome</span>
              <input
                type="text"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                disabled={saving}
              />
            </label>

            <label className="usersField">
              <span>Perfil</span>
              <select
                value={editRole}
                onChange={(event) =>
                  setEditRole(event.target.value as UserRole)
                }
                disabled={saving || isEditingSelf}
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </label>

            {isEditingSelf && (
              <p className="usersModalHint">
                Você não pode alterar seu próprio perfil de administrador.
              </p>
            )}

            <div className="usersModalActions">
              <button
                type="button"
                className="usersModalButton secondary"
                onClick={closeEditModal}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="usersModalButton primary"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
