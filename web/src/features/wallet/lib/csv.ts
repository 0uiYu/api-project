// ============================================================================
// CSV Export
// ============================================================================

/**
 * Build a CSV document. Cells keep Excel's line endings, quote any cell that
 * contains a separator, and collapse embedded newlines so a value can never
 * break the row structure.
 */
export function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','))
  return `${lines.join('\r\n')}\r\n`
}

function escapeCell(value: string): string {
  const normalized = value.replaceAll(/[\r\n]+/g, ' ').trim()
  if (!/[",;]/.test(normalized)) return normalized
  return `"${normalized.replaceAll('"', '""')}"`
}

/**
 * Download a CSV that Excel opens as a spreadsheet. The UTF-8 BOM keeps
 * non-ASCII text readable instead of turning it into mojibake.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
