import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getPurchaseById,
  getVendors,
  updatePurchase,
} from "../../../services/purchaseService";
import { getProducts } from "../../../services/productService";
import { formatRupiah } from "../../../utils/format";

function toDatetimeLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditPurchasePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [purchase, setPurchase] = useState(location.state?.purchase || null);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  const [vendorId, setVendorId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [details, setDetails] = useState([{ productId: "", qty: 1, purchasePrice: 0 }]);
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  useEffect(() => {
    (async () => {
      const [{ data: vendorData, error: vendorError }, { data: productData, error: productError }] =
        await Promise.all([getVendors(), getProducts()]);
      if (vendorError) toast.error(vendorError);
      else setVendors(vendorData || []);
      if (productError) toast.error(productError);
      else setProducts(productData || []);

      if (id) {
        const { data, error } = await getPurchaseById(id);
        if (error) {
          toast.error(error);
          return;
        }
        setPurchase(data);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!purchase) return;
    setVendorId(purchase.vendorId || purchase.vendor?.id || "");
    setPurchaseDate(toDatetimeLocalInput(purchase.purchaseDate));
    if (purchase.purchaseDetails && purchase.purchaseDetails.length > 0) {
      setDetails(
        purchase.purchaseDetails.map((d) => ({
          productId: d.productId || d.product?.id || "",
          qty: d.qty || 1,
          purchasePrice: Number(d.purchasePrice) || 0,
        })),
      );
    }
  }, [purchase]);

  const checkError = () => {
    const tempError = {};
    if (!vendorId) tempError.vendorId = "Vendor harus dipilih.";
    if (!purchaseDate) tempError.purchaseDate = "Tanggal pembelian harus diisi.";
    if (!details.length) tempError.details = "Tambahkan minimal satu produk.";
    const seen = new Set();
    details.forEach((d, idx) => {
      if (!d.productId)
        tempError[`details.${idx}.productId`] = "Produk harus dipilih.";
      else if (seen.has(d.productId))
        tempError[`details.${idx}.productId`] = "Produk tidak boleh duplikat.";
      else seen.add(d.productId);
      if (!d.qty || d.qty <= 0)
        tempError[`details.${idx}.qty`] = "Qty harus angka positif.";
      if (d.purchasePrice === "" || d.purchasePrice === undefined || Number(d.purchasePrice) < 0)
        tempError[`details.${idx}.purchasePrice`] = "Harga beli tidak boleh negatif.";
    });
    setError(tempError);
    return Object.keys(tempError).length === 0;
  };

  const updateDetail = (index, key, value) => {
    setError((prev) => {
      const cleaned = { ...prev };
      delete cleaned[`details.${index}.${key}`];
      delete cleaned.details;
      return cleaned;
    });
    setDetails((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleSave = async () => {
    if (!checkError()) return;
    setLoading(true);
    const { error } = await updatePurchase({
      id,
      vendorId,
      purchaseDate: new Date(purchaseDate).toISOString(),
      details: details.map((d) => ({
        productId: d.productId,
        qty: Number(d.qty),
        purchasePrice: Number(d.purchasePrice) || 0,
      })),
    });
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Pembelian berhasil diperbarui.");
    navigate("/inventory/purchases");
  };

  if (!purchase) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-gray-700">
        <h2 className="text-xl font-semibold text-gray-900">
          Memuat data pembelian...
        </h2>
        <button
          type="button"
          onClick={() => navigate("/inventory/purchases")}
          className="mt-4 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Kembali ke Daftar Pembelian
        </button>
      </div>
    );
  }

  if (purchase.status && purchase.status !== "PENDING") {
    return (
      <div className="mx-auto max-w-4xl p-6 text-gray-700">
        <h2 className="text-xl font-semibold text-gray-900">
          Pembelian tidak dapat diubah
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Hanya pembelian dengan status PENDING yang bisa diedit. Status saat
          ini: <span className="font-semibold">{purchase.status}</span>
        </p>
        <button
          type="button"
          onClick={() => navigate("/inventory/purchases")}
          className="mt-4 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Kembali ke Daftar Pembelian
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-4xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
              Edit Pembelian
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              {purchase.vendor?.name || "Pembelian"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/inventory/purchases")}
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
          >
            Kembali
          </button>
        </div>

        <div className="space-y-6">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Vendor</span>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className={`mt-2 w-full rounded-3xl border ${error.vendorId ? "border-red-500" : "border-orange-200"} bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300`}
            >
              <option value="">Pilih Vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            {error.vendorId && (
              <p className="mt-2 text-xs text-red-500">{error.vendorId}</p>
            )}
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">
              Tanggal Pembelian
            </span>
            <input
              type="datetime-local"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={`mt-2 w-full rounded-3xl border ${error.purchaseDate ? "border-red-500" : "border-orange-200"} bg-orange-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300`}
            />
            {error.purchaseDate && (
              <p className="mt-2 text-xs text-red-500">{error.purchaseDate}</p>
            )}
          </label>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                Daftar Produk
              </span>
              <button
                type="button"
                onClick={() =>
                  setDetails((prev) => [...prev, { productId: "", qty: 1, purchasePrice: 0 }])
                }
                className="rounded-full border border-orange-300 px-3 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-50"
              >
                + Tambah Produk
              </button>
            </div>
            {error.details && (
              <p className="mt-1 text-xs text-red-500">{error.details}</p>
            )}
            <div className="mt-3 space-y-3">
              {details.map((d, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-orange-100 bg-orange-50/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">
                      Produk {idx + 1}
                    </p>
                    {details.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDetails((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-xs font-semibold text-red-500 hover:text-red-700"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <select
                    value={d.productId}
                    onChange={(e) =>
                      updateDetail(idx, "productId", e.target.value)
                    }
                    className={`mt-2 w-full rounded-xl border ${error[`details.${idx}.productId`] ? "border-red-500" : "border-orange-200"} bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300`}
                  >
                    <option value="">Pilih Produk</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  {error[`details.${idx}.productId`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {error[`details.${idx}.productId`]}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Qty</span>
                    <input
                      type="number"
                      min="1"
                      value={d.qty}
                      onChange={(e) =>
                        updateDetail(idx, "qty", Number(e.target.value))
                      }
                      className={`w-full rounded-xl border ${error[`details.${idx}.qty`] ? "border-red-500" : "border-orange-200"} bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300`}
                    />
                  </div>
                  {error[`details.${idx}.qty`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {error[`details.${idx}.qty`]}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Harga Beli</span>
                    <input
                      type="number"
                      min="0"
                      value={d.purchasePrice ?? 0}
                      onChange={(e) =>
                        updateDetail(idx, "purchasePrice", Number(e.target.value))
                      }
                      className={`w-full rounded-xl border ${error[`details.${idx}.purchasePrice`] ? "border-red-500" : "border-orange-200"} bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300`}
                    />
                  </div>
                  {error[`details.${idx}.purchasePrice`] && (
                    <p className="mt-1 text-xs text-red-500">
                      {error[`details.${idx}.purchasePrice`]}
                    </p>
                  )}
                  {d.productId && productMap.get(d.productId) && (
                    <p className="mt-2 text-xs text-gray-500">
                      Estimasi:{" "}
                      {formatRupiah(
                        (Number(d.qty) || 0) * (Number(d.purchasePrice) || 0),
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/inventory/purchases")}
              className="rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSave}
              className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
