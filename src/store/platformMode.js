// Platform Mode Store Module
// Manages School Mode vs Study Centre Mode functionality

export default {
  namespaced: true,

  state: {
    // Platform mode: 'study_centre', 'school', or 'hybrid'
    learningMode: localStorage.getItem('learningMode') || null,

    // School Mode Profile
    schoolProfile: {
      placementTestTaken: false,
      placementTestDate: null,
      placementTestScore: null,
      assignedLevel: null,
      currentGrade: null, // A1, A2, B1, B2, C1, C2
      currentLevelCap: 1,
      progressLocked: true,
      accessibleLevels: [1],
      lockedLevels: [],
      completedLevels: [],
      mandatoryCourses: [],
      curriculum: 'standard', // 'standard', 'accelerated', 'remedial', 'custom'
      minPassingScore: 70
    },

    // Study Centre Profile
    studyCentreProfile: {
      explorationHistory: [],
      bookmarkedCourses: [],
      personalPaths: [],
      preferences: {
        showAllLevels: true,
        allowJumping: true,
        explorationMode: true
      }
    },

    // Mode transition history
    modeHistory: [],

    // Level mapping
    levelGradeMapping: {
      1: 'A1', 2: 'A1', 3: 'A1',
      4: 'A2', 5: 'A2', 6: 'A2',
      7: 'B1', 8: 'B1', 9: 'B1',
      10: 'B2', 11: 'B2', 12: 'B2',
      13: 'C1', 14: 'C1', 15: 'C1',
      16: 'C2', 17: 'C2', 18: 'C2',
      19: 'Expert', 20: 'Master'
    }
  },

  mutations: {
    SET_LEARNING_MODE(state, mode) {
      state.learningMode = mode;
      localStorage.setItem('learningMode', mode);
    },

    SET_SCHOOL_PROFILE(state, profile) {
      state.schoolProfile = { ...state.schoolProfile, ...profile };
      localStorage.setItem('schoolProfile', JSON.stringify(state.schoolProfile));
    },

    SET_STUDY_CENTRE_PROFILE(state, profile) {
      state.studyCentreProfile = { ...state.studyCentreProfile, ...profile };
      localStorage.setItem('studyCentreProfile', JSON.stringify(state.studyCentreProfile));
    },

    SET_PLACEMENT_TEST_TAKEN(state, value) {
      state.schoolProfile.placementTestTaken = value;
      localStorage.setItem('schoolProfile', JSON.stringify(state.schoolProfile));
    },

    SET_PLACEMENT_TEST_RESULTS(state, results) {
      state.schoolProfile.placementTestDate = new Date().toISOString();
      state.schoolProfile.placementTestScore = results.overallScore;
      state.schoolProfile.assignedLevel = results.level;
      state.schoolProfile.currentGrade = state.levelGradeMapping[results.level];
      state.schoolProfile.currentLevelCap = results.level;
      state.schoolProfile.accessibleLevels = Array.from(
        { length: results.level },
        (_, i) => i + 1
      );
      localStorage.setItem('schoolProfile', JSON.stringify(state.schoolProfile));
    },

    UNLOCK_LEVEL(state, level) {
      if (!state.schoolProfile.accessibleLevels.includes(level)) {
        state.schoolProfile.accessibleLevels.push(level);
        state.schoolProfile.accessibleLevels.sort((a, b) => a - b);
      }

      // Remove from locked levels if present
      const lockedIndex = state.schoolProfile.lockedLevels.indexOf(level);
      if (lockedIndex > -1) {
        state.schoolProfile.lockedLevels.splice(lockedIndex, 1);
      }

      // Update level cap if higher
      if (level > state.schoolProfile.currentLevelCap) {
        state.schoolProfile.currentLevelCap = level;
      }

      localStorage.setItem('schoolProfile', JSON.stringify(state.schoolProfile));
    },

    COMPLETE_LEVEL(state, { level, score, certificate }) {
      const completedLevel = {
        level,
        completedDate: new Date().toISOString(),
        finalScore: score,
        certificate,
        unlockedNext: [level + 1]
      };

      state.schoolProfile.completedLevels.push(completedLevel);

      // Auto-unlock next level
      if (level + 1 <= 20) {
        state.schoolProfile.accessibleLevels.push(level + 1);
        state.schoolProfile.currentLevelCap = level + 1;
        state.schoolProfile.currentGrade = state.levelGradeMapping[level + 1];
      }

      localStorage.setItem('schoolProfile', JSON.stringify(state.schoolProfile));
    },

    ADD_TO_EXPLORATION_HISTORY(state, entry) {
      state.studyCentreProfile.explorationHistory.push({
        ...entry,
        accessedAt: new Date().toISOString()
      });
      localStorage.setItem('studyCentreProfile', JSON.stringify(state.studyCentreProfile));
    },

    ADD_BOOKMARK(state, { courseId, notes }) {
      state.studyCentreProfile.bookmarkedCourses.push({
        courseId,
        notes,
        bookmarkedAt: new Date().toISOString()
      });
      localStorage.setItem('studyCentreProfile', JSON.stringify(state.studyCentreProfile));
    },

    REMOVE_BOOKMARK(state, courseId) {
      state.studyCentreProfile.bookmarkedCourses = state.studyCentreProfile.bookmarkedCourses.filter(
        bookmark => bookmark.courseId !== courseId
      );
      localStorage.setItem('studyCentreProfile', JSON.stringify(state.studyCentreProfile));
    },

    CREATE_PERSONAL_PATH(state, path) {
      state.studyCentreProfile.personalPaths.push({
        ...path,
        createdAt: new Date().toISOString(),
        progress: 0
      });
      localStorage.setItem('studyCentreProfile', JSON.stringify(state.studyCentreProfile));
    },

    ADD_MODE_HISTORY(state, { fromMode, toMode, reason }) {
      state.modeHistory.push({
        fromMode,
        toMode,
        switchedAt: new Date().toISOString(),
        reason
      });
    },

    LOAD_FROM_LOCALSTORAGE(state) {
      try {
        const learningMode = localStorage.getItem('learningMode');
        const schoolProfile = JSON.parse(localStorage.getItem('schoolProfile') || '{}');
        const studyCentreProfile = JSON.parse(localStorage.getItem('studyCentreProfile') || '{}');

        if (learningMode) state.learningMode = learningMode;
        if (Object.keys(schoolProfile).length > 0) {
          state.schoolProfile = { ...state.schoolProfile, ...schoolProfile };
        }
        if (Object.keys(studyCentreProfile).length > 0) {
          state.studyCentreProfile = { ...state.studyCentreProfile, ...studyCentreProfile };
        }
      } catch (error) {
}
    },

    RESET_PLATFORM_MODE(state) {
      state.learningMode = null;
      state.schoolProfile = {
        placementTestTaken: false,
        placementTestDate: null,
        placementTestScore: null,
        assignedLevel: null,
        currentGrade: null,
        currentLevelCap: 1,
        progressLocked: true,
        accessibleLevels: [1],
        lockedLevels: [],
        completedLevels: [],
        mandatoryCourses: [],
        curriculum: 'standard',
        minPassingScore: 70
      };
      state.studyCentreProfile = {
        explorationHistory: [],
        bookmarkedCourses: [],
        personalPaths: [],
        preferences: {
          showAllLevels: true,
          allowJumping: true,
          explorationMode: true
        }
      };
      localStorage.removeItem('learningMode');
      localStorage.removeItem('schoolProfile');
      localStorage.removeItem('studyCentreProfile');
    }
  },

  actions: {
    async switchMode({ commit, state }, { newMode, reason = '' }) {
      const fromMode = state.learningMode;

      commit('ADD_MODE_HISTORY', { fromMode, toMode: newMode, reason });
      commit('SET_LEARNING_MODE', newMode);

      // Apply mode-specific settings
      if (newMode === 'school') {
        commit('SET_SCHOOL_PROFILE', { progressLocked: true });
      } else if (newMode === 'study_centre') {
        commit('SET_STUDY_CENTRE_PROFILE', {
          preferences: { ...state.studyCentreProfile.preferences, showAllLevels: true }
        });
      }

      return { success: true, newMode };
    },

    setPlacementTestResults({ commit }, results) {
      commit('SET_PLACEMENT_TEST_TAKEN', true);
      commit('SET_PLACEMENT_TEST_RESULTS', results);
    },

    unlockLevel({ commit }, level) {
      commit('UNLOCK_LEVEL', level);
    },

    completeLevel({ commit }, levelData) {
      commit('COMPLETE_LEVEL', levelData);
    },

    addToExplorationHistory({ commit }, entry) {
      commit('ADD_TO_EXPLORATION_HISTORY', entry);
    },

    addBookmark({ commit }, bookmarkData) {
      commit('ADD_BOOKMARK', bookmarkData);
    },

    removeBookmark({ commit }, courseId) {
      commit('REMOVE_BOOKMARK', courseId);
    },

    createPersonalPath({ commit }, path) {
      commit('CREATE_PERSONAL_PATH', path);
    },

    loadFromLocalStorage({ commit }) {
      commit('LOAD_FROM_LOCALSTORAGE');
    },

    resetPlatformMode({ commit }) {
      commit('RESET_PLATFORM_MODE');
    }
  },

  getters: {
    learningMode: state => state.learningMode,

    isSchoolMode: state => state.learningMode === 'school',
    isStudyCentreMode: state => state.learningMode === 'study_centre',
    isHybridMode: state => state.learningMode === 'hybrid',

    hasSelectedMode: state => state.learningMode !== null,

    schoolProfile: state => state.schoolProfile,
    studyCentreProfile: state => state.studyCentreProfile,

    currentGrade: state => state.schoolProfile.currentGrade,
    currentLevelCap: state => state.schoolProfile.currentLevelCap,
    accessibleLevels: state => state.schoolProfile.accessibleLevels,

    placementTestTaken: state => state.schoolProfile.placementTestTaken,
    placementTestResults: state => ({
      score: state.schoolProfile.placementTestScore,
      level: state.schoolProfile.assignedLevel,
      grade: state.schoolProfile.currentGrade,
      date: state.schoolProfile.placementTestDate
    }),

    // Check if user can access a specific level
    canAccessLevel: state => level => {
      if (state.learningMode === 'study_centre') {
        return true; // Study Centre has full access
      }

      if (state.learningMode === 'school') {
        const isAccessible = state.schoolProfile.accessibleLevels.includes(level);
        const isNotLocked = !state.schoolProfile.lockedLevels.includes(level);
        const withinCap = level <= state.schoolProfile.currentLevelCap;

        return isAccessible || (isNotLocked && withinCap);
      }

      // Hybrid mode
      return state.studyCentreProfile.preferences.showAllLevels ||
             state.schoolProfile.accessibleLevels.includes(level);
    },

    // Check if a level is completed
    isLevelCompleted: state => level => {
      return state.schoolProfile.completedLevels.some(cl => cl.level === level);
    },

    // Get next unlockable level
    nextUnlockableLevel: state => {
      if (state.learningMode === 'study_centre') return null;
      return state.schoolProfile.currentLevelCap + 1;
    },

    // Get level progress percentage
    levelProgress: state => {
      const totalLevels = 20;
      const completed = state.schoolProfile.completedLevels.length;
      return Math.round((completed / totalLevels) * 100);
    },

    // Get bookmarks
    bookmarkedCourses: state => state.studyCentreProfile.bookmarkedCourses,

    // Check if course is bookmarked
    isBookmarked: state => courseId => {
      return state.studyCentreProfile.bookmarkedCourses.some(
        bookmark => bookmark.courseId === courseId
      );
    },

    // Get personal learning paths
    personalPaths: state => state.studyCentreProfile.personalPaths,

    // Get mode history
    modeHistory: state => state.modeHistory,

    // Get level grade mapping
    getLevelGrade: state => level => {
      return state.levelGradeMapping[level] || 'Unknown';
    }
  }
};
