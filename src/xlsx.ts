// ══════════════════════════════════════════════════════════════
// Générateur .xlsx minimal, sans dépendance lourde (fflate ~10 Ko).
// Produit un vrai classeur Excel MULTI-FEUILLES (chaînes en inlineStr,
// nombres en <v>) que Excel/LibreOffice/Google Sheets ouvrent nativement.
// Une feuille = { name, rows } où rows est un tableau de lignes (aoa).
// ══════════════════════════════════════════════════════════════
import { zipSync, strToU8 } from 'fflate'

type Cell = string | number | null | undefined
export type XlsxSheet = { name: string; rows: Cell[][] }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const colName = (n: number): string => { let s = ''; let x = n + 1; while (x > 0) { const m = (x - 1) % 26; s = String.fromCharCode(65 + m) + s; x = Math.floor((x - 1) / 26) } return s }
// Nom de feuille valide Excel : ≤ 31 car., sans : \ / ? * [ ]
const safeName = (n: string) => (n || 'Feuille').replace(/[:\\/?*\[\]]/g, ' ').slice(0, 31)

function sheetXml(rows: Cell[][]): string {
  const body = rows.map((row, r) => {
    const cells = (row || []).map((v, c) => {
      if (v == null || v === '') return ''
      const ref = colName(c) + (r + 1)
      if (typeof v === 'number' && isFinite(v)) return `<c r="${ref}"><v>${v}</v></c>`
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`
    }).join('')
    return `<row r="${r + 1}">${cells}</row>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`
}

export function buildXlsx(sheets: XlsxSheet[]): Uint8Array {
  const files: Record<string, Uint8Array> = {}
  sheets.forEach((s, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(sheetXml(s.rows)) })
  const sheetTags = sheets.map((s, i) => `<sheet name="${esc(safeName(s.name))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')
  files['xl/workbook.xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetTags}</sheets></workbook>`)
  const wbRels = sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
  files['xl/_rels/workbook.xml.rels'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${wbRels}</Relationships>`)
  files['_rels/.rels'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`)
  const overrides = sheets.map((_s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
  files['[Content_Types].xml'] = strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${overrides}</Types>`)
  return zipSync(files)
}
