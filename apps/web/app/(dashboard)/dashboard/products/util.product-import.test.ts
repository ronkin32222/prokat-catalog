import assert from 'node:assert/strict'
import test from 'node:test'

import {
  markImportDuplicates,
  parseImportCsv,
  parseImportRows,
  parseImportText,
} from './util.product-import'

test('parseImportText reads Russian rows and all supported separators', () => {
  const rows = parseImportText(
    'Перфоратор Makita, 1500, 5000\nДрель Bosch;2 000 ₽;3000\nЛестница\t750\t',
  )

  assert.deepEqual(
    rows.map(({ name, price, deposit, quantity, error }) => ({
      name,
      price,
      deposit,
      quantity,
      error,
    })),
    [
      { name: 'Перфоратор Makita', price: '1500', deposit: '5000', quantity: '1', error: null },
      { name: 'Дрель Bosch', price: '2000', deposit: '3000', quantity: '1', error: null },
      { name: 'Лестница', price: '750', deposit: '', quantity: '1', error: null },
    ],
  )
})

test('parseImportText skips empty lines and keeps garbage editable with an error', () => {
  const rows = parseImportText('\nМусор\nТовар, абракадабра\n')

  assert.equal(rows.length, 2)
  assert.equal(rows[0]?.error, 'priceRequired')
  assert.equal(rows[1]?.error, 'priceInvalid')
})

test('parseImportCsv handles BOM, semicolons, commas and quoted descriptions', () => {
  const semicolon = parseImportCsv(
    '\uFEFFназвание;цена_за_сутки;залог;количество;категория;описание\nКамера;2500;;2;Фото;"Камера, штатив"',
  )
  const comma = parseImportCsv('название,цена_за_сутки,залог,количество\nСвет,1200,3000,4')

  assert.equal(semicolon[0]?.description, 'Камера, штатив')
  assert.equal(semicolon[0]?.quantity, '2')
  assert.equal(comma[0]?.name, 'Свет')
  assert.equal(comma[0]?.error, null)
})

test('parseImportRows maps case-insensitive Russian and English headers', () => {
  const russian = parseImportRows([
    ['КОЛИЧЕСТВО', 'Название', 'Цена_за_сутки', 'Категория'],
    [3, 'Палатка', 900, 'Туризм'],
  ])
  const english = parseImportRows([
    ['DESCRIPTION', 'Deposit', 'Name', 'PRICE_PER_DAY', 'Quantity'],
    ['С чехлом', 500, 'Стул', 250, 4],
  ])

  assert.deepEqual(
    russian.map(({ name, price, quantity, category, error }) => ({
      name,
      price,
      quantity,
      category,
      error,
    })),
    [{ name: 'Палатка', price: '900', quantity: '3', category: 'Туризм', error: null }],
  )
  assert.deepEqual(
    english.map(({ name, price, deposit, quantity, description, error }) => ({
      name,
      price,
      deposit,
      quantity,
      description,
      error,
    })),
    [
      {
        name: 'Стул',
        price: '250',
        deposit: '500',
        quantity: '4',
        description: 'С чехлом',
        error: null,
      },
    ],
  )
})

test('markImportDuplicates catches catalog and same-file names case-insensitively', () => {
  const rows = parseImportText('Дрель, 100\nЛестница, 200\nлестница, 300')
  assert.deepEqual(
    markImportDuplicates(rows, ['дрель']).map((row) => row.duplicate),
    [true, false, true],
  )
})
