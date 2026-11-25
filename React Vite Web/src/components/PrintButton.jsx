import React from 'react';
import { Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PrintButton({
  label,
  className = '',
  onClick,
}) {
  const { t } = useTranslation();

  const handlePrint = () => {
    if (onClick) {
      onClick();
    } else {
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition ${className}`}
    >
      <Printer className="w-4 h-4 text-gray-500" />
      <span>{label || t('buttons.print')}</span>
    </button>
  );
}
