import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import './assets/css/responsive.css';
import 'vue-toast-notification/dist/theme-sugar.css';
import VueToast from 'vue-toast-notification';

const app = createApp(App);

app.use(store);
app.use(router);
app.use(VueToast);

Promise.resolve(store.dispatch('loadUserFromLocalStorage'))
  .then(() => {
    console.log('✅ Session loaded, mounting app...');
    app.mount('#app');
  })
  .catch((err) => {
    console.error('❌ Failed to load session:', err);
    app.mount('#app'); // still mount so app loads
  });
