// src/main.js - FINAL VERSION: Stable Auth & Reactive Status Changes

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

// Style and Plugin Imports
import './assets/css/responsive.css';
import 'vue-toast-notification/dist/theme-sugar.css';
import VueToast from 'vue-toast-notification';

// i18n and Firebase Imports
import { createI18n } from 'vue-i18n';
import messages from './locales/messages.json';
import { auth } from './firebase';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';

// ============================================================================
// 1. A SINGLE, CLEAN GLOBAL EVENT TRIGGER
// ============================================================================

/**
 * Dispatches a custom browser event for app-wide communication.
 * This is the single, reliable way we will notify components of a change.
 * @param {string} eventName - The name of the event.
 * @param {object} data - The data to pass with the event.
 */
function triggerGlobalEvent(eventName, data = {}) {
  console.log(`🌍 Triggering global event: ${eventName}`, data);
  const event = new CustomEvent(eventName, {
    detail: data,
    bubbles: true,
    cancelable: true
  });
  window.dispatchEvent(event);
}

// ============================================================================
// 2. THE STABLE AUTHENTICATION PROMISE
// This ensures authentication is resolved correctly before the app loads.
// ============================================================================

export const authInitPromise = new Promise((resolve) => {
  setPersistence(auth, browserLocalPersistence)
    .catch((error) => console.error('❌ Failed to set auth persistence:', error));

  let authStateResolved = false;
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (authStateResolved) return;
    authStateResolved = true;
    unsubscribe();

    console.log('🔐 Auth state determined:', firebaseUser ? `Logged in as ${firebaseUser.email}` : 'User not logged in');
    
    try {
      await store.dispatch('user/initialize');
      
      if (firebaseUser) {
        // --- User is Authenticated ---
        try {
          const token = await firebaseUser.getIdToken();
          const userData = {
            uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL, emailVerified: firebaseUser.emailVerified,
          };
          
          const saveResult = await store.dispatch('user/saveUser', { userData, token });

          if (!saveResult || !saveResult.success) {
            console.warn('⚠️ Could not sync user with backend. Using local data as fallback.', saveResult?.error);
            store.commit('user/SET_USER', {
                uid: firebaseUser.uid, firebaseId: firebaseUser.uid, _id: firebaseUser.uid,
                email: firebaseUser.email, name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                subscriptionPlan: 'free',
            });
          }
        } catch (error) {
            console.error("❌ Critical error during user sync. Using fallback:", error);
            store.commit('user/SET_USER', { uid: firebaseUser.uid, email: firebaseUser.email, _id: firebaseUser.uid });
        }
      } else {
        // --- User is Not Authenticated ---
        await store.dispatch('user/logout');
      }

      // NOW that auth is handled, mount the app.
      mountVueApplication();
      resolve({ authenticated: !!firebaseUser });

    } catch (error) {
      console.error('❌ Critical initialization failed:', error);
      mountVueApplication(); // Mount anyway to avoid a blank screen.
      resolve({ authenticated: false, error: error.message });
    }
  });
});

// ============================================================================
// 3. STORE INTERCEPTOR
// This is the key to fixing your status-change problem. It listens for the
// state change in Vuex and fires our clean global event.
// ============================================================================

function setupStoreInterceptor(store) {
  store.subscribe((mutation, state) => {
    // We only care about the mutation that changes the user's subscription status.
    if (mutation.type === 'user/SET_USER_STATUS') {
      console.log('📡 Store Interceptor: User status changed to ->', mutation.payload);
      
      // Trigger a single, clear event that the whole app can listen to.
      triggerGlobalEvent('userStatusHasChanged', {
        newStatus: mutation.payload,
        source: 'vuex-mutation'
      });
    }
  });
}


// ============================================================================
// 4. VUE APPLICATION MOUNTING
// ============================================================================

let app; // To prevent double-mounting

function mountVueApplication() {
    if (app) return;

    app = createApp(App);

    const i18n = createI18n({
        legacy: false,
        locale: localStorage.getItem('lang') || 'ru',
        fallbackLocale: 'en',
        messages,
    });
    
    app.use(store);
    app.use(router);
    app.use(VueToast, { position: 'top-right', duration: 4000 });
    app.use(i18n);

    // This is a critical step: The interceptor is set up *before* the app is mounted.
    setupStoreInterceptor(store);

    app.config.errorHandler = (err, instance, info) => {
        console.error('❌ Vue Error:', err, {
            component: instance?.$options?.name,
            info: info,
        });
    };

    app.mount('#app');
    console.log('🚀 Vue application has been successfully mounted.');
}