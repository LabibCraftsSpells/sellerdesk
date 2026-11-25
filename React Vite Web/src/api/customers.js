import api from './axios';

export const getCustomersApi = (params) => api.get('/customers', { params });
export const getCustomerApi = (id) => api.get(`/customers/${id}`);
export const lookupCustomerByPhoneApi = (phone) => api.get(`/customers/lookup?phone=${phone}`);
export const checkRecentOrderApi = (phone) => api.get(`/customers/recent-order?phone=${phone}`);
