import { formatNumberId, formatRupiah } from './format'

export function formatDateTime(date = new Date()) {
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 32-character width is standard for 58mm thermal printers.
const LINE_WIDTH = 32

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

// Garis pemisah patah-patah kecil ala struk thermal: "- - - - - - ..."
function dashedLine(width = LINE_WIDTH) {
  return '- '.repeat(Math.floor(width / 2)).trimEnd()
}

// Render satu baris dengan label di kiri & nilai di kanan, dipisah spasi.
function lineLR(left, right, width = LINE_WIDTH) {
  const l = String(left)
  const r = String(right)
  if (l.length + r.length + 1 >= width) {
    return l + '\n' + padLeft(r, width)
  }
  return l + ' '.repeat(width - l.length - r.length) + r
}

// Format qty + uom yang konsisten (thousand-separator + kode satuan).
function formatQtyUom(qty, uomCode) {
  const q = formatNumberId(Number(qty) || 0, { maximumFractionDigits: 3 })
  return uomCode ? `${q} ${uomCode}` : q
}

export function formatReceiptText({
  storeName = 'ShafiraMart',
  storeAddress = '',
  storePhone = '',
  receiptId = '',
  date = formatDateTime(),
  cashier = 'Kasir',
  items = [],
  subtotal = 0,
  total = 0,
  paymentMethod = 'Tunai',
  payments = null,
  cash = 0,
  change = 0,
}) {
  const lines = []

  // ===== HEADER =====
  lines.push(centerText(storeName))
  if (storeAddress) lines.push(centerText(storeAddress))
  if (storePhone) lines.push(centerText(`Telp: ${storePhone}`))
  lines.push(dashedLine())

  // ===== SUBHEADER =====
  lines.push(lineLR('No', receiptId))
  lines.push(lineLR('Tgl', date))
  lines.push(lineLR('Kasir', cashier))
  lines.push(dashedLine())

  // ===== CONTENT (ITEM) =====
  items.forEach((item) => {
    const name = String(item.name)
    // Baris 1: nama produk (boleh wrap manual jika terlalu panjang)
    if (name.length <= LINE_WIDTH) {
      lines.push(name)
    } else {
      // Wrap sederhana per LINE_WIDTH karakter
      for (let i = 0; i < name.length; i += LINE_WIDTH) {
        lines.push(name.slice(i, i + LINE_WIDTH))
      }
    }
    // Baris 2: qty + uom x harga ............. subtotal
    const qtyUom = formatQtyUom(item.qty, item.uomCode)
    const leftPart = `  ${qtyUom} x ${formatRupiah(item.price)}`
    const lineSubtotal = formatRupiah((Number(item.qty) || 0) * (Number(item.price) || 0))
    lines.push(lineLR(leftPart, lineSubtotal))
  })
  lines.push(dashedLine())

  // ===== TOTAL =====
  lines.push(lineLR('Subtotal', formatRupiah(subtotal)))
  lines.push(lineLR('Total', formatRupiah(total)))
  if (Array.isArray(payments) && payments.length > 1) {
    lines.push(lineLR('Metode', 'Split Payment'))
    payments.forEach((p) => {
      lines.push(lineLR(`  ${p.method}`, formatRupiah(p.amount)))
    })
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const splitChange = totalPaid - (Number(total) || 0)
    lines.push(lineLR('Uang Diterima', formatRupiah(totalPaid)))
    lines.push(lineLR('Kembali', formatRupiah(splitChange > 0 ? splitChange : 0)))
  } else {
    lines.push(lineLR('Metode', paymentMethod))
    if (paymentMethod === 'Tunai') {
      lines.push(lineLR('Bayar', formatRupiah(cash)))
      lines.push(lineLR('Kembali', formatRupiah(change)))
    }
  }
  lines.push(dashedLine())

  // ===== FOOTER =====
  lines.push(centerText('Terima kasih sudah berbelanja!'))
  lines.push(centerText('Simpan struk sebagai bukti'))
  lines.push('')
  lines.push('')

  return lines.join('\n')
}

export function formatReceiptHtml({
  storeName = 'ShafiraMart',
  storeAddress = '',
  storePhone = '',
  receiptId,
  date,
  cashier = 'Kasir',
  items = [],
  subtotal = 0,
  total = 0,
  paymentMethod = 'Tunai',
  payments = null,
  cash = 0,
  change = 0,
}) {
  const rows = items
    .map((item) => {
      const description = String(item.name).replace(/</g, '&lt;')
      const qtyUom = formatQtyUom(item.qty, item.uomCode)
      const price = formatRupiah(item.price)
      const lineSub = formatRupiah((Number(item.qty) || 0) * (Number(item.price) || 0))
      return `
        <tr>
          <td colspan="2" class="item-name">${description}</td>
        </tr>
        <tr>
          <td class="qty">${qtyUom} x ${price}</td>
          <td class="right">${lineSub}</td>
        </tr>`
    })
    .join('')

  return `
    <html>
      <head>
        <title>Struk ${receiptId}</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 0; }
          .receipt { width: 80mm; padding: 8px; font-size: 14px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 13px; }
          .right { text-align: right; }
          .divider {
            border: 0;
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .header-name { font-size: 17px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 1px 0; vertical-align: top; }
          .item-name { padding-top: 4px; font-weight: 600; }
          .qty { padding-left: 6px; color: #222; }
          .totals td { padding: 2px 0; }
          .totals .label { color: #333; }
          .totals .grand { font-weight: bold; font-size: 15px; }
          .footer { font-size: 11px; line-height: 1.4; }
          @media print {
            body { margin: 0; }
            .receipt { box-shadow: none; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <!-- HEADER -->
          <div class="center header-name">${storeName}</div>
          ${storeAddress ? `<div class="center small">${storeAddress}</div>` : ''}
          ${storePhone ? `<div class="center small">Telp: ${storePhone}</div>` : ''}

          <hr class="divider" />

          <!-- SUBHEADER -->
          <table class="small">
            <tr><td>No</td><td class="right">${receiptId}</td></tr>
            <tr><td>Tgl</td><td class="right">${date}</td></tr>
            <tr><td>Kasir</td><td class="right">${cashier}</td></tr>
          </table>

          <hr class="divider" />

          <!-- CONTENT -->
          <table>
            ${rows}

          </table>

          <hr class="divider" />
          <!-- TOTAL -->
          <table class="totals">
            <tr><td class="label">Subtotal</td><td class="right">${formatRupiah(subtotal)}</td></tr>
            <tr class="grand"><td class="label">Total</td><td class="right">${formatRupiah(total)}</td></tr>
            <tr><td class="label">Metode</td><td class="right">${Array.isArray(payments) && payments.length > 1 ? 'Split Payment' : paymentMethod}</td></tr>
            ${
              Array.isArray(payments) && payments.length > 1
                ? (() => {
                    const methodRows = payments
                      .map((p) => `<tr><td class="label" style="padding-left:8px">${p.method}</td><td class="right">${formatRupiah(p.amount)}</td></tr>`)
                      .join('')
                    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                    const splitChange = totalPaid - (Number(total) || 0)
                    return methodRows +
                      `<tr><td class="label">Uang Diterima</td><td class="right">${formatRupiah(totalPaid)}</td></tr>` +
                      `<tr><td class="label">Kembali</td><td class="right">${formatRupiah(splitChange > 0 ? splitChange : 0)}</td></tr>`
                  })()
                : paymentMethod === 'Tunai'
                  ? `<tr><td class="label">Bayar</td><td class="right">${formatRupiah(cash)}</td></tr><tr><td class="label">Kembali</td><td class="right">${formatRupiah(change)}</td></tr>`
                  : ''
            }
          </table>

          <hr class="divider" />

          <!-- FOOTER -->
          <div class="center footer">
            Terima kasih sudah berbelanja!<br/>
            Simpan struk sebagai bukti
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

// ====== X REPORT (compact thermal print) ======

export function formatXReportText({
  storeName = 'ShafiraMart',
  storeAddress = '',
  storePhone = '',
  cashier = 'Kasir',
  periodFrom = '',
  periodTo = '',
  printedAt = formatDateTime(),
  totalTransactions = 0,
  totalQty = 0,
  totalSales = 0,
  totalReceived = 0,
  totalChange = 0,
  byPaymentMethod = [],
} = {}) {
  const lines = []
  lines.push(centerText(storeName))
  if (storeAddress) lines.push(centerText(storeAddress))
  if (storePhone) lines.push(centerText(`Telp: ${storePhone}`))
  lines.push(dashedLine())
  lines.push(centerText('LAPORAN X (RINGKASAN)'))
  lines.push(dashedLine())
  lines.push(lineLR('Kasir', cashier))
  lines.push(lineLR('Periode', `${periodFrom || '—'} s/d ${periodTo || '—'}`))
  lines.push(lineLR('Dicetak', printedAt))
  lines.push(dashedLine())
  lines.push(lineLR('Total Transaksi', formatNumberId(Number(totalTransactions) || 0)))
  lines.push(lineLR('Total Qty', formatNumberId(Number(totalQty) || 0)))
  lines.push(dashedLine())
  lines.push(lineLR('TOTAL PENJUALAN', formatRupiah(Number(totalSales) || 0)))
  lines.push(lineLR('Total Diterima', formatRupiah(Number(totalReceived) || 0)))
  lines.push(lineLR('Total Kembalian', formatRupiah(Number(totalChange) || 0)))
  if (Array.isArray(byPaymentMethod) && byPaymentMethod.length > 0) {
    lines.push(dashedLine())
    lines.push('Per Metode Pembayaran:')
    for (const m of byPaymentMethod) {
      lines.push(lineLR(`  ${m.method}`, formatRupiah(Number(m.amount) || 0)))
    }
  }
  lines.push(dashedLine())
  lines.push(centerText('-- bukan bukti pembayaran --'))
  return lines.join('\n')
}

export async function printXReportQZ(reportData, printerName) {
  const qz = await ensureQzConnected()
  let printer = printerName
  if (!printer) printer = await getDefaultQzPrinter()
  if (!printer) throw new Error('Tidak ada printer yang tersedia.')

  const text = formatXReportText(reportData)
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

// Fallback: render the X Report as a narrow (58mm) printable HTML via hidden iframe.
export function printXReport(reportData) {
  const text = formatXReportText(reportData)
  const html = `<!doctype html><html><head><title>X Report</title>
    <style>
      @page { size: 58mm auto; margin: 2mm; }
      body { font-family: 'Courier New', monospace; font-size: 11px; white-space: pre; margin: 0; padding: 4px; }
    </style></head><body>${text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</body></html>`
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.width = '1px'
  iframe.style.height = '1px'
  iframe.style.opacity = '0'
  iframe.srcdoc = html
  document.body.appendChild(iframe)
  iframe.addEventListener(
    'load',
    () => {
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
    },
    { once: true },
  )
}
