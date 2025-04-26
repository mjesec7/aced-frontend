import { createStore } from 'vuex';

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    firebaseUserId: localStorage.getItem('firebaseUserId') || null,
    progress: {},   // ✅ To track user progress easily across app
    diaryLogs: [],  // ✅ To track saved diary logs
  },
  mutations: {
    setUser(state, userData) {
      state.user = userData;
      localStorage.setItem('user', JSON.stringify(userData));
    },
    setFirebaseUserId(state, firebaseId) {
      state.firebaseUserId = firebaseId;
      localStorage.setItem('firebaseUserId', firebaseId);
    },
    logout(state) {
      state.user = null;
      state.firebaseUserId = null;
      state.progress = {};
      state.diaryLogs = [];
      localStorage.removeItem('user');
      localStorage.removeItem('firebaseUserId');
    },
    setProgress(state, progressData) {
      state.progress = progressData;
    },
    setDiaryLogs(state, diaryLogs) {
      state.diaryLogs = diaryLogs;
    }
  },
  actions: {
    loginUser({ commit }, userData) {
      commit('setUser', userData);
    },
    setFirebaseId({ commit }, firebaseId) {
      commit('setFirebaseUserId', firebaseId);
    },
    logoutUser({ commit }) {
      commit('logout');
    },
    loadUserFromLocalStorage({ commit }) {
      const savedUser = localStorage.getItem('user');
      const savedFirebaseId = localStorage.getItem('firebaseUserId');
      if (savedUser) {
        commit('setUser', JSON.parse(savedUser));
      }
      if (savedFirebaseId) {
        commit('setFirebaseUserId', savedFirebaseId);
      }
    },
    updateProgress({ commit }, progressData) {
      commit('setProgress', progressData);
    },
    updateDiaryLogs({ commit }, diaryLogs) {
      commit('setDiaryLogs', diaryLogs);
    }
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    getUser: (state) => state.user,
    getFirebaseUserId: (state) => state.firebaseUserId,
    getProgress: (state) => state.progress,
    getDiaryLogs: (state) => state.diaryLogs,
  }
});
