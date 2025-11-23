<template>
  <div class="interactive-panel">
    <!-- GAME MODE: Display game instead of exercise -->
    <div v-if="isGameMode" class="game-panel-container">
      <GameContainer
        :game-data="gameData"
        :game-type="gameType"
        :user-id="userId"
        :lesson-id="lessonId"
        :step-index="stepIndex"
        @game-complete="handleGameComplete"
        @game-exit="handleGameExit"
      />
    </div>

    <!-- EXERCISE MODE: Display regular exercises -->
    <div v-else-if="currentExercise" class="panel-container">

      <header class="panel-header">
        <div class="header-content">
          <div class="header-info">
            <span class="exercise-step-icon" :style="{ backgroundColor: exerciseMeta.color }">
              {{ exerciseIndex + 1 }}
            </span>
            <div class="exercise-details">
              <h2 class="exercise-title">{{ currentExercise.title }}</h2>
              <p class="exercise-description">{{ currentExercise.description }}</p>
            </div>
          </div>
          <div class="exercise-counter">
            Exercise {{ exerciseIndex + 1 }} of {{ totalExercises }}
          </div>
        </div>
      </header>

      <div class="panel-content-scroll">
        <div class="exercise-wrapper">
          
          <!-- DEBUG: Show exerciseType -->
          <div style="background: yellow; padding: 10px; margin-bottom: 10px;">
            <strong>DEBUG:</strong><br>
            exerciseType: {{ exerciseType }}<br>
            currentExercise.type: {{ currentExercise?.type }}<br>
            currentExercise.data?.type: {{ currentExercise?.data?.type }}<br>
            Has pairs: {{ !!currentExercise?.pairs }}<br>
            Has data.pairs: {{ !!currentExercise?.data?.pairs }}
          </div>
          
          <div v-if="['reading', 'short-answer', 'sentence-transformation', 'error-correction'].includes(exerciseType)" class="exercise-type-container">
            
            <article v-if="currentExercise.content" class="exercise-card reading-text-card">
              <h3 class="card-subtitle">Reading Text</h3>
              <div class="reading-text-content"><p>{{ currentExercise.content }}</p></div>
            </article>

            <template v-if="currentExercise.questions && currentExercise.questions.length > 0">
              <article v-for="(question, qIndex) in currentExercise.questions" :key="question.id || qIndex" class="exercise-card">
                <p class="question-text">{{ question.question }}</p>
                <textarea 
                  :value="userAnswer[qIndex] || ''" 
                  @input="updateMultiAnswer(qIndex, $event.target.value)" 
                  :placeholder="question.placeholder || 'Enter your answer...'" 
                  :disabled="showCorrectAnswer" 
                  class="answer-textarea"
                ></textarea>
                <div v-if="showCorrectAnswer" v-html="renderFeedback(userAnswer[qIndex], question.correctAnswer)" class="feedback-container"></div>
              </article>
            </template>

            <article v-else class="exercise-card">
                <p class="question-text" v-html="currentExercise.question"></p>
                <p v-if="currentExercise.instruction" class="instruction-text">{{ currentExercise.instruction }}</p>
                <textarea 
                  v-model="userAnswer" 
                  placeholder="Enter your answer..." 
                  :disabled="showCorrectAnswer" 
                  class="answer-textarea"
                ></textarea>
                <div v-if="showCorrectAnswer" v-html="renderFeedback(userAnswer, currentExercise.correctAnswer)" class="feedback-container"></div>
            </article>
          </div>

          <div v-else-if="['multiple-choice', 'abc', 'dialogue-completion'].includes(exerciseType)" class="exercise-type-container">
            <article class="exercise-card">
              <p class="question-text">{{ currentExercise.question }}</p>
              <div class="options-list">
                <button 
                  v-for="(option, oIndex) in currentExercise.options" 
                  :key="oIndex" 
                  @click="!showCorrectAnswer && selectOption(option, oIndex)" 
                  :disabled="showCorrectAnswer"
                  class="option-button"
                  :class="getOptionClasses(option, oIndex)"
                >
                  {{ typeof option === 'string' ? option : option.text }}
                </button>
              </div>
            </article>
          </div>

          <div v-else-if="exerciseType === 'fill-blanks'" class="exercise-type-container">
            <article v-for="(question, qIndex) in (normalizedExercise?.questions || [normalizedExercise])" :key="question.id || qIndex" class="exercise-card">
              <div class="question-text fill-blank-sentence">
                <template v-for="(part, pIndex) in question.sentenceParts" :key="pIndex">
                  <span>{{ part.text }}</span>
                  <input
                    v-if="part.blank"
                    type="text"
                    :value="userAnswer[part.blank.id] || ''"
                    @input="updateFillBlankAnswer(part.blank.id, $event.target.value)"
                    :placeholder="part.blank.placeholder"
                    :disabled="showCorrectAnswer"
                    class="fill-blank-input"
                    :class="getFillBlankInputClasses(part.blank.id, part.blank.correctAnswer)"
                  />
                </template>
              </div>
            </article>
          </div>
          
          <div v-else-if="exerciseType === 'matching'" class="exercise-type-container">
            <article v-for="(pair, index) in currentExercise.pairs" :key="pair.id || index" class="exercise-card matching-pair-card">
              <p class="matching-text-left">{{ pair.left }}</p>
              <div class="matching-select-wrapper">
                <select 
                  :value="localMatchingAnswers[(pair.id || index)] || ''"
                  @change="localMatchingAnswers[(pair.id || index)] = $event.target.value"
                  :disabled="showCorrectAnswer"
                  class="matching-select"
                  :class="getMatchingSelectClasses((pair.id || index), pair.correctMatch)"
                >
                  <option value="" disabled>Select the ending...</option>
                  <option 
                    v-for="option in shuffledRightOptions" 
                    :key="option" 
                    :value="option" 
                    :disabled="isOptionUsed((pair.id || index), option)"
                  >
                    {{ option }}
                  </option>
                </select>
              </div>
            </article>
          </div>

          <div v-else-if="exerciseType === 'structure'" class="exercise-type-container">
             <article v-for="question in normalizedExercise?.questions" :key="question.id" class="exercise-card">
               <p class="question-text">{{ question.instruction }}</p>
               <div
                 class="word-bank"
                 @dragover.prevent @drop="onDrop(question.id, $event)"
               >
                 <div
                   v-for="(word, wIndex) in (userAnswer[question.id] || [])"
                   :key="`${question.id}-${word}-${wIndex}`"
                   draggable="true"
                   @dragstart="onDragStart(question.id, wIndex, $event)"
                   class="word-button"
                   :class="getStructureWordClasses(question.id, wIndex)"
                 >
                   <span class="drag-handle">⠿</span>
                   {{ word }}
                 </div>
               </div>
               <div v-if="showCorrectAnswer" class="feedback-container">
                 <p class="correct-answer-text">Correct order: "{{ question.correctOrder.join(' ') }}"</p>
               </div>
             </article>
          </div>

          <!-- GEOMETRY EXPLORER -->
          <div v-else-if="exerciseType === 'geometry'" class="exercise-type-container geometry-container">
            <article class="exercise-card geometry-card">
              <div class="geometry-header">
                <h3 class="card-subtitle">{{ geometryData.title || currentExercise.title || 'Geometry Explorer' }}</h3>
                <p class="instruction-text">{{ geometryData.instruction || currentExercise.instruction || 'Interact with the shape below.' }}</p>
              </div>

              <div class="canvas-wrapper" ref="canvasWrapper">
                <!-- SVG Layer for Shapes -->
                <svg class="geometry-svg" width="300" height="300" viewBox="0 0 300 300">
                  <defs>
                    <!-- Filter for "Hand-Drawn" Look -->
                    <filter id="sketchy">
                      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
                      <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                    </filter>
                  </defs>

                  <!-- Circle -->
                  <circle 
                    v-if="geometryData.shape === 'circle'" 
                    cx="150" cy="150" r="100" 
                    :fill="shapeFillColor" 
                    :stroke="shapeStrokeColor" 
                    stroke-width="3"
                    filter="url(#sketchy)"
                  />

                  <!-- Triangle -->
                  <polygon 
                    v-if="geometryData.shape === 'triangle'" 
                    points="150,50 250,250 50,250"
                    :fill="shapeFillColor" 
                    :stroke="shapeStrokeColor" 
                    stroke-width="3"
                    filter="url(#sketchy)"
                  />

                  <!-- Square -->
                  <rect 
                    v-if="geometryData.shape === 'square'" 
                    x="50" y="50" width="200" height="200"
                    :fill="shapeFillColor" 
                    :stroke="shapeStrokeColor" 
                    stroke-width="3"
                    filter="url(#sketchy)"
                  />

                  <!-- Center Point (for Circle/Diameter) -->
                  <circle 
                    v-if="geometryData.shape === 'circle'" 
                    cx="150" cy="150" r="4" 
                    fill="#1e293b" 
                    filter="url(#sketchy)"
                  />
                  
                  <!-- Drawn Lines (Feedback) -->
                  <line 
                    v-for="(line, idx) in drawnLines" 
                    :key="idx"
                    :x1="line.start.x" :y1="line.start.y"
                    :x2="line.end.x" :y2="line.end.y"
                    :stroke="line.isCorrect ? '#10b981' : '#ef4444'"
                    stroke-width="4"
                    stroke-linecap="round"
                    filter="url(#sketchy)"
                  />
                </svg>

                <!-- Canvas Layer for Interaction -->
                <canvas
                  ref="canvasRef"
                  width="300"
                  height="300"
                  class="geometry-canvas"
                  :class="{ 'is-drawing': isDrawing }"
                  @mousedown="startDrawing"
                  @mousemove="draw"
                  @mouseup="stopDrawing"
                  @mouseleave="stopDrawing"
                  @touchstart.prevent="startDrawing"
                  @touchmove.prevent="draw"
                  @touchend.prevent="stopDrawing"
                ></canvas>

                <!-- Feedback Overlay -->
                <transition name="fade">
                  <div v-if="geometryFeedback" class="geometry-feedback" :class="geometryFeedback.type">
                    {{ geometryFeedback.message }}
                  </div>
                </transition>
              </div>

              <!-- Identify Mode Input -->
              <div v-if="geometryData.mode === 'identify'" class="identify-input">
                <input 
                  v-model="userAnswer" 
                  placeholder="What shape is this?" 
                  class="answer-input"
                  :disabled="showCorrectAnswer"
                />
              </div>
            </article>
          </div>

          <!-- Fallback for unknown exercise types (e.g., timed-practice) -->
          <div v-else class="exercise-type-container">
            <article class="exercise-card">
              <h3 class="card-subtitle">{{ currentExercise.title || 'Challenge' }}</h3>
              <div class="instruction-text" v-if="currentExercise.instructions || currentExercise.instruction">
                <p>{{ currentExercise.instructions || currentExercise.instruction || '' }}</p>
              </div>
              <p v-else class="question-text">{{ currentExercise.question || 'Complete the activity.' }}</p>

              <textarea
                v-model="userAnswer"
                placeholder="Type your answer here..."
                :disabled="showCorrectAnswer"
                class="answer-textarea"
              ></textarea>
            </article>
          </div>

        </div>
      </div>

      <footer class="panel-actions">
        <button v-if="!showCorrectAnswer" @click="submit" class="action-button submit-button" :disabled="!canSubmit" :style="{backgroundColor: exerciseMeta.color}">
          Check Answers
        </button>
        <button v-else @click="resetAndNext" class="action-button next-button" :style="{borderColor: exerciseMeta.color, color: exerciseMeta.color}">
          {{ isLastExercise ? 'Complete' : 'Next Exercise' }}
        </button>
      </footer>
    </div>
    
    <div v-else class="panel-loading">
      <p>Loading...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useExercises } from '../../composables/useExercises.js';
