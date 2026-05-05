import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const kahootAPI = {
  // Health & Info
  getHealth: () => api.get('/health'),

  // Admin Authentication
  adminLogin: (username, password) => 
    api.post('/admin/login', { username, password }),
  
  adminLogout: (token) => 
    api.post('/admin/logout', null, { params: { token } }),
  
  // Admin
  getAdminRooms: (token) => 
    api.get('/admin/rooms', { params: { token } }),
  
  deleteAdminRoom: (code, token) => 
    api.delete(`/admin/rooms/${code}`, { params: { token } }),
  
  // Room Management
  createRoom: (topic, hostId) => 
    api.post('/rooms', { topic, host_id: hostId }),
  
  getRoom: (code) => 
    api.get(`/rooms/${code}`),
  
  // Questions
  getQuestions: (code) => 
    api.get(`/rooms/${code}/questions`),

  generateAIQuestions: (code, payload = {}) =>
    api.post(`/rooms/${code}/questions/generate-ai`, payload),
  
  addQuestion: (code, question) => 
    api.post(`/rooms/${code}/questions`, question),
  
  updateQuestion: (code, questionId, question) => 
    api.put(`/rooms/${code}/questions/${questionId}`, question),
  
  deleteQuestion: (code, questionId) => 
    api.delete(`/rooms/${code}/questions/${questionId}`),
  
  // Gameplay
  joinRoom: (code, playerName) => 
    api.post(`/rooms/${code}/join`, { player_name: playerName }),
  
  startGame: (code) => 
    api.post(`/rooms/${code}/start`),
  
  getCurrentQuestion: (code) => 
    api.get(`/rooms/${code}/current-question`),

  getCurrentProgress: (code) =>
    api.get(`/rooms/${code}/current-progress`),
  
  submitAnswer: (code, playerId, answer, timeTaken) => 
    api.post(`/rooms/${code}/answer`, {
      player_id: playerId,
      answer: answer,
      time_taken: timeTaken,
    }),
  
  getLeaderboard: (code) => 
    api.get(`/rooms/${code}/leaderboard`),
  
  nextQuestion: (code) => 
    api.post(`/rooms/${code}/next`),
};

export default kahootAPI;
