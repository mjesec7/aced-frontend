<template>
  <div class="interactive-panel">
    <div v-if="currentExercise" class="panel-container">

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
                  :placeholder="currentExercise.placeholder || 'Enter your transformed sentence...'" 
                  :disabled="showCorrectAnswer" 
                  class="answer-textarea"
                ></textarea>
                <div v-if="showCorrectAnswer" v-html="renderFeedback(userAnswer, currentExercise.correctAnswer)" class="feedback-container"></div>
            </article>
          </div>

          <div v-else-if="exerciseType === 'multiple-choice'" class="exercise-type-container">
            <article class="exercise-card">
              <p class="question-text">{{ currentExercise.question }}</p>
              <div class="options-list">
                <button 
                  v-for="(option, oIndex) in currentExercise.options" 
                  :key="oIndex" 
                  @click="!showCorrectAnswer && (userAnswer = option.substring(0, 1))" 
                  :disabled="showCorrectAnswer"
                  class="option-button"
                  :class="getOptionClasses(option)"
                >
                  {{ option }}
                </button>
              </div>
            </article>
          </div>

          <div v-else-if="exerciseType === 'fill-blanks'" class="exercise-type-container">
            <article v-for="question in currentExercise.questions" :key="question.id" class="exercise-card">
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
            <article v-for="pair in currentExercise.pairs" :key="pair.id" class="exercise-card matching-pair-card">
              <p class="matching-text-left">{{ pair.left }}</p>
              <div class="matching-select-wrapper">
                <select 
                  :value="userAnswer[pair.id] || ''"
                  @change="updateMatchingAnswer(pair.id, $event.target.value)"
                  :disabled="showCorrectAnswer"
                  class="matching-select"
                  :class="getMatchingSelectClasses(pair.id, pair.correctMatch)"
                >
                  <option value="" disabled>Select ending...</option>
                  <option 
                    v-for="option in shuffledRightOptions" 
                    :key="option" 
                    :value="option" 
                    :disabled="isOptionUsed(pair.id, option)"
                  >
                    {{ option }}
                  </option>
                </select>
              </div>
            </article>
          </div>

          <div v-else-if="exerciseType === 'structure'" class="exercise-type-container">
             <article v-for="question in currentExercise.questions" :key="question.id" class="exercise-card">
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

          <div v-if="showCorrectAnswer" class="feedback-summary-card">
            <h3 class="feedback-title">Result</h3>
            <div 
              class="feedback-message"
              :class="answerWasCorrect ? 'is-correct' : 'is-incorrect'"
            >
              {{ confirmation }}
            </div>
            <p v-if="!answerWasCorrect" class="feedback-subtitle">Check your answers above for details.</p>
          </div>
        </div>
      </div>

      <footer class="panel-actions">
        <button v-if="!showCorrectAnswer" @click="submit" class="action-button submit-button" :style="{backgroundColor: exerciseMeta.color}">
          Check Answers
        </button>
        <button v-else @click="resetAndNext" class="action-button next-button" :style="{borderColor: exerciseMeta.color, color: exerciseMeta.color}">
          {{ isLastExercise ? 'Finish' : 'Next Exercise' }}
        </button>
      </footer>
    </div>
    
    <div v-else class="panel-loading">
      <p>Loading interactive exercise...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useExercises } from '../../composables/useExercises.js';

const props = defineProps({
  currentExercise: Object,
  exerciseIndex: Number,
  totalExercises: Number,
});

const emit = defineEmits(['submit', 'next-exercise']);

const {
  userAnswer,
  confirmation,
  answerWasCorrect,
  showCorrectAnswer,
  submitAnswer: submitLogic,
  resetExerciseState,
} = useExercises();

const shuffledRightOptions = ref([]);
const draggedItem = ref({ questionId: null, wordIndex: null });

