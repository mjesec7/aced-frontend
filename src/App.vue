<template>
  <div id="app">
    <LanguageSwitcher />
    <router-view />
  </div>
</template>

<script>
import LanguageSwitcher from '@/components/Global/LanguageSwitcher.vue';
import { translateText } from '@/services/translationService';

export default {
  name: 'App',
  components: { LanguageSwitcher },
  watch: {
    '$route'() {
      this.applyTranslation();
    }
  },
  mounted() {
    this.applyTranslation();
  },
  methods: {
    async applyTranslation() {
      const lang = localStorage.getItem('lang') || 'en';
      const elements = document.querySelectorAll('[data-translate], h1, h2, h3, h4, h5, h6, p, button, span, label, a, li');

      for (const el of elements) {
        const text = el.dataset.originalText || el.innerText;
        el.dataset.originalText = text;
        try {
          const translated = await translateText(text, lang);
          el.innerText = translated;
        } catch (err) {
          console.warn('Translation failed for:', text);
        }
      }
    }
  }
};
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  font-family: 'Unbounded', sans-serif;
  background-color: #f9fafb;
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
}
</style>
