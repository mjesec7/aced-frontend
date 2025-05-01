import { createStore } from 'vuex';

export default createStore({
  state: {
    user: null,
    firebaseUserId: null,
    token: null,
    progress: {},
    diaryLogs: [],
  },

  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setFirebaseUserId(state, id) {
      state.firebaseUserId = id;
    },
    setToken(state, token) {
      state.token = token;
    },
    setProgress(state, progress) {
      state.progress = progress;
    },
    setDiaryLogs(state, logs) {
      state.diaryLogs = logs;
    },
    logout(state) {
      state.user = null;
      state.firebaseUserId = null;
      state.token = null;
      state.progress = {};
      state.diaryLogs = [];
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
      } catch (error) {
        console.error('❌ Ошибка при загрузке данных из localStorage:', error);
      }
    },

    updateProgress({ commit }, progress) {
      commit('setProgress', progress);
      localStorage.setItem('progress', JSON.stringify(progress));
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
