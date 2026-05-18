export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatNumberId(value, options = {}) {
  if (value === '' || value === null || value === undefined) return ''
  const num = Number(value)
  if (!Number.isFinite(num)) return ''
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
    ...options,
  }).format(num)
}

export function parseNumberInput(value) {
  if (value === null || value === undefined) return 0
  const raw = String(value).trim()
  if (!raw) return 0
  const compact = raw.replace(/\s/g, '').replace(/[^0-9.,-]/g, '')
  if (!compact) return 0

  const isNegative = compact.startsWith('-')
  const unsigned = compact.replace(/-/g, '')

  const dotCount = (unsigned.match(/\./g) || []).length
  const commaCount = (unsigned.match(/,/g) || []).length

  let normalized = unsigned

  if (dotCount > 0 && commaCount > 0) {
    const lastDot = unsigned.lastIndexOf('.')
    const lastComma = unsigned.lastIndexOf(',')
    const decimalSeparator = lastDot > lastComma ? '.' : ','
    const thousandSeparator = decimalSeparator === '.' ? ',' : '.'
    normalized = unsigned.replace(new RegExp(`\\${thousandSeparator}`, 'g'), '')
    if (decimalSeparator === ',') normalized = normalized.replace(',', '.')
  } else if (dotCount > 0 || commaCount > 0) {
    const separator = dotCount > 0 ? '.' : ','
    const parts = unsigned.split(separator)

    if (parts.length > 2) {
      normalized = unsigned.replace(new RegExp(`\\${separator}`, 'g'), '')
    } else {
      const integerPart = parts[0] || ''
      const fractionPart = parts[1] || ''

      // Treat 1.000 / 1,000 as thousands separator, but keep 0.25 / 0,25 as decimal.
      const looksLikeThousands = integerPart !== '0' && fractionPart.length === 3
      if (looksLikeThousands) {
        normalized = unsigned.replace(separator, '')
      } else {
        normalized = separator === ',' ? unsigned.replace(',', '.') : unsigned
      }
    }
  }

  if (isNegative) normalized = `-${normalized}`
  const num = Number(normalized)
  return Number.isFinite(num) ? num : 0
}

export function formatDate(dateStr) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateStr))
}
