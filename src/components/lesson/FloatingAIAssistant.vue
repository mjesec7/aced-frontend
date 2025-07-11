<template>
    <div class="floating-ai-assistant">
      <div class="ai-header">
        <h4>🤖 AI Помощник</h4>
        <button @click="$emit('close')" class="close-ai-btn">✕</button>
      </div>
      
      <div class="ai-body">
        <div v-if="aiUsage" class="usage-display">
          <p>📊 Использовано: {{ formatUsage(aiUsage) }}</p>
        </div>
        
        <div v-if="(quickSuggestions || []).length" class="quick-suggestions">
          <p class="suggestions-label">💡 Быстрые вопросы:</p>
          <div class="suggestions-list">
            <button 
              v-for="(suggestion, quickIndex) in (quickSuggestions || [])" 
              :key="`quick-${quickIndex}`"
              @click="$emit('ask-ai', suggestion)"
              class="quick-suggestion-btn"
              :disabled="aiIsLoading"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>
        
        <div class="ai-chat-area">
          <div class="chat-messages" ref="chatMessages">
            <div v-if="!(aiChatHistory || []).length" class="empty-chat-state">
              <div class="empty-icon">💭</div>
              <p>Задайте вопрос о текущем шаге!</p>
            </div>
            
            <div 
              v-for="message in recentMessages" 
              :key="message?.id || `float-msg-${Math.random()}`"
              :class="['chat-message', message?.type || 'unknown']"
            >
              <div class="message-avatar">
                <span v-if="message?.type === 'user'">👤</span>
                <span v-else>🤖</span>
              </div>
              <div class="message-bubble">
                <div class="message-content">{{ message?.content || 'No content' }}</div>
                <div class="message-time">{{ formatTime(message) }}</div>
              </div>
            </div>
            
            <div v-if="aiIsLoading" class="loading-message">
              <div class="message-avatar">
                <span>🤖</span>
              </div>
              <div class="message-bubble loading">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="chat-input">
            <input 
              v-model="localFloatingInput" 
              @keyup.enter="sendMessage"
              placeholder="Спросите о текущем шаге..."
              :disabled="aiIsLoading"
              class="chat-input-field"
              ref="chatInput"
            />
            <button 
              @click="sendMessage" 
              :disabled="!localFloatingInput?.trim() || aiIsLoading"
              class="send-btn"
            >
              <span v-if="aiIsLoading" class="loading-spinner">⏳</span>
              <span v-else>📤</span>
            </button>
          </div>
        </div>
        
        <div v-if="(aiChatHistory || []).length > 3" class="chat-controls">
          <button @click="showAllMessages = !showAllMessages" class="toggle-messages-btn">
            {{ showAllMessages ? 'Показать меньше' : 'Показать все' }}
          </button>
          <button @click="clearChat" class="clear-chat-btn">
            🗑️ Очистить
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'FloatingAIAssistant',
    props: {
      aiUsage: {
        type: Object,
        default: null
      },
      quickSuggestions: {
        type: Array,
        default: () => []
      },
      aiChatHistory: {
        type: Array,
        default: () => []
      },
      floatingAIInput: {
        type: String,
        default: ''
      },
      aiIsLoading: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close', 'send-message', 'ask-ai', 'clear-chat'],
    data() {
      return {
        localFloatingInput: '',
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
        
        return this.aiChatHistory.slice(-5);
      }
    },
    watch: {
      floatingAIInput: {
        handler(newValue) {
          this.localFloatingInput = newValue;
        },
        immediate: true
      },
      
      aiChatHistory: {
        handler() {
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        },
        deep: true
      }
    },
    mounted() {
      this.scrollToBottom();
    },
    methods: {
      sendMessage() {
        if (!this.localFloatingInput?.trim() || this.aiIsLoading) return;
        
        this.$emit('send-message', this.localFloatingInput.trim());
        this.localFloatingInput = '';
      },
  
      clearChat() {
        this.$emit('clear-chat');
      },
  
      formatUsage(usage) {
        if (!usage) return '';
        
        const messages = usage.messages || 0;
        const limit = usage.plan === 'free' ? 50 : '∞';
        
        return `${messages}/${limit}`;
      },
  
      formatTime(message) {
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
      },
  
      scrollToBottom() {
        const chatMessages = this.$refs.chatMessages;
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .floating-ai-assistant {
    position: fixed;
    bottom: 90px;
    right: 24px;
    width: 350px;
    background: white;
    border-radius: 20px;
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    z-index: 1001;
    overflow: hidden;
    max-height: 500px;
    display: flex;
    flex-direction: column;
    animation: assistantSlideIn 0.3s ease-out;
  }
  
  @keyframes assistantSlideIn {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .ai-header {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    position: relative;
  }
  
  .ai-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    opacity: 0.3;
  }
  
  .ai-header h4 {
    margin: 0;
    font-size: 1rem;
    color: #1e293b;
    font-weight: 600;
  }
  
  .close-ai-btn {
    background: rgba(148, 163, 184, 0.1);
    border: none;
    font-size: 1.2rem;
    color: #64748b;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    min-width: 44px;
    min-height: 44px;
  }
  
  .close-ai-btn:hover {
    background: rgba(148, 163, 184, 0.2);
    transform: scale(1.05);
  }
  
  .ai-body {
    padding: 16px;
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .usage-display {
    background: #f8fafc;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    color: #64748b;
    text-align: center;
    border: 1px solid #e2e8f0;
  }
  
  .usage-display p {
    margin: 0;
    font-weight: 500;
  }
  
  .quick-suggestions {
    background: #f8fafc;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
  }
  
  .suggestions-label {
    margin: 0 0 8px 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
  }
  
  .suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .quick-suggestion-btn {
    background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
    color: #3730a3;
    border: none;
    padding: 8px 12px;
    border-radius: 16px;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    border: 1px solid #c7d2fe;
  }
  
  .quick-suggestion-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(55, 48, 163, 0.2);
  }
  
  .quick-suggestion-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  .ai-chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
    max-height: 250px;
    min-height: 120px;
  }
  
  .empty-chat-state {
    text-align: center;
    padding: 30px 20px;
    color: #9ca3af;
  }
  
  .empty-icon {
    font-size: 2rem;
    margin-bottom: 12px;
    opacity: 0.7;
  }
  
  .empty-chat-state p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .chat-message {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    animation: messageAppear 0.3s ease-out;
  }
  
  @keyframes messageAppear {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .message-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    flex-shrink: 0;
    border: 1px solid #e2e8f0;
  }
  
  .chat-message.user .message-avatar {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-color: #93c5fd;
  }
  
  .chat-message.ai .message-avatar {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border-color: #d1d5db;
  }
  
  .message-bubble {
    flex: 1;
    max-width: calc(100% - 36px);
  }
  
  .message-content {
    background: #f8fafc;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 0.85rem;
    line-height: 1.4;
    border: 1px solid #e2e8f0;
    word-wrap: break-word;
  }
  
  .chat-message.user .message-content {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    color: #1e40af;
    border-color: #93c5fd;
  }
  
  .chat-message.ai .message-content {
    background: #f3f4f6;
    color: #374151;
    border-color: #d1d5db;
  }
  
  .message-time {
    font-size: 0.7rem;
    color: #9ca3af;
    margin-top: 4px;
    text-align: right;
  }
  
  .loading-message {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .message-bubble.loading .message-content {
    background: #f3f4f6;
    border-color: #d1d5db;
    padding: 12px;
  }
  
  .typing-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
  }
  
  .typing-indicator span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #9ca3af;
    animation: typingPulse 1.4s infinite ease-in-out;
  }
  
  .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
  .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes typingPulse {
    0%, 80%, 100% { 
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% { 
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .chat-input {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
  }
  
  .chat-input-field {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 20px;
    font-size: 0.85rem;
    transition: all 0.2s ease;
    background: #f9fafb;
  }
  
  .chat-input-field:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: white;
  }
  
  .chat-input-field:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .send-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 10px 12px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
  }
  
  .send-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    transform: scale(1.05);
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
  
  .chat-controls {
    display: flex;
    gap: 8px;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    margin-top: 8px;
  }
  
  .toggle-messages-btn,
  .clear-chat-btn {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #64748b;
    padding: 6px 12px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .toggle-messages-btn:hover,
  .clear-chat-btn:hover {
    background: #e2e8f0;
    color: #374151;
    transform: translateY(-1px);
  }
  
  .clear-chat-btn {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.2);
  }
  
  .clear-chat-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }
  
  /* Custom scrollbar for chat messages */
  .chat-messages::-webkit-scrollbar {
    width: 4px;
  }
  
  .chat-messages::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .chat-messages::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.4);
    border-radius: 2px;
  }
  
  .chat-messages::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.6);
  }
  
  /* Responsive Design */
  @media (max-width: 768px) {
    .floating-ai-assistant {
      width: calc(100vw - 32px);
      right: 16px;
      left: 16px;
      bottom: 70px;
      max-height: 60vh;
    }
  
    .ai-header {
      padding: 12px 16px;
    }
  
    .ai-body {
      padding: 12px;
    }
  
    .chat-messages {
      max-height: 200px;
    }
  
    .message-content {
      font-size: 0.8rem;
      padding: 8px 10px;
    }
  
    .chat-input-field {
      font-size: 0.8rem;
      padding: 8px 10px;
    }
  
    .quick-suggestion-btn {
      font-size: 0.7rem;
      padding: 6px 10px;
    }
  }
  
  @media (max-width: 480px) {
    .floating-ai-assistant {
      width: calc(100vw - 16px);
      right: 8px;
      left: 8px;
      bottom: 60px;
      max-height: 50vh;
    }
  
    .ai-header {
      padding: 10px 12px;
    }
  
    .ai-header h4 {
      font-size: 0.9rem;
    }
  
    .ai-body {
      padding: 10px;
      gap: 10px;
    }
  
    .chat-messages {
      max-height: 150px;
      min-height: 100px;
    }
  
    .message-content {
      font-size: 0.75rem;
      padding: 6px 8px;
    }
  
    .message-avatar {
      width: 24px;
      height: 24px;
      font-size: 0.7rem;
    }
  
    .chat-input {
      gap: 6px;
    }
  
    .chat-input-field {
      font-size: 0.75rem;
      padding: 6px 8px;
    }
  
    .send-btn {
      padding: 6px 8px;
      min-width: 32px;
      font-size: 0.8rem;
    }
  
    .quick-suggestions {
      padding: 8px;
    }
  
    .quick-suggestion-btn {
      font-size: 0.65rem;
      padding: 4px 8px;
    }
  
    .empty-chat-state {
      padding: 20px 15px;
    }
  
    .empty-icon {
      font-size: 1.5rem;
    }
  }
  
  /* Focus states for accessibility */
  .close-ai-btn:focus,
  .quick-suggestion-btn:focus,
  .chat-input-field:focus,
  .send-btn:focus,
  .toggle-messages-btn:focus,
  .clear-chat-btn:focus {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .floating-ai-assistant,
    .quick-suggestions,
    .usage-display {
      border-width: 2px;
    }
  
    .message-content {
      border-width: 2px;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .floating-ai-assistant {
      animation: none;
    }
  
    .chat-message {
      animation: none;
    }
  
    .typing-indicator span {
      animation: none;
    }
  
    .loading-spinner {
      animation: none;
    }
  
    .quick-suggestion-btn:hover,
    .send-btn:hover,
    .close-ai-btn:hover,
    .toggle-messages-btn:hover,
    .clear-chat-btn:hover {
      transform: none;
    }
  }
  
  /* Print styles */
  @media print {
    .floating-ai-assistant {
      display: none;
    }
  }
  
  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    .floating-ai-assistant {
      background: #1e293b;
      color: #e2e8f0;
    }
  
    .ai-header {
      background: linear-gradient(135deg, #374151 0%, #1e293b 100%);
      border-bottom-color: #4b5563;
    }
  
    .ai-header h4 {
      color: #e2e8f0;
    }
  
    .close-ai-btn {
      background: rgba(148, 163, 184, 0.2);
      color: #94a3b8;
    }
  
    .usage-display,
    .quick-suggestions {
      background: #374151;
      border-color: #4b5563;
      color: #e2e8f0;
    }
  
    .suggestions-label {
      color: #e2e8f0;
    }
  
    .chat-input-field {
      background: #374151;
      border-color: #4b5563;
      color: #e2e8f0;
    }
  
    .message-content {
      color: #e2e8f0;
    }
  
    .chat-message.ai .message-content {
      background: #374151;
      border-color: #4b5563;
    }
  
    .message-bubble.loading .message-content {
      background: #374151;
      border-color: #4b5563;
    }
  
    .chat-controls {
      border-top-color: #4b5563;
    }
  
    .toggle-messages-btn,
    .clear-chat-btn {
      background: #374151;
      border-color: #4b5563;
      color: #94a3b8;
    }
  
    .empty-chat-state {
      color: #6b7280;
    }
  }
  </style>