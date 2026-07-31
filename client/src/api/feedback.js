import api from './client.js';

export const feedbackApi = {
  submit: (data) => api.post('/feedback', data),
  getAll: (params) => api.get('/feedback', { params }),
  respond: (id, response) => api.put(`/feedback/${id}/respond`, { response }),
};

export const notificationApi = {
  getMine: () => api.get('/notifications/mine'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default feedbackApi;
