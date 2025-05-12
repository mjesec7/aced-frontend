<template>
    <div class="language-switcher">
      <button @click="showDropdown = !showDropdown">{{ languageLabel }}</button>
      <div v-if="showDropdown" class="dropdown">
        <div
          v-for="lang in otherLanguages"
          :key="lang.code"
          @click="changeLanguage(lang.code)"
          class="dropdown-item"
        >
          {{ lang.label }}
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'LanguageSwitcher',
    data() {
      return {
        showDropdown: false,
        languages: [
          { code: 'en', label: 'EN' },
          { code: 'ru', label: 'RU' },
          { code: 'uz', label: 'UZ' }
        ]
      };
    },
    computed: {
      currentLang() {
        return this.$i18n.locale;
      },
      languageLabel() {
        return this.languages.find(lang => lang.code === this.currentLang)?.label || '🌐';
      },
      otherLanguages() {
        return this.languages.filter(lang => lang.code !== this.currentLang);
      }
    },
    methods: {
      changeLanguage(lang) {
        this.$i18n.locale = lang;
        localStorage.setItem('lang', lang);
        this.showDropdown = false;
      }
    }
  };
  </script>
  
  <style scoped>
  .language-switcher {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
  }
  .toggle-button {
    background: linear-gradient(to right, #7c3aed, #6d28d9);
    color: white;
    padding: 8px 14px;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
  }
  .dropdown {
    margin-top: 6px;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: absolute;
    right: 0;
  }
  .dropdown-item {
    display: block;
    padding: 8px 14px;
    width: 100%;
    background: white;
    border: none;
    text-align: left;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .dropdown-item:hover {
    background: #f3f4f6;
  }
  </style>
  