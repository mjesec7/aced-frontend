import { createStore } from 'vuex';

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    firebaseUserId: localStorage.getItem('firebaseUserId') || null,
    progress: JSON.parse(localStorage.getItem('progress')) || {},
    diaryLogs: JSON.parse(localStorage.getItem('diaryLogs')) || [],
    token: localStorage.getItem('token') || null, // ✅ Add token globally
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
    setToken(state, token) {
      state.token = token;
      localStorage.setItem('token', token);
    },
    logout(state) {
      state.user = null;
      state.firebaseUserId = null;
      state.progress = {};
      state.diaryLogs = [];
      state.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('firebaseUserId');
      localStorage.removeItem('progress');
      localStorage.removeItem('diaryLogs');
      localStorage.removeItem('token');
    },
  },
  actions: {
    loginUser({ commit }, { userData, token }) {
      commit('setUser', userData);
      commit('setFirebaseUserId', userData.uid);
      commit('setToken', token);
    },
    logoutUser({ commit }) {
      commit('logout');
    },
    loadUserFromLocalStorage({ commit }) {
      const savedUser = localStorage.getItem('user');
      const savedFirebaseId = localStorage.getItem('firebaseUserId');
      const savedProgress = localStorage.getItem('progress');
      const savedDiaryLogs = localStorage.getItem('diaryLogs');
      const savedToken = localStorage.getItem('token');

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
      if (savedToken) {
        commit('setToken', savedToken);
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
    isLoggedIn: (state) => !!state.user && !!state.firebaseUserId && !!state.token,
    getUser: (state) => state.user,
    getFirebaseUserId: (state) => state.firebaseUserId,
    getProgress: (state) => state.progress,
    getDiaryLogs: (state) => state.diaryLogs,
    getToken: (state) => state.token,
  }
});
