<template>
  <div id="app">
    <LanguageSwitcher />
    <router-view />
  </div>
</template>

<script>
import LanguageSwitcher from '@/components/Global/LanguageSwitcher.vue';

export default {
  name: 'App',
  components: { LanguageSwitcher }
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
