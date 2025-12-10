// src/api/promocodes.js - Frontend Promocode API Module (FIXED)
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

/**
 * Get auth token for authenticated requests
 */
const getAuthToken = async () => {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return null;
        return await currentUser.getIdToken();
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

/**
 * Apply a promocode to the current user's account
 * @param {string} code - The promocode to apply
 * @returns {Promise<Object>} Result with success status and subscription details
 */
export const applyPromocode = async (code) => {
    console.log('🎟️ [promocodes.js] applyPromocode called with code:', code);

    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error('❌ [promocodes.js] No current user');
            return {
                success: false,
                message: 'Необходимо войти в систему для применения промокода'
            };
        }

        const token = await currentUser.getIdToken();
        const userId = currentUser.uid;

        console.log('🎟️ [promocodes.js] Making API request to apply promocode');
        console.log('🎟️ [promocodes.js] User ID:', userId.substring(0, 8) + '...');
        console.log('🎟️ [promocodes.js] Code:', code);
        console.log('🎟️ [promocodes.js] Endpoint: /api/promocodes/apply');

        // FIXED: Use correct endpoint /api/promocodes/apply
        const response = await fetch(`${BASE_URL}/api/promocodes/apply`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code.trim().toUpperCase()
            })
        });

        console.log('🎟️ [promocodes.js] Response status:', response.status);

        const result = await response.json();
        console.log('🎟️ [promocodes.js] Response body:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('✅ [promocodes.js] Promocode applied successfully');

            // Extract plan info from response (handle different response formats)
            const plan = result.promocode?.grantsPlan || result.user?.subscriptionPlan || result.plan || 'pro';
            const subscriptionDays = result.promocode?.subscriptionDays || 30;
            const expiryDate = result.user?.subscriptionExpiryDate || result.user?.subscriptionEndDate || result.expiryDate || null;

            return {
                success: true,
                message: result.message || 'Промокод успешно применён!',
                plan: plan,
                subscriptionDays: subscriptionDays,
                durationText: result.promocode?.durationText || getDurationText(subscriptionDays),
                expiryDate: expiryDate,
                user: result.user
            };
        } else {
            console.error('❌ [promocodes.js] Server returned error:', result.message || result.error);
            return {
                success: false,
                message: getPromocodeErrorMessage(result.message || result.error) || 'Не удалось применить промокод'
            };
        }
    } catch (error) {
        console.error('❌ [promocodes.js] Promocode apply error:', error);

        // Check if it's a network error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return {
                success: false,
                message: 'Ошибка сети. Проверьте подключение к интернету.'
            };
        }

        return {
            success: false,
            message: 'Ошибка при применении промокода. Попробуйте позже.'
        };
    }
};

/**
 * Validate a promocode without applying it
 * @param {string} code - The promocode to validate
 * @returns {Promise<Object>} Validation result
 */
