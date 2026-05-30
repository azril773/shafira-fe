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
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 16mm; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: sans-serif; padding: 24px; color: #000; font-size: 13px; }
          h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
          .meta { font-size: 11px; color: #333; margin-bottom: 8px; }
          hr { border: 0; border-top: 1px dashed #000; margin: 10px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          thead tr { border-bottom: 2px solid #000; }
          th { font-weight: bold; padding: 6px 8px; text-align: left; border-bottom: 2px solid #000; color: #000; }
          td { padding: 5px 8px; border-bottom: 1px solid #000; vertical-align: top; color: #000; }
          tbody tr:last-child td { border-bottom: 2px solid #000; }
          td.r, th.r { text-align: right; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">Dicetak: ${escapeHtml(printedAt)}</div>
        <hr />
        <table>
          <thead>
            <tr>${headers
              .map((h) => {
                const cls = typeof (rows[0]?.[h]) === 'number' ? ' class="r"' : ''
                return `<th${cls}>${escapeHtml(h)}</th>`
              })
              .join('')}</tr>
          </thead>
          <tbody>${tableRows || `<tr><td colspan="${headers.length}" style="text-align:center;color:#666;padding:12px">Tidak ada data</td></tr>`}</tbody>
        </table>
        <script>window.onload = () => { setTimeout(() => { window.focus(); window.print(); }, 200); };</script>
      </body>
    </html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
