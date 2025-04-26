import { createStore } from 'vuex';

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    firebaseUserId: localStorage.getItem('firebaseUserId') || null,
    progress: JSON.parse(localStorage.getItem('progress')) || {}, 
    diaryLogs: JSON.parse(localStorage.getItem('diaryLogs')) || [],
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
    setProgress(state, progressData) {
      state.progress = progressData;
      localStorage.setItem('progress', JSON.stringify(progressData));
    },
    setDiaryLogs(state, diaryLogs) {
      state.diaryLogs = diaryLogs;
      localStorage.setItem('diaryLogs', JSON.stringify(diaryLogs));
    },
    logout(state) {
      state.user = null;
      state.firebaseUserId = null;
      state.progress = {};
      state.diaryLogs = [];
      localStorage.removeItem('user');
      localStorage.removeItem('firebaseUserId');
      localStorage.removeItem('progress');
      localStorage.removeItem('diaryLogs');
    },
  },
  actions: {
    loginUser({ commit }, userData) {
      commit('setUser', userData);
      commit('setFirebaseUserId', userData.uid);
    },
    logoutUser({ commit }) {
      commit('logout');
    },
    loadUserFromLocalStorage({ commit }) {
      const savedUser = localStorage.getItem('user');
      const savedFirebaseId = localStorage.getItem('firebaseUserId');
      const savedProgress = localStorage.getItem('progress');
      const savedDiaryLogs = localStorage.getItem('diaryLogs');

      if (savedUser) {
        commit('setUser', JSON.parse(savedUser));
      }
      if (savedFirebaseId) {
        commit('setFirebaseUserId', savedFirebaseId);
      }
      if (savedProgress) {
        commit('setProgress', JSON.parse(savedProgress));
      }
      if (savedDiaryLogs) {
        commit('setDiaryLogs', JSON.parse(savedDiaryLogs));
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
    isLoggedIn: (state) => !!state.user && !!state.firebaseUserId,
    getUser: (state) => state.user,
    getFirebaseUserId: (state) => state.firebaseUserId,
    getProgress: (state) => state.progress,
    getDiaryLogs: (state) => state.diaryLogs,
  }
});
