import { createStore } from 'vuex';
import global from './global';
import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'https://api.aced.live';

export default createStore({
  modules: {
    global,
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
    async loginUser({ commit }, { userData, token }) {
      try {
        console.log('✅ [Vuex] Logging in user via Firebase:', userData?.email);

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

        localStorage.setItem('user', JSON.stringify(savedUser));
        localStorage.setItem('firebaseUserId', savedUser.firebaseId);
        localStorage.setItem('token', token);

        console.log('✅ [Vuex] User saved and synced');
      } catch (err) {
        console.error('❌ [Vuex] Login error:', err.response?.data || err.message);
      }
    },

    logoutUser({ commit }) {
      console.log('👋 [Vuex] Logging out user');
      commit('logout');
    },

    loadUserFromLocalStorage({ commit }) {
      try {
        console.log('📦 [Vuex] Loading session...');
        const user = JSON.parse(localStorage.getItem('user'));
        const firebaseUserId = localStorage.getItem('firebaseUserId');
        const token = localStorage.getItem('token');
        const progress = JSON.parse(localStorage.getItem('progress') || '{}');
        const diaryLogs = JSON.parse(localStorage.getItem('diaryLogs') || '[]');

        if (user) {
          commit('setUser', user);
          console.log('✅ [Vuex] Loaded user:', user.email || user.name);
        }
        if (firebaseUserId) commit('setFirebaseUserId', firebaseUserId);
        if (token) commit('setToken', token);
        commit('setProgress', progress);
        commit('setDiaryLogs', diaryLogs);
        commit('setAuthInitialized', true);
      } catch (error) {
        console.error('❌ [Vuex] Error loading local session:', error);
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
      console.log('📈 [Vuex] Progress updated');
    },

    updateDiaryLogs({ commit }, logs) {
      commit('setDiaryLogs', logs);
      localStorage.setItem('diaryLogs', JSON.stringify(logs));
      console.log('📘 [Vuex] Diary logs updated');
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
