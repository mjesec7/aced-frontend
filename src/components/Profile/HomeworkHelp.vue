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

    <!-- Enhanced usage display based on subscription plan -->
    <div class="chat-header">
      <h2>📚 Помощь с домашкой</h2>
      <div class="usage-info">
        <div v-if="plan === 'free'" class="usage-counter free">
          <div class="usage-item">
            <span class="label">Сообщения:</span>
            <span class="count">{{ remainingMessages }} из 50</span>
          </div>
          <div class="usage-item">
            <span class="label">Изображения:</span>
            <span class="count">{{ remainingImages }} из 5</span>
          </div>
        </div>
        
        <div v-else-if="plan === 'start'" class="usage-counter start">
          <div class="usage-item">
            <span class="label">Сообщения:</span>
            <span class="count unlimited">∞ Безлимит</span>
          </div>
          <div class="usage-item">
            <span class="label">Изображения:</span>
            <span class="count">{{ remainingImages }} из 20</span>
          </div>
        </div>
        
        <div v-else-if="plan === 'pro'" class="usage-counter pro">
          <div class="usage-item">
            <span class="label">Сообщения:</span>
            <span class="count unlimited">∞ Безлимит</span>
          </div>
          <div class="usage-item">
            <span class="label">Изображения:</span>
            <span class="count unlimited">∞ Безлимит</span>
          </div>
        </div>
        
        <div class="reset-info">
          <small>Обновление: {{ nextResetDate }}</small>
        </div>
      </div>
    </div>

    <!-- Usage warning messages -->
    <div v-if="showUsageWarning" class="usage-warning" :class="warningType">
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <span class="warning-text">{{ warningMessage }}</span>
        <button v-if="canUpgrade" @click="navigateToUpgrade" class="upgrade-btn">
          Улучшить план
        </button>
      </div>
    </div>

    <div class="chat-window">
      <div v-for="(msg, index) in messages" :key="index" :class="['message', msg.sender]">
        <div class="message-bubble">
          <p v-if="msg.text">{{ msg.text }}</p>
          <img v-if="msg.image" :src="msg.image" class="image-msg" />
          <div v-if="msg.timestamp" class="message-timestamp">
            {{ formatTimestamp(msg.timestamp) }}
          </div>
        </div>
      </div>
      
      <!-- Loading indicator -->
      <div v-if="isLoading" class="message bot">
        <div class="message-bubble loading">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input" :class="{ disabled: isInputDisabled }">
      <input 
        type="text" 
        v-model="userInput" 
        :placeholder="inputPlaceholder"
        :disabled="isInputDisabled"
        @keyup.enter="sendMessage" 
      />
      <label 
        for="file-upload" 
        class="file-upload-btn" 
        :class="{ disabled: isImageUploadDisabled }"
        :title="imageUploadTooltip"
      >
        +
      </label>
      <input 
        id="file-upload" 
        type="file" 
        @change="handleFile" 
        :disabled="isImageUploadDisabled"
        hidden 
      />
      <button 
        @click="sendMessage" 
        :disabled="isInputDisabled"
        :class="{ disabled: isInputDisabled }"
      >
        Отправить
      </button>
    </div>

    <p v-if="imageAdded" class="image-added-msg">📸 Изображение успешно добавлено!</p>
  </div>
</template>

<script>
import { getAIResponse } from '@/services/GPTService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { mapGetters } from 'vuex';

