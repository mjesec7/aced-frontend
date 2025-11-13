<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <!-- Close Button -->
          <button class="close-btn" @click="closeModal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- Lock Icon -->
          <div class="lock-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <!-- Title and Message -->
          <h2 class="modal-title">Content Locked</h2>
          <p class="modal-message">{{ message || lockReason }}</p>

          <!-- Level Info -->
          <div class="level-info">
            <div class="info-row">
              <span class="info-label">Your Current Level:</span>
              <span class="info-value current">{{ currentLevelCap }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Required Level:</span>
              <span class="info-value required">{{ requiredLevel }}</span>
            </div>
            <div v-if="currentGrade" class="info-row">
              <span class="info-label">Your Grade:</span>
              <span class="info-value grade" :style="{ color: getGradeBadgeColor(currentGrade) }">
                {{ currentGrade }}
              </span>
            </div>
          </div>

          <!-- Progress Info -->
          <div v-if="showProgress" class="progress-section">
            <div class="progress-header">
              <span>Current Level Progress</span>
              <span class="progress-percent">{{ levelProgress }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: levelProgress + '%' }"></div>
            </div>
          </div>

          <!-- Next Steps -->
          <div class="next-steps">
            <h3>How to Unlock:</h3>
            <ul>
              <li v-if="!placementTestTaken">
                Complete the placement test to unlock levels
              </li>
              <li v-else>
                Complete Level {{ currentLevelCap }} to unlock Level {{ currentLevelCap + 1 }}
              </li>
              <li>Earn at least {{ minPassingScore }}% on all lessons in your current level</li>
              <li>Maintain consistent progress and practice regularly</li>
            </ul>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button
              v-if="!placementTestTaken"
              class="primary-btn"
              @click="takePlacementTest"
            >
              Take Placement Test
            </button>
            <button
              v-else
              class="primary-btn"
              @click="goToCurrentLevel"
            >
              Continue Level {{ currentLevelCap }}
            </button>

            <button class="secondary-btn" @click="switchToStudyCentre">
              Switch to Study Centre Mode
            </button>
          </div>

          <!-- Info Note -->
          <p class="info-note">
            💡 <strong>Tip:</strong> In Study Centre mode, you can explore all content without restrictions!
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useLevelSystem } from '@/composables/useLevelSystem';

export default {
  name: 'LockedContentModal',

  props: {
    show: {
      type: Boolean,
      default: false
    },
    requiredLevel: {
      type: Number,
      default: null
    },
    message: {
      type: String,
      default: ''
    },
    showProgress: {
      type: Boolean,
      default: true
    }
  },

  emits: ['close', 'takePlacementTest', 'switchMode'],

  setup(props, { emit }) {
    const router = useRouter();
    const store = useStore();
    const {
      currentGrade,
      currentLevelCap,
      levelProgress,
      placementTestTaken,
      getLockReason,
      getGradeBadgeColor
    } = useLevelSystem();

    const minPassingScore = computed(() => {
      return store.getters['platformMode/schoolProfile']?.minPassingScore || 70;
    });

    const lockReason = computed(() => {
      return getLockReason(props.requiredLevel);
    });

    const closeModal = () => {
      emit('close');
    };

    const takePlacementTest = () => {
      emit('takePlacementTest');
      router.push({ name: 'PlacementTest' });
      closeModal();
    };

    const goToCurrentLevel = () => {
      router.push({ name: 'UpdatedCourses', query: { level: currentLevelCap.value } });
      closeModal();
    };

    const switchToStudyCentre = () => {
      emit('switchMode', 'study_centre');
      closeModal();
    };

    return {
      currentGrade,
      currentLevelCap,
      levelProgress,
      placementTestTaken,
      minPassingScore,
      lockReason,
      getGradeBadgeColor,
      closeModal,
      takePlacementTest,
      goToCurrentLevel,
      switchToStudyCentre
    };
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 18px;
  padding: 2.5rem;
  max-width: 550px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #64748b;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #1e293b;
  transform: rotate(90deg);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.lock-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(251, 191, 36, 0.3);
}

.lock-icon svg {
  width: 45px;
  height: 45px;
  color: white;
}

.modal-title {
  font-size: 1.875rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.75rem;
  color: #1e293b;
}

.modal-message {
  text-align: center;
  color: #64748b;
  font-size: 1.05rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.level-info {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.info-label {
  font-size: 0.95rem;
  color: #64748b;
}

.info-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.info-value.current {
  color: #8b5cf6;
}

.info-value.required {
  color: #ef4444;
}

.info-value.grade {
  font-size: 1.25rem;
}

.progress-section {
  margin-bottom: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  color: #64748b;
}

.progress-percent {
  font-weight: 700;
  color: #8b5cf6;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%);
  border-radius: 999px;
  transition: width 0.5s ease;
}

.next-steps {
  margin-bottom: 2rem;
}

.next-steps h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1e293b;
}

.next-steps ul {
  list-style: none;
  padding: 0;
}

.next-steps li {
  padding: 0.625rem 0;
  padding-left: 1.75rem;
  position: relative;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.5;
}

.next-steps li::before {
  content: "→";
  position: absolute;
  left: 0;
  color: #8b5cf6;
  font-weight: 700;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.primary-btn,
.secondary-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
}

.secondary-btn {
  background: white;
  color: #8b5cf6;
  border: 2px solid #8b5cf6;
}

.secondary-btn:hover {
  background: #f5f3ff;
  transform: translateY(-2px);
}

.info-note {
  background: #ede9fe;
  border-left: 4px solid #8b5cf6;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #5b21b6;
  line-height: 1.5;
}

.info-note strong {
  font-weight: 700;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    padding: 2rem;
    margin: 1rem;
  }

  .modal-title {
    font-size: 1.5rem;
  }

  .lock-icon {
    width: 60px;
    height: 60px;
  }

  .lock-icon svg {
    width: 35px;
    height: 35px;
  }

  .action-buttons {
    gap: 0.5rem;
  }

  .primary-btn,
  .secondary-btn {
    padding: 0.875rem 1.25rem;
    font-size: 0.95rem;
  }
}

/* Custom Scrollbar */
.modal-content::-webkit-scrollbar {
  width: 8px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
