/**
 * Returns the numeric qty as-is. No unit conversion applied.
 * Unit differences are handled through pricing (harga per kg, per pcs, dll).
 */
export function toSmallestUnitQty(qty) {
  const numericQty = Number(qty) || 0
  return numericQty > 0 ? numericQty : 0
}
