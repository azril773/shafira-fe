import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Trash2 } from "lucide-react";
import {
  createUom,
  deleteUom,
  getUoms,
  updateUom,
} from "../../../services/uomService";

const emptyForm = { code: "", name: "", description: "" };

export default function UomPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await getUoms();
    if (error) {
      toast.error(error);
      return;
    }
    setItems(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = "Kode wajib diisi.";
    if (!form.name.trim()) e.name = "Nama wajib diisi.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description?.trim() || null,
    };
    const result = editingId
      ? await updateUom(editingId, payload)
      : await createUom(payload);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      editingId ? "UoM berhasil diperbarui." : "UoM berhasil ditambahkan.",
    );
    resetForm();
    load();
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      code: item.code || "",
      name: item.name || "",
      description: item.description || "",
    });
    setErrors({});
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Hapus UoM ${item.code}?`)) return;
    const { error } = await deleteUom(item.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("UoM dihapus.");
    if (editingId === item.id) resetForm();
    load();
  };

  return (
    <section className="rounded-[40px] border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
            Master Data
          </p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">
            Satuan (UoM)
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Kelola satuan terkecil seperti pcs, gram, ml, dll.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-3xl border border-orange-100">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-orange-50">
              <tr className="text-gray-500">
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Deskripsi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    Belum ada data UoM.
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id} className="border-t border-orange-50 hover:bg-orange-50/40">
                    <td className="px-4 py-3 font-semibold text-gray-800">{u.code}</td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.description || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(u)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 rounded-[32px] border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
            {editingId ? "Edit UoM" : "Tambah UoM"}
          </p>
          <label className="block">
            <span className="text-gray-600 text-sm">Kode</span>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="pcs, gram, ml, ..."
              className={`mt-2 w-full rounded-xl border bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.code
                  ? "border-red-500 focus:ring-red-300"
                  : "border-orange-200 focus:ring-orange-300"
              }`}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-500">{errors.code}</p>
            )}
          </label>
          <label className="block">
            <span className="text-gray-600 text-sm">Nama</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`mt-2 w-full rounded-xl border bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 ${
                errors.name
                  ? "border-red-500 focus:ring-red-300"
                  : "border-orange-200 focus:ring-orange-300"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </label>
          <label className="block">
            <span className="text-gray-600 text-sm">Deskripsi</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-2 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
          <div className="flex justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
              >
                Batal
              </button>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {editingId ? "Simpan Perubahan" : "Tambah"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
