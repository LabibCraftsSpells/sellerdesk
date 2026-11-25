import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, Filter, TrendingUp, DollarSign } from 'lucide-react';
import { getProfitReportApi } from '../../api/reports';
import { formatBDT } from '../../utils/currency';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import toast from 'react-hot-toast';

export default function ProfitReport() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchProfit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProfitReportApi({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfit();
  }, [dateFrom, dateTo]);

  const summary = report?.summary || {};
  const perProduct = report?.per_product || [];
  const perDay = report?.per_day || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/reports')}
            className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {t('pages.profitReport')}
            </h1>
            <p className="text-xs text-gray-500">
              Net profit analysis: revenue minus cost, delivery fees, and return losses
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">Gross Revenue</span>
          <p className="text-xl font-bold font-mono text-gray-900 mt-1">
            {formatBDT(summary.total_revenue || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">Total Cost of Goods</span>
          <p className="text-xl font-bold font-mono text-gray-600 mt-1">
            {formatBDT(summary.total_cost || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">Return Losses</span>
          <p className="text-xl font-bold font-mono text-rose-600 mt-1">
            {formatBDT(summary.return_losses || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">Est. Net Profit</span>
          <p className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {formatBDT(summary.net_profit || 0)}
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text={t('messages.loading')} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchProfit} />
      ) : (
        <>
          {/* Per Product Profit Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Profit by Product
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">{t('reports.product')}</th>
                    <th className="py-3 px-4 text-center">Units</th>
                    <th className="py-3 px-4 text-right">{t('reports.revenue')}</th>
                    <th className="py-3 px-4 text-right">{t('reports.cost')}</th>
                    <th className="py-3 px-4 text-right text-emerald-600 font-bold">
                      {t('reports.netProfit')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {perProduct.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {p.product_name}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-800">
                        {p.units_sold}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">
                        {formatBDT(p.revenue || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">
                        {formatBDT(p.cost || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {formatBDT(p.profit || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
