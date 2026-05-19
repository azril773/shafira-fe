import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Box,
  Truck,
  FileChartPie,
  RotateCcw,
  Users as UsersIcon,
  ShieldAlert,
  Ruler,
  Receipt,
  Download,
  FileText,
} from "lucide-react";
import { exportToExcel, exportToPdf } from "../../../utils/export";
import { formatRupiah, formatNumberId } from "../../../utils/format";
import { getProducts } from "../../../services/productService";
import { searchPurchase, getVendors } from "../../../services/purchaseService";
import { searchTransactions } from "../../../services/transactionService";
import { getUoms } from "../../../services/uomService";
import { listUsers } from "../../../services/userService";
import { listAuditLogs } from "../../../services/auditLogService";
import PaginationTableNoLink from "../../../components/globals/pagination";

const PAGE_SIZE = 25;

const REPORTS = [
  { id: "sales", label: "Penjualan", icon: Receipt, description: "Daftar transaksi penjualan dengan total dan metode bayar." },
  { id: "purchase", label: "Pembelian", icon: Truck, description: "Order pembelian beserta vendor, qty, dan harga beli." },
  { id: "stock", label: "Stok Produk", icon: FileChartPie, description: "Stok terkini, kategori, dan harga jual." },
  { id: "return", label: "Retur / Void", icon: RotateCcw, description: "Item yang di-refund atau transaksi yang dibatalkan." },
  { id: "purchase-return", label: "Retur Pembelian", icon: RotateCcw, description: "Retur barang ke vendor berdasarkan dokumen purchase yang sudah diapprove." },
  { id: "vendors", label: "Vendor", icon: Box, description: "Daftar vendor dan kontak." },
  { id: "uoms", label: "Satuan (UoM)", icon: Ruler, description: "Master satuan unit produk." },
  { id: "users", label: "User", icon: UsersIcon, description: "Daftar pengguna sistem dan rolenya." },
  { id: "audit", label: "Audit Log", icon: ShieldAlert, description: "Riwayat void, abort, refund, dan persetujuan user." },
];

const TRANSACTION_STATUSES = ["POSTED", "VOIDED", "REFUNDED"];
const PURCHASE_STATUSES = ["PENDING", "POSTED", "CANCELLED", "PARTIAL_RETURNED", "RETURNED"];
const USER_ROLES = ["admin", "cashier", "inventory_manager", "verif_admin"];
const USER_STATUSES = ["PENDING", "APPROVED", "REJECTED"];
const AUDIT_ACTIONS_LIST = ["VOID_ITEM", "ABORT_SALE", "VOID_TRX", "REFUND_TRX", "EDIT_STOCK"];

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return value;
  }
}

function isWithin(date, from, to) {
  if (!date) return true;
  const d = new Date(date).getTime();
  if (from && d < new Date(from).getTime()) return false;
  if (to) {
    const end = new Date(to);
    end.setDate(end.getDate() + 1);
    if (d >= end.getTime()) return false;
  }
  return true;
}

async function fetchAllPages(loader, key, max = 50) {
  const collected = [];
  let page = 1;
  while (page <= max) {
    const { data, totalPages, error } = await loader(page);
    if (error) throw new Error(error);
    const list = Array.isArray(data) ? data : data?.[key] || [];
    collected.push(...list);
    if (!totalPages || page >= totalPages) break;
    page += 1;
  }
  return collected;
}

