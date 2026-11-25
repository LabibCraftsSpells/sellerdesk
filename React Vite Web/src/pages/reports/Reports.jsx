import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Download,
  Calendar,
  ArrowRight,
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
import { getDashboardStatsApi, exportOrdersCsvApi } from '../../api/reports';
import { formatBDT } from '../../utils/currency';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import toast from 'react-hot-toast';

export default function Reports() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardStatsApi();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const res = await exportOrdersCsvApi();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sellerdesk_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported to CSV');
    } catch {
      toast.error('Failed to export report');
    }
  };

  if (loading) return <LoadingSpinner size="lg" text={t('messages.loading')} />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const month = data?.month || {};
  const topProducts = data?.top_products || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t('pages.reports')}
          </h1>
          <p className="text-xs text-gray-500">
            Performance analytics, revenue and order breakdowns
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/reports/profit"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-100 transition"
          >
            <span>{t('pages.profitReport')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-2xs transition"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>{t('buttons.exportCSV')}</span>
          </button>
        </div>
      </div>

      {/* 30-Day Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-xs text-gray-400 font-medium">{t('reports.totalRevenue')} (30d)</span>
          <p className="text-2xl font-bold font-mono text-gray-900 mt-1">
            {formatBDT(month.total_revenue || 0)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-xs text-gray-400 font-medium">Estimated Gross Profit (30d)</span>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-1">
            {formatBDT(month.total_profit || 0)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-xs text-gray-400 font-medium">{t('reports.totalOrders')} (30d)</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">{month.total_orders || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-xs text-gray-400 font-medium">Delivery Success Rate</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {month.delivered_rate || 0}%
          </p>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {t('reports.topProducts')} (Last 30 Days)
          </h2>
        </div>

        {topProducts.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">
            No product sales data available yet.
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">{t('reports.product')}</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">{t('reports.revenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topProducts.map((p) => (
                <tr key={p.product_id} className="hover:bg-gray-50/60 transition">
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {p.product_name}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-gray-800">
                    {p.units_sold}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">
                    {formatBDT(p.revenue)}
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
