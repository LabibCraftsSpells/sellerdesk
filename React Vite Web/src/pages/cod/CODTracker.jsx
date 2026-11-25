import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Banknote,
  CheckCircle,
  XCircle,
  Truck,
  RotateCcw,
  CheckSquare,
  Square,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { getCODSummaryApi, getPendingCODApi } from '../../api/cod';
import { formatBDT } from '../../utils/currency';
import { COURIERS } from '../../constants/districts';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

export default function CODTracker() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [courier, setCourier] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchData = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, pendRes] = await Promise.all([
        getCODSummaryApi(),
        getPendingCODApi({ page, limit: 15, courier: courier || undefined }),
      ]);
      setSummary(sumRes.data);
      setOrders(pendRes.data?.data || []);
      setPagination(pendRes.data?.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
      setSelectedIds([]);
    } catch (err) {
      setError(err.response?.data?.error || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [courier]);

  const handleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleProceedToSettle = () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one order to settle');
      return;
    }
    // Navigate to settlement page with selected IDs
    navigate('/cod/settle', { state: { selectedIds, courier } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t('pages.codTracker')}
          </h1>
          <p className="text-xs text-gray-500">
            Track courier cash collections, pending balances and settlements
          </p>
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={handleProceedToSettle}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition active:scale-95"
          >
            <span>{t('cod.settleSelected')} ({selectedIds.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending with Courier */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium text-amber-800">
              {t('cod.pendingWithCourier')}
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {formatBDT(summary?.total_pending || 0)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Delivered orders awaiting payout</p>
        </div>

        {/* Collected / Settled */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium text-emerald-800">
              {t('cod.collected')}
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {formatBDT(summary?.total_collected || 0)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Total COD settled in bank</p>
        </div>

        {/* Lost to Returns */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium text-rose-800">
              {t('cod.returnLoss')}
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">
            {formatBDT(summary?.total_lost_returns || 0)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Uncollected value from returned orders</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Filter Courier:</span>
          <select
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t('orders.allCouriers')}</option>
            {COURIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={handleProceedToSettle}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
          >
            Settle ({selectedIds.length}) Selected →
          </button>
        )}
      </div>

      {/* Unsettled Orders Table */}
      {loading ? (
        <LoadingSpinner size="lg" text={t('messages.loading')} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchData(pagination.page)} />
      ) : orders.length === 0 ? (
        <EmptyState
          title={t('dashboard.allCaughtUp')}
          description="No delivered COD orders currently pending courier settlement."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Unsettled Delivered Orders ({pagination.total})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-gray-400 hover:text-indigo-600"
                    >
                      {selectedIds.length === orders.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">{t('orders.orderNumber')}</th>
                  <th className="py-3 px-4">{t('orders.customer')}</th>
                  <th className="py-3 px-4">{t('orders.courier')}</th>
                  <th className="py-3 px-4">{t('orders.trackingId')}</th>
                  <th className="py-3 px-4 text-right">COD Amount</th>
                  <th className="py-3 px-4 text-right">Delivered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((ord) => {
                  const isChecked = selectedIds.includes(ord.id);
                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-gray-50/70 transition ${
                        isChecked ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(ord.id)}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-600">
                        <Link to={`/orders/${ord.id}`} className="hover:underline">
                          {ord.order_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-800">{ord.customer_name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{ord.customer_phone}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {ord.courier || '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {ord.tracking_id || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                        {formatBDT(ord.cod_amount || ord.total || 0)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400 font-mono text-[11px]">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={(p) => fetchData(p)}
          />
        </div>
      )}
    </div>
  );
}