export default {
data() {
  return {
    userInput: '',
    messages: [],
    image: '',
    imageAdded: false,
    isLoading: false,
    
    // Usage tracking
    messageUsage: 0,
    imageUsage: 0,
    plan: 'free',
    userId: null,
    
    // Monthly reset tracking
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    lastResetCheck: null,
    
    // Plan limits
    planLimits: {
      free: {
        messages: 50,
        images: 5
      },
      start: {
        messages: -1, // unlimited
        images: 20
      },
      pro: {
        messages: -1, // unlimited
        images: -1 // unlimited
      }
    }
  };
},

computed: {
  ...mapGetters('user', ['userStatus', 'getUserId']),
  
  remainingMessages() {
    const limit = this.planLimits[this.plan]?.messages || 0;
    if (limit === -1) return '∞';
    return Math.max(0, limit - this.messageUsage);
  },
  
  remainingImages() {
    const limit = this.planLimits[this.plan]?.images || 0;
    if (limit === -1) return '∞';
    return Math.max(0, limit - this.imageUsage);
  },
  
  nextResetDate() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long' 
    });
  },
  
  isMessageLimitReached() {
    const limit = this.planLimits[this.plan]?.messages || 0;
    return limit !== -1 && this.messageUsage >= limit;
  },
  
  isImageLimitReached() {
    const limit = this.planLimits[this.plan]?.images || 0;
    return limit !== -1 && this.imageUsage >= limit;
  },
  
  isInputDisabled() {
    return this.isMessageLimitReached || this.isLoading;
  },
  
  isImageUploadDisabled() {
    return this.isImageLimitReached || this.isLoading;
  },
  
  inputPlaceholder() {
    if (this.isMessageLimitReached) {
      return 'Лимит сообщений исчерпан. Обновится в следующем месяце.';
    }
    return 'Напиши вопрос...';
  },
  
  imageUploadTooltip() {
    if (this.isImageLimitReached) {
      return 'Лимит изображений исчерпан';
    }
    return 'Прикрепить изображение';
  },
  
  showUsageWarning() {
    return this.warningMessage !== '';
  },
  
  warningType() {
    if (this.isMessageLimitReached || this.isImageLimitReached) {
      return 'error';
    }
    if (this.remainingMessages <= 5 || this.remainingImages <= 1) {
      return 'warning';
    }
    return 'info';
  },
  
  warningMessage() {
    if (this.plan === 'free') {
      if (this.isMessageLimitReached && this.isImageLimitReached) {
        return 'Лимиты сообщений и изображений исчерпаны. Улучшите план для продолжения.';
      } else if (this.isMessageLimitReached) {
        return 'Лимит сообщений исчерпан. Улучшите план для безлимитного общения.';
      } else if (this.isImageLimitReached) {
        return 'Лимит изображений исчерпан. Улучшите план для большего количества изображений.';
      } else if (this.remainingMessages <= 5) {
        return `Осталось ${this.remainingMessages} сообщений до конца месяца.`;
      } else if (this.remainingImages <= 1) {
        return `Остался ${this.remainingImages} запрос с изображением до конца месяца.`;
      }
    } else if (this.plan === 'start') {
      if (this.isImageLimitReached) {
        return 'Лимит изображений исчерпан. Улучшите до Pro для безлимитных изображений.';
      } else if (this.remainingImages <= 2) {
        return `Осталось ${this.remainingImages} изображений до конца месяца.`;
      }
    }
    return '';
  },
  
  canUpgrade() {
    return this.plan === 'free' || (this.plan === 'start' && this.isImageLimitReached);
  }
},

async mounted() {
  await this.initializeComponent();
},

