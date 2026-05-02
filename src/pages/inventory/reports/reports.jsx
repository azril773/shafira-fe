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
import { formatRupiah } from "../../../utils/format";
import { getProducts } from "../../../services/productService";
import {
  searchPurchase,
  getVendors,
} from "../../../services/purchaseService";
import { searchTransactions } from "../../../services/transactionService";
import { getUoms } from "../../../services/uomService";
import { listUsers } from "../../../services/userService";
import { listAuditLogs } from "../../../services/auditLogService";

const REPORTS = [
  {
    id: "sales",
    label: "Penjualan",
    icon: Receipt,
    description: "Daftar transaksi penjualan dengan total dan metode bayar.",
  },
  {
    id: "purchase",
    label: "Pembelian",
    icon: Truck,
    description: "Order pembelian beserta vendor, qty, dan harga beli.",
  },
  {
    id: "stock",
    label: "Stok Produk",
    icon: FileChartPie,
    description: "Stok terkini, kategori, dan harga jual.",
  },
  {
    id: "return",
    label: "Retur / Void",
    icon: RotateCcw,
    description: "Item yang di-refund atau transaksi yang dibatalkan.",
  },
  {
    id: "vendors",
    label: "Vendor",
    icon: Box,
    description: "Daftar vendor dan kontak.",
  },
  {
    id: "uoms",
    label: "Satuan (UoM)",
    icon: Ruler,
    description: "Master satuan unit produk.",
  },
  {
    id: "users",
    label: "User",
    icon: UsersIcon,
    description: "Daftar pengguna sistem dan rolenya.",
  },
  {
    id: "audit",
    label: "Audit Log",
    icon: ShieldAlert,
    description: "Riwayat void, abort, refund, dan persetujuan user.",
  },
];

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

