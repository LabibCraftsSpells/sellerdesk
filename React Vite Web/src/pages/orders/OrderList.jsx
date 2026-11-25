import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  Plus,
  Download,
  Calendar,
  Truck,
  RotateCcw,
  CheckSquare,
  Square,
  Eye,
} from 'lucide-react';
import { getOrdersApi, bulkUpdateStatusApi } from '../../api/orders';
import { exportOrdersCsvApi } from '../../api/reports';
import { COURIERS, ORDER_STATUSES } from '../../constants/districts';
import { formatBDT } from '../../utils/currency';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

export default function OrderList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [courier, setCourier] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('confirmed');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        courier: courier || undefined,
        status: activeStatus !== 'all' ? activeStatus : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };
      const res = await getOrdersApi(params);
      const data = res.data;
      setOrders(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
      setSelectedIds([]);
    } catch (err) {
      setError(err.response?.data?.error || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [activeStatus, courier, dateFrom, dateTo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(1);
  };

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

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    try {
      await bulkUpdateStatusApi(selectedIds, bulkStatus);
      toast.success(`Updated ${selectedIds.length} orders to ${bulkStatus}`);
      fetchOrders(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.error || t('messages.error'));
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await exportOrdersCsvApi({
        status: activeStatus !== 'all' ? activeStatus : undefined,
        courier: courier || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV downloaded successfully');
    } catch {
      toast.error('Failed to export orders');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t('pages.orders')}
          </h1>
          <p className="text-xs text-gray-500">
            Manage, filter and bulk-update pipeline orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-2xs transition"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>{t('buttons.exportCSV')}</span>
          </button>
          <Link
            to="/orders/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('buttons.createOrder')}</span>
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
            activeStatus === 'all'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          {t('common.all')}
        </button>
        {ORDER_STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setActiveStatus(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 capitalize transition ${
              activeStatus === st
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {t(`status.${st}`, st)}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row items-center gap-2.5">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('orders.searchOrders')}
            className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Courier select */}
          <select
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t('orders.allCouriers')}</option>
            {COURIERS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Reset button */}
          {(search || courier || activeStatus !== 'all' || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setSearch('');
                setCourier('');
                setActiveStatus('all');
                setDateFrom('');
                setDateTo('');
              }}
              title={t('buttons.reset')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar (when orders selected) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-20 bg-indigo-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-150">
          <span className="text-xs font-medium">
            {selectedIds.length} {t('common.selected', 'selected')}
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="text-xs bg-indigo-800 text-white border border-indigo-700 rounded-md px-2.5 py-1.5 focus:outline-none capitalize"
            >
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t(`status.${st}`, st)}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={bulkUpdating}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-indigo-900 rounded-md hover:bg-indigo-50 transition"
            >
              {bulkUpdating ? 'Updating...' : t('buttons.changeStatus')}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner size="lg" text={t('messages.loading')} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchOrders(pagination.page)} />
      ) : orders.length === 0 ? (
        <EmptyState
          title={t('messages.noOrders')}
          description="Create your first Facebook / WhatsApp customer order"
          actionText={t('buttons.createOrder')}
          onAction={() => navigate('/orders/new')}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold">
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
                  <th className="py-3 px-4">{t('orders.codAmount')}</th>
                  <th className="py-3 px-4">{t('orders.status')}</th>
                  <th className="py-3 px-4">{t('orders.date')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((ord) => {
                  const isChecked = selectedIds.includes(ord.id);
                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-gray-50/70 transition ${
                        isChecked ? 'bg-indigo-50/30' : ''
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
                        <p className="font-semibold text-gray-900">{ord.customer_name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">
                          {ord.customer_phone}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <span>{ord.courier || '—'}</span>
                        {ord.tracking_id && (
                          <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                            {ord.tracking_id}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-gray-900">
                        {formatBDT(ord.cod_amount || ord.total || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-[11px]">
                        {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/orders/${ord.id}`}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-gray-100 inline-flex transition"
                          title={t('orders.viewDetails')}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-gray-100">
            {orders.map((ord) => {
              const isChecked = selectedIds.includes(ord.id);
              return (
                <div
                  key={ord.id}
                  className={`p-4 space-y-2.5 ${isChecked ? 'bg-indigo-50/40' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(ord.id)}
                        className="text-gray-400"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <Link
                        to={`/orders/${ord.id}`}
                        className="font-bold text-sm text-indigo-600 hover:underline"
                      >
                        {ord.order_number}
                      </Link>
                    </div>
                    <StatusBadge status={ord.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-gray-800">{ord.customer_name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{ord.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase">COD</span>
                      <p className="font-bold font-mono text-gray-900 text-sm">
                        {formatBDT(ord.cod_amount || ord.total || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-50">
                    <span>{ord.courier || 'No Courier'}</span>
                    <Link
                      to={`/orders/${ord.id}`}
                      className="text-indigo-600 font-semibold"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={(p) => fetchOrders(p)}
          />
        </div>
      )}
    </div>
  );
}
