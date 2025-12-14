// src/api/user.js - User Management API (FIXED - Server-First Approach)
import api from './core';
import { auth } from '@/firebase';

// =============================================
// 🔧 HELPER FUNCTIONS
// =============================================

/**
 * Get authentication token with multiple fallbacks
 */
const getAuthToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken(true); // Force refresh
    }

    // Fallback to stored token
    const storedToken = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (storedToken && storedToken.length > 20) {
      return storedToken;
    }

    return null;
  } catch (error) {
    console.error('[user.js] Error getting auth token:', error);
    return null;
  }
};

/**
 * Get user ID from various sources
 */
const resolveUserId = (userId) => {
  if (userId) return userId;

  const currentUser = auth.currentUser;
  if (currentUser?.uid) return currentUser.uid;

  return localStorage.getItem('userId') ||
    localStorage.getItem('firebaseUserId') ||
    null;
};

// =============================================
// 👤 USER MANAGEMENT API FUNCTIONS
// =============================================

/**
 * Get user info with multiple endpoint support
 * CRITICAL: This is the main function to fetch user data from server
 */
export const getUserInfo = async (userId) => {
  console.log('📡 [user.js] getUserInfo called for:', userId);

  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ [user.js] No authentication token available');
      throw new Error('No authentication token available');
    }

    const resolvedUserId = resolveUserId(userId);
    if (!resolvedUserId) {
      console.error('❌ [user.js] No user ID available');
      throw new Error('No user ID available');
    }

    const headers = { Authorization: `Bearer ${token}` };

    console.log('📡 [user.js] Fetching user from server:', resolvedUserId);
    const { data } = await api.get(`users/${resolvedUserId}`, { headers });

    console.log('✅ [user.js] Server response:', data);

    // Handle different response formats
    const userData = data.user || data.data || data;

    return {
      success: true,
      data: userData,
      user: userData,
      subscriptionPlan: userData.subscriptionPlan || 'free',
      subscriptionExpiryDate: userData.subscriptionExpiryDate,
      serverFetch: true,
      fetchTime: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ [user.js] getUserInfo error:', error);
    throw error;
  }
};

/**
 * Get user status - CRITICAL: Always fetches from server
 * This is the primary function for subscription status
 */
