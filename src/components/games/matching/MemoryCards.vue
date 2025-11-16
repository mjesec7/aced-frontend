<template>
  <div class="memory-cards-game">
    <!-- Game Board -->
    <div class="cards-grid" :class="`grid-${gridSize}`">
      <div
        v-for="card in cards"
        :key="card.id"
        class="card-wrapper"
        @click="flipCard(card)"
      >
        <div class="card" :class="{ flipped: card.flipped, matched: card.matched }">
          <div class="card-front">
            <div class="card-icon">🎴</div>
          </div>
          <div class="card-back">
            <div class="card-content">{{ card.content }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="game-instructions">
      {{ instructions }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  gameData: {
    type: Object,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  lives: {
    type: Number,
    default: 3
  },
  timeRemaining: {
    type: Number,
    default: 60
  }
});

const emit = defineEmits([
  'score-change',
  'life-lost',
  'game-complete',
  'item-collected'
]);

// State
const cards = ref([]);
const flippedCards = ref([]);
const matchedPairs = ref(0);
const canFlip = ref(true);
const gameActive = ref(true);

// Computed
const instructions = computed(() => {
  return props.gameData?.instructions || 'Find matching pairs!';
});

const pairs = computed(() => {
  return props.gameData?.items || props.gameData?.pairs || [];
});

const gridSize = computed(() => {
  const totalCards = cards.value.length;
  if (totalCards <= 12) return '4x3';
  if (totalCards <= 16) return '4x4';
  if (totalCards <= 20) return '5x4';
  return '6x4';
});

// Methods
const initializeGame = () => {
  if (pairs.value.length === 0) {
    console.warn('No pairs provided for memory game');
    return;
  }

  // Create pairs of cards
  const cardPairs = [];
  let cardId = 0;

  pairs.value.forEach((pair, pairIndex) => {
    // Each pair creates two cards
    const content = pair.text || pair.word || pair;

    cardPairs.push({
      id: cardId++,
      pairId: pairIndex,
      content: content,
      flipped: false,
      matched: false
    });

    cardPairs.push({
      id: cardId++,
      pairId: pairIndex,
      content: content,
      flipped: false,
      matched: false
    });
  });

  // Shuffle cards
  cards.value = shuffleArray(cardPairs);
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const flipCard = (card) => {
  if (!gameActive.value || !canFlip.value || card.flipped || card.matched) {
    return;
  }

  // Flip the card
  card.flipped = true;
  flippedCards.value.push(card);

  // Check if we have two cards flipped
  if (flippedCards.value.length === 2) {
    canFlip.value = false;
    checkMatch();
  }
};

const checkMatch = () => {
  const [card1, card2] = flippedCards.value;

  if (card1.pairId === card2.pairId) {
    // Match!
    setTimeout(() => {
      card1.matched = true;
      card2.matched = true;
      matchedPairs.value++;

      // Award points
      emit('score-change', 20);
      emit('item-collected', { isCorrect: true });

      // Check if game complete
      if (matchedPairs.value === pairs.value.length) {
        setTimeout(() => {
          emit('game-complete', { reason: 'all-matched' });
        }, 500);
      }

      resetFlipped();
    }, 500);
  } else {
    // No match
    setTimeout(() => {
      card1.flipped = false;
      card2.flipped = false;

      // Small penalty
      emit('score-change', -2);
      emit('item-collected', { isCorrect: false });

      resetFlipped();
    }, 1000);
  }
};

const resetFlipped = () => {
  flippedCards.value = [];
  canFlip.value = true;
};

// Watch for game end conditions
watch(() => props.lives, (newLives) => {
  if (newLives <= 0) {
    gameActive.value = false;
  }
});

watch(() => props.timeRemaining, (newTime) => {
  if (newTime <= 0) {
    gameActive.value = false;
  }
});

// Lifecycle
onMounted(() => {
  initializeGame();
});
</script>

<style scoped>
.memory-cards-game {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: auto;
}

.cards-grid {
  display: grid;
  gap: 15px;
  max-width: 800px;
  margin: 0 auto;
}

.cards-grid.grid-4x3 {
  grid-template-columns: repeat(4, 1fr);
}

.cards-grid.grid-4x4 {
  grid-template-columns: repeat(4, 1fr);
}

.cards-grid.grid-5x4 {
  grid-template-columns: repeat(5, 1fr);
}

.cards-grid.grid-6x4 {
  grid-template-columns: repeat(6, 1fr);
}

.card-wrapper {
  aspect-ratio: 1;
  perspective: 1000px;
  cursor: pointer;
}

.card {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.card.flipped {
  transform: rotateY(180deg);
}

.card.matched {
  opacity: 0.6;
  pointer-events: none;
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.card-front {
  background: linear-gradient(135deg, #a855f7, #9333ea);
  border: 3px solid rgba(255,255,255,0.3);
}

.card-icon {
  font-size: 48px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.card-back {
  background: white;
  transform: rotateY(180deg);
  border: 3px solid #e0e0e0;
}

.card-content {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  text-align: center;
  padding: 10px;
  word-break: break-word;
}

.game-instructions {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255,255,255,0.95);
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  max-width: 80%;
  text-align: center;
  z-index: 10;
}

/* Responsive */
@media (max-width: 768px) {
  .cards-grid {
    gap: 10px;
    padding: 10px;
  }

  .cards-grid.grid-4x3,
  .cards-grid.grid-4x4 {
    grid-template-columns: repeat(3, 1fr);
  }

  .cards-grid.grid-5x4,
  .cards-grid.grid-6x4 {
    grid-template-columns: repeat(4, 1fr);
  }

  .card-icon {
    font-size: 32px;
  }

  .card-content {
    font-size: 14px;
  }

  .game-instructions {
    font-size: 14px;
    padding: 8px 16px;
  }
}
</style>
