// src/main.js - REFACTORED ENTRY POINT

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
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// ============================================================================
// 🔥 IMPORT ALL UTILITY MODULES
// ============================================================================
import { eventBus, setupGlobalEventSystem } from './utils/eventBus.js';
import { authInitPromise, setupAuthStateListener } from './utils/auth.js';
import { setupGlobalHelpers } from './utils/helpers.js';
import { 
  immediateSubscriptionRestore, 
  setupAuthSubscriptionMonitoring,
  setupSubscriptionSystem 
} from './utils/subscription.js';
import { setupStoreInterceptor } from './utils/storeInterceptor.js';
import { setupGlobalErrorHandling } from './utils/errorHandling.js';
import { setupEnhancedGlobalSubscriptionManagement } from './utils/subscriptionManagement.js';
import { setupDevTools } from './utils/devTools.js';

// ============================================================================
// 🛡️ IMMEDIATE SUBSCRIPTION RESTORATION (RUNS BEFORE EVERYTHING)
// ============================================================================
const preservedStatus = immediateSubscriptionRestore();
// Setup auth subscription monitoring
setupAuthSubscriptionMonitoring();

// ============================================================================
// 🌐 INTERNATIONALIZATION SETUP
// ============================================================================
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'ru',
  fallbackLocale: 'en',
  messages,
});

// ============================================================================
// 🚀 FIREBASE AUTH PERSISTENCE SETUP
// ============================================================================
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('🔥 Firebase auth persistence set to LOCAL');
  })
  .catch((error) => {
    console.error('❌ Firebase persistence setup failed:', error);
  });

// ============================================================================
// 📊 TRACK APP LIFECYCLE
// ============================================================================
export const appLifecycle = {
  initialized: false,
  mounted: false,
  authReady: false,
  storeReady: false
};

// ============================================================================
// 🌐 MAKE GLOBAL OBJECTS ACCESSIBLE
// ============================================================================
window.eventBus = eventBus;
window.appLifecycle = appLifecycle;

// ============================================================================
// 🔧 SETUP ALL SYSTEMS
// ============================================================================

// 1. Setup authentication state listener (starts auth flow)
setupAuthStateListener(store, router, i18n, VueToast);

// 2. Setup global event system
setupGlobalEventSystem(store);

// 3. Setup global error handling
setupGlobalErrorHandling(eventBus);

// 4. Setup subscription system (expiry checks, promocode handlers)
setupSubscriptionSystem(store, eventBus);

// 5. Setup store interceptor (auto-event triggering on mutations)
setupStoreInterceptor(store);

// 6. Setup global helper functions
setupGlobalHelpers(store, eventBus);

// ============================================================================
// 🛠️ SETUP DEVELOPMENT TOOLS (DEV MODE ONLY)
// ============================================================================
if (import.meta.env.DEV) {
  setupDevTools(store, eventBus, authInitPromise, appLifecycle);
}

// ============================================================================
// 📤 EXPORT FOR EXTERNAL USE
// ============================================================================
export { eventBus, authInitPromise };

// ============================================================================
// ✅ INITIALIZATION COMPLETE
// ============================================================================

