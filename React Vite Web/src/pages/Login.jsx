import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { LogIn, Lock, Mail, Globe, Sparkles } from 'lucide-react';
import { loginApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: 'admin@demo.com',
      password: 'Admin@123',
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await loginApi(values);
      const { token, user } = res.data;
      login(token, user);
      toast.success(t('auth.welcomeBack') + `, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || t('messages.error');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    if (role === 'admin') {
      setValue('email', 'admin@demo.com');
      setValue('password', 'Admin@123');
    } else {
      setValue('email', 'staff@demo.com');
      setValue('password', 'Staff@123');
    }
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(next);
    localStorage.setItem('sellerdesk_lang', next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      {/* Top right language switch */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-xs hover:bg-gray-50 transition"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-600" />
          <span>{i18n.language === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-2xl shadow-lg shadow-indigo-200 mb-3">
          ৳
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          SellerDesk
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          {t('auth.loginSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-10 shadow-xl shadow-gray-100 rounded-2xl border border-gray-100">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  {...register('email', { required: t('messages.requiredField') })}
                  className="block w-full pl-9 pr-3 py-2.5 sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="admin@demo.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  {...register('password', { required: t('messages.requiredField') })}
                  className="block w-full pl-9 pr-3 py-2.5 sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition active:scale-[0.99] mt-6"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? t('auth.loggingIn') : t('auth.login')}</span>
            </button>
          </form>

          {/* 1-Click Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Quick Demo Fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="py-1.5 px-2.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-100 transition text-center"
              >
                Admin (Full Access)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('staff')}
                className="py-1.5 px-2.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-100 transition text-center"
              >
                Staff (Orders & Stock)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
