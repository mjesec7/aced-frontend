import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store'; // ✅ Vuex store
import './assets/css/responsive.css'; 

const app = createApp(App);

app.use(router);   // ✅ Apply router
app.use(store);    // ✅ Apply Vuex store

app.mount('#app'); // ✅ Mount app
