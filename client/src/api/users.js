import api from './client.js';

export const userApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  approveTeacher: (id) => api.put(`/admin/users/${id}/approve`),
  getReportsOverview: () => api.get('/admin/reports/overview'),
};

export default userApi;
