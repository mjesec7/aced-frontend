<template>
  <div class="ai-help-panel">
    <div class="ai-help-header">
      <div class="header-content">
        <div class="header-info">
          <div class="ai-avatar">
            <div class="avatar-icon">🤖</div>
            <div class="avatar-status"></div>
          </div>
          <div class="header-text">
            <h4 class="ai-title">AI Помощник</h4>
            <p class="ai-subtitle">Готов помочь с изучением</p>
          </div>
        </div>
        <div v-if="aiUsage" class="usage-display">
          <div class="usage-info">
            <span class="usage-icon">📊</span>
            <span class="usage-text">{{ formatUsage(aiUsage) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="ai-help-content" ref="helpContent">
      <div v-if="!aiChatHistory.length && !aiSuggestions.length" class="ai-welcome">
        <div class="welcome-animation">
          <div class="welcome-icon">💭</div>
          <div class="welcome-particles">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <h4 class="welcome-title">Добро пожаловать!</h4>
        <p class="welcome-text">Задайте вопрос о текущем материале, и я помогу вам разобраться</p>
        <div class="welcome-features">
          <div class="feature-item">
            <span class="feature-icon">💡</span>
            <span class="feature-text">Объяснения</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔍</span>
            <span class="feature-text">Примеры</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">✨</span>
            <span class="feature-text">Подсказки</span>
          </div>
        </div>
      </div>

      <div v-if="aiSuggestions.length" class="quick-suggestions">
        <div class="suggestions-header">
          <div class="suggestions-icon">💡</div>
          <h5 class="suggestions-title">Популярные вопросы</h5>
        </div>
        <div class="suggestions-grid">
          <button
            v-for="(suggestion, suggestionIndex) in aiSuggestions"
            :key="`suggestion-${suggestionIndex}`"
            @click="$emit('ask-ai', suggestion)"
            class="suggestion-btn"
            :disabled="aiIsLoading"
          >
            <span class="suggestion-text">{{ suggestion }}</span>
            <span class="suggestion-arrow">→</span>
          </button>
        </div>
      </div>

      <div v-if="aiChatHistory.length" class="chat-history">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-icon">💬</div>
            <h5 class="chat-title">История разговора</h5>
            <span class="message-count">({{ aiChatHistory.length }})</span>
          </div>
          <button @click="clearChat" class="clear-chat-btn" title="Очистить историю">
            <span class="clear-icon">🗑️</span>
          </button>
        </div>

        <div class="chat-messages" ref="chatMessages">
          <div
            v-for="message in displayedMessages"
            :key="message?.id || `ai-msg-${Math.random()}`"
            :class="['chat-message', message?.type || 'unknown']"
          >
            <div class="message-avatar">
              <div class="avatar-circle" :class="message?.type">
                <span v-if="message?.type === 'user'">👤</span>
                <span v-else>🤖</span>
              </div>
            </div>
            <div class="message-bubble">
              <div class="message-header">
                <span class="message-author">
                  {{ message?.type === 'user' ? 'Вы' : 'AI Помощник' }}
                </span>
                <span class="message-time">{{ formatMessageTime(message) }}</span>
              </div>
              <div class="message-content">{{ message?.content || 'Нет контента' }}</div>
            </div>
          </div>

          <div v-if="aiIsLoading" class="chat-message ai loading">
            <div class="message-avatar">
              <div class="avatar-circle ai">
                <span>🤖</span>
              </div>
            </div>
            <div class="message-bubble loading">
              <div class="message-header">
                <span class="message-author">AI Помощник</span>
                <span class="message-time">печатает...</span>
              </div>
              <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="aiChatHistory.length > maxDisplayedMessages" class="show-more-section">
          <button @click="toggleShowAll" class="show-more-btn">
            <span class="btn-icon">{{ showAllMessages ? '📄' : '📋' }}</span>
            <span class="btn-text">
              {{ showAllMessages ? 'Показать меньше' : `Показать все (${aiChatHistory.length})` }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div class="chat-input-section">
      <div class="input-wrapper">
        <input
          v-model="localChatInput"
          @keyup.enter="sendMessage"
          @input="handleInputChange"
          placeholder="Спросите об этом уроке..."
          :disabled="aiIsLoading"
          class="chat-input-field"
          ref="chatInput"
        />
        <button
          @click="sendMessage"
          :disabled="!localChatInput?.trim() || aiIsLoading"
          class="send-btn"
          :class="{ loading: aiIsLoading }"
        >
          <span v-if="aiIsLoading" class="loading-spinner">⏳</span>
          <span v-else class="send-icon">📤</span>
        </button>
      </div>
      <div class="input-suggestions">
        <button
          v-for="quickText in quickTexts"
          :key="quickText"
          @click="insertQuickText(quickText)"
          class="quick-text-btn"
        >
          {{ quickText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AIHelpPanel',
  props: {
    aiSuggestions: {
      type: Array,
      default: () => []
    },
    aiChatInput: {
      type: String,
      default: ''
    },
    aiChatHistory: {
      type: Array,
      default: () => []
    },
    aiIsLoading: {
      type: Boolean,
      default: false
    },
    aiUsage: {
      type: Object,
      default: null
    }
  },
  emits: ['send-message', 'ask-ai', 'clear-chat'],
  data() {
    return {
      localChatInput: '',
      showAllMessages: false,
      maxDisplayedMessages: 5,
      quickTexts: [
        'Объясни подробнее',
        'Приведи пример',
        'Как это использовать?',
        'Есть ли исключения?'
      ]
    }
  },
  computed: {
    displayedMessages() {
      if (!this.aiChatHistory || !Array.isArray(this.aiChatHistory)) {
        return []
      }
      
      if (this.showAllMessages) {
        return this.aiChatHistory
      }
      
      return this.aiChatHistory.slice(-this.maxDisplayedMessages)
    }
  },
  watch: {
    aiChatInput: {
      handler(newValue) {
        this.localChatInput = newValue
      },
      immediate: true
    },
    
    aiChatHistory: {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      },
      deep: true
    },

    aiIsLoading(newValue) {
      if (newValue) {
        this.$nextTick(() => {
          this.scrollToBottom()
        })
      }
    }
  },
  mounted() {
    this.scrollToBottom()
    this.setupScrollDetection()
  },
  methods: {
    sendMessage() {
      if (!this.localChatInput?.trim() || this.aiIsLoading) return
      
      this.$emit('send-message', this.localChatInput.trim())
      this.localChatInput = ''
    },

    handleInputChange() {
      // Emit input changes if needed
    },

    insertQuickText(text) {
      if (this.localChatInput) {
        this.localChatInput += ' ' + text
      } else {
        this.localChatInput = text
      }
      this.$refs.chatInput?.focus()
    },

    clearChat() {
      this.$emit('clear-chat')
    },

    toggleShowAll() {
      this.showAllMessages = !this.showAllMessages
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },

    formatUsage(usage) {
      if (!usage) return ''
      
      const messages = usage.messages || 0
      const limit = usage.plan === 'free' ? 50 : '∞'
      
      return `${messages}/${limit}`
    },

    formatMessageTime(message) {
      if (!message?.timestamp) return ''
      
      try {
        const date = new Date(message.timestamp)
        return date.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } catch (error) {
        return ''
      }
    },

    scrollToBottom() {
      const chatMessages = this.$refs.chatMessages
      if (chatMessages) {
        setTimeout(() => {
          chatMessages.scrollTop = chatMessages.scrollHeight
        }, 100)
      }
    },

    setupScrollDetection() {
      this.$nextTick(() => {
        const helpContent = this.$refs.helpContent
        if (helpContent) {
          const handleScroll = () => {
            if (helpContent.scrollTop > 20) {
              helpContent.classList.add('scrolled')
            } else {
              helpContent.classList.remove('scrolled')
            }
          }
          
          helpContent.addEventListener('scroll', handleScroll, { passive: true })
          handleScroll()
        }
      })
    }
  }
}
</script>

<style scoped>
/* Modern AI Help Panel Design */
.ai-help-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 0;
  overflow: hidden;
  position: relative;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  will-change: transform;
  transform: translateZ(0);
}

.ai-help-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #0ea5e9, #0284c7);
  z-index: 1;
}

/* Header */
.ai-help-header {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: white;
  padding: 20px 24px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.ai-help-header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: rotate(45deg);
  animation: headerShimmer 4s ease-in-out infinite;
}

@keyframes headerShimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
  100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 2;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.ai-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.avatar-status {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.header-text {
  flex: 1;
}

.ai-title {
  margin: 0 0 4px 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
}

.ai-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  opacity: 0.9;
}

.usage-display {
  flex-shrink: 0;
}

.usage-info {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.usage-icon {
  font-size: 0.9rem;
}

.usage-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

/* Content Area */
.ai-help-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  position: relative;
  transition: opacity 0.3s ease;
  overscroll-behavior: contain;
}

.ai-help-content::-webkit-scrollbar {
  width: 6px;
}

.ai-help-content::-webkit-scrollbar-track {
  background: rgba(14, 165, 233, 0.1);
  border-radius: 3px;
}

.ai-help-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%);
  border-radius: 3px;
  transition: all 0.2s ease;
}

