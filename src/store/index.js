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
      console.log('✅ [Vuex] Logging in user:', userData?.email);

      commit('setUser', userData);
      commit('setFirebaseUserId', userData.uid);
      commit('setToken', token);

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('firebaseUserId', userData.uid);
      localStorage.setItem('token', token);
    },

    logoutUser({ commit }) {
      console.log('👋 [Vuex] Logging out user');
      commit('logout');
    },

    loadUserFromLocalStorage({ commit }) {
      try {
        console.log('📦 [Vuex] Loading session from localStorage...');
        const user = JSON.parse(localStorage.getItem('user'));
        const firebaseUserId = localStorage.getItem('firebaseUserId');
        const token = localStorage.getItem('token');
        const progress = JSON.parse(localStorage.getItem('progress') || '{}');
        const diaryLogs = JSON.parse(localStorage.getItem('diaryLogs') || '[]');

        if (user) {
          commit('setUser', user);
          console.log('✅ [Vuex] Loaded user:', user.email);
        }
        if (firebaseUserId) commit('setFirebaseUserId', firebaseUserId);
        if (token) commit('setToken', token);
        commit('setProgress', progress);
        commit('setDiaryLogs', diaryLogs);
      } catch (error) {
        console.error('❌ [Vuex] Error loading from localStorage:', error);
      }
    },

    updateProgress({ commit }, progress) {
      commit('setProgress', progress);
      localStorage.setItem('progress', JSON.stringify(progress));
      console.log('📈 [Vuex] Progress updated');
    },

    updateDiaryLogs({ commit }, logs) {
      commit('setDiaryLogs', logs);
      localStorage.setItem('diaryLogs', JSON.stringify(logs));
      console.log('📘 [Vuex] Diary logs updated');
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
