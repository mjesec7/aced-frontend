<template>
  <div id="app">
    <router-view></router-view> <!-- This is where pages like /settings will be loaded -->
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>

<style>
/* Global Styles */
body, html {
  margin: 0;
  padding: 0;
  font-family: 'Unbounded', sans-serif;
  background-color: #f8f9fa;
}
</style>