// Watch for exercise changes to reset state and prepare data
watch(() => props.currentExercise, (newEx) => {
  resetExerciseState();
  if (newEx) {
    switch(newEx.type) {
        case 'reading':
        case 'short-answer':
            userAnswer.value = Array(newEx.questions.length).fill('');
            break;
        case 'matching':
            userAnswer.value = {};
            const rightOptions = newEx.pairs.map(p => p.correctMatch);
            shuffledRightOptions.value = [...rightOptions].sort(() => Math.random() - 0.5);
            break;
        case 'structure':
             userAnswer.value = newEx.questions.reduce((acc, q) => {
                acc[q.id] = [...q.words].sort(() => Math.random() - 0.5);
                return acc;
            }, {});
            break;
        case 'fill-blanks':
             userAnswer.value = {};
             // Pre-process sentence for easier rendering
             newEx.questions.forEach(q => {
                q.sentenceParts = [];
                let remainingSentence = q.sentence;
                q.blanks.forEach(blank => {
                    const split = remainingSentence.split('_____');
                    q.sentenceParts.push({ text: split[0], blank: null });
                    q.sentenceParts.push({ text: '', blank: blank });
                    remainingSentence = split.slice(1).join('_____');
                });
                q.sentenceParts.push({ text: remainingSentence, blank: null });
            });
            break;
        default:
            userAnswer.value = '';
            break;
    }
  }
}, { immediate: true, deep: true });

const exerciseMeta = computed(() => {
    const colors = {
        reading: { color: 'var(--lesson-purple)', lightColor: 'var(--lesson-purple-light)' },
        'short-answer': { color: 'var(--lesson-blue)', lightColor: 'var(--lesson-blue-light)' },
        'multiple-choice': { color: 'var(--lesson-green)', lightColor: 'var(--lesson-green-light)' },
        matching: { color: 'var(--lesson-yellow)', lightColor: 'var(--lesson-yellow-light)' },
        'fill-blanks': { color: 'var(--lesson-purple)', lightColor: 'var(--lesson-purple-light)' },
        structure: { color: 'var(--lesson-green)', lightColor: 'var(--lesson-green-light)' },
        default: { color: 'var(--primary)', lightColor: 'var(--secondary)'}
    };
    return colors[props.currentExercise?.type] || colors.default;
});

const isLastExercise = computed(() => props.exerciseIndex >= props.totalExercises - 1);

const exerciseType = computed(() => {
  // If the exercise has a type, use it. Otherwise, default to 'short-answer'.
  return props.currentExercise?.type || 'short-answer';
});

const submit = () => {
    submitLogic(props.currentExercise);
    emit('submit');
};

const resetAndNext = () => {
    emit('next-exercise');
};

// --- Input Handlers ---
const updateMultiAnswer = (index, value) => {
    const newAnswers = [...userAnswer.value];
    newAnswers[index] = value;
    userAnswer.value = newAnswers;
};
const updateMatchingAnswer = (pairId, value) => {
    userAnswer.value = { ...userAnswer.value, [pairId]: value };
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
    const isCorrect = (user || '').toString().trim().toLowerCase() === correct.toString().trim().toLowerCase();
    const resultClass = isCorrect ? 'is-correct' : 'is-incorrect';
    let content = `<p class="feedback-line">Your answer: <strong>${user || '(No answer)'}</strong></p>`;
    if (!isCorrect) {
        content += `<p class="feedback-line">Correct answer: <strong>${correct}</strong></p>`;
    }
    return `<div class="feedback-box ${resultClass}">${content}</div>`;
};
const getOptionClasses = (option) => {
    const optionId = option.substring(0, 1);
    if (showCorrectAnswer.value) {
        if (props.currentExercise.correctAnswer === optionId) return 'is-correct';
        if (userAnswer.value === optionId) return 'is-incorrect';
    }
    if (userAnswer.value === optionId) return 'is-selected';
    return '';
};
const getMatchingSelectClasses = (pairId, correctAnswer) => {
    if (!showCorrectAnswer.value) return '';
    return userAnswer.value[pairId] === correctAnswer ? 'is-correct' : 'is-incorrect';
};
const getFillBlankInputClasses = (blankId, correctAnswer) => {
    if (!showCorrectAnswer.value) return '';
    return (userAnswer.value[blankId] || '').trim().toLowerCase() === correctAnswer.toLowerCase() ? 'is-correct' : 'is-incorrect';
};
const getStructureWordClasses = (questionId, wordIndex) => {
    if (!showCorrectAnswer.value) return '';
    const questionData = props.currentExercise.questions.find(q=>q.id === questionId);
    const isCorrect = (userAnswer.value[questionId] || [])[wordIndex] === questionData.correctOrder[wordIndex];
    return isCorrect ? 'is-correct' : 'is-incorrect';
};
const isOptionUsed = (currentPairId, option) => {
    return Object.entries(userAnswer.value).some(([pairId, selectedOption]) => {
        return pairId != currentPairId && selectedOption === option;
    });
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
.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
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