// src/api/promocodes.js - Frontend Promocode API Module
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
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            return {
                success: false,
                message: 'Необходимо войти в систему для применения промокода'
            };
        }

        const token = await currentUser.getIdToken();
        const userId = currentUser.uid;

        const response = await fetch(`${BASE_URL}/api/payments/promo-code`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                promoCode: code.trim().toUpperCase()
            })
        });

        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                message: result.message || 'Промокод успешно применён!',
                plan: result.plan,
                subscriptionDays: result.promocode?.subscriptionDays,
                durationText: result.promocode?.durationText,
                expiryDate: result.user?.subscriptionEndDate
            };
        } else {
            return {
                success: false,
                message: result.message || 'Не удалось применить промокод'
            };
        }
    } catch (error) {
        console.error('❌ Promocode apply error:', error);
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
    try {
        const response = await fetch(`${BASE_URL}/api/promocodes/validate/${encodeURIComponent(code.trim().toUpperCase())}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success && result.valid) {
            return {
                valid: true,
                data: result.data,
                message: 'Промокод действителен'
            };
        } else {
            return {
                valid: false,
                message: result.error || 'Недействительный промокод'
            };
        }
    } catch (error) {
        console.error('❌ Promocode validation error:', error);
        return {
            valid: false,
            message: 'Ошибка при проверке промокода'
        };
    }
};

/**
 * Get human-readable error message from promocode error
 * @param {string} errorMessage - The error message from API
 * @returns {string} Localized error message
 */
export const getPromocodeErrorMessage = (errorMessage) => {
    const errorMessages = {
        'Promocode not found or is inactive': 'Промокод не найден или неактивен',
        'This promocode has expired': 'Срок действия промокода истёк',
        'This promocode has reached its maximum usage limit': 'Лимит использования промокода исчерпан',
        'You have already used this promocode': 'Вы уже использовали этот промокод',
        'User not found': 'Пользователь не найден',
        'User ID and promo code are required': 'Необходимо ввести промокод',
        'Server error while applying promocode': 'Ошибка сервера при применении промокода'
    };

    return errorMessages[errorMessage] || errorMessage || 'Произошла ошибка';
};

export default {
    applyPromocode,
    validatePromocode,
    getPromocodeErrorMessage
};