export default function ReportsPage() {
  const [activeId, setActiveId] = useState("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  const active = REPORTS.find((r) => r.id === activeId) || REPORTS[0];

  const reload = async () => {
    setLoading(true);
    try {
      if (activeId === "sales" || activeId === "return") {
        const list = await fetchAllPages(
          (page) => searchTransactions({ page }),
          "data",
        );
        setTransactions(list);
      } else if (activeId === "purchase") {
        const list = await fetchAllPages(
          (page) => searchPurchase({ page }),
          "data",
        );
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
        const list = await fetchAllPages(
          (page) => listUsers({ page }),
          "data",
        );
        setUsers(list);
      } else if (activeId === "audit") {
        const list = await fetchAllPages(
          (page) => listAuditLogs({ page }),
          "data",
        );
        setLogs(list);
      }
    } catch (e) {
      toast.error(e.message || "Gagal memuat data laporan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const report = useMemo(() => {
    switch (activeId) {
      case "sales": {
        const filtered = transactions.filter(
          (t) =>
            t.status !== "VOIDED" &&
            isWithin(t.createdAt || t.transactionDate, from, to),
        );
        const headers = [
          "No Transaksi",
          "Tanggal",
          "Kasir",
          "Metode",
          "Total Qty",
          "Total",
          "Status",
        ];
        const rows = filtered.map((t) => ({
          "No Transaksi": t.transactionNo,
          Tanggal: formatDate(t.createdAt),
          Kasir: t.cashier?.username || "-",
          Metode: t.paymentMethod,
          "Total Qty": t.totalQty,
          Total: Number(t.totalPrice) || 0,
          Status: t.status,
        }));
        const totalSales = filtered.reduce(
          (a, t) => a + (Number(t.totalPrice) || 0),
          0,
        );
        return {
          headers,
          rows,
          summary: [
            { label: "Total Transaksi", value: filtered.length },
            { label: "Total Nilai", value: formatRupiah(totalSales) },
          ],
        };
      }
      case "return": {
        const filtered = transactions.filter((t) =>
          isWithin(t.createdAt, from, to),
        );
        const refundDetails = [];
        let voided = 0;
        filtered.forEach((t) => {
          if (t.status === "VOIDED") voided += 1;
          (t.transactionDetails || []).forEach((d) => {
            if (d.isRefund) {
              refundDetails.push({
                "No Transaksi": t.transactionNo,
                Tanggal: formatDate(t.createdAt),
                Produk: d.historicalName,
                Qty: d.qty,
                Harga: Number(d.historicalPrice) || 0,
                Subtotal: (Number(d.historicalPrice) || 0) * (d.qty || 0),
                Alasan: d.refundReason || "-",
              });
            }
          });
        });
        const totalRefund = refundDetails.reduce(
          (a, r) => a + r.Subtotal,
          0,
        );
        return {
          headers: [
            "No Transaksi",
            "Tanggal",
            "Produk",
            "Qty",
            "Harga",
            "Subtotal",
            "Alasan",
          ],
          rows: refundDetails,
          summary: [
            { label: "Item Diretur", value: refundDetails.length },
            { label: "Transaksi Void", value: voided },
            { label: "Nilai Retur", value: formatRupiah(totalRefund) },
          ],
        };
      }
      case "purchase": {
        const filtered = purchases.filter((p) =>
          isWithin(p.purchaseDate, from, to),
        );
        const rows = [];
        let totalQty = 0;
        let totalValue = 0;
        filtered.forEach((p) => {
          (p.purchaseDetails || []).forEach((d) => {
            const sub =
              (Number(d.purchasePrice) || 0) * (Number(d.qty) || 0);
            totalQty += d.qty || 0;
            totalValue += sub;
            rows.push({
              Tanggal: formatDate(p.purchaseDate),
              Vendor: p.vendor?.name || "-",
              Status: p.status,
              Produk: d.product?.name || "-",
              Qty: d.qty,
              "Harga Beli": Number(d.purchasePrice) || 0,
              Subtotal: sub,
            });
          });
        });
        return {
          headers: [
            "Tanggal",
            "Vendor",
            "Status",
            "Produk",
            "Qty",
            "Harga Beli",
            "Subtotal",
          ],
          rows,
          summary: [
            { label: "Order Pembelian", value: filtered.length },
            { label: "Total Qty", value: totalQty },
            { label: "Total Nilai", value: formatRupiah(totalValue) },
          ],
        };
      }
      case "stock": {
        const rows = products.map((p) => ({
          Kode: p.code || "-",
          Barcode: p.barcode || "-",
          Nama: p.name,
          Kategori: p.category || "-",
          Satuan: p.uom?.code || "-",
          Stok: p.stock,
          "Harga Utama": Number(p.prices?.[0]?.price) || 0,
        }));
        const totalStock = rows.reduce((a, r) => a + (r.Stok || 0), 0);
        const stockValue = rows.reduce(
          (a, r) => a + (r.Stok || 0) * (r["Harga Utama"] || 0),
          0,
        );
        return {
          headers: [
            "Kode",
            "Barcode",
            "Nama",
            "Kategori",
            "Satuan",
            "Stok",
            "Harga Utama",
          ],
          rows,
          summary: [
            { label: "Jumlah Produk", value: rows.length },
            { label: "Total Stok", value: totalStock },
            { label: "Estimasi Nilai Stok", value: formatRupiah(stockValue) },
          ],
        };
      }
      case "vendors":
        return {
          headers: ["Nama", "Telepon"],
          rows: vendors.map((v) => ({
            Nama: v.name,
            Telepon: v.phone || "-",
          })),
          summary: [{ label: "Jumlah Vendor", value: vendors.length }],
        };
      case "uoms":
        return {
          headers: ["Kode", "Nama", "Deskripsi"],
          rows: uoms.map((u) => ({
            Kode: u.code,
            Nama: u.name,
            Deskripsi: u.description || "-",
          })),
          summary: [{ label: "Jumlah Satuan", value: uoms.length }],
        };
      case "users":
        return {
          headers: ["Username", "Nama", "Role", "Status"],
          rows: users.map((u) => ({
            Username: u.username,
            Nama: u.name || "-",
            Role: u.role,
            Status: u.status,
          })),
          summary: [{ label: "Jumlah User", value: users.length }],
        };
      case "audit": {
        const filtered = logs.filter((l) =>
          isWithin(l.createdAt, from, to),
        );
        return {
          headers: [
            "Waktu",
            "Aksi",
            "Aktor",
            "Diverifikasi",
            "Entitas",
            "Alasan",
          ],
          rows: filtered.map((l) => ({
            Waktu: formatDate(l.createdAt),
            Aksi: l.action,
            Aktor: l.actor?.username || "-",
            Diverifikasi: l.verifiedBy?.username || "-",
            Entitas: l.entityType
              ? `${l.entityType}${l.entityId ? `:${l.entityId.slice(0, 8)}` : ""}`
              : "-",
            Alasan: l.reason || "-",
          })),
          summary: [{ label: "Jumlah Catatan", value: filtered.length }],
        };
      }
      default:
        return { headers: [], rows: [], summary: [] };
    }
  }, [activeId, transactions, purchases, products, vendors, uoms, users, logs, from, to]);

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
            Report
          </p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">
            Laporan Modul
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Pilih modul, tentukan rentang tanggal, lalu export ke Excel atau PDF.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-gray-500">
            Dari
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
          <label className="text-xs text-gray-500">
            Sampai
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
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

      {report.summary.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {report.summary.map((s) => (
            <div
              key={s.label}
              className="rounded-3xl border border-orange-100 bg-orange-50 p-4"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-orange-500">
                {s.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-3xl border border-orange-100">
        <table className="w-full min-w-[720px] text-left text-sm text-gray-600">
          <thead>
            <tr className="border-b border-orange-100 text-gray-500">
              {report.headers.map((h) => (
                <th key={h} className="px-4 py-3 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={report.headers.length || 1}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && report.rows.length === 0 && (
              <tr>
                <td
                  colSpan={report.headers.length || 1}
                  className="px-4 py-6 text-center text-gray-400"
                >
                  Tidak ada data.
                </td>
              </tr>
            )}
            {!loading &&
              report.rows.map((row, idx) => (
                <tr key={idx} className="border-b border-orange-50">
                  {report.headers.map((h) => (
                    <td key={h} className="px-4 py-3 whitespace-nowrap">
                      {typeof row[h] === "number" &&
                      /Total|Harga|Subtotal|Nilai/i.test(h)
                        ? formatRupiah(row[h])
                        : String(row[h] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
