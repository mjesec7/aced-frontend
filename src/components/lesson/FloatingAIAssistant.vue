<template>
  <div class="floating-ai-assistant">
    <div class="ai-header">
      <div class="ai-header-left">
        <h4>🤖 {{ $t('lesson.floatingAssistant.title') }}</h4>
      </div>
      <div class="ai-header-right">
        <!-- Send Button -->
        <button 
          @click="sendMessage" 
          class="send-btn"
          :disabled="!localFloatingInput.trim()"
        >
          <span>➤</span>
        </button>
        <button @click="$emit('close')" class="close-ai-btn">✕</button>
      </div>
    </div>

    <div class="ai-body">
      <!-- Usage Display -->
      <div v-if="formattedUsage" class="usage-display">
        <p>📊 {{ $t('lesson.floatingAssistant.used') }}: {{ formattedUsage }}</p>
        <div v-if="usagePercentage > 0 && !isUnlimited" class="usage-bar">
          <div class="usage-fill" :style="{ width: usagePercentage + '%' }"></div>
        </div>
      </div>
      
      <!-- Step Context Indicator (RAG - shows what AI can "see") -->
      <div v-if="stepContextDisplay" class="step-context-indicator">
        <span class="context-icon">👁️</span>
        <span class="context-text">{{ $t('lesson.floatingAssistant.aiCanSee', 'AI can see:') }} <strong>{{ stepContextDisplay }}</strong></span>
      </div>

      <!-- Contextual Quick Suggestions (RAG-powered) -->
      <div v-if="contextualSuggestions.length" class="quick-suggestions">
        <p class="suggestions-label">💡 {{ $t('lesson.floatingAssistant.quickQuestions') }}</p>
        <div class="suggestions-list">
          <button
            v-for="(suggestion, quickIndex) in contextualSuggestions"
            :key="`quick-${quickIndex}`"
            @click="$emit('ask-ai', suggestion)"
            class="quick-suggestion-btn"
            :disabled="aiIsLoading || isMessageLimitReached"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
      
      <!-- Chat Area -->
      <div class="ai-chat-area">
        <div class="chat-messages" ref="chatMessages">
          <div v-if="!(aiChatHistory || []).length" class="empty-chat-state">
            <div class="empty-icon">💭</div>
            <p>{{ $t('lesson.floatingAssistant.askQuestion') }}</p>
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
        
        <!-- Chat Input -->
        <div class="chat-input">
          <input 
            v-model="localFloatingInput" 
            @keyup.enter="sendMessage"
            :placeholder="$t('lesson.floatingAssistant.placeholder')"
            :disabled="aiIsLoading || isMessageLimitReached"
            class="chat-input-field"
            ref="chatInput"
          />
          <button 
            @click="sendMessage" 
            :disabled="!localFloatingInput?.trim() || aiIsLoading || isMessageLimitReached"
            class="send-btn"
            :title="isMessageLimitReached ? $t('lesson.floatingAssistant.limitReachedTitle') : $t('lesson.floatingAssistant.sendTitle')"
          >
            <span v-if="aiIsLoading" class="loading-spinner">⏳</span>
            <span v-else>📤</span>
          </button>
        </div>
        
        <!-- Message Limit Warning -->
        <div v-if="isNearLimit || isMessageLimitReached" class="limit-warning">
          <div v-if="isMessageLimitReached" class="limit-reached">
            🚫 {{ $t('lesson.floatingAssistant.limitReached') }}
            <a href="/pay/start" class="upgrade-link">{{ $t('lesson.floatingAssistant.upgrade') }}</a>
          </div>
          <div v-else-if="isNearLimit" class="limit-near">
            ⚠️ {{ $t('lesson.floatingAssistant.remaining', { count: remainingMessages }) }}
          </div>
        </div>
      </div>
      
      <!-- Chat Controls -->
      <div v-if="(aiChatHistory || []).length > 3" class="chat-controls">
        <button @click="showAllMessages = !showAllMessages" class="toggle-messages-btn">
          {{ showAllMessages ? $t('lesson.floatingAssistant.showLess') : $t('lesson.floatingAssistant.showAll') }}
        </button>
        <button @click="clearChat" class="clear-chat-btn">
          🗑️ {{ $t('lesson.floatingAssistant.clear') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { eventBus } from '@/utils/eventBus';
import voiceApi from '@/api/voice';
import chatApi from '@/api/chat';
import { extractExerciseContent } from '@/utils/exerciseContentExtractor';

export default {
  name: 'FloatingAIAssistant',
  props: {
    aiUsage: {
      type: Object,
      default: () => ({
        messages: 0,
        current: 0,
        limit: 50,
        remaining: 50,
        percentage: 0,
        unlimited: false,
        plan: 'free'
      })
    },
    // Quick suggestions can be passed from parent or auto-generated
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
    },
    // Current step context for RAG - allows component to show context-aware suggestions
    currentStep: {
      type: Object,
      default: null
    },
    // CRITICAL: Current exercise object - allows AI to "see" the exercise details
    // This should be the actual exercise data (question, options, etc.)
    currentExercise: {
      type: Object,
      default: null
    },
    // User progress for personalization
    userProgress: {
      type: Object,
      default: () => ({
        mistakes: 0,
        currentStep: 0,
        completedSteps: 0
      })
    },
    // CRITICAL: Lesson ID for backend to fetch lesson data and chat memory
    lessonId: {
      type: String,
      default: ''
    },
    // CRITICAL: Current slide/step index - tells backend exactly where user is
    currentSlideIndex: {
      type: Number,
      default: 0
    },
    // Language for AI responses
    language: {
      type: String,
      default: 'en'
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
    },

    // Get user subscription status from store
    userStatus() {
      return this.$store?.getters?.['user/userStatus'] || 'free';
    },

    // Generate contextual suggestions based on current step type (RAG Architecture)
    // This allows the AI to provide relevant help based on what the user is working on
    contextualSuggestions() {
      // If parent provides suggestions, use those first
      if (this.quickSuggestions && this.quickSuggestions.length > 0) {
        return this.quickSuggestions;
      }

      // Otherwise, generate based on step type
      if (!this.currentStep) {
        return [
          this.$t('lesson.floatingAssistant.defaultSuggestion1', 'Can you help me understand this?'),
          this.$t('lesson.floatingAssistant.defaultSuggestion2', 'What should I focus on?'),
          this.$t('lesson.floatingAssistant.defaultSuggestion3', 'Give me a hint')
        ];
      }

      const stepType = this.currentStep.type?.toLowerCase();
      const hasMistakes = this.userProgress?.mistakes > 0;

      // Exercise-specific suggestions
      if (stepType === 'exercise' || stepType === 'quiz') {
        if (hasMistakes) {
          return [
            this.$t('lesson.floatingAssistant.exerciseHelpHint', "I'm stuck, can you give me a hint?"),
            this.$t('lesson.floatingAssistant.exerciseExplainApproach', 'Explain how to approach this problem'),
            this.$t('lesson.floatingAssistant.exerciseWhatWrong', "What am I doing wrong?")
          ];
        }
        return [
          this.$t('lesson.floatingAssistant.exerciseCheckApproach', 'Is my approach correct?'),
          this.$t('lesson.floatingAssistant.exerciseExplainQuestion', 'Explain the question in detail'),
          this.$t('lesson.floatingAssistant.exerciseHowToSolve', 'How should I solve this?')
        ];
      }

      // Explanation-specific suggestions
      if (stepType === 'explanation') {
        return [
          this.$t('lesson.floatingAssistant.explainSimpler', 'Can you explain this simpler?'),
          this.$t('lesson.floatingAssistant.explainKeyPoints', 'What are the key points?'),
          this.$t('lesson.floatingAssistant.explainRealExample', 'Give me a real-life example')
        ];
      }

      // Vocabulary-specific suggestions
      if (stepType === 'vocabulary') {
        return [
          this.$t('lesson.floatingAssistant.vocabRemember', 'Help me remember this word'),
          this.$t('lesson.floatingAssistant.vocabUsage', 'How is this word used?'),
          this.$t('lesson.floatingAssistant.vocabMoreExamples', 'Give me more examples')
        ];
      }

      // Default suggestions
      return [
        this.$t('lesson.floatingAssistant.defaultHelp', 'Help me understand this better'),
        this.$t('lesson.floatingAssistant.defaultFocus', 'What should I focus on here?'),
        this.$t('lesson.floatingAssistant.defaultImportant', 'What is important to remember?')
      ];
    },

    // Display current step context to show user what AI can "see"
    stepContextDisplay() {
      if (!this.currentStep) return null;

      const stepType = this.currentStep.type?.toLowerCase();
      const typeName = {
        'exercise': this.$t('lesson.stepTypes.exercise', 'Exercise'),
        'quiz': this.$t('lesson.stepTypes.quiz', 'Quiz'),
        'explanation': this.$t('lesson.stepTypes.explanation', 'Explanation'),
        'vocabulary': this.$t('lesson.stepTypes.vocabulary', 'Vocabulary'),
        'game': this.$t('lesson.stepTypes.game', 'Game'),
        'basket': this.$t('lesson.stepTypes.sorting', 'Sorting'),
        'sorting': this.$t('lesson.stepTypes.sorting', 'Sorting'),
        'matching': this.$t('lesson.stepTypes.matching', 'Matching'),
        'ordering': this.$t('lesson.stepTypes.ordering', 'Ordering')
      }[stepType] || stepType || 'Content';

      // Build display string with step index
      let display = `${this.$t('lesson.floatingAssistant.step', 'Step')} ${this.currentSlideIndex + 1}: ${typeName}`;

      // Add brief question preview for interactive types
      if (['exercise', 'quiz', 'basket', 'sorting', 'matching', 'ordering'].includes(stepType)) {
        const content = this.currentStep.content || this.currentStep.data || {};
        const exercises = content.exercises || content.questions || [];
        const firstExercise = exercises[0] || content;
        const question = firstExercise?.question || firstExercise?.prompt || firstExercise?.text || '';
        
        // Get localized question
        let questionText = '';
        if (typeof question === 'string') {
          questionText = question;
        } else if (typeof question === 'object') {
          questionText = question.ru || question.en || question.uz || Object.values(question)[0] || '';
        }
        
        if (questionText && questionText.length > 0) {
          const truncated = questionText.length > 40 ? questionText.substring(0, 40) + '...' : questionText;
          display += ` - "${truncated}"`;
        }
      }

      return display;
    },

    // Parse usage data properly
    currentMessageCount() {
      if (!this.aiUsage || typeof this.aiUsage !== 'object') {
        return 0;
      }
      
      // Handle different possible structures
      return this.aiUsage.current || this.aiUsage.messages || 0;
    },

    messageLimit() {
      if (!this.aiUsage || typeof this.aiUsage !== 'object') {
        return 50;
      }
      
      return this.aiUsage.limit || 50;
    },

    isUnlimited() {
      return this.aiUsage?.unlimited || this.messageLimit === -1;
    },

    remainingMessages() {
      if (this.isUnlimited) {
        return -1; // Unlimited
      }
      
      return this.aiUsage?.remaining || Math.max(0, this.messageLimit - this.currentMessageCount);
    },

    usagePercentage() {
      if (this.isUnlimited) {
        return 0;
      }
      
      if (this.messageLimit <= 0) {
        return 0;
      }
      
      return this.aiUsage?.percentage || Math.min(100, Math.round((this.currentMessageCount / this.messageLimit) * 100));
    },

    // Check if user has reached message limit
    isMessageLimitReached() {
      if (this.isUnlimited) {
        return false;
      }
      
      return this.currentMessageCount >= this.messageLimit;
    },

    // Check if user is near the limit (90% of limit reached)
    isNearLimit() {
      if (this.isUnlimited) {
        return false;
      }
      
      const threshold = Math.floor(this.messageLimit * 0.9);
      return this.currentMessageCount >= threshold && !this.isMessageLimitReached;
    },

    // Format usage display properly
    formattedUsage() {
      if (!this.aiUsage) {
        return '0/50';
      }
      
      const current = this.currentMessageCount;
      
      if (this.isUnlimited) {
        return `${current}/∞`;
      }
      
      const limit = this.messageLimit;
      return `${current}/${limit}`;
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

  beforeUnmount() {
    // No cleanup needed for voice here anymore
  },

  methods: {
    // ==========================================
    // ORIGINAL CHAT METHODS
    // ==========================================

    sendMessage() {
      if (!this.localFloatingInput?.trim() || this.aiIsLoading || this.isMessageLimitReached) {
        return;
      }

      // EXTRACT: Convert the raw exercise JSON into readable text for AI
      // This is the "translator" that allows AI to understand exercise data
      const exerciseSource = this.currentExercise || this.currentStep;
      const exerciseContext = extractExerciseContent(exerciseSource, this.language);

      // CRITICAL: Emit message with full context for RAG
      // Backend needs all this data to construct the AI system prompt
      this.$emit('send-message', {
        message: this.localFloatingInput.trim(),
        lessonId: this.lessonId,
        currentStepIndex: this.currentSlideIndex,
        // Include the extracted exercise context so parent doesn't have to re-extract
        exerciseContext: exerciseContext,
        stepType: this.currentStep?.type
      });
      this.localFloatingInput = '';
    },

    clearChat() {
      this.$emit('clear-chat');
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
  width: 100%;
  max-width: 400px; /* Flexible width */
  background: white;
  border-radius: 20px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 1001;
  overflow: hidden;
  max-height: 75vh; /* Responsive height */
  display: flex;
  flex-direction: column;
  animation: assistantSlideIn 0.3s ease-out;
}

@media (max-width: 640px) {
  .floating-ai-assistant {
    right: 16px;
    left: 16px;
    width: auto;
    max-width: none;
    bottom: 80px;
  }
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
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
  gap: 12px;
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

.ai-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.ai-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ai-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: #1e293b;
  font-weight: 600;
  white-space: nowrap;
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
  margin: 0 0 4px 0;
  font-weight: 500;
}

/* Step Context Indicator - Shows what AI can "see" (RAG Architecture) */
.step-context-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #86efac;
  border-radius: 8px;
  font-size: 0.75rem;
  color: #166534;
}

.step-context-indicator .context-icon {
  font-size: 0.85rem;
}

.step-context-indicator .context-text {
  flex: 1;
}

.step-context-indicator strong {
  font-weight: 600;
  color: #15803d;
}

.usage-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.usage-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  transition: width 0.3s ease;
}

.usage-fill[style*="90"], .usage-fill[style*="100"] {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.usage-fill[style*="70"], .usage-fill[style*="80"] {
  background: linear-gradient(90deg, #f59e0b, #d97706);
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
  max-height: 350px;
  min-height: 200px;
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
  background: #f3f4f6;
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
  background: #9ca3af;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Message limit warning styles */
.limit-warning {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
}

.limit-reached {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  border: 1px solid #fecaca;
}

.limit-near {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  color: #d97706;
  border: 1px solid #fed7aa;
}

.upgrade-link {
  color: #2563eb;
  text-decoration: underline;
  font-weight: 600;
}

.upgrade-link:hover {
  color: #1d4ed8;
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

/* Responsive Design */
@media (max-width: 768px) {
  .floating-ai-assistant {
    width: calc(100vw - 32px);
    right: 16px;
    left: 16px;
    bottom: 70px;
    max-height: 75vh;
  }
}
</style>