.ai-help-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
}

.ai-help-content::before {
  content: '';
  position: sticky;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #0ea5e9 50%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
  margin: -24px -24px 22px;
}

.ai-help-content.scrolled::before {
  opacity: 1;
}

/* Welcome State */
.ai-welcome {
  text-align: center;
  padding: 40px 20px;
  color: #0c4a6e;
}

.welcome-animation {
  position: relative;
  margin-bottom: 24px;
  display: inline-block;
}

.welcome-icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.welcome-particles {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.welcome-particles span {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #0ea5e9;
  border-radius: 50%;
  animation: particleFloat 4s ease-in-out infinite;
  opacity: 0.7;
}

.welcome-particles span:nth-child(1) { left: 20%; animation-delay: 0s; }
.welcome-particles span:nth-child(2) { left: 50%; animation-delay: 1.5s; }
.welcome-particles span:nth-child(3) { left: 80%; animation-delay: 3s; }

@keyframes particleFloat {
  0%, 100% { transform: translateY(0px); opacity: 0.7; }
  25% { transform: translateY(-15px); opacity: 1; }
  50% { transform: translateY(-30px); opacity: 0.5; }
  75% { transform: translateY(-15px); opacity: 1; }
}

.welcome-title {
  margin: 0 0 12px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0c4a6e;
}

.welcome-text {
  margin: 0 0 24px 0;
  font-size: 1rem;
  line-height: 1.6;
  color: #0369a1;
  opacity: 0.9;
}

.welcome-features {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(14, 165, 233, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(14, 165, 233, 0.2);
  min-width: 80px;
}

.feature-icon { font-size: 1.5rem; }
.feature-text { font-size: 0.8rem; font-weight: 500; color: #0c4a6e; }

/* Quick Suggestions */
.quick-suggestions {
  background: white;
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.suggestions-icon { font-size: 1.25rem; color: #0ea5e9; }
.suggestions-title { margin: 0; font-size: 1rem; font-weight: 600; color: #0c4a6e; flex: 1; }

.suggestions-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestion-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0c4a6e;
  border: 1px solid rgba(14, 165, 233, 0.2);
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  font-size: 0.9rem;
  will-change: transform;
  transform: translateZ(0);
}

.suggestion-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #0ea5e9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(14, 165, 233, 0.2);
}

.suggestion-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.suggestion-text { flex: 1; line-height: 1.4; }
.suggestion-arrow { font-size: 0.9rem; opacity: 0.7; transition: all 0.2s ease; }
.suggestion-btn:hover .suggestion-arrow { opacity: 1; transform: translateX(2px); }

/* Chat History */
.chat-history {
  background: white;
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: 1px solid rgba(14, 165, 233, 0.2);
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-icon { font-size: 1.1rem; color: #0ea5e9; }
.chat-title { margin: 0; font-size: 0.95rem; font-weight: 600; color: #0c4a6e; }
.message-count { font-size: 0.8rem; color: #0369a1; opacity: 0.8; }

.clear-chat-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #dc2626;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.clear-chat-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.05);
}

.chat-messages {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.chat-messages::-webkit-scrollbar { width: 4px; }
.chat-messages::-webkit-scrollbar-track { background: transparent; }
.chat-messages::-webkit-scrollbar-thumb { background: rgba(14, 165, 233, 0.3); border-radius: 2px; }

.chat-message {
  display: flex;
  gap: 12px;
  animation: messageSlideIn 0.3s ease-out;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

@keyframes messageSlideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-avatar { flex-shrink: 0; }
.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  border: 2px solid transparent;
}

.avatar-circle.user {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #93c5fd;
}

.avatar-circle.ai {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #7dd3fc;
}

.message-bubble {
  flex: 1;
  max-width: calc(100% - 44px);
  transition: all 0.2s ease;
  will-change: transform;
  transform: translateZ(0);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-author { font-size: 0.8rem; font-weight: 600; color: #0c4a6e; }
.message-time { font-size: 0.75rem; color: #64748b; }

.message-content {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #374151;
  border: 1px solid #e2e8f0;
  word-wrap: break-word;
}

.chat-message.user .message-content {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-color: #93c5fd;
}

.chat-message.ai .message-content {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0c4a6e;
  border-color: #7dd3fc;
}

/* Loading Message */
.message-bubble.loading .message-content {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #7dd3fc;
  padding: 16px 20px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0ea5e9;
  animation: typingBounce 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }
.typing-dot:nth-child(3) { animation-delay: 0s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* Show More Section */
.show-more-section {
  padding: 12px 20px;
  border-top: 1px solid rgba(14, 165, 233, 0.2);
  background: #f8fafc;
  text-align: center;
}

.show-more-btn {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid rgba(14, 165, 233, 0.2);
  color: #0c4a6e;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}

.show-more-btn:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #0ea5e9;
  transform: translateY(-1px);
}

/* Chat Input Section */
.chat-input-section {
  background: white;
  border-top: 1px solid rgba(14, 165, 233, 0.2);
  padding: 16px 20px;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.chat-input-field {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid rgba(14, 165, 233, 0.2);
  border-radius: 12px;
  font-size: 0.9rem;
  background: #f8fafc;
  transition: all 0.2s ease;
  resize: none;
}

.chat-input-field:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  background: white;
}

.chat-input-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.send-btn {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
  will-change: transform;
  transform: translateZ(0);
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.send-btn.loading {
  animation: buttonPulse 2s ease-in-out infinite;
}

@keyframes buttonPulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2); }
  50% { box-shadow: 0 4px 16px rgba(14, 165, 233, 0.4); }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.send-icon {
  font-size: 1rem;
}

/* Input Suggestions */
.input-suggestions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.quick-text-btn {
  background: rgba(14, 165, 233, 0.1);
  color: #0c4a6e;
  border: 1px solid rgba(14, 165, 233, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-text-btn:hover {
  background: rgba(14, 165, 233, 0.2);
  border-color: #0ea5e9;
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .ai-help-header { padding: 16px 20px; }
  .ai-help-content { padding: 20px; }
  .chat-input-section { padding: 14px 18px; }
  .welcome-features { gap: 16px; }
  .feature-item { padding: 12px; min-width: 70px; }
}

@media (max-width: 768px) {
  .ai-help-header { padding: 14px 16px; }
  .header-content { flex-direction: column; align-items: stretch; gap: 12px; }
  .usage-display { align-self: flex-end; }
  .ai-help-content { padding: 16px; }
  .welcome-features { flex-direction: column; align-items: center; gap: 12px; }
  .suggestions-grid { gap: 6px; }
  .chat-messages { padding: 12px 16px; max-height: 300px; }
  .chat-input-section { padding: 12px 16px; }
  .input-wrapper { flex-direction: column; gap: 8px; }
  .send-btn { width: 100%; justify-content: center; }
}

@media (max-width: 480px) {
  .ai-help-header { padding: 12px 14px; }
  .ai-title { font-size: 1.1rem; }
  .ai-subtitle { font-size: 0.8rem; }
  .avatar-icon { width: 36px; height: 36px; font-size: 1.3rem; }
  .ai-help-content { padding: 14px; }
  .welcome-icon { font-size: 3rem; }
  .welcome-title { font-size: 1.3rem; }
  .welcome-text { font-size: 0.9rem; }
  .quick-suggestions, .chat-history { padding: 16px; }
  .suggestion-btn { padding: 10px 12px; font-size: 0.85rem; }
  .chat-messages { padding: 10px 12px; gap: 12px; max-height: 250px; }
  .message-content { padding: 10px 12px; font-size: 0.85rem; }
  .chat-input-section { padding: 10px 12px; }
  .chat-input-field { padding: 10px 12px; font-size: 0.85rem; }
  .send-btn { padding: 10px 12px; min-width: 44px; }
  .quick-text-btn { font-size: 0.7rem; padding: 3px 6px; }
}

/* Accessibility and UX Enhancements */
::selection { background-color: rgba(14, 165, 233, 0.2); color: inherit; }
::-moz-selection { background-color: rgba(14, 165, 233, 0.2); color: inherit; }

.suggestion-btn:focus,
.clear-chat-btn:focus,
.show-more-btn:focus,
.chat-input-field:focus,
.send-btn:focus,
.quick-text-btn:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

@keyframes gentleBounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-3px); }
  60% { transform: translateY(-1px); }
}

.suggestion-btn:active, .send-btn:active {
  animation: gentleBounce 0.3s ease;
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .welcome-icon, .welcome-particles span, .avatar-status, .typing-dot { animation: none; }
  .suggestion-btn:hover, .send-btn:hover, .show-more-btn:hover, .clear-chat-btn:hover { transform: none; }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .ai-help-panel { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
  .ai-help-header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); }
  .ai-title, .ai-subtitle { color: #e2e8f0; }
  .usage-info { background: rgba(30, 41, 59, 0.8); border-color: rgba(148, 163, 184, 0.3); }
  .welcome-title { color: #e2e8f0; }
  .welcome-text, .feature-text { color: #cbd5e1; }
  .feature-item { background: rgba(30, 41, 59, 0.5); border-color: rgba(148, 163, 184, 0.3); }
  .quick-suggestions, .chat-history { background: #1e293b; border-color: #334155; }
  .suggestions-title, .chat-title { color: #e2e8f0; }
  .suggestion-btn { background: linear-gradient(135deg, #334155 0%, #475569 100%); color: #e2e8f0; border-color: #475569; }
  .suggestion-btn:hover { background: linear-gradient(135deg, #475569 0%, #64748b 100%); border-color: #64748b; }
  .chat-header { background: linear-gradient(135deg, #334155 0%, #475569 100%); border-bottom-color: #475569; }
  .message-content { background: #334155; color: #e2e8f0; border-color: #475569; }
  .chat-message.user .message-content { background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%); color: #dbeafe; border-color: #3b82f6; }
  .chat-message.ai .message-content { background: linear-gradient(135deg, #334155 0%, #475569 100%); color: #e2e8f0; border-color: #64748b; }
  .chat-input-section { background: #1e293b; border-top-color: #334155; }
  .chat-input-field { background: #334155; border-color: #475569; color: #e2e8f0; }
  .chat-input-field:focus { border-color: #0ea5e9; background: #475569; }
  .quick-text-btn { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; border-color: rgba(148, 163, 184, 0.3); }
  .quick-text-btn:hover { background: rgba(148, 163, 184, 0.3); border-color: #94a3b8; }
  .show-more-section { background: #334155; border-top-color: #475569; }
  .show-more-btn { background: linear-gradient(135deg, #475569 0%, #64748b 100%); color: #e2e8f0; border-color: #64748b; }
  .show-more-btn:hover { background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%); border-color: #94a3b8; }
}
</style>