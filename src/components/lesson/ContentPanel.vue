<template>
  <div class="content-panel">
    <div class="content-header">
      <div class="step-info">
        <div class="step-indicator">
          <span class="step-number">{{ currentIndex + 1 }}</span>
          <span class="step-total">/ {{ totalSteps }}</span>
        </div>
        <div class="step-details">
          <h2 class="step-title">
            <span class="step-icon">{{ getStepIcon() }}</span>
            <span class="step-name">{{ getStepTitle() }}</span>
          </h2>
          <p class="step-description">{{ getStepDescription() }}</p>
        </div>
      </div>

      <div class="content-actions">
        <button
          v-if="canShowAIHelp"
          @click="toggleAIHelp"
          class="ai-help-btn"
          :class="{ active: showAIHelp }"
        >
          <span class="btn-icon">🤖</span>
          <span class="btn-text">AI Help</span>
        </button>
      </div>
    </div>

    <div class="content-body" ref="contentBody">
      <!-- Dynamic Content Rendering -->
      <div class="content-section">
        <!-- Explanation/Reading Content -->
        <div v-if="isContentStep" class="explanation-content">
          <div class="content-wrapper" v-html="getStepContent()"></div>
        </div>

        <!-- Vocabulary Content -->
        <div v-else-if="currentStep.type === 'vocabulary'" class="vocabulary-content">
          <div class="vocab-intro">
            <h3 class="section-title">📚 Vocabulary Learning</h3>
            <p class="section-intro">Learn these important words and phrases.</p>
          </div>
          
          <div class="vocab-grid">
            <div 
              v-for="(word, index) in getVocabularyData()" 
              :key="index"
              class="vocab-card"
              @click="emit('pronounce', word.word || word.term || word.text)"
            >
              <div class="vocab-header">
                <h4 class="vocab-word">{{ word.word || word.term || word.text }}</h4>
                <button class="pronounce-btn" title="Pronounce">🔊</button>
              </div>
              <div class="vocab-content">
                <p class="vocab-definition">{{ word.definition || word.meaning || 'Definition not available' }}</p>
                <div v-if="word.pronunciation" class="vocab-pronunciation">
                  <span class="pronunciation-label">Pronunciation:</span>
                  <span class="pronunciation-text">{{ word.pronunciation }}</span>
                </div>
                <div v-if="word.example" class="vocab-example">
                  <span class="example-label">Example:</span>
                  <span class="example-text">{{ word.example }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="vocab-actions">
            <button @click="emit('init-vocabulary')" class="vocab-practice-btn">
              <span class="btn-icon">🎯</span>
              <span class="btn-text">Practice Vocabulary</span>
            </button>
          </div>
        </div>

        <!-- Fallback for Unknown Content Types -->
        <div v-else class="fallback-content">
          <div class="fallback-header">
            <div class="fallback-icon">{{ getStepIcon() }}</div>
            <h3>{{ getStepTitle() }}</h3>
          </div>
          <div class="fallback-body">
            <p>This step contains {{ currentStep.type }} content.</p>
            <div v-if="currentStep.data" class="debug-info">
              <details>
                <summary>Step Data (Debug)</summary>
                <pre>{{ JSON.stringify(currentStep.data, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Help Section -->
      <div v-if="showAIHelp" class="ai-help-section">
        <div class="ai-help-header">
          <div class="ai-header-content">
            <div class="ai-icon">🤖</div>
            <div class="ai-title">
              <h4>AI Assistant</h4>
              <p>Ask questions about this content</p>
            </div>
          </div>
          <button @click="closeAIHelp" class="close-ai-btn">✕</button>
        </div>

        <div class="ai-help-content">
          <div class="suggested-questions" v-if="suggestedQuestions.length">
            <h5 class="suggestions-title">💡 Suggested Questions</h5>
            <div class="question-buttons">
              <button
                v-for="question in suggestedQuestions"
                :key="question"
                @click="askQuestion(question)"
                class="question-btn"
              >
                {{ question }}
              </button>
            </div>
          </div>

          <div class="ai-chat">
            <div class="chat-input">
              <input
                v-model="aiQuestion"
                @keyup.enter="askQuestion(aiQuestion)"
                placeholder="Ask about this lesson content..."
                class="ai-input"
              />
              <button
                @click="askQuestion(aiQuestion)"
                :disabled="!aiQuestion.trim()"
                class="ask-btn"
              >
                <span class="btn-icon">🚀</span>
              </button>
            </div>

            <div v-if="aiResponse" class="ai-response">
              <div class="response-header">
                <span class="response-icon">🤖</span>
                <span class="response-label">AI Response</span>
              </div>
              <div class="response-content">{{ aiResponse }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-footer">
      <div class="navigation-controls">
        <button
          v-if="currentIndex > 0"
          @click="emit('previous')"
          class="nav-btn prev-btn"
        >
          <span class="btn-icon">⬅️</span>
          <span class="btn-text">Previous</span>
        </button>

        <div class="step-progress">
          <div class="progress-dots">
            <div
              v-for="n in totalSteps"
              :key="n"
              class="progress-dot"
              :class="{
                active: n - 1 === currentIndex,
                completed: n - 1 < currentIndex
              }"
            />
          </div>
        </div>

        <button
          v-if="!isLastStep"
          @click="emit('next')"
          class="nav-btn next-btn"
        >
          <span class="btn-text">Next</span>
          <span class="btn-icon">➡️</span>
        </button>

        <button
          v-else
          @click="emit('complete')"
          class="nav-btn complete-btn"
        >
          <span class="btn-text">Complete</span>
          <span class="btn-icon">🏁</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

// ==========================================
// PROPS & EMITS
// ==========================================
const props = defineProps({
  currentStep: {
    type: Object,
    required: true
  },
  currentIndex: {
    type: Number,
    required: true
  },
  totalSteps: {
    type: Number,
    required: true
  },
  isLastStep: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['previous', 'next', 'complete', 'init-vocabulary', 'pronounce'])

// ==========================================
// REACTIVE STATE
// ==========================================
const contentBody = ref(null)
const showAIHelp = ref(false)
const aiQuestion = ref('')
const aiResponse = ref('')
const isLoadingAI = ref(false)

// ==========================================
// COMPUTED PROPERTIES
// ==========================================
const isContentStep = computed(() => {
  if (!props.currentStep) return false
  const contentTypes = ['explanation', 'example', 'reading']
  return contentTypes.includes(props.currentStep.type)
})

const canShowAIHelp = computed(() => {
  return props.currentStep && ['explanation', 'example', 'reading', 'vocabulary'].includes(props.currentStep.type)
})

const suggestedQuestions = computed(() => {
  if (!props.currentStep) return []
  
  const questions = {
    'explanation': [
      'Can you explain this in simpler terms?',
      'What are the key points to remember?',
      'How does this relate to real-world examples?'
    ],
    'example': [
      'Can you provide another example?',
      'How would this work in a different context?',
      'What makes this example effective?'
    ],
    'reading': [
      'What is the main idea of this text?',
      'Can you summarize the key points?',
      'What should I focus on while reading?'
    ],
    'vocabulary': [
      'How do I pronounce these words correctly?',
      'Can you give me more examples using these words?',
      'What are some synonyms for these terms?'
    ]
  }

  return questions[props.currentStep.type] || []
})

// ==========================================
// METHODS
// ==========================================
const getStepIcon = () => {
  if (!props.currentStep) return '📄'
  
  const icons = {
    'explanation': '📚',
    'example': '💡',
    'reading': '📖',
    'vocabulary': '📝',
    'video': '🎬',
    'audio': '🎵'
  }
  return icons[props.currentStep.type] || '📄'
}

const getStepTitle = () => {
  if (!props.currentStep) return 'Content'
  
  // Try to get title from step
  if (props.currentStep.title) {
    return props.currentStep.title
  }
  
  // Generate title based on type
  const titles = {
    'explanation': 'Explanation',
    'example': 'Example',
    'reading': 'Reading Material',
    'vocabulary': 'Vocabulary',
    'video': 'Video Lesson',
    'audio': 'Audio Content'
  }
  
  const baseTitle = titles[props.currentStep.type] || 'Content'
  return `${baseTitle} ${props.currentIndex + 1}`
}

const getStepDescription = () => {
  if (!props.currentStep) return 'Study the content carefully'
  
  // Try to get description from step
  if (props.currentStep.description) {
    return props.currentStep.description
  }
  
  // Generate description based on type
  const descriptions = {
    'explanation': 'Read through this explanation carefully',
    'example': 'Study this example to understand the concept',
    'reading': 'Read the following content',
    'vocabulary': 'Learn these new words and phrases',
    'video': 'Watch the video content',
    'audio': 'Listen to the audio content'
  }
  
  return descriptions[props.currentStep.type] || 'Study the content carefully'
}

const getStepContent = () => {
  if (!props.currentStep || !props.currentStep.data) {
    return '<p>Content is not available for this step.</p>'
  }
  
  // Try different content sources
  let content = ''
  
  if (typeof props.currentStep.data === 'string') {
    content = props.currentStep.data
  } else if (props.currentStep.data.content) {
    content = props.currentStep.data.content
  } else if (props.currentStep.data.text) {
    content = props.currentStep.data.text
  } else if (props.currentStep.content) {
    content = props.currentStep.content
  } else if (props.currentStep.text) {
    content = props.currentStep.text
  }
  
  // If still no content, try to extract from data object
  if (!content && typeof props.currentStep.data === 'object') {
    // Look for any string properties that might contain content
    const stringProps = Object.values(props.currentStep.data).filter(value => 
      typeof value === 'string' && value.length > 10
    )
    
    if (stringProps.length > 0) {
      content = stringProps[0]
    }
  }
  
  // Final fallback
  if (!content) {
    content = `
      <div class="no-content">
        <h3>📄 ${getStepTitle()}</h3>
        <p>Content for this step is being prepared.</p>
        <p><em>Please check back later or contact support if this issue persists.</em></p>
      </div>
    `
  }
  
  return content
}

const getVocabularyData = () => {
  if (!props.currentStep || !props.currentStep.data) {
    return []
  }
  
  // Try different vocabulary data sources
  let vocabData = []
  
  if (Array.isArray(props.currentStep.data)) {
    vocabData = props.currentStep.data
  } else if (Array.isArray(props.currentStep.data.vocabulary)) {
    vocabData = props.currentStep.data.vocabulary
  } else if (Array.isArray(props.currentStep.data.words)) {
    vocabData = props.currentStep.data.words
  } else if (Array.isArray(props.currentStep.vocabulary)) {
    vocabData = props.currentStep.vocabulary
  } else if (Array.isArray(props.currentStep.words)) {
    vocabData = props.currentStep.words
  }
  
  // If no vocabulary found, create default ones
  if (vocabData.length === 0) {
    vocabData = [
      {
        word: 'Example',
        definition: 'A representative form or pattern',
        pronunciation: 'ig-ZAM-pul',
        example: 'This is an example sentence.'
      }
    ]
  }
  
  return vocabData
}

const toggleAIHelp = () => {
  showAIHelp.value = !showAIHelp.value
  if (showAIHelp.value) {
    nextTick(() => {
      scrollToAIHelp()
    })
  }
}

const closeAIHelp = () => {
  showAIHelp.value = false
  aiQuestion.value = ''
  aiResponse.value = ''
}

const askQuestion = async (question) => {
  if (!question || !question.trim()) return

  isLoadingAI.value = true
  aiQuestion.value = question

  try {
    // Simulate AI response (replace with actual AI API call)
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mock AI responses based on content type and question
    aiResponse.value = getMockAIResponse(question, props.currentStep.type)
  } catch (error) {
    aiResponse.value = 'Sorry, I encountered an error. Please try again.'
  } finally {
    isLoadingAI.value = false
  }
}

const getMockAIResponse = (question, stepType) => {
  const responses = {
    'explanation': {
      'simpler': 'Let me break this down into simpler terms: [explanation content would be analyzed and simplified here]',
      'key points': 'The main points to remember are: 1) [point 1], 2) [point 2], 3) [point 3]',
      'real-world': 'This concept applies in real life when [specific examples based on content]'
    },
    'vocabulary': {
      'pronounce': 'Here are the pronunciation guides for the words in this lesson: [pronunciation would be provided]',
      'examples': 'Here are additional examples using these words: [examples would be generated]',
      'synonyms': 'Here are some synonyms and related words: [synonyms would be provided]'
    }
  }

  const typeResponses = responses[stepType] || {}
  const matchedKey = Object.keys(typeResponses).find(key =>
    question.toLowerCase().includes(key.toLowerCase())
  )

  return matchedKey ? typeResponses[matchedKey] :
    'That\'s a great question! Based on the content in this step, I can help explain the key concepts. What specific part would you like me to clarify?'
}

const scrollToAIHelp = () => {
  const aiSection = document.querySelector('.ai-help-section')
  if (aiSection && contentBody.value) {
    aiSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ==========================================
// WATCHERS
// ==========================================
watch(() => props.currentStep, () => {
  showAIHelp.value = false
  aiQuestion.value = ''
  aiResponse.value = ''
}, { immediate: true })

// Debug log
watch(() => props.currentStep, (newStep) => {
  console.log('📍 ContentPanel: Current step changed:', newStep)
}, { immediate: true })
</script>

<style scoped>
/* ==========================================
   CONTENT PANEL LAYOUT
   ========================================== */
.content-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.content-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
  flex-shrink: 0;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  opacity: 0.6;
}

.step-info {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.step-indicator {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  text-align: center;
  min-width: 80px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.step-number {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.step-total {
  font-size: 0.875rem;
  opacity: 0.9;
}

.step-details {
  flex: 1;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.step-icon {
  font-size: 1.75rem;
}

.step-description {
  margin: 0;
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.4;
}

.content-actions {
  display: flex;
  gap: 12px;
}

.ai-help-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.ai-help-btn:hover,
.ai-help-btn.active {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

/* ==========================================
   CONTENT BODY
   ========================================== */
.content-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 32px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.content-body::-webkit-scrollbar {
  width: 8px;
}

.content-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.content-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.content-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
}

.content-section {
  max-width: 800px;
  margin: 0 auto;
}

.intro-section {
  text-align: center;
  margin-bottom: 40px;
  padding: 32px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 20px;
  border: 1px solid #0ea5e9;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 2rem;
  font-weight: 700;
  color: #0c4a6e;
  line-height: 1.2;
}

.section-intro {
  margin: 0;
  font-size: 1.125rem;
  color: #0369a1;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

/* ==========================================
   LIFECYCLE CONTENT STYLES
   ========================================== */
.lifecycle-phases {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 40px;
}

.phase-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.phase-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transition: transform 0.3s ease;
}

.phase-card.mounting::before {
  background: linear-gradient(90deg, #10b981, #059669);
}

.phase-card.updating::before {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.phase-card.unmounting::before {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.phase-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.phase-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.phase-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
}

.phase-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.phase-description {
  font-size: 1rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.phase-steps {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.phase-steps li {
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 4px solid #6366f1;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;
  color: #374151;
}

.phase-example {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #f59e0b;
}

.example-header {
  margin-bottom: 8px;
}

.example-label {
  font-weight: 600;
  color: #92400e;
  font-size: 0.875rem;
}

.example-text {
  margin: 0;
  font-size: 0.9rem;
  color: #78350f;
  line-height: 1.5;
}

.modern-hooks-section {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  padding: 32px;
  border-radius: 20px;
  border: 1px solid #10b981;
}

.hooks-title {
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #065f46;
  text-align: center;
}

.hook-example {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #a7f3d0;
}

.hook-name {
  margin: 0 0 16px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #047857;
}

.code-example {
  background: #1e293b;
  padding: 20px;
  border-radius: 8px;
  margin: 16px 0;
  overflow-x: auto;
}

.code-example pre {
  margin: 0;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #e2e8f0;
}

.hook-explanation {
  margin: 16px 0 0 0;
  font-size: 0.95rem;
  color: #047857;
  line-height: 1.5;
}

.hook-explanation code {
  background: #dcfce7;
  color: #065f46;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* ==========================================
   COMPONENTS INTRO STYLES
   ========================================== */
.concept-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.concept-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  height: fit-content;
}

.concept-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.concept-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.concept-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.concept-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.concept-content p {
  font-size: 1rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.concept-example {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.concept-example .example-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 8px;
  display: block;
}

.code-snippet {
  background: #1e293b;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}

.code-snippet pre {
  margin: 0;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #e2e8f0;
}

.props-features,
.jsx-benefits {
  margin-top: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.feature-icon {
  font-size: 1rem;
}

.feature-text {
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
}

.benefit-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefit-list li {
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
  color: #374151;
  font-size: 0.9rem;
}

.benefit-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: bold;
}

.practical-example {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 32px;
  border-radius: 20px;
  border: 1px solid #0ea5e9;
}

.example-title {
  margin: 0 0 24px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0c4a6e;
  text-align: center;
}

.example-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.example-code {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #0ea5e9;
}

.code-header {
  background: #0ea5e9;
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-name {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;
  font-weight: 600;
}

.code-type {
  font-size: 0.75rem;
  opacity: 0.9;
}

.code-content {
  background: #1e293b;
  padding: 20px;
}

.code-content pre {
  margin: 0;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #e2e8f0;
  overflow-x: auto;
}

.example-explanation {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.example-explanation h5 {
  margin: 0 0 16px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.demo-points {
  list-style: none;
  padding: 0;
  margin: 0;
}

.demo-points li {
  padding: 8px 0;
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.5;
}

.demo-points strong {
  color: #1e293b;
}

.demo-points code {
  background: #f1f5f9;
  color: #6366f1;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.8rem;
}

/* ==========================================
   CONCEPTS OVERVIEW STYLES
   ========================================== */
.concepts-showcase {
  margin-bottom: 40px;
}

.concept-category {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.category-title {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.category-description {
  margin: 0 0 20px 0;
  font-size: 1rem;
  color: #64748b;
  line-height: 1.5;
}

.concept-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.concept-item {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.concept-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-name {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
}

.item-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hook-badge {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
}

.syntax-badge {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.structure-badge {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #065f46;
}

.item-description {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.4;
  margin: 0;
}

.learning-path {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  padding: 32px;
  border-radius: 20px;
  border: 1px solid #d1d5db;
}

.path-title {
  margin: 0 0 24px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #374151;
  text-align: center;
}

.path-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.path-step {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.path-step.completed {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.path-step.current {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  transform: scale(1.02);
}

.path-step .step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.path-step.completed .step-number {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.path-step.current .step-number {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.step-content {
  flex: 1;
}

.path-step .step-title {
  margin: 0 0 4px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.path-step .step-description {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.4;
}

.step-status {
  font-size: 1.25rem;
  flex-shrink: 0;
}

/* ==========================================
   AI HELP SECTION
   ========================================== */
.ai-help-section {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  margin-top: 32px;
  animation: slideIn 0.3s ease-out;
}

.ai-help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.ai-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.ai-title h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.ai-title p {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.close-ai-btn {
  background: rgba(239, 68, 68, 0.1);
  border: none;
  color: #ef4444;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.125rem;
  transition: all 0.2s ease;
}

.close-ai-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.05);
}

.suggested-questions {
  margin-bottom: 20px;
}

.suggestions-title {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.question-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-btn {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border: 1px solid #a5b4fc;
  color: #3730a3;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.875rem;
  text-align: left;
  transition: all 0.2s ease;
}

.question-btn:hover {
  background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%);
  border-color: #8b5cf6;
  transform: translateY(-1px);
}

.ai-chat {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.chat-input {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.ai-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.ai-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.ask-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border: none;
  color: white;
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ask-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-1px);
}

.ask-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.ai-response {
  background: #f8fafc;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.response-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.response-icon {
  font-size: 1.125rem;
}

.response-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.response-content {
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

/* ==========================================
   NAVIGATION FOOTER
   ========================================== */
.content-footer {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-top: 1px solid #e2e8f0;
  padding: 20px 24px;
  flex-shrink: 0;
}

.navigation-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
}

.nav-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  min-height: 48px;
}

.prev-btn {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.prev-btn:hover {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #475569;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(203, 213, 225, 0.3);
}

.next-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.next-btn:hover {
  background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.complete-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.complete-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.step-progress {
  display: flex;
  align-items: center;
}

.progress-dots {
  display: flex;
  gap: 8px;
}

.progress-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
  transition: all 0.3s ease;
}

.progress-dot.active {
  background: #6366f1;
  transform: scale(1.2);
}

.progress-dot.completed {
  background: #10b981;
}

/* ==========================================
   RESPONSIVE DESIGN
   ========================================== */
@media (max-width: 1024px) {
  .content-body {
    padding: 24px;
  }

  .example-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .lifecycle-phases {
    gap: 20px;
  }

  .concept-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .content-header {
    padding: 16px 20px;
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .step-info {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .step-indicator {
    align-self: flex-start;
    min-width: 70px;
    padding: 10px 12px;
  }

  .step-number {
    font-size: 1.25rem;
  }

  .step-title {
    font-size: 1.25rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .content-actions {
    align-self: flex-end;
  }

  .content-body {
    padding: 20px;
  }

  .intro-section {
    padding: 24px;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .phase-card {
    padding: 20px;
  }

  .phase-header {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .phase-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .modern-hooks-section,
  .practical-example,
  .learning-path {
    padding: 24px;
  }

  .content-footer {
    padding: 16px 20px;
  }

  .navigation-controls {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .nav-btn {
    width: 100%;
    justify-content: center;
  }

  .step-progress {
    order: -1;
    justify-content: center;
  }

  .ai-help-section {
    padding: 20px;
  }

  .ai-header-content {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .chat-input {
    flex-direction: column;
    gap: 8px;
  }

  .ask-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .content-header {
    padding: 12px 16px;
  }

  .step-title {
    font-size: 1.125rem;
  }

  .step-icon {
    font-size: 1.5rem;
  }

  .content-body {
    padding: 16px;
  }

  .intro-section {
    padding: 20px;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .phase-card {
    padding: 16px;
  }

  .phase-title {
    font-size: 1.25rem;
  }

  .concept-card {
    padding: 20px;
  }

  .concept-title {
    font-size: 1.125rem;
  }

  .modern-hooks-section,
  .practical-example,
  .learning-path {
    padding: 20px;
  }

  .hooks-title,
  .example-title,
  .path-title {
    font-size: 1.25rem;
  }

  .code-example,
  .code-content {
    padding: 16px;
  }

  .code-snippet pre,
  .code-example pre,
  .code-content pre {
    font-size: 0.75rem;
  }

  .content-footer {
    padding: 12px 16px;
  }

  .nav-btn {
    padding: 10px 20px;
    font-size: 0.875rem;
  }

  .ai-help-section {
    padding: 16px;
  }

  .ai-icon {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }

  .path-steps {
    gap: 12px;
  }

  .path-step {
    padding: 16px;
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .path-step .step-number {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
}

/* ==========================================
   ACCESSIBILITY & USER PREFERENCES
   ========================================== */
.nav-btn:focus,
.ai-help-btn:focus,
.question-btn:focus,
.ai-input:focus,
.ask-btn:focus,
.close-ai-btn:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* Skip links for screen readers */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .content-panel,
  .phase-card,
  .concept-card,
  .ai-help-section {
    border-width: 2px;
  }

  .nav-btn,
  .ai-help-btn {
    border: 2px solid currentColor;
  }

  .step-indicator {
    border: 2px solid #fff;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .phase-card:hover,
  .concept-card:hover,
  .nav-btn:hover,
  .ai-help-btn:hover,
  .question-btn:hover,
  .ask-btn:hover {
    transform: none;
  }

  .ai-help-section,
  .progress-dot {
    animation: none;
    transition: none;
  }
}

/* Print styles */
@media print {
  .content-panel {
    height: auto;
    overflow: visible;
  }

  .content-header,
  .content-footer {
    background: white !important;
    box-shadow: none;
  }

  .content-body {
    overflow: visible;
    padding: 0;
  }

  .nav-btn,
  .ai-help-btn,
  .ai-help-section {
    display: none;
  }

  .phase-card,
  .concept-card {
    page-break-inside: avoid;
    box-shadow: none;
    border: 1px solid #000;
  }

  .code-example,
  .code-content {
    background: #f5f5f5 !important;
    color: #000 !important;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .content-panel {
    background: #1e293b;
  }

  .content-header {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    border-bottom-color: #475569;
  }

  .step-title,
  .section-title,
  .phase-title,
  .concept-title {
    color: #e2e8f0;
  }

  .step-description,
  .section-intro,
  .phase-description {
    color: #cbd5e1;
  }

  .intro-section {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    border-color: #3b82f6;
  }

  .phase-card,
  .concept-card {
    background: #334155;
    border-color: #475569;
  }

  .modern-hooks-section {
    background: linear-gradient(135deg, #065f46 0%, #047857 100%);
    border-color: #10b981;
  }

  .practical-example {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    border-color: #3b82f6;
  }

  .learning-path {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    border-color: #6b7280;
  }

  .ai-help-section {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    border-color: #64748b;
  }

  .ai-chat {
    background: #475569;
    border-color: #64748b;
  }

  .ai-input {
    background: #64748b;
    border-color: #94a3b8;
    color: #e2e8f0;
  }

  .ai-response {
    background: #334155;
    border-color: #475569;
    color: #e2e8f0;
  }

  .content-footer {
    background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
    border-top-color: #475569;
  }
}

/* ==========================================
   ANIMATIONS & MISC
   ========================================== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Selection styling */
::selection {
  background-color: rgba(99, 102, 241, 0.2);
  color: inherit;
}

::-moz-selection {
  background-color: rgba(99, 102, 241, 0.2);
  color: inherit;
}

/* Focus visible for better accessibility */
.nav-btn:focus-visible,
.ai-help-btn:focus-visible,
.question-btn:focus-visible,
.ask-btn:focus-visible {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}
/* smth */
</style>