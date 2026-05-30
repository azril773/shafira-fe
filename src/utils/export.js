export function exportToExcel(filename, headers, rows) {
  const escaped = (value) => `"${String(value ?? '').replace(/\"/g, '""')}"`
  const csv = [headers.map(escaped).join(','), ...rows.map((row) => headers.map((header) => escaped(row[header])).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function formatPdfCell(header, value) {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'number') return String(value)
  const isMoney =
    /Total|Harga|Subtotal|Nilai|Pendapatan|HPP|Margin|Diterima|Penjualan/i.test(header) &&
    !/qty/i.test(header) &&
    !/%/.test(header)
  if (isMoney) return 'Rp ' + value.toLocaleString('id-ID')
  if (/qty|stok|jumlah/i.test(header)) return value.toLocaleString('id-ID')
  return String(value)
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]))
}

export function exportToPdf(title, headers, rows) {
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${headers
          .map((header) => {
            const v = row[header]
            const cls = typeof v === 'number' ? ' class="r"' : ''
            return `<td${cls}>${escapeHtml(formatPdfCell(header, v))}</td>`
          })
          .join('')}</tr>`
    )
    .join('')

  const printedAt = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

  const html = `
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111 }
          h1 { font-size: 22px; margin: 0 0 4px }
          .meta { color: #555; font-size: 12px; margin-bottom: 16px }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left }
          th { background: #f7f7f7 }
          td.r, th.r { text-align: right }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">Dicetak: ${escapeHtml(printedAt)}</div>
        <table>
          <thead>
            <tr>${headers
              .map((header) => `<th>${escapeHtml(header)}</th>`)
              .join('')}</tr>
          </thead>
          <tbody>${tableRows || `<tr><td colspan="${headers.length}" style="text-align:center;color:#999">Tidak ada data</td></tr>`}</tbody>
        </table>
        <script>window.onload = () => { setTimeout(() => { window.focus(); window.print(); }, 200); };</script>
      </body>
    </html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
