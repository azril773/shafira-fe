import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  createPurchase,
  getVendors,
  searchPurchase,
  updatePurchaseStatus,
} from "../../../services/purchaseService";
import { getProducts } from "../../../services/productService";
import { formatRupiah } from "../../../utils/format";
import PaginationTableNoLink from "../../../components/globals/pagination";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "PENDING", label: "Pending" },
  { value: "POSTED", label: "Diterima" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

const STATUS_BADGE = {
  PENDING: "bg-yellow-100 text-yellow-700",
  POSTED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
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

function purchaseTotalValue(purchase) {
  return (purchase.purchaseDetails || []).reduce(
    (acc, d) => acc + (d.qty || 0) * (d.product?.prices?.[0]?.price || 0),
    0,
  );
}

export default function PurchasePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const statusParam = searchParams.get("status") || "";
  const vendorIdParam = searchParams.get("vendorId") || "";
  const productIdParam = searchParams.get("productId") || "";
  const purchaseDateParam = searchParams.get("purchaseDate") || "";

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [totalPages, setTotalPages] = useState(1);
  const [refresh, setRefresh] = useState("");

  // Filter state
  const [filterStatus, setFilterStatus] = useState(statusParam);
  const [filterVendor, setFilterVendor] = useState(vendorIdParam);
  const [filterProduct, setFilterProduct] = useState(productIdParam);
  const [filterDate, setFilterDate] = useState(purchaseDateParam);

  // Create form state
  const [vendorId, setVendorId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [details, setDetails] = useState([{ productId: "", qty: 1 }]);
  const [error, setError] = useState({});

  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const loadMasterData = async () => {
    const [{ data: vendorData, error: vendorError }, { data: productData, error: productError }] =
      await Promise.all([getVendors(), getProducts()]);
    if (vendorError) toast.error(vendorError);
    else setVendors(vendorData || []);
    if (productError) toast.error(productError);
    else setProducts(productData || []);
  };

  const loadPurchases = async () => {
    const { data, totalPages, error } = await searchPurchase({
      page: pageParam,
      status: statusParam || undefined,
      vendorId: vendorIdParam || undefined,
      productId: productIdParam || undefined,
      purchaseDate: purchaseDateParam || undefined,
    });
    if (error) {
      toast.error(error);
      return;
    }
    setPurchases(data || []);
    setTotalPages(totalPages || 1);
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    loadPurchases();
    setSelectedItem(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParam, statusParam, vendorIdParam, productIdParam, purchaseDateParam, refresh]);

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
    });
    setError(tempError);
    return Object.keys(tempError).length === 0;
  };

  const handleCreatePurchase = async () => {
    const { error } = await createPurchase({
      vendorId,
      purchaseDate,
      details: details.map((d) => ({
        productId: d.productId,
        qty: Number(d.qty),
      })),
    });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Pembelian berhasil dibuat!");
    setVendorId("");
    setPurchaseDate("");
    setDetails([{ productId: "", qty: 1 }]);
    setRefresh(new Date().toISOString());
  };

  const applyFilter = () => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (filterStatus) params.set("status", filterStatus);
    if (filterVendor) params.set("vendorId", filterVendor);
    if (filterProduct) params.set("productId", filterProduct);
    if (filterDate) params.set("purchaseDate", filterDate);
    setSearchParams(params);
    setCurrentPage(1);
  };

  const resetFilter = () => {
    setFilterStatus("");
    setFilterVendor("");
    setFilterProduct("");
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

  const handleChangeStatus = async (id, status) => {
    const { error } = await updatePurchaseStatus({ id, status });
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Status pembelian diperbarui.");
    setRefresh(new Date().toISOString());
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

  const totalQty = useMemo(
    () =>
      purchases
        .filter((p) => p.status === "POSTED")
        .reduce((acc, p) => acc + purchaseTotalQty(p), 0),
    [purchases],
  );
  const totalValue = useMemo(
    () =>
      purchases
        .filter((p) => p.status === "POSTED")
        .reduce((acc, p) => acc + purchaseTotalValue(p), 0),
    [purchases],
  );

  return (
    <div key={refresh}>
      <section className="rounded-4xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
              Pembelian
            </p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">
              Daftar Pembelian Vendor
            </h3>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
              Total Pembelian (Halaman)
            </p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">
              {purchases.length}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Daftar order pembelian sesuai filter saat ini.
            </p>
          </div>
          <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
              Total Qty (Diterima)
            </p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">{totalQty}</p>
            <p className="mt-2 text-sm text-gray-600">
              Akumulasi kuantitas dari pembelian berstatus POSTED.
            </p>
          </div>
          <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
              Estimasi Nilai (Diterima)
            </p>
            <p className="mt-3 text-3xl font-semibold text-gray-900">
              {formatRupiah(totalValue)}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Hanya pembelian berstatus POSTED, harga utama produk.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-4xl border border-orange-100 bg-orange-50 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
            Cari Pembelian
          </p>
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
              Produk
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">Semua Produk</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
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
              Cari
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
            <div className="overflow-x-auto rounded-4xl border border-orange-100 bg-white">
              <table className="w-full min-w-160 text-left text-sm text-gray-600">
                <thead>
                  <tr className="border-b border-orange-100 text-gray-500">
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3"># Produk</th>
                    <th className="px-4 py-3">Total Qty</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                        Belum ada pembelian.
                      </td>
                    </tr>
                  )}
                  {purchases.map((item) => (
                    <tr
                      key={item.id}
                      role="button"
                      onClick={() => setSelectedItem(item)}
                      className={`border-b border-orange-50 hover:bg-orange-50/50 transition duration-150 ${
                        selectedItem?.id === item.id ? "bg-orange-50" : ""
                      } cursor-pointer`}
                    >
                      <td className="px-4 py-3">{formatDate(item.purchaseDate)}</td>
                      <td className="px-4 py-3">{item.vendor?.name || "-"}</td>
                      <td className="px-4 py-3">
                        {item.purchaseDetails?.length || 0}
                      </td>
                      <td className="px-4 py-3">{purchaseTotalQty(item)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[item.status] || "bg-gray-100 text-gray-700"}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationTableNoLink
              currentPage={currentPage}
              setCurrentPage={goToPage}
              totalPages={totalPages}
            />
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <div className="rounded-4xl border border-orange-100 bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                Detail Pembelian
              </p>
              {selectedItem ? (
                <div className="mt-4 space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedItem.vendor?.name || "Vendor"}
                    </p>
                    <p className="text-gray-500">
                      Tanggal: {formatDate(selectedItem.purchaseDate)}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-orange-50 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                      Status
                    </p>
                    <p className="mt-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[selectedItem.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {selectedItem.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                      Daftar Produk
                    </p>
                    <ul className="mt-2 space-y-2">
                      {(selectedItem.purchaseDetails || []).map((d) => (
                        <li
                          key={d.id}
                          className="rounded-2xl border border-orange-100 bg-orange-50/50 px-3 py-2"
                        >
                          <p className="font-semibold text-gray-900">
                            {d.product?.name || "-"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {d.qty} ·{" "}
                            {formatRupiah(
                              (d.qty || 0) * (d.product?.prices?.[0]?.price || 0),
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-3xl bg-orange-50 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                        Total Qty
                      </p>
                      <p className="mt-2 font-semibold text-gray-900">
                        {purchaseTotalQty(selectedItem)}
                      </p>
                    </div>
                    <div className="rounded-3xl bg-orange-50 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                        Estimasi Nilai
                      </p>
                      <p className="mt-2 font-semibold text-gray-900">
                        {formatRupiah(purchaseTotalValue(selectedItem))}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedItem.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/inventory/purchases/edit/${selectedItem.id}`,
                              { state: { purchase: selectedItem } },
                            )
                          }
                          className="rounded-full cursor-pointer border border-orange-200 bg-white px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleChangeStatus(selectedItem.id, "POSTED")
                          }
                          className="rounded-full bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600"
                        >
                          Diterima
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleChangeStatus(selectedItem.id, "CANCELLED")
                          }
                          className="rounded-full border border-red-500 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 sm:col-span-2"
                        >
                          Batalkan
                        </button>
                      </>
                    )}
                    {selectedItem.status === "POSTED" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleChangeStatus(selectedItem.id, "CANCELLED")
                        }
                        className="rounded-full border border-red-500 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 sm:col-span-2"
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  Pilih pembelian untuk melihat detail dan aksi.
                </p>
              )}
            </div>

            {/* Create form */}
            <div className="rounded-4xl border border-orange-100 bg-white p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
                Tambah Pembelian
              </p>
              <div className="mt-4 space-y-4 text-sm text-gray-700">
                <label className="block">
                  <span className="text-gray-600">Vendor</span>
                  <select
                    value={vendorId}
                    onChange={(e) => {
                      setError((prev) => {
                        const next = { ...prev };
                        delete next.vendorId;
                        return next;
                      });
                      setVendorId(e.target.value);
                    }}
                    className={`mt-2 w-full rounded-xl border ${error.vendorId ? "border-red-500 focus:ring-red-300" : "border-orange-200 focus:ring-orange-300"} bg-orange-50 px-3 py-2 focus:outline-none focus:ring-2`}
                  >
                    <option value="">Pilih Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  {error.vendorId && (
                    <p className="mt-1 text-xs text-red-500">{error.vendorId}</p>
                  )}
                </label>
                <label className="block">
                  <span className="text-gray-600">Tanggal</span>
                  <input
                    type="datetime-local"
                    value={purchaseDate}
                    onChange={(e) => {
                      setError((prev) => {
                        const next = { ...prev };
                        delete next.purchaseDate;
                        return next;
                      });
                      setPurchaseDate(e.target.value);
                    }}
                    className={`mt-2 w-full rounded-xl border ${error.purchaseDate ? "border-red-500 focus:ring-red-300" : "border-orange-200 focus:ring-orange-300"} bg-orange-50 px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                  />
                  {error.purchaseDate && (
                    <p className="mt-1 text-xs text-red-500">{error.purchaseDate}</p>
                  )}
                </label>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Daftar Produk</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDetails((prev) => [...prev, { productId: "", qty: 1 }])
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
                                setDetails((prev) =>
                                  prev.filter((_, i) => i !== idx),
                                )
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
                        {d.productId && productMap.get(d.productId) && (
                          <p className="mt-2 text-xs text-gray-500">
                            Estimasi:{" "}
                            {formatRupiah(
                              (Number(d.qty) || 0) *
                                (productMap.get(d.productId)?.prices?.[0]
                                  ?.price || 0),
                            )}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (checkError()) handleCreatePurchase();
                  }}
                  className="w-full rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Buat Pembelian
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
