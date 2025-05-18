const state = () => ({
  currentUser: null,
  userStatus: 'free' // default fallback
});

const mutations = {
  setUser(state, user) {
    state.currentUser = user;
  },
  clearUser(state) {
    state.currentUser = null;
    state.userStatus = 'free';
  },
  setUserStatus(state, status) {
    state.userStatus = status;
  }
};

const actions = {
  async loadUserStatus({ commit }) {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      const res = await fetch(`/api/users/${userId}/status`);
      const data = await res.json();
      commit('setUserStatus', data.status);
    } catch (err) {
      console.error('❌ Failed to load user status:', err);
    }
  }
};

const getters = {
  isAuthenticated: (state) => !!state.currentUser,
  getUser: (state) => state.currentUser,
  userStatus: (state) => state.userStatus,
  isPremiumUser: (state) => {
    return state.userStatus === 'premium' || state.userStatus === 'start';
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
