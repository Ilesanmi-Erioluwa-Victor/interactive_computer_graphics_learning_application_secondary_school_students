import api from './client.js';

export const quizApi = {
  getQuizzes: () => api.get('/quizzes'),
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  createQuiz: (data) => api.post('/quizzes', data),
  updateQuiz: (id, data) => api.put(`/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}`),
  saveQuestions: (id, questions) => api.post(`/quizzes/${id}/questions`, { questions }),
  deleteQuestion: (id) => api.delete(`/quizzes/questions/${id}`),

  startAttempt: (id) => api.post(`/quizzes/${id}/start`),
  submitAttempt: (id, attemptId, answers) => api.post(`/quizzes/${id}/submit`, { attemptId, answers }),
  getMyAttempts: (id) => api.get(`/quizzes/${id}/attempts/mine`),
  getAttempt: (id, attemptId) => api.get(`/quizzes/${id}/attempts/${attemptId}`),
};

export default quizApi;
