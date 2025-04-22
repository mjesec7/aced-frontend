import { createStore } from 'vuex';

export default createStore({
  state: {
    user: null
  },
  mutations: {
    setUser(state, userData) {
      state.user = userData;
    },
    logout(state) {
      state.user = null;
    }
  },
  actions: {
    loginUser({ commit }, userData) {
      commit('setUser', userData);
    },
    logoutUser({ commit }) {
      commit('logout');
    }
  },
  getters: {
    isLoggedIn: (state) => !!state.user,
    getUser: (state) => state.user,
  }
});
