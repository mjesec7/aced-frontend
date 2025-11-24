// src/composables/useSelectionGame.js
import { ref, computed } from 'vue';

export function useSelectionGame(lessonData) {
  // State
  const score = ref(0);
  const currentQuestionIndex = ref(0);
  const selectedItemId = ref(null);
  const feedback = ref(null); // 'correct', 'incorrect', or null

  // Extract questions from the lesson data
  // Expected structure: lessonData.questions = [{ targetId: '1', items: [...] }]
  const questions = computed(() => lessonData?.questions || []);
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);

  // Check if the game is finished
  const isComplete = computed(() =>
    currentQuestionIndex.value >= questions.value.length - 1 && feedback.value === 'correct'
  );

  const handleSelection = (item) => {
    // Prevent interaction if feedback is currently showing
    if (feedback.value) return;

    selectedItemId.value = item.id;

    if (item.id === currentQuestion.value.targetId) {
      // Correct Answer
      feedback.value = 'correct';
      score.value++;

      // Auto-advance after 1.5 seconds
      setTimeout(() => {
        if (currentQuestionIndex.value < questions.value.length - 1) {
          nextQuestion();
        } else {
          // Game Completed state is handled by the template using isComplete
        }
      }, 1500);
    } else {
      // Incorrect Answer
      feedback.value = 'incorrect';

      // Reset selection after 1 second
      setTimeout(() => {
        selectedItemId.value = null;
        feedback.value = null;
      }, 1000);
    }
  };

  const nextQuestion = () => {
    currentQuestionIndex.value++;
    selectedItemId.value = null;
    feedback.value = null;
  };

  const resetGame = () => {
    currentQuestionIndex.value = 0;
    score.value = 0;
    selectedItemId.value = null;
    feedback.value = null;
  };

  return {
    score,
    currentQuestion,
    currentQuestionIndex,
    questions,
    selectedItemId,
    feedback,
    isComplete,
    handleSelection,
    resetGame
  };
}
