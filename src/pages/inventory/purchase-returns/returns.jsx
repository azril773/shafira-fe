import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import AdminVerifyModal from "../../../components/globals/AdminVerifyModal";
import {
  getVendors,
  returnPurchaseItems,
  searchPurchase,
} from "../../../services/purchaseService";
import PaginationTableNoLink from "../../../components/globals/pagination";

const STATUS_OPTIONS = [
  { value: "", label: "Posted, Parsial, Returned" },
  { value: "POSTED", label: "Diterima" },
  { value: "PARTIAL_RETURNED", label: "Retur Parsial" },
  { value: "RETURNED", label: "Diretur" },
];

const STATUS_BADGE = {
  POSTED: "bg-green-100 text-green-700",
  PARTIAL_RETURNED: "bg-sky-100 text-sky-700",
  RETURNED: "bg-blue-100 text-blue-700",
};

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function purchaseTotalQty(purchase) {
  return (purchase.purchaseDetails || []).reduce(
    (acc, d) => acc + (d.qty || 0),
    0,
  );
}

function returnedPurchaseQty(purchase) {
  return (purchase.purchaseDetails || []).reduce(
    (sum, detail) => sum + (Number(detail.returnedQty) || 0),
    0,
  );
}

function purchaseProductSummary(purchase) {
  const details = purchase.purchaseDetails || [];
  if (details.length === 0) return "Belum ada produk";

  const preview = details
    .slice(0, 3)
    .map((detail) => `${detail.product?.name || "Produk"} (${detail.qty})`)
    .join(", ");

  if (details.length <= 3) return preview;
  return `${preview} +${details.length - 3} produk lain`;
}

