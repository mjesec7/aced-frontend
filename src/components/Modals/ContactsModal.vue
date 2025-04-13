<template>
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box">
        <!-- ❌ Close button in corner -->
        <button class="close-x" @click="$emit('close')">✕</button>
  
        <h2>Связаться с нами</h2>
  
        <form @submit.prevent="submitForm">
          <input v-model="form.name" type="text" placeholder="Ваше имя" required />
          <input v-model="form.email" type="email" placeholder="Ваш Email" required />
          <textarea v-model="form.message" placeholder="Ваше сообщение" required></textarea>
  
          <button type="submit">Отправить</button>
          <button type="button" class="close-btn" @click="$emit('close')">Закрыть</button>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        form: {
          name: '',
          email: '',
          message: ''
        }
      };
    },
    methods: {
      submitForm() {
        console.log("🟣 Form Submitted", this.form);
        alert("Спасибо! Мы свяжемся с вами по Email.");
        this.$emit('close');
      }
    }
  };
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  
  .modal-box {
    position: relative;
    background: white;
    padding: 2rem;
    border-radius: 20px;
    max-width: 500px;
    width: 90%;
    text-align: center;
    font-family: 'Unbounded', sans-serif;
    z-index: 9999999;
  }
  
  /* ✖️ Close (X) button in top corner */
  .close-x {
    position: absolute;
    top: 15px;
    right: 15px;
    background: transparent;
    border: none;
    font-size: 20px;
    color: #888;
    cursor: pointer;
    transition: 0.2s;
  }
  
  .close-x:hover {
    color: black;
  }
  
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  input,
  textarea {
    padding: 10px;
    font-family: inherit;
    border: 1px solid #ccc;
    border-radius: 10px;
    font-size: 1rem;
  }
  
  textarea {
    resize: vertical;
    min-height: 100px;
  }
  
  button {
    padding: 10px;
    font-family: inherit;
    background: purple;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: 0.3s;
  }
  
  button:hover {
    background: black;
  }
  
  .close-btn {
    background: transparent;
    color: #555;
    border: 1px solid #ccc;
    margin-top: 5px;
  }
  </style>
  