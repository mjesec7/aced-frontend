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
      <div v-if="contentType === 'component-lifecycle'" class="content-section lifecycle-content">
        <div class="intro-section">
          <h3 class="section-title">🔄 React Component Lifecycle</h3>
          <p class="section-intro">
            Understanding the React component lifecycle is crucial for building robust applications.
            Let's explore what happens when components mount, update, and unmount.
          </p>
        </div>

        <div class="lifecycle-phases">
          <div class="phase-card mounting">
            <div class="phase-header">
              <div class="phase-icon">🚀</div>
              <h4 class="phase-title">Mounting</h4>
            </div>
            <div class="phase-content">
              <p class="phase-description">
                When a component is being created and inserted into the DOM for the first time.
              </p>
              <ul class="phase-steps">
                <li><code>constructor()</code> - Component initialization</li>
                <li><code>render()</code> - Create virtual DOM</li>
                <li><code>componentDidMount()</code> - Component is now in the DOM</li>
              </ul>
              <div class="phase-example">
                <div class="example-header">
                  <span class="example-label">💡 Use Case:</span>
                </div>
                <p class="example-text">
                  Perfect for fetching data, setting up subscriptions, or initializing timers.
                </p>
              </div>
            </div>
          </div>

          <div class="phase-card updating">
            <div class="phase-header">
              <div class="phase-icon">🔄</div>
              <h4 class="phase-title">Updating</h4>
            </div>
            <div class="phase-content">
              <p class="phase-description">
                When props or state change, causing the component to re-render.
              </p>
              <ul class="phase-steps">
                <li><code>render()</code> - Create new virtual DOM</li>
                <li><code>getSnapshotBeforeUpdate()</code> - Capture info before update</li>
                <li><code>componentDidUpdate()</code> - Component has been updated</li>
              </ul>
              <div class="phase-example">
                <div class="example-header">
                  <span class="example-label">💡 Use Case:</span>
                </div>
                <p class="example-text">
                  Ideal for responding to prop changes, updating derived state, or making network requests.
                </p>
              </div>
            </div>
          </div>

          <div class="phase-card unmounting">
            <div class="phase-header">
              <div class="phase-icon">🗑️</div>
              <h4 class="phase-title">Unmounting</h4>
            </div>
            <div class="phase-content">
              <p class="phase-description">
                When a component is being removed from the DOM.
              </p>
              <ul class="phase-steps">
                <li><code>componentWillUnmount()</code> - Cleanup before removal</li>
              </ul>
              <div class="phase-example">
                <div class="example-header">
                  <span class="example-label">💡 Use Case:</span>
                </div>
                <p class="example-text">
                  Essential for cleaning up subscriptions, canceling network requests, or clearing timers.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="modern-hooks-section">
          <h4 class="hooks-title">🎣 Modern React Hooks Equivalent</h4>
          <div class="hooks-comparison">
            <div class="hook-example">
              <h5 class="hook-name">useEffect Hook</h5>
              <div class="code-example">
                <pre><code>useEffect(() => {
  // Mounting & Updating logic
  fetchData();
  
  return () => {
    // Unmounting cleanup
    cleanup();
  };
}, [dependencies]);</code></pre>
              </div>
              <p class="hook-explanation">
                The <code>useEffect</code> hook combines all lifecycle phases into one powerful hook.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="contentType === 'components-intro'" class="content-section components-content">
        <div class="intro-section">
          <h3 class="section-title">⚛️ Introduction to React Components</h3>
          <p class="section-intro">
            Components are the building blocks of React applications. Think of them as custom HTML elements
            that encapsulate their own logic and styling.
          </p>
        </div>

        <div class="concept-grid">
          <div class="concept-card">
            <div class="concept-header">
              <div class="concept-icon">🧩</div>
              <h4 class="concept-title">What is a Component?</h4>
            </div>
            <div class="concept-content">
              <p>A React component is a JavaScript function that returns JSX (JavaScript XML) - a syntax extension that looks like HTML but is actually JavaScript.</p>
              <div class="concept-example">
                <div class="example-label">Simple Example:</div>
                <div class="code-snippet">
                  <pre><code>function Welcome(props) {
  return &lt;h1&gt;Hello, {props.name}!&lt;/h1&gt;;
}</code></pre>
                </div>
              </div>
            </div>
          </div>

          <div class="concept-card">
            <div class="concept-header">
              <div class="concept-icon">📦</div>
              <h4 class="concept-title">Props</h4>
            </div>
            <div class="concept-content">
              <p>Props (properties) are read-only data passed to components from their parent. They allow components to be dynamic and reusable.</p>
              <div class="props-features">
                <div class="feature-item">
                  <span class="feature-icon">🔒</span>
                  <span class="feature-text">Read-only</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">⬇️</span>
                  <span class="feature-text">Passed down from parent</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🔄</span>
                  <span class="feature-text">Make components reusable</span>
                </div>
              </div>
            </div>
          </div>

          <div class="concept-card">
            <div class="concept-header">
              <div class="concept-icon">🏗️</div>
              <h4 class="concept-title">JSX</h4>
            </div>
            <div class="concept-content">
              <p>JSX is a syntax extension for JavaScript that allows you to write HTML-like code within JavaScript. It makes React components more readable and expressive.</p>
              <div class="jsx-benefits">
                <ul class="benefit-list">
                  <li>Familiar HTML-like syntax</li>
                  <li>JavaScript expressions with {}</li>
                  <li>Component composition</li>
                  <li>Type safety with TypeScript</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="practical-example">
          <h4 class="example-title">🛠️ Putting It All Together</h4>
          <div class="example-container">
            <div class="example-code">
              <div class="code-header">
                <span class="file-name">UserCard.js</span>
                <span class="code-type">React Component</span>
              </div>
              <div class="code-content">
                <pre><code>function UserCard({ name, email, avatar }) {
  return (
    &lt;div className="user-card"&gt;
      &lt;img src={avatar} alt={name} /&gt;
      &lt;h3&gt;{name}&lt;/h3&gt;
      &lt;p&gt;{email}&lt;/p&gt;
    &lt;/div&gt;
  );
}

