const state = () => ({
    currentUser: null
  });
  
  const mutations = {
    setUser(state, user) {
      state.currentUser = user;
    },
    clearUser(state) {
      state.currentUser = null;
    }
  };
  
  const getters = {
    isAuthenticated: (state) => !!state.currentUser,
    getUser: (state) => state.currentUser
  };
  
  export default {
    namespaced: true,
    state,
    mutations,
    getters
  };
  