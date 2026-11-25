import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Eye,
} from 'lucide-react';
import { getProductsApi } from '../../api/products';
import { formatBDT } from '../../utils/currency';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { useAuth } from '../../hooks/useAuth';

export default function ProductList() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('low_stock') === 'true');

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProductsApi({
        page,
        limit: 15,
        search: search.trim() || undefined,
        low_stock: lowStockOnly ? 'true' : undefined,
      });
      const data = res.data;
      setProducts(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
    } catch (err) {
      setError(err.response?.data?.error || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [lowStockOnly]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(1);
  };

  return (
    <div className="space-y-4">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t('pages.products')}
          </h1>
          <p className="text-xs text-gray-500">
            Inventory stock levels, costs and pricing
          </p>
        </div>
        {user?.role === 'admin' && (
          <Link
            to="/products/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('buttons.addProduct')}</span>
          </Link>
        )}
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
            placeholder={t('products.searchProducts')}
            className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition ${
              lowStockOnly
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('products.lowStock')}</span>
          </button>

          {(search || lowStockOnly) && (
            <button
              onClick={() => {
                setSearch('');
                setLowStockOnly(false);
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
        <ErrorState message={error} onRetry={() => fetchProducts(pagination.page)} />
      ) : products.length === 0 ? (
        <EmptyState
          title={t('messages.noProducts')}
          description="Add products to your catalog to track stock and sell on Facebook / WhatsApp"
          actionText={t('buttons.addProduct')}
          onAction={() => navigate('/products/new')}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">{t('products.productName')}</th>
                  <th className="py-3 px-4">{t('products.sku')}</th>
                  <th className="py-3 px-4">{t('products.category')}</th>
                  <th className="py-3 px-4 text-right">{t('products.buyingPrice')}</th>
                  <th className="py-3 px-4 text-right">{t('products.sellingPrice')}</th>
                  <th className="py-3 px-4 text-center">{t('products.stock')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const isLow = p.stock_quantity <= p.low_stock_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4">
                        <Link
                          to={`/products/${p.id}`}
                          className="font-semibold text-gray-900 hover:text-indigo-600"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-500">{p.sku}</td>
                      <td className="py-3 px-4 text-gray-500">{p.category || 'General'}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-500">
                        {formatBDT(p.cost_price || p.buying_cost || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                        {formatBDT(p.sale_price || p.selling_price || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/products/${p.id}/stock`}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition"
                            title={t('products.stockAdjust')}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/products/${p.id}`}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition"
                            title={t('common.details')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {products.map((p) => {
              const isLow = p.stock_quantity <= p.low_stock_threshold;
              return (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/products/${p.id}`}
                      className="font-bold text-sm text-gray-900 hover:text-indigo-600"
                    >
                      {p.name}
                    </Link>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.stock_quantity} in stock
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-mono text-gray-400">{p.sku}</span>
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      {formatBDT(p.sale_price || p.selling_price || 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Link
                      to={`/products/${p.id}/stock`}
                      className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md"
                    >
                      Adjust Stock
                    </Link>
                    <Link
                      to={`/products/${p.id}`}
                      className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md"
                    >
                      Details
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
            onPageChange={(p) => fetchProducts(p)}
          />
        </div>
      )}
    </div>
  );
}
