import api from './axios';

export const getSettingsApi = () => api.get('/settings');
export const updateSettingsApi = (data) => api.put('/settings', data);
export const uploadLogoApi = (formData) =>
  api.post('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
