<template>
  <div class="education-section-wrapper">
    <div class="education-section">
      <div class="content">
        <h1 class="title">Начните своё обучение уже сегодня!</h1>
        <p class="description">
          На нашей платформе представлено более <span class="highlight">100 курсов</span> и доступен <span class="highlight">личный AI-репетитор</span>, который поможет вам достичь успеха в учёбе.
        </p>
        <div class="buttons">
          <button class="neon-button start">Начать сейчас</button>
          <button class="neon-button preview">Посмотреть курс</button>
        </div>
      </div>
      <div class="image-placeholder"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EducationSection",
};
</script>

<style scoped>
.education-section-wrapper {
  padding: 60px;
  background-color: white;
  border-radius: 30px;
  width: 1400px;
}

.education-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: black;
  color: white;
  padding: 70px;
  border-radius: 30px;
}

.content {
  max-width: 50%;
}

.title {
  font-size: 3.5rem;
  margin-bottom: 25px;
}

.description {
  font-size: 1.7rem;
  line-height: 1.9;
}

.highlight {
  background: linear-gradient(90deg, #e200ff, #0099ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.buttons {
  margin-top: 40px;
  display: flex;
  gap: 25px;
  border-radius: 35px;

}

.neon-button {
  background: none;
  border: 3px solid;
  border-image-source: linear-gradient(90deg, #e200ff, #0099ff);
  border-image-slice: 1;
  color: white;
  padding: 18px 35px;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border-radius: 35px;
}

.neon-button:hover {
  color: transparent;
  background: linear-gradient(90deg, #e200ff, #0099ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  border-image-source: linear-gradient(90deg, #e200ff, #0099ff);
}

.image-placeholder {
  width: 45%;
  height: 85%;
  background-image: url("../assets/image.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 25px;
}
</style>
