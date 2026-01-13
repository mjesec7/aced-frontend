<template>
  <div class="floating-ai-assistant">
    <div class="ai-header">
      <div class="ai-header-left">
        <h4>🤖 {{ $t('lesson.floatingAssistant.title') }}</h4>
        <!-- Voice Status Indicators -->
        <div v-if="isAnalyzing" class="voice-status analyzing">
          <span class="status-icon">🧠</span>
          <span class="status-text">{{ $t('lesson.floatingAssistant.analyzing') }}</span>
        </div>
        <div v-else-if="isSpeaking" class="voice-status speaking">
          <span class="status-icon">🔊</span>
          <span class="status-text">{{ $t('lesson.floatingAssistant.speaking') }}</span>
        </div>
        <div v-else-if="isListening" class="voice-status listening">
          <span class="status-icon">👂</span>
          <span class="status-text">{{ $t('lesson.floatingAssistant.listening') }}</span>
        </div>
      </div>
      <div class="ai-header-right">
        <!-- Send Button -->
        <button 
          @click="sendMessage" 
          class="send-btn"
          :disabled="!localFloatingInput.trim() && !isListening"
        >
          <span v-if="isListening" class="listening-indicator"></span>
          <span v-else>➤</span>
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
      
      <!-- Quick Suggestions -->
      <div v-if="(quickSuggestions || []).length" class="quick-suggestions">
        <p class="suggestions-label">💡 {{ $t('lesson.floatingAssistant.quickQuestions') }}</p>
        <div class="suggestions-list">
          <button 
            v-for="(suggestion, quickIndex) in (quickSuggestions || [])" 
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
    // New props for speech analysis
    currentStep: {
      type: Object,
      default: null
    },
    autoAnalyze: {
      type: Boolean,
      default: true
    },
    voiceEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close', 'send-message', 'ask-ai', 'clear-chat', 'analysis-complete', 'speaking-start', 'speaking-end'],
  data() {
    return {
      localFloatingInput: '',
      showAllMessages: false,
      // Speech analysis state
      isSpeaking: false,
      isListening: false,
      isAnalyzing: false,
      currentAudio: null,
      currentAudioUrl: null,
      speechRecognition: null,
      analysisError: null,
      currentExplanation: '',
      currentExplanation: '',
      currentHighlights: [],
      // Cache and Queue
      analysisCache: new Map(),
      processingQueue: [],
      isProcessingQueue: false
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
    },

    // Watch for step changes to trigger auto-analysis
    currentStep: {
      async handler(newStep, oldStep) {
        if (!newStep || !this.autoAnalyze) return;

        // Only analyze if step actually changed
        const newStepId = newStep?.id || newStep?._id;
        const oldStepId = oldStep?.id || oldStep?._id;
        if (newStepId && oldStepId && newStepId === oldStepId) return;

        // Only analyze content steps (not exercises/games)
        const contentTypes = ['explanation', 'example', 'reading'];
        if (!contentTypes.includes(newStep?.type)) {
          this.clearHighlights();
          return;
        }

        // Small delay to ensure UI is ready and prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.analyzeAndSpeak(newStep);
      },
      immediate: true,
      deep: false
    }
  },

  mounted() {
    this.scrollToBottom();
    this.initializeSpeechRecognition();

    // Listen for header mic button
    eventBus.on('toggle-voice-input', this.toggleMicrophone);
  },

  beforeUnmount() {
    this.stopAudio();
    this.stopListening();
    this.clearHighlights();
    eventBus.off('toggle-voice-input', this.toggleMicrophone);
  },

  methods: {
    // ==========================================
    // SPEECH ANALYSIS METHODS
    // ==========================================

    /**
     * Get content text from step data
     */
    getStepContent(step) {
      if (!step) return '';
      
      let content = '';
      if (step.data?.content) content = step.data.content;
      else if (step.data?.text) content = step.data.text;
      else if (step.content?.text) content = step.content.text;
      else if (step.content?.content) content = step.content.content;
      else if (typeof step.content === 'string') content = step.content;
      else if (typeof step.data === 'string') content = step.data;
      else if (step.description) content = step.description;
      else if (step.text) content = step.text;

      // Handle localized object {en: "...", ru: "..."}
      if (content && typeof content === 'object') {
        return content.en || content.ru || content.uz || Object.values(content)[0] || '';
      }

      return content || '';
    },

    /**
     * Main orchestration: Analyze step -> Highlight -> Speak
     */
    async analyzeAndSpeak(step) {
      if (!step) return;

      // Stop any current playback
      this.stopAudio();
      this.clearHighlights();
      this.analysisError = null;

      const content = this.getStepContent(step);
      if (!content || content.length < 20) return;

      // Language Check
      const currentLang = this.$i18n.locale;
      
      // Disable voice for Uzbek as per user request
      if (currentLang === 'uz') {
        console.log('[FloatingAI] Voice disabled for Uzbek language');
        return;
      }
      
      this.isAnalyzing = true;

      try {
        let explanation, highlights, question;
        const stepId = step.id || step._id;

        // 1. Check Cache First
        if (this.analysisCache.has(stepId)) {
          const cachedData = this.analysisCache.get(stepId);
          explanation = cachedData.explanation;
          highlights = cachedData.highlights;
          question = cachedData.question;
        } else {
          // 2. Backend Analysis (if not cached)
          const result = await voiceApi.analyzeLesson(
            content,
            step.type || 'explanation',
            step.type,
            currentLang
          );
          const data = result?.data || result || {};
          explanation = data.explanation;
          highlights = data.highlights;
          question = data.question;
          
          // Cache it
          if (explanation) {
            this.analysisCache.set(stepId, data);
          }
        }

        if (!explanation) {
          console.warn('[FloatingAI] No explanation received from analysis');
          this.isAnalyzing = false;
          return;
        }

        this.currentExplanation = explanation;
        this.currentHighlights = highlights || [];

        // 3. Trigger Highlights in ContentPanel via EventBus
        if (highlights && highlights.length > 0) {
          eventBus.emit('highlight-text', highlights);
        }

        this.$emit('analysis-complete', { explanation, highlights, question });

        // 4. Stream and play audio (if voice enabled)
        if (this.voiceEnabled && explanation) {
          await this.speakText(explanation, question);
        }

      } catch (error) {
        console.error('[FloatingAI] Analysis error:', error);
        this.analysisError = error.message || 'Failed to analyze lesson';
      } finally {
        this.isAnalyzing = false;
      }
    },

    /**
     * Stream audio from text and play it
     */
    /**
     * Stream audio from text and play it
     */
    async speakText(text, question = null) {
      if (!text) return;

      try {
        // Get audio blob from backend
        const currentLang = this.$i18n.locale;
        const audioBlob = await voiceApi.streamAudio(text, { language: currentLang });

        // Create object URL for audio playback
        if (this.currentAudioUrl) {
          URL.revokeObjectURL(this.currentAudioUrl);
        }
        this.currentAudioUrl = URL.createObjectURL(audioBlob);

        // Stop any current playback
        if (this.currentAudio) {
          this.currentAudio.pause();
        }

        // Create and play new audio
        this.currentAudio = new Audio(this.currentAudioUrl);
        this.isSpeaking = true;
        this.$emit('speaking-start');

        // Note: We do NOT start listening automatically anymore (Push-to-Talk)

        this.currentAudio.onended = async () => {
          // If there's a follow-up question, speak it
          if (question) {
            await this.speakQuestion(question);
          } else {
            this.isSpeaking = false;
            this.$emit('speaking-end');
            // Keep listening for user response
          }
        };

        this.currentAudio.onerror = (error) => {
          console.error('[FloatingAI] Audio playback error:', error);
          this.isSpeaking = false;
          this.$emit('speaking-end');
        };

        await this.currentAudio.play();

      } catch (error) {
        console.error('[FloatingAI] speakText error:', error);
        this.isSpeaking = false;
        this.$emit('speaking-end');
      }
    },

    async speakQuestion(questionText) {
      if (!questionText) return;

      try {
        const currentLang = this.$i18n.locale;
        const audioBlob = await voiceApi.streamAudio(questionText, { language: currentLang });
        
        if (this.currentAudioUrl) {
          URL.revokeObjectURL(this.currentAudioUrl);
        }
        this.currentAudioUrl = URL.createObjectURL(audioBlob);

        this.currentAudio = new Audio(this.currentAudioUrl);
        this.isSpeaking = true;

        this.currentAudio.onended = () => {
          this.isSpeaking = false;
          this.$emit('speaking-end');
          // Now waiting for user answer...
        };

        await this.currentAudio.play();
      } catch (error) {
        console.error('[FloatingAI] speakQuestion error:', error);
        this.isSpeaking = false;
      }
    },

    /**
     * Stop current audio playback
     */
    stopAudio() {
      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      }
      if (this.currentAudioUrl) {
        URL.revokeObjectURL(this.currentAudioUrl);
        this.currentAudioUrl = null;
      }
      this.isSpeaking = false;
    },

    /**
     * Clear highlights in ContentPanel
     */
    clearHighlights() {
      eventBus.emit('clear-highlights');
      this.currentHighlights = [];
    },

    // ==========================================
    // SPEECH RECOGNITION (INTERRUPTION)
    // ==========================================

    /**
     * Initialize Web Speech API for voice input
     */
    initializeSpeechRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn('[FloatingAI] Speech recognition not supported in this browser');
        return;
      }

      this.speechRecognition = new SpeechRecognition();
      
      // Set language based on current locale
      const currentLang = this.$i18n.locale;
      if (currentLang === 'ru') {
        this.speechRecognition.lang = 'ru-RU';
      } else if (currentLang === 'uz') {
        this.speechRecognition.lang = 'uz-UZ';
      } else {
        this.speechRecognition.lang = 'en-US';
      }
      this.speechRecognition.interimResults = true;
      this.speechRecognition.continuous = false; // Push-to-talk: Stop after one sentence/phrase

      this.speechRecognition.onresult = async (event) => {
        // Process final results
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim();
            if (transcript) {
              console.log('[FloatingAI] Final transcript:', transcript);
              this.stopListening(); // Stop listening after getting input
              await this.handleVoiceQuestion(transcript);
            }
          }
        }
      };

      this.speechRecognition.onerror = (event) => {
        // Ignore 'no-speech' errors as we are continuously listening
        if (event.error !== 'no-speech') {
          console.error('[FloatingAI] Speech recognition error:', event.error);
        }
        // Don't stop listening on error, try to restart if needed
      };

      this.speechRecognition.onend = () => {
        // Auto-restart if we should be listening
        if (this.isListening) {
          try {
            this.speechRecognition.start();
          } catch (e) {
            // Ignore start errors
          }
        }
      };
    },

    /**
     * Start listening for voice input (interruption)
     */
    startListening() {
      if (!this.speechRecognition) {
        this.initializeSpeechRecognition();
      }

      if (this.isListening) return;

      try {
        this.isListening = true;
        this.speechRecognition.start();
      } catch (error) {
        // Ignore if already started
        console.log('[FloatingAI] Speech recognition start error (likely already running):', error);
      }
    },

    /**
     * Stop listening for voice input
     */
    stopListening() {
      this.isListening = false;
      if (this.speechRecognition) {
        try {
          this.speechRecognition.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    },

    /**
     * Queue entire lesson for background analysis
     */
    queueLessonAnalysis(lesson) {
      if (!lesson || !lesson.steps) return;
      
      // Filter for content steps only
      const contentSteps = lesson.steps.filter(step => 
        ['explanation', 'example', 'reading'].includes(step.type)
      );

      // Add to queue (avoid duplicates)
      contentSteps.forEach(step => {
        const stepId = step.id || step._id;
        if (!this.analysisCache.has(stepId) && !this.processingQueue.find(s => (s.id || s._id) === stepId)) {
          this.processingQueue.push(step);
        }
      });

      // Start processing if not already running
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    },

    /**
     * Process the analysis queue one by one
     */
    async processQueue() {
      if (this.processingQueue.length === 0) {
        this.isProcessingQueue = false;
        return;
      }

      this.isProcessingQueue = true;
      const step = this.processingQueue.shift();
      const stepId = step.id || step._id;

      try {
        // Skip if already cached
        if (this.analysisCache.has(stepId)) {
          this.processQueue();
          return;
        }

        const content = this.getStepContent(step);
        if (!content || content.length < 20) {
          this.processQueue();
          return;
        }

        // Language Check
        const currentLang = this.$i18n.locale;
        // Uzbek is now supported!

        // Analyze (Background)
        const result = await voiceApi.analyzeLesson(
          content,
          step.type || 'explanation',
          step.type,
          currentLang
        );

        const data = result?.data || result || {};
        if (data.explanation) {
          this.analysisCache.set(stepId, data);
        }

      } catch (error) {
        console.warn(`[FloatingAI] Background analysis failed for step ${stepId}:`, error);
      }

      // Small delay between requests to be nice to the API
      setTimeout(() => {
        this.processQueue();
      }, 1000);
    },

    /**
     * Handle voice question - get AI response and speak it
     */
    async handleVoiceQuestion(question) {
      if (!question) return;

      // Add user message to chat
      this.$emit('send-message', question);

      try {
        // Get AI response with lesson context
        const response = await chatApi.getLessonContextAIResponse({
          userInput: question,
          lessonContext: this.currentStep
        });

        const reply = response?.data?.reply || response?.reply;

        if (reply) {
          // Speak the answer
          await this.speakText(reply);
        }

      } catch (error) {
        console.error('[FloatingAI] handleVoiceQuestion error:', error);
      }
    },

    /**
     * Toggle microphone - interrupt and ask question
     */
    /**
     * Toggle microphone state (Push-to-Talk)
     * - If AI is speaking: Stop AI, Start Listening
     * - If Listening: Stop Listening
     * - If Idle: Start Listening
     */
    toggleMicrophone() {
      // 1. If AI is speaking, stop it and start listening (Interruption)
      if (this.isSpeaking) {
        this.stopAudio();
        this.startListening();
        return;
      }

      // 2. If already listening, stop
      if (this.isListening) {
        this.stopListening();
        return;
      }

      // 3. Otherwise, start listening
      this.startListening();
    },

    // ==========================================
    // ORIGINAL CHAT METHODS
    // ==========================================

    sendMessage() {
      if (!this.localFloatingInput?.trim() || this.aiIsLoading || this.isMessageLimitReached) {
        if (this.isMessageLimitReached) {
        }
        return;
      }
      
      this.$emit('send-message', this.localFloatingInput.trim());
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
  max-height: 60vh; /* Responsive height */
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
  font-size: 1rem;
  color: #1e293b;
  font-weight: 600;
  white-space: nowrap;
}

/* Voice Status Indicators */
.voice-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  animation: statusPulse 1.5s ease-in-out infinite;
}

.voice-status.analyzing {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.voice-status.speaking {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.voice-status.listening {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.status-icon {
  font-size: 0.85rem;
}

.status-text {
  font-size: 0.7rem;
}

@keyframes statusPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Microphone Button */
.mic-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.mic-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.mic-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.mic-btn.listening {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  animation: micPulse 1s ease-in-out infinite;
  box-shadow: 0 2px 12px rgba(239, 68, 68, 0.5);
}

.mic-btn.speaking {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

@keyframes micPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
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
    max-height: 60vh;
  }
}
</style>