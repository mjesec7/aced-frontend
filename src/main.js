import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import './assets/css/responsive.css';
import 'vue-toast-notification/dist/theme-sugar.css';
import VueToast from 'vue-toast-notification';

import { createI18n } from 'vue-i18n';
import messages from './locales/messages.json'; // ✅ Your full translations

// 🔐 Firebase Auth
import { auth } from './firebase'; // make sure this is set up correctly
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

// 🌍 Setup I18n
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'en', // Default language
  fallbackLocale: 'en',
  messages
});

// 🚀 Create app instance
const app = createApp(App);

app.use(store);
app.use(router);
app.use(VueToast);
app.use(i18n);

// 🔐 Handle session & user sync with backend
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken();

      // 🛠 Ensure user exists in backend
      const saveRes = await axios.post('https://api.aced.live/api/users/save', {
        token,
        name: user.displayName || user.email
      });

      const savedUser = saveRes.data;
      store.commit('setCurrentUser', savedUser);
      localStorage.setItem('user', JSON.stringify(savedUser));

      console.log('✅ User saved and session loaded.');
    } catch (err) {
      console.error('❌ Failed to sync user with backend:', err);
    }
  } else {
    store.commit('setCurrentUser', null);
    localStorage.removeItem('user');
    console.log('ℹ️ No authenticated user found.');
  }

  // ⬇️ Mount app after auth check
  app.mount('#app');
});
