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

export function exportToPdf(title, headers, rows) {
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${headers
          .map((header) => `<td>${String(row[header] ?? '')}</td>`)
          .join('')}</tr>`
    )
    .join('')

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111 }
          h1 { font-size: 24px; margin-bottom: 16px }
          table { width: 100%; border-collapse: collapse; margin-top: 12px }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left }
          th { background: #f7f7f7 }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}
