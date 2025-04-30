import { createStore } from 'vuex';

export default createStore({
  state: {
    user: null,
    firebaseUserId: null,
    progress: {},
    diaryLogs: [],
    token: null,
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setFirebaseUserId(state, id) {
      state.firebaseUserId = id;
    },
    setProgress(state, progress) {
      state.progress = progress;
    },
    setDiaryLogs(state, logs) {
      state.diaryLogs = logs;
    },
    setToken(state, token) {
      state.token = token;
    },
    logout(state) {
      state.user = null;
      state.firebaseUserId = null;
      state.progress = {};
      state.diaryLogs = [];
      state.token = null;

      localStorage.clear();
    },
  },
  actions: {
    loginUser({ commit }, { userData, token }) {
      commit('setUser', userData);
      commit('setFirebaseUserId', userData.uid);
      commit('setToken', token);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('firebaseUserId', userData.uid);
      localStorage.setItem('token', token);
    },
    logoutUser({ commit }) {
      commit('logout');
    },
    loadUserFromLocalStorage({ commit }) {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const firebaseUserId = localStorage.getItem('firebaseUserId');
        const token = localStorage.getItem('token');
        const progress = JSON.parse(localStorage.getItem('progress') || '{}');
        const diaryLogs = JSON.parse(localStorage.getItem('diaryLogs') || '[]');

        if (user) commit('setUser', user);
        if (firebaseUserId) commit('setFirebaseUserId', firebaseUserId);
        if (token) commit('setToken', token);
        commit('setProgress', progress);
        commit('setDiaryLogs', diaryLogs);
      } catch (err) {
        console.error('❌ Ошибка чтения из localStorage:', err);
      }
    },
    updateProgress({ commit }, progressData) {
      commit('setProgress', progressData);
      localStorage.setItem('progress', JSON.stringify(progressData));
    },
    updateDiaryLogs({ commit }, logs) {
      commit('setDiaryLogs', logs);
      localStorage.setItem('diaryLogs', JSON.stringify(logs));
    },
  },
  getters: {
    isLoggedIn: (state) =>
      !!state.user && !!state.firebaseUserId && !!state.token,
    getUser: (state) => state.user,
    getFirebaseUserId: (state) => state.firebaseUserId,
    getToken: (state) => state.token,
    getProgress: (state) => state.progress,
    getDiaryLogs: (state) => state.diaryLogs,
  },
});
