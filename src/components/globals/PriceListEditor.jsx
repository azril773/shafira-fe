import { useMemo, useState } from "react";
import { formatNumberId, formatRupiah, parseNumberInput } from "../../utils/format";
import { isPromoActive } from "../../utils/promo";

/**
 * Editor untuk daftar harga sebuah produk (mendukung multi-harga + promo opsional).
 * Dipakai di halaman Tambah dan Edit Produk agar tampilan dan logika konsisten.
 *
 * Props:
 *  - prices: array<{ name, price, promoPrice?, promoStartDate?, promoEndDate? }>
 *  - setPrices: setter (menerima array baru)
 *  - error: object error map dengan key `price.${index}.name|price`
 *  - setError: setter error (untuk membersihkan error saat user mengetik)
 *  - max: jumlah maksimum tier harga (default 5)
 */
export default function PriceListEditor({
  prices,
  setPrices,
  error = {},
  setError = () => {},
  max = 5,
}) {
  const updatePrice = (index, patch) => {
    setPrices((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const clearError = (key) => {
    setError((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addTier = () => {
    if (prices.length >= max) return;
    setPrices((prev) => [
      ...prev,
      { name: "", price: 0, promoPrice: null, promoStartDate: null, promoEndDate: null },
    ]);
  };

  const removeTier = (index) => {
    setPrices((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">Daftar Harga</p>
          <p className="text-xs text-gray-500">
            Tambahkan satu atau lebih tier harga (mis. Eceran, Grosir). Promo bersifat opsional.
          </p>
        </div>
        <button
          type="button"
          onClick={addTier}
          disabled={prices.length >= max}
          className="rounded-full cursor-pointer border border-orange-500 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Tambah Harga {prices.length >= max && `(maks ${max})`}
        </button>
      </div>

      {error.prices && <p className="text-xs text-red-500">{error.prices}</p>}

      {prices.length === 0 && (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/60 p-6 text-center text-sm text-gray-500">
          Belum ada harga. Klik <span className="font-semibold text-orange-600">Tambah Harga</span> untuk menambah tier pertama.
        </div>
      )}

      <div className="space-y-3">
        {prices.map((price, index) => (
          <PriceCard
            key={index}
            index={index}
            price={price}
            error={error}
            onChange={(patch) => updatePrice(index, patch)}
            onClearError={clearError}
            onRemove={() => removeTier(index)}
          />
        ))}
      </div>
    </div>
  );
}

function PriceCard({ index, price, error, onChange, onClearError, onRemove }) {
  const hasPromoData =
    price.promoPrice != null && price.promoPrice !== "" && Number(price.promoPrice) > 0;
  const [showPromo, setShowPromo] = useState(hasPromoData);
  const [priceRaw, setPriceRaw] = useState(() =>
    formatNumberId(price.price ?? 0, { maximumFractionDigits: 0 })
  );
  const [promoRaw, setPromoRaw] = useState(() =>
    price.promoPrice != null && price.promoPrice !== ""
      ? formatNumberId(price.promoPrice, { maximumFractionDigits: 0 })
      : ""
  );

  const promoActive = useMemo(() => isPromoActive(price), [price]);

  const togglePromo = () => {
    if (showPromo) {
      // matikan promo dan kosongkan datanya
      onChange({ promoPrice: null, promoStartDate: null, promoEndDate: null });
      setPromoRaw("");
      setShowPromo(false);
    } else {
      setShowPromo(true);
    }
  };

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-gray-800">
            Tier Harga #{index + 1}
          </span>
          {promoActive && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              PROMO AKTIF
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-500 hover:text-white"
        >
          Hapus
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-gray-600">Nama Harga</span>
          <input
            type="text"
            placeholder="mis. Eceran / Grosir"
            value={price.name ?? ""}
            onChange={(e) => {
              onClearError(`price.${index}.name`);
              onChange({ name: e.target.value });
            }}
            className={`mt-1 w-full rounded-xl border bg-orange-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              error[`price.${index}.name`]
                ? "border-red-500 focus:ring-red-300"
                : "border-orange-200 focus:ring-orange-300"
            }`}
          />
          {error[`price.${index}.name`] && (
            <p className="mt-1 text-xs text-red-500">{error[`price.${index}.name`]}</p>
          )}
        </label>

        <label className="block">
          <span className="text-xs font-medium text-gray-600">Harga Normal</span>
          <input
            type="text"
            inputMode="numeric"
            value={priceRaw}
            onChange={(e) => {
              setPriceRaw(e.target.value);
              onClearError(`price.${index}.price`);
              onChange({ price: parseNumberInput(e.target.value) });
            }}
            onBlur={() => {
              const num = parseNumberInput(priceRaw);
              setPriceRaw(formatNumberId(num, { maximumFractionDigits: 0 }));
            }}
            className={`mt-1 w-full rounded-xl border bg-orange-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              error[`price.${index}.price`]
                ? "border-red-500 focus:ring-red-300"
                : "border-orange-200 focus:ring-orange-300"
            }`}
          />
          {error[`price.${index}.price`] && (
            <p className="mt-1 text-xs text-red-500">{error[`price.${index}.price`]}</p>
          )}
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-orange-50/60 px-3 py-2">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-700">Harga Promo</span>
          <span className="text-[11px] text-gray-500">
            {showPromo
              ? promoActive
                ? `Aktif. Harga jual: ${formatRupiah(Number(price.promoPrice) || 0)}`
                : "Atur harga dan periode promo di bawah."
              : "Opsional. Aktifkan jika ingin memberi harga khusus selama periode tertentu."}
          </span>
        </div>
        <button
          type="button"
          onClick={togglePromo}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            showPromo
              ? "border border-orange-400 bg-white text-orange-600 hover:bg-orange-100"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          {showPromo ? "Matikan Promo" : "Aktifkan Promo"}
        </button>
      </div>

      {showPromo && (
        <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-orange-100 bg-orange-50/40 p-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-[11px] font-medium text-gray-600">Harga Promo</span>
            <input
              type="text"
              inputMode="numeric"
              value={promoRaw}
              onChange={(e) => {
                const raw = e.target.value;
                setPromoRaw(raw);
                onChange({
                  promoPrice: raw === "" ? null : parseNumberInput(raw),
                });
              }}
              onBlur={() => {
                if (promoRaw === "") return;
                const num = parseNumberInput(promoRaw);
                setPromoRaw(num ? formatNumberId(num, { maximumFractionDigits: 0 }) : "");
              }}
              className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-gray-600">Mulai Promo</span>
            <input
              type="date"
              value={price.promoStartDate || ""}
              onChange={(e) => onChange({ promoStartDate: e.target.value || null })}
              className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-gray-600">Akhir Promo</span>
            <input
              type="date"
              value={price.promoEndDate || ""}
              onChange={(e) => onChange({ promoEndDate: e.target.value || null })}
              className="mt-1 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </label>
        </div>
      )}
    </div>
  );
}
