import { formatRupiah } from './format'

export function formatDateTime(date = new Date()) {
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const LINE_WIDTH = 10

function padRight(text, length) {
  const str = String(text)
  return str.length >= length ? str.slice(0, length) : str + ' '.repeat(length - str.length)
}

function padLeft(text, length) {
  const str = String(text)
  return str.length >= length ? str.slice(0, length) : ' '.repeat(length - str.length) + str
}

function centerText(text, width = LINE_WIDTH) {
  const str = String(text)
  if (str.length >= width) return str.slice(0, width)
  const padding = width - str.length
  const left = Math.floor(padding / 2)
  const right = padding - left
  return ' '.repeat(left) + str + ' '.repeat(right)
}

export function formatReceiptText({
  storeName = 'ShafiraMart',
  storeAddress = 'Jl. Contoh No. 123, Kota',
  storePhone = '0812-3456-7890',
  receiptId = '',
  date = formatDateTime(),
  cashier = 'Kasir',
  items = [],
  subtotal = 0,
  total = 0,
  paymentMethod = 'Tunai',
  cash = 0,
  change = 0,
}) {
  const lines = []
  lines.push(centerText(storeName))
  lines.push(centerText(storeAddress))
  lines.push(centerText(`Telp: ${storePhone}`))
  lines.push('-'.repeat(LINE_WIDTH))
  lines.push(`ID: ${receiptId}`)
  lines.push(`Tgl: ${date}`)
  lines.push(`Kasir: ${cashier}`)
  lines.push('-'.repeat(LINE_WIDTH))

  items.forEach((item) => {
    const name = item.priceLabel ? `${item.name} (${item.priceLabel})` : item.name
    const itemLine = `${name}`.slice(0, LINE_WIDTH)
    const qtyPrice = `${item.qty} x ${formatRupiah(item.price)}`
    lines.push(itemLine)
    if (qtyPrice.length <= LINE_WIDTH) {
      lines.push(padRight('', LINE_WIDTH - qtyPrice.length) + qtyPrice)
    } else {
      lines.push(qtyPrice)
    }
  })

  lines.push('-'.repeat(LINE_WIDTH))
  lines.push(padRight('Subtotal', LINE_WIDTH - formatRupiah(subtotal).length) + formatRupiah(subtotal))
  lines.push(padRight('Total', LINE_WIDTH - formatRupiah(total).length) + formatRupiah(total))
  lines.push(padRight('Metode', LINE_WIDTH - paymentMethod.length) + paymentMethod)
  if (paymentMethod === 'Tunai') {
    lines.push(padRight('Bayar', LINE_WIDTH - formatRupiah(cash).length) + formatRupiah(cash))
    lines.push(padRight('Kembali', LINE_WIDTH - formatRupiah(change).length) + formatRupiah(change))
  }
  lines.push('-'.repeat(LINE_WIDTH))
  lines.push(centerText('Terima kasih sudah berbelanja!'))
  lines.push('')
  lines.push('')

  return lines.join('\n')
}

export function formatReceiptHtml({
  storeName = 'ShafiraMart',
  storeAddress = 'Jl. Contoh No. 123, Kota',
  storePhone = '0812-3456-7890',
  receiptId,
  date,
  cashier = 'Kasir',
  items = [],
  subtotal = 0,
  total = 0,
  paymentMethod = 'Tunai',
  cash = 0,
  change = 0,
}) {
  const rows = items
    .map((item) => {
      const description = item.priceLabel ? `${item.name} (${item.priceLabel})` : item.name
      return `
        <tr>
          <td>${description.replace(/</g, '&lt;')}</td>
          <td class="right">${item.qty}x</td>
          <td class="right">${formatRupiah(item.price)}</td>
        </tr>`
    })
    .join('')

  return `
    <html>
      <head>
        <title>Struk ${receiptId}</title>
        <style>
          body { font-family: monospace; margin: 0; padding: 0; }
          .receipt { width: 65mm; padding: 8px; font-size: 12px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 11px; }
          .right { text-align: right; text-wrap: wrap; }
          .divider { border-top: 1px dashed #333; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          td { padding: 2px 0; vertical-align: top; }
          .total-row td { font-weight: bold; }
          .footer { margin-top: 12px; font-size: 11px; }
          @media print {
            body { margin: 0; }
            .receipt { box-shadow: none; }
            @page { size: 65mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="center bold" style="font-size:16px;">${storeName}</div>
          <div class="center small">${storeAddress}</div>
          <div class="center small">Telp: ${storePhone}</div>
          <div class="divider"></div>
          <div class="small">
            <div>ID Transaksi: ${receiptId}</div>
            <div>Tanggal: ${date}</div>
            <div>Kasir: ${cashier}</div>
          </div>
          <div class="divider"></div>
          <table>
            ${rows}
          </table>
          <div class="divider"></div>
          <table>
            <tr class="total-row">
              <td>Subtotal</td>
              <td class="right">${formatRupiah(subtotal)}</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td class="right">${formatRupiah(total)}</td>
            </tr>
            <tr>
              <td>Metode</td>
              <td class="right">${paymentMethod}</td>
            </tr>
            ${paymentMethod === 'Tunai' ? `<tr><td>Bayar</td><td class="right">${formatRupiah(cash)}</td></tr><tr><td>Kembali</td><td class="right">${formatRupiah(change)}</td></tr>` : ''}
          </table>
          <div class="divider"></div>
          <div class="center footer">
            Terima kasih sudah berbelanja!
          </div>
        </div>
      </body>
    </html>`
}

export function printReceipt(receiptData) {
  const html = formatReceiptHtml(receiptData)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.width = '1px'
  iframe.style.height = '1px'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'
  iframe.style.visibility = 'hidden'
  iframe.srcdoc = html
  document.body.appendChild(iframe)

  const printAndRemove = () => {
    const remove = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
    }
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.addEventListener('afterprint', remove, { once: true })
      iframe.contentWindow?.print()
    } catch {
      setTimeout(remove, 1000)
    }
  }

  iframe.addEventListener('load', printAndRemove, { once: true })
}

export function isQzLoaded() {
  return typeof window !== 'undefined' && !!window.qz
}

export async function ensureQzConnected() {
  if (!isQzLoaded()) {
    throw new Error('QZ Tray tidak terdeteksi. Pastikan qz-tray.js sudah dimuat.')
  }

  if (!window.qz.websocket.isActive()) {
    await window.qz.websocket.connect()
  }

  return window.qz
}

export async function findQzPrinters() {
  const qz = await ensureQzConnected()
  return qz.printers.find()
}

export async function getDefaultQzPrinter() {
  const qz = await ensureQzConnected()
  try {
    const defaultPrinter = await qz.printers.getDefault()
    if (defaultPrinter) return defaultPrinter
  } catch (_) {
    // fall through to find
  }
  const printers = await qz.printers.find()
  return Array.isArray(printers) && printers.length > 0 ? printers[0] : null
}

export async function printReceiptQZ(receiptData, printerName) {
  const qz = await ensureQzConnected()

  let printer = printerName
  if (!printer) {
    printer = await getDefaultQzPrinter()
  }
  if (!printer) throw new Error('Tidak ada printer yang tersedia.')

  const text = formatReceiptText(receiptData)
  const config = qz.configs.create(printer)
  const data = [
    {
      type: 'raw',
      format: 'plain',
      data: '\x1B\x40' + text + '\n\n\n' + '\x1D\x56\x00',
    },
  ]

  return qz.print(config, data)
}
