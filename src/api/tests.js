// src/api/tests.js - Tests Management API
import api from './core';
import { auth } from '@/firebase';

// =============================================
// 📝 TESTS API FUNCTIONS
// =============================================

/**
 * Get available tests with fallback support
 */
export const getAvailableTests = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const { data } = await api.get(`users/${userId}/tests`, { headers });
      return data;
    } catch (error) {
const { data } = await api.get(`tests`, { headers });
      return { tests: Array.isArray(data) ? data.filter(test => test.isActive !== false) : [] };
    }
  } catch (error) {
return { tests: [], error: error.message };
  }
};

/**
 * Get test by ID with fallback support
 */
export const getTestById = async (userId, testId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const { data } = await api.get(`users/${userId}/tests/${testId}`, { headers });
      return data;
    } catch (error) {
const { data } = await api.get(`tests/${testId}`, { headers });
      return { test: data };
    }
  } catch (error) {
throw error;
  }
};

/**
 * Submit test result with fallback support
 */
export const submitTestResult = async (userId, testId, answers) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const { data } = await api.post(`users/${userId}/tests/${testId}/submit`, { answers }, { headers });
      return data;
    } catch (error) {
const { data } = await api.post(`tests/${testId}/submit`, { userId, answers }, { headers });
      return data;
    }
  } catch (error) {
throw error;
  }
};

/**
 * Get test result with enhanced error handling
 */
export const getTestResult = async (userId, testId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const headers = { Authorization: `Bearer ${token}` };

    const { data } = await api.get(`users/${userId}/tests/${testId}/result`, { headers });
    return data;
  } catch (error) {
throw error;
  }
};

/**
 * Get user test results
 */
export const getUserTestResults = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const { data } = await api.get(`users/${userId}/tests/results`, { headers });
      return data;
    } catch (error) {
return { success: false, data: [] };
    }
  } catch (error) {
return { success: false, data: [], error: error.message };
  }
};