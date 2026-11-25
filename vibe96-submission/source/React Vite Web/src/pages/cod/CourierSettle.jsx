import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Banknote, Calendar, FileText } from 'lucide-react';
import { settleCODApi } from '../../api/cod';
import { COURIERS } from '../../constants/districts';

export default function CourierSettle() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedIds = location.state?.selectedIds || [];
  const initialCourier = location.state?.courier || 'Pathao';

  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      courier: initialCourier || 'Pathao',
      settled_at: new Date().toISOString().split('T')[0],
      received_amount: '',
      notes: '',
    },
  });

  const onSubmit = async (values) => {
    if (selectedIds.length === 0) {
      toast.error('No orders selected for settlement');
      navigate('/cod');
      return;
    }

    setSubmitting(true);
    try {
      await settleCODApi({
        order_ids: selectedIds,
        courier: values.courier,
        settled_at: values.settled_at,
        received_amount: values.received_amount ? Number(values.received_amount) : undefined,
        notes: values.notes,
      });
      toast.success(t('messages.settlementSaved'));
      navigate('/cod');
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/cod')}
          className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {t('pages.courierSettlement')}
          </h1>
          <p className="text-xs text-gray-500">
            Confirm payout received from courier for {selectedIds.length} orders
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4"
      >
        <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
          <span>Selected Orders for Settlement:</span>
          <span className="font-bold text-indigo-700 font-mono">
            {selectedIds.length} orders
          </span>
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
            {t('form.settlementDate')}
          </label>
          <input
            type="date"
            {...register('settled_at')}
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('form.amountReceived')} (৳ Bank Deposit)
          </label>
          <input
            type="number"
            min="0"
            {...register('received_amount')}
            placeholder="Leave empty to use exact order sum"
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('form.settlementNotes')}
          </label>
          <textarea
            rows={2}
            {...register('notes')}
            placeholder="Bank deposit ref / courier invoice #..."
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/cod')}
            className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl"
          >
            {t('buttons.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting || selectedIds.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Settling...' : t('buttons.settle')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
