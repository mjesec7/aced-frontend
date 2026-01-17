<template>
  <div id="app">
    <GlobalLoader v-if="$store.state.global.loading" />
    <router-view />
  </div>
</template>

<script>
import GlobalLoader from '@/components/Global/GlobalLoader.vue';

export default {
  name: 'App',
  components: {
    GlobalLoader
  }
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;800&display=swap');

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Unbounded', sans-serif;
  background-color: #f9fafb;
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
  position: relative;
}
</style>
