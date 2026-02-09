<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="rating-modal-overlay" @click.self="close">
        <div class="rating-modal">
          <button class="close-btn" @click="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          <div class="modal-content">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>

            <h2 class="modal-title">{{ $t('catalogue.rateLesson') }}</h2>
            <p class="modal-subtitle">{{ lessonName }}</p>

            <div class="star-rating">
              <button
                v-for="star in 5"
                :key="star"
                class="star-btn"
                :class="{ active: star <= (hoveredStar || selectedRating) }"
                @mouseenter="hoveredStar = star"
                @mouseleave="hoveredStar = 0"
                @click="selectRating(star)"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </button>
            </div>

            <p class="rating-label">{{ getRatingLabel }}</p>

            <textarea
              v-model="feedback"
              class="feedback-input"
              :placeholder="$t('rating.feedbackPlaceholder') || 'Share your thoughts (optional)...'"
              rows="3"
            ></textarea>

            <div class="modal-actions">
              <button class="skip-btn" @click="close">
                {{ $t('common.skip') || 'Skip' }}
              </button>
              <button
                class="submit-btn"
                :disabled="!selectedRating || isSubmitting"
                @click="submitRating"
              >
                <span v-if="isSubmitting" class="spinner"></span>
                <span v-else>{{ $t('catalogue.submitRating') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  name: 'RatingModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    lessonId: {
      type: String,
      default: ''
    },
    lessonName: {
      type: String,
      default: ''
    },
    courseId: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'submit'],
  data() {
    return {
      selectedRating: 0,
      hoveredStar: 0,
      feedback: '',
      isSubmitting: false
    };
  },
  computed: {
    getRatingLabel() {
      const labels = {
        1: this.$t('rating.terrible') || 'Terrible',
        2: this.$t('rating.poor') || 'Poor',
        3: this.$t('rating.okay') || 'Okay',
        4: this.$t('rating.good') || 'Good',
        5: this.$t('rating.excellent') || 'Excellent'
      };
      const rating = this.hoveredStar || this.selectedRating;
      return labels[rating] || '';
    }
  },
  methods: {
    selectRating(star) {
      this.selectedRating = star;
    },
    async submitRating() {
      if (!this.selectedRating) return;

      this.isSubmitting = true;

      try {
        // Emit the rating data to parent component
        this.$emit('submit', {
          lessonId: this.lessonId,
          courseId: this.courseId,
          rating: this.selectedRating,
          feedback: this.feedback
        });

        // Show success state briefly
        await new Promise(resolve => setTimeout(resolve, 500));
        this.close();
      } catch (error) {
        console.error('Failed to submit rating:', error);
      } finally {
        this.isSubmitting = false;
      }
    },
    close() {
      this.selectedRating = 0;
      this.hoveredStar = 0;
      this.feedback = '';
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.rating-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.rating-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.close-btn svg {
  width: 18px;
  height: 18px;
}

.modal-content {
  padding: 2rem;
  text-align: center;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.success-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1.5rem;
}

.star-rating {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 0.5rem;
}

.star-btn {
  width: 48px;
  height: 48px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s ease;
}

.star-btn:hover {
  transform: scale(1.1);
}

.star-btn svg {
  width: 100%;
  height: 100%;
  fill: #e2e8f0;
  stroke: none;
  transition: fill 0.2s ease;
}

.star-btn.active svg {
  fill: #fbbf24;
}

.rating-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #7c3aed;
  min-height: 1.5rem;
  margin-bottom: 1rem;
}

.feedback-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.875rem;
  resize: none;
  margin-bottom: 1.5rem;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.feedback-input:focus {
  outline: none;
  border-color: #a78bfa;
}

.feedback-input::placeholder {
  color: #94a3b8;
}

.modal-actions {
  display: flex;
  gap: 1rem;
}

.skip-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  background: #f1f5f9;
  color: #64748b;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.skip-btn:hover {
  background: #e2e8f0;
}

.submit-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .rating-modal,
.modal-fade-leave-to .rating-modal {
  transform: scale(0.9);
}
</style>
