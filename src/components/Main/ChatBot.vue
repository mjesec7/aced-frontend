<template>
  <div>
    <button v-if="!isOpen" class="chat-fab" @click="toggleChat">
      🤖
    </button>

    <div class="chatbot-container" :class="{ open: isOpen }">
      <div class="chat-header" @click="toggleChat">
        <span>AI Assistant</span>
        <button class="close-btn" @click.stop="toggleChat">−</button>
      </div>
      
      <div class="chat-body">
        <div v-if="!isLoggedIn" class="login-prompt">
          <p>Please log in to start a conversation.</p>
          <button @click="login">Log In</button>
        </div>
        
        <div v-else class="chat-content">
          <div class="messages-area" ref="messagesArea">
            <div v-for="(msg, index) in messages" :key="index" class="message" :class="msg.sender">
              {{ msg.text }}
            </div>
          </div>
          <div class="input-area">
            <input v-model="userInput" @keyup.enter="sendMessage" placeholder="Ask me anything..." />
            <button @click="sendMessage">➤</button>
          </div>
        </div>
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
    login() {
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
      this.$nextTick(() => {
        this.$refs.messagesArea.scrollTop = this.$refs.messagesArea.scrollHeight;
      });

      const botReply = await getAIResponse(userMessage.text);
      this.messages.push({ text: botReply, sender: "bot" });
      this.$nextTick(() => {
        this.$refs.messagesArea.scrollTop = this.$refs.messagesArea.scrollHeight;
      });
    }
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600&display=swap');

.chat-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, #9333ea, #7f5af0);
  color: white;
  border-radius: 50%;
  border: none;
  font-size: 1.5rem;
  box-shadow: 0 4px 20px rgba(147, 51, 234, 0.4);
  cursor: pointer;
  z-index: 999;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chat-fab:hover {
  transform: scale(1.1);
}

.chatbot-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 350px;
  background: #110d2e;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  font-family: 'Unbounded', sans-serif;
  overflow: hidden;
  z-index: 1000;
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  transition: all 0.3s ease-in-out;
  pointer-events: none;
}
.chatbot-container.open {
  transform: translateY(0) scale(1);
  opacity: 1;
  pointer-events: auto;
}

.chat-header {
  background: linear-gradient(90deg, #9333ea, #7f5af0);
  padding: 12px 16px;
  font-weight: 600;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}
.close-btn {
  background: none; 
  border: none; 
  color: white; 
  font-size: 1.5rem; 
  cursor: pointer;
  line-height: 1;
  padding: 0;
}
.chat-body {
  height: 400px;
  display: flex;
  flex-direction: column;
}
.login-prompt {
  padding: 2rem; 
  text-align: center; 
  color: #a3a3c2;
  margin: auto 0;
}
.chat-content {
  flex-grow: 1; 
  display: flex; 
  flex-direction: column;
  overflow: hidden;
}
.messages-area {
  flex-grow: 1; 
  padding: 1rem; 
  overflow-y: auto; 
  display: flex; 
  flex-direction: column; 
  gap: 0.75rem;
}
.message {
  padding: 0.5rem 1rem; 
  border-radius: 1rem; 
  max-width: 80%; 
  line-height: 1.5;
  color: #fff;
}
.user {
  background: #7c3aed; 
  align-self: flex-end; 
  border-bottom-right-radius: 0.25rem;
}
.bot {
  background: #191645; 
  align-self: flex-start; 
  border-bottom-left-radius: 0.25rem;
  border: 1px solid #2c2c54;
}
.input-area {
  display: flex; 
  gap: 0.5rem; 
  padding: 1rem; 
  border-top: 1px solid #2c2c54;
}
input {
  flex-grow: 1; 
  background: #191645; 
  border: 1px solid #2c2c54; 
  border-radius: 99px; 
  padding: 0.5rem 1rem; 
  color: #fff;
  font-family: 'Unbounded', sans-serif;
  outline: none;
}
input:focus {
  border-color: #7c3aed;
}
button {
  border-radius: 99px; 
  border: none; 
  background: #7c3aed; 
  color: #fff; 
  cursor: pointer; 
  padding: 0.5rem 1rem;
  transition: background-color 0.2s ease;
}
button:hover {
    background: #9333ea;
}
.login-prompt button {
    margin-top: 1rem;
}

@media (max-width: 480px) {
  .chatbot-container {
    width: calc(100% - 20px);
    bottom: 10px;
    right: 10px;
    height: 70vh;
  }
  .chat-body {
    height: calc(70vh - 45px);
  }
  .chat-fab {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
}
</style>