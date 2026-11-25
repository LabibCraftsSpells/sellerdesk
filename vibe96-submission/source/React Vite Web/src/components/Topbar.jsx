import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

export default function Topbar() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('sellerdesk_lang', nextLang);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 capitalize">
          {user?.role || 'Staff'} Mode
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleLanguage}
          title="Toggle Language"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1.5 rounded-lg transition"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          <span>{i18n.language === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>

        {location.pathname !== '/orders/new' && (
          <Link
            to="/orders/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('buttons.createOrder')}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
