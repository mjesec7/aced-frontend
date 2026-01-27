// Composable for Level System Logic
// Handles level checking, unlocking, and progression

import { computed } from 'vue';
import { useStore } from 'vuex';

export function useLevelSystem() {
  const store = useStore();

  // Level to grade mapping
  const LEVEL_GRADE_MAPPING = {
    1: 'A1', 2: 'A1', 3: 'A1',
    4: 'A2', 5: 'A2', 6: 'A2',
    7: 'B1', 8: 'B1', 9: 'B1',
    10: 'B2', 11: 'B2', 12: 'B2',
    13: 'C1', 14: 'C1', 15: 'C1',
    16: 'C2', 17: 'C2', 18: 'C2',
    19: 'Expert', 20: 'Master'
  };

  // Grade descriptions
  const GRADE_DESCRIPTIONS = {
    'A1': 'Beginner - Basic phrases and simple interactions',
    'A2': 'Elementary - Can describe familiar situations',
    'B1': 'Intermediate - Can handle most daily situations',
    'B2': 'Upper Intermediate - Can interact with native speakers',
    'C1': 'Advanced - Fluent and spontaneous communication',
    'C2': 'Proficient - Near-native mastery',
    'Expert': 'Expert - Professional level expertise',
    'Master': 'Master - Complete mastery of the subject'
  };

  // Computed properties
  const learningMode = computed(() => store.getters['platformMode/learningMode']);
  const isSchoolMode = computed(() => store.getters['platformMode/isSchoolMode']);
  const isStudyCentreMode = computed(() => store.getters['platformMode/isStudyCentreMode']);
  const hasSelectedMode = computed(() => store.getters['platformMode/hasSelectedMode']);

  const currentGrade = computed(() => store.getters['platformMode/currentGrade']);
  const currentLevelCap = computed(() => store.getters['platformMode/currentLevelCap']);
  const accessibleLevels = computed(() => store.getters['platformMode/accessibleLevels']);
  const placementTestTaken = computed(() => store.getters['platformMode/placementTestTaken']);
  const levelProgress = computed(() => store.getters['platformMode/levelProgress']);

  /**
   * Check if user can access a specific level
   * @param {number} level - The level to check
   * @returns {boolean}
   */
  const canAccessLevel = (level) => {
    return store.getters['platformMode/canAccessLevel'](level);
  };

  /**
   * Check if a level is completed
   * @param {number} level - The level to check
   * @returns {boolean}
   */
  const isLevelCompleted = (level) => {
    return store.getters['platformMode/isLevelCompleted'](level);
  };

  /**
   * Check if a level is locked
   * @param {number} level - The level to check
   * @returns {boolean}
   */
  const isLevelLocked = (level) => {
    if (isStudyCentreMode.value) return false;
    return !canAccessLevel(level);
  };

  /**
   * Get the grade for a specific level
   * @param {number} level - The level number
   * @returns {string} - Grade (A1, A2, etc.)
   */
  const getLevelGrade = (level) => {
    return LEVEL_GRADE_MAPPING[level] || 'Unknown';
  };

  /**
   * Get description for a grade
   * @param {string} grade - Grade (A1, A2, etc.)
   * @returns {string}
   */
  const getGradeDescription = (grade) => {
    return GRADE_DESCRIPTIONS[grade] || 'Unknown level';
  };

  /**
   * Get all levels for a specific grade
   * @param {string} grade - Grade (A1, A2, etc.)
   * @returns {number[]}
   */
  const getLevelsForGrade = (grade) => {
    return Object.entries(LEVEL_GRADE_MAPPING)
      .filter(([_, g]) => g === grade)
      .map(([level, _]) => parseInt(level));
  };

  /**
   * Calculate level progress percentage for a specific level
   * @param {number} level - The level to check
   * @param {number} completedCourses - Number of completed courses in level
   * @param {number} totalCourses - Total courses in level
   * @returns {number} - Percentage (0-100)
   */
  const calculateLevelProgress = (level, completedCourses = 0, totalCourses = 1) => {
    if (totalCourses === 0) return 0;
    return Math.round((completedCourses / totalCourses) * 100);
  };

  /**
   * Get the next level to unlock
   * @returns {number|null}
   */
  const getNextUnlockableLevel = () => {
    if (isStudyCentreMode.value) return null;
    return currentLevelCap.value + 1;
  };

  /**
   * Check if user should take placement test
   * @returns {boolean}
   */
  const shouldTakePlacementTest = () => {
    return isSchoolMode.value && !placementTestTaken.value;
  };

  /**
   * Get lock reason message for a level
   * @param {number} level - The level to check
   * @returns {string}
   */
  const getLockReason = (level) => {
    if (isStudyCentreMode.value) return '';

    if (!placementTestTaken.value) {
      return 'Complete the placement test to unlock levels';
    }

    if (level > currentLevelCap.value) {
      const previousLevel = level - 1;
      return `Complete Level ${previousLevel} to unlock this level`;
    }

    return 'This level is currently locked';
  };

  /**
   * Get badge color for a grade
   * @param {string} grade - Grade (A1, A2, etc.)
   * @returns {string}
   */
  const getGradeBadgeColor = (grade) => {
    const colorMap = {
      'A1': '#10b981', // green
      'A2': '#3b82f6', // blue
      'B1': '#8b5cf6', // purple
      'B2': '#a855f7', // violet
      'C1': '#ec4899', // pink
      'C2': '#f43f5e', // rose
      'Expert': '#f59e0b', // amber
      'Master': '#eab308'  // yellow
    };
    return colorMap[grade] || '#6b7280';
  };

  /**
   * Compare two levels
   * @param {number} level1
   * @param {number} level2
   * @returns {number} - -1 if level1 < level2, 0 if equal, 1 if level1 > level2
   */
  const compareLevels = (level1, level2) => {
    if (level1 < level2) return -1;
    if (level1 > level2) return 1;
    return 0;
  };

  /**
   * Get recommended difficulty for user
   * @returns {string} - 'beginner', 'intermediate', 'advanced'
   */
  const getRecommendedDifficulty = () => {
    const grade = currentGrade.value;
    if (!grade) return 'beginner';

    if (['A1', 'A2'].includes(grade)) return 'beginner';
    if (['B1', 'B2'].includes(grade)) return 'intermediate';
    return 'advanced';
  };

  /**
   * Format level display
   * @param {number} level - The level number
   * @param {boolean} includeGrade - Whether to include grade
   * @returns {string}
   */
  const formatLevel = (level, includeGrade = true) => {
    if (!includeGrade) return `Level ${level}`;
    const grade = getLevelGrade(level);
    return `Level ${level} (${grade})`;
  };

  /**
   * Get levels in user's current grade
   * @returns {number[]}
   */
  const getCurrentGradeLevels = () => {
    if (!currentGrade.value) return [];
    return getLevelsForGrade(currentGrade.value);
  };

  /**
   * Check if level is in current grade
   * @param {number} level
   * @returns {boolean}
   */
  const isInCurrentGrade = (level) => {
    return getLevelGrade(level) === currentGrade.value;
  };

  /**
   * Get progress within current grade
   * @returns {object} { completed: number, total: number, percentage: number }
   */
  const getCurrentGradeProgress = () => {
    const levels = getCurrentGradeLevels();
    const completed = levels.filter(level => isLevelCompleted(level)).length;
    const total = levels.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  /**
   * Check if user can progress to next grade
   * @returns {boolean}
   */
  const canProgressToNextGrade = () => {
    const { completed, total } = getCurrentGradeProgress();
    return completed === total;
  };

  /**
   * Get all available grades
   * @returns {string[]}
   */
  const getAllGrades = () => {
    return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Expert', 'Master'];
  };

  /**
   * Get minimum level for a grade
   * @param {string} grade
   * @returns {number}
   */
  const getMinLevelForGrade = (grade) => {
    const levels = getLevelsForGrade(grade);
    return levels.length > 0 ? Math.min(...levels) : 1;
  };

  /**
   * Get maximum level for a grade
   * @param {string} grade
   * @returns {number}
   */
  const getMaxLevelForGrade = (grade) => {
    const levels = getLevelsForGrade(grade);
    return levels.length > 0 ? Math.max(...levels) : 1;
  };

  return {
    // Computed properties
    learningMode,
    isSchoolMode,
    isStudyCentreMode,
    hasSelectedMode,
    currentGrade,
    currentLevelCap,
    accessibleLevels,
    placementTestTaken,
    levelProgress,

    // Level checking functions
    canAccessLevel,
    isLevelCompleted,
    isLevelLocked,
    shouldTakePlacementTest,
    getLockReason,

    // Level information functions
    getLevelGrade,
    getGradeDescription,
    getLevelsForGrade,
    getAllGrades,
    getMinLevelForGrade,
    getMaxLevelForGrade,

    // Progress functions
    calculateLevelProgress,
    getNextUnlockableLevel,
    getCurrentGradeProgress,
    canProgressToNextGrade,

    // Utility functions
    getGradeBadgeColor,
    compareLevels,
    getRecommendedDifficulty,
    formatLevel,
    getCurrentGradeLevels,
    isInCurrentGrade,

    // Constants
    LEVEL_GRADE_MAPPING,
    GRADE_DESCRIPTIONS
  };
}
