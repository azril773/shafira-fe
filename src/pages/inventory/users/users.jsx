import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2, ShieldCheck, ShieldX } from "lucide-react";
import {
  approveUser,
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "../../../services/userService";
import {
  ROLES,
  USER_STATUS_APPROVED,
  USER_STATUS_PENDING,
  USER_STATUS_REJECTED,
} from "../../../constants/user";
import AdminVerifyModal from "../../../components/globals/AdminVerifyModal";

const STATUS_BADGE = {
  [USER_STATUS_PENDING]: "bg-yellow-100 text-yellow-700",
  [USER_STATUS_APPROVED]: "bg-green-100 text-green-700",
  [USER_STATUS_REJECTED]: "bg-red-100 text-red-700",
};

const emptyForm = {
  username: "",
  name: "",
  password: "",
  role: ROLES[0],
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verify, setVerify] = useState(null); // { user, approve, role }

  const load = async () => {
    const { data, error } = await listUsers({
      status: filterStatus || undefined,
      role: filterRole || undefined,
      search: search || undefined,
    });
    if (error) {
      toast.error(error);
      return;
    }
    setUsers(data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterRole]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username wajib diisi.";
    if (!editingId && !form.password) e.password = "Password wajib diisi.";
    if (!ROLES.includes(form.role)) e.role = "Role tidak valid.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const payload = {
      username: form.username.trim(),
      name: form.name?.trim() || null,
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
    };
    const result = editingId
      ? await updateUser(editingId, payload)
      : await createUser(payload);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(editingId ? "User diperbarui." : "User berhasil ditambahkan.");
    resetForm();
    load();
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setForm({
      username: user.username || "",
      name: user.name || "",
      password: "",
      role: user.role || ROLES[0],
    });
    setErrors({});
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Hapus user ${user.username}?`)) return;
    const { error } = await deleteUser(user.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("User dihapus.");
    if (editingId === user.id) resetForm();
    load();
  };

  const openVerify = (user, approve, role) => {
    setVerify({ user, approve, role: role ?? user.role });
  };

  return (
    <section className="rounded-[40px] border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
            Manajemen User
          </p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">
            User & Role
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Atur akun pengguna. Persetujuan / perubahan role memerlukan
            verifikasi admin.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-gray-600">
          Status
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="">Semua</option>
            <option value={USER_STATUS_PENDING}>Pending</option>
            <option value={USER_STATUS_APPROVED}>Approved</option>
            <option value={USER_STATUS_REJECTED}>Rejected</option>
          </select>
        </label>
        <label className="block text-sm text-gray-600">
          Role
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="">Semua</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-gray-600">
          Cari
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Username..."
              className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              type="button"
              onClick={load}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Cari
            </button>
          </div>
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-x-auto rounded-3xl border border-orange-100">
          <table className="w-full min-w-160 text-left text-sm text-gray-600">
            <thead>
              <tr className="border-b border-orange-100 text-gray-500">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    Tidak ada user.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-orange-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {u.username}
                  </td>
                  <td className="px-4 py-3">{u.name || "-"}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[u.status] || "bg-gray-100 text-gray-700"}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {u.status === USER_STATUS_PENDING && (
                        <>
                          <button
                            type="button"
                            onClick={() => openVerify(u, true, u.role)}
                            className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600 inline-flex items-center gap-1"
                            title="Approve"
                          >
                            <ShieldCheck size={14} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openVerify(u, false)}
                            className="rounded-full border border-red-500 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                            title="Reject"
                          >
                            <ShieldX size={14} /> Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEdit(u)}
                        className="rounded-full border border-orange-200 px-2 py-1 text-orange-700 hover:bg-orange-50"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        className="rounded-full border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
            {editingId ? "Edit User" : "Tambah User"}
          </p>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <label className="block">
              <span className="text-gray-600">Username</span>
              <input
                type="text"
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
                disabled={!!editingId}
                className={`mt-2 w-full rounded-xl border ${errors.username ? "border-red-500" : "border-orange-200"} bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-gray-100`}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">{errors.username}</p>
              )}
            </label>
            <label className="block">
              <span className="text-gray-600">Nama</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </label>
            <label className="block">
              <span className="text-gray-600">
                Password {editingId && "(kosongkan jika tidak diubah)"}
              </span>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                className={`mt-2 w-full rounded-xl border ${errors.password ? "border-red-500" : "border-orange-200"} bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </label>
            <label className="block">
              <span className="text-gray-600">Role</span>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((p) => ({ ...p, role: e.target.value }))
                }
                className={`mt-2 w-full rounded-xl border ${errors.role ? "border-red-500" : "border-orange-200"} bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300`}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                >
                  Batal
                </button>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {loading
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Tambah User"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {verify && (
        <AdminVerifyModal
          title={verify.approve ? "Verifikasi Approve User" : "Verifikasi Reject User"}
          description={
            verify.approve
              ? `Approve ${verify.user.username} sebagai ${verify.role}.`
              : `Tolak akun ${verify.user.username}.`
          }
          confirmLabel="Verifikasi"
          tone={verify.approve ? "orange" : "red"}
          onCancel={() => setVerify(null)}
          onVerified={async (creds) => {
            // AdminVerifyModal calls verifyAdminApi internally; we need credentials.
            // Re-prompt: use sessionStorage workaround? Instead build dedicated flow:
            setVerify(null);
            const { error } = await approveUser(verify.user.id, {
              approve: verify.approve,
              role: verify.approve ? verify.role : undefined,
              verifierUsername: creds?.username || "",
              verifierPassword: creds?.password || "",
            });
            if (error) {
              toast.error(error);
              return;
            }
            toast.success(verify.approve ? "User di-approve." : "User di-reject.");
            load();
          }}
        />
      )}
    </section>
  );
}
