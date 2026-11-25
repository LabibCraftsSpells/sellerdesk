import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import { getOrderApi } from '../../api/orders';
import { useSettings } from '../../hooks/useSettings';
import { formatBDT } from '../../utils/currency';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Invoice() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = useSettings();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getOrderApi(orderId);
        setOrder(res.data);
      } catch (err) {
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId, navigate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner size="lg" text={t('messages.loading')} />;
  if (!order) return null;

  const items = order.items || [];
  const businessName = settings?.businessName || 'SellerDesk Store';
  const businessPhone = settings?.businessPhone || '01700000000';
  const businessAddress = settings?.businessAddress || 'Dhaka, Bangladesh';
  const invoiceFooter = settings?.invoiceFooter || 'Thank you for shopping with us!';

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Action buttons (hidden on print) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => navigate(`/orders/${orderId}`)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-2xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice & Slip</span>
          </button>
        </div>
      </div>

      {/* ── PART 1: FULL INVOICE ───────────────────────────────── */}
      <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between pb-8 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {businessName}
            </h1>
            <p className="text-xs text-gray-500 mt-1">{businessAddress}</p>
            <p className="text-xs text-gray-500">Phone: {businessPhone}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              INVOICE
            </span>
            <p className="text-sm font-black text-gray-900 font-mono mt-2">
              {order.order_number}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Date: {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Bill to */}
        <div className="py-6 border-b border-gray-200 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-400 font-semibold uppercase tracking-wider block mb-1">
              Bill / Ship To:
            </span>
            <p className="font-bold text-gray-900 text-sm">{order.customer_name}</p>
            <p className="font-mono text-gray-600 mt-0.5">{order.customer_phone}</p>
            <p className="text-gray-600 mt-1 max-w-xs">
              {order.customer_address || order.full_address || order.address || '—'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-gray-400 font-semibold uppercase tracking-wider block mb-1">
              Order Details:
            </span>
            <p className="text-gray-700">Courier: <span className="font-semibold">{order.courier || '—'}</span></p>
            {order.tracking_id && (
              <p className="text-gray-700 font-mono">Tracking: {order.tracking_id}</p>
            )}
            <p className="text-gray-700 uppercase font-semibold mt-1">
              Payment: {order.payment_method}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                <th className="pb-3">Item Description</th>
                <th className="pb-3 text-center">Qty</th>
                <th className="pb-3 text-right">Unit Price</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((itm) => (
                <tr key={itm.id}>
                  <td className="py-3 font-semibold text-gray-800">
                    {itm.product_name}
                  </td>
                  <td className="py-3 text-center font-bold text-gray-900">
                    {itm.quantity}
                  </td>
                  <td className="py-3 text-right font-mono text-gray-600">
                    {formatBDT(itm.unit_price)}
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-gray-900">
                    {formatBDT(itm.unit_price * itm.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="pt-4 border-t border-gray-200 flex flex-col items-end text-xs space-y-1.5">
          <div className="flex justify-between w-60 text-gray-600">
            <span>Subtotal:</span>
            <span className="font-mono">{formatBDT(order.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between w-60 text-gray-600">
            <span>Delivery Fee:</span>
            <span className="font-mono">+{formatBDT(order.delivery_charge || 0)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between w-60 text-gray-600">
              <span>Discount:</span>
              <span className="font-mono text-rose-600">-{formatBDT(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between w-60 text-sm font-black text-gray-900 pt-2 border-t border-gray-300">
            <span>Total:</span>
            <span className="font-mono text-indigo-700">{formatBDT(order.total || 0)}</span>
          </div>
          {order.payment_method === 'cod' && (
            <div className="flex justify-between w-60 text-xs font-bold text-amber-700 pt-1">
              <span>Cash on Delivery:</span>
              <span className="font-mono">{formatBDT(order.cod_amount || 0)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          <p className="italic">{invoiceFooter}</p>
          <p className="text-[10px] mt-1 text-gray-300">Powered by SellerDesk</p>
        </div>
      </div>

      {/* Page break for printing */}
      <div className="my-8 border-t-2 border-dashed border-gray-300 print:break-before-page print:border-none print:my-0" />

      {/* ── PART 2: COMPACT COURIER SLIP ─────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border-2 border-gray-800 shadow-sm print:shadow-none print:border-2 print:border-black max-w-md mx-auto">
        <div className="flex items-center justify-between pb-3 border-b-2 border-gray-800">
          <div>
            <h2 className="text-base font-black uppercase text-gray-900">
              {order.courier || 'COURIER'} SLIP
            </h2>
            <p className="text-[11px] text-gray-500 font-mono">
              From: {businessName} ({businessPhone})
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono font-black text-base text-gray-900">
              {order.order_number}
            </span>
          </div>
        </div>

        <div className="py-4 space-y-2 text-xs border-b-2 border-gray-800">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">
              Deliver To:
            </span>
            <p className="text-sm font-black text-gray-900">{order.customer_name}</p>
            <p className="text-sm font-mono font-black text-indigo-700 mt-0.5">
              {order.customer_phone}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-gray-500 uppercase font-semibold block">
              Destination Address:
            </span>
            <p className="text-xs font-semibold text-gray-800 leading-snug">
              {order.customer_address || order.full_address || order.address || '—'}
            </p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">
              Payment Condition:
            </span>
            <span className="text-xs font-black uppercase text-gray-800">
              {order.payment_method === 'cod' ? 'CASH ON DELIVERY' : 'PAID IN ADVANCE'}
            </span>
          </div>

          <div className="text-right bg-black text-white px-4 py-2 rounded-lg print:bg-black print:text-white">
            <span className="text-[10px] uppercase font-bold block text-gray-300">
              COD Amount
            </span>
            <span className="text-xl font-black font-mono">
              {formatBDT(order.payment_method === 'cod' ? (order.cod_amount || 0) : 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
