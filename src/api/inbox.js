// src/api/inbox.js - User Inbox/Messages API
import axios from 'axios';
import { auth } from '@/firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live';

// Create inbox-specific axios instance
const inboxApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000
});

// Add auth interceptor
inboxApi.interceptors.request.use(async (config) => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(true);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    return Promise.reject(error);
  }
});

// =============================================
// LOCAL STORAGE INBOX (Fallback when API unavailable)
// =============================================

const INBOX_STORAGE_KEY = 'aced_user_inbox';
const MAX_MESSAGES = 50;

/**
 * Get messages from local storage
 */
const getLocalMessages = (userId) => {
  try {
    const stored = localStorage.getItem(`${INBOX_STORAGE_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * Save messages to local storage
 */
const saveLocalMessages = (userId, messages) => {
  try {
    // Keep only the most recent messages
    const trimmedMessages = messages.slice(0, MAX_MESSAGES);
    localStorage.setItem(`${INBOX_STORAGE_KEY}_${userId}`, JSON.stringify(trimmedMessages));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Add a message to local storage
 */
const addLocalMessage = (userId, message) => {
  const messages = getLocalMessages(userId);
  const newMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...message,
    createdAt: new Date().toISOString(),
    read: false
  };
  messages.unshift(newMessage);
  saveLocalMessages(userId, messages);
  return newMessage;
};

// =============================================
// INBOX API FUNCTIONS
// =============================================

/**
 * Get all messages for a user
 */
export const getUserMessages = async (userId) => {
  try {
    // Try API first
    const response = await inboxApi.get(`/users/${userId}/messages`);
    if (response.data && response.data.success) {
      return {
        success: true,
        messages: response.data.messages || [],
        source: 'api'
      };
    }
  } catch (error) {
    // API failed, use local storage
  }

  // Fallback to local storage
  const localMessages = getLocalMessages(userId);
  return {
    success: true,
    messages: localMessages,
    source: 'local'
  };
};

/**
 * Send a message to user's inbox
 */
export const sendMessage = async (userId, messageData) => {
  const message = {
    type: messageData.type || 'info',
    title: messageData.title,
    content: messageData.content,
    data: messageData.data || {},
    priority: messageData.priority || 'normal'
  };

  try {
    // Try API first
    const response = await inboxApi.post(`/users/${userId}/messages`, message);
    if (response.data && response.data.success) {
      return {
        success: true,
        message: response.data.message,
        source: 'api'
      };
    }
  } catch (error) {
    // API failed, use local storage
  }

  // Fallback to local storage
  const savedMessage = addLocalMessage(userId, message);
  return {
    success: true,
    message: savedMessage,
    source: 'local'
  };
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (userId, messageId) => {
  try {
    // Try API first
    const response = await inboxApi.put(`/users/${userId}/messages/${messageId}/read`);
    if (response.data && response.data.success) {
      return { success: true, source: 'api' };
    }
  } catch (error) {
    // API failed, update local storage
  }

  // Fallback to local storage
  const messages = getLocalMessages(userId);
  const updatedMessages = messages.map(msg =>
    msg.id === messageId ? { ...msg, read: true, readAt: new Date().toISOString() } : msg
  );
  saveLocalMessages(userId, updatedMessages);
  return { success: true, source: 'local' };
};

/**
 * Mark all messages as read
 */
export const markAllMessagesAsRead = async (userId) => {
  try {
    // Try API first
    const response = await inboxApi.put(`/users/${userId}/messages/read-all`);
    if (response.data && response.data.success) {
      return { success: true, source: 'api' };
    }
  } catch (error) {
    // API failed, update local storage
  }

  // Fallback to local storage
  const messages = getLocalMessages(userId);
  const readAt = new Date().toISOString();
  const updatedMessages = messages.map(msg => ({ ...msg, read: true, readAt }));
  saveLocalMessages(userId, updatedMessages);
  return { success: true, source: 'local' };
};

/**
 * Delete a message
 */
export const deleteMessage = async (userId, messageId) => {
  try {
    // Try API first
    const response = await inboxApi.delete(`/users/${userId}/messages/${messageId}`);
    if (response.data && response.data.success) {
      return { success: true, source: 'api' };
    }
  } catch (error) {
    // API failed, update local storage
  }

  // Fallback to local storage
  const messages = getLocalMessages(userId);
  const updatedMessages = messages.filter(msg => msg.id !== messageId);
  saveLocalMessages(userId, updatedMessages);
  return { success: true, source: 'local' };
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (userId) => {
  try {
    // Try API first
    const response = await inboxApi.get(`/users/${userId}/messages/unread-count`);
    if (response.data && response.data.success !== false) {
      return {
        success: true,
        count: response.data.count || 0,
        source: 'api'
      };
    }
  } catch (error) {
    // API failed, use local storage
  }

  // Fallback to local storage
  const messages = getLocalMessages(userId);
  const unreadCount = messages.filter(msg => !msg.read).length;
  return {
    success: true,
    count: unreadCount,
    source: 'local'
  };
};

// =============================================
// PAYMENT CONFIRMATION MESSAGE
// =============================================

/**
 * Send payment confirmation message to user's inbox
 */
export const sendPaymentConfirmationMessage = async (paymentData) => {
  const {
    userId,
    amount,
    originalAmount,
    discount,
    promoCode,
    plan,
    duration,
    transactionId,
    paymentMethod,
    startDate,
    endDate,
    userEmail,
    userName
  } = paymentData;

  // Format amounts for display (convert from tiyin to UZS)
  const formatAmount = (amt) => {
    if (!amt) return '0 sum';
    const uzs = Math.floor(amt / 100);
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(uzs) + ' sum';
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Build message content
  let content = `Your payment has been processed successfully!\n\n`;
  content += `Plan: ${plan}\n`;
  content += `Duration: ${duration} ${duration === 1 ? 'month' : 'months'}\n`;
  content += `Amount Paid: ${formatAmount(amount)}\n`;

  if (discount > 0 && promoCode) {
    content += `Original Price: ${formatAmount(originalAmount)}\n`;
    content += `Promo Code: ${promoCode}\n`;
    content += `Discount: -${formatAmount(discount)}\n`;
  }

  content += `\nSubscription Period:\n`;
  content += `From: ${formatDate(startDate)}\n`;
  content += `To: ${formatDate(endDate)}\n`;
  content += `\nPayment Method: ${paymentMethod}\n`;

  if (transactionId) {
    content += `Transaction ID: ${transactionId}\n`;
  }

  content += `\nThank you for subscribing to ACED!`;

  const messageData = {
    type: 'payment',
    title: 'Payment Successful',
    content: content,
    priority: 'high',
    data: {
      paymentType: 'subscription',
      amount,
      originalAmount,
      discount,
      promoCode,
      plan,
      duration,
      transactionId,
      paymentMethod,
      startDate,
      endDate,
      userEmail,
      userName,
      timestamp: new Date().toISOString()
    }
  };

  return sendMessage(userId, messageData);
};

/**
 * Send subscription expiry reminder
 */
export const sendExpiryReminderMessage = async (userId, daysRemaining, expiryDate) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const content = `Your subscription will expire in ${daysRemaining} days on ${formatDate(expiryDate)}.\n\nRenew now to continue enjoying premium features without interruption.`;

  const messageData = {
    type: 'warning',
    title: 'Subscription Expiring Soon',
    content: content,
    priority: 'high',
    data: {
      type: 'expiry_reminder',
      daysRemaining,
      expiryDate
    }
  };

  return sendMessage(userId, messageData);
};

export default {
  getUserMessages,
  sendMessage,
  markMessageAsRead,
  markAllMessagesAsRead,
  deleteMessage,
  getUnreadCount,
  sendPaymentConfirmationMessage,
  sendExpiryReminderMessage
};