import GameContainer from '../games/base/GameContainer.vue';
import { useGeometry } from '../../composables/useGeometry.js';

const props = defineProps({
  currentExercise: Object,
  exerciseIndex: Number,
  totalExercises: Number,
  userId: String,
  lessonId: String,
  stepIndex: Number,
});

const emit = defineEmits(['submit', 'next-exercise']);

const { 
    userAnswer, 
    confirmation, 
    answerWasCorrect, 
    showCorrectAnswer, 
    submitAnswer: submitLogic, 
    resetExerciseState 
} = useExercises();

// Geometry Composable
const {
  canvasRef,
  isDrawing,
  startPoint,
  currentPoint,
  drawnLines,
  measuredAngle,
  feedback: geometryFeedback,
  config: geometryConfig,
  startDrawing,
  draw,
  stopDrawing,
  updateAngle,
  resetGeometry
} = useGeometry();

// Visuals
const shapeFillColor = ref('#e0f2fe');
const shapeStrokeColor = ref('#3b82f6');

// Debug: Watch currentExercise prop changes
watch(() => props.currentExercise, (newVal) => {
  console.log('🎯 InteractivePanel received currentExercise:', newVal);
  console.log('🎯 Exercise type:', newVal?.type);
  console.log('🎯 Exercise data:', newVal?.data);
  console.log('🎯 Exercise data.type:', newVal?.data?.type);
}, { immediate: true, deep: true });

