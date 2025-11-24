// store/global.js
export default {
    namespaced: true,
    state: () => ({
      loading: false
    }),
    mutations: {
      setLoading(state, value) {
        state.loading = value;
      }
    },
    getters: {
      isLoading: (state) => state.loading
    }
  };
  