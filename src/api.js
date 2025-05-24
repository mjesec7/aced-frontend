// src/api.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.warn('⚠️ VITE_API_BASE_URL is not defined in your .env file!');
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('✅ API Base URL:', BASE_URL);

// 🔐 Attach token to requests if needed
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ User Progress
export const submitProgress = (userId, progressData) =>
  api.post(`/user-progress`, { userId, ...progressData });

export const getLessonProgress = (userId, lessonId) =>
  api.get(`/user-progress/user/${userId}/lesson/${lessonId}`);

export const getUserProgress = (userId) =>
  api.get(`/user-progress/user/${userId}`);

// ✅ Tests
export const getAvailableTests = (userId) =>
  api.get(`/users/${userId}/tests`);

export const getTestById = (userId, testId) =>
  api.get(`/users/${userId}/tests/${testId}`);

export const submitTestResult = (userId, testId, answers) =>
  api.post(`/users/${userId}/tests/${testId}/submit`, { answers });

export const getTestResult = (userId, testId) =>
  api.get(`/users/${userId}/tests/${testId}/result`);

// ✅ Homework
export const getHomeworkByLesson = (userId, lessonId) =>
  api.get(`/users/${userId}/homeworks/lesson/${lessonId}`);

export const saveHomework = (userId, lessonId, answers) =>
  api.post(`/users/${userId}/homeworks/save`, { lessonId, answers, completed: false });

export const submitHomework = (userId, lessonId, answers) =>
  api.post(`/users/${userId}/homeworks/lesson/${lessonId}/submit`, { answers });

// ✅ Diary
export const saveDiaryEntry = (userId, diaryData) =>
  api.post(`/users/${userId}/diary`, diaryData);

export const getDiaryEntries = (userId) =>
  api.get(`/users/${userId}/diary`);

// ✅ Analytics
export const getUserAnalytics = (userId) =>
  api.get(`/analytics/${userId}`);

// ✅ General Lesson Access
export const getLessonById = (lessonId) =>
  api.get(`/lessons/${lessonId}`);

export const getAllLessons = () =>
  api.get(`/lessons`);

export default api;
