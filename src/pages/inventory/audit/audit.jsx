import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { listAuditLogs } from "../../../services/auditLogService";
import PaginationTableNoLink from "../../../components/globals/pagination";

const ACTIONS = [
  { value: "", label: "Semua" },
  { value: "VOID_ITEM", label: "Void Item" },
  { value: "ABORT_SALE", label: "Abort Penjualan" },
  { value: "VOID_TRX", label: "Void Transaksi" },
  { value: "REFUND_TRX", label: "Refund Transaksi" },
  { value: "USER_APPROVED", label: "User Approved" },
  { value: "USER_REJECTED", label: "User Rejected" },
];

const BADGE = {
  VOID_ITEM: "bg-yellow-100 text-yellow-700",
  ABORT_SALE: "bg-orange-100 text-orange-700",
  VOID_TRX: "bg-red-100 text-red-700",
  REFUND_TRX: "bg-purple-100 text-purple-700",
  USER_APPROVED: "bg-green-100 text-green-700",
  USER_REJECTED: "bg-red-100 text-red-700",
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

function formatRupiah(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

function describeLog(log) {
  const p = log.payload || {};
  switch (log.action) {
    case "VOID_ITEM": {
      const name = p.productName || p.product || p.name || "item";
      const qty = p.qty ?? p.quantity;
      const barcode = p.barcode ? ` [${p.barcode}]` : "";
      return `Membatalkan item "${name}"${barcode}${qty ? ` sebanyak ${qty} qty` : ""} pada transaksi berjalan.`;
    }
    case "ABORT_SALE": {
      const items = Array.isArray(p.items) ? p.items : [];
      const totalQty = p.totalQty ?? items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
      const total = p.total ?? p.totalPrice;
      const parts = ["Membatalkan seluruh penjualan yang sedang berjalan"];
      if (totalQty) parts.push(`total qty ${totalQty}`);
      if (total != null) parts.push(`senilai ${formatRupiah(total)}`);
      return parts.join(" — ") + ".";
    }
    case "VOID_TRX": {
      const trx = p.transactionNo || log.entityId;
      const total = p.totalPrice ?? p.total;
      const totalQty = p.totalQty;
      const parts = [`Void transaksi ${trx || ""}`];
      if (totalQty != null) parts.push(`total qty ${totalQty}`);
      if (total != null) parts.push(`senilai ${formatRupiah(total)}`);
      return parts.join(" — ") + ".";
    }
    case "REFUND_TRX": {
      const trx = p.transactionNo || log.entityId;
      const qty = p.refundedQty;
      const amount = p.refundedAmount;
      const parts = [`Refund transaksi ${trx || ""}`];
      if (qty != null) parts.push(`total qty ${qty}`);
      if (amount != null) parts.push(`senilai ${formatRupiah(amount)}`);
      return parts.join(" — ") + ".";
    }
    case "USER_APPROVED": {
      const u = p.username || p.user || log.entityId;
      const role = p.role ? ` sebagai ${p.role}` : "";
      return `Menyetujui user "${u}"${role}.`;
    }
    case "USER_REJECTED": {
      const u = p.username || p.user || log.entityId;
      return `Menolak pendaftaran user "${u}".`;
    }
    default:
      return "-";
  }
}

function refundItemsList(log) {
  if (log.action !== "REFUND_TRX") return null;
  const items = log.payload?.refundedItems;
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <ul className="mt-1 list-disc pl-4 space-y-0.5 text-[11px] text-gray-600">
      {items.map((it, idx) => (
        <li key={idx}>
          <span className="font-medium">{it.name}</span>
          {it.barcode ? <span className="text-gray-400"> [{it.barcode}]</span> : null}
          {" — "}
          <span>{it.qty} qty</span>
          {it.price != null ? (
            <span className="text-gray-500"> @ {formatRupiah(it.price)}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [action, setAction] = useState("");

  const load = async () => {
    const { data, totalPages, error } = await listAuditLogs({
      page,
      action: action || undefined,
    });
    if (error) {
      toast.error(error);
      return;
    }
    setLogs(data);
    setTotalPages(totalPages || 1);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, action]);

  return (
    <section className="rounded-[40px] border border-orange-100 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-orange-500">
          Audit Log
        </p>
        <h3 className="mt-2 text-xl font-semibold text-gray-900">
          Riwayat Aktivitas
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Catatan void, abort, refund dan persetujuan user.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm text-gray-600">
          Tipe
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="mt-2 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-orange-100">
        <table className="w-full min-w-[720px] text-left text-sm text-gray-600">
          <thead>
            <tr className="border-b border-orange-100 text-gray-500">
              <th className="px-4 py-3">Waktu</th>
              <th className="px-4 py-3">Aksi</th>
              <th className="px-4 py-3">Aktor</th>
              <th className="px-4 py-3">Diverifikasi</th>
              <th className="px-4 py-3">Alasan</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Tidak ada catatan.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-orange-50 align-top">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[log.action] || "bg-gray-100 text-gray-700"}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3">{log.actor?.username || "-"}</td>
                <td className="px-4 py-3">{log.verifiedBy?.username || "-"}</td>
                <td className="px-4 py-3">{log.reason || "-"}</td>
                <td className="px-4 py-3">
                  <p className="max-w-sm text-xs text-gray-600">
                    {describeLog(log)}
                  </p>
                  {refundItemsList(log)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationTableNoLink
        currentPage={page}
        setCurrentPage={setPage}
        totalPages={totalPages}
      />
    </section>
  );
}
