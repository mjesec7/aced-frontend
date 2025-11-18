// src/api/games.js - Gamified Exercise System API
import api from './core';
import { auth } from '@/firebase';

// =============================================
// 🎮 GAME GENERATION API
// =============================================

/**
 * Generate game from exercise/lesson step
 * @param {Object} params - Generation parameters
 * @param {string} params.lessonId - Lesson ID
 * @param {number} params.stepIndex - Step index in lesson
 * @param {string} params.gameType - Type of game to generate
 * @param {string} params.difficulty - easy|medium|hard
 */
export const generateGame = async ({
  lessonId,
  stepIndex,
  gameType = 'basket-catch',
  difficulty = 'medium'
}) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.post(
      'games/generate',
      {
        lessonId,
        stepIndex,
        gameType,
        difficulty
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (data.success) {
      return {
        success: true,
        game: data.game
      };
    } else {
      throw new Error(data.error || 'Failed to generate game');
    }
  } catch (error) {
return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Submit game results
 * @param {Object} results - Game results
 * @param {string} results.userId - User ID
 * @param {string} results.lessonId - Lesson ID
 * @param {number} results.stepIndex - Step index
 * @param {string} results.gameType - Game type played
 * @param {number} results.score - Final score
 * @param {number} results.accuracy - Accuracy percentage
 * @param {number} results.timeSpent - Time spent in seconds
 * @param {boolean} results.completed - Whether game was completed
 * @param {Array} results.actions - Array of actions taken during game
 */
export const submitGameResults = async (results) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.post(
      'games/submit',
      results,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (data.success) {
      return {
        success: true,
        result: data.result
      };
    } else {
      throw new Error(data.error || 'Failed to submit game results');
    }
  } catch (error) {
return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get game leaderboard
 * @param {string} gameType - Game type
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of results (default: 10)
 * @param {string} options.timeframe - all-time|today|week|month
 */
export const getGameLeaderboard = async (gameType, options = {}) => {
  try {
    const { limit = 10, timeframe = 'all-time' } = options;
    const params = new URLSearchParams({ limit, timeframe });

    const { data } = await api.get(`games/leaderboard/${gameType}?${params}`);

    if (data.success) {
      return {
        success: true,
        leaderboard: data.leaderboard,
        gameType: data.gameType,
        timeframe: data.timeframe
      };
    } else {
      throw new Error(data.error || 'Failed to fetch leaderboard');
    }
  } catch (error) {
return {
      success: false,
      leaderboard: [],
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get user game statistics
 * @param {string} userId - User ID
 */
export const getUserGameStats = async (userId) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.get(`games/stats/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (data.success) {
      return {
        success: true,
        stats: data.stats
      };
    } else {
      throw new Error(data.error || 'Failed to fetch game stats');
    }
  } catch (error) {
return {
      success: false,
      stats: null,
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Get available game types
 */
export const getGameTypes = async () => {
  try {
    const { data } = await api.get('games/types');

    if (data.success) {
      return {
        success: true,
        gameTypes: data.gameTypes
      };
    } else {
      throw new Error(data.error || 'Failed to fetch game types');
    }
  } catch (error) {
return {
      success: false,
      gameTypes: [],
      error: error.response?.data?.error || error.message
    };
  }
};

/**
 * Convert existing exercise to game
 * @param {Object} params - Conversion parameters
 * @param {string} params.lessonId - Lesson ID
 * @param {number} params.stepIndex - Step index
 * @param {string} params.gameType - Desired game type
 */
export const convertExerciseToGame = async ({ lessonId, stepIndex, gameType }) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('No authentication token');

    const { data } = await api.post(
      'games/convert-exercise',
      { lessonId, stepIndex, gameType },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (data.success) {
      return {
        success: true,
        gameConfig: data.gameConfig,
        message: data.message
      };
    } else {
      throw new Error(data.error || 'Failed to convert exercise');
    }
  } catch (error) {
return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

// =============================================
// 🎯 GAME TYPES METADATA
// =============================================

/**
 * Game types with metadata
 * This provides client-side information about available games
 */
export const GAME_TYPES = {
  // Throwing & Catching Games
  'basket-catch': {
    id: 'basket-catch',
    name: 'Basket Catch',
    description: 'Catch falling correct answers in your basket',
    icon: '🧺',
    category: 'throwing',
    difficulty: ['easy', 'medium', 'hard'],
    bestFor: ['quick-recall', 'recognition', 'vocabulary']
  },
  'target-practice': {
    id: 'target-practice',
    name: 'Target Practice',
    description: 'Shoot correct answers at moving targets',
    icon: '🎯',
    category: 'throwing',
    difficulty: ['easy', 'medium', 'hard'],
    bestFor: ['accuracy', 'math-operations', 'quick-facts']
  },

  // Matching Games
  'memory-cards': {
    id: 'memory-cards',
    name: 'Memory Cards',
    description: 'Match pairs of related items',
    icon: '🎴',
    category: 'matching',
    difficulty: ['easy', 'medium', 'hard'],
    bestFor: ['matching', 'memorization', 'vocabulary-pairs']
  },
  'connection-lines': {
    id: 'connection-lines',
    name: 'Connection Lines',
    description: 'Draw lines between matching items',
    icon: '🔗',
    category: 'matching',
    difficulty: ['easy', 'medium', 'hard'],
    bestFor: ['relationships', 'definitions', 'translations']
  },

  // Reaction Games
  'whack-a-mole': {
    id: 'whack-a-mole',
    name: 'Whack-a-Mole',
    description: 'Hit correct answers as they appear',
    icon: '🔨',
    category: 'reaction',
    difficulty: ['easy', 'medium', 'hard'],
    bestFor: ['speed', 'grammar-errors', 'quick-selection']
  },
  'lightning-round': {
    id: 'lightning-round',
    name: 'Lightning Round',
    description: 'Rapid-fire questions with timer',
    icon: '⚡',
    category: 'reaction',
    difficulty: ['easy', 'medium', 'hard'],
    bestFor: ['speed-drills', 'multiplication-tables', 'quick-recall']
  },

  // Building Games
  'tower-builder': {
    id: 'tower-builder',
    name: 'Tower Builder',
    description: 'Stack blocks with correct answers',
    icon: '🏗️',
    category: 'building',
    difficulty: ['easy', 'medium', 'hard'],
    bestFor: ['sentence-building', 'sequencing', 'ordering']
  },

  // Strategy Games
  'scale-balance': {
    id: 'scale-balance',
    name: 'Scale Balance',
    description: 'Balance scales with correct weights',
    icon: '⚖️',
    category: 'strategy',
    difficulty: ['easy', 'medium', 'hard'],
    bestFor: ['equations', 'equivalent-values', 'math-balance']
  },
  'pattern-builder': {
    id: 'pattern-builder',
    name: 'Pattern Builder',
    description: 'Complete the pattern',
    icon: '🔵🔴',
    category: 'strategy',
    difficulty: ['easy', 'medium', 'hard'],
    bestFor: ['sequences', 'logic', 'predictions']
  },

  // Movement Games
  'maze-runner': {
    id: 'maze-runner',
    name: 'Maze Runner',
    description: 'Navigate maze by answering questions',
    icon: '🏃',
    category: 'movement',
    difficulty: ['easy', 'medium', 'hard'],
    bestFor: ['sequential-learning', 'step-by-step', 'navigation']
  }
};

/**
 * Get game type metadata by ID
 * @param {string} gameTypeId - Game type ID
 */
export const getGameTypeMetadata = (gameTypeId) => {
  return GAME_TYPES[gameTypeId] || null;
};

/**
 * Get game types by category
 * @param {string} category - Game category
 */
export const getGameTypesByCategory = (category) => {
  return Object.values(GAME_TYPES).filter(game => game.category === category);
};

/**
 * Get all game categories
 */
export const getGameCategories = () => {
  const categories = new Set(Object.values(GAME_TYPES).map(game => game.category));
  return Array.from(categories);
};
