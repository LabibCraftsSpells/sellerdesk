import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Package,
  CheckCircle2,
  XCircle,
  Banknote,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { getDashboardStatsApi } from '../api/reports';
import { getOrdersApi } from '../api/orders';
import { formatBDT } from '../utils/currency';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

export default function Dashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        getDashboardStatsApi(),
        getOrdersApi({ limit: 5 }),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data?.data || ordersRes.data || []);
    } catch (err) {
      setError(err.response?.data?.error || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" text={t('messages.loading')} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const today = stats?.today || {};
  const week = stats?.week || {};
  const month = stats?.month || {};
  const lowStock = stats?.low_stock_items || [];
  const topProducts = stats?.top_products || [];
  const codPending = stats?.cod_pending || {};

  // 7-day live trends from database
  const chartData = stats?.last_7_days && stats.last_7_days.length > 0
    ? stats.last_7_days
    : [
        { name: 'Mon', delivered: 0, returned: 0 },
        { name: 'Tue', delivered: 0, returned: 0 },
        { name: 'Wed', delivered: 0, returned: 0 },
        { name: 'Thu', delivered: 0, returned: 0 },
        { name: 'Fri', delivered: 0, returned: 0 },
        { name: 'Sat', delivered: 0, returned: 0 },
        { name: 'Sun', delivered: 0, returned: 0 },
      ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t('pages.dashboard')}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {t('dashboard.last7Days')} performance overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title={t('common.refresh')}
            className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/orders/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('buttons.createOrder')}</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Today's Orders */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">{t('dashboard.todaysOrders')}</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {today.total_orders || 0}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {formatBDT(today.total_revenue || 0)}
            </p>
          </div>
        </div>

        {/* This Week Revenue */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">{t('dashboard.thisWeekRevenue')}</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatBDT(week.total_revenue || 0)}
            </div>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">
              {week.total_orders || 0} orders this week
            </p>
          </div>
        </div>

        {/* Delivery Rate */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">{t('dashboard.deliveryRate')}</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">
              {month.delivered_rate || 0}%
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {month.delivered || 0} delivered (30d)
            </p>
          </div>
        </div>

        {/* Return Rate */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">{t('dashboard.returnRate')}</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600">
              {month.return_rate || 0}%
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {month.returns || 0} returned (30d)
            </p>
          </div>
        </div>

        {/* Pending COD */}
        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-medium">{t('dashboard.pendingCOD')}</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-amber-600">
              {formatBDT(codPending.total_cod_pending || 0)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {codPending.pending_count || 0} orders pending
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Delivery Trend */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Orders Delivered vs Returned (Last 7 Days)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="delivered" name="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="returned" name="Returned" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Products by Revenue */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            {t('dashboard.topProductsByRevenue')}
          </h2>
          {topProducts.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-gray-400">
              No sales data for top products yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts.map((p) => ({
                    name: p.product_name?.length > 15 ? p.product_name.slice(0, 15) + '…' : p.product_name,
                    revenue: Number(p.revenue),
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [formatBDT(val), 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Two Column: Low Stock Alerts & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts (1 col) */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">
                {t('dashboard.lowStockAlert')}
              </h2>
            </div>
            <Link
              to="/products?low_stock=true"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {t('common.all')}
            </Link>
          </div>

          {lowStock.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">
              {t('dashboard.allCaughtUp')}
            </p>
          ) : (
            <div className="space-y-2.5">
              {lowStock.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50 border border-amber-100"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-semibold text-gray-800 truncate">
                      {prod.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Threshold: {prod.low_stock_threshold}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-200 text-amber-900 shrink-0">
                    {prod.stock_quantity} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders (2 cols) */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {t('dashboard.recentOrders')}
            </h2>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <span>{t('dashboard.viewAll')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">
              {t('dashboard.noRecentOrders')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400">
                    <th className="pb-2 font-medium">{t('orders.orderNumber')}</th>
                    <th className="pb-2 font-medium">{t('orders.customer')}</th>
                    <th className="pb-2 font-medium">{t('orders.codAmount')}</th>
                    <th className="pb-2 font-medium">{t('orders.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-2.5 font-semibold text-indigo-600">
                        <Link to={`/orders/${ord.id}`} className="hover:underline">
                          {ord.order_number}
                        </Link>
                      </td>
                      <td className="py-2.5">
                        <p className="font-medium text-gray-800">{ord.customer_name}</p>
                        <p className="text-[10px] text-gray-400">{ord.customer_phone}</p>
                      </td>
                      <td className="py-2.5 font-semibold text-gray-900">
                        {formatBDT(ord.cod_amount || ord.total || 0)}
                      </td>
                      <td className="py-2.5">
                        <StatusBadge status={ord.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