const generateRandomColors = () => {
  const hues = [0, 30, 60, 120, 180, 210, 270, 300]; // Red, Orange, Yellow, Green, Cyan, Blue, Purple, Pink
  const hue = hues[Math.floor(Math.random() * hues.length)];
  
  // Pastel fill
  shapeFillColor.value = `hsl(${hue}, 70%, 90%)`;
  // Darker stroke
  shapeStrokeColor.value = `hsl(${hue}, 70%, 40%)`;
};

// Watch for exercise changes to randomize color
watch(() => props.currentExercise, (newVal) => {
  if (newVal?.data?.type === 'geometry') {
    generateRandomColors();
  }
}, { immediate: true, deep: true });

const localMatchingAnswers = ref({});
const draggedItem = ref({ questionId: null, wordIndex: null });
const shuffledRightOptions = ref([]);
const normalizedExercise = ref(null);

const canSubmit = computed(() => {
  // For matching exercises, check the local state
  if (props.currentExercise?.type === 'matching') {
    return Object.values(localMatchingAnswers.value).some(val => val);
  }

  // For all other exercise types, check the global userAnswer state
  const answer = userAnswer.value;
  if (Array.isArray(answer)) {
    return answer.some(val => val && val.trim() !== '');
  }
  if (typeof answer === 'object' && answer !== null) {
    return Object.values(answer).some(val => val);
  }
  return answer !== null && answer !== undefined && answer !== '';
});

