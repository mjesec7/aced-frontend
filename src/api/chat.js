// src/api/chat.js - Chat API Service for AI Conversations with RAG Architecture
import api from './core';

/**
 * Chat API service for handling AI-powered conversations with Context Injection (RAG)
 *
 * RAG Architecture Flow:
 * 1. Frontend sends: userInput, lessonContext, userProgress, stepContext
 * 2. Backend fetches: Lesson content, User history, Chat memory
 * 3. Backend constructs: System prompt with all injected context
 * 4. AI generates: Context-aware, personalized response
 *
 * Works with backend endpoints:
 * - POST /api/chat/lesson-context - Get AI response with full RAG context
 * - POST /api/chat/message - Send a general chat message
 * - POST /api/chat/smart-hint - Get smart hints after mistakes
 * - POST /api/chat/progress-insight - Get progress-based insights
 * - DELETE /api/chat/history/:lessonId - Clear chat history for lesson
 */
const chatApi = {
  /**
   * Get AI response for a user question with full RAG context injection
   *
   * @param {object} params - Request parameters
   * @param {string} params.userInput - The user's question
   * @param {object} params.lessonContext - Lesson-level context
   * @param {string} params.lessonContext.lessonId - Lesson ID (required for memory)
   * @param {string} params.lessonContext.lessonName - Lesson title
   * @param {string} params.lessonContext.topic - Lesson topic
   * @param {number} params.lessonContext.totalSteps - Total steps in lesson
   * @param {object} params.userProgress - User's progress data
   * @param {number} params.userProgress.currentStep - Current step index
   * @param {number} params.userProgress.mistakes - Number of mistakes
   * @param {number} params.userProgress.progressPercent - Progress percentage
   * @param {Array} params.userProgress.weakAreas - User's weak areas
   * @param {object} params.stepContext - Current step context
   * @param {string} params.stepContext.type - Step type (exercise, quiz, explanation)
   * @param {number} params.stepContext.stepIndex - Current step index
   * @param {object} params.stepContext.exerciseData - Exercise data (no answers)
   * @returns {Promise<{reply: string, suggestions?: string[], hasMemory?: boolean, messageCount?: number, contextUsed?: boolean}>}
   */
  async getLessonContextAIResponse({ userInput, lessonContext, userProgress, stepContext }) {
    try {
      const response = await api.post('/chat/lesson-context', {
        userInput,
        lessonContext: {
          lessonId: lessonContext?.lessonId || lessonContext?._id || '',
          lessonName: lessonContext?.lessonName || lessonContext?.title || '',
          topic: lessonContext?.topic || '',
          subject: lessonContext?.subject || '',
          totalSteps: lessonContext?.totalSteps || 0
        },
        userProgress: {
          currentStep: userProgress?.currentStep || 0,
          completedSteps: userProgress?.completedSteps || 0,
          mistakes: userProgress?.mistakes || 0,
          stars: userProgress?.stars || 0,
          progressPercent: userProgress?.progressPercent || 0,
          weakAreas: userProgress?.weakAreas || [],
          recentMistakes: userProgress?.recentMistakes || []
        },
        stepContext: {
          type: stepContext?.type || 'explanation',
          stepIndex: stepContext?.stepIndex || 0,
          exerciseIndex: stepContext?.exerciseIndex,
          totalExercises: stepContext?.totalExercises,
          exerciseData: stepContext?.exerciseData || null,
          content: stepContext?.content || null
        },
        // Enable RAG features
        enableMemory: true,
        enablePersonalization: true
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
