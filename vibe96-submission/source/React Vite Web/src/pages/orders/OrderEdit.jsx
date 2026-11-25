import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { getOrderApi, updateOrderApi } from '../../api/orders';
import { COURIERS, ORDER_STATUSES } from '../../constants/districts';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function OrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    async function load() {
      try {
        const res = await getOrderApi(id);
        const o = res.data;
        reset({
          status: o.status,
          courier: o.courier || 'Pathao',
          tracking_id: o.tracking_id || '',
          delivery_charge: o.delivery_charge || 0,
          discount: o.discount || 0,
          note: o.note || '',
        });
      } catch (err) {
        toast.error('Failed to load order');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, reset, navigate]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await updateOrderApi(id, {
        status: values.status,
        courier: values.courier,
        tracking_id: values.tracking_id,
        delivery_charge: Number(values.delivery_charge),
        discount: Number(values.discount),
        note: values.note,
      });
      toast.success(t('messages.orderUpdated'));
      navigate(`/orders/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text={t('messages.loading')} />;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/orders/${id}`)}
          className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {t('pages.editOrder')} #{id}
          </h1>
          <p className="text-xs text-gray-500">Update logistics & status details</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('form.selectStatus')}
          </label>
          <select
            {...register('status')}
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 capitalize"
          >
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {t(`status.${st}`, st)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('form.courier')}
          </label>
          <select
            {...register('courier')}
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
          >
            {COURIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('form.trackingId')}
          </label>
          <input
            type="text"
            {...register('tracking_id')}
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('form.deliveryCharge')} (৳)
            </label>
            <input
              type="number"
              min="0"
              {...register('delivery_charge')}
              className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('form.discount')} (৳)
            </label>
            <input
              type="number"
              min="0"
              {...register('discount')}
              className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('form.note')}
          </label>
          <textarea
            rows={3}
            {...register('note')}
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`/orders/${id}`)}
            className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl"
          >
            {t('buttons.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : t('buttons.saveChanges')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
