import api from './client.js';

export const classApi = {
  getMyClasses: () => api.get('/classes/mine'),
  createClass: (data) => api.post('/classes', data),
  updateClass: (id, data) => api.put(`/classes/${id}`, data),
  getClassStudents: (id) => api.get(`/classes/${id}/students`),
  removeStudent: (classId, studentId) => api.delete(`/classes/${classId}/students/${studentId}`),
  deleteClass: (id) => api.delete(`/classes/${id}`),
  joinClass: (classCode) => api.post('/classes/join', { classCode }),
};

export default classApi;
