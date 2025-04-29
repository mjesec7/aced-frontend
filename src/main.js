import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store'; // ✅ Vuex store
import './assets/css/responsive.css'; 
import 'vue-toast-notification/dist/theme-sugar.css';
import VueToast from 'vue-toast-notification';

app.use(VueToast);


const app = createApp(App);

app.use(router);   // ✅ Use router
app.use(store);    // ✅ Use Vuex store

// ✅ Load user from localStorage into Vuex before app mounts
store.dispatch('loadUserFromLocalStorage');

app.mount('#app'); // ✅ Mount the app
