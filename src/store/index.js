import { createStore } from 'vuex';
import global from './global'; // ✅ Global loading module
import axios from 'axios';

export default createStore({
  modules: {
    global
  },

  state: {
    user: null,                // ✅ Backend user (not Firebase only)
    firebaseUserId: null,
    token: null,
    progress: {},
    diaryLogs: []
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
    }
  },

  actions: {
    async loginUser({ commit }, { userData, token }) {
      try {
        console.log('✅ [Vuex] Logging in user via Firebase:', userData?.email);

        // ✅ Save user to backend
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/users/save`,
          {
            token,
            name: userData.displayName,
            subscriptionPlan: 'free'
          }
        );

        const savedUser = res.data;

        // ✅ Commit to Vuex
        commit('setUser', savedUser);
        commit('setFirebaseUserId', savedUser.firebaseId);
        commit('setToken', token);

        // ✅ Save to localStorage
        localStorage.setItem('user', JSON.stringify(savedUser));
        localStorage.setItem('firebaseUserId', savedUser.firebaseId);
        localStorage.setItem('userId', savedUser.firebaseId); // Used by user.js
        localStorage.setItem('token', token);

        console.log('✅ [Vuex] User saved & stored');
      } catch (err) {
        console.error('❌ [Vuex] Failed to login/save user:', err);
      }
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
          console.log('✅ [Vuex] Loaded user:', user.email || user.name);
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
    }
  },

  getters: {
    isLoggedIn: (state) =>
      !!state.user && !!state.firebaseUserId && !!state.token,
    getUser: (state) => state.user,
    getFirebaseUserId: (state) => state.firebaseUserId,
    getToken: (state) => state.token,
    getProgress: (state) => state.progress,
    getDiaryLogs: (state) => state.diaryLogs
  }
});
