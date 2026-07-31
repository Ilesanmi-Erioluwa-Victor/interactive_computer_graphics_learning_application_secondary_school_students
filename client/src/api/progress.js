import api from './client.js';

export const progressApi = {
  startLesson: (lessonId, data = {}) => api.post(`/progress/lesson/${lessonId}/start`, data),
  completeLesson: (lessonId, data = {}) => api.post(`/progress/lesson/${lessonId}/complete`, data),
  getMine: () => api.get('/progress/mine'),
  getStudent: (studentId) => api.get(`/progress/student/${studentId}`),
  getClassSummary: (classId) => api.get(`/progress/class/${classId}/summary`),
};

export default progressApi;