function FilterBar({ activeId, filters, setFilter, products }) {
  const f = filters;
  const inputCls = "rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300";
  const labelCls = "flex flex-col gap-1 text-xs text-gray-500";

  const dateRange = (
    <>
      <label className={labelCls}>
        Dari
        <input type="date" value={f.from || ""} onChange={(e) => setFilter("from", e.target.value)} className={inputCls} />
      </label>
      <label className={labelCls}>
        Sampai
        <input type="date" value={f.to || ""} onChange={(e) => setFilter("to", e.target.value)} className={inputCls} />
      </label>
    </>
  );

  const nameInput = (placeholder = "Cari nama...") => (
    <label className={labelCls}>
      Cari
      <input type="text" placeholder={placeholder} value={f.name || ""} onChange={(e) => setFilter("name", e.target.value)} className={inputCls} />
    </label>
  );

  switch (activeId) {
    case "sales":
      return (
        <>
          {dateRange}
          <label className={labelCls}>
            Status
            <select value={f.status || ""} onChange={(e) => setFilter("status", e.target.value)} className={inputCls}>
              <option value="">Semua</option>
              {TRANSACTION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className={labelCls}>
            Kasir
            <input type="text" placeholder="Username kasir..." value={f.cashier || ""} onChange={(e) => setFilter("cashier", e.target.value)} className={inputCls} />
          </label>
        </>
      );

    case "purchase":
      return (
        <>
          {dateRange}
          <label className={labelCls}>
            Status
            <select value={f.status || ""} onChange={(e) => setFilter("status", e.target.value)} className={inputCls}>
              <option value="">Semua</option>
              {PURCHASE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className={labelCls}>
            Vendor
            <input type="text" placeholder="Nama vendor..." value={f.vendor || ""} onChange={(e) => setFilter("vendor", e.target.value)} className={inputCls} />
          </label>
        </>
      );

    case "stock": {
      const categories = [...new Set((products || []).map((p) => p.category).filter(Boolean))].sort();
      return (
        <>
          {nameInput("Nama produk...")}
          <label className={labelCls}>
            Kategori
            <select value={f.category || ""} onChange={(e) => setFilter("category", e.target.value)} className={inputCls}>
              <option value="">Semua Kategori</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </>
      );
    }

    case "return":
      return <>{dateRange}</>;

    case "purchase-return":
      return (
        <>
          {dateRange}
          <label className={labelCls}>
            Vendor
            <input type="text" placeholder="Nama vendor..." value={f.vendor || ""} onChange={(e) => setFilter("vendor", e.target.value)} className={inputCls} />
          </label>
        </>
      );

    case "vendors":
      return <>{nameInput("Nama vendor...")}</>;

    case "uoms":
      return (
        <label className={labelCls}>
          Cari
          <input type="text" placeholder="Kode / nama satuan..." value={f.name || ""} onChange={(e) => setFilter("name", e.target.value)} className={inputCls} />
        </label>
      );

    case "users":
      return (
        <>
          {nameInput("Username / nama...")}
          <label className={labelCls}>
            Role
            <select value={f.role || ""} onChange={(e) => setFilter("role", e.target.value)} className={inputCls}>
              <option value="">Semua Role</option>
              {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className={labelCls}>
            Status
            <select value={f.status || ""} onChange={(e) => setFilter("status", e.target.value)} className={inputCls}>
              <option value="">Semua Status</option>
              {USER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </>
      );

    case "audit":
      return (
        <>
          {dateRange}
          <label className={labelCls}>
            Aksi
            <select value={f.action || ""} onChange={(e) => setFilter("action", e.target.value)} className={inputCls}>
              <option value="">Semua Aksi</option>
              {AUDIT_ACTIONS_LIST.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
        </>
      );

    default:
      return null;
  }
}

export default function ReportsPage() {
  const [activeId, setActiveId] = useState("sales");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  const active = REPORTS.find((r) => r.id === activeId) || REPORTS[0];

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const reload = async () => {
    setLoading(true);
    try {
      if (activeId === "sales" || activeId === "return") {
        const list = await fetchAllPages((p) => searchTransactions({ page: p }), "data");
        setTransactions(list);
      } else if (activeId === "purchase" || activeId === "purchase-return") {
        const list = await fetchAllPages((p) => searchPurchase({ page: p }), "data");
        setPurchases(list);
      } else if (activeId === "stock") {
        const { data, error } = await getProducts();
        if (error) throw new Error(error);
        setProducts(data || []);
      } else if (activeId === "vendors") {
        const { data, error } = await getVendors();
        if (error) throw new Error(error);
        setVendors(data || []);
      } else if (activeId === "uoms") {
        const { data, error } = await getUoms();
        if (error) throw new Error(error);
        setUoms(data || []);
      } else if (activeId === "users") {
        const list = await fetchAllPages((p) => listUsers({ page: p }), "data");
        setUsers(list);
      } else if (activeId === "audit") {
        const list = await fetchAllPages((p) => listAuditLogs({ page: p }), "data");
        setLogs(list);
      }
    } catch (e) {
      toast.error(e.message || "Gagal memuat data laporan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilters({});
    setPage(1);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const report = useMemo(() => {
    const { from, to, status, vendor, name, category, cashier, role, action } = filters;

    switch (activeId) {
      case "sales": {
        const filtered = transactions.filter((t) => {
          if (!isWithin(t.createdAt || t.transactionDate, from, to)) return false;
          if (status && t.status !== status) return false;
          if (cashier && !t.cashier?.username?.toLowerCase().includes(cashier.toLowerCase())) return false;
          return true;
        });
        const headers = ["No Transaksi", "Tanggal", "Kasir", "Metode", "Total Qty", "Total", "Status"];
        const rows = filtered.map((t) => ({
          "No Transaksi": t.transactionNo,
          Tanggal: formatDate(t.createdAt),
          Kasir: t.cashier?.username || "-",
          Metode: t.paymentMethod,
          "Total Qty": t.totalQty,
          Total: Number(t.totalPrice) || 0,
          Status: t.status,
        }));
        const totalSales = filtered.reduce((a, t) => a + (Number(t.totalPrice) || 0), 0);
        return {
          headers, rows,
          summary: [
            { label: "Total Transaksi", value: filtered.length },
            { label: "Total Nilai", value: formatRupiah(totalSales) },
          ],
        };
      }

      case "return": {
        const filtered = transactions.filter((t) => isWithin(t.createdAt, from, to));
        const refundDetails = [];
        let voided = 0;
        filtered.forEach((t) => {
          if (t.status === "VOIDED") voided += 1;
          (t.transactionDetails || []).forEach((d) => {
            if (d.isRefund) {
              refundDetails.push({
                "No Transaksi": t.transactionNo,
                Tanggal: formatDate(t.createdAt),
                Barcode: d.historicalBarcode || "-",
                Produk: d.historicalName,
                Qty: d.qty,
                Harga: Number(d.historicalPrice) || 0,
                Subtotal: (Number(d.historicalPrice) || 0) * (d.qty || 0),
                Alasan: d.refundReason || "-",
              });
            }
          });
        });
        const totalRefund = refundDetails.reduce((a, r) => a + r.Subtotal, 0);
        return {
          headers: ["No Transaksi", "Tanggal", "Barcode", "Produk", "Qty", "Harga", "Subtotal", "Alasan"],
          rows: refundDetails,
          summary: [
            { label: "Item Diretur", value: refundDetails.length },
            { label: "Transaksi Void", value: voided },
            { label: "Nilai Retur", value: formatRupiah(totalRefund) },
          ],
        };
      }

      case "purchase": {
        const filtered = purchases.filter((p) => {
          if (!isWithin(p.purchaseDate, from, to)) return false;
          if (status && p.status !== status) return false;
          if (vendor && !p.vendor?.name?.toLowerCase().includes(vendor.toLowerCase())) return false;
          return true;
        });
        const rows = [];
        let totalQty = 0;
        let totalValue = 0;
        filtered.forEach((p) => {
          (p.purchaseDetails || []).forEach((d) => {
            const sub = (Number(d.purchasePrice) || 0) * (Number(d.qty) || 0);
            totalQty += d.qty || 0;
            totalValue += sub;
            rows.push({
              Tanggal: formatDate(p.purchaseDate),
              Vendor: p.vendor?.name || "-",
              Status: p.status,
              Barcode: d.product?.barcode || "-",
              Produk: d.product?.name || "-",
              Qty: d.qty,
              "Harga Beli": Number(d.purchasePrice) || 0,
              Subtotal: sub,
            });
          });
        });
        return {
          headers: ["Tanggal", "Vendor", "Status", "Barcode", "Produk", "Qty", "Harga Beli", "Subtotal"],
          rows,
          summary: [
            { label: "Order Pembelian", value: filtered.length },
            { label: "Total Qty", value: totalQty },
            { label: "Total Nilai", value: formatRupiah(totalValue) },
          ],
        };
      }

      case "purchase-return": {
        const filtered = purchases.filter((p) => {
          if (!["PARTIAL_RETURNED", "RETURNED"].includes(p.status)) return false;
          if (!isWithin(p.purchaseDate, from, to)) return false;
          if (vendor && !p.vendor?.name?.toLowerCase().includes(vendor.toLowerCase())) return false;
          return true;
        });
        const rows = [];
        let totalReturnedQty = 0;
        let totalReturnedValue = 0;
        const vendorSet = new Set();
        filtered.forEach((p) => {
          if (p.vendor?.name) vendorSet.add(p.vendor.name);
          (p.purchaseDetails || []).forEach((d) => {
            const returnedQty = Number(d.returnedQty) || 0;
            if (returnedQty <= 0) return;
            const purchasePrice = Number(d.purchasePrice) || 0;
            const subtotal = purchasePrice * returnedQty;
            totalReturnedQty += returnedQty;
            totalReturnedValue += subtotal;
            rows.push({
              Tanggal: formatDate(p.purchaseDate),
              Vendor: p.vendor?.name || "-",
              Status: p.status,
              Barcode: d.product?.barcode || "-",
              Produk: d.product?.name || "-",
              "Qty Beli": Number(d.qty) || 0,
              "Qty Retur": returnedQty,
              "Qty Sisa": Number(d.remainingReturnQty) || 0,
              "Harga Beli": purchasePrice,
              "Nilai Retur": subtotal,
            });
          });
        });
        return {
          headers: ["Tanggal", "Vendor", "Status", "Barcode", "Produk", "Qty Beli", "Qty Retur", "Qty Sisa", "Harga Beli", "Nilai Retur"],
          rows,
          summary: [
            { label: "Dokumen Diretur", value: filtered.length },
            { label: "Vendor Terkait", value: vendorSet.size },
            { label: "Total Qty Retur", value: totalReturnedQty },
            { label: "Total Nilai Retur", value: formatRupiah(totalReturnedValue) },
          ],
        };
      }

      case "stock": {
        const filtered = products.filter((p) => {
          if (name && !p.name?.toLowerCase().includes(name.toLowerCase())) return false;
          if (category && p.category !== category) return false;
          return true;
        });
        const rows = filtered.map((p) => ({
          Kode: p.code || "-",
          Barcode: p.barcode || "-",
          Nama: p.name,
          Kategori: p.category || "-",
          Satuan: p.uom?.code || "-",
          Stok: p.stock,
          "Harga Utama": Number(p.prices?.[0]?.price) || 0,
        }));
        const totalStock = rows.reduce((a, r) => a + (r.Stok || 0), 0);
        const stockValue = rows.reduce((a, r) => a + (r.Stok || 0) * (r["Harga Utama"] || 0), 0);
        return {
          headers: ["Kode", "Barcode", "Nama", "Kategori", "Satuan", "Stok", "Harga Utama"],
          rows,
          summary: [
            { label: "Jumlah Produk", value: rows.length },
            { label: "Total Stok", value: totalStock },
            { label: "Estimasi Nilai Stok", value: formatRupiah(stockValue) },
          ],
        };
      }

      case "vendors": {
        const filtered = vendors.filter((v) =>
          !name || v.name?.toLowerCase().includes(name.toLowerCase())
        );
        return {
          headers: ["Nama", "Telepon"],
          rows: filtered.map((v) => ({ Nama: v.name, Telepon: v.phone || "-" })),
          summary: [{ label: "Jumlah Vendor", value: filtered.length }],
        };
      }

      case "uoms": {
        const filtered = uoms.filter((u) =>
          !name ||
          u.code?.toLowerCase().includes(name.toLowerCase()) ||
          u.name?.toLowerCase().includes(name.toLowerCase())
        );
        return {
          headers: ["Kode", "Nama", "Deskripsi"],
          rows: filtered.map((u) => ({ Kode: u.code, Nama: u.name, Deskripsi: u.description || "-" })),
          summary: [{ label: "Jumlah Satuan", value: filtered.length }],
        };
      }

      case "users": {
        const filtered = users.filter((u) => {
          if (name && !u.username?.toLowerCase().includes(name.toLowerCase()) && !u.name?.toLowerCase().includes(name.toLowerCase())) return false;
          if (role && u.role !== role) return false;
          if (status && u.status !== status) return false;
          return true;
        });
        return {
          headers: ["Username", "Nama", "Role", "Status"],
          rows: filtered.map((u) => ({ Username: u.username, Nama: u.name || "-", Role: u.role, Status: u.status })),
          summary: [{ label: "Jumlah User", value: filtered.length }],
        };
      }

      case "audit": {
        const filtered = logs.filter((l) => {
          if (!isWithin(l.createdAt, from, to)) return false;
          if (action && l.action !== action) return false;
          return true;
        });
        return {
          headers: ["Waktu", "Aksi", "Aktor", "Diverifikasi", "Entitas", "Alasan"],
          rows: filtered.map((l) => ({
            Waktu: formatDate(l.createdAt),
            Aksi: l.action,
            Aktor: l.actor?.username || "-",
            Diverifikasi: l.verifiedBy?.username || "-",
            Entitas: l.entityType ? `${l.entityType}${l.entityId ? `:${l.entityId.slice(0, 8)}` : ""}` : "-",
            Alasan: l.reason || "-",
          })),
          summary: [{ label: "Jumlah Catatan", value: filtered.length }],
        };
      }

      default:
        return { headers: [], rows: [], summary: [] };
    }
  }, [activeId, transactions, purchases, products, vendors, uoms, users, logs, filters]);

  const totalPages = Math.max(1, Math.ceil(report.rows.length / PAGE_SIZE));
  const pagedRows = report.rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = (kind) => {
    if (!report.rows.length) {
      toast.info("Tidak ada data untuk diexport.");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `report-${active.id}-${stamp}`;
    const title = `Laporan ${active.label}`;
    if (kind === "excel") {
      exportToExcel(filename, report.headers, report.rows);
    } else {
      exportToPdf(title, report.headers, report.rows);
    }
  };

  return (
    <section className="rounded-[40px] border border-orange-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Report</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Laporan Modul</h3>
          <p className="mt-1 text-sm text-gray-500">
            Pilih modul, gunakan filter, lalu export ke Excel atau PDF.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleExport("excel")}
            className="inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
          >
            <Download size={14} /> Excel
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          const isActive = r.id === activeId;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveId(r.id)}
              className={`rounded-3xl border p-4 text-left transition min-h-[120px] ${
                isActive
                  ? "border-orange-300 bg-orange-100 shadow-sm"
                  : "border-orange-100 bg-orange-50 hover:border-orange-200"
              }`}
            >
              <div className="flex items-center gap-3 text-orange-600">
                <Icon size={18} />
                <p className="font-semibold text-gray-900">{r.label}</p>
              </div>
              <p className="mt-2 text-xs text-gray-600">{r.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <FilterBar activeId={activeId} filters={filters} setFilter={setFilter} products={products} />
      </div>

      {report.summary.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {report.summary.map((s) => (
            <div key={s.label} className="rounded-3xl border border-orange-100 bg-orange-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-500">{s.label}</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-3xl border border-orange-100">
        <table className="w-full min-w-[720px] text-left text-sm text-gray-600">
          <thead>
            <tr className="border-b border-orange-100 text-gray-500">
              {report.headers.map((h) => (
                <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={report.headers.length || 1} className="px-4 py-6 text-center text-gray-400">
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && pagedRows.length === 0 && (
              <tr>
                <td colSpan={report.headers.length || 1} className="px-4 py-6 text-center text-gray-400">
                  Tidak ada data.
                </td>
              </tr>
            )}
            {!loading &&
              pagedRows.map((row, idx) => (
                <tr key={idx} className="border-b border-orange-50">
                  {report.headers.map((h) => (
                    <td key={h} className="px-4 py-3 whitespace-nowrap">
                      {typeof row[h] === "number" &&
                      /Total|Harga|Subtotal|Nilai/i.test(h) &&
                      !/qty/i.test(h)
                        ? formatRupiah(row[h])
                        : typeof row[h] === "number" && /qty|stok/i.test(h)
                        ? formatNumberId(row[h])
                        : String(row[h] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!loading && report.rows.length > 0 && (
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-500">
            Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, report.rows.length)}–
            {Math.min(page * PAGE_SIZE, report.rows.length)} dari {report.rows.length} baris
          </p>
          <PaginationTableNoLink
            currentPage={page}
            setCurrentPage={setPage}
            totalPages={totalPages}
          />
        </div>
      )}
    </section>
  );
}
