<template>
  <div 
    class="content-panel"
    :class="{ 
      'game-mode': isGameStep,
      'panel-hidden': isGameStep && isPanelHidden
    }"
  >
    <!-- Toggle Button - Shows when panel is hidden during game -->
    <button 
      v-if="isGameStep && isPanelHidden" 
      class="panel-toggle-btn"
      @click="isPanelHidden = false"
    >
      <span class="toggle-icon">📖</span>
      <span class="toggle-text">Info</span>
    </button>

    <!-- Panel Content -->
    <div v-show="!isGameStep || !isPanelHidden" class="panel-content">
      
      <!-- Header -->
      <header class="panel-header">
        <div class="header-left">
          <span class="step-icon">{{ stepIcon }}</span>
          <span class="step-type">{{ stepTypeLabel }}</span>
        </div>
        
        <!-- Close button during game mode -->
        <button 
          v-if="isGameStep" 
          class="close-btn"
          @click="isPanelHidden = true"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <!-- Scrollable Content Area -->
      <div class="panel-body">
        
        <!-- Game Step: Compact Instructions -->
        <template v-if="isGameStep">
          <div class="game-info-card">
            <h2 class="game-title">{{ currentStep?.title || 'Game Time: Interactive Challenge' }}</h2>
            
            <div class="game-instructions">
              <h3 class="instructions-label">How to Play:</h3>
              <ul class="instructions-list">
                <li>Follow the instructions in the game panel</li>
                <li>Complete all objectives to proceed</li>
                <li>Have fun learning!</li>
              </ul>
            </div>
          </div>
        </template>

        <!-- Regular Content Step -->
        <template v-else>
          <div class="content-area">
            <!-- Title -->
            <h1 v-if="currentStep?.title" class="content-title">
              {{ currentStep.title }}
            </h1>

            <!-- Main Content -->
            <div 
              v-if="currentStep?.content" 
              class="content-body prose"
              v-html="processedContent"
            ></div>

            <!-- Media -->
            <div v-if="currentStep?.media" class="content-media">
              <img 
                v-if="currentStep.media.type === 'image'" 
                :src="currentStep.media.url" 
                :alt="currentStep.media.alt || 'Content image'"
                class="media-image"
              />
              <video 
                v-else-if="currentStep.media.type === 'video'" 
                :src="currentStep.media.url" 
                controls
                class="media-video"
              ></video>
            </div>

            <!-- Tips/Notes -->
            <div v-if="currentStep?.tip" class="content-tip">
              <span class="tip-icon">💡</span>
              <p class="tip-text">{{ currentStep.tip }}</p>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer with Navigation -->
      <footer class="panel-footer">
        <button 
          class="nav-btn nav-btn-back"
          :disabled="!canGoBack"
          @click="$emit('go-back')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        
        <button 
          class="nav-btn nav-btn-finish"
          @click="$emit('finish')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Finish
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  currentStep: Object,
  stepIndex: Number,
  totalSteps: Number,
  canGoBack: { type: Boolean, default: true },
  isGameStep: { type: Boolean, default: false }
});

const emit = defineEmits(['go-back', 'finish']);

// Panel visibility state for games
const isPanelHidden = ref(false);

// Auto-hide panel when entering game mode on mobile
watch(() => props.isGameStep, (isGame) => {
  if (isGame && window.innerWidth < 768) {
    isPanelHidden.value = true;
  } else {
    isPanelHidden.value = false;
  }
}, { immediate: true });

// Step icon based on type
const stepIcon = computed(() => {
  if (props.isGameStep) return '🎮';
  const type = props.currentStep?.type;
  switch (type) {
    case 'video': return '🎬';
    case 'quiz': return '❓';
    case 'exercise': return '✏️';
    case 'reading': return '📖';
    default: return '📚';
  }
});

// Step type label
const stepTypeLabel = computed(() => {
  if (props.isGameStep) return 'Game';
  const type = props.currentStep?.type;
  switch (type) {
    case 'video': return 'Video';
    case 'quiz': return 'Quiz';
    case 'exercise': return 'Exercise';
    case 'reading': return 'Reading';
    case 'content': return 'Lesson';
    default: return 'Content';
  }
});

