<template>
  <div class="ai-help-panel">
    <div class="ai-help-header">
      <h4>🤖 AI Assistant</h4>
      <div v-if="aiUsage" class="usage-display">
        <span class="usage-text">{{ formatUsage(aiUsage) }}</span>
      </div>
    </div>
    
    <p class="ai-help-description">Select an answer on the left, and I will help you with explanations!</p>
    
    <!-- Quick suggestions -->
    <div v-if="(aiSuggestions || []).length" class="quick-suggestions">
      <p class="suggestions-title"><strong>Popular questions:</strong></p>
      <div class="suggestions-grid">
        <button 
          v-for="(suggestion, suggestionIndex) in (aiSuggestions || [])" 
          :key="`suggestion-${suggestionIndex}`"
          @click="$emit('ask-ai', suggestion)"
          class="suggestion-btn"
          :disabled="aiIsLoading"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>
    
    <!-- Chat input -->
    <div class="ai-chat-input">
      <input 
        v-model="localChatInput" 
        @keyup.enter="sendMessage"
        placeholder="Ask about this exercise..."
        :disabled="aiIsLoading"
        class="chat-input-field"
      />
      <button 
        @click="sendMessage" 
        :disabled="!localChatInput?.trim() || aiIsLoading"
        class="send-btn"
      >
        <span v-if="aiIsLoading" class="loading-spinner">⏳</span>
        <span v-else>📤</span>
      </button>
    </div>
    
    <!-- Chat history -->
    <div v-if="(aiChatHistory || []).length" class="ai-chat-history">
      <div class="chat-header">
        <h5>💬 Chat history</h5>
        <button @click="clearChat" class="clear-chat-btn" title="Clear history">
          🗑️
        </button>
      </div>
      <div class="chat-messages">
        <div 
          v-for="message in recentMessages" 
          :key="message?.id || `ai-msg-${Math.random()}`"
          :class="['chat-message', message?.type || 'unknown']"
        >
          <div class="message-header">
            <strong v-if="message?.type === 'user'">
              <span class="user-icon">👤</span> You:
            </strong>
            <strong v-else>
              <span class="ai-icon">🤖</span> AI:
            </strong>
            <span class="message-time">{{ formatMessageTime(message) }}</span>
          </div>
          <div class="message-content">
            {{ message?.content || 'No content' }}
          </div>
        </div>
      </div>
      
      <div v-if="(aiChatHistory || []).length > 3" class="show-more-container">
        <button @click="showAllMessages = !showAllMessages" class="show-more-btn">
          {{ showAllMessages ? 'Show less' : `Show all (${(aiChatHistory || []).length})` }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="ai-empty-state">
      <div class="empty-icon">🤔</div>
      <p>Ask a question, and I will help you understand the exercise!</p>
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
      showAllMessages: false
    }
  },
  computed: {
    recentMessages() {
      if (!this.aiChatHistory || !Array.isArray(this.aiChatHistory)) {
        return [];
      }
      
      if (this.showAllMessages) {
        return this.aiChatHistory;
      }
      
      return this.aiChatHistory.slice(-3);
    }
  },
  watch: {
    aiChatInput: {
      handler(newValue) {
        this.localChatInput = newValue;
      },
      immediate: true
    }
  },
  methods: {
    sendMessage() {
      if (!this.localChatInput?.trim() || this.aiIsLoading) return;
      
      this.$emit('send-message', this.localChatInput.trim());
      this.localChatInput = '';
    },

    clearChat() {
      this.$emit('clear-chat');
    },

    formatUsage(usage) {
      if (!usage) return '';
      
      const messages = usage.messages || 0;
      const limit = usage.plan === 'free' ? 50 : '∞';
      
      return `${messages}/${limit} messages`;
    },

    formatMessageTime(message) {
      if (!message?.timestamp) return '';
      
      try {
        const date = new Date(message.timestamp);
        return date.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } catch (error) {
        return '';
      }
    }
  }
}
</script>

<style scoped>
.ai-help-panel {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(29, 78, 216, 0.03) 100%);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  overflow: hidden;
}

.ai-help-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 16px 16px 0 0;
}

.ai-help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ai-help-header h4 {
  margin: 0;
  color: #1d4ed8;
  font-size: 1.1rem;
  font-weight: 600;
}

