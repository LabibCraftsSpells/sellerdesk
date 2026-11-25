import api from './axios';

export const loginApi = (credentials) => api.post('/auth/login', credentials);
export const logoutApi = () => api.post('/auth/logout');
export const getMeApi = () => api.get('/auth/me');
export const changePasswordApi = (data) => api.put('/auth/change-password', data);

// Team & User Management (Admin only)
export const getUsersApi = () => api.get('/auth/users');
export const createUserApi = (data) => api.post('/auth/users', data);
export const updateUserApi = (id, data) => api.put(`/auth/users/${id}`, data);
export const deleteUserApi = (id) => api.delete(`/auth/users/${id}`);
