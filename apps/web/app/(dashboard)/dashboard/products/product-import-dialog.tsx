'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Download, FileUp, Trash2 } from 'lucide-react'
import { readSheet } from 'read-excel-file/browser'

import {
  Button,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Textarea,
  toastManager,
} from '@louez/ui'

import { apiErrorKey } from '@/lib/orpc/errors'
import { invalidateProductsList } from '@/lib/orpc/invalidation'
import { orpcClient } from '@/lib/orpc/client'
import {
  MAX_IMPORT_ROWS,
  markImportDuplicates,
  parseImportCsv,
  parseImportRows,
  parseImportText,
  updateImportRow,
  type ProductImportRow,
} from './util.product-import'

interface ProductImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string
  country: string
}

const EDITABLE_FIELDS: readonly ('name' | 'price' | 'deposit' | 'quantity')[] = [
  'name',
  'price',
  'deposit',
  'quantity',
]

export const ProductImportDialog = ({
  open,
  onOpenChange,
  currency,
  country,
}: ProductImportDialogProps) => {
  const t = useTranslations('dashboard.products.import')
  const tErrors = useTranslations('errors')
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [rows, setRows] = useState<ProductImportRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)

  const money = useMemo(
    () =>
      new Intl.NumberFormat(country.toUpperCase() === 'RU' ? 'ru-RU' : undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }),
    [country, currency],
  )

  const loadProductNames = async () => {
    const names: string[] = []
    let cursor: string | undefined
    do {
      const page = await orpcClient.dashboard.products.list({ limit: 200, cursor })
      names.push(...page.items.map((product) => product.name))
      cursor = page.nextCursor ?? undefined
    } while (cursor)
    return names
  }

  const importMutation = useMutation({
    mutationFn: async (candidateRows: ProductImportRow[]) => {
      const checkedRows = markImportDuplicates(candidateRows, await loadProductNames())
      setRows(checkedRows)
      const validRows = checkedRows.filter((row) => !row.error && !row.duplicate)
      const categoryIds = new Map<string, string>()

      for (const category of new Set(validRows.map((row) => row.category.trim()).filter(Boolean))) {
        const created = await orpcClient.dashboard.categories.create({ name: category })
        categoryIds.set(category.toLocaleLowerCase('ru'), created.id)
      }

      for (const row of validRows) {
        const categoryId = categoryIds.get(row.category.trim().toLocaleLowerCase('ru'))
        await orpcClient.dashboard.products.create({
          name: row.name.trim(),
          description: row.description.trim(),
          price: row.price,
          deposit: row.deposit,
          quantity: Number(row.quantity),
          categoryIds: categoryId ? [categoryId] : [],
        })
      }

      return {
        created: validRows.length,
        skipped: checkedRows.filter((row) => row.duplicate).length,
      }
    },
    onSuccess: async ({ created, skipped }) => {
      await invalidateProductsList(queryClient)
      toastManager.add({ title: t('success', { created, skipped }), type: 'success' })
      setText('')
      setRows([])
      setParseError(null)
      onOpenChange(false)
    },
    onError: async (error) => {
      await invalidateProductsList(queryClient)
      const key = apiErrorKey(error)
      toastManager.add({
        title: key && tErrors.has(key) ? tErrors(key) : tErrors('generic'),
        type: 'error',
      })
    },
  })

  const acceptRows = async (parsed: ProductImportRow[]) => {
    if (parsed.length > MAX_IMPORT_ROWS) {
      setRows([])
      setParseError(t('tooManyRows', { max: MAX_IMPORT_ROWS }))
      return
    }
    if (parsed.length === 0) {
      setRows([])
      setParseError(t('noRows'))
      return
    }

    setParseError(null)
    setRows(markImportDuplicates(parsed, await loadProductNames()))
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const extension = file.name.toLocaleLowerCase('ru').split('.').at(-1)
    if (extension !== 'csv' && extension !== 'xlsx') {
      setParseError('Загрузите файл в формате CSV или XLSX.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setParseError(t('fileTooLarge'))
      return
    }

    try {
      const parsed =
        extension === 'xlsx'
          ? parseImportRows(await readSheet(file))
          : parseImportCsv(await file.text())
      await acceptRows(parsed)
    } catch {
      setRows([])
      setParseError('Не удалось прочитать файл. Проверьте формат CSV или XLSX.')
    }
  }

  const downloadTemplate = () => {
    const csv = '\uFEFFназвание;цена_за_сутки;залог;количество;категория;описание\nПерфоратор Makita HR2470;750;3000;3;Электроинструмент;SDS-Plus, 800 Вт\nВиброплита 90 кг;2400;5000;1;Строительная техника;Бензиновая, 6,5 л.с.\nЛеса строительные 10 м;1800;4000;2;Леса и опалубка;Комплект на 10 метров'
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'import-tovarov.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const validCount = rows.filter((row) => !row.error && !row.duplicate).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[90vh] sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <DialogPanel className="space-y-5">
          <Tabs defaultValue="paste">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTab value="paste">{t('pasteTab')}</TabsTab>
              <TabsTab value="file">{t('fileTab')}</TabsTab>
            </TabsList>
            <TabsPanel value="paste" className="space-y-3 pt-4">
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={t('pastePlaceholder')}
                aria-label={t('pasteLabel')}
                className="min-h-40"
              />
              <Button
                variant="outline"
                onClick={() => void acceptRows(parseImportText(text))}
                disabled={!text.trim()}
              >
                {t('preview')}
              </Button>
            </TabsPanel>
            <TabsPanel value="file" className="space-y-4 pt-4">
              <div className="rounded-lg border border-dashed p-6 text-center">
                <FileUp className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <Input
                  nativeInput
                  type="file"
                  accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  aria-label="Выбрать файл CSV или Excel"
                  onChange={(event) => void handleFile(event.target.files?.[0])}
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  CSV или XLSX до 2 МБ. Для Excel импортируется первый лист.
                </p>
                <div className="mt-4 overflow-x-auto rounded-lg border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Колонка</th>
                        <th className="px-3 py-2 font-medium">Что писать</th>
                        <th className="px-3 py-2 font-medium">Пример</th>
                        <th className="px-3 py-2 font-medium">Обязательно</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[
                        ["название", "Название позиции", "Перфоратор Makita HR2470", "да"],
                        ["цена_за_сутки", "Число в рублях, без знака ₽", "750", "да"],
                        ["залог", "Число в рублях; можно оставить пустым", "3000", "нет"],
                        ["количество", "Сколько штук есть; по умолчанию 1", "3", "нет"],
                        ["категория", "Если такой категории нет, она создастся сама", "Электроинструмент", "нет"],
                        ["описание", "Короткий текст для карточки", "SDS-Plus, 800 Вт", "нет"],
                      ].map(([column, what, example, required]) => (
                        <tr key={column}>
                          <td className="px-3 py-2 font-mono text-xs">{column}</td>
                          <td className="px-3 py-2">{what}</td>
                          <td className="px-3 py-2 text-muted-foreground">{example}</td>
                          <td className="px-3 py-2">{required}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Первая строка файла это заголовки колонок. Разделитель «;» или «,». Нажмите «Скачать шаблон»: в нём уже есть три примера, замените их своими позициями.
                </p>
              </div>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                {t('downloadTemplate')}
              </Button>
            </TabsPanel>
          </Tabs>

          {parseError && <p className="text-sm text-destructive">{parseError}</p>}

          {rows.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">{t('previewTitle', { count: rows.length })}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('price')}</TableHead>
                    <TableHead>{t('deposit')}</TableHead>
                    <TableHead>{t('quantity')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="w-10"><span className="sr-only">{t('delete')}</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className={row.error ? 'bg-destructive/10' : undefined}>
                      {EDITABLE_FIELDS.map((field) => (
                        <TableCell key={field}>
                          <Input
                            nativeInput
                            value={row[field]}
                            aria-invalid={Boolean(row.error)}
                            aria-label={t(field)}
                            className={field === 'name' ? 'min-w-52' : 'min-w-28'}
                            onChange={(event) =>
                              setRows((current) =>
                                current.map((item) =>
                                  item.id === row.id
                                    ? updateImportRow(item, field, event.target.value)
                                    : item,
                                ),
                              )
                            }
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        {row.duplicate ? (
                          <span className="text-muted-foreground">{t('alreadyExists')}</span>
                        ) : row.error ? (
                          <span className="text-destructive">{t(`errors.${row.error}`)}</span>
                        ) : (
                          <span>{money.format(Number(row.price))}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t('delete')}
                          onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">{t('storeSettings', { currency, country })}</p>
            </div>
          )}
        </DialogPanel>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importMutation.isPending}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => importMutation.mutate(rows)}
            disabled={validCount === 0}
            isPending={importMutation.isPending}
          >
            {t('addProducts', { count: validCount })}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
