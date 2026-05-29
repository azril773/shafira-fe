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
  Printer,
} from "lucide-react";
import { exportToExcel, exportToPdf } from "../../../utils/export";
import { formatRupiah, formatNumberId } from "../../../utils/format";
import { getProducts } from "../../../services/productService";
import { searchPurchase, getVendors } from "../../../services/purchaseService";
import {
  searchTransactions,
  getXReport,
  getMarginReport,
  PAYMENT_METHODS,
} from "../../../services/transactionService";
import { getUoms } from "../../../services/uomService";
import { listUsers } from "../../../services/userService";
import { listAuditLogs } from "../../../services/auditLogService";
import PaginationTableNoLink from "../../../components/globals/pagination";
import {
  printXReport,
  printXReportQZ,
  isQzLoaded,
  getDefaultQzPrinter,
} from "../../../utils/receipt";
import { useAuthStore } from "../../../store/authStore";

const PAGE_SIZE = 25;

const REPORTS = [
  { id: "x-report", label: "X Report", icon: Receipt, description: "Ringkasan operasional kasir: total transaksi, qty, nilai penjualan & uang diterima." },
  { id: "payment-method", label: "Per Metode Bayar", icon: Receipt, description: "Rekap penjualan dipisah per metode pembayaran (Cash, QRIS, Debit, Transfer, E-Wallet)." },
  { id: "margin", label: "Margin", icon: FileChartPie, description: "Margin penjualan, margin pembelian, per item, per kategori, dan persentase margin." },
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

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[m]));
}