export const validatePromocode = async (code) => {
    console.log('🔍 [promocodes.js] validatePromocode called with code:', code);

    if (!code || code.trim().length < 3) {
        return {
            valid: false,
            message: 'Промокод слишком короткий'
        };
    }

    try {
        const normalizedCode = code.trim().toUpperCase();
        const url = `${BASE_URL}/api/promocodes/validate/${encodeURIComponent(normalizedCode)}`;

        console.log('🔍 [promocodes.js] Validation URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('🔍 [promocodes.js] Validation response status:', response.status);

        if (!response.ok) {
            console.error('❌ [promocodes.js] HTTP error:', response.status);
            return {
                valid: false,
                message: response.status === 404 ? 'Промокод не найден' : 'Ошибка при проверке промокода'
            };
        }

        const result = await response.json();
        console.log('🔍 [promocodes.js] Validation response:', JSON.stringify(result, null, 2));

        // Handle different response formats from the backend
        // Format 1: { valid: true, data: {...} }
        // Format 2: { success: true, data: {...} }
        // Format 3: { data: {...} } (implicit valid)

        const isValid = result?.valid === true ||
                       result?.success === true ||
                       (result?.data && !result?.error);

        if (isValid && result?.data) {
            console.log('✅ [promocodes.js] Promocode is valid');
            return {
                valid: true,
                data: {
                    code: result.data.code || normalizedCode,
                    grantsPlan: result.data.grantsPlan || result.data.plan || 'pro',
                    subscriptionDays: result.data.subscriptionDays || 30,
                    durationText: result.data.durationText || getDurationText(result.data.subscriptionDays || 30),
                    description: result.data.description,
                    expiresAt: result.data.expiresAt,
                    maxUses: result.data.maxUses,
                    currentUses: result.data.currentUses
                },
                message: 'Промокод действителен'
            };
        } else {
            console.log('❌ [promocodes.js] Promocode is invalid:', result?.error || result?.message);
            return {
                valid: false,
                message: getPromocodeErrorMessage(result?.error || result?.message) || 'Недействительный промокод'
            };
        }
    } catch (error) {
        console.error('❌ [promocodes.js] Promocode validation error:', error);

        // Check if it's a network error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return {
                valid: false,
                message: 'Ошибка сети. Проверьте подключение к интернету.'
            };
        }

        return {
            valid: false,
            message: 'Ошибка при проверке промокода'
        };
    }
};

/**
 * Get duration text from subscription days
 * @param {number} days - Number of subscription days
 * @returns {string} Human-readable duration text
 */
const getDurationText = (days) => {
    if (days <= 31) return '1 Month';
    if (days <= 45) return '1.5 Months';
    if (days <= 62) return '2 Months';
    if (days <= 95) return '3 Months';
    if (days <= 125) return '4 Months';
    if (days <= 155) return '5 Months';
    if (days <= 185) return '6 Months';
    if (days <= 270) return '9 Months';
    if (days <= 370) return '1 Year';
    return `${days} Days`;
};

/**
 * Get human-readable error message from promocode error
 * @param {string} errorMessage - The error message from API
 * @returns {string} Localized error message
 */
export const getPromocodeErrorMessage = (errorMessage) => {
    if (!errorMessage) return null;

    const errorMessages = {
        // Backend error messages
        'Promo code is required': 'Введите промокод',
        'Promocode is required': 'Введите промокод',
        'Invalid or inactive promocode': 'Недействительный или неактивный промокод',
        'Invalid promocode': 'Недействительный промокод',
        'Promocode not found or is inactive': 'Промокод не найден или неактивен',
        'Promocode not found': 'Промокод не найден',
        'Promo code not found': 'Промокод не найден',
        'This promo code has expired': 'Срок действия промокода истёк',
        'This promocode has expired': 'Срок действия промокода истёк',
        'expired': 'Срок действия промокода истёк',
        'This promo code has reached its usage limit': 'Лимит использования промокода исчерпан',
        'This promocode has reached its maximum usage limit': 'Лимит использования промокода исчерпан',
        'usage limit': 'Лимит использования промокода исчерпан',
        'You have already used this promo code': 'Вы уже использовали этот промокод',
        'You have already used this promocode': 'Вы уже использовали этот промокод',
        'already used': 'Вы уже использовали этот промокод',
        'This promo code is not available for your account': 'Промокод недоступен для вашего аккаунта',
        'not available': 'Промокод недоступен',
        'User not found': 'Пользователь не найден',
        'User ID and promo code are required': 'Необходимо ввести промокод',
        'Server error while applying promocode': 'Ошибка сервера при применении промокода',
        'server error': 'Ошибка сервера. Попробуйте позже.',
        'Promocode is inactive': 'Промокод неактивен',
        'Authentication required': 'Необходима авторизация',
        'Unauthorized': 'Необходима авторизация',
        'Network error': 'Ошибка сети. Проверьте подключение к интернету.'
    };

    // Check for exact match
    if (errorMessages[errorMessage]) {
        return errorMessages[errorMessage];
    }

    // Check for partial match
    for (const [key, value] of Object.entries(errorMessages)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    return errorMessage;
};

export default {
    applyPromocode,
    validatePromocode,
    getPromocodeErrorMessage
};
