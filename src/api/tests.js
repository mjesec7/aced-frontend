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
      console.warn('⚠️ User tests endpoint failed, trying direct:', error.message);
      const { data } = await api.get(`tests`, { headers });
      return { tests: Array.isArray(data) ? data.filter(test => test.isActive !== false) : [] };
    }
  } catch (error) {
    console.error('❌ Failed to fetch available tests:', error);
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
      console.warn('⚠️ User test endpoint failed, trying direct:', error.message);
      const { data } = await api.get(`tests/${testId}`, { headers });
      return { test: data };
    }
  } catch (error) {
    console.error('❌ Failed to fetch test by ID:', error);
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
      console.warn('⚠️ User test submit endpoint failed, trying direct:', error.message);
      const { data } = await api.post(`tests/${testId}/submit`, { userId, answers }, { headers });
      return data;
    }
  } catch (error) {
    console.error('❌ Failed to submit test result:', error);
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
    console.error('❌ Failed to fetch test result:', error);
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
      console.warn('⚠️ User test results endpoint failed:', error.message);
      return { success: false, data: [] };
    }
  } catch (error) {
    console.error('❌ Failed to fetch user test results:', error);
    return { success: false, data: [], error: error.message };
  }
};