// Usage
&lt;UserCard 
  name="Sarah Chen" 
  email="sarah@example.com"
  avatar="/sarah.jpg" 
/&gt;</code></pre>
              </div>
            </div>
            <div class="example-explanation">
              <h5>Key Concepts Demonstrated:</h5>
              <ul class="demo-points">
                <li><strong>Component:</strong> <code>UserCard</code> is a reusable function component</li>
                <li><strong>Props:</strong> <code>name</code>, <code>email</code>, and <code>avatar</code> are passed as props</li>
                <li><strong>JSX:</strong> HTML-like syntax with JavaScript expressions in curly braces</li>
                <li><strong>Reusability:</strong> Same component, different data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="contentType === 'concepts-overview'" class="content-section concepts-content">
        <div class="intro-section">
          <h3 class="section-title">📚 React Concepts Overview</h3>
          <p class="section-intro">
            Let's explore the fundamental concepts that make React powerful and developer-friendly.
          </p>
        </div>

        <div class="concepts-showcase">
          <div class="concept-category">
            <h4 class="category-title">🎣 Hooks</h4>
            <p class="category-description">
              Functions that let you use React features in functional components.
            </p>
            <div class="concept-items">
              <div class="concept-item">
                <div class="item-header">
                  <span class="item-name">useState</span>
                  <span class="item-badge hook-badge">Hook</span>
                </div>
                <p class="item-description">Manages component state in functional components</p>
              </div>
              <div class="concept-item">
                <div class="item-header">
                  <span class="item-name">useEffect</span>
                  <span class="item-badge hook-badge">Hook</span>
                </div>
                <p class="item-description">Handles side effects and lifecycle events</p>
              </div>
            </div>
          </div>

          <div class="concept-category">
            <h4 class="category-title">🔤 Syntax</h4>
            <p class="category-description">
              Special syntax and patterns used in React development.
            </p>
            <div class="concept-items">
              <div class="concept-item">
                <div class="item-header">
                  <span class="item-name">JSX</span>
                  <span class="item-badge syntax-badge">Syntax</span>
                </div>
                <p class="item-description">JavaScript syntax extension for writing HTML-like code</p>
              </div>
              <div class="concept-item">
                <div class="item-header">
                  <span class="item-name">render()</span>
                  <span class="item-badge syntax-badge">Syntax</span>
                </div>
                <p class="item-description">Method that returns the component's JSX</p>
              </div>
            </div>
          </div>

          <div class="concept-category">
            <h4 class="category-title">🏗️ Structure</h4>
            <p class="category-description">
              Core building blocks and architectural concepts.
            </p>
            <div class="concept-items">
              <div class="concept-item">
                <div class="item-header">
                  <span class="item-name">Component</span>
                  <span class="item-badge structure-badge">Structure</span>
                </div>
                <p class="item-description">Reusable pieces of UI with their own logic</p>
              </div>
              <div class="concept-item">
                <div class="item-header">
                  <span class="item-name">Props</span>
                  <span class="item-badge structure-badge">Structure</span>
                </div>
                <p class="item-description">Read-only data passed to components</p>
              </div>
            </div>
          </div>
        </div>

        <div class="learning-path">
          <h4 class="path-title">🛤️ Recommended Learning Path</h4>
          <div class="path-steps">
            <div class="path-step completed">
              <div class="step-number">1</div>
              <div class="step-content">
                <h5 class="step-title">Components & JSX</h5>
                <p class="step-description">Learn to create and use React components</p>
              </div>
              <div class="step-status">✅</div>
            </div>
            <div class="path-step current">
              <div class="step-number">2</div>
              <div class="step-content">
                <h5 class="step-title">Props & State</h5>
                <p class="step-description">Understand data flow and component state</p>
              </div>
              <div class="step-status">📍</div>
            </div>
            <div class="path-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h5 class="step-title">Hooks & Effects</h5>
                <p class="step-description">Master modern React patterns</p>
              </div>
              <div class="step-status">⏳</div>
            </div>
          </div>
        </div>
      </div>

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
                placeholder="Ask about React components, lifecycle, or any concept..."
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
const contentType = computed(() => {
  if (!props.currentStep) return 'default'

  // Determine content type based on step data
  if (props.currentStep.type === 'explanation' && props.currentStep.topic === 'lifecycle') {
    return 'component-lifecycle'
  }
  if (props.currentStep.type === 'explanation' && props.currentStep.topic === 'components') {
    return 'components-intro'
  }
  if (props.currentStep.type === 'explanation' && props.currentStep.topic === 'concepts') {
    return 'concepts-overview'
  }

  return props.currentStep.type || 'default'
})

