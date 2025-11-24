// src/api/user.js - User Management API
import api from './core';
import { auth } from '@/firebase';

// =============================================
// 👤 USER MANAGEMENT API FUNCTIONS
// =============================================

/**
 * Get user info with multiple endpoint support
 */
export const getUserInfo = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };

    const { data } = await api.get(`users/${userId}`, { headers });
    return data;
  } catch (error) {
throw error;
  }
};

/**
 * Get user status with multiple endpoint support
 */
export const getUserStatus = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Try multiple endpoints for user status
    const endpoints = [
      `users/${userId}/status`,
      `users/${userId}`,
      `user/${userId}/status`,
      `user/${userId}`
    ];

    for (const endpoint of endpoints) {
      try {
        const { data } = await api.get(endpoint, { headers });

        if (data && (data.success !== false)) {
          return {
            success: true,
            data: data.data || data,
            status: data.status || data.subscriptionPlan || data.data?.subscriptionPlan || 'free'
          };
        }
      } catch (endpointError) {
continue;
      }
    }

    // If all fail, return default
    return {
      success: true,
      data: { subscriptionPlan: 'free' },
      status: 'free'
    };

  } catch (error) {
return {
      success: false,
      data: { subscriptionPlan: 'free' },
      status: 'free',
      error: error.message
    };
  }
};

/**
 * Save user with enhanced error handling
 */
export const saveUser = async (userData) => {
  try {
    const { data } = await api.post('users/save', userData);

    return {
      success: true,
      data: data
    };
  } catch (error) {
throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };

    const { data } = await api.put(`users/${userId}/profile`, profileData, { headers });
    return data;
  } catch (error) {
throw error;
  }
};

// =============================================
// 📖 STUDY LIST MANAGEMENT
// =============================================

/**
 * Get user study list
 */
export const getUserStudyList = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/study-list`, {
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
// 🧬 LEARNING PROFILE (UPDATED PATHS)
// =============================================

/**
 * Get user learning profile
 */
export const getLearningProfile = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    // ✅ FIXED: Add 'progress/' prefix
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
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    // ✅ FIXED: Add 'progress/' prefix
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
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    // ✅ FIXED: Add 'progress/' prefix
    const { data } = await api.get(`progress/learning-profile/${userId}/recommendation`, { headers });
    
    return data;
  } catch (error) {
throw error;
  }
};

// =============================================
// 🎮 REWARD SYSTEM (UPDATED PATHS)
// =============================================

/**
 * Get user rewards
 */
export const getUserRewards = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    // ✅ FIXED: Add 'progress/' prefix
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
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    // ✅ FIXED: Add 'progress/' prefix
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
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = { Authorization: `Bearer ${token}` };
    // ✅ FIXED: Add 'progress/' prefix
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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
    const token = await auth.currentUser?.getIdToken();
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