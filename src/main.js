import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import './assets/css/responsive.css';
import 'vue-toast-notification/dist/theme-sugar.css';
import VueToast from 'vue-toast-notification';

const app = createApp(App);

// ✅ Register global plugins
app.use(store);
app.use(router);
app.use(VueToast);

// ✅ Restore user session before mounting the app
store.dispatch('loadUserFromLocalStorage').then(() => {
  app.mount('#app');
});
