<template>
  <section class="pricing-section">
    <div class="container">
      <h2 class="title">Выбери подходящий тариф</h2>
      <p class="subtitle">
        Платформа, которая растёт вместе с тобой. Доступ к искусственному интеллекту,
        персонализации и результатам.
      </p>

      <div class="pricing-cards">
        <!-- Starter Plan -->
        <div class="card">
          <h3 class="plan-name">Starter</h3>
          <p class="price">$20 / месяц</p>
          <ul class="features">
            <li>🔹 Доступ ко всем предметам</li>
            <li>🔹 Помощь ИИ с домашкой</li>
            <li>🔹 Прогресс и статистика</li>
            <li>🔹 Безлимитный доступ к урокам</li>
            <li>🔹 Интеллектуальные подсказки в обучении</li>
          </ul>
          <button class="btn" @click="handleClick('start')">Начать</button>
        </div>

        <!-- Pro Plan -->
        <div class="card pro">
          <h3 class="plan-name">Pro</h3>
          <p class="price">$35 / месяц</p>
          <ul class="features">
            <li>✨ Всё из STARTER +</li>
            <li>🔓 Персональный ИИ-наставник</li>
            <li>📊 Продвинутая аналитика</li>
            <li>📚 Индивидуальная карта обучения</li>
            <li>🧠 Расширенный режим чата</li>
            <li>🎯 Целевые рекомендации и план обучения</li>
          </ul>
          <button class="btn" @click="handleClick('pro')">Начать</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { getAuth } from "firebase/auth";

export default {
  name: 'TariffSection',
  methods: {
    handleClick(plan) {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        window.dispatchEvent(new Event("open-Login-modal"));
      } else {
        this.$router.push(`/pay/${plan}`);
      }
    }
  }
};
</script>

<style scoped>
.pricing-section {
  background: linear-gradient(to bottom, #1e1b4b, #111827);
  padding: 100px 20px;
  color: #e0e7ff;
  text-align: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(147, 51, 234, 0.6);
  font-family: 'Unbounded', sans-serif;
}

.subtitle {
  margin-top: 10px;
  margin-bottom: 60px;
  font-size: 1.1rem;
  color: #cbd5e1;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.pricing-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  justify-content: center;
}

.card {
  background: #0f172a;
  border-radius: 20px;
  padding: 30px;
  width: 320px;
  box-shadow: 0 0 30px rgba(147, 51, 234, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card:hover {
  transform: scale(1.05);
  box-shadow: 0 0 40px rgba(147, 51, 234, 0.5);
}

.card.pro {
  border: 1px solid rgba(167, 139, 250, 0.4);
  background: #1e1b4b;
}

.plan-name {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #a78bfa;
}

.price {
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.features {
  text-align: left;
  padding: 0;
  margin: 0 0 30px;
  list-style: none;
  font-size: 0.95rem;
  color: #d1d5db;
  line-height: 1.6;
}

.btn {
  background-color: #9333ea;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: #7e22ce;
}
</style>
