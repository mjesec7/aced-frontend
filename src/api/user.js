// src/api/user.js
import api from './core.js';
import { auth } from '@/firebase';

// =============================================
// 👤 USER MANAGEMENT API FUNCTIONS
// =============================================

/**
 * ✅ FIXED: Get user info with multiple endpoint support.
 * Fetches the main profile information for a user.
 */
export const getUserInfo = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token available');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.get(`users/${userId}`, { headers });
    return data;
  } catch (error) {
    console.error('❌ Failed to fetch user info:', error);
    throw error;
  }
};

/**
 * ✅ FIXED: Get user status (subscription plan) with multiple endpoint support.
 */
export const getUserStatus = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const headers = { Authorization: `Bearer ${token}` };
    const endpoints = [`users/${userId}/status`, `users/${userId}`, `user/${userId}/status`, `user/${userId}`];

    for (const endpoint of endpoints) {
      try {
        const { data } = await api.get(endpoint, { headers });
        if (data && data.success !== false) {
          const statusData = data.data || data;
          return {
            success: true,
            data: statusData,
            status: statusData.subscriptionPlan || statusData.userStatus || 'free'
          };
        }
      } catch (endpointError) {
        console.warn(`⚠️ Status endpoint ${endpoint} failed:`, endpointError.message);
      }
    }

    return { success: true, data: { subscriptionPlan: 'free' }, status: 'free' };
  } catch (error) {
    console.error('❌ Failed to get user status:', error);
    return { success: false, data: { subscriptionPlan: 'free' }, status: 'free', error: error.message };
  }
};

/**
 * ✅ FIXED: Save user data, often used during registration.
 * This uses an emergency/fallback route for reliability.
 */
export const saveUser = async (userData) => {
  try {
    const { data } = await api.post('users/save', userData);
    return { success: true, data: data };
  } catch (error) {
    console.error('❌ Failed to save user:', error);
    throw error;
  }
};

/**
 * ✅ FIXED: Update a user's profile information.
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token available');

    const headers = { Authorization: `Bearer ${token}` };
    const { data } = await api.put(`users/${userId}/profile`, profileData, { headers });
    return data;
  } catch (error) {
    console.error('❌ Failed to update user profile:', error);
    throw error;
  }
};

// =============================================
// 📖 STUDY LIST MANAGEMENT
// =============================================

export const getUserStudyList = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/study-list`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { success: true, data: data.data || data || [], message: data.message };
  } catch (error) {
    console.error('❌ Failed to get study list:', error);
    if (error.response?.status === 404) {
      return { success: true, data: [], message: 'Study list not found, returning empty list' };
    }
    return { success: false, data: [], error: error.response?.data?.error || error.message };
  }
};

export const addToStudyList = async (userId, topicData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No token');

    const payload = {
      topicId: topicData.topicId || topicData._id,
      topic: topicData.topic || topicData.topicName || topicData.name,
      subject: topicData.subject || 'General',
      level: topicData.level || 1,
      lessonCount: topicData.lessonCount || 0,
      totalTime: topicData.totalTime || 10,
      type: topicData.type || 'free'
    };

    const response = await api.post(`users/${userId}/study-list`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const removeFromStudyList = async (userId, topicId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No token');

    await api.delete(`users/${userId}/study-list/${topicId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

export const cleanupStudyList = async (userId) => {
    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('No token');

        const { data } = await api.post(`users/${userId}/study-list/cleanup`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return data;
    } catch (error) {
        console.error('❌ Failed to cleanup study list:', error);
        throw error;
    }
};


// =============================================
// 🎯 RECOMMENDATIONS AND ANALYTICS
// =============================================

export const getRecommendations = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/recommendations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get recommendations:', error);
    throw error;
  }
};

export const getUserProgressStats = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/progress`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get progress stats:', error);
    throw error;
  }
};

export const getLessonProgressStats = async (userId, lessonId) => {
    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('No authentication token');

        const { data } = await api.get(`users/${userId}/progress/lesson/${lessonId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return data;
    } catch (error) {
        console.error('❌ Failed to get lesson progress stats:', error);
        throw error;
    }
};

export const getTopicsProgress = async (userId) => {
    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('No authentication token');

        const { data } = await api.get(`users/${userId}/topics-progress`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return data;
    } catch (error) {
        console.error('❌ Failed to get topics progress:', error);
        throw error;
    }
};

export const getUserPoints = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/points`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user points:', error);
    throw error;
  }
};

export const getUserAnalytics = async (userId) => {
    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('No authentication token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            const { data } = await api.get(`users/${userId}/analytics`, { headers });
            return data;
        } catch (error) {
            console.warn('⚠️ User analytics endpoint failed, trying fallback:', error.message);
            const { data } = await api.get(`analytics/${userId}`, { headers });
            return data;
        }
    } catch (error) {
        console.error('❌ Failed to fetch user analytics:', error);
        throw error;
    }
};

export const getUserStats = async (userId) => {
    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('No authentication token');
        const { data } = await api.get(`users/${userId}/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return data;
    } catch (error) {
        console.error('❌ Failed to get user stats:', error);
        throw error;
    }
};

export const getUserAchievements = async (userId) => {
    try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) throw new Error('No authentication token');
        const { data } = await api.get(`users/${userId}/achievements`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return data;
    } catch (error) {
        console.error('❌ Failed to get user achievements:', error);
        throw error;
    }
};

// =============================================
// 🎯 GOALS MANAGEMENT
// =============================================

export const getUserGoals = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/goals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get user goals:', error);
    throw error;
  }
};

export const createUserGoal = async (userId, goalData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.post(`users/${userId}/goals`, goalData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to create user goal:', error);
    throw error;
  }
};

export const updateUserGoal = async (userId, goalId, goalData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.put(`users/${userId}/goals/${goalId}`, goalData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to update user goal:', error);
    throw error;
  }
};

export const deleteUserGoal = async (userId, goalId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.delete(`users/${userId}/goals/${goalId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to delete user goal:', error);
    throw error;
  }
};

// =============================================
// 📔 DIARY MANAGEMENT
// =============================================

export const saveDiaryEntry = async (userId, diaryData) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.post(`users/${userId}/diary`, diaryData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to save diary entry:', error);
    throw error;
  }
};

export const getDiaryEntries = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`users/${userId}/diary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get diary entries:', error);
    throw error;
  }
};