// src/api/tests.js
import api from './core.js';
import { auth } from '@/firebase';

/**
 * ✅ FIXED: Get available tests with fallback support
 * Fetches all tests available to a specific user.
 */
export const getAvailableTests = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // First, try the user-specific endpoint
    try {
      const { data } = await api.get(`users/${userId}/tests`, { headers });
      return data;
    } catch (error) {
      console.warn('⚠️ User tests endpoint failed, trying direct /tests endpoint:', error.message);
      // Fallback: get all general tests
      const { data } = await api.get(`tests`, { headers });
      // Ensure the response structure is consistent
      return { tests: Array.isArray(data) ? data.filter(test => test.isActive !== false) : [] };
    }
  } catch (error) {
    console.error('❌ Failed to fetch available tests:', error);
    return { tests: [], error: error.message };
  }
};

/**
 * ✅ FIXED: Get a specific test by its ID with fallback support
 */
export const getTestById = async (userId, testId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Try the user-specific endpoint first
    try {
      const { data } = await api.get(`users/${userId}/tests/${testId}`, { headers });
      return data;
    } catch (error) {
      console.warn('⚠️ User test endpoint failed, trying direct /tests/:id endpoint:', error.message);
      // Fallback: get the test directly
      const { data } = await api.get(`tests/${testId}`, { headers });
      return { test: data }; // Wrap in expected object structure
    }
  } catch (error) {
    console.error('❌ Failed to fetch test by ID:', error);
    throw error;
  }
};

/**
 * ✅ FIXED: Submit test results with fallback support
 */
export const submitTestResult = async (userId, testId, answers) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Try user-specific submission endpoint first
    try {
      const { data } = await api.post(`users/${userId}/tests/${testId}/submit`, { answers }, { headers });
      return data;
    } catch (error) {
      console.warn('⚠️ User test submit endpoint failed, trying direct submit endpoint:', error.message);
      // Fallback: use a general submission endpoint
      const { data } = await api.post(`tests/${testId}/submit`, { userId, answers }, { headers });
      return data;
    }
  } catch (error) {
    console.error('❌ Failed to submit test result:', error);
    throw error;
  }
};

/**
 * ✅ FIXED: Get the result of a previously taken test
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
 * ✅ FIXED: Get all of a user's test results
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
      // Return a consistent error/empty state format
      return { success: false, data: [] };
    }
  } catch (error) {
    console.error('❌ Failed to fetch user test results:', error);
    return { success: false, data: [], error: error.message };
  }
};