<template>
   
  <div class="chatbot-container" :class="{ open: isOpen }">
    <div class="chat-header" @click="toggleChat">
      <span>🤖 AI Chat</span>
      <button class="close-btn" v-if="isOpen" @click.stop="endConversation">×</button>
    </div>
    
    <div v-if="isOpen" class="chat-body">
      <div v-if="!isLoggedIn" class="Login-prompt">
        <p>Чтобы начать разговор, войдите в систему.</p>
        <button @click="Login">Войти</button>
      </div>
      
      <div v-else class="chat-content">
        <div v-for="(msg, index) in messages" :key="index" class="message" :class="msg.sender">
          {{ msg.text }}
        </div>
        <input v-model="userInput" @keyup.enter="sendMessage" placeholder="Введите сообщение..." />
        <button @click="sendMessage">Отправить</button>
        <button class="end-btn" @click="endConversation">End Conversation</button>
      </div>
    </div>
  </div>
</template>

<script>
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase"; 
import { getAIResponse } from "@/services/GPTService";

export default {
  data() {
    return {
      isOpen: false,
      isLoggedIn: false,
      messages: [],
      userInput: ""
    };
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      this.isLoggedIn = !!user;
    });
  },
  methods: {
    toggleChat() {
      this.isOpen = !this.isOpen;
    },
    Login() {
      // Trigger your global auth modal
      window.dispatchEvent(new CustomEvent("open-Login-modal"));
      // Scroll to top so the modal is visible
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    async sendMessage() {
      if (!this.userInput.trim()) return;
      const userMessage = { text: this.userInput, sender: "user" };
      this.messages.push(userMessage);
      this.userInput = "";
      const botReply = await getAIResponse(userMessage.text);
      this.messages.push({ text: botReply, sender: "bot" });
    },
    endConversation() {
      this.messages = [];
      this.isOpen = false;
    }
  }
};
</script>


<style scoped>
.chatbot-container {
position: fixed;
bottom: 20px;
right: 20px;
width: 340px;
background: #0a0018;
color: white;
border-radius: 18px;
box-shadow: 0 0 20px rgba(147, 51, 234, 0.4);
font-family: 'Unbounded', sans-serif;
overflow: hidden;
z-index: 9999;
transition: all 0.3s ease;
}

.chat-header {
background: linear-gradient(90deg, #9333ea, #7f5af0);
padding: 14px 18px;
font-weight: bold;
font-size: 1rem;
display: flex;
justify-content: space-between;
align-items: center;
cursor: pointer;
}

.chat-body {
display: flex;
flex-direction: column;
gap: 10px;
padding: 14px;
background: rgba(255, 255, 255, 0.02);
backdrop-filter: blur(10px);
max-height: 400px;
overflow-y: auto;
}

.message {
padding: 10px 14px;
border-radius: 20px;
max-width: 80%;
font-size: 0.95rem;
line-height: 1.4;
word-break: break-word;
white-space: pre-wrap;
}

.user {
background: #9333ea;
align-self: flex-end;
border-top-right-radius: 0;
}

.bot {
background: #38bdf8;
align-self: flex-start;
border-top-left-radius: 0;
}

input {
width: 100%;
padding: 10px 14px;
border-radius: 30px;
border: none;
outline: none;
background: rgba(255, 255, 255, 0.05);
color: white;
font-family: 'Unbounded', sans-serif;
font-size: 0.95rem;
}

button {
padding: 10px;
border: none;
border-radius: 25px;
background: #7f5af0;
color: white;
font-weight: bold;
margin-top: 8px;
cursor: pointer;
font-family: 'Unbounded', sans-serif;
transition: 0.3s ease;
}

button:hover {
background: #a855f7;
}

.end-btn {
background: #ef4444;
margin-top: 6px;
}

.end-btn:hover {
background: #dc2626;
}

.Login-prompt {
text-align: center;
font-size: 0.95rem;
}

.close-btn {
margin-top: -10px;
font-size: 1.2rem;
background: none;
border: none;
color: white;
cursor: pointer;
transition: transform 0.2s ease;
}

.close-btn:hover {
transform: scale(1.2);
}

/* Tablet styles */
@media (max-width: 768px) {
.chatbot-container {
  width: 300px;
  bottom: 15px;
  right: 15px;
}

.chat-header {
  font-size: 0.9rem;
  padding: 12px 16px;
}

.chat-body {
  max-height: 350px;
  padding: 12px;
}

.message {
  font-size: 0.9rem;
  padding: 8px 12px;
}

input {
  font-size: 0.9rem;
  padding: 8px 12px;
}

button {
  font-size: 0.9rem;
  padding: 8px;
}
}

/* Mobile styles */
@media (max-width: 480px) {
.chatbot-container {
  width: 280px;
  bottom: 10px;
  right: 10px;
}

.chat-header {
  font-size: 0.85rem;
  padding: 10px 14px;
}

.chat-body {
  max-height: 300px;
  padding: 10px;
}

.message {
  font-size: 0.85rem;
  padding: 8px 10px;
}

input {
  font-size: 0.85rem;
  padding: 8px 10px;
}

button {
  font-size: 0.85rem;
  padding: 8px;
}
}

/* Very small screens */
@media (max-width: 320px) {
.chatbot-container {
  width: 250px;
  bottom: 5px;
  right: 5px;
}

.chat-header {
  font-size: 0.8rem;
  padding: 8px 12px;
}

.chat-body {
  max-height: 250px;
  padding: 8px;
}

.message {
  font-size: 0.8rem;
  padding: 6px 8px;
}

input {
  font-size: 0.8rem;
  padding: 6px 8px;
}

button {
  font-size: 0.8rem;
  padding: 6px;
}
}
</style>