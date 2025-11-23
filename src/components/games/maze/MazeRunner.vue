<template>
  <div class="maze-runner-game" @keydown="handleKeyDown" tabindex="0">
    <!-- Right Sidebar HUD -->
    <GameHUDSidebar
      v-if="gameActive"
      :score="score"
      :time-remaining="timeRemaining"
      :lives="lives"
      :max-lives="3"
    />

    <!-- Answer Panel (Left Side) -->
    <div v-if="gameActive" class="answer-panel">
      <div class="panel-header">
        <div class="question-icon">{{ isNearAnyGate ? '❓' : '🎮' }}</div>
        <h3 class="panel-title">{{ isNearAnyGate ? 'Answer Question' : 'Controls' }}</h3>
      </div>
      
      <div v-if="isNearAnyGate" class="current-question">
        <p class="question-text">{{ currentQuestion?.q }}</p>
      </div>
      
      <div v-if="!isNearAnyGate" class="controls-info">
        <p class="control-text">🎯 <strong>Move:</strong> Arrow Keys or WASD</p>
        <p class="control-text">🔒 <strong>Goal:</strong> Reach the flag!</p>
        <p class="control-text">💡 <strong>Tip:</strong> Answer questions to unlock gates</p>
      </div>
      
      <div v-if="isNearAnyGate" class="answer-input-group">
        <input
          v-model="userAnswer"
          type="text"
          class="answer-input"
          placeholder="Type your answer..."
          @keyup.enter="submitAnswer"
          ref="answerInput"
        />
        <button 
          class="submit-btn"
          @click="submitAnswer"
          :disabled="!userAnswer.trim()"
        >
          ✓
        </button>
      </div>
      
      <div v-if="feedbackMessage" class="feedback-message" :class="feedbackType">
        <span class="feedback-icon">{{ feedbackIcon }}</span>
        <span class="feedback-text">{{ feedbackMessage }}</span>
      </div>
      
      <div v-if="isNearAnyGate" class="panel-hint">
        <p>💡 Answer correctly to unlock the gate!</p>
      </div>
    </div>

    <!-- Maze Grid -->
    <div class="maze-container">
      <div class="maze-grid">
        <div
          v-for="(row, rowIndex) in maze"
          :key="rowIndex"
          class="maze-row"
        >
          <div
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            class="maze-cell"
            :class="{
              'wall': cell === 'wall',
              'path': cell === 'path',
              'gate': cell === 'gate',
              'goal': cell === 'goal',
              'player': playerPos.row === rowIndex && playerPos.col === colIndex,
              'near-gate': isNearGate(rowIndex, colIndex)
            }"
          >
            <span v-if="cell === 'gate'" class="gate-icon">🔒</span>
            <span v-if="cell === 'goal'" class="goal-icon">🏁</span>
            <span v-if="playerPos.row === rowIndex && playerPos.col === colIndex" class="player-icon">🏃</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Start/Complete Modal -->
    <transition name="fade">
      <div v-if="!gameActive" class="modal-overlay">
        <div class="small-modal">
          <div class="modal-icon">{{ isGameOver ? (reachedGoal ? '🎉' : '😅') : '🏃' }}</div>
          <h3 class="modal-title">{{ isGameOver ? (reachedGoal ? 'You Won!' : 'Game Over') : 'Maze Runner' }}</h3>
          <p class="modal-text">{{ isGameOver ? `Score: ${score}` : 'Navigate the maze and answer questions to unlock gates!' }}</p>
          
          <div v-if="isGameOver" class="modal-stars">
            <span v-for="n in 3" :key="n" class="star">{{ n <= earnedStars ? '⭐' : '☆' }}</span>
          </div>

          <button class="modal-btn" @click="startGame">
            {{ isGameOver ? '🔄 Retry' : '▶ Start' }}
          </button>
          <button v-if="isGameOver" class="modal-btn secondary" @click="continueLesson">
            Continue →
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import GameHUDSidebar from '../base/GameHUDSidebar.vue';

const props = defineProps({
  gameData: { type: Object, required: true },
  score: { type: Number, default: 0 },
  lives: { type: Number, default: 3 },
  timeRemaining: { type: Number, default: 60 }
});

const emit = defineEmits(['score-change', 'life-lost', 'game-complete']);