methods: {
  async initializeComponent() {
    try {
      const user = auth.currentUser;
      if (user) {
        this.userId = user.uid;
        
        // Get user plan from store
        this.plan = this.userStatus || 'free';
        
        // Load usage data from Firestore
        await this.loadUsageData();
        
        // Check if we need to reset monthly usage
        await this.checkMonthlyReset();
        
       
      }
    } catch (error) {
      console.error('❌ Failed to initialize component:', error);
    }
  },
  
  async loadUsageData() {
    if (!this.userId) return;
    
    try {
      const docRef = doc(db, 'users', this.userId);
      const userSnap = await getDoc(docRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // Load current month usage
        const currentKey = `${this.currentYear}-${this.currentMonth}`;
        const usageData = userData.homeworkUsage || {};
        const monthlyData = usageData[currentKey] || {};
        
        this.messageUsage = monthlyData.messages || 0;
        this.imageUsage = monthlyData.images || 0;
        this.lastResetCheck = userData.lastResetCheck || null;
        
        
      }
    } catch (error) {
      console.error('❌ Failed to load usage data:', error);
    }
  },
  
  async checkMonthlyReset() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Check if month changed since last reset check
    if (this.lastResetCheck) {
      const lastReset = new Date(this.lastResetCheck);
      const lastMonth = lastReset.getMonth();
      const lastYear = lastReset.getFullYear();
      
      if (currentYear > lastYear || currentMonth > lastMonth) {
        await this.performMonthlyReset();
      }
    } else {
      // First time user - set reset check
      await this.updateResetCheck();
    }
  },
  
  async performMonthlyReset() {
    if (!this.userId) return;
    
    try {
      // Reset current month usage
      this.messageUsage = 0;
      this.imageUsage = 0;
      
      // Update Firestore
      const docRef = doc(db, 'users', this.userId);
      const currentKey = `${this.currentYear}-${this.currentMonth}`;
      
      await updateDoc(docRef, {
        [`homeworkUsage.${currentKey}.messages`]: 0,
        [`homeworkUsage.${currentKey}.images`]: 0,
        lastResetCheck: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Failed to perform monthly reset:', error);
    }
  },
  
  async updateResetCheck() {
    if (!this.userId) return;
    
    try {
      const docRef = doc(db, 'users', this.userId);
      await updateDoc(docRef, {
        lastResetCheck: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to update reset check:', error);
    }
  },
  
  async sendMessage() {
    if (!this.userInput && !this.image) return;
    
    // Check message limit
    if (this.isMessageLimitReached) {
      this.showLimitModal('messages');
      return;
    }
    
    // Check image limit if image is attached
    if (this.image && this.isImageLimitReached) {
      this.showLimitModal('images');
      return;
    }
    
    this.isLoading = true;
    
    try {
      const userMessage = {
        text: this.userInput,
        sender: 'user',
        image: this.image,
        timestamp: new Date().toISOString()
      };
      
      this.messages.push(userMessage);
      
      // Get AI response
      const responseText = await getAIResponse(userMessage.text, userMessage.image);
      
      this.messages.push({ 
        text: responseText, 
        sender: 'bot',
        timestamp: new Date().toISOString()
      });
      
      // Update usage counts
      this.messageUsage++;
      if (this.image) {
        this.imageUsage++;
      }
      
      // Save usage to Firestore
      await this.saveUsageData();
      
      // Reset form
      this.userInput = '';
      this.image = '';
      this.imageAdded = false;
      
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Remove user message on error
      this.messages.pop();
      
      // Show error message
      this.messages.push({
        text: '❌ Произошла ошибка. Попробуйте еще раз.',
        sender: 'bot',
        timestamp: new Date().toISOString()
      });
    } finally {
      this.isLoading = false;
    }
  },
  
  async saveUsageData() {
    if (!this.userId) return;
    
    try {
      const docRef = doc(db, 'users', this.userId);
      const currentKey = `${this.currentYear}-${this.currentMonth}`;
      
      await updateDoc(docRef, {
        [`homeworkUsage.${currentKey}.messages`]: this.messageUsage,
        [`homeworkUsage.${currentKey}.images`]: this.imageUsage,
        [`homeworkUsage.${currentKey}.lastUsed`]: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Failed to save usage data:', error);
    }
  },
  
  async handleFile(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image')) return;
    
    // Check image limit before processing
    if (this.isImageLimitReached) {
      this.showLimitModal('images');
      event.target.value = ''; // Clear file input
      return;
    }
    
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
  
  showLimitModal(type) {
    const messages = {
      messages: 'Лимит сообщений исчерпан. Улучшите план для продолжения общения.',
      images: 'Лимит изображений исчерпан. Улучшите план для отправки большего количества изображений.'
    };
    
    if (confirm(`${messages[type]}\n\nПерейти к выбору плана?`)) {
      this.navigateToUpgrade();
    }
  },
  
  navigateToUpgrade() {
    this.$router.push('/settings');
  },
  
  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
},

// Watch for plan changes
watch: {
  userStatus: {
    handler(newStatus) {
      if (newStatus && newStatus !== this.plan) {
        this.plan = newStatus;
      }
    },
    immediate: true
  }
}
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
align-items: flex-start;
margin-bottom: 20px;
gap: 20px;
}

.chat-header h2 {
margin: 0;
font-size: 1.5rem;
}

.usage-info {
text-align: right;
font-size: 0.9rem;
}

.usage-counter {
display: flex;
flex-direction: column;
gap: 8px;
padding: 12px 16px;
border-radius: 8px;
min-width: 200px;
}

.usage-counter.free {
background: #fef2f2;
border: 1px solid #fecaca;
}

.usage-counter.start {
background: #f0f9ff;
border: 1px solid #93c5fd;
}

.usage-counter.pro {
background: #f0fdf4;
border: 1px solid #86efac;
}

.usage-item {
display: flex;
justify-content: space-between;
align-items: center;
}

.usage-item .label {
font-weight: 500;
color: #374151;
}

.usage-item .count {
font-weight: bold;
color: #1f2937;
}

.usage-item .count.unlimited {
color: #059669;
}

.reset-info {
margin-top: 8px;
padding-top: 8px;
border-top: 1px solid #e5e7eb;
}

.reset-info small {
color: #6b7280;
}

.usage-warning {
margin-bottom: 16px;
padding: 12px 16px;
border-radius: 8px;
border-left: 4px solid;
}

.usage-warning.error {
background: #fef2f2;
border-color: #ef4444;
color: #b91c1c;
}

.usage-warning.warning {
background: #fffbeb;
border-color: #f59e0b;
color: #d97706;
}

.usage-warning.info {
background: #eff6ff;
border-color: #3b82f6;
color: #2563eb;
}

.warning-content {
display: flex;
align-items: center;
gap: 12px;
}

.warning-icon {
font-size: 1.2rem;
}

.warning-text {
flex: 1;
font-weight: 500;
}

.upgrade-btn {
background: #7c3aed;
color: white;
border: none;
padding: 6px 12px;
border-radius: 6px;
font-size: 0.85rem;
font-weight: 600;
cursor: pointer;
transition: background-color 0.2s;
}

.upgrade-btn:hover {
background: #6d28d9;
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
position: relative;
}

.message-bubble.loading {
background: #f9fafb;
}

.message-timestamp {
font-size: 0.75rem;
color: #6b7280;
margin-top: 6px;
text-align: right;
}

.typing-indicator {
display: flex;
gap: 4px;
align-items: center;
height: 20px;
}

.typing-indicator span {
width: 8px;
height: 8px;
border-radius: 50%;
background: #9ca3af;
animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
animation-delay: 0.4s;
}

@keyframes typing {
0%, 60%, 100% {
  transform: translateY(0);
  opacity: 0.4;
}
30% {
  transform: translateY(-10px);
  opacity: 1;
}
}

.chat-input {
display: flex;
gap: 10px;
align-items: center;
transition: opacity 0.3s;
}

.chat-input.disabled {
opacity: 0.6;
pointer-events: none;
}

.chat-input input[type='text'] {
padding: 10px;
border-radius: 8px;
border: 1px solid #ccc;
font-family: 'Unbounded', sans-serif;
flex: 1;
transition: border-color 0.2s;
}

.chat-input input[type='text']:focus {
outline: none;
border-color: #7c3aed;
}

.chat-input input[type='text']:disabled {
background: #f9fafb;
color: #6b7280;
cursor: not-allowed;
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
transition: background-color 0.2s;
}

.file-upload-btn:hover:not(.disabled) {
background-color: #6d28d9;
}

.file-upload-btn.disabled {
background-color: #9ca3af;
cursor: not-allowed;
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
transition: background-color 0.2s;
}

.chat-input button:hover:not(.disabled) {
background-color: #6d28d9;
}

.chat-input button.disabled {
background-color: #9ca3af;
cursor: not-allowed;
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

/* Responsive design */
@media (max-width: 768px) {
.homework-help {
  padding: 20px;
}

.chat-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.usage-counter {
  min-width: auto;
  width: 100%;
}

.chat-window {
  height: 300px;
}

.warning-content {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.upgrade-btn {
  align-self: stretch;
  text-align: center;
}
}
</style>