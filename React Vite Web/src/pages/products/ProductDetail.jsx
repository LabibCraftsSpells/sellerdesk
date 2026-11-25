import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  SlidersHorizontal,
  Package,
  AlertTriangle,
  History,
  Tag,
  DollarSign,
} from 'lucide-react';
import { getProductApi } from '../../api/products';
import { formatBDT } from '../../utils/currency';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProductApi(id);
      setProduct(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" text={t('messages.loading')} />;
  if (error) return <ErrorState message={error} onRetry={fetchProduct} />;
  if (!product) return null;

  const isLow = product.stock_quantity <= product.low_stock_threshold;
  const stockMovements = product.stock_movements || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="p-2 text-gray-400 hover:text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {product.name}
            </h1>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{product.sku}</p>
          </div>
        </div>

        <Link
          to={`/products/${product.id}/stock`}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{t('products.stockAdjust')}</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">Selling Price</span>
          <p className="text-lg font-bold font-mono text-gray-900 mt-1">
            {formatBDT(product.sale_price || product.selling_price || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">Buying Cost</span>
          <p className="text-lg font-bold font-mono text-gray-600 mt-1">
            {formatBDT(product.cost_price || product.buying_cost || 0)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">Est. Unit Profit</span>
          <p className="text-lg font-bold font-mono text-emerald-600 mt-1">
            {formatBDT(
              Math.max(
                0,
                (product.sale_price || product.selling_price || 0) -
                  (product.cost_price || product.buying_cost || 0)
              )
            )}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[11px] text-gray-400 font-medium">Current Stock</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`text-lg font-black font-mono ${
                isLow ? 'text-amber-600' : 'text-gray-900'
              }`}
            >
              {product.stock_quantity}
            </span>
            {isLow && (
              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-semibold">
                Low Stock
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stock Movement Log Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">
            {t('products.stockHistory')}
          </h2>
        </div>

        {stockMovements.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">
            No stock movements logged yet.
          </p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="py-2.5 px-4">{t('common.type')}</th>
                <th className="py-2.5 px-4 text-center">{t('form.quantity')}</th>
                <th className="py-2.5 px-4">{t('products.reason')}</th>
                <th className="py-2.5 px-4 text-right">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stockMovements.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 px-4 font-semibold capitalize text-gray-800">
                    {m.type}
                  </td>
                  <td className="py-3 px-4 text-center font-bold font-mono">
                    {m.type === 'deducted' || m.type === 'damaged' ? `-${m.quantity}` : `+${m.quantity}`}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{m.reason || '—'}</td>
                  <td className="py-3 px-4 text-right text-gray-400 font-mono text-[11px]">
                    {new Date(m.created_at).toLocaleString()}
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
