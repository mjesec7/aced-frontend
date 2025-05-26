const state = () => ({
  currentUser: null,
  userStatus: 'free' // fallback
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
      const userId =
        localStorage.getItem('userId') ||
        localStorage.getItem('firebaseUserId');
      if (!userId) {
        console.warn('⚠️ No userId found for subscription status check');
        return;
      }

      const res = await fetch(`/api/users/${userId}/status`);
      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();
      commit('setUserStatus', data.status || 'free');
      console.log('✅ [Vuex:user] Loaded user status:', data.status);
    } catch (err) {
      console.error('❌ [Vuex:user] Failed to load user status:', err);
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
