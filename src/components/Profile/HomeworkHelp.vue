<template>
    <div class="homework-help">
      <div class="instruction-box">
        <h2>📘 Как пользоваться помощником</h2>
        <ol>
          <li>Выберите предмет или тему.</li>
          <li>Сформулируйте вопрос как можно чётче.</li>
          <li>Прикрепите изображение и поясните, что на нём изображено.</li>
          <li>Нажмите «Отправить» и получите ответ!</li>
        </ol>
      </div>
  
      <div class="chat-header">
        <h2>📚 Помощь с домашкой</h2>
        <p v-if="plan === 'start+'">Осталось <strong>{{ remaining }}</strong> из 50 запросов</p>
      </div>
  
      <div class="chat-window">
        <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.sender]">
          <div class="message-bubble">
            <p v-if="msg.text">{{ msg.text }}</p>
            <img v-if="msg.image" :src="msg.image" class="image-msg" />
          </div>
        </div>
      </div>
  
      <div class="chat-input">
        <input type="text" v-model="userInput" placeholder="Напиши вопрос..." @keyup.enter="sendMessage" />
        <label for="file-upload" class="file-upload-btn">+</label>
        <input id="file-upload" type="file" @change="handleFile" hidden />
        <button @click="sendMessage">Отправить</button>
      </div>
  
      <p v-if="imageAdded" class="image-added-msg">📸 Изображение успешно добавлено!</p>
    </div>
  </template>
  
  <script>
  import { getAIResponse } from '@/services/GPTService';
  import { doc, getDoc, updateDoc } from 'firebase/firestore';
  import { auth, db } from '@/firebase';
  
  export default {
    data() {
      return {
        userInput: '',
        messages: [],
        image: '',
        usage: 0,
        plan: 'start+',
        userId: null,
        imageAdded: false,
      };
    },
    computed: {
      remaining() {
        return 50 - this.usage;
      },
    },
    async mounted() {
      const user = auth.currentUser;
      if (user) {
        this.userId = user.uid;
        const docRef = doc(db, 'users', this.userId);
        const userSnap = await getDoc(docRef);
        if (userSnap.exists()) {
          this.plan = userSnap.data().plan || 'start+';
          this.usage = userSnap.data().usage || 0;
        }
      }
    },
    methods: {
      async sendMessage() {
        if (!this.userInput && !this.image) return;
  
        if (this.plan === 'start+' && this.usage >= 50) {
          alert('Вы израсходовали лимит запросов на этот месяц!');
          return;
        }
  
        const userMessage = {
          text: this.userInput,
          sender: 'user',
          image: this.image,
        };
  
        this.messages.push(userMessage);
  
        const responseText = await getAIResponse(userMessage.text, userMessage.image);
        this.messages.push({ text: responseText, sender: 'bot' });
  
        this.userInput = '';
        this.image = '';
        this.imageAdded = false;
  
        this.usage++;
        if (this.userId) {
          await updateDoc(doc(db, 'users', this.userId), { usage: this.usage });
        }
      },
      async handleFile(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image')) return;
  
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Image = reader.result.split(',')[1];
          const formData = new FormData();
          formData.append('image', base64Image);
  
          try {
            const res = await fetch('https://api.imgbb.com/1/upload?key=e428d4d8a427726409a1b7fbdb232ff1', {
              method: 'POST',
              body: formData,
            });
  
            const data = await res.json();
            if (data?.data?.url) {
              console.log('✅ ImgBB URL:', data.data.url);
              this.image = data.data.url;
              this.imageAdded = true;
              setTimeout(() => (this.imageAdded = false), 3000);
            } else {
              alert('Не удалось загрузить изображение.');
            }
          } catch (err) {
            console.error('Image upload failed:', err);
            alert('Произошла ошибка при загрузке изображения.');
          }
        };
  
        reader.readAsDataURL(file);
      },
    },
  };
  </script>
  
  

  

  
  <style scoped>
  .homework-help {
    padding: 30px;
    font-family: 'Unbounded', sans-serif;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .instruction-box {
    background: #f0f0ff;
    border-left: 6px solid #7c3aed;
    border-radius: 8px;
    padding: 20px 24px;
    margin-bottom: 30px;
    font-family: 'Unbounded', sans-serif;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }
  
  .instruction-box h2 {
    margin-bottom: 12px;
    font-size: 1.3rem;
    color: #1e1e1e;
    font-weight: bold;
  }
  
  .instruction-box ol {
    margin-left: 20px;
    line-height: 1.7;
    color: #333;
    font-size: 0.95rem;
  }
  
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .chat-window {
    background: #f3f3f3;
    height: 400px;
    overflow-y: auto;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }
  
  .message {
    max-width: 75%;
    word-wrap: break-word;
  }
  .user {
    align-self: flex-end;
  }
  .bot {
    align-self: flex-start;
  }
  .message-bubble {
    background: white;
    border-radius: 10px;
    padding: 10px 14px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }
  
  .chat-input {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  
  .chat-input input[type='text'] {
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #ccc;
    font-family: 'Unbounded', sans-serif;
    flex: 1;
  }
  
  .file-upload-btn {
    background-color: #7c3aed;
    color: white;
    padding: 0 14px;
    font-size: 24px;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Unbounded', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    line-height: 1;
  }
  
  .chat-input button {
    background-color: #7c3aed;
    color: white;
    padding: 10px 16px;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: 'Unbounded', sans-serif;
  }
  
  .image-msg {
    max-width: 250px;
    margin-top: 10px;
    border-radius: 8px;
  }
  .image-added-msg {
  font-size: 0.9rem;
  color: #10b981;
  margin-top: 10px;
  font-weight: 600;
}

  </style>
  