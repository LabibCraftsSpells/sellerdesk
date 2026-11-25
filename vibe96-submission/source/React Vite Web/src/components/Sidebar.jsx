import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Banknote,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  KeyRound,
  Globe,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('sellerdesk_lang', nextLang);
  };

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.orders'), href: '/orders', icon: ShoppingCart },
    { name: t('nav.products'), href: '/products', icon: Package },
    { name: t('nav.customers'), href: '/customers', icon: Users },
    { name: t('nav.cod'), href: '/cod', icon: Banknote },
    ...(user?.role === 'admin'
      ? [
          { name: t('nav.reports'), href: '/reports', icon: BarChart3 },
          { name: t('nav.settings'), href: '/settings', icon: SettingsIcon },
        ]
      : []),
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            ৳
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight text-sm truncate max-w-[130px]">
              {settings?.businessName || 'SellerDesk'}
            </h1>
            <p className="text-[10px] text-gray-400 font-medium">COD & Orders</p>
          </div>
        </div>

        {/* Language Quick Toggle */}
        <button
          onClick={toggleLanguage}
          title="Toggle Language (English / বাংলা)"
          className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2 py-1 rounded-md transition"
        >
          <Globe className="w-3 h-3 text-indigo-500" />
          <span>{i18n.language === 'bn' ? 'EN' : 'বাং'}</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User & Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between px-2 py-2 mb-1">
          <div className="truncate">
            <p className="text-xs font-semibold text-gray-800 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] text-gray-400 capitalize">
              {user?.role || 'Staff'}
            </p>
          </div>
          <NavLink
            to="/profile/change-password"
            title={t('nav.profile')}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md transition"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
