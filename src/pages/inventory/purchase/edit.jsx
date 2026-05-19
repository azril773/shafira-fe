import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getPurchaseById,
  getVendors,
  updatePurchase,
} from "../../../services/purchaseService";
import { searchProductForPurchase } from "../../../services/productService";
import { formatNumberId, formatRupiah, parseNumberInput } from "../../../utils/format";
import ProductSearchSelect from "../../../components/globals/ProductSearchSelect";

function toDatetimeLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeNumericText(value, maxFractionDigits = 3, allowZero = false) {
  const num = parseNumberInput(value);
  if (allowZero && num === 0) return "0";
  if (num <= 0) return "";
  return formatNumberId(num, { maximumFractionDigits: maxFractionDigits });
}

export default function EditPurchasePage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [purchase, setPurchase] = useState(location.state?.purchase || null);
  const [vendors, setVendors] = useState([]);

  const [vendorId, setVendorId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [details, setDetails] = useState([{ productId: "", qty: "1", purchasePrice: "0" }]);
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const detailsScrollRef = useRef(null);
  useEffect(() => {
    if (!showDetailsModal) return;
    if (detailsScrollRef.current) {
      detailsScrollRef.current.scrollTop = detailsScrollRef.current.scrollHeight;
    }
  }, [details.length, showDetailsModal]);

  useEffect(() => {
    (async () => {
      const [{ data: vendorData, error: vendorError }] =
        await Promise.all([getVendors()]);
      if (vendorError) toast.error(vendorError);
      else setVendors(vendorData || []);

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
          productName: d.product?.name || "",
          qty: formatNumberId(d.qty || 1, { maximumFractionDigits: 3 }),
          purchasePrice: formatNumberId(Number(d.purchasePrice) || 0, { maximumFractionDigits: 0 }),
        })),
      );
    }
  }, [purchase]);

  useEffect(() => {
    if (!showDetailsModal) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowDetailsModal(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDetailsModal]);

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
      if (parseNumberInput(d.qty) <= 0)
        tempError[`details.${idx}.qty`] = "Qty harus angka positif.";
      if (d.purchasePrice === "" || d.purchasePrice === undefined || parseNumberInput(d.purchasePrice) < 0)
        tempError[`details.${idx}.purchasePrice`] = "Harga beli tidak boleh negatif.";
    });
    setError(tempError);
    return Object.keys(tempError).length === 0;
  };

  const updateDetail = (index, key, value, product = null) => {
    if (key === "productId" && value) {
      const duplicateDetail = details.find((d, i) => i !== index && d.productId === value);
      if (duplicateDetail) {
        toast.warning(`${duplicateDetail.productName || "Produk ini"} sudah ada dalam daftar pembelian.`);
        return;
      }
    }
    setError((prev) => {
      const cleaned = { ...prev };
      delete cleaned[`details.${index}.${key}`];
      delete cleaned.details;
      return cleaned;
    });
    setDetails((prev) => {
      const next = [...prev];
      if (key === "productId") {
        next[index] = { ...next[index], productId: value, productName: product?.name || "" };
      } else {
        next[index] = { ...next[index], [key]: value };
      }
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
        qty: parseNumberInput(d.qty),
        purchasePrice: parseNumberInput(d.purchasePrice) || 0,
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

  const detailFieldErrorCount = Object.keys(error).filter((k) =>
    k.startsWith("details."),
  ).length;
  const hasDetailError = Boolean(error.details) || detailFieldErrorCount > 0;

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
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{details.length} item</span>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(true)}
                  className="rounded-full border border-orange-300 px-3 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-50"
                >
                  Kelola di Modal
                </button>
              </div>
            </div>
            {hasDetailError && (
              <p className="mt-1 text-xs font-semibold text-red-500">
                Ada error di detail pembelian{detailFieldErrorCount > 0 ? ` (${detailFieldErrorCount} field)` : ""}. Buka modal untuk perbaiki.
              </p>
            )}
            {error.details && (
              <p className="mt-1 text-xs text-red-500">{error.details}</p>
            )}
            <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-3 text-sm text-gray-600">
              Edit detail barang lewat modal agar daftar item panjang tidak membuat halaman utama ikut memanjang.
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

      {showDetailsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDetailsModal(false);
          }}
        >
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-orange-100 bg-white px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Detail Barang</h3>
                <p className="mt-1 text-sm text-gray-600">Atur produk, qty, dan harga beli di sini.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-700 hover:bg-orange-100"
              >
                Selesai
              </button>
            </div>

            <div ref={detailsScrollRef} className="max-h-[62vh] overflow-y-auto px-6 py-4">
              <div className="space-y-3">
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
                    <ProductSearchSelect
                      value={d.productId}
                      valueName={d.productName}
                      onSearch={(q) => searchProductForPurchase({ q })}
                      onChange={(id, product) => updateDetail(idx, "productId", id, product)}
                      error={error[`details.${idx}.productId`]}
                    />
                    {error[`details.${idx}.productId`] && (
                      <p className="mt-1 text-xs text-red-500">
                        {error[`details.${idx}.productId`]}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Qty</span>
                      <input
                        type="text"
                        value={d.qty}
                        onFocus={(e) => {
                          const raw = parseNumberInput(e.target.value)
                          if (raw > 0) updateDetail(idx, "qty", String(raw))
                        }}
                        onChange={(e) =>
                          updateDetail(idx, "qty", e.target.value)
                        }
                        onBlur={(e) =>
                          updateDetail(idx, "qty", normalizeNumericText(e.target.value, 3) || "0")
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
                        type="text"
                        value={d.purchasePrice ?? ""}
                        onFocus={(e) => {
                          const raw = parseNumberInput(e.target.value)
                          if (raw >= 0) updateDetail(idx, "purchasePrice", String(raw))
                        }}
                        onChange={(e) =>
                          updateDetail(idx, "purchasePrice", e.target.value)
                        }
                        onBlur={(e) =>
                          updateDetail(idx, "purchasePrice", normalizeNumericText(e.target.value, 0, true))
                        }
                        className={`w-full rounded-xl border ${error[`details.${idx}.purchasePrice`] ? "border-red-500" : "border-orange-200"} bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300`}
                      />
                    </div>
                    {error[`details.${idx}.purchasePrice`] && (
                      <p className="mt-1 text-xs text-red-500">
                        {error[`details.${idx}.purchasePrice`]}
                      </p>
                    )}
                    {d.productId && d.productName && (
                      <p className="mt-2 text-xs text-gray-500">
                        Estimasi:{" "}
                        {formatRupiah(
                          (parseNumberInput(d.qty) || 0) * (parseNumberInput(d.purchasePrice) || 0),
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-orange-100 bg-white px-6 py-4">
              <p className="text-xs text-gray-500">{details.length} item dalam pembelian</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const hasInvalid = details.some(
                      (d) => !d.productId || parseNumberInput(d.qty) <= 0,
                    );
                    if (hasInvalid) {
                      toast.warning("Lengkapi semua produk sebelum menambah baris baru.");
                      return;
                    }
                    setDetails((prev) => [...prev, { productId: "", productName: "", qty: "1", purchasePrice: "0" }]);
                  }}
                  className="rounded-full border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
                >
                  + Tambah Produk
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
