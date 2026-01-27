<template>
  <div class="mode-choice-overlay light-theme-v2" v-if="isVisible">
    <div class="mode-choice-modal">
      <h2 class="modal-title">{{ $t('modeChoice.chooseYourPath') }}</h2>
      <p class="modal-subtitle">{{ $t('modeChoice.selectHowToLearn') }}</p>

      <div class="mode-cards">
        <!-- School Mode -->
        <div 
          class="mode-card school"
          :class="{ selected: selectedMode === 'school' }"
          @click="selectMode('school')"
        >
          <div class="mode-icon">🏫</div>
          <h3 class="mode-title">{{ $t('modeChoice.acedSchool') }}</h3>
          <p class="mode-description">{{ $t('modeChoice.structuredCurriculum') }}</p>
          <div class="mode-features">
            <span class="feature-tag">📚 Grades 1-11</span>
            <span class="feature-tag">📝 Exams</span>
            <span class="feature-tag">🎯 Curriculum</span>
          </div>
          <div class="selection-indicator" v-if="selectedMode === 'school'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#10b981"/>
              <path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- Study Centre Mode -->
        <div 
          class="mode-card study-centre"
          :class="{ selected: selectedMode === 'studyCentre' }"
          @click="selectMode('studyCentre')"
        >
          <div class="mode-icon">📚</div>
          <h3 class="mode-title">{{ $t('modeChoice.acedStudyCentre') }}</h3>
          <p class="mode-description">{{ $t('modeChoice.freeExploration') }}</p>
          <div class="mode-features">
            <span class="feature-tag">🌟 All Levels</span>
            <span class="feature-tag">🎮 Gamified</span>
            <span class="feature-tag">🚀 Self-paced</span>
          </div>
          <div class="selection-indicator" v-if="selectedMode === 'studyCentre'">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#8b5cf6"/>
              <path d="M8 12l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <button 
        class="confirm-btn"
        :disabled="!selectedMode || isLoading"
        @click="confirmSelection"
      >
        <span v-if="isLoading">{{ $t('modeChoice.settingUp') }}</span>
        <span v-else>{{ $t('modeChoice.continue') }}</span>
        <svg v-if="!isLoading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModeChoice',
  props: {
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      selectedMode: null,
      isLoading: false
    }
  },
  methods: {
    selectMode(mode) {
      this.selectedMode = mode
    },
    async confirmSelection() {
      if (!this.selectedMode) return
      
      this.isLoading = true
      
      try {
        await this.$emit('modeSelected', this.selectedMode)
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        this.$emit('close')
      } catch (error) {
        console.error('Error setting mode:', error)
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
/* Light theme v2 - Updated 2025-12-27 */
.mode-choice-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.mode-choice-modal {
  background: #ffffff;
  border-radius: 24px;
  padding: 2.5rem;
  max-width: 700px;
  width: 100%;
  border: 1px solid #e2e8f0;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.1);
}

.modal-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.modal-subtitle {
  text-align: center;
  color: #64748b;
  margin-bottom: 2rem;
}

.mode-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.mode-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  padding: 1.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.mode-card:hover {
  transform: translateY(-4px);
  border-color: #cbd5e1;
}

.mode-card.school:hover,
.mode-card.school.selected {
  border-color: #3b82f6;
  background: #eff6ff;
}

.mode-card.study-centre:hover,
.mode-card.study-centre.selected {
  border-color: #8b5cf6;
  background: #f3e8ff;
}

.mode-card.selected {
  transform: translateY(-4px);
}

.mode-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.mode-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.mode-description {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.mode-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.feature-tag {
  background: #e2e8f0;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  color: #475569;
}

.selection-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.confirm-btn {
  width: 100%;
  padding: 1.125rem;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(139, 92, 246, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .mode-choice-modal {
    padding: 1.5rem;
  }

  .modal-title {
    font-size: 1.5rem;
  }

  .mode-cards {
    grid-template-columns: 1fr;
  }

  .mode-icon {
    font-size: 2.5rem;
  }
}
</style>