import { createStore } from 'vuex';

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null
  },
  mutations: {
    setUser(state, userData) {
      state.user = userData;
      localStorage.setItem('user', JSON.stringify(userData)); // 🟢 Save to localStorage
    },
    logout(state) {
      state.user = null;
      localStorage.removeItem('user'); // 🧹 Clear from localStorage
    }
  },
  actions: {
    loginUser({ commit }, userData) {
      commit('setUser', userData);
    },
    logoutUser({ commit }) {
      commit('logout');
    },
    loadUserFromLocalStorage({ commit }) {
      const saved = localStorage.getItem('user');
      if (saved) {
        commit('setUser', JSON.parse(saved));
      }
    }
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    getUser: (state) => state.user,
  }
});