// Watch for exercise changes to reset state and prepare data
// Clone the exercise to avoid prop mutation
watch(() => props.currentExercise, (newEx) => {
  resetExerciseState();
  if (!newEx) {
    normalizedExercise.value = null;
    return;
  }

  // Clone the exercise to avoid prop mutation
  const exerciseClone = JSON.parse(JSON.stringify(newEx));

  switch(exerciseClone.type) {
      case 'reading':
      case 'short-answer':
          if (exerciseClone.questions && exerciseClone.questions.length > 0) {
              userAnswer.value = Array(exerciseClone.questions.length).fill('');
          } else {
              userAnswer.value = '';
          }
          break;
      case 'matching':
          localMatchingAnswers.value = {};
          userAnswer.value = {};
          if (exerciseClone.pairs) {
              const rightOptions = exerciseClone.pairs.map(p => p.correctMatch || p.right);
              shuffledRightOptions.value = [...rightOptions].sort(() => Math.random() - 0.5);
          } else {
              shuffledRightOptions.value = [];
          }
          break;
      case 'structure':
           userAnswer.value = exerciseClone.questions.reduce((acc, q) => {
              acc[q.id] = [...q.words].sort(() => Math.random() - 0.5);
              return acc;
          }, {});
          break;
      case 'fill-blanks':
           userAnswer.value = {};

           // Handle both array of questions and single question structures
           const questionsArray = exerciseClone.questions || [exerciseClone];

           // Perform normalization on the clone
           questionsArray.forEach(q => {
              q.sentenceParts = [];

              // Use template, sentence, or question property for the text
              let remainingSentence = q.template || q.sentence || q.question || '';

              // Get blanks array
              const blanks = q.blanks || [];

              blanks.forEach((blank, index) => {
                  const split = remainingSentence.split('_____');
                  q.sentenceParts.push({ text: split[0], blank: null });

                  // Create blank object with proper structure
                  const blankObj = typeof blank === 'string'
                      ? { id: `blank_${index}`, correctAnswer: blank, placeholder: '...' }
                      : { id: blank.id || `blank_${index}`, correctAnswer: blank.correctAnswer || blank, placeholder: blank.placeholder || '...' };

                  q.sentenceParts.push({ text: '', blank: blankObj });
                  remainingSentence = split.slice(1).join('_____');
              });
              q.sentenceParts.push({ text: remainingSentence, blank: null });
          });

          // If it was a single question, update the clone
          if (!exerciseClone.questions) {
              exerciseClone.questions = questionsArray;
          }
          break;
      default:
          userAnswer.value = null;
          break;
  }

  // Store the normalized exercise
  normalizedExercise.value = exerciseClone;
}, { immediate: true, deep: true });

const exerciseType = computed(() => {
  // If the exercise is a generic 'exercise' type, look into its data for specific type
  if (props.currentExercise?.type === 'exercise' && props.currentExercise?.data?.type) {
    console.log('🔍 Exercise Type (nested):', props.currentExercise.data.type, 'Full exercise:', props.currentExercise);
    return props.currentExercise.data.type;
  }
  console.log('🔍 Exercise Type (direct):', props.currentExercise?.type || 'short-answer', 'Full exercise:', props.currentExercise);
  return props.currentExercise?.type || 'short-answer';
});
// Geometry specific data shortcut
const geometryData = computed(() => {
  const data = props.currentExercise?.data || {};
  console.log('📐 Geometry Data:', data);
  return data;
});

const submit = () => {
  // Copy local matching answers to the global state right before submitting
  if (exerciseType.value === 'matching') {
    userAnswer.value = localMatchingAnswers.value;
  }
  
  submitLogic(props.currentExercise);
  emit('submit');
};

const resetAndNext = () => {
    emit('next-exercise');
};

const selectOption = (option, index) => {
  const correctAnswerType = typeof props.currentExercise.correctAnswer;
  if (correctAnswerType === 'number') {
    userAnswer.value = index;
  } else {
    const optionText = typeof option === 'string' ? option : option.text;
    const optionId = optionText.substring(0, 1).toUpperCase();
    userAnswer.value = optionId;
  }
};

// --- Input Handlers ---
const updateMultiAnswer = (index, value) => {
    const newAnswers = [...userAnswer.value];
    newAnswers[index] = value;
    userAnswer.value = newAnswers;
};
const updateFillBlankAnswer = (blankId, value) => {
    userAnswer.value = { ...userAnswer.value, [blankId]: value };
};

