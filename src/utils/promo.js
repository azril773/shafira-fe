// Helpers untuk menangani logika harga promo pada produk.

/**
 * Mengecek apakah promo pada sebuah price option sedang aktif.
 * Aktif jika: promoPrice > 0 dan hari ini berada di antara promoStartDate dan promoEndDate (inklusif).
 * Jika start/end tidak diisi, batas tersebut dianggap tidak membatasi.
 */
export function isPromoActive(price, refDate) {
  if (!price) return false;
  const promo = Number(price.promoPrice || 0);
  if (!promo || promo <= 0) return false;
  const ref = refDate instanceof Date ? refDate : new Date();
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const start = price.promoStartDate ? new Date(price.promoStartDate) : null;
  const end = price.promoEndDate ? new Date(price.promoEndDate) : null;
  if (start && today < new Date(start.getFullYear(), start.getMonth(), start.getDate())) return false;
  if (end && today > new Date(end.getFullYear(), end.getMonth(), end.getDate())) return false;
  return true;
}

/**
 * Mengembalikan harga efektif untuk sebuah price option.
 * Jika promo aktif, kembalikan promoPrice; jika tidak, harga normal.
 */
export function getEffectivePrice(price, refDate) {
  const normal = Number(price?.price) || 0;
  if (isPromoActive(price, refDate)) {
    return {
      price: Number(price.promoPrice) || 0,
      originalPrice: normal,
      isPromo: true,
    };
  }
  return { price: normal, originalPrice: normal, isPromo: false };
}
