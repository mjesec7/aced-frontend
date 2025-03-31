<template>
  <nav class="nav-container">
    <router-link to="/" class="nav-link">Главная</router-link>
    <router-link to="/education" class="nav-link">Образование</router-link>
    <router-link to="/about" class="nav-link">О Нас</router-link>
    <router-link to="/contacts" class="nav-link">Контакты</router-link>
  </nav>
</template>

<script>
export default {
  name: 'StickyNavbar',
};
</script>

<style scoped>
.nav-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: black;
  width: 60%;
  max-width: 800px;
  height: 60px;
  border-radius: 30px; /* Long oval shape */
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1); /* Light shadow for depth */
  border: 1px solid black; /* Subtle black border */
  z-index: 999;
}

.nav-link {
  text-decoration: none;
  font-family: 'Unbounded', sans-serif;
  font-weight: 700; /* Bold text */
  color: white;
  padding: 10px 20px;
  transition: color 0.3s ease, border 0.3s ease;
}

</style>
