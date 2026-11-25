import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Package } from 'lucide-react';
import { createProductApi } from '../../api/products';

export default function ProductCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      sku: '',
      category: 'Fashion',
      cost_price: '',
      sale_price: '',
      stock_quantity: 10,
      low_stock_threshold: 5,
      description: '',
    },
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        sku: values.sku || `SKU-${Date.now()}`,
        category: values.category,
        buying_cost: Number(values.cost_price || 0),
        cost_price: Number(values.cost_price || 0),
        selling_price: Number(values.sale_price),
        sale_price: Number(values.sale_price),
        stock_quantity: Number(values.stock_quantity || 0),
        low_stock_threshold: Number(values.low_stock_threshold || 5),
        description: values.description,
      };
      await createProductApi(payload);
      toast.success(t('messages.productCreated'));
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/products')}
          className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t('pages.addProduct', 'Add Product')}
          </h1>
          <p className="text-xs text-gray-500">Create a new item in your catalog</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {t('form.productName')} *
          </label>
          <input
            type="text"
            {...register('name', { required: t('messages.requiredField') })}
            placeholder="e.g. Cotton Panjabi (White)"
            className="block w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('form.sku')} *
            </label>
            <input
              type="text"
              {...register('sku', { required: t('messages.requiredField') })}
              placeholder="e.g. PNJ-CTN-WHT"
              className="block w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            {errors.sku && (
              <p className="mt-1 text-xs text-rose-500">{errors.sku.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('form.category')}
            </label>
            <select
              {...register('category')}
              className="block w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Fashion">Fashion / Clothing</option>
              <option value="Cosmetics">Cosmetics / Beauty</option>
              <option value="Gadgets">Gadgets / Accessories</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('form.buyingPrice')} (৳ Cost)
            </label>
            <input
              type="number"
              min="0"
              {...register('cost_price')}
              placeholder="e.g. 300"
              className="block w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('form.sellingPrice')} (৳ Sale) *
            </label>
            <input
              type="number"
              min="0"
              {...register('sale_price', { required: t('messages.requiredField') })}
              placeholder="e.g. 650"
              className="block w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono font-semibold"
            />
            {errors.sale_price && (
              <p className="mt-1 text-xs text-rose-500">{errors.sale_price.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('form.stock')} (Initial Qty)
            </label>
            <input
              type="number"
              min="0"
              {...register('stock_quantity')}
              className="block w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
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
              className="block w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            {...register('description')}
            placeholder="Product details, material, sizes..."
            className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl"
          >
            {t('buttons.cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{submitting ? 'Creating...' : t('buttons.addProduct')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
