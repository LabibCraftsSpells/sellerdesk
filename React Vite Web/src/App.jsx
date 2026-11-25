import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OrderList from './pages/orders/OrderList';
import OrderCreate from './pages/orders/OrderCreate';
import OrderDetail from './pages/orders/OrderDetail';
import OrderEdit from './pages/orders/OrderEdit';
import ProductList from './pages/products/ProductList';
import ProductCreate from './pages/products/ProductCreate';
import ProductDetail from './pages/products/ProductDetail';
import StockAdjust from './pages/products/StockAdjust';
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import CODTracker from './pages/cod/CODTracker';
import CourierSettle from './pages/cod/CourierSettle';
import Reports from './pages/reports/Reports';
import ProfitReport from './pages/reports/ProfitReport';
import Invoice from './pages/invoice/Invoice';
import Settings from './pages/settings/Settings';
import ChangePassword from './pages/profile/ChangePassword';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/invoice/:orderId" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/new" element={<OrderCreate />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="orders/:id/edit" element={<OrderEdit />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<AdminRoute><ProductCreate /></AdminRoute>} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="products/:id/stock" element={<StockAdjust />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="cod" element={<CODTracker />} />
            <Route path="cod/settle" element={<CourierSettle />} />
            <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />
            <Route path="reports/profit" element={<AdminRoute><ProfitReport /></AdminRoute>} />
            <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
            <Route path="profile/change-password" element={<ChangePassword />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SettingsProvider>
    </AuthProvider>
  );
}
