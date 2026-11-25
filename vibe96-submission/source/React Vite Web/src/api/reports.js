import api from './axios';

export const getDashboardStatsApi = () => api.get('/reports/dashboard');
export const getProfitReportApi = (params) => api.get('/reports/profit', { params });
export const exportOrdersCsvApi = (params) =>
  api.get('/reports/orders/export', {
    params,
    responseType: 'blob',
  });
