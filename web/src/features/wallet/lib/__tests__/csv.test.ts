import { describe, expect, it } from 'vitest'

import { buildCsv } from '../csv'

describe('csv export', () => {
  it('writes headers and rows with CRLF line endings', () => {
    expect(buildCsv(['Time', 'Amount'], [['2026-01-02 03:04', '10']])).toBe(
      'Time,Amount\r\n2026-01-02 03:04,10\r\n'
    )
  })

  it('quotes separators and keeps embedded newlines from breaking rows', () => {
    expect(buildCsv(['Note'], [['a,b'], ['line1\nline2'], ['say "hi"']])).toBe(
      'Note\r\n"a,b"\r\nline1 line2\r\n"say ""hi"""\r\n'
    )
  })
})
