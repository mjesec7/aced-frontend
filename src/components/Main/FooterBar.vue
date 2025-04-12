<template>
  <footer class="main-footer" id="contacts">
    <div class="footer-grid">
      <!-- Logo + Message -->
      <div class="footer-brand">
        <h2>ACED</h2>
        <p>Образование нового поколения. Мы рядом, чтобы помочь тебе расти.</p>
      </div>

      <!-- Navigation -->
      <div class="footer-section">
        <h4>Навигация</h4>
        <ul>
          <li><a href="#about-us">О Нас</a></li>
          <li><a href="#cards">Возможности</a></li>
          <li><a href="#passion-test">Тест</a></li>
          <li><a href="#ai">AI Помощник</a></li>
        </ul>
      </div>

      <!-- Contact -->
      <div class="footer-section">
        <h4>Контакты</h4>
        <p>Email: <a href="mailto:hello@aced.ai">hello@aced.ai</a></p>
        <p>Telegram: @aced_ai</p>
      </div>
    </div>

    <div class="footer-bottom">
      <p>© 2025 ACED. Все права защищены.</p>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'FooterBar'
}
</script>

<style scoped>
.main-footer {
  width: 100%;
  padding: 80px 40px 30px;
  background: radial-gradient(ellipse at center, #0a0c2b, #1b1e44);
  color: white;
  font-family: 'Unbounded', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 40px;
  width: 100%;
  max-width: 1200px;
}

.footer-brand {
  flex: 1;
  min-width: 250px;
}

.footer-brand h2 {
  font-size: 2rem;
  background: linear-gradient(to right, #a855f7, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}

.footer-section {
  flex: 1;
  min-width: 200px;
}

.footer-section h4 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: #c084fc;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 10px;
}

.footer-section a {
  text-decoration: none;
  color: #d1d5db;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: #ffffff;
}

.footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.1);
  margin-top: 50px;
  padding-top: 20px;
  font-size: 0.9rem;
  color: #a3a3c2;
  text-align: center;
  width: 100%;
}
</style>
