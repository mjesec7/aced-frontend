// src/api/voice.js - Voice API Service for Speech Analysis and Audio Streaming
import api from './core';

/**
 * Voice API service for handling speech analysis and audio streaming
 * Works with backend endpoints:
 * - POST /api/chat/analyze-speech - Analyze lesson content for speech
 * - POST /api/elevenlabs/stream - Stream audio from text
 */
const voiceApi = {
  /**
   * Analyze lesson content to get explanation and highlights
   * @param {string} lessonContent - The lesson text content to analyze
   * @param {string} stepContext - Context about the current step type
   * @param {string} stepType - The type of step (explanation, example, reading, etc.)
   * @returns {Promise<{explanation: string, highlights: string[]}>}
   */
  async analyzeLesson(lessonContent, stepContext, stepType = 'explanation') {
    try {
      const response = await api.post('/chat/analyze-speech', {
        lessonContent,
        stepContext,
        stepType
      });
      return response.data;
    } catch (error) {
      console.error('[VoiceAPI] analyzeLesson error:', error);
      throw error;
    }
  },

  /**
   * Stream audio from text using ElevenLabs
   * @param {string} text - The text to convert to speech
   * @param {object} options - Optional voice settings
   * @param {string} options.voiceId - Voice ID for ElevenLabs
   * @param {number} options.stability - Voice stability (0-1)
   * @param {number} options.similarityBoost - Similarity boost (0-1)
   * @returns {Promise<Blob>} Audio blob for playback
   */
  async streamAudio(text, options = {}) {
    try {
      const response = await api.post('/elevenlabs/stream',
        {
          text,
          ...options
        },
        {
          responseType: 'blob',
          timeout: 60000 // 60 seconds timeout for audio generation
        }
      );
      return response.data;
    } catch (error) {
      console.error('[VoiceAPI] streamAudio error:', error);
      throw error;
    }
  },

  /**
   * Get available voices from ElevenLabs
   * @returns {Promise<Array>} List of available voices
   */
  async getVoices() {
    try {
      const response = await api.get('/elevenlabs/voices');
      return response.data;
    } catch (error) {
      console.error('[VoiceAPI] getVoices error:', error);
      throw error;
    }
  },

  /**
   * Check voice API health/availability
   * @returns {Promise<{available: boolean, provider: string}>}
   */
  async checkAvailability() {
    try {
      const response = await api.get('/elevenlabs/health');
      return {
        available: true,
        ...response.data
      };
    } catch (error) {
      console.error('[VoiceAPI] checkAvailability error:', error);
      return {
        available: false,
        error: error.message
      };
    }
  }
};

// Named exports for individual functions
export const analyzeLesson = voiceApi.analyzeLesson;
export const streamAudio = voiceApi.streamAudio;
export const getVoices = voiceApi.getVoices;
export const checkVoiceAvailability = voiceApi.checkAvailability;

// Default export for the entire API object
export default voiceApi;
