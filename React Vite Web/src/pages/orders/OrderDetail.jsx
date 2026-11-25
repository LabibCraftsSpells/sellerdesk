import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Printer,
  Edit,
  Clock,
  User,
  Truck,
  Package,
  CheckCircle,
  FileText,
  Calendar,
  Phone,
  MapPin,
} from 'lucide-react';
import { getOrderApi, updateOrderStatusApi } from '../../api/orders';
import { ORDER_STATUSES } from '../../constants/districts';
import { formatBDT } from '../../utils/currency';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOrderApi(id);
      const data = res.data;
      setOrder(data);
      setSelectedStatus(data.status || 'new');
    } catch (err) {
      setError(err.response?.data?.error || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!selectedStatus || selectedStatus === order.status) return;
    setUpdating(true);
    try {
      await updateOrderStatusApi(id, selectedStatus, statusNote);
      toast.success(t('messages.orderUpdated'));
      setStatusNote('');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text={t('messages.loading')} />;
  if (error) return <ErrorState message={error} onRetry={fetchOrder} />;
  if (!order) return null;

  const items = order.items || [];
  const history = order.status_history || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {order.order_number}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/invoice/${order.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-2xs transition"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>{t('orders.printInvoice')}</span>
          </Link>

          <Link
            to={`/orders/${order.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition"
          >
            <Edit className="w-4 h-4" />
            <span>{t('buttons.edit')}</span>
          </Link>
        </div>
      </div>

      {/* Quick Status Transition Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs font-medium text-gray-600">
          Change Order Status:
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 capitalize"
          >
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {t(`status.${st}`, st)}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            placeholder="Status note (optional)"
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 flex-1 sm:w-48"
          />

          <button
            onClick={handleStatusUpdate}
            disabled={updating || selectedStatus === order.status}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition"
          >
            {updating ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>

      {/* 2-Column: Customer Details & Logistics Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Information Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-gray-900">
                {t('customers.customerDetails')}
              </h2>
            </div>
            {order.is_risky ? (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Risky Customer
              </span>
            ) : null}
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-gray-400 block text-[11px]">{t('form.customerName')}</span>
              <span className="font-semibold text-gray-800">{order.customer_name}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">{t('form.phoneNumber')}</span>
              <a
                href={`tel:${order.customer_phone}`}
                className="font-mono font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                {order.customer_phone}
              </a>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">{t('form.fullAddress')}</span>
              <span className="text-gray-700">
                {order.customer_address || order.full_address || order.address || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Logistics & Payment Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Truck className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Logistics & Source
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[11px]">{t('orders.courier')}</span>
              <span className="font-semibold text-gray-800">{order.courier || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">{t('orders.trackingId')}</span>
              <span className="font-mono text-gray-800 font-medium">
                {order.tracking_id || 'Not assigned'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">{t('orders.paymentMethod')}</span>
              <span className="font-semibold text-gray-800 uppercase">
                {order.payment_method}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">{t('orders.source')}</span>
              <span className="font-semibold text-gray-800 capitalize">
                {order.source || 'Facebook'}
              </span>
            </div>
            {order.note && (
              <div className="col-span-2 pt-2 border-t border-gray-50">
                <span className="text-gray-400 block text-[11px]">{t('orders.note')}</span>
                <p className="text-gray-700 italic">{order.note}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              {t('orders.orderItems')} ({items.length})
            </h2>
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
            <tr>
              <th className="py-2.5 px-4">{t('form.product')}</th>
              <th className="py-2.5 px-4 text-center">{t('form.quantity')}</th>
              <th className="py-2.5 px-4 text-right">Unit Price</th>
              <th className="py-2.5 px-4 text-right">{t('common.total')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((itm) => (
              <tr key={itm.id}>
                <td className="py-3 px-4 font-semibold text-gray-800">
                  {itm.product_name}
                </td>
                <td className="py-3 px-4 text-center font-bold text-gray-900">
                  {itm.quantity}
                </td>
                <td className="py-3 px-4 text-right font-mono text-gray-600">
                  {formatBDT(itm.unit_price)}
                </td>
                <td className="py-3 px-4 text-right font-bold font-mono text-gray-900">
                  {formatBDT(itm.unit_price * itm.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pricing Summary */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-col items-end text-xs space-y-1.5">
          <div className="flex justify-between w-64 text-gray-500">
            <span>{t('orders.subtotal')}:</span>
            <span className="font-mono text-gray-800">{formatBDT(order.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between w-64 text-gray-500">
            <span>{t('orders.deliveryCharge')}:</span>
            <span className="font-mono text-gray-800">+{formatBDT(order.delivery_charge || 0)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between w-64 text-gray-500">
              <span>{t('orders.discount')}:</span>
              <span className="font-mono text-rose-600">-{formatBDT(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between w-64 text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
            <span>{t('orders.grandTotal')}:</span>
            <span className="font-mono text-indigo-700">{formatBDT(order.total || 0)}</span>
          </div>
          {order.payment_method === 'cod' && (
            <div className="flex justify-between w-64 text-xs font-bold text-amber-700 pt-1">
              <span>COD Amount Due:</span>
              <span className="font-mono">{formatBDT(order.cod_amount || 0)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Status History Timeline */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
          <Clock className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">
            {t('orders.orderTimeline')}
          </h2>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-gray-400 py-3">No status events recorded.</p>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
            {history.map((h, i) => (
              <div key={h.id || i} className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 uppercase">
                    {h.status}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                  {h.changed_by_name && (
                    <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                      by {h.changed_by_name}
                    </span>
                  )}
                </div>
                {h.note && (
                  <p className="text-xs text-gray-600 mt-0.5">{h.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