export const getUserStatus = async (userId) => {
  console.log('📡 [user.js] getUserStatus called for:', userId);

  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('❌ [user.js] No authentication token');
      return {
        success: false,
        error: 'No authentication token',
        status: null,
        serverFetch: false
      };
    }

    const resolvedUserId = resolveUserId(userId);
    if (!resolvedUserId) {
      console.error('❌ [user.js] No user ID');
      return {
        success: false,
        error: 'No user ID',
        status: null,
        serverFetch: false
      };
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Try multiple endpoints in order of preference
    const endpoints = [
      `users/${resolvedUserId}`,
      `users/${resolvedUserId}/status`,
      `users/${resolvedUserId}/subscription-status`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`📡 [user.js] Trying endpoint: ${endpoint}`);
        const { data } = await api.get(endpoint, { headers });

        if (data && data.success !== false) {
          // Extract user data from various response formats
          const userData = data.user || data.data || data;
          const status = userData.subscriptionPlan ||
            userData.userStatus ||
            userData.plan ||
            data.status ||
            'free';

          console.log('✅ [user.js] Got status from server:', status);

          return {
            success: true,
            data: userData,
            status: status,
            subscriptionPlan: status,
            subscriptionExpiryDate: userData.subscriptionExpiryDate || userData.subscriptionExpiry,
            subscriptionSource: userData.subscriptionSource,
            serverFetch: true,
            endpoint: endpoint,
            fetchTime: new Date().toISOString()
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ [user.js] Endpoint ${endpoint} failed:`, endpointError.message);
        continue;
      }
    }

    // All endpoints failed - return error, NOT default 'free'
    console.error('❌ [user.js] All endpoints failed');
    return {
      success: false,
      error: 'Could not fetch status from server',
      status: null,
      serverFetch: false
    };

  } catch (error) {
    console.error('❌ [user.js] getUserStatus error:', error);
    return {
      success: false,
      error: error.message,
      status: null,
      serverFetch: false
    };
  }
};

/**
 * CRITICAL: Fetch subscription status directly from server
 * This bypasses all caching and local storage
 */
export const fetchSubscriptionFromServer = async (userId) => {
  console.log('🔄 [user.js] fetchSubscriptionFromServer called for:', userId);

  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const resolvedUserId = resolveUserId(userId);
    if (!resolvedUserId) {
      throw new Error('No user ID');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Direct fetch from user endpoint
    const { data } = await api.get(`users/${resolvedUserId}`, { headers });

    const userData = data.user || data.data || data;

    const subscriptionData = {
      plan: userData.subscriptionPlan || 'free',
      status: (userData.subscriptionPlan && userData.subscriptionPlan !== 'free') ? 'active' : 'inactive',
      expiryDate: userData.subscriptionExpiryDate || null,
      source: userData.subscriptionSource || null,
      activatedAt: userData.subscriptionActivatedAt || null,
      duration: userData.subscriptionDuration || null,
      serverFetch: true,
      fetchTime: new Date().toISOString()
    };

    console.log('✅ [user.js] Subscription data from server:', subscriptionData);

    return {
      success: true,
      subscription: subscriptionData,
      user: userData
    };

  } catch (error) {
    console.error('❌ [user.js] fetchSubscriptionFromServer error:', error);
    return {
      success: false,
      error: error.message,
      subscription: null
    };
  }
};

/**
 * Save user with enhanced error handling
 */
export const saveUser = async (userData) => {
  console.log('📡 [user.js] saveUser called');

  try {
    const { data } = await api.post('users/save', userData);

    return {
      success: true,
      data: data,
      user: data.user || data
    };
  } catch (error) {
    console.error('❌ [user.js] saveUser error:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.put(`users/${userId}/profile`, profileData, { headers });

    return data;
  } catch (error) {
    console.error('❌ [user.js] updateUserProfile error:', error);
    throw error;
  }
};

// =============================================
// 📖 STUDY LIST MANAGEMENT
// =============================================

/**
 * Get user study list
 */
export const getUserStudyList = async (userId, forceRefresh = false) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const url = `users/${userId}/study-list${forceRefresh ? `?t=${Date.now()}` : ''}`;
    const { data } = await api.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      success: true,
      data: data.data || data || [],
      message: data.message
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        success: true,
        data: [],
        message: 'Study list not found, returning empty list'
      };
    }

    return {
      success: false,
      data: [],
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Add to study list
 */
export const addToStudyList = async (userId, topicData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No token');

    const data = {
      topicId: topicData.topicId || topicData._id,
      topic: topicData.topic || topicData.topicName || topicData.name,
      subject: topicData.subject || 'General',
      level: topicData.level || 1,
      lessonCount: topicData.lessonCount || 0,
      totalTime: topicData.totalTime || 10,
      type: topicData.type || 'free'
    };

    const response = await api.post(`users/${userId}/study-list`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Remove from study list
 */
export const removeFromStudyList = async (userId, topicId) => {
  try {
    const token = await getAuthToken();
    await api.delete(`users/${userId}/study-list/${topicId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Cleanup study list
 */
export const cleanupStudyList = async (userId) => {
  try {
    const token = await getAuthToken();
    const { data } = await api.post(`users/${userId}/study-list/cleanup`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    throw error;
  }
};

// =============================================
// 🎯 GOALS MANAGEMENT
// =============================================

/**
 * Get user goals
 */
export const getUserGoals = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/goals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create user goal
 */
export const createUserGoal = async (userId, goalData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.post(`users/${userId}/goals`, goalData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user goal
 */
export const updateUserGoal = async (userId, goalId, goalData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.put(`users/${userId}/goals/${goalId}`, goalData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete user goal
 */
export const deleteUserGoal = async (userId, goalId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.delete(`users/${userId}/goals/${goalId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    throw error;
  }
};

// =============================================
// 📔 DIARY MANAGEMENT
// =============================================

/**
 * Save diary entry
 */
export const saveDiaryEntry = async (userId, diaryData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.post(`users/${userId}/diary`, diaryData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get diary entries
 */
export const getDiaryEntries = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/diary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    throw error;
  }
};

// =============================================
// 🧬 LEARNING PROFILE
// =============================================

/**
 * Get user learning profile
 */
export const getLearningProfile = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.get(`progress/learning-profile/${userId}`, { headers });

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update learning profile from performance
 */
export const updateLearningProfile = async (userId, performanceData) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.post(`progress/learning-profile/${userId}/update`, performanceData, { headers });

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get personalized recommendations
 */
export const getPersonalizedRecommendations = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.get(`progress/learning-profile/${userId}/recommendation`, { headers });

    return data;
  } catch (error) {
    throw error;
  }
};

// =============================================
// 🎮 REWARD SYSTEM
// =============================================

/**
 * Get user rewards
 */
export const getUserRewards = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.get(`progress/rewards/${userId}`, { headers });

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Check for reward after step completion
 */
export const checkReward = async (userId, currentStep) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.post(`progress/rewards/${userId}/check`, { currentStep }, { headers });

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update user streak
 */
export const updateStreak = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.post(`progress/rewards/${userId}/streak`, {}, { headers });

    return data;
  } catch (error) {
    throw error;
  }
};

// =============================================
// 🎓 PLATFORM MODE & PLACEMENT TEST
// =============================================

/**
 * Get user's learning mode and profile
 */
export const getLearningMode = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.get(`learning-mode/${userId}`, { headers });

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Switch learning mode
 */
export const switchLearningMode = async (userId, newMode, reason = '') => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.post(`learning-mode/${userId}/switch`,
      { newMode, reason },
      { headers }
    );

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Start placement test
 */
export const startPlacementTest = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.post(`learning-mode/placement-test/${userId}/start`, {}, { headers });

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Submit placement test answer
 */
export const submitPlacementTestAnswer = async (testId, answer, timeSpent) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.post(`learning-mode/placement-test/${testId}/answer`,
      { answer, timeSpent },
      { headers }
    );

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get placement test results
 */
export const getPlacementTestResults = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.get(`learning-mode/placement-test/${userId}/results`, { headers });

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get school mode curriculum
 */
export const getSchoolCurriculum = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.get(`school/${userId}/curriculum`, { headers });

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Complete a level
 */
export const completeLevel = async (userId, levelData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.post(`school/${userId}/complete-level`,
      levelData,
      { headers }
    );

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Add bookmark to study centre
 */
export const addStudyCentreBookmark = async (userId, courseId, notes = '') => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.post(`study-centre/${userId}/bookmark`,
      { courseId, notes },
      { headers }
    );

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Create personal learning path
 */
export const createPersonalPath = async (userId, pathData) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.post(`study-centre/${userId}/create-path`,
      pathData,
      { headers }
    );

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get user's accessible content based on mode and level
 */
export const getAccessibleContent = async (userId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.get(`users/${userId}/accessible-content`, { headers });

    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Check if user can access a specific lesson
 */
export const checkLessonAccess = async (userId, lessonId) => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.get(`users/${userId}/lessons/${lessonId}/access`, { headers });

    return {
      success: true,
      canAccess: data.canAccess,
      reason: data.reason
    };
  } catch (error) {
    return {
      success: false,
      canAccess: false,
      reason: error.response?.data?.error || error.message
    };
  }
};

// =============================================
// 📤 DEFAULT EXPORT
// =============================================

export default {
  getUserInfo,
  getUserStatus,
  fetchSubscriptionFromServer,
  saveUser,
  updateUserProfile,
  getUserStudyList,
  addToStudyList,
  removeFromStudyList,
  cleanupStudyList,
  getUserGoals,
  createUserGoal,
  updateUserGoal,
  deleteUserGoal,
  saveDiaryEntry,
  getDiaryEntries,
  getLearningProfile,
  updateLearningProfile,
  getPersonalizedRecommendations,
  getUserRewards,
  checkReward,
  updateStreak,
  getLearningMode,
  switchLearningMode,
  startPlacementTest,
  submitPlacementTestAnswer,
  getPlacementTestResults,
  getSchoolCurriculum,
  completeLevel,
  addStudyCentreBookmark,
  createPersonalPath,
  getAccessibleContent,
  checkLessonAccess
};