export default function PurchaseReturnsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const statusParam = searchParams.get("status") || "";
  const vendorIdParam = searchParams.get("vendorId") || "";
  const purchaseDateParam = searchParams.get("purchaseDate") || "";
  const selectedPurchaseIdParam = searchParams.get("purchaseId") || "";

  const [vendors, setVendors] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [returnQtyByDetailId, setReturnQtyByDetailId] = useState({});
  const [returnReason, setReturnReason] = useState("");
  const [pendingReturn, setPendingReturn] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [totalPages, setTotalPages] = useState(1);
  const [refresh, setRefresh] = useState("");

  const [filterStatus, setFilterStatus] = useState(statusParam);
  const [filterVendor, setFilterVendor] = useState(vendorIdParam);
  const [filterDate, setFilterDate] = useState(purchaseDateParam);

  const loadMasterData = async () => {
    const { data, error } = await getVendors();
    if (error) toast.error(error);
    else setVendors(data || []);
  };

  const loadPurchases = async () => {
    const { data, totalPages, error } = await searchPurchase({
      page: pageParam,
      status: statusParam || undefined,
      vendorId: vendorIdParam || undefined,
      purchaseDate: purchaseDateParam || undefined,
    });
    if (error) {
      toast.error(error);
      return;
    }

    const filtered = (data || []).filter((p) =>
      ["POSTED", "PARTIAL_RETURNED", "RETURNED"].includes(p.status),
    );

    setPurchases(filtered);
    setTotalPages(totalPages || 1);

    const targetId = selectedPurchaseIdParam || selectedItem?.id;
    if (targetId) {
      const found = filtered.find((p) => p.id === targetId);
      if (found) {
        setSelectedItem(found);
        return;
      }
    }

    const firstReturable = filtered.find((p) =>
      ["POSTED", "PARTIAL_RETURNED"].includes(p.status),
    );
    setSelectedItem(firstReturable ?? filtered[0] ?? null);
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadPurchases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParam, statusParam, vendorIdParam, purchaseDateParam, refresh, selectedPurchaseIdParam]);

  useEffect(() => {
    if (!selectedItem) {
      setReturnQtyByDetailId({});
      return;
    }
    const next = {};
    (selectedItem.purchaseDetails || []).forEach((d) => {
      next[d.id] = 0;
    });
    setReturnQtyByDetailId(next);
    setReturnReason("");
  }, [selectedItem]);

  const applyFilter = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (filterStatus) params.set("status", filterStatus);
    if (filterVendor) params.set("vendorId", filterVendor);
    if (filterDate) params.set("purchaseDate", filterDate);
    setSearchParams(params);
    setCurrentPage(1);
  };

  const resetFilter = () => {
    setFilterStatus("");
    setFilterVendor("");
    setFilterDate("");
    setSearchParams(new URLSearchParams({ page: "1" }));
    setCurrentPage(1);
  };

  const goToPage = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    setSearchParams(params);
    setCurrentPage(newPage);
  };

  const handleReturn = async () => {
    if (!selectedItem) return;

    const items = (selectedItem.purchaseDetails || [])
      .map((d) => ({
        purchaseDetailId: d.id,
        qty: Number(returnQtyByDetailId[d.id] || 0),
      }))
      .filter((item) => item.qty > 0);

    if (!items.length) {
      toast.info("Isi qty retur minimal pada satu item.");
      return;
    }

    if (!returnReason.trim()) {
      toast.info("Alasan retur wajib diisi.");
      return;
    }

    setPendingReturn(true);
  };

  const handleVerifiedReturn = async (creds) => {
    if (!selectedItem) return;

    const items = (selectedItem.purchaseDetails || [])
      .map((d) => ({
        purchaseDetailId: d.id,
        qty: Number(returnQtyByDetailId[d.id] || 0),
      }))
      .filter((item) => item.qty > 0);

    setPendingReturn(false);
    setSubmittingReturn(true);
    const { error } = await returnPurchaseItems({
      id: selectedItem.id,
      items,
      reason: returnReason.trim(),
      verifierUsername: creds?.username,
      verifierPassword: creds?.password,
    });
    setSubmittingReturn(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Retur item pembelian berhasil diapprove. Stok sudah dikurangi.");
    setRefresh(new Date().toISOString());
  };

  const totalReturned = useMemo(
    () => purchases.filter((p) => ["PARTIAL_RETURNED", "RETURNED"].includes(p.status)).length,
    [purchases],
  );

  const returnedQty = useMemo(
    () => {
      return purchases.reduce(
        (acc, p) =>
          acc +
          (p.purchaseDetails || []).reduce(
            (sum, d) => sum + (Number(d.returnedQty) || 0),
            0,
          ),
        0,
      );
    },
    [purchases],
  );

  const groupedByVendor = useMemo(() => {
    const groups = new Map();

    for (const purchase of purchases) {
      const vendorId = purchase.vendor?.id || purchase.vendorId || "unknown-vendor";
      const vendorName = purchase.vendor?.name || "Vendor tidak diketahui";
      const current = groups.get(vendorId) || {
        vendorId,
        vendorName,
        purchases: [],
        totalQty: 0,
        returnedQty: 0,
      };

      current.purchases.push(purchase);
      current.totalQty += purchaseTotalQty(purchase);
      current.returnedQty += returnedPurchaseQty(purchase);
      groups.set(vendorId, current);
    }

    return Array.from(groups.values());
  }, [purchases]);

  return (
    <section className="rounded-4xl border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
            Retur Pembelian
          </p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">
            Retur Barang ke Vendor
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Tandai pembelian yang sudah diterima menjadi retur. Sistem akan memotong stok secara otomatis.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Pilih dokumen di tabel atau klik tombol Buat Retur untuk mulai proses retur.
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
            Data Halaman Ini
          </p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{purchases.length}</p>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-500">
            Total Dokumen Diretur
          </p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{totalReturned}</p>
        </div>
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-500">
            Total Qty Diretur
          </p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{returnedQty}</p>
        </div>
      </div>

      <div className="mt-6 rounded-4xl border border-orange-100 bg-orange-50 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Filter Retur</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm text-gray-600">
            Status
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-600">
            Vendor
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">Semua Vendor</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-gray-600">
            Tanggal
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={applyFilter}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Terapkan Filter
          </button>
          <button
            type="button"
            onClick={resetFilter}
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="space-y-4">
            {groupedByVendor.length === 0 && (
              <div className="rounded-4xl border border-orange-100 bg-white px-4 py-6 text-center text-sm text-gray-400">
                Tidak ada data pembelian yang bisa diretur di halaman ini.
              </div>
            )}

            {groupedByVendor.map((vendorGroup) => (
              <section
                key={vendorGroup.vendorId}
                className="overflow-hidden rounded-4xl border border-orange-100 bg-white"
              >
                <div className="flex flex-col gap-3 border-b border-orange-100 bg-orange-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                      Vendor
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-gray-900">
                      {vendorGroup.vendorName}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                      {vendorGroup.purchases.length} dokumen purchase dengan total {vendorGroup.totalQty} qty.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Qty Diretur
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {vendorGroup.returnedQty}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Siap Diretur
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {
                          vendorGroup.purchases.filter((purchase) =>
                            ["POSTED", "PARTIAL_RETURNED"].includes(purchase.status),
                          ).length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-orange-50">
                  {vendorGroup.purchases.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className={`flex w-full flex-col gap-4 px-5 py-4 text-left transition hover:bg-orange-50/60 lg:flex-row lg:items-center lg:justify-between ${
                        selectedItem?.id === item.id ? "bg-orange-50" : "bg-white"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDate(item.purchaseDate)}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              STATUS_BADGE[item.status] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {purchaseProductSummary(item)}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Qty diretur {returnedPurchaseQty(item)} dari {purchaseTotalQty(item)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 lg:min-w-[180px] lg:justify-end">
                        <div className="text-right text-sm text-gray-500">
                          <p>Produk: {(item.purchaseDetails || []).length}</p>
                          <p>Qty sisa: {Math.max(purchaseTotalQty(item) - returnedPurchaseQty(item), 0)}</p>
                        </div>
                        <span className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700">
                          {item.status === "RETURNED" ? "Lihat Detail" : "Buat Retur"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <PaginationTableNoLink
            currentPage={currentPage}
            setCurrentPage={goToPage}
            totalPages={totalPages}
          />
        </div>

        <div className="rounded-4xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Detail Retur</p>
          {selectedItem ? (
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">{selectedItem.vendor?.name || "Vendor"}</p>
                <p className="text-gray-500">Tanggal: {formatDate(selectedItem.purchaseDate)}</p>
              </div>
              <div className="rounded-3xl bg-orange-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-orange-500">Status</p>
                <p className="mt-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_BADGE[selectedItem.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {selectedItem.status}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-orange-500">Daftar Produk</p>
                <ul className="mt-2 space-y-3">
                  {(selectedItem.purchaseDetails || []).map((d) => (
                    <li
                      key={d.id}
                      className="rounded-2xl border border-orange-100 bg-orange-50/50 px-3 py-2"
                    >
                      <p className="font-semibold text-gray-900">{d.product?.name || "-"}</p>
                      <p className="text-xs text-gray-500">
                        Qty Beli: {d.qty} · Sudah Retur: {Number(d.returnedQty) || 0} · Sisa Retur: {Number(d.remainingReturnQty) || 0}
                      </p>
                      {(selectedItem.status === "POSTED" || selectedItem.status === "PARTIAL_RETURNED") && (
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-xs text-gray-600">Qty Retur</label>
                          <input
                            type="number"
                            min="0"
                            max={Number(d.remainingReturnQty) || 0}
                            value={returnQtyByDetailId[d.id] ?? 0}
                            onChange={(e) => {
                              const max = Number(d.remainingReturnQty) || 0;
                              const next = Math.max(
                                0,
                                Math.min(max, Number(e.target.value) || 0),
                              );
                              setReturnQtyByDetailId((prev) => ({
                                ...prev,
                                [d.id]: next,
                              }));
                            }}
                            className="w-24 rounded-xl border border-orange-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-3xl bg-orange-50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-500">Total Qty</p>
                  <p className="mt-2 font-semibold text-gray-900">{purchaseTotalQty(selectedItem)}</p>
                </div>
                <div className="rounded-3xl bg-orange-50 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-orange-500">Qty Diretur</p>
                  <p className="mt-2 font-semibold text-gray-900">
                    {(selectedItem.purchaseDetails || []).reduce(
                      (sum, d) => sum + (Number(d.returnedQty) || 0),
                      0,
                    )}
                  </p>
                </div>
              </div>
              {(selectedItem.status === "POSTED" || selectedItem.status === "PARTIAL_RETURNED") && (
                <>
                  <label className="block text-sm text-gray-600">
                    Catatan Retur
                    <textarea
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      rows={2}
                      placeholder="Contoh: kemasan rusak, kadaluarsa dekat"
                      className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleReturn}
                    disabled={submittingReturn}
                    className="w-full rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {submittingReturn ? "Memproses..." : "Approve Retur Item"}
                  </button>
                </>
              )}
              {selectedItem.status === "RETURNED" && (
                <p className="rounded-2xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                  Seluruh item purchase ini sudah diretur penuh.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-orange-200 bg-orange-50 px-4 py-6 text-sm text-gray-500">
              Belum ada dokumen yang dipilih. Gunakan tombol Buat Retur pada salah satu baris purchase.
            </div>
          )}
        </div>
      </div>

      {pendingReturn && (
        <AdminVerifyModal
          title="Approve Retur Pembelian"
          description="Retur ke vendor dan pengurangan stok memerlukan persetujuan admin."
          confirmLabel="Approve Retur"
          tone="red"
          onCancel={() => setPendingReturn(false)}
          onVerified={handleVerifiedReturn}
        />
      )}
    </section>
  );
}
