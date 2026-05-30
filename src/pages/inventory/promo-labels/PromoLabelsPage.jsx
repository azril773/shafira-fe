import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Printer, RefreshCcw, Search, Tag } from "lucide-react";
import { getProducts } from "../../../services/productService";
import { formatRupiah } from "../../../utils/format";
import { isPromoActive as isPromoActiveShared } from "../../../utils/promo";
import PaginationTableNoLink from "../../../components/globals/pagination";

const PAGE_SIZE = 10;
const PROMO_FILTERS = [
  { value: "all", label: "Semua", desc: "Tampilkan semua tipe harga" },
  { value: "hasPromo", label: "Punya Promo", desc: "Yang memiliki harga promo (aktif/akan datang/lewat)" },
  { value: "activePromo", label: "Promo Aktif", desc: "Hanya promo yang sedang berjalan" },
];

/**
 * Promo Label printing page.
 * - Lists all products that currently have at least one price with a promo configured.
 * - Lets user multi-select products and a paper layout (3/4 cols per row) for A4.
 * - Opens a print window styled as supermarket shelf labels (nama, barcode, harga normal,
 *   harga promo, tanggal promo). Uses CSS @page A4 portrait.
 */
export default function PromoLabelsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [columns, setColumns] = useState(3);
  const [labelsPerProduct, setLabelsPerProduct] = useState(1);
  const [promoFilter, setPromoFilter] = useState("all");
  const [page, setPage] = useState(1);

  const today = new Date();

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await getProducts();
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    setProducts(data || []);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const isPromoActive = (price) => isPromoActiveShared(price, today);

  // Flatten product+price combinations (all price tiers). Promo is optional.
  const promoEntries = useMemo(() => {
    const entries = [];
    for (const p of products) {
      for (const pr of p.prices || []) {
        const hasPromo = Number(pr.promoPrice || 0) > 0;
        const active = hasPromo && isPromoActive(pr);
        if (promoFilter === "hasPromo" && !hasPromo) continue;
        if (promoFilter === "activePromo" && !active) continue;
        entries.push({
          key: `${p.id}::${pr.id}`,
          productId: p.id,
          priceId: pr.id,
          name: p.name,
          barcode: p.barcode,
          category: p.category,
          priceName: pr.name,
          normalPrice: Number(pr.price),
          promoPrice: hasPromo ? Number(pr.promoPrice) : 0,
          promoActive: active,
          promoStart: pr.promoStartDate,
          promoEnd: pr.promoEndDate,
        });
      }
    }
    const q = query.trim().toLowerCase();
    return q
      ? entries.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            (e.barcode || "").includes(q) ||
            (e.category || "").toLowerCase().includes(q) ||
            (e.priceName || "").toLowerCase().includes(q),
        )
      : entries;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, query, promoFilter]);

  // Pagination (client-side)
  const totalPages = Math.max(1, Math.ceil(promoEntries.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);
  const pagedEntries = promoEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggle = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    // Pilih/lepas semua entri pada halaman aktif saja agar selection antar halaman tetap terjaga.
    const pageKeys = pagedEntries.map((e) => e.key);
    const allSelected = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageKeys.forEach((k) => next.delete(k));
      else pageKeys.forEach((k) => next.add(k));
      return next;
    });
  };

  const handlePrint = () => {
    const chosen = promoEntries.filter((e) => selected.has(e.key));
    if (chosen.length === 0) {
      toast.info("Pilih minimal satu produk untuk dicetak.");
      return;
    }

    const formatDate = (d) =>
      d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    // Repeat per labelsPerProduct
    const items = [];
    for (const c of chosen) {
      for (let i = 0; i < labelsPerProduct; i++) items.push(c);
    }

    const colPct = (100 / columns).toFixed(4);
    const cards = items
      .map((it) => {
        const isPromo = it.promoPrice > 0;
        const discount = isPromo && it.normalPrice > 0
          ? Math.round(((it.normalPrice - it.promoPrice) / it.normalPrice) * 100)
          : 0;
        const periodText = isPromo
          ? `${formatDate(it.promoStart)} s/d ${formatDate(it.promoEnd)}`
          : "";
        const badge = isPromo
          ? `PROMO ${discount > 0 ? `-${discount}%` : ""}`
          : escapeHtml(it.priceName || "HARGA");
        const priceBlock = isPromo
          ? `<div class="prices">
                <div class="normal"><span class="lbl">Harga Normal</span><span class="value strike">${formatRupiahRaw(it.normalPrice)}</span></div>
                <div class="promo"><span class="lbl">Harga Promo</span><span class="value">${formatRupiahRaw(it.promoPrice)}</span></div>
             </div>`
          : `<div class="prices">
                <div class="promo"><span class="lbl">${escapeHtml(it.priceName || "Harga")}</span><span class="value">${formatRupiahRaw(it.normalPrice)}</span></div>
             </div>`;
        const footer = isPromo
          ? `<div class="period">Berlaku: ${periodText}</div>`
          : `<div class="period">${escapeHtml(it.category || "")}</div>`;
        return `
          <div class="label ${isPromo ? "is-promo" : "is-plain"}" style="width:${colPct}%">
            <div class="inner">
              <div class="badge">${badge}</div>
              <div class="name">${escapeHtml(it.name)}</div>
              <div class="meta">${escapeHtml(it.category || "")} · ${escapeHtml(it.priceName)}</div>
              ${priceBlock}
              <div class="barcode">
                <div class="bars">${barcodeBars(it.barcode || "")}</div>
                <div class="bc-text">${escapeHtml(it.barcode || "")}</div>
              </div>
              ${footer}
            </div>
          </div>`;
      })
      .join("");

    const html = `
      <html>
        <head>
          <title>Label Promo</title>
          <style>
            * { box-sizing: border-box; }
            @page { size: A4; margin: 10mm; }
            body { margin: 0; font-family: 'Inter', Arial, sans-serif; color: #111; }
            .sheet { display: flex; flex-wrap: wrap; }
            .label { padding: 4mm; }
            .inner {
              border: 2px dashed #d4a373;
              border-radius: 10px;
              padding: 8px 10px;
              height: 100%;
              display: flex;
              flex-direction: column;
              gap: 4px;
              background: #fff;
            }
            .is-plain .inner { border-color: #c4b5a0; border-style: solid; }
            .badge {
              align-self: flex-start;
              background: #f97316; color: white;
              font-weight: 800; font-size: 11px;
              padding: 2px 8px;
              border-radius: 999px;
              letter-spacing: 0.5px;
            }
            .is-plain .badge { background: #6b7280; }
            .name { font-weight: 800; font-size: 14px; line-height: 1.15; }
            .meta { font-size: 10px; color: #666; }
            .prices { margin-top: 4px; }
            .normal { font-size: 10px; color: #666; display: flex; justify-content: space-between; }
            .normal .value.strike { text-decoration: line-through; }
            .promo { display: flex; justify-content: space-between; align-items: baseline; }
            .promo .lbl { font-size: 10px; color: #f97316; font-weight: 700; }
            .promo .value { font-weight: 900; font-size: 22px; color: #ea580c; }
            .barcode { margin-top: 4px; text-align: center; }
            .bars { font-family: 'Libre Barcode 39', monospace; font-size: 28px; letter-spacing: 0; line-height: 1; }
            .bc-text { font-family: monospace; font-size: 10px; letter-spacing: 1px; }
            .period { margin-top: auto; font-size: 9.5px; color: #444; text-align: center; padding-top: 4px; border-top: 1px dotted #ccc; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&family=Inter:wght@400;600;700;800;900&display=swap">
        </head>
        <body>
          <div class="sheet">${cards}</div>
          <script>
            window.onload = () => { setTimeout(() => { window.focus(); window.print(); }, 400); };
          </script>
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange-500">Marketing</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Tag size={20} /> Cetak Label Harga
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Pilih tipe harga (Eceran, Grosir, dst). Bila tipe harga punya promo aktif, label otomatis dicetak sebagai label promo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadProducts}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Printer size={14} /> Cetak ({selected.size})
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Cari
          <div className="relative">
            <Search size={14} className="absolute left-2 top-3 text-gray-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Nama / barcode / kategori..."
              className="w-full rounded-xl border border-orange-200 bg-white py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Kolom per halaman
          <select
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value))}
            className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value={2}>2 kolom (besar)</option>
            <option value={3}>3 kolom (standar)</option>
            <option value={4}>4 kolom (rapat)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          Label per produk
          <input
            type="number"
            min="1"
            max="20"
            value={labelsPerProduct}
            onChange={(e) => setLabelsPerProduct(Math.max(1, Number(e.target.value) || 1))}
            className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </label>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">Filter Promo</p>
        <div className="mt-2 inline-flex flex-wrap gap-1 rounded-full border border-orange-200 bg-orange-50 p-1">
          {PROMO_FILTERS.map((f) => {
            const active = promoFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                title={f.desc}
                onClick={() => {
                  setPromoFilter(f.value);
                  setPage(1);
                  setSelected(new Set());
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-orange-700 hover:bg-white"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 border-t border-orange-100 pt-6">
      <div className="overflow-x-auto rounded-3xl border border-orange-100">
        <table className="w-full text-sm">
          <thead className="bg-orange-50 text-xs uppercase tracking-wider text-orange-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={
                    pagedEntries.length > 0 &&
                    pagedEntries.every((e) => selected.has(e.key))
                  }
                  onChange={toggleAll}
                  className="accent-orange-500"
                  title="Pilih semua di halaman ini"
                />
              </th>
              <th className="px-4 py-3 text-left">Produk</th>
              <th className="px-4 py-3 text-left">Barcode</th>
              <th className="px-4 py-3 text-left">Kategori</th>
              <th className="px-4 py-3 text-left">Tipe Harga</th>
              <th className="px-4 py-3 text-right">Harga Normal</th>
              <th className="px-4 py-3 text-right">Harga Promo</th>
              <th className="px-4 py-3 text-left">Periode</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  Memuat...
                </td>
              </tr>
            )}
            {!loading && promoEntries.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  Tidak ada data harga produk yang cocok dengan filter.
                </td>
              </tr>
            )}
            {!loading &&
              pagedEntries.map((e) => (
                <tr
                  key={e.key}
                  onClick={() => toggle(e.key)}
                  className={`cursor-pointer border-t border-orange-50 transition-colors hover:bg-orange-50/50 ${
                    selected.has(e.key) ? "bg-orange-50" : ""
                  }`}
                >
                  <td className="px-4 py-3" onClick={(ev) => ev.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(e.key)}
                      onChange={() => toggle(e.key)}
                      className="accent-orange-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{e.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{e.barcode}</td>
                  <td className="px-4 py-3 text-gray-600">{e.category}</td>
                  <td className="px-4 py-3 text-gray-600">{e.priceName}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {e.promoPrice > 0 ? (
                      <span className="line-through">{formatRupiah(e.normalPrice)}</span>
                    ) : (
                      <span className="font-semibold text-gray-800">{formatRupiah(e.normalPrice)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-orange-600">
                    {e.promoPrice > 0 ? formatRupiah(e.promoPrice) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {e.promoPrice > 0 ? (
                      <>
                        {e.promoStart ? new Date(e.promoStart).toLocaleDateString("id-ID") : "—"}{" "}
                        <span className="text-gray-400">→</span>{" "}
                        {e.promoEnd ? new Date(e.promoEnd).toLocaleDateString("id-ID") : "—"}
                      </>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      </div>

      {!loading && promoEntries.length > 0 && (
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-gray-500">
            Menampilkan {Math.min((page - 1) * PAGE_SIZE + 1, promoEntries.length)}–
            {Math.min(page * PAGE_SIZE, promoEntries.length)} dari {promoEntries.length} baris
            {selected.size > 0 && (
              <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                {selected.size} dipilih
              </span>
            )}
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

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[m]);
}

function formatRupiahRaw(n) {
  return "Rp " + (Number(n) || 0).toLocaleString("id-ID");
}

// Convert barcode digits to Libre Barcode 39 format string (*XXX*)
function barcodeBars(value) {
  const safe = String(value || "").replace(/[^0-9A-Za-z\-. $\/+%]/g, "");
  return `*${safe}*`;
}
