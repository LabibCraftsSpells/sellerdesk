import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  ShoppingBag,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';
import { getCustomerApi } from '../../api/customers';
import { formatBDT } from '../../utils/currency';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomer = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomerApi(id);
      setCustomer(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" text={t('messages.loading')} />;
  if (error) return <ErrorState message={error} onRetry={fetchCustomer} />;
  if (!customer) return null;

  const orders = customer.orders || [];
  const isRisky = Boolean(customer.is_risky) || Number(customer.return_count) >= 3;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {customer.name}
            </h1>
            {isRisky ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" /> High Return Risk
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Regular Customer
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{customer.phone}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">{t('customers.totalOrders')}</span>
          <p className="text-xl font-bold text-gray-900 mt-1">{customer.total_orders || orders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">{t('customers.totalSpent')}</span>
          <p className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {formatBDT(customer.total_spent || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">Return Count</span>
          <p className="text-xl font-bold font-mono text-rose-600 mt-1">
            {customer.return_count || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">Location</span>
          <p className="text-xs font-semibold text-gray-800 mt-1 truncate">
            {customer.district || 'Bangladesh'}
          </p>
        </div>
      </div>

      {/* Address Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs text-xs space-y-1">
        <span className="font-semibold text-gray-700">{t('form.fullAddress')}:</span>
        <p className="text-gray-600">
          {customer.full_address || customer.address || 'No street address provided.'}
        </p>
      </div>

      {/* Order History Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              {t('customers.orderHistory')} ({orders.length})
            </h2>
          </div>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">
            No orders placed yet.
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="py-2.5 px-4">{t('orders.orderNumber')}</th>
                <th className="py-2.5 px-4">{t('orders.courier')}</th>
                <th className="py-2.5 px-4 text-right">{t('common.amount')}</th>
                <th className="py-2.5 px-4 text-center">{t('orders.status')}</th>
                <th className="py-2.5 px-4 text-right">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-gray-50/60 transition">
                  <td className="py-3 px-4 font-semibold text-indigo-600">
                    <Link to={`/orders/${ord.id}`} className="hover:underline">
                      {ord.order_number}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{ord.courier || '—'}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                    {formatBDT(ord.cod_amount || ord.total || 0)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={ord.status} />
                  </td>
                  <td className="py-3 px-4 text-right text-gray-400 font-mono text-[11px]">
                    {new Date(ord.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
