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

    <!-- Current Question Banner -->
    <div v-if="gameActive && currentQuestion" class="question-banner">
      <p class="question-text">{{ currentQuestion.q }}</p>
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
              'player': playerPos.row === rowIndex && playerPos.col === colIndex
            }"
          >
            <span v-if="cell === 'gate'" class="gate-icon">🔒</span>
            <span v-if="cell === 'goal'" class="goal-icon">🏁</span>
            <span v-if="playerPos.row === rowIndex && playerPos.col === colIndex" class="player-icon">🏃</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Question Modal -->
    <transition name="fade">
      <div v-if="showQuestionModal" class="modal-overlay" @click.self="closeQuestionModal">
        <div class="question-modal">
          <div class="modal-icon">❓</div>
          <h3 class="modal-title">Answer to Unlock Path</h3>
          <p class="modal-question">{{ currentQuestion?.q }}</p>
          
          <div class="answer-options">
            <button
              v-for="(answer, index) in currentAnswers"
              :key="index"
              class="answer-btn"
              @click="checkAnswer(answer)"
            >
              {{ answer }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Start/Complete Modal -->
    <transition name="fade">
      <div v-if="!gameActive" class="modal-overlay">
        <div class="small-modal">
          <div class="modal-icon">{{ isGameOver ? (reachedGoal ? '🎉' : '😅') : '🏃' }}</div>
          <h3 class="modal-title">{{ isGameOver ? (reachedGoal ? 'You Won!' : 'Game Over') : 'Maze Runner' }}</h3>
          <p class="modal-text">{{ isGameOver ? `Score: ${score}` : 'Navigate the maze and answer questions to unlock paths!' }}</p>
          
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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
const showQuestionModal = ref(false);
const unlockedGates = ref(new Set());

// Questions
const questions = computed(() => props.gameData.questions || []);
const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
const currentAnswers = computed(() => {
  if (!currentQuestion.value) return [];
  const answers = [currentQuestion.value.a, ...(currentQuestion.value.wrong || [])];
  return shuffleArray(answers);
});

// Maze generation
const generateMaze = () => {
  // Simple 5x5 maze with predefined layout
  const layout = [
    ['path', 'path', 'wall', 'path', 'path'],
    ['wall', 'path', 'wall', 'path', 'wall'],
    ['path', 'path', 'gate', 'path', 'path'],
    ['path', 'wall', 'wall', 'gate', 'wall'],
    ['path', 'path', 'path', 'path', 'goal']
  ];
  maze.value = layout;
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Game controls
const startGame = () => {
  playerPos.value = { row: 0, col: 0 };
  currentQuestionIndex.value = 0;
  unlockedGates.value.clear();
  reachedGoal.value = false;
  isGameOver.value = false;
  earnedStars.value = 0;
  generateMaze();
  gameActive.value = true;
  
  // Focus for keyboard controls
  setTimeout(() => {
    document.querySelector('.maze-runner-game')?.focus();
  }, 100);
};

const handleKeyDown = (e) => {
  if (!gameActive.value || showQuestionModal.value) return;

  const key = e.key.toLowerCase();
  let newRow = playerPos.value.row;
  let newCol = playerPos.value.col;

  // Movement
  if (key === 'arrowup' || key === 'w') {
    newRow--;
    e.preventDefault();
  } else if (key === 'arrowdown' || key === 's') {
    newRow++;
    e.preventDefault();
  } else if (key === 'arrowleft' || key === 'a') {
    newCol--;
    e.preventDefault();
  } else if (key === 'arrowright' || key === 'd') {
    newCol++;
    e.preventDefault();
  }

  // Check bounds
  if (newRow < 0 || newRow >= 5 || newCol < 0 || newCol >= 5) return;

  const targetCell = maze.value[newRow][newCol];

  // Check collision
  if (targetCell === 'wall') return;

  // Check gate
  if (targetCell === 'gate') {
    const gateKey = `${newRow}-${newCol}`;
    if (!unlockedGates.value.has(gateKey)) {
      showQuestionModal.value = true;
      return;
    }
  }

  // Move player
  playerPos.value = { row: newRow, col: newCol };

  // Check goal
  if (targetCell === 'goal') {
    reachedGoal.value = true;
    finishGame();
  }
};

const checkAnswer = (answer) => {
  showQuestionModal.value = false;

  if (answer === currentQuestion.value.a) {
    // Correct answer
    emit('score-change', 20);
    
    // Unlock gate in front of player
    const directions = [
      { row: -1, col: 0 }, // up
      { row: 1, col: 0 },  // down
      { row: 0, col: -1 }, // left
      { row: 0, col: 1 }   // right
    ];

    for (const dir of directions) {
      const checkRow = playerPos.value.row + dir.row;
      const checkCol = playerPos.value.col + dir.col;
      
      if (checkRow >= 0 && checkRow < 5 && checkCol >= 0 && checkCol < 5) {
        if (maze.value[checkRow][checkCol] === 'gate') {
          const gateKey = `${checkRow}-${checkCol}`;
          unlockedGates.value.add(gateKey);
          maze.value[checkRow][checkCol] = 'path'; // Unlock gate
          break;
        }
      }
    }

    // Move to next question
    currentQuestionIndex.value = (currentQuestionIndex.value + 1) % questions.value.length;
  } else {
    // Wrong answer
    emit('score-change', -5);
    emit('life-lost');
  }
};

const closeQuestionModal = () => {
  showQuestionModal.value = false;
};

const finishGame = () => {
  gameActive.value = false;
  isGameOver.value = true;

  // Calculate stars
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

// Watch for game end conditions
watch(() => props.lives, (val) => {
  if (val <= 0 && gameActive.value) {
    finishGame();
  }
});

watch(() => props.timeRemaining, (val) => {
  if (val <= 0 && gameActive.value) {
    finishGame();
  }
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

/* Question Banner */
.question-banner {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 240, 255, 0.98));
  backdrop-filter: blur(12px);
  padding: 16px 28px;
  border-radius: 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(102, 126, 234, 0.2);
  border: 2px solid rgba(102, 126, 234, 0.3);
  max-width: 600px;
  text-align: center;
  z-index: 10;
}

.question-text {
  font-size: 1.3rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
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
