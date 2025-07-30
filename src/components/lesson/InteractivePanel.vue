<template>
  <div class="interactive-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-content">
        <div class="exercise-info">
          <span class="exercise-icon">{{ getExerciseIcon() }}</span>
          <div class="exercise-meta">
            <h3 class="exercise-title">{{ getExerciseTitle() }}</h3>
            <p class="exercise-subtitle">{{ getExerciseSubtitle() }}</p>
          </div>
        </div>
        <div class="progress-info">
          <span class="progress-text">{{ getProgressText() }}</span>
          <div class="points-display" v-if="earnedPoints > 0">
            <span class="points-icon">🎯</span>
            <span class="points-value">{{ earnedPoints }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="panel-content">
      <!-- Component Lifecycle Exercise (from image 1) -->
      <div v-if="exerciseType === 'component-lifecycle'" class="exercise-container lifecycle-exercise">
        <div class="question-section">
          <h4 class="question-title">Explain Component Lifecycle</h4>
          <div class="question-content">
            <p class="question-text">{{ currentExercise.question }}</p>
            <div class="points-info">
              <span class="points-badge">+{{ currentExercise.points || 30 }} pts</span>
            </div>
          </div>
        </div>

        <div class="answer-section">
          <div class="text-input-wrapper">
            <textarea
              v-model="userAnswer"
              @input="updateAnswer"
              placeholder="In your own words, explain what happens when a React component mounts and why understanding the component lifecycle is important for React development."
              rows="6"
              class="answer-textarea"
              :disabled="showFeedback"
            />
            <div class="input-footer">
              <span class="char-counter">{{ getCharacterCount() }}/500</span>
              <span class="word-counter">{{ getWordCount() }} words</span>
            </div>
          </div>
        </div>
      </div>

      <!-- React Statement Completion (from image 2) -->
      <div v-else-if="exerciseType === 'react-statement'" class="exercise-container statement-exercise">
        <div class="question-section">
          <h4 class="question-title">Complete the React Statement</h4>
          <p class="instruction-text">Fill in the blanks to complete the React component definition</p>
          <div class="points-info">
            <span class="points-badge">+{{ currentExercise.points || 15 }} pts</span>
          </div>
        </div>

        <div class="statement-builder">
          <div class="statement-line">
            <span class="statement-text">A React</span>
            <select v-model="answers.blank1" @change="updateAnswer" class="statement-select" :disabled="showFeedback">
              <option value="">Select...</option>
              <option value="component">component</option>
              <option value="function">function</option>
              <option value="class">class</option>
            </select>
            <span class="statement-text">is a JavaScript</span>
            <select v-model="answers.blank2" @change="updateAnswer" class="statement-select" :disabled="showFeedback">
              <option value="">Select...</option>
              <option value="function">function</option>
              <option value="object">object</option>
              <option value="variable">variable</option>
            </select>
            <span class="statement-text">that returns</span>
            <select v-model="answers.blank3" @change="updateAnswer" class="statement-select" :disabled="showFeedback">
              <option value="">Select...</option>
              <option value="JSX">JSX</option>
              <option value="HTML">HTML</option>
              <option value="text">text</option>
            </select>
          </div>

          <div class="dropdown-hints">
            <div class="hint-section">
              <div class="hint-category">
                <span class="hint-label">Available options:</span>
                <div class="hint-tags">
                  <span class="hint-tag">component</span>
                  <span class="hint-tag">function</span>
                  <span class="hint-tag">JSX</span>
                </div>
              </div>
              <div class="syntax-note">
                <span class="syntax-label">💡 Remember:</span>
                <span class="syntax-text">React components are the building blocks of React applications</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Concept Matching (from image 2) -->
      <div v-else-if="exerciseType === 'concept-matching'" class="exercise-container matching-exercise">
        <div class="question-section">
          <h4 class="question-title">Match React Concepts</h4>
          <p class="instruction-text">Match each React concept with its correct description</p>
          <div class="points-info">
            <span class="points-badge">+{{ currentExercise.points || 25 }} pts</span>
          </div>
        </div>

        <div class="matching-container">
          <div class="matching-sections">
            <!-- Left side: Concepts -->
            <div class="concepts-section">
              <h5 class="section-title">Match these:</h5>
              <div class="concept-items">
                <div 
                  v-for="concept in concepts" 
                  :key="concept.id"
                  class="concept-item"
                  :class="{ 
                    'matched': isMatched(concept.id),
                    'selected': selectedConcept === concept.id 
                  }"
                  @click="selectConcept(concept.id)"
                >
                  <div class="concept-content">
                    <span class="concept-name">{{ concept.name }}</span>
                    <div v-if="isMatched(concept.id)" class="match-indicator">✅</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right side: Descriptions -->
            <div class="descriptions-section">
              <h5 class="section-title">With these:</h5>
              <div class="description-items">
                <div 
                  v-for="description in descriptions" 
                  :key="description.id"
                  class="description-item"
                  :class="{ 
                    'matched': isMatched(description.id),
                    'can-match': selectedConcept && !isMatched(description.id)
                  }"
                  @click="matchDescription(description.id)"
                >
                  <div class="description-content">
                    <span class="description-text">{{ description.text }}</span>
                    <div v-if="isMatched(description.id)" class="match-indicator">✅</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Matches Display -->
          <div v-if="matches.length > 0" class="matches-display">
            <h6 class="matches-title">Current Matches:</h6>
            <div class="match-pairs">
              <div v-for="match in matches" :key="match.id" class="match-pair">
                <span class="match-concept">{{ getConceptName(match.conceptId) }}</span>
                <span class="match-arrow">→</span>
                <span class="match-description">{{ getDescriptionText(match.descriptionId) }}</span>
                <button @click="removeMatch(match.id)" class="remove-match-btn" :disabled="showFeedback">
                  <span class="remove-icon">✕</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Component Types Classification (from image 3) -->
      <div v-else-if="exerciseType === 'component-classification'" class="exercise-container classification-exercise">
        <div class="question-section">
          <h4 class="question-title">Component Types Classification</h4>
          <p class="instruction-text">Drag each React concept to its correct category</p>
          <div class="points-info">
            <span class="points-badge">+{{ currentExercise.points || 20 }} pts</span>
          </div>
        </div>

        <div class="classification-container">
          <!-- Available Items -->
          <div class="available-items">
            <h5 class="section-title">Drag items to the correct categories:</h5>
            <div class="draggable-items">
              <div 
                v-for="item in availableItems" 
                :key="item.id"
                class="draggable-item"
                :draggable="!showFeedback"
                @dragstart="startDrag(item)"
                @click="selectForTouch(item)"
              >
                <span class="item-text">{{ item.name }}</span>
                <span class="drag-hint">📱</span>
              </div>
            </div>
          </div>

          <!-- Drop Zones -->
          <div class="drop-zones">
            <div 
              v-for="category in categories" 
              :key="category.id"
              class="drop-zone"
              :class="{ 
                'drag-over': dragOverCategory === category.id,
                'has-items': getCategoryItems(category.id).length > 0
              }"
              @dragover.prevent="dragOver(category.id)"
              @dragleave="dragLeave()"
              @drop="dropItem(category.id)"
              @click="touchDrop(category.id)"
            >
              <div class="category-header">
                <h6 class="category-title">{{ category.name }}</h6>
                <span class="category-count">({{ getCategoryItems(category.id).length }})</span>
              </div>
              
              <div class="category-items">
                <div 
                  v-for="item in getCategoryItems(category.id)" 
                  :key="item.id"
                  class="categorized-item"
                  :class="{ 'correct': showFeedback && isCorrectCategory(item.id, category.id) }"
                >
                  <span class="item-name">{{ item.name }}</span>
                  <button 
                    v-if="!showFeedback" 
                    @click="removeFromCategory(item.id)"
                    class="remove-item-btn"
                  >
                    ✕
                  </button>
                  <span v-if="showFeedback && isCorrectCategory(item.id, category.id)" class="correct-indicator">✅</span>
                  <span v-if="showFeedback && !isCorrectCategory(item.id, category.id)" class="incorrect-indicator">❌</span>
                </div>
              </div>

              <div v-if="getCategoryItems(category.id).length === 0" class="empty-category">
                <span class="empty-text">Drop items here</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Code Completion Exercise -->
      <div v-else-if="exerciseType === 'code-completion'" class="exercise-container code-exercise">
        <div class="question-section">
          <h4 class="question-title">Complete the Component</h4>
          <p class="instruction-text">{{ currentExercise.description }}</p>
          <div class="points-info">
            <span class="points-badge">+{{ currentExercise.points || 35 }} pts</span>
          </div>
        </div>

        <div class="code-editor">
          <div class="code-header">
            <span class="file-name">WelcomeMessage.js</span>
            <button class="run-code-btn" @click="runCode" :disabled="showFeedback">
              <span class="btn-icon">▶️</span>
              <span class="btn-text">Run Code</span>
            </button>
          </div>
          
          <div class="code-content">
            <pre class="code-display"><code>function WelcomeMessage({ name }) {
  return (
    &lt;div&gt;
      <span class="code-comment">{/* Complete this component */}</span>
      <textarea 
        v-model="codeAnswer" 
        @input="updateAnswer"
        placeholder="Write your JSX here..."
        class="code-input"
        :disabled="showFeedback"
      ></textarea>
    &lt;/div&gt;
  );
}</code></pre>
          </div>
        </div>
      </div>

      <!-- Feedback Section -->
      <div v-if="showFeedback" class="feedback-section">
        <div class="feedback-card" :class="feedbackType">
          <div class="feedback-header">
            <span class="feedback-icon">{{ getFeedbackIcon() }}</span>
            <span class="feedback-title">{{ getFeedbackTitle() }}</span>
          </div>
          <div class="feedback-content">
            <p class="feedback-message">{{ feedbackMessage }}</p>
            <div v-if="correctAnswer && !isCorrect" class="correct-answer-display">
              <h6 class="correct-answer-title">💡 Correct Answer:</h6>
              <div class="correct-answer-content">{{ correctAnswer }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="panel-actions">
      <div class="action-buttons">
        <button 
          v-if="!showFeedback && canShowHint" 
          @click="$emit('show-hint')"
          class="action-btn hint-btn"
        >
          <span class="btn-icon">💡</span>
          <span class="btn-text">Hint</span>
        </button>

        <button 
          v-if="!showFeedback" 
          @click="submitAnswer"
          :disabled="!canSubmit"
          class="action-btn submit-btn"
          :class="{ disabled: !canSubmit }"
        >
          <span class="btn-icon">✅</span>
          <span class="btn-text">Check Answer</span>
        </button>

        <button 
          v-if="showFeedback" 
          @click="nextExercise"
          class="action-btn next-btn"
        >
          <span class="btn-text">{{ isLastExercise ? 'Complete' : 'Next' }}</span>
          <span class="btn-icon">{{ isLastExercise ? '🏁' : '→' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'InteractivePanel',
  
  props: {
    currentExercise: {
      type: Object,
      required: true
    },
    exerciseIndex: {
      type: Number,
      default: 0
    },
    totalExercises: {
      type: Number,
      default: 1
    },
    earnedPoints: {
      type: Number,
      default: 0
    }
  },

  emits: ['submit', 'next-exercise', 'show-hint'],

  setup(props, { emit }) {
    // ==========================================
    // REACTIVE STATE
    // ==========================================
    const userAnswer = ref('')
    const answers = ref({})
    const codeAnswer = ref('')
    const showFeedback = ref(false)
    const feedbackMessage = ref('')
    const feedbackType = ref('') // 'correct', 'incorrect', 'partial'
    const isCorrect = ref(false)
    const correctAnswer = ref('')
    
    // Matching exercise state
    const selectedConcept = ref(null)
    const matches = ref([])
    
    // Classification exercise state
    const availableItems = ref([])
    const categorizedItems = ref({})
    const dragOverCategory = ref(null)
    const selectedItem = ref(null) // For touch devices

    // ==========================================
    // COMPUTED PROPERTIES
    // ==========================================
    const exerciseType = computed(() => {
      return props.currentExercise?.type || 'component-lifecycle'
    })

    const concepts = computed(() => {
      return props.currentExercise?.concepts || [
        { id: 'props', name: 'Props' },
        { id: 'state', name: 'State' },
        { id: 'jsx', name: 'JSX' },
        { id: 'hook', name: 'Hook' }
      ]
    })

    const descriptions = computed(() => {
      return props.currentExercise?.descriptions || [
        { id: 'props-desc', text: 'Read-only data passed to components' },
        { id: 'state-desc', text: 'Mutable data within a component' },
        { id: 'jsx-desc', text: 'JavaScript syntax extension' },
        { id: 'hook-desc', text: 'Function that lets you use React features' }
      ]
    })

    const categories = computed(() => {
      return props.currentExercise?.categories || [
        { id: 'hooks', name: 'Hooks' },
        { id: 'syntax', name: 'Syntax' },
        { id: 'structure', name: 'Structure' }
      ]
    })

    const canSubmit = computed(() => {
      switch (exerciseType.value) {
        case 'component-lifecycle':
          return userAnswer.value.trim().length >= 10
        case 'react-statement':
          return answers.value.blank1 && answers.value.blank2 && answers.value.blank3
        case 'concept-matching':
          return matches.value.length >= 2
        case 'component-classification':
          return Object.values(categorizedItems.value).some(items => items.length > 0)
        case 'code-completion':
          return codeAnswer.value.trim().length >= 5
        default:
          return false
      }
    })

    const canShowHint = computed(() => {
      return !showFeedback.value && props.currentExercise?.hint
    })

    const isLastExercise = computed(() => {
      return props.exerciseIndex >= props.totalExercises - 1
    })

    // ==========================================
    // METHODS
    // ==========================================
    const getExerciseIcon = () => {
      const icons = {
        'component-lifecycle': '🔄',
        'react-statement': '📝',
        'concept-matching': '🔗',
        'component-classification': '📚',
        'code-completion': '💻'
      }
      return icons[exerciseType.value] || '📋'
    }

    const getExerciseTitle = () => {
      const titles = {
        'component-lifecycle': 'Component Lifecycle',
        'react-statement': 'React Statement',
        'concept-matching': 'Concept Matching',
        'component-classification': 'Component Classification',
        'code-completion': 'Code Completion'
      }
      return titles[exerciseType.value] || 'Exercise'
    }

    const getExerciseSubtitle = () => {
      const subtitles = {
        'component-lifecycle': 'Explain the React component lifecycle',
        'react-statement': 'Complete the React component definition',
        'concept-matching': 'Match concepts with descriptions',
        'component-classification': 'Classify React concepts',
        'code-completion': 'Complete the React component'
      }
      return subtitles[exerciseType.value] || 'Complete the exercise'
    }

    const getProgressText = () => {
      return `${props.exerciseIndex + 1} / ${props.totalExercises}`
    }

    const getCharacterCount = () => {
      return userAnswer.value.length
    }

    const getWordCount = () => {
      return userAnswer.value.trim().split(/\s+/).filter(word => word.length > 0).length
    }

    const updateAnswer = () => {
      // Emit to parent for progress tracking
      const answerData = {
        type: exerciseType.value,
        userAnswer: userAnswer.value,
        answers: answers.value,
        codeAnswer: codeAnswer.value,
        matches: matches.value,
        categorizedItems: categorizedItems.value
      }
      emit('answer-changed', answerData)
    }

    const submitAnswer = () => {
      // Validate and provide feedback
      const result = validateAnswer()
      
      showFeedback.value = true
      isCorrect.value = result.correct
      feedbackType.value = result.correct ? 'correct' : 'incorrect'
      feedbackMessage.value = result.message
      correctAnswer.value = result.correctAnswer || ''

      emit('submit', {
        exerciseType: exerciseType.value,
        userAnswer: getCurrentAnswer(),
        isCorrect: result.correct,
        feedback: result.message
      })
    }

    const validateAnswer = () => {
      switch (exerciseType.value) {
        case 'component-lifecycle':
          return validateLifecycleAnswer()
        case 'react-statement':
          return validateStatementAnswer()
        case 'concept-matching':
          return validateMatchingAnswer()
        case 'component-classification':
          return validateClassificationAnswer()
        case 'code-completion':
          return validateCodeAnswer()
        default:
          return { correct: false, message: 'Unknown exercise type' }
      }
    }

    const validateLifecycleAnswer = () => {
      const answer = userAnswer.value.toLowerCase()
      const keywords = ['mount', 'component', 'lifecycle', 'react']
      const hasKeywords = keywords.some(keyword => answer.includes(keyword))
      const isLongEnough = answer.length >= 50
      
      if (hasKeywords && isLongEnough) {
        return {
          correct: true,
          message: '✅ Great explanation! You understand the component lifecycle.'
        }
      } else {
        return {
          correct: false,
          message: '❌ Try to explain more about when components mount and the lifecycle phases.',
          correctAnswer: 'When a React component mounts, it goes through several lifecycle phases: initialization, mounting to DOM, and becoming interactive. Understanding this helps manage state, effects, and cleanup properly.'
        }
      }
    }

    const validateStatementAnswer = () => {
      const correct = answers.value.blank1 === 'component' && 
                     answers.value.blank2 === 'function' && 
                     answers.value.blank3 === 'JSX'
      
      if (correct) {
        return {
          correct: true,
          message: '✅ Perfect! A React component is a JavaScript function that returns JSX.'
        }
      } else {
        return {
          correct: false,
          message: '❌ Not quite right. Think about what React components are and what they return.',
          correctAnswer: 'A React component is a JavaScript function that returns JSX.'
        }
      }
    }

    const validateMatchingAnswer = () => {
      const correctMatches = [
        { conceptId: 'props', descriptionId: 'props-desc' },
        { conceptId: 'state', descriptionId: 'state-desc' },
        { conceptId: 'jsx', descriptionId: 'jsx-desc' },
        { conceptId: 'hook', descriptionId: 'hook-desc' }
      ]

      const userMatches = matches.value
      let correctCount = 0

      correctMatches.forEach(correctMatch => {
        const userMatch = userMatches.find(um => 
          um.conceptId === correctMatch.conceptId && 
          um.descriptionId === correctMatch.descriptionId
        )
        if (userMatch) correctCount++
      })

      const accuracy = correctCount / correctMatches.length
      
      if (accuracy >= 0.75) {
        return {
          correct: true,
          message: `✅ Excellent! You got ${correctCount}/${correctMatches.length} matches correct.`
        }
      } else {
        return {
          correct: false,
          message: `❌ You got ${correctCount}/${correctMatches.length} correct. Review the concepts and try again.`
        }
      }
    }

    const validateClassificationAnswer = () => {
      const correctClassifications = props.currentExercise?.correctClassifications || {
        'hooks': ['useState', 'useEffect'],
        'syntax': ['render()', 'JSX'],
        'structure': ['Component', 'props']
      }

      let totalCorrect = 0
      let totalItems = 0

      Object.keys(correctClassifications).forEach(categoryId => {
        const userItems = categorizedItems.value[categoryId] || []
        const correctItems = correctClassifications[categoryId]
        
        correctItems.forEach(correctItem => {
          totalItems++
          if (userItems.find(item => item.name === correctItem)) {
            totalCorrect++
          }
        })
      })

      const accuracy = totalCorrect / totalItems
      
      if (accuracy >= 0.7) {
        return {
          correct: true,
          message: `✅ Great job! You classified ${totalCorrect}/${totalItems} items correctly.`
        }
      } else {
        return {
          correct: false,
          message: `❌ You got ${totalCorrect}/${totalItems} correct. Review the categories and try again.`
        }
      }
    }

    const validateCodeAnswer = () => {
      const code = codeAnswer.value.toLowerCase()
      const hasJSX = code.includes('<') && code.includes('>')
      const hasName = code.includes('name') || code.includes('{name}')
      
      if (hasJSX && hasName) {
        return {
          correct: true,
          message: '✅ Perfect! Your component uses JSX and displays the name prop.'
        }
      } else {
        return {
          correct: false,
          message: '❌ Make sure to use JSX syntax and display the name prop.',
          correctAnswer: '<h1>Hello, {name}!</h1>'
        }
      }
    }

    const getCurrentAnswer = () => {
      switch (exerciseType.value) {
        case 'component-lifecycle':
          return userAnswer.value
        case 'react-statement':
          return answers.value
        case 'concept-matching':
          return matches.value
        case 'component-classification':
          return categorizedItems.value
        case 'code-completion':
          return codeAnswer.value
        default:
          return null
      }
    }

    const getFeedbackIcon = () => {
      return isCorrect.value ? '✅' : '❌'
    }

    const getFeedbackTitle = () => {
      return isCorrect.value ? 'Correct!' : 'Try Again'
    }

    const nextExercise = () => {
      emit('next-exercise')
    }

    // ==========================================
    // MATCHING EXERCISE METHODS
    // ==========================================
    const selectConcept = (conceptId) => {
      if (showFeedback.value) return
      selectedConcept.value = selectedConcept.value === conceptId ? null : conceptId
    }

    const matchDescription = (descriptionId) => {
      if (!selectedConcept.value || showFeedback.value) return
      
      // Check if already matched
      if (isMatched(descriptionId)) return
      
      // Add new match
      matches.value.push({
        id: Date.now(),
        conceptId: selectedConcept.value,
        descriptionId: descriptionId
      })
      
      selectedConcept.value = null
      updateAnswer()
    }

    const isMatched = (id) => {
      return matches.value.some(match => 
        match.conceptId === id || match.descriptionId === id
      )
    }

    const removeMatch = (matchId) => {
      const index = matches.value.findIndex(match => match.id === matchId)
      if (index > -1) {
        matches.value.splice(index, 1)
        updateAnswer()
      }
    }

    const getConceptName = (conceptId) => {
      const concept = concepts.value.find(c => c.id === conceptId)
      return concept?.name || conceptId
    }

    const getDescriptionText = (descriptionId) => {
      const description = descriptions.value.find(d => d.id === descriptionId)
      return description?.text || descriptionId
    }

    // ==========================================
    // CLASSIFICATION EXERCISE METHODS
    // ==========================================
    const startDrag = (item) => {
      // For desktop drag and drop
    }

    const selectForTouch = (item) => {
      // For mobile touch interface
      selectedItem.value = selectedItem.value === item ? null : item
    }

    const dragOver = (categoryId) => {
      dragOverCategory.value = categoryId
    }

    const dragLeave = () => {
      dragOverCategory.value = null
    }

    const dropItem = (categoryId) => {
      // Handle drop logic
      dragOverCategory.value = null
    }

    const touchDrop = (categoryId) => {
      if (!selectedItem.value) return
      
      // Move item to category
      if (!categorizedItems.value[categoryId]) {
        categorizedItems.value[categoryId] = []
      }
      
      categorizedItems.value[categoryId].push(selectedItem.value)
      
      // Remove from available items
      const index = availableItems.value.findIndex(item => item.id === selectedItem.value.id)
      if (index > -1) {
        availableItems.value.splice(index, 1)
      }
      
      selectedItem.value = null
      updateAnswer()
    }

    const getCategoryItems = (categoryId) => {
      return categorizedItems.value[categoryId] || []
    }

    const removeFromCategory = (itemId) => {
      Object.keys(categorizedItems.value).forEach(categoryId => {
        const items = categorizedItems.value[categoryId]
        const index = items.findIndex(item => item.id === itemId)
        if (index > -1) {
          const item = items.splice(index, 1)[0]
          availableItems.value.push(item)
        }
      })
      updateAnswer()
    }

    const isCorrectCategory = (itemId, categoryId) => {
      const correctClassifications = props.currentExercise?.correctClassifications || {}
      const correctItems = correctClassifications[categoryId] || []
      const item = getCategoryItems(categoryId).find(item => item.id === itemId)
      return item && correctItems.includes(item.name)
    }

    const runCode = () => {
      // Simulate code execution
      console.log('Running code:', codeAnswer.value)
      // Could integrate with a code sandbox here
    }

    // ==========================================
    // INITIALIZE DATA
    // ==========================================
    const initializeExercise = () => {
      // Reset state
      userAnswer.value = ''
      answers.value = {}
      codeAnswer.value = ''
      showFeedback.value = false
      selectedConcept.value = null
      matches.value = []
      categorizedItems.value = {}
      selectedItem.value = null

      // Initialize classification items
      if (exerciseType.value === 'component-classification') {
        availableItems.value = props.currentExercise?.items || [
          { id: 'useState', name: 'useState' },
          { id: 'jsx', name: 'JSX' },
          { id: 'useEffect', name: 'useEffect' },
          { id: 'render', name: 'render()' },
          { id: 'component', name: 'Component' },
          { id: 'props', name: 'props' }
        ]
      }
    }

    // ==========================================
    // WATCHERS
    // ==========================================
    watch(() => props.currentExercise, () => {
      initializeExercise()
    }, { immediate: true })

    // ==========================================
    // RETURN
    // ==========================================
    return {
      // State
      userAnswer,
      answers,
      codeAnswer,
      showFeedback,
      feedbackMessage,
      feedbackType,
      isCorrect,
      correctAnswer,
      selectedConcept,
      matches,
      availableItems,
      categorizedItems,
      dragOverCategory,
      selectedItem,

      // Computed
      exerciseType,
      concepts,
      descriptions,
      categories,
      canSubmit,
      canShowHint,
      isLastExercise,

      // Methods
      getExerciseIcon,
      getExerciseTitle,
      getExerciseSubtitle,
      getProgressText,
      getCharacterCount,
      getWordCount,
      updateAnswer,
      submitAnswer,
      getFeedbackIcon,
      getFeedbackTitle,
      nextExercise,

      // Matching methods
      selectConcept,
      matchDescription,
      isMatched,
      removeMatch,
      getConceptName,
      getDescriptionText,

      // Classification methods
      startDrag,
      selectForTouch,
      dragOver,
      dragLeave,
      dropItem,
      touchDrop,
      getCategoryItems,
      removeFromCategory,
      isCorrectCategory,
      runCode
    }
  }
}
</script>

<style scoped>
/* ==========================================
   PANEL LAYOUT
   ========================================== */
.interactive-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.panel-header {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 20px 24px;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.exercise-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.exercise-icon {
  font-size: 2rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.exercise-meta {
  flex: 1;
}

.exercise-title {
  margin: 0 0 4px 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.exercise-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.4;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-text {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.points-display {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

/* ==========================================
   CONTENT AREA
   ========================================== */
.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  scroll-behavior: smooth;
}

.exercise-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 100%;
}

.question-section {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  border-radius: 16px;
  padding: 24px;
  position: relative;
}

.question-title {
  margin: 0 0 12px 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0c4a6e;
}

.question-text {
  font-size: 1.125rem;
  line-height: 1.6;
  color: #1e293b;
  margin: 0 0 16px 0;
}

.instruction-text {
  font-size: 1rem;
  color: #64748b;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.points-info {
  display: flex;
  justify-content: flex-end;
}

.points-badge {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

/* ==========================================
   LIFECYCLE EXERCISE STYLES
   ========================================== */
.answer-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.text-input-wrapper {
  position: relative;
}

.answer-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.answer-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.answer-textarea:disabled {
  background: #f8fafc;
  cursor: not-allowed;
  opacity: 0.7;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 4px;
}

.char-counter,
.word-counter {
  font-size: 0.75rem;
  color: #64748b;
}

/* ==========================================
   STATEMENT EXERCISE STYLES
   ========================================== */
.statement-builder {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.statement-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 20px;
}

.statement-text {
  color: #1e293b;
  font-weight: 500;
}

.statement-select {
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #6366f1;
  background: white;
  min-width: 120px;
  transition: all 0.2s ease;
}

.statement-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.statement-select:disabled {
  background: #f8fafc;
  cursor: not-allowed;
  opacity: 0.7;
}

.dropdown-hints {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

.hint-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint-category {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.hint-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
}

.hint-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.hint-tag {
  background: #e0e7ff;
  color: #6366f1;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.syntax-note {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
}

.syntax-label {
  font-weight: 600;
  color: #f59e0b;
}

.syntax-text {
  color: #64748b;
}

/* ==========================================
   MATCHING EXERCISE STYLES
   ========================================== */
.matching-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.matching-sections {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.concept-items,
.description-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.concept-item,
.description-item {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.concept-item:hover,
.description-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.concept-item.selected {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-color: #3b82f6;
  color: #1e40af;
}

.concept-item.matched,
.description-item.matched {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #10b981;
  color: #065f46;
}

.description-item.can-match {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
  color: #92400e;
}

.concept-content,
.description-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.concept-name {
  font-weight: 600;
  font-size: 1rem;
}

.description-text {
  font-size: 0.9rem;
  line-height: 1.4;
  flex: 1;
}

.match-indicator {
  font-size: 1.25rem;
  margin-left: 8px;
}

.matches-display {
  border-top: 1px solid #e2e8f0;
  padding-top: 20px;
}

.matches-title {
  margin: 0 0 12px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.match-pairs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.match-pair {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f0f9ff;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #0ea5e9;
}

.match-concept,
.match-description {
  font-size: 0.875rem;
  color: #0c4a6e;
}

.match-concept {
  font-weight: 600;
  min-width: 80px;
}

.match-arrow {
  color: #0ea5e9;
  font-weight: bold;
}

.match-description {
  flex: 1;
}

.remove-match-btn {
  background: rgba(239, 68, 68, 0.1);
  border: none;
  color: #ef4444;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.remove-match-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.remove-match-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==========================================
   CLASSIFICATION EXERCISE STYLES
   ========================================== */
.classification-container {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.available-items {
  margin-bottom: 24px;
}

.draggable-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.draggable-item {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: grab;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.draggable-item:hover {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-color: #6366f1;
  transform: translateY(-1px);
}

.draggable-item:active {
  cursor: grabbing;
}

.item-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.drag-hint {
  font-size: 0.75rem;
  opacity: 0.7;
}

.drop-zones {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 16px;
  min-height: 120px;
  transition: all 0.2s ease;
  background: #f8fafc;
}

.drop-zone.drag-over {
  border-color: #6366f1;
  background: #f0f9ff;
}

.drop-zone.has-items {
  border-style: solid;
  border-color: #10b981;
  background: #f0fdf4;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.category-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.category-count {
  font-size: 0.75rem;
  color: #64748b;
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.category-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.categorized-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}

.categorized-item.correct {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #10b981;
}

.item-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  flex: 1;
}

.remove-item-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.remove-item-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.correct-indicator,
.incorrect-indicator {
  font-size: 1rem;
}

.empty-category {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-style: italic;
}

/* ==========================================
   CODE EXERCISE STYLES
   ========================================== */
.code-editor {
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.code-header {
  background: #334155;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #475569;
}

.file-name {
  color: #e2e8f0;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: 'Monaco', 'Consolas', monospace;
}

.run-code-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.run-code-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
}

.run-code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.code-content {
  padding: 20px;
}

.code-display {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #e2e8f0;
  margin: 0;
  white-space: pre-wrap;
}

.code-comment {
  color: #64748b;
  font-style: italic;
}

.code-input {
  background: #374151;
  border: 1px solid #4b5563;
  border-radius: 4px;
  color: #e2e8f0;
  padding: 8px 12px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.875rem;
  width: 100%;
  min-height: 60px;
  resize: vertical;
  margin: 8px 0;
}

.code-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.code-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* ==========================================
   FEEDBACK SECTION
   ========================================== */
.feedback-section {
  margin-top: 24px;
}

.feedback-card {
  border-radius: 12px;
  padding: 20px;
  border: 2px solid;
  animation: feedbackSlideIn 0.3s ease-out;
}

@keyframes feedbackSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback-card.correct {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  border-color: #10b981;
}

.feedback-card.incorrect {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #ef4444;
}

.feedback-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.feedback-icon {
  font-size: 1.25rem;
}

.feedback-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.feedback-message {
  font-size: 1rem;
  line-height: 1.5;
  color: #374151;
  margin: 0;
}

.correct-answer-display {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.correct-answer-title {
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.correct-answer-content {
  background: rgba(255, 255, 255, 0.7);
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #374151;
  font-family: 'Monaco', 'Consolas', monospace;
  white-space: pre-wrap;
}

/* ==========================================
   ACTION BUTTONS
   ========================================== */
.panel-actions {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-top: 1px solid #e2e8f0;
  padding: 16px 24px;
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  font-size: 0.9rem;
}

.hint-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.hint-btn:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
}

.submit-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.submit-btn:hover:not(.disabled) {
  background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.submit-btn.disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.next-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.next-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.btn-icon {
  font-size: 1rem;
}

.btn-text {
  font-size: 0.9rem;
}

/* ==========================================
   RESPONSIVE DESIGN
   ========================================== */
@media (max-width: 1024px) {
  .panel-content {
    padding: 20px;
  }

  .matching-sections {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .drop-zones {
    grid-template-columns: 1fr;
  }

  .statement-line {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .statement-select {
    min-width: 100px;
  }
}

@media (max-width: 768px) {
  .panel-header {
    padding: 16px 20px;
  }

  .header-content {
    flex-direction: column;
    gap: 12px;
  }

  .progress-info {
    align-self: flex-start;
  }

  .panel-content {
    padding: 16px;
  }

  .exercise-container {
    gap: 20px;
  }

  .question-section {
    padding: 20px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .draggable-items {
    justify-content: center;
  }

  .hint-category {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .panel-header {
    padding: 12px 16px;
  }

  .exercise-icon {
    font-size: 1.5rem;
  }

  .exercise-title {
    font-size: 1.1rem;
  }

  .panel-content {
    padding: 12px;
  }

  .question-section {
    padding: 16px;
  }

  .answer-textarea {
    min-height: 100px;
    padding: 12px;
  }

  .panel-actions {
    padding: 12px 16px;
  }

  .action-btn {
    padding: 10px 20px;
    font-size: 0.85rem;
  }

  .code-content {
    padding: 16px;
  }

  .code-display {
    font-size: 0.8rem;
  }
}

/* ==========================================
   ACCESSIBILITY
   ========================================== */
@media (prefers-reduced-motion: reduce) {
  .action-btn:hover,
  .draggable-item:hover,
  .concept-item:hover,
  .description-item:hover {
    transform: none;
  }

  .feedback-card {
    animation: none;
  }
}

@media (prefers-contrast: high) {
  .exercise-container,
  .question-section,
  .answer-section {
    border-width: 3px;
  }

  .action-btn {
    border: 2px solid currentColor;
  }
}

/* ==========================================
   DARK MODE
   ========================================== */
@media (prefers-color-scheme: dark) {
  .interactive-panel {
    background: #1e293b;
  }

  .panel-header {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    border-bottom-color: #475569;
  }

  .exercise-title {
    color: #e2e8f0;
  }

  .exercise-subtitle {
    color: #cbd5e1;
  }

  .question-section {
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
    border-color: #3b82f6;
  }

  .question-title {
    color: #bfdbfe;
  }

  .question-text,
  .instruction-text {
    color: #e2e8f0;
  }

  .answer-section,
  .statement-builder,
  .matching-container,
  .classification-container {
    background: #334155;
    border-color: #475569;
  }

  .answer-textarea,
  .statement-select {
    background: #475569;
    border-color: #64748b;
    color: #e2e8f0;
  }

  .answer-textarea:focus,
  .statement-select:focus {
    border-color: #6366f1;
  }

  .concept-item,
  .description-item,
  .draggable-item {
    background: #475569;
    border-color: #64748b;
    color: #e2e8f0;
  }

  .concept-item:hover,
  .description-item:hover,
  .draggable-item:hover {
    background: #64748b;
    border-color: #94a3b8;
  }

  .feedback-card.correct {
    background: linear-gradient(135deg, #065f46 0%, #047857 100%);
    border-color: #10b981;
    color: #d1fae5;
  }

  .feedback-card.incorrect {
    background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%);
    border-color: #ef4444;
    color: #fecaca;
  }

  .panel-actions {
    background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
    border-top-color: #475569;
  }
}

/* ==========================================
   PRINT STYLES
   ========================================== */
@media print {
  .interactive-panel {
    height: auto;
    overflow: visible;
  }

  .panel-actions {
    display: none;
  }

  .feedback-section {
    page-break-inside: avoid;
  }

  .exercise-container {
    page-break-inside: avoid;
  }
}
</style>