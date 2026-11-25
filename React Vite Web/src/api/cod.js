import api from './axios';

export const getCODSummaryApi = () => api.get('/cod/summary');
export const getPendingCODApi = (params) => api.get('/cod/pending', { params });
export const settleCODApi = (data) => api.post('/cod/settle', data);
