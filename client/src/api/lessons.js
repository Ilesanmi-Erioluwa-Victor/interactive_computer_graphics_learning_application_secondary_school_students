import api from './client.js';

export const lessonApi = {
  getModules: () => api.get('/modules'),
  getModule: (id) => api.get(`/modules/${id}`),
  createModule: (data) => api.post('/modules', data),
  updateModule: (id, data) => api.put(`/modules/${id}`, data),
  deleteModule: (id) => api.delete(`/modules/${id}`),
  reorderLessons: (moduleId, items) => api.patch(`/modules/${moduleId}/reorder`, { items }),

  createLesson: (moduleId, data) => api.post(`/modules/${moduleId}/lessons`, data),
  getLesson: (id) => api.get(`/lessons/${id}`),
  updateLesson: (id, data) => api.put(`/lessons/${id}`, data),
  deleteLesson: (id) => api.delete(`/lessons/${id}`),
  uploadMedia: (id, formData) =>
    api.post(`/lessons/${id}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
};

export default lessonApi;