// --- Drag and Drop for Structure Exercise ---
const onDragStart = (questionId, wordIndex, event) => {
    if (showCorrectAnswer.value) return;
    draggedItem.value = { questionId, wordIndex };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify({questionId, wordIndex}));
};
const onDrop = (questionId, event) => {
    if (showCorrectAnswer.value) return;
    const from = JSON.parse(event.dataTransfer.getData('text/plain'));
    const dropZone = event.target.closest('.word-bank');
    if (!dropZone || from.questionId !== questionId) return;

    const allWords = Array.from(dropZone.children);
    const toEl = event.target.closest('.word-button');
    const toIndex = toEl ? allWords.indexOf(toEl) : allWords.length;
    
    if (from.wordIndex === toIndex) return;

    const words = [...userAnswer.value[questionId]];
    const [movedWord] = words.splice(from.wordIndex, 1);
    words.splice(toIndex, 0, movedWord);
    userAnswer.value[questionId] = words;
    draggedItem.value = { questionId: null, wordIndex: null };
};

// --- UI Helpers ---
const renderFeedback = (user, correct) => {
    const isCorrect = answerWasCorrect.value;
    const resultClass = isCorrect ? 'is-correct' : 'is-incorrect';
    let content = `<p class="feedback-line">Your answer: <strong>${user || '(No answer)'}</strong></p>`;
    if (isCorrect) {
        content = `<p class="feedback-line">${confirmation.value}</p>`;
    } else if (showCorrectAnswer.value) {
        content += `<p class="feedback-line">${confirmation.value}</p>`;
    }
    return `<div class="feedback-box ${resultClass}">${content}</div>`;
};

const getOptionClasses = (option, index) => {
    const correctAnswerType = typeof props.currentExercise.correctAnswer;
    const optionId = (typeof option === 'string' ? option : option.text).substring(0, 1).toUpperCase();
    
    let isSelected;
    if (correctAnswerType === 'number') {
        isSelected = userAnswer.value === index;
    } else {
        isSelected = userAnswer.value === optionId;
    }

    if (showCorrectAnswer.value) {
        let isCorrect;
        if (correctAnswerType === 'number') {
            isCorrect = index === props.currentExercise.correctAnswer;
        } else {
            isCorrect = optionId === props.currentExercise.correctAnswer;
        }
        
        if (isCorrect) return 'is-correct';
        if (isSelected) return 'is-incorrect';
    }

    if (isSelected) return 'is-selected';
    return '';
};

const getMatchingSelectClasses = (pairId, correctAnswer) => {
    if (!showCorrectAnswer.value) return '';
    const answer = (exerciseType.value === 'matching' ? localMatchingAnswers.value : userAnswer.value);
    return answer[pairId] === correctAnswer ? 'is-correct' : 'is-incorrect';
};

const getFillBlankInputClasses = (blankId, correctAnswer) => {
    if (!showCorrectAnswer.value) return '';
    return (userAnswer.value[blankId] || '').trim().toLowerCase() === correctAnswer.toLowerCase() ? 'is-correct' : 'is-incorrect';
};

const getStructureWordClasses = (questionId, wordIndex) => {
    if (!showCorrectAnswer.value) return '';
    const questionData = normalizedExercise.value?.questions?.find(q=>q.id === questionId);
    if (!questionData) return '';
    const isCorrect = (userAnswer.value[questionId] || [])[wordIndex] === questionData.correctOrder[wordIndex];
    return isCorrect ? 'is-correct' : 'is-incorrect';
};

const isOptionUsed = (currentPairId, option) => {
    return Object.entries(localMatchingAnswers.value).some(([pairId, selectedOption]) => {
        // Using != instead of !== because the keys might be numbers or strings
        return pairId != currentPairId && selectedOption === option;
    });
};

const isLastExercise = computed(() => props.exerciseIndex >= props.totalExercises - 1);
const exerciseMeta = computed(() => {
    const colors = {
        reading: { color: 'var(--lesson-purple)', lightColor: 'var(--lesson-purple-light)' },
        'short-answer': { color: 'var(--lesson-blue)', lightColor: 'var(--lesson-blue-light)' },
        'multiple-choice': { color: 'var(--lesson-green)', lightColor: 'var(--lesson-green-light)' },
        'abc': { color: 'var(--lesson-green)', lightColor: 'var(--lesson-green-light)' },
        'dialogue-completion': { color: 'var(--lesson-green)', lightColor: 'var(--lesson-green-light)' },
        matching: { color: 'var(--lesson-yellow)', lightColor: 'var(--lesson-yellow-light)' },
        'fill-blanks': { color: 'var(--lesson-purple)', lightColor: 'var(--lesson-purple-light)' },
        structure: { color: 'var(--lesson-green)', lightColor: 'var(--lesson-green-light)' },
        default: { color: 'var(--primary)', lightColor: 'var(--secondary)'}
    };
    return colors[exerciseType.value] || colors.default;
});

// ================================
// GAME MODE SUPPORT
// ================================

