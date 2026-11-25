import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Save, Building, Truck, Globe, Users, Plus, ShieldCheck, UserPlus } from 'lucide-react';
import { getSettingsApi, updateSettingsApi } from '../../api/settings';
import { getUsersApi, createUserApi } from '../../api/auth';
import { useSettings } from '../../hooks/useSettings';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { settings, loadSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'staff' });

  const { register, handleSubmit, reset } = useForm();

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await getUsersApi();
      setUsers(res.data || []);
    } catch {
      // Ignore if not admin or error
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all user fields');
      return;
    }
    setCreatingUser(true);
    try {
      await createUserApi(newUser);
      toast.success(`User ${newUser.email} created successfully`);
      setNewUser({ name: '', email: '', password: '', role: 'staff' });
      setShowAddUser(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  useEffect(() => {
    if (settings) {
      reset({
        business_name: settings.businessName || settings.business_name || 'SellerDesk',
        business_phone: settings.businessPhone || settings.business_phone || '',
        business_address: settings.businessAddress || settings.business_address || '',
        invoice_footer: settings.invoiceFooter || settings.invoice_footer || 'Thank you for your order!',
        default_delivery_charge: settings.defaultDeliveryCharge || settings.default_delivery_charge || 60,
        low_stock_threshold: settings.lowStockThreshold || settings.low_stock_threshold || 5,
        language: settings.language || 'en',
      });
    }
  }, [settings, reset]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await updateSettingsApi({
        business_name: values.business_name,
        business_phone: values.business_phone,
        business_address: values.business_address,
        invoice_footer: values.invoice_footer,
        default_delivery_charge: Number(values.default_delivery_charge),
        low_stock_threshold: Number(values.low_stock_threshold),
        language: values.language,
      });

      if (values.language && values.language !== i18n.language) {
        i18n.changeLanguage(values.language);
        localStorage.setItem('sellerdesk_lang', values.language);
      }

      await loadSettings();
      toast.success(t('messages.settingsSaved'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          {t('pages.settings')}
        </h1>
        <p className="text-xs text-gray-500">
          Configure business details, invoice defaults, and preferences
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-5 sm:p-8 rounded-2xl border border-gray-100 shadow-2xs space-y-6"
      >
        {/* Business Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Building className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              {t('settings.businessInfo')}
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('form.businessName')}
            </label>
            <input
              type="text"
              {...register('business_name')}
              className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.businessPhone')}
              </label>
              <input
                type="text"
                {...register('business_phone')}
                placeholder="01XXXXXXXXX"
                className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.businessAddress')}
              </label>
              <input
                type="text"
                {...register('business_address')}
                placeholder="City, District"
                className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('form.invoiceFooter')}
            </label>
            <input
              type="text"
              {...register('invoice_footer')}
              placeholder="e.g. Return within 3 days if unsatisfied."
              className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Defaults Section */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Truck className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Operations Defaults
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.defaultDeliveryCharge')} (৳)
              </label>
              <input
                type="number"
                min="0"
                {...register('default_delivery_charge')}
                className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.lowStockThreshold')}
              </label>
              <input
                type="number"
                min="1"
                {...register('low_stock_threshold')}
                className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Globe className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              {t('settings.appearance')}
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Default App Language
            </label>
            <select
              {...register('language')}
              className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা (Bangla)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : t('settings.saveSettings')}</span>
          </button>
        </div>
      </form>

      {/* Team & Staff Management Section */}
      <div className="bg-white p-5 sm:p-8 rounded-2xl border border-gray-100 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Staff & User Accounts
              </h2>
              <p className="text-[11px] text-gray-400">
                Manage roles and system access for your team
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddUser(!showAddUser)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{showAddUser ? 'Cancel' : 'Add Team Member'}</span>
          </button>
        </div>

        {/* Add User Modal / Form */}
        {showAddUser && (
          <form
            onSubmit={handleCreateUser}
            className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3"
          >
            <h3 className="text-xs font-bold text-gray-800">Add New User</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Asif Mahmud"
                  className="block w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="asif@demo.com"
                  className="block w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="block w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="block w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="staff">Staff (Orders & Inventory)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={creatingUser}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                <span>{creatingUser ? 'Creating...' : 'Create Account'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Users List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                <th className="pb-2.5">Name</th>
                <th className="pb-2.5">Email</th>
                <th className="pb-2.5">Role</th>
                <th className="pb-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-2.5 font-semibold text-gray-800">{u.name}</td>
                  <td className="py-2.5 font-mono text-gray-600">{u.email}</td>
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
