// src/api/promocodes.js - Promocode Management API
import api from './core';
import { auth } from '@/firebase';

// =============================================
// 🔧 HELPER FUNCTIONS
// =============================================

const getAuthToken = async () => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken(true);
    }
    return localStorage.getItem('token') || null;
  } catch (error) {
    console.error('[promocodes.js] Error getting auth token:', error);
    return null;
  }
};

const getUserId = () => {
  const currentUser = auth.currentUser;
  if (currentUser?.uid) return currentUser.uid;

  return localStorage.getItem('userId') ||
    localStorage.getItem('firebaseUserId') ||
    null;
};

// =============================================
// 🎟️ PROMOCODE API FUNCTIONS
// =============================================

/**
 * Validate a promocode
 */
export const validatePromocode = async (code) => {


  try {
    if (!code || code.trim().length < 3) {
      return { valid: false, error: 'Promocode is too short' };
    }

    const normalizedCode = code.trim().toUpperCase();

    const { data } = await api.post('promocodes/validate', {
      code: normalizedCode
    });



    if (data.valid || data.success) {
      return {
        valid: true,
        code: normalizedCode,
        plan: data.plan || 'pro',
        duration: data.duration || 30,
        discount: data.discount || 100,
        message: data.message || 'Promocode is valid'
      };
    } else {
      return {
        valid: false,
        error: data.message || data.error || 'Invalid promocode'
      };
    }
  } catch (error) {


    if (error.response?.status === 404) {
      return { valid: false, error: 'Promocode not found' };
    }
    if (error.response?.status === 410) {
      return { valid: false, error: 'Promocode has expired' };
    }
    if (error.response?.status === 409) {
      return { valid: false, error: 'Promocode already used' };
    }

    return {
      valid: false,
      error: error.response?.data?.message || error.message || 'Failed to validate promocode'
    };
  }
};

/**
 * Apply a promocode to user account
 */
export const applyPromocode = async (code, userId = null) => {


  try {
    if (!code || code.trim().length < 3) {
      return { success: false, error: 'Promocode is too short' };
    }

    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const resolvedUserId = userId || getUserId();
    if (!resolvedUserId) {
      return { success: false, error: 'No user ID available' };
    }

    const normalizedCode = code.trim().toUpperCase();

    const headers = { Authorization: `Bearer ${token}` };

    const { data } = await api.post('promocodes/apply', {
      code: normalizedCode,
      userId: resolvedUserId
    }, { headers });



    if (data.success) {
      // Calculate expiry date
      const now = new Date();
      const durationDays = data.duration || 30;
      const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      return {
        success: true,
        message: data.message || `Promocode applied! ${(data.plan || 'Pro').toUpperCase()} activated.`,
        plan: data.plan || 'pro',
        duration: durationDays,
        expiryDate: expiryDate.toISOString(),
        promocode: normalizedCode
      };
    } else {
      return {
        success: false,
        error: data.message || data.error || 'Failed to apply promocode'
      };
    }
  } catch (error) {


    if (error.response?.status === 404) {
      return { success: false, error: 'Promocode not found' };
    }
    if (error.response?.status === 410) {
      return { success: false, error: 'Promocode has expired' };
    }
    if (error.response?.status === 409) {
      return { success: false, error: 'Promocode already used' };
    }
    if (error.response?.status === 400) {
      return { success: false, error: error.response?.data?.message || 'Invalid promocode' };
    }

    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to apply promocode'
    };
  }
};

/**
 * Get user's applied promocodes
 */
export const getUserPromocodes = async (userId = null) => {


  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated', promocodes: [] };
    }

    const resolvedUserId = userId || getUserId();
    if (!resolvedUserId) {
      return { success: false, error: 'No user ID', promocodes: [] };
    }

    const headers = { Authorization: `Bearer ${token}` };

    const { data } = await api.get(`users/${resolvedUserId}/promocodes`, { headers });

    return {
      success: true,
      promocodes: data.promocodes || data.data || []
    };
  } catch (error) {

    return {
      success: false,
      error: error.message,
      promocodes: []
    };
  }
};

/**
 * Check if user can use a specific promocode
 */
export const checkPromocodeEligibility = async (code, userId = null) => {


  try {
    const token = await getAuthToken();
    if (!token) {
      return { eligible: false, error: 'Not authenticated' };
    }

    const resolvedUserId = userId || getUserId();
    if (!resolvedUserId) {
      return { eligible: false, error: 'No user ID' };
    }

    const normalizedCode = code.trim().toUpperCase();
    const headers = { Authorization: `Bearer ${token}` };

    const { data } = await api.post('promocodes/check-eligibility', {
      code: normalizedCode,
      userId: resolvedUserId
    }, { headers });

    return {
      eligible: data.eligible || data.success,
      reason: data.reason || data.message,
      plan: data.plan
    };
  } catch (error) {

    return {
      eligible: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// =============================================
// 📤 DEFAULT EXPORT
// =============================================

export default {
  validatePromocode,
  applyPromocode,
  getUserPromocodes,
  checkPromocodeEligibility
};