/**
 * GAME RENDERING SYSTEM OVERVIEW
 * ===============================
 *
 * This component (InteractivePanel) handles both regular exercises AND games.
 * When a game step is detected, it switches from exercise rendering to game rendering.
 *
 * FLOW:
 * 1. LessonPage.getCurrentExercise() detects game step and returns standardized game object
 * 2. InteractivePanel receives game object as currentExercise prop
 * 3. isGameMode computed detects it's a game (checks multiple properties)
 * 4. Template uses v-if="isGameMode" to render GameContainer instead of exercise UI
 * 5. GameContainer receives gameType and gameData props
 * 6. GameContainer loads the appropriate game component (BasketCatch.vue, WhackAMole.vue, etc.)
 *
 * SUPPORTED GAMES:
 * - basket-catch: Catch falling items (correct answers)
 * - whack-a-mole: Click on correct answers before they disappear
 *
 * GAME DATA STRUCTURE (passed to GameContainer):
 * {
 *   instructions: 'Catch the correct grammar forms!',
 *   targetScore: 100,      // Points needed to complete
 *   timeLimit: 60,         // Seconds allowed
 *   lives: 3,              // Mistakes before game over
 *   difficulty: 'medium',  // easy | medium | hard
 *   items: [...],          // Items to display in game
 *   correctAnswers: [...], // Items that give points
 *   wrongAnswers: [...],   // Items that lose lives
 *   questions: [...],      // Optional question data
 *   gameplayData: {...}    // Game-specific configuration
 * }
 */

// Detect if current exercise is a game
// This controls v-if="isGameMode" in the template
const isGameMode = computed(() => {
  if (!props.currentExercise) return false;

  // ✅ DEBUG: Log what we're checking
  console.log('Checking Game Mode for:', props.currentExercise.type)

  // ✅ FIX: Robust check matching the object we created in LessonPage
  // Multi-level detection strategy to catch all possible game formats:
  // 1. Check if type is explicitly 'game'
  // 2. Check if gameType property exists (preferred method)
  // 3. Check if gameData or gameConfig objects exist
  // 4. Check if type matches known game types (basket-catch, whack-a-mole)
  // 5. Check if gameType matches known game types
  const result = props.currentExercise.type === 'game' ||
         Boolean(props.currentExercise.gameType) ||
         Boolean(props.currentExercise.gameData) ||
         Boolean(props.currentExercise.gameConfig) || // Matches JSON "gameConfig"
         ['basket-catch', 'whack-a-mole', 'memory-cards'].includes(props.currentExercise.type) ||
         ['basket-catch', 'whack-a-mole', 'memory-cards'].includes(props.currentExercise.gameType);

  console.log('isGameMode result:', result)
  return result
});

// Extract game type from exercise data
// Returns: 'basket-catch' | 'whack-a-mole' | etc.
// This tells GameContainer which game component to load
const gameType = computed(() => {
  if (!isGameMode.value) return null;

  // ✅ STRICT CHECK: Only return what is explicitly in the data
  // This prevents "defaulting" to basket-catch if whack-a-mole is requested
  // Priority: currentExercise.gameType > gameConfig.gameType > fallback

  const explicitType = props.currentExercise.gameType;
  const configType = props.currentExercise.gameConfig?.gameType;

  // Log to debug
  console.log('🎮 Resolving Game Type:', { explicitType, configType, fullExercise: props.currentExercise });

  // Force explicit type check - avoid generic 'game' string
  if (explicitType && explicitType !== 'game') {
    console.log('✅ Using explicit gameType:', explicitType);
    return explicitType;
  }

  if (configType && configType !== 'game') {
    console.log('✅ Using gameConfig.gameType:', configType);
    return configType;
  }

  // Check if the exercise type itself is a specific game type
  if (['basket-catch', 'whack-a-mole', 'memory-cards'].includes(props.currentExercise.type)) {
      return props.currentExercise.type;
  }

  console.log('⚠️ No specific gameType found, falling back to basket-catch');
  return 'basket-catch'; // Default fallback
});

// Extract and normalize game data for GameContainer
// This creates a standardized data structure regardless of JSON format
const gameData = computed(() => {
  if (!isGameMode.value) return null;

  const ex = props.currentExercise;

  // Improved merging strategy:
  // 1. Start with sensible defaults
  // 2. Spread gameConfig to override defaults
  // 3. Spread entire exercise object to allow root properties to override
  // 4. Explicitly set gameType to ensure it's always present
  const data = {
    instructions: ex.instructions || ex.description || "Play the game!",
    targetScore: 100,
    timeLimit: 60,
    lives: 3,
    ...(ex.gameConfig || {}), // Config object overrides defaults
    ...ex, // Root properties override everything
    gameType: ex.gameType || ex.type || 'basket-catch' // Ensure gameType is set
  };

  console.log('🎮 GameData being passed to GameContainer:', data);
  return data;
});

