import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Receipt,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrencyFromUSD } from '@/lib/currency'
import { formatNumber } from '@/lib/format'

import { getUserBillingHistory } from '../api'
import { useTopupHistory } from '../hooks'
import {
  buildCsv,
  downloadCsv,
  formatTimestamp,
  getPaymentMethodName,
  getStatusConfig,
} from '../lib'
import type { TopupRecord } from '../types'

interface TopupHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Upper bound on the rows pulled for one export. */
const EXPORT_PAGE_SIZE = 100
const EXPORT_RECORD_LIMIT = 5000

export function TopupHistoryDialog(props: TopupHistoryDialogProps) {
  const { t } = useTranslation()
  const { records, total, page, pageSize, loading, setPage } = useTopupHistory()
  const [exporting, setExporting] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const handleExport = async () => {
    setExporting(true)
    try {
      const rows: TopupRecord[] = []
      let exportPage = 1

      // The dialog holds one page; walk the rest so the file covers the same
      // range the table does.
      while (rows.length < EXPORT_RECORD_LIMIT) {
        const response = await getUserBillingHistory(
          exportPage,
          EXPORT_PAGE_SIZE
        )
        const items = response.data?.items ?? []
        if (items.length === 0) break

        rows.push(...items)
        const exportTotal = response.data?.total ?? rows.length
        if (rows.length >= exportTotal) break
        exportPage++
      }

      const csv = buildCsv(
        [
          t('Time'),
          t('Order number'),
          t('Payment Method'),
          t('Amount'),
          t('Payment'),
          t('Status'),
        ],
        rows.map((record) => [
          formatTimestamp(record.create_time),
          record.trade_no,
          getPaymentMethodName(record.payment_method, t),
          formatCurrencyFromUSD(record.amount, {
            digitsLarge: 2,
            digitsSmall: 2,
            abbreviate: false,
          }),
          String(formatNumber(record.money)),
          t(getStatusConfig(record.status).label),
        ])
      )

      downloadCsv(`topup-history-${Date.now()}.csv`, csv)
    } finally {
      setExporting(false)
    }
  }

  let body: ReactNode
  if (loading) {
    body = (
      <div className='space-y-2'>
        {['first', 'second', 'third', 'fourth'].map((key) => (
          <Skeleton key={key} className='h-10 w-full' />
        ))}
      </div>
    )
  } else if (records.length === 0) {
    body = (
      <div className='text-muted-foreground flex min-h-40 flex-col items-center justify-center gap-1 py-8 text-center'>
        <Receipt className='size-6' aria-hidden='true' />
        <p className='text-sm font-medium'>{t('No billing records found')}</p>
        <p className='text-xs'>
          {t('Your transaction history will appear here')}
        </p>
      </div>
    )
  } else {
    body = (
      <>
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Time')}</TableHead>
                <TableHead>{t('Order number')}</TableHead>
                <TableHead>{t('Payment Method')}</TableHead>
                <TableHead className='text-right'>{t('Amount')}</TableHead>
                <TableHead className='text-right'>{t('Payment')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const statusConfig = getStatusConfig(record.status)

                return (
                  <TableRow key={record.id}>
                    <TableCell className='text-muted-foreground whitespace-nowrap'>
                      {formatTimestamp(record.create_time)}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {record.trade_no}
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodName(record.payment_method, t)}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {formatCurrencyFromUSD(record.amount, {
                        digitsLarge: 2,
                        digitsSmall: 2,
                        abbreviate: false,
                      })}
                    </TableCell>
                    <TableCell className='text-right tabular-nums'>
                      {formatNumber(record.money)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={t(statusConfig.label)}
                        variant={statusConfig.variant}
                        copyable={false}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className='flex items-center justify-between gap-3'>
          <span className='text-muted-foreground text-xs sm:text-sm'>
            {t('Showing')} {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, total)} {t('of')} {total}
          </span>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='h-8 w-8 p-0'
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <span className='text-muted-foreground text-sm tabular-nums'>
              {page} / {totalPages}
            </span>
            <Button
              variant='outline'
              size='sm'
              className='h-8 w-8 p-0'
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('Topup history')}
      description={t('View your topup transaction records and payment history')}
      contentClassName='flex max-h-(--dialog-available-height) flex-col sm:max-w-3xl'
      contentHeight='auto'
      bodyClassName='space-y-3'
      footerClassName='sm:justify-between'
      footer={
        <>
          <Button
            variant='outline'
            disabled={loading || exporting || records.length === 0}
            onClick={() => void handleExport()}
          >
            {exporting ? (
              <Loader2 data-icon='inline-start' className='animate-spin' />
            ) : (
              <Download data-icon='inline-start' />
            )}
            {t('Export Excel')}
          </Button>
          <Button variant='outline' onClick={() => props.onOpenChange(false)}>
            {t('Close')}
          </Button>
        </>
      }
    >
      {body}
    </Dialog>
  )
}
