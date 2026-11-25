import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { KeyRound, Lock, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { changePasswordApi } from '../../api/auth';

export default function ChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const newPassword = watch('new_password');

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await changePasswordApi({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      toast.success(t('messages.passwordChanged'));
      reset();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {t('pages.changePassword')}
          </h1>
          <p className="text-xs text-gray-500">Update your account credentials</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('form.currentPassword')} *
          </label>
          <input
            type="password"
            {...register('current_password', { required: t('messages.requiredField') })}
            placeholder="••••••••"
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
          {errors.current_password && (
            <p className="mt-1 text-xs text-rose-500">{errors.current_password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('form.newPassword')} *
          </label>
          <input
            type="password"
            {...register('new_password', {
              required: t('messages.requiredField'),
              minLength: { value: 6, message: 'Minimum 6 characters required' },
            })}
            placeholder="••••••••"
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
          {errors.new_password && (
            <p className="mt-1 text-xs text-rose-500">{errors.new_password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('form.confirmPassword')} *
          </label>
          <input
            type="password"
            {...register('confirm_password', {
              required: t('messages.requiredField'),
              validate: (val) => val === newPassword || t('messages.passwordMismatch'),
            })}
            placeholder="••••••••"
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
          {errors.confirm_password && (
            <p className="mt-1 text-xs text-rose-500">{errors.confirm_password.message}</p>
          )}
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl"
          >
            {t('buttons.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating...' : t('buttons.changePassword')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
