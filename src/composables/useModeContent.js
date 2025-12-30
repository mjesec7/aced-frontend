// Composable for Mode-Based Content Fetching
// Handles data fetching based on learning mode (School vs Study Centre)

import { ref, computed } from 'vue';
import { useLevelSystem } from './useLevelSystem';
import { getTopicsGrouped, getTopicsAsCourses } from '@/api';

export function useModeContent() {
  const { isSchoolMode, isStudyCentreMode } = useLevelSystem();

  const groupedContent = ref({});
  const courseCards = ref([]);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetch content based on current learning mode
   * @param {Object} filters - Optional filters (search, subject, level)
   */
  const fetchContent = async (filters = {}) => {
    loading.value = true;
    error.value = null;

    try {
      if (isSchoolMode.value) {
        // School Mode: Get grouped hierarchy (Subject → Level → Topics)
        const result = await getTopicsGrouped();

        if (result.success) {
          groupedContent.value = result.data;
        } else {
          throw new Error(result.error || 'Failed to load content');
        }
      } else {
        // Study Centre Mode: Get flat course cards
        const result = await getTopicsAsCourses(filters);

        if (result.success) {
          courseCards.value = result.courses;
        } else {
          throw new Error(result.error || 'Failed to load courses');
        }
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get subjects for School Mode navigation
   */
  const subjects = computed(() => {
    if (!isSchoolMode.value) return [];
    return Object.keys(groupedContent.value).sort();
  });

  /**
   * Get levels for a specific subject (School Mode)
   * @param {string} subject - Subject name
   * @returns {number[]} Array of level numbers
   */
  const getLevelsForSubject = (subject) => {
    if (!isSchoolMode.value || !groupedContent.value[subject]) return [];
    return Object.keys(groupedContent.value[subject])
      .map(Number)
      .sort((a, b) => a - b);
  };

  /**
   * Get topics for a specific subject and level (School Mode)
   * @param {string} subject - Subject name
   * @param {number} level - Level number
   * @returns {Array} Array of topics
   */
  const getTopicsForLevel = (subject, level) => {
    if (!isSchoolMode.value || !groupedContent.value[subject]?.[level]) return [];
    return groupedContent.value[subject][level];
  };

  /**
   * Get total topics count across all subjects and levels
   */
  const totalTopicsCount = computed(() => {
    if (isSchoolMode.value) {
      let count = 0;
      for (const subject in groupedContent.value) {
        for (const level in groupedContent.value[subject]) {
          count += groupedContent.value[subject][level].length;
        }
      }
      return count;
    } else {
      return courseCards.value.length;
    }
  });

  /**
   * Get topics count for a specific subject
   * @param {string} subject - Subject name
   * @returns {number}
   */
  const getTopicsCountForSubject = (subject) => {
    if (!isSchoolMode.value || !groupedContent.value[subject]) return 0;
    let count = 0;
    for (const level in groupedContent.value[subject]) {
      count += groupedContent.value[subject][level].length;
    }
    return count;
  };

  return {
    // State
    groupedContent,
    courseCards,
    loading,
    error,

    // Computed
    subjects,
    totalTopicsCount,

    // Methods
    fetchContent,
    getLevelsForSubject,
    getTopicsForLevel,
    getTopicsCountForSubject
  };
}
