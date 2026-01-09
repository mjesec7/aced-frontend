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
    cycleLanguage,
    getLocalizedText
  };
}

/**
 * Extract localized text from a field that may be:
 * - A simple string
 * - An object with language keys { en: "...", ru: "...", uz: "..." }
 * - Part of a translations object
 * @param {any} data - The data object or string
 * @param {string} [field] - Optional field name if data is an object
 * @param {string} [fallback] - Fallback text if nothing found
 * @returns {string} Localized text
 */
export function getLocalizedText(data, field = null, fallback = '') {
  if (!data) return fallback;

  const lang = currentLanguage.value || 'ru';

  // Case 1: data is the value itself (string or object with lang keys)
  if (!field) {
    if (typeof data === 'string') return data.trim();

    if (typeof data === 'object') {
      // Try current language
      if (data[lang] && typeof data[lang] === 'string') return data[lang].trim();

      // Try fallbacks
      const fallbacks = ['en', 'ru', 'uz'];
      for (const fb of fallbacks) {
        if (data[fb] && typeof data[fb] === 'string') return data[fb].trim();
      }

      // Try any string value
      const values = Object.values(data);
      for (const v of values) {
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
    }
    return fallback;
  }

  // Case 2: data is a container object, we need to look up 'field'
  const value = data[field];

  // If the field value is a simple string
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  // If the field value is an object with language keys
  if (typeof value === 'object' && value !== null) {
    if (value[lang] && typeof value[lang] === 'string') return value[lang].trim();

    const fallbacks = ['en', 'ru', 'uz'];
    for (const fb of fallbacks) {
      if (value[fb] && typeof value[fb] === 'string') return value[fb].trim();
    }

    const values = Object.values(value);
    for (const v of values) {
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }

  // Check translations object in the data container
  if (data.translations && typeof data.translations === 'object') {
    const langTrans = data.translations[lang] || data.translations.en || data.translations.ru || data.translations.uz;
    if (langTrans && langTrans[field] && typeof langTrans[field] === 'string') {
      return langTrans[field].trim();
    }
  }

  return fallback;
}

// Export for direct access
export { currentLanguage, languages };

export default useLanguage;
