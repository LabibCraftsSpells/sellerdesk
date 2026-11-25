import api from './axios';

export const getProductsApi = (params) => api.get('/products', { params });
export const getProductApi = (id) => api.get(`/products/${id}`);
export const createProductApi = (data) => api.post('/products', data);
export const updateProductApi = (id, data) => api.put(`/products/${id}`, data);
export const deleteProductApi = (id) => api.delete(`/products/${id}`);
export const adjustStockApi = (data) => api.post('/stock/adjust', data);
export const getLowStockProductsApi = () => api.get('/products', { params: { low_stock: 'true' } });
