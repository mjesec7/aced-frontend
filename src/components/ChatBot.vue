<template>
    <div class="chatbot-container" :class="{ open: isOpen }">
      <div class="chat-header" @click="toggleChat">
        <span>🤖 AI Chat</span>
        <button class="close-btn" v-if="isOpen" @click.stop="endConversation">×</button>
      </div>
      
      <div v-if="isOpen" class="chat-body">
        <div v-if="!isLoggedIn" class="login-prompt">
          <p>Чтобы начать разговор, войдите в систему.</p>
          <button @click="login">Войти</button>
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
  import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
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
      async login() {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
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
    width: 300px;
    background: #1e1e1e;
    color: white;
    border-radius: 10px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }
  
  .chat-header {
    background: #6b6bff;
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }
  
  .chat-body {
    padding: 10px;
    display: flex;
    flex-direction: column;
  }
  
  .message {
    padding: 8px;
    border-radius: 5px;
    margin: 5px 0;
  }
  .user {
    background: #6b6bff;
    align-self: flex-end;
  }
  .bot {
    background: #ff6bff;
    align-self: flex-start;
  }
  
  input {
    width: 100%;
    padding: 5px;
    margin-top: 10px;
  }
  button {
    background: #6b6bff;
    color: white;
    border: none;
    padding: 8px;
    margin-top: 5px;
    cursor: pointer;
  }
  
  .end-btn {
    background: red;
  }
  </style>
  