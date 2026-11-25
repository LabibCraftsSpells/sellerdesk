import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Phone,
  User,
  MapPin,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Truck,
  ArrowLeft,
  Banknote,
  FileText,
} from 'lucide-react';
import { ALL_DISTRICTS, COURIERS, SOURCES } from '../../constants/districts';
import { createOrderApi } from '../../api/orders';
import { getProductsApi } from '../../api/products';
import { lookupCustomerByPhoneApi } from '../../api/customers';
import { useSettings } from '../../hooks/useSettings';
import { formatBDT } from '../../utils/currency';

export default function OrderCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [products, setProducts] = useState([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);
  const [recentOrderWarning, setRecentOrderWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const defaultDelivery = Number(settings?.defaultDeliveryCharge || 60);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      phone: '',
      name: '',
      district: 'Dhaka',
      area: '',
      address: '',
      items: [{ product_id: '', quantity: 1, unit_price: 0, buying_cost: 0 }],
      delivery_charge: defaultDelivery,
      discount: 0,
      payment_method: 'cod',
      advance_amount: 0,
      source: 'facebook',
      courier: 'Pathao',
      tracking_id: '',
      note: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedPhone = watch('phone');
  const watchedItems = watch('items');
  const watchedDelivery = watch('delivery_charge') || 0;
  const watchedDiscount = watch('discount') || 0;
  const watchedPaymentMethod = watch('payment_method');
  const watchedAdvance = watch('advance_amount') || 0;

  // Load products list for dropdown
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await getProductsApi({ limit: 100 });
        setProducts(res.data?.data || res.data || []);
      } catch (err) {
        toast.error('Failed to load products');
      }
    }
    loadProducts();
  }, []);

  // Phone lookup on blur / input
  const handlePhoneBlur = async () => {
    const raw = (watchedPhone || '').trim();
    if (!/^01[3-9]\d{8}$/.test(raw)) return;

    setLookingUp(true);
    setRecentOrderWarning(null);
    try {
      const res = await lookupCustomerByPhoneApi(raw);
      if (res.data?.recent_order) {
        setRecentOrderWarning(res.data.recent_order);
      }
      if (res.data?.found && res.data.customer) {
        const c = res.data.customer;
        setCustomerFound(true);
        setValue('name', c.name || '');
        if (c.district) setValue('district', c.district);
        if (c.area) setValue('area', c.area);
        if (c.address || c.full_address) setValue('address', c.address || c.full_address);
        toast.success(`Returning customer found: ${c.name}`);

        if (c.is_risky) {
          toast.error('⚠️ High return risk customer!', { duration: 5000 });
        }
      } else {
        setCustomerFound(false);
      }
    } catch {
      // Ignore
    } finally {
      setLookingUp(false);
    }
  };

  // When a product is selected in item row, auto-fill unit_price
  const handleProductSelect = (index, productId) => {
    const prod = products.find((p) => String(p.id) === String(productId));
    if (prod) {
      const price = Number(prod.sale_price || prod.selling_price || 0);
      const cost = Number(prod.cost_price || prod.buying_cost || 0);
      setValue(`items.${index}.unit_price`, price);
      setValue(`items.${index}.buying_cost`, cost);
    }
  };

  // Financial calculations
  const subtotal = watchedItems.reduce((acc, itm) => {
    const q = Number(itm.quantity) || 0;
    const p = Number(itm.unit_price) || 0;
    return acc + q * p;
  }, 0);

  const deliveryCharge = Number(watchedDelivery) || 0;
  const discount = Number(watchedDiscount) || 0;
  const advanceAmount = Number(watchedAdvance) || 0;
  const grandTotal = Math.max(0, subtotal + deliveryCharge - discount);
  const codAmount = watchedPaymentMethod === 'cod' ? Math.max(0, grandTotal - advanceAmount) : 0;

  const onSubmit = async (values) => {
    if (!values.items || values.items.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    setSubmitting(true);
    try {
      // Format items with names
      const formattedItems = values.items.map((itm) => {
        const prod = products.find((p) => String(p.id) === String(itm.product_id));
        return {
          product_id: parseInt(itm.product_id, 10),
          product_name: prod ? prod.name : 'Custom Item',
          quantity: parseInt(itm.quantity, 10),
          unit_price: Number(itm.unit_price),
          buying_cost: Number(itm.buying_cost || 0),
        };
      });

      const payload = {
        customer: {
          name: values.name,
          phone: values.phone,
          district: values.district,
          area: values.area,
          address: values.address,
        },
        items: formattedItems,
        delivery_charge: deliveryCharge,
        discount: discount,
        payment_method: values.payment_method,
        advance_amount: advanceAmount,
        source: values.source,
        courier: values.courier,
        tracking_id: values.tracking_id,
        note: values.note,
      };

      const res = await createOrderApi(payload);
      toast.success(t('messages.orderCreated'));
      navigate(`/orders/${res.data.id || res.data.order?.id || ''}`);
    } catch (err) {
      const msg = err.response?.data?.error || t('messages.error');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t('pages.createOrder')}
          </h1>
          <p className="text-xs text-gray-500">Quick Bangladesh mobile order entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Customer Info */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-900">
                Customer Information
              </h2>
            </div>
            {customerFound && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-3 h-3" />
                Returning Customer
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.phoneNumber')} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  {...register('phone', {
                    required: t('messages.requiredField'),
                    pattern: {
                      value: /^01[3-9]\d{8}$/,
                      message: t('messages.invalidPhone'),
                    },
                  })}
                  onBlur={handlePhoneBlur}
                  placeholder="01XXXXXXXXX"
                  className="block w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono transition"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>
              )}
              {lookingUp && (
                <p className="mt-1 text-xs text-indigo-500">Checking customer database...</p>
              )}
              {recentOrderWarning && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Recent Order Warning</span>
                    <span>
                      Order <strong>{recentOrderWarning.order_number}</strong> was placed by this phone recently ({recentOrderWarning.status.toUpperCase()}) totaling {formatBDT(recentOrderWarning.total)}. Check to prevent duplicate entry.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.customerName')} *
              </label>
              <input
                type="text"
                {...register('name', { required: t('messages.requiredField') })}
                placeholder="e.g. Tanvir Ahmed"
                className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>
              )}
            </div>

            {/* District */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.district')} *
              </label>
              <select
                {...register('district', { required: true })}
                className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
              >
                {ALL_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Area / Thana */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.area')}
              </label>
              <input
                type="text"
                {...register('area')}
                placeholder="e.g. Mirpur-10 / Dhanmondi"
                className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>

            {/* Full Street Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.fullAddress')} *
              </label>
              <input
                type="text"
                {...register('address', { required: t('messages.requiredField') })}
                placeholder="House #, Road #, Landmark"
                className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              {errors.address && (
                <p className="mt-1 text-xs text-rose-500">{errors.address.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Product Items */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-900">
                {t('orders.orderItems')}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => append({ product_id: '', quantity: 1, unit_price: 0, buying_cost: 0 })}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('orders.addItem')}</span>
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, idx) => {
              const selectedProdId = watch(`items.${idx}.product_id`);
              const selectedProd = products.find((p) => String(p.id) === String(selectedProdId));
              const qty = watch(`items.${idx}.quantity`) || 1;
              const isOverStock = selectedProd && qty > selectedProd.stock_quantity;

              return (
                <div key={field.id} className="space-y-1.5">
                  <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                    {/* Product Picker */}
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 sm:hidden">
                        {t('form.product')}
                      </label>
                      <select
                        {...register(`items.${idx}.product_id`, { required: true })}
                        onChange={(e) => {
                          register(`items.${idx}.product_id`).onChange(e);
                          handleProductSelect(idx, e.target.value);
                        }}
                        className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock_quantity}) — ৳{p.sale_price || p.selling_price}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-24 shrink-0">
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 sm:hidden">
                        {t('form.quantity')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register(`items.${idx}.quantity`, { required: true, min: 1 })}
                        className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-center focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-28 shrink-0">
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 sm:hidden">
                        Price (৳)
                      </label>
                      <input
                        type="number"
                        min="0"
                        {...register(`items.${idx}.unit_price`, { required: true, min: 0 })}
                        className="block w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-right focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    {/* Remove Button */}
                    <div className="flex items-center justify-between sm:justify-center pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        disabled={fields.length === 1}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30 transition ml-auto"
                        title={t('buttons.remove')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isOverStock && (
                    <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Requested quantity ({qty}) exceeds in-stock quantity ({selectedProd.stock_quantity}) for <strong>{selectedProd.name}</strong>.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Logistics & Payment Details */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Truck className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Delivery & Payment
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Courier */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.courier')}
              </label>
              <select
                {...register('courier')}
                className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {COURIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Tracking ID */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.trackingId')}
              </label>
              <input
                type="text"
                {...register('tracking_id')}
                placeholder="Optional at entry"
                className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Source */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.source')}
              </label>
              <select
                {...register('source')}
                className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 capitalize"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s.toLowerCase()}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.paymentMethod')}
              </label>
              <select
                {...register('payment_method')}
                className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value="cod">Cash on Delivery (COD)</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="bank">Bank Transfer</option>
                <option value="advance">Paid in Advance</option>
              </select>
            </div>

            {/* Delivery Charge */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.deliveryCharge')} (৳)
              </label>
              <input
                type="number"
                min="0"
                {...register('delivery_charge')}
                className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.discount')} (৳)
              </label>
              <input
                type="number"
                min="0"
                {...register('discount')}
                className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            {/* Advance Amount */}
            {watchedPaymentMethod !== 'advance' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('form.advancePaid')} (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('advance_amount')}
                  placeholder="0"
                  className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            )}

            {/* Note */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('form.note')}
              </label>
              <input
                type="text"
                {...register('note')}
                placeholder="Optional customer instructions or notes"
                className="block w-full px-3 py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Summary Card */}
        <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-lg space-y-3">
          <div className="text-xs uppercase font-semibold tracking-wider text-indigo-300">
            {t('orders.orderSummary')}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-indigo-300">{t('orders.subtotal')}</span>
              <p className="text-base font-bold font-mono mt-0.5">{formatBDT(subtotal)}</p>
            </div>
            <div>
              <span className="text-indigo-300">{t('orders.deliveryCharge')}</span>
              <p className="text-base font-bold font-mono mt-0.5">+{formatBDT(deliveryCharge)}</p>
            </div>
            <div>
              <span className="text-indigo-300">{t('orders.discount')}</span>
              <p className="text-base font-bold font-mono mt-0.5">-{formatBDT(discount)}</p>
            </div>
            <div>
              <span className="text-emerald-400 font-bold">{t('orders.grandTotal')}</span>
              <p className="text-lg font-black font-mono text-emerald-300 mt-0.5">
                {formatBDT(grandTotal)}
              </p>
            </div>
          </div>

          {watchedPaymentMethod === 'cod' && (
            <div className="pt-3 border-t border-indigo-800/80 flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300">
                COD Due from Courier:
              </span>
              <span className="text-xl font-black font-mono text-amber-300">
                {formatBDT(codAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Big Submit Button */}
        <div className="sticky bottom-16 md:bottom-4 z-20 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl shadow-xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition active:scale-[0.99]"
          >
            <Banknote className="w-5 h-5" />
            <span>{submitting ? 'Creating Order...' : t('buttons.createOrder')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
