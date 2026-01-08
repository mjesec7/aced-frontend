// src/composables/useLanguage.js
// Global language management composable for reactive language switching

import { ref, computed, watch } from 'vue';

// Reactive global state - shared across all components
const currentLanguage = ref(localStorage.getItem('lang') || 'ru');

// Available languages configuration
const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', nativeName: 'Russian' },
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿', nativeName: 'Uzbek' }
];

// Store i18n instance reference for global access
let i18nInstance = null;

/**
 * Initialize the language system with the i18n instance
 * Should be called once during app initialization
 * @param {Object} i18n - The vue-i18n instance
 */
export function initializeLanguage(i18n) {
  i18nInstance = i18n;

  // Sync initial language from localStorage
  const savedLang = localStorage.getItem('lang') || 'ru';
  currentLanguage.value = savedLang;

  if (i18n?.global?.locale) {
    i18n.global.locale.value = savedLang;
  }

  // Watch for changes from other sources (like localStorage changes in other tabs)
  window.addEventListener('storage', (event) => {
    if (event.key === 'lang' && event.newValue) {
      setLanguage(event.newValue);
    }
  });
}

/**
 * Set the application language globally
 * @param {string} langCode - Language code ('en', 'ru', 'uz')
 */
export function setLanguage(langCode) {
  // Validate language code
  const isValidLang = languages.some(lang => lang.code === langCode);
  if (!isValidLang) {
    console.warn(`Invalid language code: ${langCode}. Using 'ru' as fallback.`);
    langCode = 'ru';
  }

  // Update reactive state
  currentLanguage.value = langCode;

  // Update i18n instance
  if (i18nInstance?.global?.locale) {
    i18nInstance.global.locale.value = langCode;
  }

  // Persist to localStorage
  localStorage.setItem('lang', langCode);

  // Update document language attribute for accessibility
  document.documentElement.lang = langCode;

  // Dispatch global event for any non-Vue components or external listeners
  window.dispatchEvent(new CustomEvent('language-changed', {
    detail: { language: langCode, timestamp: Date.now() }
  }));
}

/**
 * Get the current language code
 * @returns {string} Current language code
 */
export function getLanguage() {
  return currentLanguage.value;
}

/**
 * Composable hook for language management
 * Use this in Vue components for reactive language access
 */
export function useLanguage() {
  // Current language (reactive)
  const language = computed(() => currentLanguage.value);

  // Current language info object
  const currentLanguageInfo = computed(() => {
    return languages.find(lang => lang.code === currentLanguage.value) || languages[1]; // Default to Russian
  });

  // Current language label
  const currentLanguageLabel = computed(() => {
    return currentLanguageInfo.value?.label || 'Русский';
  });

  // Current language flag
  const currentLanguageFlag = computed(() => {
    return currentLanguageInfo.value?.flag || '🇷🇺';
  });

  // Check if a specific language is active
  const isLanguage = (langCode) => {
    return currentLanguage.value === langCode;
  };

  // Switch to next language (cycle through)
  const cycleLanguage = () => {
    const currentIndex = languages.findIndex(lang => lang.code === currentLanguage.value);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex].code);
  };

  return {
    // State
    language,
    currentLanguage: language, // alias for backwards compatibility
    languages,
    currentLanguageInfo,
    currentLanguageLabel,
    currentLanguageFlag,

    // Methods
    setLanguage,
    getLanguage,
    isLanguage,
    cycleLanguage
  };
}

// Export for direct access
export { currentLanguage, languages };

export default useLanguage;