// Process markdown content
const processedContent = computed(() => {
  if (!props.currentStep?.content) return '';
  if (typeof props.currentStep.content === 'string') {
    return marked(props.currentStep.content);
  }
  return props.currentStep.content;
});
</script>

<style scoped>
/* ============================================
   CONTENT PANEL - Base Styles
   ============================================ */
.content-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  position: relative;
  transition: all 0.3s ease;
}

.panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ============================================
   GAME MODE - Panel Collapses on Mobile
   ============================================ */
.content-panel.game-mode {
  /* On mobile, take minimal space */
}

.content-panel.panel-hidden {
  /* Hidden state - just show toggle button */
  position: absolute;
  top: 8px;
  left: 8px;
  width: auto;
  height: auto;
  background: transparent;
  z-index: 50;
}

/* Toggle Button */
.panel-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: none;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: all 0.2s;
}

.panel-toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.toggle-icon {
  font-size: 16px;
}

/* ============================================
   HEADER
   ============================================ */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-icon {
  font-size: 18px;
}

.step-type {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border: none;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

/* ============================================
   BODY - Scrollable Content
   ============================================ */
.panel-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}

/* Game Info Card */
.game-info-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 16px;
  padding: 20px;
}

.game-title {
  font-size: 18px;
  font-weight: 700;
  color: #0c4a6e;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.game-title::before {
  content: '🎮';
  font-size: 20px;
}

.game-instructions {
  background: white;
  border-radius: 12px;
  padding: 14px;
}

.instructions-label {
  font-size: 13px;
  font-weight: 600;
  color: #0369a1;
  margin: 0 0 10px 0;
}

.instructions-list {
  margin: 0;
  padding-left: 20px;
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
}

.instructions-list li {
  margin-bottom: 6px;
}

.instructions-list li:last-child {
  margin-bottom: 0;
}

/* Regular Content Area */
.content-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
}

.content-body {
  font-size: 15px;
  line-height: 1.7;
  color: #475569;
}

.content-body :deep(h1),
.content-body :deep(h2),
.content-body :deep(h3) {
  color: #1e293b;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.content-body :deep(p) {
  margin: 0 0 1em 0;
}

.content-body :deep(ul),
.content-body :deep(ol) {
  margin: 0 0 1em 0;
  padding-left: 1.5em;
}

.content-body :deep(code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.content-body :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

/* Media */
.content-media {
  margin: 8px 0;
}

.media-image,
.media-video {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Tip */
.content-tip {
  display: flex;
  gap: 10px;
  background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
  border: 1px solid #fde047;
  border-radius: 12px;
  padding: 14px;
}

.tip-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.tip-text {
  margin: 0;
  font-size: 14px;
  color: #854d0e;
  line-height: 1.5;
}

/* ============================================
   FOOTER - Navigation Buttons
   ============================================ */
.panel-footer {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;
}

.nav-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
}

.nav-btn-back {
  background: #f1f5f9;
  color: #64748b;
}

.nav-btn-back:hover:not(:disabled) {
  background: #e2e8f0;
}

.nav-btn-back:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn-finish {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.nav-btn-finish:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

/* ============================================
   RESPONSIVE - Mobile Adjustments
   ============================================ */
@media (max-width: 768px) {
  .content-panel.game-mode:not(.panel-hidden) {
    /* When visible during game, show as overlay */
    position: absolute;
    inset: 0;
    z-index: 40;
    background: white;
  }
  
  .panel-header {
    padding: 10px 14px;
  }
  
  .panel-body {
    padding: 14px;
  }
  
  .panel-footer {
    padding: 10px 14px;
  }
  
  .content-title {
    font-size: 20px;
  }
  
  .content-body {
    font-size: 14px;
  }
}

/* Very small screens */
@media (max-width: 380px) {
  .game-info-card {
    padding: 14px;
  }
  
  .game-title {
    font-size: 16px;
  }
  
  .instructions-list {
    font-size: 12px;
  }
}
</style>