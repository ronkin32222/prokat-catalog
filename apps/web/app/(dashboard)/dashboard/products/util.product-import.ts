export const MAX_IMPORT_ROWS = 500

export type ImportRowError =
  | 'nameRequired'
  | 'nameTooShort'
  | 'priceRequired'
  | 'priceInvalid'
  | 'priceNegative'
  | 'depositInvalid'
  | 'depositNegative'
  | 'quantityInvalid'

export interface ProductImportRow {
  id: string
  name: string
  price: string
  deposit: string
  quantity: string
  category: string
  description: string
  error: ImportRowError | null
  duplicate: boolean
}

const IMPORT_COLUMNS = [
  ['название', 'name'],
  ['цена_за_сутки', 'price_per_day'],
  ['залог', 'deposit'],
  ['количество', 'quantity'],
  ['категория', 'category'],
  ['описание', 'description'],
] satisfies readonly (readonly string[])[]

const splitCsvLine = (line: string, delimiter: string): string[] => {
  const cells: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === delimiter && !quoted) {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += character
    }
  }

  cells.push(cell.trim())
  return cells
}

const delimiterFor = (line: string): string => {
  const delimiters = ['\t', ';', ',']
  return delimiters.reduce((best, delimiter) =>
    splitCsvLine(line, delimiter).length > splitCsvLine(line, best).length ? delimiter : best,
  )
}

const normalizeMoney = (value: string): string =>
  value.replace(/[\s\u00a0₽]/g, '').replace(',', '.')

export const validateImportRow = (
  row: Omit<ProductImportRow, 'error' | 'duplicate'>,
): ImportRowError | null => {
  if (!row.name.trim()) return 'nameRequired'
  if (row.name.trim().length < 2) return 'nameTooShort'

  const price = normalizeMoney(row.price)
  if (!price) return 'priceRequired'
  if (price.startsWith('-')) return 'priceNegative'
  if (!/^\d+(?:\.\d{1,2})?$/.test(price)) return 'priceInvalid'

  const deposit = normalizeMoney(row.deposit)
  if (deposit.startsWith('-')) return 'depositNegative'
  if (deposit && !/^\d+(?:\.\d{1,2})?$/.test(deposit)) return 'depositInvalid'

  if (!/^\d+$/.test(row.quantity)) return 'quantityInvalid'
  return null
}

const makeRow = (cells: string[], id: string): ProductImportRow => {
  const row = {
    id,
    name: cells[0]?.trim() ?? '',
    price: normalizeMoney(cells[1] ?? ''),
    deposit: normalizeMoney(cells[2] ?? ''),
    quantity: cells[3]?.trim() || '1',
    category: cells[4]?.trim() ?? '',
    description: cells[5]?.trim() ?? '',
  }

  return { ...row, error: validateImportRow(row), duplicate: false }
}

const normalizeCell = (cell: unknown): string =>
  cell === null || cell === undefined ? '' : String(cell).trim()

export const parseImportRows = (rows: readonly (readonly unknown[])[]): ProductImportRow[] => {
  const nonEmptyRows = rows.filter((row) => row.some((cell) => normalizeCell(cell)))
  if (nonEmptyRows.length === 0) return []

  const firstCells = (nonEmptyRows[0] ?? []).map((cell) =>
    normalizeCell(cell)
      .replace(/^\uFEFF/, '')
      .toLocaleLowerCase('ru'),
  )
  const hasHeader = firstCells.some((cell) =>
    IMPORT_COLUMNS.some((aliases) => aliases.includes(cell)),
  )
  const headers = hasHeader ? firstCells : IMPORT_COLUMNS.map(([russianHeader]) => russianHeader)
  const dataRows = hasHeader ? nonEmptyRows.slice(1) : nonEmptyRows

  return dataRows.map((values, index) => {
    const cells = IMPORT_COLUMNS.map((aliases) => {
      const columnIndex = headers.findIndex((header) => aliases.includes(header))
      return normalizeCell(values[columnIndex])
    })
    return makeRow(cells, `import-${index + 1}`)
  })
}

export const parseImportText = (text: string): ProductImportRow[] =>
  text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.trim().length > 0)
    .map(({ line, index }) => makeRow(splitCsvLine(line, delimiterFor(line)), `text-${index + 1}`))

export const parseImportCsv = (text: string): ProductImportRow[] => {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return []

  const delimiter = delimiterFor(lines[0] ?? '')
  return parseImportRows(lines.map((line) => splitCsvLine(line, delimiter)))
}

export const markImportDuplicates = (
  rows: ProductImportRow[],
  existingNames: Iterable<string>,
): ProductImportRow[] => {
  const names = new Set(Array.from(existingNames, (name) => name.trim().toLocaleLowerCase('ru')))
  return rows.map((row) => {
    const name = row.name.trim().toLocaleLowerCase('ru')
    const duplicate = Boolean(name) && names.has(name)
    if (name) names.add(name)
    return { ...row, duplicate }
  })
}

export const updateImportRow = (
  row: ProductImportRow,
  field: 'name' | 'price' | 'deposit' | 'quantity',
  value: string,
): ProductImportRow => {
  const next = { ...row, [field]: value, duplicate: field === 'name' ? false : row.duplicate }
  return { ...next, error: validateImportRow(next) }
}
