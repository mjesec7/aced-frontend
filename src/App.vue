<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: "App"
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
