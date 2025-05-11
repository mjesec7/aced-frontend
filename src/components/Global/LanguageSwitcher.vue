<template>
    <div class="language-switcher">
      <button 
        v-for="lang in languages" 
        :key="lang.code" 
        @click="changeLanguage(lang.code)"
        :class="{ active: currentLang === lang.code }"
      >
        {{ lang.label }}
      </button>
    </div>
  </template>
  
  <script>
  import { translateText } from '@/services/translationService';
  
  export default {
    name: 'LanguageSwitcher',
    data() {
      return {
        languages: [
          { code: 'en', label: 'EN' },
          { code: 'ru', label: 'RU' },
          { code: 'uz', label: 'UZ' }
        ],
        currentLang: localStorage.getItem('lang') || 'en'
      };
    },
    methods: {
      async changeLanguage(langCode) {
        this.currentLang = langCode;
        localStorage.setItem('lang', langCode);
  
        // Optional: Notify other components
        this.$emit('languageChanged', langCode);
  
        // Translate dynamic visible text
        const translatableElements = document.querySelectorAll('[data-translate]');
        for (const el of translatableElements) {
          const original = el.dataset.originalText || el.innerText;
          el.dataset.originalText = original;
          el.innerText = await translateText(original, langCode);
        }
      }
    },
    mounted() {
      // Auto-apply language on mount
      this.changeLanguage(this.currentLang);
    }
  };
  </script>
  
  <style scoped>
  .language-switcher {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    gap: 10px;
  }
  .language-switcher button {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 6px 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .language-switcher button.active,
  .language-switcher button:hover {
    background: linear-gradient(to right, #7c3aed, #6d28d9);
    color: white;
    border: none;
  }
  </style>
  