function formatRupiahRaw(n) {
  return "Rp " + (Number(n) || 0).toLocaleString("id-ID");
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
    case "x-report":
      return (
        <>
          {dateRange}
          <label className={labelCls}>
            Metode Bayar
            <select value={f.paymentMethod || ""} onChange={(e) => setFilter("paymentMethod", e.target.value)} className={inputCls}>
              <option value="">Semua Metode</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </>
      );

    case "payment-method":
      return (
        <>
          {dateRange}
          <label className={labelCls}>
            Metode Bayar (Filter)
            <select value={f.paymentMethod || ""} onChange={(e) => setFilter("paymentMethod", e.target.value)} className={inputCls}>
              <option value="">Semua Metode</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </>
      );

    case "margin": {
      const categories = [...new Set((products || []).map((p) => p.category).filter(Boolean))].sort();
      return (
        <>
          {dateRange}
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
  const [xReportData, setXReportData] = useState(null);
  const [marginData, setMarginData] = useState(null);

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
      } else if (activeId === "stock" || activeId === "margin") {
        const { data, error } = await getProducts();
        if (error) throw new Error(error);
        setProducts(data || []);
        if (activeId === "margin") {
          const { data: m, error: me } = await getMarginReport({
            from: filters.from,
            to: filters.to,
            category: filters.category,
          });
          if (me) throw new Error(me);
          setMarginData(m);
        }
      } else if (activeId === "x-report" || activeId === "payment-method") {
        const { data, error } = await getXReport({
          from: filters.from,
          to: filters.to,
          paymentMethod: filters.paymentMethod,
        });
        if (error) throw new Error(error);
        setXReportData(data);
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

  // Re-fetch X / Margin reports when their filters change (these are backend-filtered)
  useEffect(() => {
    if (activeId === "x-report" || activeId === "payment-method" || activeId === "margin") {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.paymentMethod, filters.category]);

  const report = useMemo(() => {
    const { from, to, status, vendor, name, category, cashier, role, action, paymentMethod } = filters;

    switch (activeId) {
      case "x-report": {
        const r = xReportData;
        if (!r) {
          return { headers: [], rows: [], summary: [], grandTotal: null };
        }
        const headers = ["No Transaksi", "Tanggal", "Kasir", "Metode", "Qty", "Total", "Diterima"];
        const rows = (r.transactions || []).map((t) => ({
          "No Transaksi": t.transactionNo,
          Tanggal: formatDate(t.date),
          Kasir: t.cashier || "-",
          Metode: (t.methods || []).join(", ") || "-",
          Qty: t.totalQty,
          Total: Number(t.totalPrice) || 0,
          Diterima: (t.payments || []).reduce((s, p) => s + Number(p.tendered || 0), 0),
        }));
        const summary = [
          { label: "Total Transaksi", value: r.totalTransactions },
          { label: "Total Qty", value: formatNumberId(r.totalQty || 0) },
          { label: "Total Penjualan", value: formatRupiah(r.totalSales || 0) },
          { label: "Total Diterima", value: formatRupiah(r.totalReceived || 0) },
          { label: "Total Kembalian", value: formatRupiah(r.totalChange || 0) },
        ];
        const grandTotal = {
          label: "GRAND TOTAL",
          values: { Qty: r.totalQty, Total: r.totalSales, Diterima: r.totalReceived },
        };
        return { headers, rows, summary, grandTotal };
      }

      case "payment-method": {
        const r = xReportData;
        if (!r) return { headers: [], rows: [], summary: [], grandTotal: null };
        const headers = ["Metode", "Jumlah Transaksi", "Total Qty", "Total Penjualan", "Total Diterima"];
        const rows = (r.byPaymentMethod || []).map((m) => ({
          Metode: m.method,
          "Jumlah Transaksi": m.transactions,
          "Total Qty": Number(m.qty.toFixed(2)),
          "Total Penjualan": Number(m.amount) || 0,
          "Total Diterima": Number(m.received) || 0,
        }));
        const totalTrx = rows.reduce((s, r2) => s + (r2["Jumlah Transaksi"] || 0), 0);
        const totalQty = rows.reduce((s, r2) => s + (r2["Total Qty"] || 0), 0);
        const totalAmt = rows.reduce((s, r2) => s + (r2["Total Penjualan"] || 0), 0);
        const totalRec = rows.reduce((s, r2) => s + (r2["Total Diterima"] || 0), 0);
        return {
          headers,
          rows,
          summary: [
            { label: "Jumlah Metode Dipakai", value: rows.length },
            { label: "Total Transaksi", value: r.totalTransactions },
            { label: "Total Penjualan", value: formatRupiah(r.totalSales || 0) },
            { label: "Total Diterima", value: formatRupiah(r.totalReceived || 0) },
          ],
          grandTotal: {
            label: "GRAND TOTAL",
            values: {
              "Jumlah Transaksi": totalTrx,
              "Total Qty": Number(totalQty.toFixed(2)),
              "Total Penjualan": totalAmt,
              "Total Diterima": totalRec,
            },
          },
        };
      }

      case "margin": {
        const r = marginData;
        if (!r) return { headers: [], rows: [], summary: [], grandTotal: null };
        const headers = ["Barcode", "Produk", "Kategori", "Qty Terjual", "Pendapatan", "HPP", "Margin", "% Margin"];
        const rows = (r.items || []).map((i) => ({
          Barcode: i.barcode || "-",
          Produk: i.name,
          Kategori: i.category,
          "Qty Terjual": Number(i.qty) || 0,
          Pendapatan: Number(i.revenue) || 0,
          HPP: Number(i.cost) || 0,
          Margin: Number(i.margin) || 0,
          "% Margin": `${(Number(i.marginPct) || 0).toFixed(2)}%`,
        }));
        const summary = [
          { label: "Pendapatan Penjualan", value: formatRupiah(r.totals?.revenue || 0) },
          { label: "Total HPP", value: formatRupiah(r.totals?.cost || 0) },
          { label: "Margin Penjualan", value: formatRupiah(r.totals?.margin || 0) },
          { label: "% Margin", value: `${(r.totals?.marginPct || 0).toFixed(2)}%` },
          { label: "Nilai Pembelian Periode", value: formatRupiah(r.purchase?.totalValue || 0) },
          { label: "Qty Pembelian Periode", value: formatNumberId(r.purchase?.totalQty || 0) },
        ];
        const grandTotal = {
          label: "GRAND TOTAL",
          values: {
            "Qty Terjual": r.totals?.qty || 0,
            Pendapatan: r.totals?.revenue || 0,
            HPP: r.totals?.cost || 0,
            Margin: r.totals?.margin || 0,
            "% Margin": `${(r.totals?.marginPct || 0).toFixed(2)}%`,
          },
        };
        // Append category breakdown as additional rows separated visually
        const categoryRows = (r.byCategory || []).map((c) => ({
          Barcode: "—",
          Produk: `[KATEGORI] ${c.category}`,
          Kategori: c.category,
          "Qty Terjual": Number(c.qty) || 0,
          Pendapatan: Number(c.revenue) || 0,
          HPP: Number(c.cost) || 0,
          Margin: Number(c.margin) || 0,
          "% Margin": `${(Number(c.marginPct) || 0).toFixed(2)}%`,
        }));
        return { headers, rows: [...rows, ...categoryRows], summary, grandTotal };
      }

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
  }, [activeId, transactions, purchases, products, vendors, uoms, users, logs, filters, xReportData, marginData]);

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
    // Append grand total as last row if present
    const exportRows = [...report.rows];
    if (report.grandTotal) {
      const gtRow = {};
      report.headers.forEach((h, i) => {
        if (i === 0) gtRow[h] = report.grandTotal.label;
        else if (report.grandTotal.values[h] !== undefined)
          gtRow[h] = report.grandTotal.values[h];
        else gtRow[h] = "";
      });
      exportRows.push(gtRow);
    }
    if (kind === "excel") {
      exportToExcel(filename, report.headers, exportRows);
    } else {
      exportToPdf(title, report.headers, exportRows);
    }
  };

  const handlePrint = () => {
    if (!report.rows.length && !report.summary?.length) {
      toast.info("Tidak ada data untuk dicetak.");
      return;
    }

    // X Report: compact thermal print (totals only) → cashier printer.
    if (activeId === "x-report" && xReportData) {
      const r = xReportData;
      const cashier = useAuthStore.getState?.()?.user?.name || "Kasir";
      const payload = {
        cashier,
        periodFrom: filters.from || "",
        periodTo: filters.to || "",
        totalTransactions: r.totalTransactions || 0,
        totalQty: r.totalQty || 0,
        totalSales: r.totalSales || 0,
        totalReceived: r.totalReceived || 0,
        totalChange: r.totalChange || 0,
        byPaymentMethod: r.byPaymentMethod || [],
      };
      (async () => {
        try {
          if (isQzLoaded()) {
            const printer = await getDefaultQzPrinter().catch(() => null);
            if (printer) {
              await printXReportQZ(payload, printer);
              toast.success("X Report dikirim ke printer kasir.");
              return;
            }
          }
          printXReport(payload);
        } catch (err) {
          toast.error(err.message || "Gagal mencetak X Report.");
          printXReport(payload);
        }
      })();
      return;
    }

    const now = new Date();
    const printedAt = now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
    const periodText = (filters.from || filters.to)
      ? `${filters.from || "—"} s/d ${filters.to || "—"}`
      : "Semua periode";

    // Special compact receipt layout for X-Report; tabular layout for others.
    let bodyHtml = "";
    if (activeId === "x-report" && xReportData) {
      const r = xReportData;
      const byMethod = (r.byPaymentMethod || [])
        .map(
          (m) => `
            <tr>
              <td>${esc(m.method)}</td>
              <td class="r">${m.transactions}</td>
              <td class="r">${formatRupiahRaw(m.amount)}</td>
              <td class="r">${formatRupiahRaw(m.received)}</td>
            </tr>`,
        )
        .join("");
      bodyHtml = `
        <div class="summary-grid">
          <div class="box"><div class="lbl">Total Transaksi</div><div class="val">${r.totalTransactions || 0}</div></div>
          <div class="box"><div class="lbl">Total Qty Terjual</div><div class="val">${formatNumberId(r.totalQty || 0)}</div></div>
          <div class="box hi"><div class="lbl">Total Penjualan</div><div class="val">${formatRupiahRaw(r.totalSales || 0)}</div></div>
          <div class="box hi"><div class="lbl">Total Uang Diterima</div><div class="val">${formatRupiahRaw(r.totalReceived || 0)}</div></div>
          <div class="box"><div class="lbl">Total Kembalian</div><div class="val">${formatRupiahRaw(r.totalChange || 0)}</div></div>
        </div>
        <h3>Rekap per Metode Pembayaran</h3>
        <table class="tbl">
          <thead>
            <tr><th>Metode</th><th class="r">Jumlah Trx</th><th class="r">Penjualan</th><th class="r">Diterima</th></tr>
          </thead>
          <tbody>${byMethod || `<tr><td colspan="4" class="empty">Tidak ada data metode pembayaran</td></tr>`}</tbody>
          <tfoot>
            <tr class="grand">
              <td>GRAND TOTAL</td>
              <td class="r">${r.totalTransactions || 0}</td>
              <td class="r">${formatRupiahRaw(r.totalSales || 0)}</td>
              <td class="r">${formatRupiahRaw(r.totalReceived || 0)}</td>
            </tr>
          </tfoot>
        </table>
        <h3>Daftar Transaksi</h3>
        <table class="tbl small">
          <thead>
            <tr><th>No. Trx</th><th>Tanggal</th><th>Kasir</th><th>Metode</th><th class="r">Qty</th><th class="r">Total</th></tr>
          </thead>
          <tbody>
            ${(r.transactions || [])
              .map(
                (t) => `
              <tr>
                <td>${esc(t.transactionNo)}</td>
                <td>${esc(formatDate(t.date))}</td>
                <td>${esc(t.cashier || "-")}</td>
                <td>${esc((t.methods || []).join(", ") || "-")}</td>
                <td class="r">${formatNumberId(Number(t.totalQty) || 0)}</td>
                <td class="r">${formatRupiahRaw(Number(t.totalPrice) || 0)}</td>
              </tr>`,
              )
              .join("") || `<tr><td colspan="6" class="empty">Tidak ada transaksi pada periode ini</td></tr>`}
          </tbody>
        </table>`;
    } else {
      const summaryHtml = (report.summary || [])
        .map((s) => `<div class="box"><div class="lbl">${esc(s.label)}</div><div class="val">${esc(String(s.value))}</div></div>`)
        .join("");
      const headersHtml = report.headers.map((h) => `<th>${esc(h)}</th>`).join("");
      const rowsHtml = report.rows
        .map(
          (row) =>
            `<tr>${report.headers
              .map((h) => {
                const v = row[h];
                const isNum = typeof v === "number";
                const cls = isNum ? " class=\"r\"" : "";
                const text = isNum && /Total|Penjualan|HPP|Margin|Pendapatan|Diterima|Harga/i.test(h)
                  ? formatRupiahRaw(v)
                  : esc(String(v ?? ""));
                return `<td${cls}>${text}</td>`;
              })
              .join("")}</tr>`,
        )
        .join("");
      const gt = report.grandTotal;
      const gtRow = gt
        ? `<tr class="grand">${report.headers
            .map((h, i) => {
              if (i === 0) return `<td>${esc(gt.label)}</td>`;
              const v = gt.values?.[h];
              if (v === undefined || v === null || v === "") return `<td></td>`;
              const isNum = typeof v === "number";
              const text = isNum && /Total|Penjualan|HPP|Margin|Pendapatan|Diterima|Harga/i.test(h)
                ? formatRupiahRaw(v)
                : esc(String(v));
              return `<td class="${isNum ? "r" : ""}">${text}</td>`;
            })
            .join("")}</tr>`
        : "";
      bodyHtml = `
        ${summaryHtml ? `<div class="summary-grid">${summaryHtml}</div>` : ""}
        <table class="tbl small">
          <thead><tr>${headersHtml}</tr></thead>
          <tbody>${rowsHtml || `<tr><td colspan="${report.headers.length}" class="empty">Tidak ada data</td></tr>`}</tbody>
          ${gtRow ? `<tfoot>${gtRow}</tfoot>` : ""}
        </table>`;
    }

    const html = `
      <html>
        <head>
          <title>${esc(active.label)} - ${printedAt}</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: A4; margin: 12mm; }
            body { font-family: 'Inter', Arial, sans-serif; color: #111; margin: 0; }
            h1 { font-size: 18px; margin: 0; }
            h3 { font-size: 13px; margin: 16px 0 6px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
            .hdr { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #f97316; padding-bottom: 8px; }
            .hdr .meta { font-size: 11px; color: #555; text-align: right; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 12px; }
            .box { border: 1px solid #f3d5b5; border-radius: 8px; padding: 8px 10px; background: #fff7ed; }
            .box.hi { background: #fed7aa; border-color: #fb923c; }
            .box .lbl { font-size: 10px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; }
            .box .val { font-size: 15px; font-weight: 800; margin-top: 2px; }
            .tbl { width: 100%; border-collapse: collapse; font-size: 11px; }
            .tbl th, .tbl td { border: 1px solid #e5e7eb; padding: 4px 6px; text-align: left; }
            .tbl th { background: #fff7ed; color: #c2410c; font-weight: 700; }
            .tbl td.r, .tbl th.r { text-align: right; font-variant-numeric: tabular-nums; }
            .tbl tfoot tr.grand td { background: #fed7aa; font-weight: 800; }
            .tbl .empty { text-align: center; color: #9ca3af; padding: 12px; }
            .footer { margin-top: 18px; font-size: 10px; color: #666; display: flex; justify-content: space-between; }
            .sig { margin-top: 24px; display: flex; gap: 40px; justify-content: flex-end; }
            .sig .slot { width: 180px; text-align: center; font-size: 11px; }
            .sig .line { border-bottom: 1px solid #333; margin-top: 48px; margin-bottom: 4px; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="hdr">
            <div>
              <h1>Laporan ${esc(active.label)}</h1>
              <div style="font-size:11px;color:#555;">${esc(active.description || "")}</div>
            </div>
            <div class="meta">
              <div><strong>Periode:</strong> ${esc(periodText)}</div>
              ${filters.paymentMethod ? `<div><strong>Metode:</strong> ${esc(filters.paymentMethod)}</div>` : ""}
              ${filters.category ? `<div><strong>Kategori:</strong> ${esc(filters.category)}</div>` : ""}
              <div><strong>Dicetak:</strong> ${esc(printedAt)}</div>
            </div>
          </div>
          ${bodyHtml}
          <div class="sig">
            <div class="slot"><div class="line"></div>Kasir / Petugas</div>
            <div class="slot"><div class="line"></div>Supervisor</div>
          </div>
          <div class="footer">
            <div>Shafira POS</div>
            <div>Halaman cetak X-Report / Laporan</div>
          </div>
          <script>window.onload = () => { setTimeout(() => { window.focus(); window.print(); }, 300); };</script>
        </body>
      </html>`;

    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up diblokir browser. Izinkan pop-up untuk cetak.");
      return;
    }
    win.document.write(html);
    win.document.close();
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
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Printer size={14} /> Cetak
          </button>
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
                      /Total|Harga|Subtotal|Nilai|Pendapatan|HPP|Margin|Diterima|Penjualan/i.test(h) &&
                      !/qty/i.test(h) &&
                      !/%/.test(h)
                        ? formatRupiah(row[h])
                        : typeof row[h] === "number" && /qty|stok/i.test(h)
                        ? formatNumberId(row[h])
                        : String(row[h] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
            {!loading && report.grandTotal && report.rows.length > 0 && page === totalPages && (
              <tr className="bg-orange-100 font-semibold text-gray-900">
                {report.headers.map((h, i) => (
                  <td key={h} className="px-4 py-3 whitespace-nowrap">
                    {i === 0
                      ? report.grandTotal.label
                      : report.grandTotal.values[h] !== undefined
                      ? typeof report.grandTotal.values[h] === "number" &&
                        /Total|Harga|Subtotal|Nilai|Pendapatan|HPP|Margin|Diterima|Penjualan/i.test(h) &&
                        !/qty/i.test(h)
                        ? formatRupiah(report.grandTotal.values[h])
                        : typeof report.grandTotal.values[h] === "number" && /qty|stok/i.test(h)
                        ? formatNumberId(report.grandTotal.values[h])
                        : String(report.grandTotal.values[h])
                      : ""}
                  </td>
                ))}
              </tr>
            )}
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
