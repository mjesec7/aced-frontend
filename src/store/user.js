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
  async saveUserToBackend({ commit }, { userData, token }) {
    try {
      console.log('📤 Saving user to backend:', userData?.email || userData?.name);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: userData.displayName || userData.name || 'Unnamed User',
          subscriptionPlan: 'free'
        })
      });

      if (!res.ok) throw new Error('Failed to save user');

      const savedUser = await res.json();
      commit('setUser', savedUser);
      localStorage.setItem('userId', savedUser.firebaseId);
      console.log('✅ User saved and stored');
    } catch (err) {
      console.error('❌ Failed to save user to backend:', err);
    }
  },

  async loadUserStatus({ commit }) {
    try {
      const userId =
        localStorage.getItem('userId') ||
        localStorage.getItem('firebaseUserId');

      if (!userId) {
        console.warn('⚠️ No userId found for subscription status check');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${userId}/status`);
      if (!res.ok) {
        console.warn('⚠️ No user found on backend, assuming "free" status');
        commit('setUserStatus', 'free');
        return;
      }

      const data = await res.json();
      commit('setUserStatus', data.status || 'free');
      console.log('✅ Loaded user status:', data.status);
    } catch (err) {
      console.error('❌ Failed to load user status:', err);
    }
  }
};

const getters = {
  isAuthenticated: (state) => !!state.currentUser,
  getUser: (state) => state.currentUser,
  userStatus: (state) => state.userStatus,
  isPremiumUser: (state) =>
    state.userStatus === 'premium' || state.userStatus === 'start'
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};
