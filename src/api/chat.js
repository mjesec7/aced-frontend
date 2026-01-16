// src/api/chat.js - Chat API Service for AI Conversations
import api from './core';

/**
 * Chat API service for handling AI-powered conversations
 * Works with backend endpoints:
 * - POST /api/chat/lesson-context - Get AI response with lesson context
 * - POST /api/chat/message - Send a general chat message
 */
const chatApi = {
  /**
   * Get AI response for a user question with lesson context
   * @param {object} params - Request parameters
   * @param {string} params.userInput - The user's question
   * @param {object} params.lessonContext - Current lesson/step context
   * @param {string} params.lessonContext.lessonId - Lesson ID (required for memory)
   * @param {string} params.lessonContext.content - Step content
   * @param {string} params.lessonContext.type - Step type
   * @param {string} params.lessonContext.title - Lesson title
   * @returns {Promise<{reply: string, suggestions?: string[], hasMemory?: boolean, messageCount?: number}>}
   */
  async getLessonContextAIResponse({ userInput, lessonContext }) {
    try {
      const response = await api.post('/chat/lesson-context', {
        userInput,
        lessonContext: {
          lessonId: lessonContext?.lessonId || lessonContext?._id || '', // Required for memory
          content: lessonContext?.content || lessonContext?.data?.content || '',
          type: lessonContext?.type || 'explanation',
          title: lessonContext?.title || '',
          stepIndex: lessonContext?.stepIndex
        }
      });
      return response.data;
    } catch (error) {
      console.error('[ChatAPI] getLessonContextAIResponse error:', error);
      throw error;
    }
  },

  /**
   * Send a general chat message (without specific lesson context)
   * @param {string} message - The user's message
   * @param {object} context - Optional context
   * @returns {Promise<{reply: string}>}
   */
  async sendMessage(message, context = {}) {
    try {
      const response = await api.post('/chat/message', {
        message,
        context
      });
      return response.data;
    } catch (error) {
      console.error('[ChatAPI] sendMessage error:', error);
      throw error;
    }
  },

  /**
   * Get AI explanation for specific content
   * @param {string} content - Content to explain
   * @param {string} question - User's specific question
   * @returns {Promise<{explanation: string}>}
   */
  async getExplanation(content, question) {
    try {
      const response = await api.post('/chat/explain', {
        content,
        question
      });
      return response.data;
    } catch (error) {
      console.error('[ChatAPI] getExplanation error:', error);
      throw error;
    }
  },

  /**
   * Get quick suggestions based on current lesson context
   * @param {object} lessonContext - Current lesson context
   * @returns {Promise<{suggestions: string[]}>}
   */
  async getSuggestions(lessonContext) {
    try {
      const response = await api.post('/chat/suggestions', {
        lessonContext
      });
      return response.data;
    } catch (error) {
      console.error('[ChatAPI] getSuggestions error:', error);
      return { suggestions: [] };
    }
  },

  /**
   * Clear chat history for a specific lesson
   * Use this when user restarts a lesson to give them a fresh start
   * @param {string} lessonId - The lesson ID to clear history for
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async clearChatHistory(lessonId) {
    try {
      const response = await api.delete(`/chat/history/${lessonId}`);
      return response.data;
    } catch (error) {
      console.error('[ChatAPI] clearChatHistory error:', error);
      // Don't throw - clearing history is non-critical
      return { success: false, error: error.message };
    }
  },

  /**
   * Get learning stats for the current user
   * @returns {Promise<{success: boolean, stats?: object}>}
   */
  async getLearningStats() {
    try {
      const response = await api.get('/chat/learning-stats');
      return response.data;
    } catch (error) {
      console.error('[ChatAPI] getLearningStats error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Named exports for individual functions
export const getLessonContextAIResponse = chatApi.getLessonContextAIResponse;
export const sendMessage = chatApi.sendMessage;
export const getExplanation = chatApi.getExplanation;
export const getSuggestions = chatApi.getSuggestions;
export const clearChatHistory = chatApi.clearChatHistory;
export const getLearningStats = chatApi.getLearningStats;

// Default export for the entire API object
export default chatApi;
