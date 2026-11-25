import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, SlidersHorizontal } from 'lucide-react';
import { getProductApi, adjustStockApi } from '../../api/products';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function StockAdjust() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      type: 'restock',
      quantity: 10,
      reason: 'Regular restock',
    },
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await getProductApi(id);
        setProduct(res.data);
      } catch (err) {
        toast.error('Failed to load product');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await adjustStockApi({
        product_id: parseInt(id, 10),
        quantity: parseInt(values.quantity, 10),
        type: values.type,
        reason: values.reason,
      });
      toast.success(t('messages.stockUpdated'));
      navigate(`/products/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text={t('messages.loading')} />;
  if (!product) return null;

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/products/${id}`)}
          className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {t('products.stockAdjust')}
          </h1>
          <p className="text-xs text-gray-500 truncate max-w-[250px]">{product.name}</p>
        </div>
      </div>

      <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-900">Current Stock</span>
        <span className="text-lg font-bold font-mono text-indigo-700">
          {product.stock_quantity}
        </span>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Adjustment Type
          </label>
          <select
            {...register('type')}
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 capitalize"
          >
            <option value="restock">Restock (+ Add Stock)</option>
            <option value="damaged">Damaged (- Deduct Stock)</option>
            <option value="correction">Correction (Manual adjustment)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('form.quantity')} *
          </label>
          <input
            type="number"
            min="1"
            {...register('quantity', { required: true, min: 1 })}
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
          />
          {errors.quantity && (
            <p className="mt-1 text-xs text-rose-500">{t('messages.requiredField')}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Reason / Notes
          </label>
          <input
            type="text"
            {...register('reason')}
            placeholder="e.g. New supplier shipment arrived"
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(`/products/${id}`)}
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
            <span>{saving ? 'Updating...' : t('buttons.saveChanges')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