.usage-display {
  background: rgba(59, 130, 246, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.usage-text {
  font-size: 0.8rem;
  color: #1e40af;
  font-weight: 500;
}

.ai-help-description {
  margin: 0;
  color: #64748b;
  line-height: 1.5;
  font-size: 0.95rem;
}

.quick-suggestions {
  background: white;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.suggestions-title {
  margin: 0 0 12px 0;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.suggestions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #3730a3;
  border: none;
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #c7d2fe;
}

.suggestion-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(55, 48, 163, 0.2);
}

.suggestion-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.ai-chat-input {
  display: flex;
  gap: 10px;
  background: white;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chat-input-field {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.chat-input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: white;
}

.send-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ai-chat-history {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.chat-header h5 {
  margin: 0;
  font-size: 0.9rem;
  color: #374151;
  font-weight: 600;
}

.clear-chat-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.clear-chat-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  max-height: 300px;
}

.chat-message {
  margin-bottom: 16px;
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.message-header strong {
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-icon,
.ai-icon {
  font-size: 0.8rem;
}

.message-time {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: normal;
}

.message-content {
  font-size: 0.9rem;
  line-height: 1.4;
  padding: 10px 12px;
  border-radius: 8px;
  margin-left: 16px;
}

.chat-message.user .message-content {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.chat-message.ai .message-content {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.show-more-container {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  text-align: center;
}

.show-more-btn {
  background: none;
  border: 1px solid #d1d5db;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.show-more-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}

.ai-empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
  opacity: 0.7;
}

.ai-empty-state p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  max-width: 200px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .ai-help-panel {
    padding: 20px;
    gap: 16px;
  }

  .ai-help-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .usage-display {
    align-self: flex-end;
  }

  .suggestions-grid {
    gap: 6px;
  }

  .suggestion-btn {
    font-size: 0.75rem;
    padding: 6px 10px;
  }

  .ai-chat-input {
    padding: 10px;
    gap: 8px;
  }

  .chat-input-field {
    font-size: 0.85rem;
    padding: 8px 10px;
  }

  .send-btn {
    padding: 8px 10px;
    min-width: 40px;
  }

  .chat-messages {
    max-height: 200px;
    padding: 12px;
  }

  .message-content {
    font-size: 0.85rem;
    padding: 8px 10px;
  }
}

@media (max-width: 480px) {
  .ai-help-panel {
    padding: 16px;
  }

  .ai-help-header h4 {
    font-size: 1rem;
  }

  .ai-help-description {
    font-size: 0.9rem;
  }

  .quick-suggestions {
    padding: 12px;
  }

  .suggestion-btn {
    font-size: 0.7rem;
    padding: 5px 8px;
  }

  .ai-chat-input {
    flex-direction: column;
    gap: 8px;
  }

  .send-btn {
    width: 100%;
    justify-content: center;
  }

  .ai-empty-state {
    padding: 30px 15px;
  }

  .empty-icon {
    font-size: 2rem;
  }
}

/* Focus states for accessibility */
.suggestion-btn:focus,
.chat-input-field:focus,
.send-btn:focus,
.clear-chat-btn:focus,
.show-more-btn:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .ai-help-panel,
  .quick-suggestions,
  .ai-chat-input,
  .ai-chat-history {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .chat-message {
    animation: none;
  }

  .suggestion-btn:hover,
  .send-btn:hover {
    transform: none;
  }

  .loading-spinner {
    animation: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .ai-help-panel {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.2);
  }

  .ai-help-description {
    color: #9ca3af;
  }

  .quick-suggestions,
  .ai-chat-input,
  .ai-chat-history {
    background: #374151;
    border-color: #4b5563;
  }

  .suggestions-title,
  .chat-header h5 {
    color: #e5e7eb;
  }

  .chat-input-field {
    background: #4b5563;
    border-color: #6b7280;
    color: #e5e7eb;
  }

  .chat-header {
    background: #4b5563;
    border-bottom-color: #6b7280;
  }

  .chat-message.ai .message-content {
    background: #4b5563;
    color: #e5e7eb;
    border-color: #6b7280;
  }

  .show-more-container {
    background: #4b5563;
    border-top-color: #6b7280;
  }

  .ai-empty-state {
    color: #6b7280;
  }
}
</style>