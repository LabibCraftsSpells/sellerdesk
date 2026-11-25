import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Search, AlertTriangle, Phone, MapPin, Eye, RotateCcw } from 'lucide-react';
import { getCustomersApi } from '../../api/customers';
import { formatBDT } from '../../utils/currency';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

export default function CustomerList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [riskyOnly, setRiskyOnly] = useState(false);

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomersApi({
        page,
        limit: 15,
        search: search.trim() || undefined,
        risky: riskyOnly ? 'true' : undefined,
      });
      const data = res.data;
      setCustomers(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
    } catch (err) {
      setError(err.response?.data?.error || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [riskyOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t('pages.customers')}
          </h1>
          <p className="text-xs text-gray-500">
            Customer profiles, return rates and order value
          </p>
        </div>
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
            placeholder={t('customers.searchCustomers')}
            className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setRiskyOnly(!riskyOnly)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition ${
              riskyOnly
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Risky Customers</span>
          </button>

          {(search || riskyOnly) && (
            <button
              onClick={() => {
                setSearch('');
                setRiskyOnly(false);
              }}
              title={t('buttons.reset')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner size="lg" text={t('messages.loading')} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchCustomers(pagination.page)} />
      ) : customers.length === 0 ? (
        <EmptyState
          title={t('customers.noCustomers')}
          description="Customers are automatically registered when creating orders"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">{t('form.customerName')}</th>
                  <th className="py-3 px-4">{t('form.phoneNumber')}</th>
                  <th className="py-3 px-4">{t('form.district')}</th>
                  <th className="py-3 px-4 text-center">{t('customers.totalOrders')}</th>
                  <th className="py-3 px-4 text-right">{t('customers.totalSpent')}</th>
                  <th className="py-3 px-4 text-center">Returns</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c) => {
                  const isRisky = Boolean(c.is_risky) || Number(c.return_count) >= 3;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4">
                        <Link
                          to={`/customers/${c.id}`}
                          className="font-semibold text-gray-900 hover:text-indigo-600"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600">{c.phone}</td>
                      <td className="py-3 px-4 text-gray-500">{c.district || c.address || '—'}</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-900">
                        {c.total_orders}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                        {formatBDT(c.total_spent || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-semibold font-mono ${
                            Number(c.return_count) > 0 ? 'text-rose-600' : 'text-gray-400'
                          }`}
                        >
                          {c.return_count || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isRisky ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Risky
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Regular
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/customers/${c.id}`}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-gray-100 inline-flex transition"
                          title={t('customers.customerDetails')}
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

          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {customers.map((c) => {
              const isRisky = Boolean(c.is_risky) || Number(c.return_count) >= 3;
              return (
                <div key={c.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/customers/${c.id}`}
                      className="font-bold text-sm text-gray-900 hover:text-indigo-600"
                    >
                      {c.name}
                    </Link>
                    {isRisky ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <AlertTriangle className="w-3 h-3" /> Risky
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Regular
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-gray-500">{c.phone}</span>
                    <span className="font-mono font-bold text-gray-900">
                      {formatBDT(c.total_spent || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-50">
                    <span>{c.total_orders} Orders ({c.return_count || 0} returns)</span>
                    <Link
                      to={`/customers/${c.id}`}
                      className="text-indigo-600 font-semibold"
                    >
                      History →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={(p) => fetchCustomers(p)}
          />
        </div>
      )}
    </div>
  );
}
