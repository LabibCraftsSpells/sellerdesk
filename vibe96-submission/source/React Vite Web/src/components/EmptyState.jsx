import React from 'react';
import { PackageOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EmptyState({
  title,
  description,
  actionText,
  onAction,
  icon: Icon = PackageOpen,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm my-4">
      <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        {title || t('common.noData')}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