const canShowAIHelp = computed(() => {
  return ['component-lifecycle', 'components-intro', 'concepts-overview'].includes(contentType.value)
})

const suggestedQuestions = computed(() => {
  const questions = {
    'component-lifecycle': [
      'When should I use componentDidMount vs useEffect?',
      'What happens if I forget to clean up in componentWillUnmount?',
      'How do I prevent infinite re-renders?'
    ],
    'components-intro': [
      'What\'s the difference between props and state?',
      'When should I create a new component?',
      'How do I pass data between components?'
    ],
    'concepts-overview': [
      'What are React Hooks and why use them?',
      'How is JSX different from HTML?',
      'What makes React components reusable?'
    ]
  }

  return questions[contentType.value] || []
})

// ==========================================
// METHODS
// ==========================================
const getStepIcon = () => {
  const icons = {
    'component-lifecycle': '🔄',
    'components-intro': '⚛️',
    'concepts-overview': '📚',
    'explanation': '📖',
    'reading': '📄',
    'vocabulary': '📝'
  }
  return icons[contentType.value] || '📖'
}

const getStepTitle = () => {
  const titles = {
    'component-lifecycle': 'Component Lifecycle',
    'components-intro': 'React Components',
    'concepts-overview': 'React Concepts',
    'explanation': 'Explanation',
    'reading': 'Reading Material',
    'vocabulary': 'Vocabulary'
  }
  return titles[contentType.value] || props.currentStep?.title || 'Content'
}

const getStepDescription = () => {
  const descriptions = {
    'component-lifecycle': 'Learn about mounting, updating, and unmounting phases',
    'components-intro': 'Understanding the building blocks of React applications',
    'concepts-overview': 'Essential React concepts for modern development'
  }
  return descriptions[contentType.value] || props.currentStep?.description || 'Study the content carefully'
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
    aiResponse.value = getMockAIResponse(question, contentType.value)
  } catch (error) {
    aiResponse.value = 'Sorry, I encountered an error. Please try again.'
  } finally {
    isLoadingAI.value = false
  }
}

const getMockAIResponse = (question, type) => {
  const responses = {
    'component-lifecycle': {
      'componentDidMount': 'componentDidMount runs after the component is mounted to the DOM, while useEffect with an empty dependency array runs after every render. For one-time setup, use useEffect(() => {}, []).',
      'cleanup': 'Forgetting cleanup can lead to memory leaks, especially with event listeners, timers, or subscriptions. Always return a cleanup function from useEffect.',
      'infinite': 'Infinite re-renders usually happen when you update state without proper dependencies in useEffect, or when you mutate objects/arrays directly.'
    },
    'components-intro': {
      'props vs state': 'Props are read-only data passed from parent components, while state is mutable data managed within the component itself.',
      'new component': 'Create a new component when you have reusable UI logic, when a component becomes too complex, or when you need to separate concerns.',
      'pass data': 'Data flows down through props and up through callback functions. For complex state, consider using Context API or state management libraries.'
    }
  }

  const typeResponses = responses[type] || {}
  const matchedKey = Object.keys(typeResponses).find(key =>
    question.toLowerCase().includes(key.toLowerCase())
  )

  return matchedKey ? typeResponses[matchedKey] :
    'That\'s a great question! This concept relates to how React manages component behavior and data flow. Would you like me to explain a specific aspect in more detail?'
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
})
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