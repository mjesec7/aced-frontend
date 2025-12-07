<template>
  <div class="mode-choice-card">
    <div class="choice-header">
      <h3>Choose Your Learning Path</h3>
      <p>Select how you'd like to learn on ACED</p>
    </div>

    <div class="mode-options">
      <button
        class="mode-option"
        :class="{ selected: selectedMode === 'school' }"
        @click="selectMode('school')"
      >
        <div class="mode-icon">🎓</div>
        <div class="mode-details">
          <h4>ACED School</h4>
          <p>Structured curriculum with level progression</p>
        </div>
      </button>

      <button
        class="mode-option"
        :class="{ selected: selectedMode === 'study_centre' }"
        @click="selectMode('study_centre')"
      >
        <div class="mode-icon">🌟</div>
        <div class="mode-details">
          <h4>ACED Study Centre</h4>
          <p>Free exploration, learn anything anytime</p>
        </div>
      </button>
    </div>

    <button
      v-if="selectedMode"
      class="confirm-btn"
      @click="confirmSelection"
      :disabled="isLoading"
    >
      {{ isLoading ? 'Setting up...' : 'Continue' }}
    </button>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { switchLearningMode } from '@/api/user';

export default {
  name: 'ModeChoice',

  setup() {
    const store = useStore();
    const selectedMode = ref(null);
    const isLoading = ref(false);

    const selectMode = (mode) => {
      selectedMode.value = mode;
    };

    const confirmSelection = async () => {
      if (!selectedMode.value || isLoading.value) return;

      try {
        isLoading.value = true;
        const userId = store.getters.getFirebaseUserId;

        // Try to save to backend (don't fail if endpoint doesn't exist)
        try {
          await switchLearningMode(userId, selectedMode.value, 'Initial selection');
        } catch (apiError) {
}

        // Always save to Vuex store
        await store.dispatch('platformMode/switchMode', {
          newMode: selectedMode.value,
          reason: 'Initial selection'
        });

        // If school mode and no placement test taken, could show a message
        // but don't force redirect

      } catch (error) {
} finally {
        isLoading.value = false;
      }
    };

    return {
      selectedMode,
      isLoading,
      selectMode,
      confirmSelection
    };
  }
};
</script>

<style scoped>
.mode-choice-card {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.choice-header {
  text-align: center;
  margin-bottom: 2rem;
}

.choice-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.choice-header p {
  color: #64748b;
  font-size: 0.95rem;
}

.mode-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.mode-option:hover {
  border-color: #8b5cf6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.mode-option.selected {
  border-color: #8b5cf6;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.mode-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.mode-details h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.mode-details p {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.4;
}

.confirm-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .mode-choice-card {
    padding: 1.5rem;
  }

  .mode-options {
    grid-template-columns: 1fr;
  }

  .choice-header h3 {
    font-size: 1.25rem;
  }
}
</style>