// State
const maze = ref([]);
const playerPos = ref({ row: 0, col: 0 });
const gameActive = ref(false);
const isGameOver = ref(false);
const reachedGoal = ref(false);
const earnedStars = ref(0);
const currentQuestionIndex = ref(0);
const unlockedGates = ref(new Set());
const userAnswer = ref('');
const feedbackMessage = ref('');
const feedbackType = ref('');
const feedbackIcon = ref('');
const answerInput = ref(null);

// Questions
const questions = computed(() => props.gameData.questions || []);
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);

// Check if player is near any gate
const isNearAnyGate = computed(() => {
  return isNearGate(playerPos.value.row, playerPos.value.col);
});

// Maze generation - gates block ALL paths to goal
const generateMaze = () => {
  const layout = [
    ['path', 'path', 'path', 'path', 'path'],
    ['path', 'wall', 'wall', 'wall', 'path'],
    ['path', 'path', 'gate', 'path', 'path'],
    ['wall', 'wall', 'wall', 'gate', 'wall'],
    ['path', 'path', 'path', 'path', 'goal']
  ];
  maze.value = layout;
};

// Check if cell is near a gate
const isNearGate = (row, col) => {
  const directions = [
    { row: -1, col: 0 }, { row: 1, col: 0 },
    { row: 0, col: -1 }, { row: 0, col: 1 }
  ];
  
  for (const dir of directions) {
    const checkRow = row + dir.row;
    const checkCol = col + dir.col;
    if (checkRow >= 0 && checkRow < 5 && checkCol >= 0 && checkCol < 5) {
      if (maze.value[checkRow][checkCol] === 'gate') {
        return true;
      }
    }
  }
  return false;
};

// Game controls
const startGame = () => {
  playerPos.value = { row: 0, col: 0 };
  currentQuestionIndex.value = 0;
  unlockedGates.value.clear();
  reachedGoal.value = false;
  isGameOver.value = false;
  earnedStars.value = 0;
  userAnswer.value = '';
  feedbackMessage.value = '';
  generateMaze();
  gameActive.value = true;
  
  setTimeout(() => {
    document.querySelector('.maze-runner-game')?.focus();
  }, 100);
};

const handleKeyDown = (e) => {
  if (!gameActive.value) return;
  
  // Don't handle movement if typing in input
  if (e.target.tagName === 'INPUT') return;

  const key = e.key.toLowerCase();
  let newRow = playerPos.value.row;
  let newCol = playerPos.value.col;

  if (key === 'arrowup' || key === 'w') {
    newRow--;
    e.preventDefault();
  } else if (key === 'arrowdown' || key === 's') {
    newRow++;
    e.preventDefault();
  } else if (key === 'arrowleft' || key === 'a') {
    newCol--;
    e.preventDefault();
  if (targetCell === 'gate') {
    const gateKey = `${newRow}-${newCol}`;
    if (!unlockedGates.value.has(gateKey)) {
      return; // Can't move through locked gate
    }
  }

  playerPos.value = { row: newRow, col: newCol };

  if (targetCell === 'goal') {
    reachedGoal.value = true;
    finishGame();
  }
};

const submitAnswer = () => {
  if (!userAnswer.value.trim()) return;

  const answer = userAnswer.value.trim();
  const correctAnswer = currentQuestion.value.a;

  if (answer === correctAnswer) {
    // Correct!
    emit('score-change', 20);
    feedbackMessage.value = 'Correct! Gate unlocked!';
    feedbackType.value = 'correct';
    feedbackIcon.value = '✅';

    // Find and unlock nearest gate
    const directions = [
      { row: -1, col: 0 }, { row: 1, col: 0 },
      { row: 0, col: -1 }, { row: 0, col: 1 }
    ];

    for (const dir of directions) {
      const checkRow = playerPos.value.row + dir.row;
      const checkCol = playerPos.value.col + dir.col;
      
      if (checkRow >= 0 && checkRow < 5 && checkCol >= 0 && checkCol < 5) {
        if (maze.value[checkRow][checkCol] === 'gate') {
          const gateKey = `${checkRow}-${checkCol}`;
          unlockedGates.value.add(gateKey);
          maze.value[checkRow][checkCol] = 'path';
          break;
        }
      }
    }

    currentQuestionIndex.value = (currentQuestionIndex.value + 1) % questions.value.length;
  } else {
    // Wrong
    emit('score-change', -5);
    emit('life-lost');
    feedbackMessage.value = 'Wrong answer! Try again.';
    feedbackType.value = 'wrong';
    feedbackIcon.value = '❌';
  }

  userAnswer.value = '';
  
  setTimeout(() => {
    feedbackMessage.value = '';
  }, 2000);
};

const finishGame = () => {
  gameActive.value = false;
  isGameOver.value = true;

  const percentage = (props.score / 100) * 100;
  if (reachedGoal.value && percentage >= 80) earnedStars.value = 3;
  else if (reachedGoal.value && percentage >= 60) earnedStars.value = 2;
  else if (reachedGoal.value) earnedStars.value = 1;
  else earnedStars.value = 0;

  emit('game-complete', { score: props.score, completed: reachedGoal.value });
};

const continueLesson = () => {
  emit('game-complete', { score: props.score, completed: reachedGoal.value });
};

watch(() => props.lives, (val) => {
  if (val <= 0 && gameActive.value) finishGame();
});

watch(() => props.timeRemaining, (val) => {
  if (val <= 0 && gameActive.value) finishGame();
});

onMounted(() => {
  generateMaze();
});
</script>

<style scoped>
/* MAIN CONTAINER */
.maze-runner-game {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Fredoka', sans-serif;
  outline: none;
}

/* Answer Panel (Left Side) */
.answer-panel {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  border-radius: 20px;
  padding: 20px;
  width: 280px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 50;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.question-icon {
  font-size: 2rem;
}

.panel-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.current-question {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 2px solid #3b82f6;
}

.question-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  text-align: center;
}

.controls-info {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
  border: 2px solid #10b981;
}

.control-text {
  font-size: 0.95rem;
  color: #1e293b;
  margin: 8px 0;
  line-height: 1.4;
}

.control-text strong {
  color: #065f46;
}

.answer-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.answer-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  outline: none;
  transition: all 0.3s;
}

