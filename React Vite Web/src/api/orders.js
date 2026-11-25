import api from './axios';

export const getOrdersApi = (params) => api.get('/orders', { params });
export const getOrderApi = (id) => api.get(`/orders/${id}`);
export const createOrderApi = (data) => api.post('/orders', data);
export const updateOrderApi = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrderApi = (id) => api.delete(`/orders/${id}`);
export const updateOrderStatusApi = (id, status, note) =>
  api.put(`/orders/${id}`, { status, note });
export const bulkUpdateStatusApi = (order_ids, status, note) =>
  api.put('/orders/bulk-status', { order_ids, status, note });
export const getOrderTimelineApi = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return { data: data.status_history || data.history || [] };
};
