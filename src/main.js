import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import './assets/css/responsive.css';
import 'vue-toast-notification/dist/theme-sugar.css';
import VueToast from 'vue-toast-notification';

import { createI18n } from 'vue-i18n';
import messages from './locales/messages.json';

import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

// 🌍 i18n Setup
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'en',
  fallbackLocale: 'en',
  messages,
});

// 🧠 Restore Vuex state from localStorage
store.dispatch('loadUserFromLocalStorage');

// 🚀 Create app instance (but delay mounting)
const app = createApp(App);
app.use(store);
app.use(router);
app.use(VueToast);
app.use(i18n);

// 🔐 Firebase Auth & Backend Sync
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken();

      const response = await axios.post('https://api.aced.live/api/users/save', {
        token,
        name: user.displayName || user.email || 'Unnamed User',
        subscriptionPlan: 'free'
      });

      const savedUser = response.data;
      store.commit('setUser', savedUser);
      store.commit('setFirebaseUserId', savedUser.firebaseId);
      store.commit('setToken', token);

      localStorage.setItem('user', JSON.stringify(savedUser));
      localStorage.setItem('firebaseUserId', savedUser.firebaseId);
      localStorage.setItem('token', token);

      console.log('✅ User synced with backend');
    } catch (error) {
      console.error('❌ Failed to sync user:', error.response?.data || error.message);
    }
  } else {
    console.log('👋 No Firebase session found, clearing Vuex state');
    store.commit('logout');
  }

  // ✅ Mount app only after auth check is done
  app.mount('#app');
});
