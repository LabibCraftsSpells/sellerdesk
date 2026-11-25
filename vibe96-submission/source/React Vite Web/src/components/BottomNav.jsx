import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Banknote,
  Menu,
  X,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  KeyRound,
  LogOut,
  Globe,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function BottomNav() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const handleLogout = () => {
    setShowMore(false);
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('sellerdesk_lang', nextLang);
  };

  const mainTabs = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.orders'), href: '/orders', icon: ShoppingCart },
    { name: t('nav.products'), href: '/products', icon: Package },
    { name: t('nav.cod'), href: '/cod', icon: Banknote },
  ];

  return (
    <>
      {/* Slide-over menu for "More" */}
      {showMore && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs md:hidden">
          <div
            className="fixed inset-0"
            onClick={() => setShowMore(false)}
          />
          <div className="relative bg-white rounded-t-2xl p-5 shadow-2xl border-t border-gray-200 z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <span className="text-sm font-semibold text-gray-900">
                {t('nav.more')}
              </span>
              <button
                onClick={() => setShowMore(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <NavLink
                to="/customers"
                onClick={() => setShowMore(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-medium text-gray-700 transition"
              >
                <Users className="w-4 h-4 text-indigo-500" />
                <span>{t('nav.customers')}</span>
              </NavLink>

              {user?.role === 'admin' && (
                <>
                  <NavLink
                    to="/reports"
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-medium text-gray-700 transition"
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <span>{t('nav.reports')}</span>
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-medium text-gray-700 transition"
                  >
                    <SettingsIcon className="w-4 h-4 text-amber-500" />
                    <span>{t('nav.settings')}</span>
                  </NavLink>
                </>
              )}

              <NavLink
                to="/profile/change-password"
                onClick={() => setShowMore(false)}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-medium text-gray-700 transition"
              >
                <KeyRound className="w-4 h-4 text-blue-500" />
                <span>{t('nav.profile')}</span>
              </NavLink>

              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 text-xs font-medium text-gray-700 transition text-left"
              >
                <Globe className="w-4 h-4 text-purple-500" />
                <span>{i18n.language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন'}</span>
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3 text-xs font-medium text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav aria-label="Mobile Navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.href}
                to={tab.href}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition ${
                    isActive
                      ? 'text-indigo-600 font-semibold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="truncate max-w-[64px]">{tab.name}</span>
              </NavLink>
            );
          })}

          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium text-gray-500 hover:text-gray-900 transition"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>{t('nav.more')}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
