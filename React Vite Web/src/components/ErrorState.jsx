import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-xl border border-red-100 my-4">
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-red-900 mb-1">
        {t('messages.error')}
      </h3>
      <p className="text-sm text-red-600 max-w-sm mb-4">
        {message || t('messages.serverError')}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-xs font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('messages.tryAgain')}
        </button>
      )}
    </div>
  );
}
