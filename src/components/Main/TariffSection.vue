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
          <p class="price">$20<span class="period"> / месяц</span></p>
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
          <div class="popular-badge">Популярный</div>
          <h3 class="plan-name">Pro</h3>
          <p class="price">$35<span class="period"> / месяц</span></p>
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
  background: linear-gradient(135deg, #1e1b4b 0%, #111827 100%);
  padding: 60px 20px;
  color: #e0e7ff;
  text-align: center;
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.title {
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: bold;
  text-shadow: 0 0 20px rgba(147, 51, 234, 0.6);
  font-family: 'Unbounded', sans-serif;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #a78bfa, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0 auto 60px;
  font-size: clamp(1rem, 2vw, 1.1rem);
  color: #cbd5e1;
  max-width: 700px;
  line-height: 1.6;
}

.pricing-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  justify-items: center;
  max-width: 800px;
  margin: 0 auto;
}

.card {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px 30px;
  width: 100%;
  max-width: 350px;
  box-shadow: 0 10px 40px rgba(147, 51, 234, 0.2);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgba(147, 51, 234, 0.2);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.6), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 60px rgba(147, 51, 234, 0.4);
}

.card:hover::before {
  opacity: 1;
}

.card.pro {
  border: 2px solid rgba(167, 139, 250, 0.5);
  background: linear-gradient(135deg, rgba(30, 27, 75, 0.9), rgba(15, 23, 42, 0.9));
  transform: scale(1.05);
}

.card.pro:hover {
  transform: translateY(-10px) scale(1.05);
}

.popular-badge {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #9333ea, #c084fc);
  color: white;
  padding: 8px 20px;
  border-radius: 0 0 12px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.plan-name {
  font-size: clamp(1.3rem, 3vw, 1.5rem);
  margin-bottom: 15px;
  color: #a78bfa;
  font-weight: 600;
}

.price {
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  margin-bottom: 30px;
  font-weight: bold;
  color: #e0e7ff;
}

.period {
  font-size: clamp(1rem, 2vw, 1.2rem);
  color: #94a3b8;
  font-weight: normal;
}

.features {
  text-align: left;
  padding: 0;
  margin: 0 0 40px;
  list-style: none;
  font-size: clamp(0.9rem, 1.5vw, 0.95rem);
  color: #d1d5db;
  line-height: 1.8;
  flex-grow: 1;
}

.features li {
  padding: 8px 0;
  position: relative;
  padding-left: 25px;
}

.features li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  background: linear-gradient(135deg, #9333ea, #c084fc);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
}

.btn {
  background: linear-gradient(135deg, #9333ea, #7c3aed);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: clamp(0.9rem, 2vw, 1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.3);
}

.btn:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(147, 51, 234, 0.5);
}

.btn:active {
  transform: translateY(0);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .pricing-section {
    padding: 40px 15px;
  }
  
  .subtitle {
    margin-bottom: 40px;
  }
  
  .pricing-cards {
    grid-template-columns: 1fr;
    gap: 20px;
    max-width: 400px;
  }
  
  .card {
    padding: 30px 25px;
  }
  
  .card.pro {
    transform: none;
    margin-top: 20px;
  }
  
  .card.pro:hover {
    transform: translateY(-5px);
  }
  
  .popular-badge {
    font-size: 0.75rem;
    padding: 6px 15px;
  }
}

@media (max-width: 480px) {
  .pricing-section {
    padding: 30px 10px;
  }
  
  .card {
    padding: 25px 20px;
  }
  
  .features li {
    padding: 6px 0;
    font-size: 0.85rem;
  }
  
  .btn {
    padding: 12px 25px;
    font-size: 0.9rem;
  }
}

/* Large screens */
@media (min-width: 1200px) {
  .pricing-cards {
    gap: 40px;
  }
  
  .card {
    padding: 50px 40px;
  }
}
</style>