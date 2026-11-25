import React from 'react';
import { useTranslation } from 'react-i18next';

export default function StatusBadge({ status }) {
  const { t } = useTranslation();

  const config = {
    new: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      label: t('status.new', 'New'),
    },
    confirmed: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500',
      label: t('status.confirmed', 'Confirmed'),
    },
    shipped: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: t('status.shipped', 'Shipped'),
    },
    delivered: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: t('status.delivered', 'Delivered'),
    },
    returned: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      label: t('status.returned', 'Returned'),
    },
    cancelled: {
      bg: 'bg-gray-100 text-gray-700 border-gray-200',
      dot: 'bg-gray-400',
      label: t('status.cancelled', 'Cancelled'),
    },
  };

  const current = config[status?.toLowerCase()] || {
    bg: 'bg-gray-50 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
    label: status || 'Unknown',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}