/**
 * Handle game completion event from GameContainer
 * Called when user finishes a game (win or lose)
 *
 * @param {Object} result - Game result object from GameContainer
 * @param {number} result.score - Final score achieved
 * @param {number} result.stars - Stars earned (0-3)
 * @param {boolean} result.completed - Whether game was completed successfully
 * @param {number} result.accuracy - Percentage of correct answers
 *
 * COMPLETION CRITERIA:
 * - result.completed = true (reached target score within time)
 * - OR result.stars >= 2 (earned at least 2 stars)
 *
 * RESULT HANDLING:
 * 1. Mark as correct/incorrect for progress tracking
 * 2. Store game results in userAnswer for lesson orchestrator
 * 3. Auto-advance to next step after 1.5s delay (show results briefly)
 */
const handleGameComplete = (result) => {
  // Mark the exercise as answered with game results
  // Game is considered "correct" if completed or earned 2+ stars
  answerWasCorrect.value = result.completed || result.stars >= 2;
  showCorrectAnswer.value = true;

  // Store game results in userAnswer for tracking
  // This gets saved to user progress and affects lesson completion stats
  userAnswer.value = {
    type: 'game',
    score: result.score,
    stars: result.stars,
    completed: result.completed,
    accuracy: result.accuracy
  };

  // Auto-advance to next exercise after a short delay
  // Gives user time to see final score/stars
  setTimeout(() => {
    emit('next-exercise');
  }, 1500);
};

/**
 * Handle early game exit (user quits before completion)
 * Allows user to retry the game without penalty
 */
const handleGameExit = () => {
  // Reset state and allow retry
  resetExerciseState();
  showCorrectAnswer.value = false;
};
</script>

<style scoped>
/* ================================ */
/* ==       THEME VARIABLES      == */
/* ================================ */
.interactive-panel {
  /* This makes the variables available to all children of this component */
  --background: #fff;
  --foreground: #27272a; /* Muted Black */
  --card: #fff;
  --card-foreground: #27272a;
  --primary: #030213;
  --primary-foreground: #ffffff;
  --secondary: #f4f4f5;
  --muted-foreground: #71717a;
  --destructive: #d4183d;
  --border: #e4e4e7;
  --input-background: #f4f4f5;
  --ring: #a78bfa;
  --radius: 0.625rem;

  --lesson-purple: #8b7cf6;
  --lesson-purple-light: #f8f7ff;
  --lesson-green: #10b981;
  --lesson-green-light: #f0fdf4;
  --lesson-blue: #3b82f6;
  --lesson-blue-light: #eff6ff;
  --lesson-yellow: #f59e0b;
  --lesson-yellow-light: #fffbeb;
}

/* ================================ */
/* ==       MAIN LAYOUT          == */
/* ================================ */
.interactive-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: var(--font-sans);
  background-color: var(--background);
}
.panel-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.game-panel-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
  overflow: hidden;
}
.panel-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background-color: var(--card);
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.exercise-step-icon {
  color: white;
  font-size: 0.875rem;
  border-radius: 9999px;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;
}
.exercise-title {
  color: var(--card-foreground);
  font-weight: 600;
  font-size: 1.125rem;
}
.exercise-description {
  color: var(--muted-foreground);
  font-size: 0.875rem;
}
.exercise-counter {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  color: var(--foreground);
  border: 1px solid var(--border);
  background-color: var(--secondary);
}
.panel-content-scroll {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.5rem;
}
.exercise-wrapper {
  max-width: 42rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.exercise-type-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.panel-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  background-color: var(--card);
}

/* ================================ */
/* ==      GENERAL ELEMENTS      == */
/* ================================ */
.exercise-card {
  padding: 1rem;
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.question-text {
  color: var(--card-foreground);
  line-height: 1.625;
  margin-bottom: 1rem;
  font-size: 1rem;
}
.card-subtitle {
  margin-bottom: 0.75rem;
  color: var(--card-foreground);
  font-weight: 600;
}
.reading-text-card {
  background-color: var(--secondary);
}
.reading-text-content {
  background-color: var(--lesson-blue-light);
  padding: 1rem;
  border-radius: var(--radius);
  line-height: 1.6;
  color: var(--card-foreground);
}

/* ================================ */
/* ==      GEOMETRY EXPLORER     == */
/* ================================ */
.geometry-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.geometry-card {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.geometry-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.canvas-wrapper {
  position: relative;
  width: 300px;
  height: 300px;
  margin-bottom: 1.5rem;
  user-select: none;
}

.geometry-svg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  pointer-events: none; /* Let clicks pass through to canvas */
}

.geometry-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 20;
  cursor: crosshair;
  touch-action: none; /* Prevent scrolling while drawing */
}

.geometry-canvas.is-drawing {
  cursor: none;
}