.answer-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.submit-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 1.5rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback-message {
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  animation: slideIn 0.3s;
}

.feedback-message.correct {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

.feedback-message.wrong {
  background: #fee2e2;
  color: #991b1b;
  border: 2px solid #ef4444;
}

.feedback-icon {
  font-size: 1.2rem;
}

.feedback-text {
  font-size: 0.9rem;
}

.panel-hint {
  background: #fef3c7;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid #f59e0b;
}

.panel-hint p {
  font-size: 0.85rem;
  color: #92400e;
  margin: 0;
  font-weight: 600;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* MAZE */
.maze-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.maze-grid {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.maze-row {
  display: flex;
}

.maze-cell {
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.maze-cell.wall {
  background: #2d3748;
  border-color: #1a202c;
}

.maze-cell.path {
  background: #f7fafc;
  border-color: #e2e8f0;
}

.maze-cell.gate {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-color: #b45309;
}

.maze-cell.goal {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #047857;
  animation: pulse 2s infinite;
}

.maze-cell.player {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #1d4ed8;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
}

.gate-icon,
.goal-icon,
.player-icon {
  font-size: 2.5rem;
  animation: bounce 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

/* QUESTION MODAL */
.question-modal {
  background: white;
  border-radius: 24px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
}

.modal-question {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 16px 0 24px;
}

.answer-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.answer-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.answer-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* MODAL */
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.small-modal {
  background: white;
  border-radius: 24px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 350px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
}

.modal-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 12px;
}

.modal-text {
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 20px;
}

.modal-stars {
  font-size: 2rem;
  color: #fbbf24;
  margin-bottom: 20px;
  letter-spacing: 6px;
}

.modal-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 16px;
  font-weight: 800;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  width: 100%;
  margin-bottom: 12px;
}

.modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
}

.modal-btn.secondary {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  box-shadow: 0 8px 16px rgba(168, 85, 247, 0.3);
}

.modal-btn.secondary:hover {
  box-shadow: 0 12px 24px rgba(168, 85, 247, 0.4);
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .maze-cell {
    width: 55px;
    height: 55px;
  }

  .gate-icon,
  .goal-icon,
  .player-icon {
    font-size: 2rem;
  }

  .question-banner {
    max-width: 90%;
    padding: 12px 20px;
  }

  .question-text {
    font-size: 1.1rem;
  }

  .small-modal {
    width: 90%;
    padding: 20px;
  }
}
</style>
