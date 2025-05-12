import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import './assets/css/responsive.css';
import 'vue-toast-notification/dist/theme-sugar.css';
import VueToast from 'vue-toast-notification';

import { createI18n } from 'vue-i18n';
import messages from './locales/messages.json'; // ✅ Your full translations

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
app.use(i18n); // ✅ Register i18n

// 🔐 Load session & mount app
Promise.resolve(store.dispatch('loadUserFromLocalStorage'))
  .then(() => {
    console.log('✅ Session loaded, mounting app...');
    app.mount('#app');
  })
  .catch((err) => {
    console.error('❌ Failed to load session:', err);
    app.mount('#app'); // Still mount so app doesn't break
  });
