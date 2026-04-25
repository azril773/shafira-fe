import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { validateBarcode } from "../../../utils/utils";
import { updateVendor } from "../../../services/vendorService";

export default function EditVendorPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const vendor = location.state?.vendor;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState({});

  useEffect(() => {
    if (!vendor) return;
    setName(vendor.name || "");
    setPhone(vendor.phone || "");
  }, [vendor]);

  const checkError = () => {
    const tempError = {};
    if (!name.trim()) tempError.name = "Nama vendor harus diisi.";
    if (!phone.trim()) tempError.phone = "Nomor telepon vendor harus diisi.";
    setError(tempError);
    return Object.keys(tempError).length === 0;
  };

  const handleUpdate = async () => {
    if (!checkError()) return;

    try {
      await updateVendor({
        id,
        name,
        phone,
      });
      toast.success("Data vendor berhasil diperbarui.");
      navigate("/inventory/vendors");
    } catch (err) {
      console.log(err);
      toast.error("Gagal menyimpan perubahan vendor.");
    }
  };  

  if (!vendor) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-gray-700">
        <h2 className="text-xl font-semibold text-gray-900">
          Vendor tidak ditemukan
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Silakan pilih vendor dari daftar terlebih dahulu.
        </p>
        <button
          type="button"
          onClick={() => navigate("/inventory/vendors")}
          className="mt-4 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Kembali ke Daftar Vendor
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-[32px] border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
              Edit Vendor
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              {vendor.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/inventory/vendors")}
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
          >
            Kembali
          </button>
        </div>

        <div className="space-y-6">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">
              Nama Vendor
            </span>
            <input
              defaultValue={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            {error.name && (
              <p className="mt-2 text-xs text-red-500">{error.name}</p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Nomor Telepon</span>
            <input
              defaultValue={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            {error.phone && (
              <p className="mt-2 text-xs text-red-500">{error.phone}</p>
            )}
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/inventory/vendors")}
              className="rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