.geometry-feedback {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  z-index: 30;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.geometry-feedback.success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.geometry-feedback.error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.identify-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  color: var(--foreground);
}
.instruction-text {
  font-size: 0.9rem;
  color: var(--muted-foreground);
  font-style: italic;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: var(--secondary);
  border-radius: 0.375rem;
}

/* ================================ */
/* ==          BUTTONS           == */
/* ================================ */
.action-button {
  padding: 0.6rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  font-size: 1rem;
}
.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.submit-button {
  color: white;
}
.next-button {
  background-color: transparent;
  border: 1px solid;
}
.option-button {
  width: 100%;
  padding: 0.75rem;
  text-align: left;
  border-radius: 0.5rem;
  border: 2px solid var(--border);
  background-color: var(--card);
  color: var(--foreground);
  transition: border-color 0.2s, background-color 0.2s, transform 0.2s;
  cursor: pointer;
  font-size: 1rem;
}
.option-button:hover:not(:disabled) {
  border-color: var(--lesson-purple);
  transform: translateY(-1px);
}
.option-button.is-selected {
  border-color: var(--lesson-purple);
  background-color: var(--lesson-purple-light);
}
.option-button.is-correct {
  border-color: var(--lesson-green) !important;
  background-color: var(--lesson-green-light) !important;
}
.option-button.is-incorrect {
  border-color: var(--lesson-yellow) !important;
  background-color: var(--lesson-yellow-light) !important;
}
.option-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

/* ================================ */
/* ==        INPUTS & FORMS      == */
/* ================================ */
.answer-textarea, .matching-select, .fill-blank-input {
  width: 100%;
  background-color: var(--input-background);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  padding: 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.answer-textarea:focus, .matching-select:focus, .fill-blank-input:focus {
  outline: none;
  border-color: var(--ring);
  box-shadow: 0 0 0 2px var(--ring);
}
.answer-textarea {
  min-height: 80px;
  resize: vertical;
}
.matching-select.is-correct, .fill-blank-input.is-correct {
    border-color: var(--lesson-green);
}
.matching-select.is-incorrect, .fill-blank-input.is-incorrect {
    border-color: var(--lesson-yellow);
}
.matching-select option:disabled {
    color: var(--muted-foreground);
}

/* ================================ */
/* ==    EXERCISE-SPECIFIC       == */
/* ================================ */

/* Fill Blanks */
.fill-blank-sentence {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  line-height: 2.5; /* Increased for better input spacing */
}
.fill-blank-input {
  display: inline-block;
  width: 160px;
  margin: 0 0.25rem;
  padding: 0.25rem 0.5rem;
  text-align: center;
}

/* Matching */
.matching-pair-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (min-width: 640px) {
  .matching-pair-card {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
}
.matching-text-left {
  flex: 1;
  color: var(--card-foreground);
  font-weight: 500;
}
.matching-select-wrapper {
  flex: 1;
  width: 100%;
}

/* Structure */
.word-bank {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 60px;
  padding: 0.75rem;
  border: 2px dashed var(--border);
  border-radius: 0.5rem;
}
.word-button {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  background-color: var(--card);
  cursor: grab;
  user-select: none;
  transition: box-shadow 0.2s, background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--foreground);
  font-weight: 500;
}
.word-button:active {
  cursor: grabbing;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
}
.drag-handle {
  color: var(--muted-foreground);
  cursor: inherit;
}
.word-button.is-correct {
  border-color: var(--lesson-green);
  background-color: var(--lesson-green-light);
}
.word-button.is-incorrect {
  border-color: var(--lesson-yellow);
  background-color: var(--lesson-yellow-light);
}


/* ================================ */
/* ==         FEEDBACK           == */
/* ================================ */
.feedback-container {
  margin-top: 0.75rem;
}
:deep(.feedback-box) {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid;
}
:deep(.feedback-box.is-correct) {
  background-color: var(--lesson-green-light);
  border-color: var(--lesson-green);
}
:deep(.feedback-box.is-incorrect) {
  background-color: var(--lesson-yellow-light);
  border-color: var(--lesson-yellow);
}
:deep(.feedback-line) {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--card-foreground);
}
:deep(.feedback-line strong) {
  font-weight: 600;
}
.correct-answer-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--foreground);
}
.feedback-summary-card {
  text-align: center;
  padding: 1rem;
  background-color: var(--card);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.feedback-title {
  margin-bottom: 0.75rem;
  color: var(--card-foreground);
  font-size: 1.125rem;
  font-weight: 600;
}
.feedback-message {
  font-size: 1.875rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}
.feedback-message.is-correct {
  color: var(--lesson-green);
}
.feedback-message.is-incorrect {
  color: var(--lesson-yellow);
}
.feedback-subtitle {
  color: var(--muted-foreground);
  font-size: 0.875rem;
}

/* ================================ */
/* ==      LOADING STATE         == */
/* ================================ */
.panel-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--muted-foreground);
}
</style>