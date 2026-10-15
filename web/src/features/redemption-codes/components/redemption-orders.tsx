import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { api } from '@/lib/api'
import { formatQuota, formatTimestampToDate } from '@/lib/format'

type Order = {
  id: number
  provider_order_id: string
  email: string
  product_name: string
  quota: number
  status: number
  delivery_attempts: number
  last_error: string
  created_time: number
  delivered_time: number
}

export function RedemptionOrders() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['redemption-orders'],
    queryFn: async () => {
      const response = await api.get<{
        data: { items: Order[]; total: number }
      }>('/api/redemption/orders?p=1&page_size=20')
      return response.data.data
    },
    staleTime: 30_000,
  })
  const orders = query.data?.items ?? []
  const statusLabel = (status: number) => {
    if (status === 1) return t('Delivered')
    if (status === 2) return t('Delivery failed')
    return t('Pending')
  }

  return (
    <div className='rounded-lg border'>
      <div className='border-b px-4 py-3 font-medium'>{t('Redemption Orders')}</div>
      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/40 text-left'>
            <tr>
              {[t('Order ID'), t('Email'), t('Product'), t('Quota'), t('Status'), t('Created')].map((header) => (
                <th key={header} className='px-4 py-2 font-medium'>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className='border-t'>
                <td className='px-4 py-2 font-mono'>{order.provider_order_id}</td>
                <td className='px-4 py-2'>{order.email}</td>
                <td className='px-4 py-2'>{order.product_name || '-'}</td>
                <td className='px-4 py-2'>{formatQuota(order.quota)}</td>
                <td className='px-4 py-2'>
                  {statusLabel(order.status)}
                </td>
                <td className='px-4 py-2'>{formatTimestampToDate(order.created_time)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className='px-4 py-6 text-center text-muted-foreground'>{t('No data')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
