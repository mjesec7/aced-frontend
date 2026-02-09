import { createStore } from 'vuex';
import global from './global';
import platformMode from './platformMode';
import user from './user';
import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.aced.live';

export default createStore({
  modules: {
    global,
    platformMode,
    user,
  },

  state: {
    user: null,
    firebaseUserId: null,
    token: null,
    progress: {},
    diaryLogs: [],
    authInitialized: false,
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
      state.progress = progress || {};
    },
    setDiaryLogs(state, logs) {
      state.diaryLogs = logs || [];
    },
    setAuthInitialized(state, value) {
      state.authInitialized = value;
    },
    logout(state) {
      state.user = null;
      state.firebaseUserId = null;
      state.token = null;
      state.progress = {};
      state.diaryLogs = [];
      state.authInitialized = true; // ✅ Still set to true to prevent auth wait from blocking forever
      localStorage.clear();
    }
  },

  actions: {
    async LoginUser({ commit }, { userData, token }) {
      try {

        const res = await axios.post(`${API_BASE_URL}/users/save`, {
          token,
          name: userData.displayName || userData.email || 'Unnamed User',
          subscriptionPlan: 'free',
        });

        const savedUser = res.data;

        commit('setUser', savedUser);
        commit('setFirebaseUserId', savedUser.firebaseId);
        commit('setToken', token);
        commit('setAuthInitialized', true);

        // 🔒 SECURITY: Only store sanitized (non-sensitive) user data
        const safeUser = {
          uid: savedUser.firebaseId,
          displayName: savedUser.displayName || savedUser.name || '',
          photoURL: savedUser.photoURL || null,
          subscriptionPlan: savedUser.subscriptionPlan || 'free'
          // Don't store: email, tokens, internal IDs
        };
        localStorage.setItem('user', JSON.stringify(safeUser));
        localStorage.setItem('firebaseUserId', savedUser.firebaseId);
        // Note: Token is managed by Firebase SDK, don't store in localStorage

      } catch (err) {
}
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

        if (user) {
          commit('setUser', user);
        }
        if (firebaseUserId) commit('setFirebaseUserId', firebaseUserId);
        if (token) commit('setToken', token);
        commit('setProgress', progress);
        commit('setDiaryLogs', diaryLogs);
        commit('setAuthInitialized', true);
      } catch (error) {
commit('setAuthInitialized', true); // Prevent hanging
      }
    },

    waitForAuthInit({ state }) {
      return new Promise((resolve) => {
        if (state.authInitialized) return resolve();
        const interval = setInterval(() => {
          if (state.authInitialized) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    },

    updateProgress({ commit }, progress) {
      commit('setProgress', progress);
      localStorage.setItem('progress', JSON.stringify(progress));
    },

    updateDiaryLogs({ commit }, logs) {
      commit('setDiaryLogs', logs);
      localStorage.setItem('diaryLogs', JSON.stringify(logs));
    }
  },

  getters: {
    isLoggedIn: (state) =>
      !!state.user && !!state.firebaseUserId && !!state.token,
    getUser: (state) => state.user,
    getFirebaseUserId: (state) => state.firebaseUserId,
    getToken: (state) => state.token,
    getProgress: (state) => state.progress,
    getDiaryLogs: (state) => state.diaryLogs,
    isAuthInitialized: (state) => state.authInitialized,
  }
});
