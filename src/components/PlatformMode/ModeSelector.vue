<template>
  <div class="mode-selector-overlay">
    <div class="mode-selector-container">
      <!-- Header -->
      <div class="mode-selector-header">
        <h1 class="main-title">Choose Your Learning Adventure</h1>
        <p class="subtitle">Select the learning mode that best fits your goals</p>
      </div>

      <!-- Mode Cards -->
      <div class="mode-cards">
        <!-- School Mode Card -->
        <div
          class="mode-card school-mode"
          :class="{ selected: selectedMode === 'school' }"
          @click="selectMode('school')"
        >
          <div class="mode-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h2 class="mode-title">SCHOOL MODE</h2>
          <p class="mode-description">Structured learning path with clear progression</p>

          <ul class="mode-features">
            <li>
              <span class="feature-icon">✓</span>
              <span>Structured curriculum</span>
            </li>
            <li>
              <span class="feature-icon">✓</span>
              <span>Level-based progression</span>
            </li>
            <li>
              <span class="feature-icon">✓</span>
              <span>Certificates & achievements</span>
            </li>
            <li>
              <span class="feature-icon">✓</span>
              <span>Placement test to find your level</span>
            </li>
            <li>
              <span class="feature-icon">✓</span>
              <span>Perfect for systematic learning</span>
            </li>
          </ul>

          <button
            class="select-btn"
            :class="{ active: selectedMode === 'school' }"
            @click.stop="confirmMode('school')"
          >
            {{ selectedMode === 'school' ? 'Take Placement Test' : 'Select School Mode' }}
          </button>

          <div v-if="selectedMode === 'school'" class="selection-indicator">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <!-- Study Centre Mode Card -->
        <div
          class="mode-card study-centre-mode"
          :class="{ selected: selectedMode === 'study_centre' }"
          @click="selectMode('study_centre')"
        >
          <div class="mode-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 class="mode-title">STUDY CENTRE</h2>
          <p class="mode-description">Freedom to explore and learn at your own pace</p>

          <ul class="mode-features">
            <li>
              <span class="feature-icon">✓</span>
              <span>Full catalog access</span>
            </li>
            <li>
              <span class="feature-icon">✓</span>
              <span>Learn anything, anytime</span>
            </li>
            <li>
              <span class="feature-icon">✓</span>
              <span>No restrictions or prerequisites</span>
            </li>
            <li>
              <span class="feature-icon">✓</span>
              <span>Create personal learning paths</span>
            </li>
            <li>
              <span class="feature-icon">✓</span>
              <span>Perfect for self-directed learning</span>
            </li>
          </ul>

          <button
            class="select-btn"
            :class="{ active: selectedMode === 'study_centre' }"
            @click.stop="confirmMode('study_centre')"
          >
            {{ selectedMode === 'study_centre' ? 'Start Exploring' : 'Select Study Centre' }}
          </button>

          <div v-if="selectedMode === 'study_centre'" class="selection-indicator">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Can switch later note -->
      <p class="switch-note">
        Don't worry! You can switch modes anytime from your settings.
      </p>

      <!-- Loading state -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Setting up your learning experience...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { switchLearningMode } from '@/api/user';

export default {
  name: 'ModeSelector',

  setup() {
    const store = useStore();
    const router = useRouter();

    const selectedMode = ref(null);
    const isLoading = ref(false);

    const selectMode = (mode) => {
      selectedMode.value = mode;
    };

    const confirmMode = async (mode) => {
      if (isLoading.value) return;

      try {
        isLoading.value = true;

        const userId = store.getters.getFirebaseUserId;
        if (!userId) {
          throw new Error('User not authenticated');
        }

        // Save mode selection to backend
        const result = await switchLearningMode(userId, mode, 'Initial mode selection');

        if (result.success) {
          // Update Vuex store
          await store.dispatch('platformMode/switchMode', {
            newMode: mode,
            reason: 'Initial mode selection'
          });

          // Route based on mode
          if (mode === 'school') {
            // Redirect to placement test
            router.push({ name: 'PlacementTest' });
          } else {
            // Redirect to catalogue/dashboard
            router.push({ name: 'UpdatedCourses' });
          }
        } else {
          throw new Error(result.error || 'Failed to set learning mode');
        }
      } catch (error) {
        console.error('Error setting mode:', error);
        alert('Failed to set learning mode. Please try again.');
      } finally {
        isLoading.value = false;
      }
    };

    return {
      selectedMode,
      isLoading,
      selectMode,
      confirmMode
    };
  }
};
</script>

<style scoped>
.mode-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 1000;
  overflow-y: auto;
}

.mode-selector-container {
  max-width: 1200px;
  width: 100%;
  padding: 3rem 2rem;
  position: relative;
}

.mode-selector-header {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 1.25rem;
  opacity: 0.95;
  font-weight: 300;
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.mode-card {
  background: white;
  border-radius: 18px;
  padding: 2.5rem;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid transparent;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.mode-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.mode-card.selected {
  border-color: #8b5cf6;
  box-shadow: 0 20px 50px rgba(139, 92, 246, 0.4);
}

.mode-icon {
  width: 70px;
  height: 70px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.mode-icon svg {
  width: 40px;
  height: 40px;
  color: white;
}

.mode-title {
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.mode-description {
  text-align: center;
  color: #64748b;
  margin-bottom: 2rem;
  font-size: 1.05rem;
}

.mode-features {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
}

.mode-features li {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  color: #475569;
  font-size: 1rem;
}

.feature-icon {
  width: 24px;
  height: 24px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.select-btn {
  width: 100%;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.select-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.select-btn.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.selection-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
  animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.selection-indicator svg {
  width: 24px;
  height: 24px;
  color: white;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.switch-note {
  text-align: center;
  color: white;
  font-size: 0.95rem;
  opacity: 0.9;
  margin-top: 2rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  z-index: 10;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  color: #475569;
  font-size: 1.125rem;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .mode-cards {
    grid-template-columns: 1fr;
  }

  .mode-card {
    padding: 2rem;
  }

  .mode-title {
    font-size: 1.5rem;
  }
}
</style>
