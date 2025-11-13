<template>
  <div class="placement-test">
    <!-- Subject Selection Screen -->
    <div v-if="currentScreen === 'subject-select'" class="screen">
      <div class="container">
        <div class="header">
          <h1>Placement Test</h1>
          <p>Choose a subject to assess your current level</p>
        </div>

        <div class="subjects-grid">
          <button
            v-for="subject in availableSubjects"
            :key="subject.id"
            class="subject-card"
            @click="selectSubject(subject.id)"
          >
            <div class="subject-icon">{{ subject.icon }}</div>
            <div class="subject-name">{{ subject.name }}</div>
            <div class="subject-count">10 Questions</div>
          </button>
        </div>
      </div>
    </div>

    <!-- Test Screen -->
    <div v-else-if="currentScreen === 'test'" class="screen test-screen">
      <div class="test-wrapper">
        <div class="test-sidebar">
          <div class="test-info">
            <div class="subject-badge">
              <span class="badge-icon">{{ getSubjectIcon(selectedSubject) }}</span>
              <span class="badge-text">{{ selectedSubject }}</span>
            </div>
            <div class="progress-section">
              <div class="progress-label">Progress</div>
              <div class="progress-stats">{{ currentQuestionIndex + 1 }} / {{ totalQuestions }}</div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="test-main">
          <div class="question-container">
            <div class="question-header">
              <span class="question-number">Question {{ currentQuestionIndex + 1 }}</span>
            </div>

            <h2 class="question-text">{{ currentQuestion.question }}</h2>

            <div class="options-list">
              <button
                v-for="(option, index) in currentQuestion.options"
                :key="index"
                class="option-item"
                :class="{ selected: selectedAnswer === index }"
                @click="selectAnswer(index)"
              >
                <span class="option-radio">
                  <span class="radio-dot" v-if="selectedAnswer === index"></span>
                </span>
                <span class="option-label">{{ option }}</span>
              </button>
            </div>

            <div class="question-actions">
              <button
                class="btn-next"
                :disabled="selectedAnswer === null"
                @click="nextQuestion"
              >
                {{ currentQuestionIndex === totalQuestions - 1 ? 'Finish Test' : 'Next Question' }}
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Screen -->
    <div v-else-if="currentScreen === 'results'" class="screen">
      <div class="container results-container">
        <div class="results-header">
          <div class="results-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="#10B981" opacity="0.1"/>
              <path d="M20 32L28 40L44 24" stroke="#10B981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1>Test Complete!</h1>
          <p>You've completed the {{ selectedSubject }} placement test</p>
        </div>

        <div class="results-content">
          <div class="score-card">
            <div class="score-circle">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="#E5E7EB" stroke-width="12"/>
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#3B82F6"
                  stroke-width="12"
                  stroke-dasharray="565.48"
                  :stroke-dashoffset="565.48 - (565.48 * scorePercentage / 100)"
                  transform="rotate(-90 100 100)"
                  stroke-linecap="round"
                />
                <text x="100" y="95" text-anchor="middle" font-size="48" font-weight="700" fill="#111827">
                  {{ scorePercentage }}%
                </text>
                <text x="100" y="115" text-anchor="middle" font-size="14" fill="#6B7280">
                  Your Score
                </text>
              </svg>
            </div>

            <div class="level-badge">
              <span class="level-label">Recommended Level:</span>
              <span class="level-value">{{ recommendedLevel }}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon correct">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ correctAnswers }}</div>
                <div class="stat-label">Correct</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon wrong">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ wrongAnswers }}</div>
                <div class="stat-label">Wrong</div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon total">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalQuestions }}</div>
                <div class="stat-label">Total</div>
              </div>
            </div>
          </div>

          <div class="results-actions">
            <button class="btn-primary" @click="$router.push('/profile/catalogue')">
              Start Learning
            </button>
            <button class="btn-secondary" @click="retakeTest">
              Take Another Test
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import api from '@/api/core';
import { auth } from '@/firebase';

export default {
  name: 'PlacementTest',
  setup() {
    const router = useRouter();
    const store = useStore();

    const currentScreen = ref('subject-select');
    const selectedSubject = ref(null);
    const currentQuestionIndex = ref(0);
    const selectedAnswer = ref(null);
    const answers = ref([]);

    const availableSubjects = [
      { id: 'English', name: 'English', icon: '📚' },
      { id: 'Mathematics', name: 'Mathematics', icon: '🔢' },
      { id: 'Science', name: 'Science', icon: '🔬' },
      { id: 'Literature', name: 'Literature', icon: '📖' },
      { id: 'Physics', name: 'Physics', icon: '⚛️' },
      { id: 'Chemistry', name: 'Chemistry', icon: '🧪' },
      { id: 'Biology', name: 'Biology', icon: '🧬' }
    ];

    const questionBank = {
      English: [
        { question: "What is a noun?", options: ["A person, place, or thing", "An action word", "A describing word", "A connecting word"], correct: 0, difficulty: 1 },
        { question: "Which sentence is correct?", options: ["He don't like pizza", "He doesn't likes pizza", "He doesn't like pizza", "He not like pizza"], correct: 2, difficulty: 2 },
        { question: "What is a synonym for 'happy'?", options: ["Sad", "Joyful", "Angry", "Tired"], correct: 1, difficulty: 1 },
        { question: "Identify the verb: 'The cat sleeps on the mat'", options: ["cat", "sleeps", "mat", "the"], correct: 1, difficulty: 2 },
        { question: "What is an adjective?", options: ["Action word", "Describing word", "Person or thing", "Connecting word"], correct: 1, difficulty: 1 },
        { question: "Choose the correct form: 'I ___ to school yesterday'", options: ["go", "goes", "went", "going"], correct: 2, difficulty: 2 },
        { question: "What is a metaphor?", options: ["Direct comparison using like/as", "Exaggeration", "Comparison without like/as", "Sound words"], correct: 2, difficulty: 3 },
        { question: "Which word is spelled correctly?", options: ["recieve", "receive", "recive", "receeve"], correct: 1, difficulty: 2 },
        { question: "What is alliteration?", options: ["Rhyming words", "Repeated consonant sounds", "Opposite meanings", "Similar meanings"], correct: 1, difficulty: 3 },
        { question: "Identify the subject: 'The quick brown fox jumps'", options: ["quick", "brown", "fox", "jumps"], correct: 2, difficulty: 2 }
      ],
      Mathematics: [
        { question: "What is 5 + 7?", options: ["10", "11", "12", "13"], correct: 2, difficulty: 1 },
        { question: "What is 15 - 8?", options: ["6", "7", "8", "9"], correct: 1, difficulty: 1 },
        { question: "What is 6 × 4?", options: ["20", "22", "24", "26"], correct: 2, difficulty: 2 },
        { question: "What is 36 ÷ 6?", options: ["5", "6", "7", "8"], correct: 1, difficulty: 2 },
        { question: "What is 25% of 80?", options: ["15", "20", "25", "30"], correct: 1, difficulty: 3 },
        { question: "Solve: 3x + 5 = 20", options: ["x = 3", "x = 5", "x = 10", "x = 15"], correct: 1, difficulty: 4 },
        { question: "What is the area of a rectangle 5cm × 8cm?", options: ["13 cm²", "26 cm²", "40 cm²", "80 cm²"], correct: 2, difficulty: 3 },
        { question: "What is √144?", options: ["10", "11", "12", "13"], correct: 2, difficulty: 3 },
        { question: "If y = 2x + 3, what is y when x = 4?", options: ["9", "10", "11", "12"], correct: 2, difficulty: 4 },
        { question: "What is the perimeter of a square with side 7cm?", options: ["14 cm", "21 cm", "28 cm", "49 cm"], correct: 2, difficulty: 2 }
      ],
      Science: [
        { question: "What is H2O?", options: ["Oxygen", "Water", "Hydrogen", "Carbon dioxide"], correct: 1, difficulty: 1 },
        { question: "How many planets are in our solar system?", options: ["7", "8", "9", "10"], correct: 1, difficulty: 1 },
        { question: "What gas do plants produce?", options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"], correct: 2, difficulty: 2 },
        { question: "What is the center of an atom called?", options: ["Electron", "Proton", "Neutron", "Nucleus"], correct: 3, difficulty: 3 },
        { question: "What is the boiling point of water?", options: ["0°C", "50°C", "100°C", "150°C"], correct: 2, difficulty: 2 },
        { question: "What is photosynthesis?", options: ["Plant breathing", "Plant eating", "Plant making food", "Plant growing"], correct: 2, difficulty: 2 },
        { question: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"], correct: 0, difficulty: 4 },
        { question: "What is DNA?", options: ["A type of protein", "Genetic material", "A cell part", "An enzyme"], correct: 1, difficulty: 3 },
        { question: "What causes seasons on Earth?", options: ["Distance from sun", "Earth's tilt", "Moon phases", "Solar flares"], correct: 1, difficulty: 3 },
        { question: "What is an ecosystem?", options: ["A type of animal", "Living and non-living things interacting", "A food chain", "A habitat"], correct: 1, difficulty: 3 }
      ],
      Literature: [
        { question: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], correct: 1, difficulty: 2 },
        { question: "What is a protagonist?", options: ["Main character", "Villain", "Setting", "Theme"], correct: 0, difficulty: 2 },
        { question: "What is a haiku?", options: ["Long story", "Short poem", "Play", "Novel"], correct: 1, difficulty: 2 },
        { question: "Who wrote '1984'?", options: ["George Orwell", "Aldous Huxley", "Ray Bradbury", "H.G. Wells"], correct: 0, difficulty: 3 },
        { question: "What is an antagonist?", options: ["Hero", "Opponent of hero", "Setting", "Narrator"], correct: 1, difficulty: 2 },
        { question: "What is foreshadowing?", options: ["Past events", "Hints about future", "Character description", "Setting details"], correct: 1, difficulty: 3 },
        { question: "Who wrote 'Pride and Prejudice'?", options: ["Emily Brontë", "Jane Austen", "Charlotte Brontë", "Virginia Woolf"], correct: 1, difficulty: 3 },
        { question: "What is a sonnet?", options: ["14-line poem", "Short story", "Long novel", "Three-act play"], correct: 0, difficulty: 3 },
        { question: "What is irony?", options: ["Rhyming words", "Opposite of what's expected", "Comparison", "Repetition"], correct: 1, difficulty: 3 },
        { question: "Who wrote 'The Great Gatsby'?", options: ["Ernest Hemingway", "F. Scott Fitzgerald", "John Steinbeck", "William Faulkner"], correct: 1, difficulty: 3 }
      ],
      Physics: [
        { question: "What is the SI unit of force?", options: ["Joule", "Newton", "Watt", "Pascal"], correct: 1, difficulty: 2 },
        { question: "What is Newton's First Law?", options: ["F = ma", "Object at rest stays at rest", "Action-reaction", "Gravity"], correct: 1, difficulty: 3 },
        { question: "What is the formula for velocity?", options: ["v = d/t", "v = m/t", "v = f × λ", "v = at"], correct: 0, difficulty: 2 },
        { question: "What is kinetic energy?", options: ["Stored energy", "Energy of motion", "Heat energy", "Light energy"], correct: 1, difficulty: 3 },
        { question: "What is acceleration?", options: ["Speed", "Distance over time", "Change in velocity", "Force"], correct: 2, difficulty: 2 },
        { question: "What is the unit of power?", options: ["Joule", "Watt", "Newton", "Ampere"], correct: 1, difficulty: 3 },
        { question: "What is potential energy?", options: ["Motion energy", "Stored energy", "Heat energy", "Sound energy"], correct: 1, difficulty: 2 },
        { question: "What is the speed of sound in air?", options: ["343 m/s", "3000 m/s", "300,000 km/s", "150 m/s"], correct: 0, difficulty: 4 },
        { question: "What is momentum?", options: ["Force", "Mass × velocity", "Energy", "Acceleration"], correct: 1, difficulty: 3 },
        { question: "What is gravity on Earth?", options: ["8.8 m/s²", "9.8 m/s²", "10.8 m/s²", "11.8 m/s²"], correct: 1, difficulty: 2 }
      ],
      Chemistry: [
        { question: "What is the chemical symbol for Gold?", options: ["Go", "Gd", "Au", "Ag"], correct: 2, difficulty: 2 },
        { question: "What is an atom?", options: ["Smallest unit of element", "A molecule", "A compound", "An ion"], correct: 0, difficulty: 2 },
        { question: "What is H2SO4?", options: ["Hydrochloric acid", "Sulfuric acid", "Nitric acid", "Carbonic acid"], correct: 1, difficulty: 3 },
        { question: "What is a molecule?", options: ["Single atom", "Two or more atoms bonded", "An ion", "An element"], correct: 1, difficulty: 2 },
        { question: "What is the pH of a neutral solution?", options: ["0", "7", "14", "1"], correct: 1, difficulty: 2 },
        { question: "What is NaCl?", options: ["Sugar", "Salt", "Water", "Acid"], correct: 1, difficulty: 1 },
        { question: "What is oxidation?", options: ["Gain electrons", "Lose electrons", "Gain protons", "Lose neutrons"], correct: 1, difficulty: 4 },
        { question: "What is the symbol for Iron?", options: ["Ir", "Fe", "In", "Fr"], correct: 1, difficulty: 2 },
        { question: "What is a catalyst?", options: ["Speeds up reaction", "Slows reaction", "Stops reaction", "Creates reaction"], correct: 0, difficulty: 3 },
        { question: "What is CO2?", options: ["Carbon monoxide", "Carbon dioxide", "Calcium oxide", "Cobalt"], correct: 1, difficulty: 1 }
      ],
      Biology: [
        { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"], correct: 1, difficulty: 2 },
        { question: "What is DNA short for?", options: ["Deoxyribonucleic acid", "Dinitrogen acid", "Dynamic nuclear acid", "Dextrose acid"], correct: 0, difficulty: 3 },
        { question: "What do red blood cells carry?", options: ["Nutrients", "Oxygen", "Waste", "Hormones"], correct: 1, difficulty: 2 },
        { question: "What is the largest organ?", options: ["Heart", "Brain", "Skin", "Liver"], correct: 2, difficulty: 2 },
        { question: "What is photosynthesis?", options: ["Cell division", "Making food from sunlight", "Respiration", "Digestion"], correct: 1, difficulty: 2 },
        { question: "How many chromosomes do humans have?", options: ["23", "46", "48", "52"], correct: 1, difficulty: 3 },
        { question: "What is an enzyme?", options: ["Protein that speeds reactions", "Type of cell", "Hormone", "Vitamin"], correct: 0, difficulty: 3 },
        { question: "What is evolution?", options: ["Growth", "Change over time", "Reproduction", "Adaptation"], correct: 1, difficulty: 3 },
        { question: "What is osmosis?", options: ["Cell division", "Water movement across membrane", "Protein synthesis", "Energy production"], correct: 1, difficulty: 4 },
        { question: "What are genes made of?", options: ["Proteins", "DNA", "RNA", "Lipids"], correct: 1, difficulty: 3 }
      ]
    };

    const questions = ref([]);
    const totalQuestions = computed(() => questions.value.length);
    const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);
    const progressPercentage = computed(() => ((currentQuestionIndex.value + 1) / totalQuestions.value) * 100);

    const correctAnswers = computed(() => answers.value.filter(a => a.correct).length);
    const wrongAnswers = computed(() => answers.value.length - correctAnswers.value);
    const scorePercentage = computed(() => Math.round((correctAnswers.value / answers.value.length) * 100));
    const recommendedLevel = computed(() => {
      const percentage = scorePercentage.value;
      if (percentage >= 90) return 'Advanced';
      if (percentage >= 75) return 'Intermediate';
      if (percentage >= 60) return 'Pre-Intermediate';
      return 'Beginner';
    });

    const getSubjectIcon = (subjectId) => {
      const subject = availableSubjects.find(s => s.id === subjectId);
      return subject ? subject.icon : '📚';
    };

    const selectSubject = (subject) => {
      selectedSubject.value = subject;
      questions.value = questionBank[subject];
      currentScreen.value = 'test';
    };

    const selectAnswer = (index) => {
      selectedAnswer.value = index;
    };

    const nextQuestion = () => {
      if (selectedAnswer.value === null) return;

      const isCorrect = selectedAnswer.value === currentQuestion.value.correct;
      answers.value.push({
        questionIndex: currentQuestionIndex.value,
        selectedAnswer: selectedAnswer.value,
        correctAnswer: currentQuestion.value.correct,
        correct: isCorrect
      });

      if (currentQuestionIndex.value < totalQuestions.value - 1) {
        currentQuestionIndex.value++;
        selectedAnswer.value = null;
      } else {
        finishTest();
      }
    };

    const finishTest = async () => {
      currentScreen.value = 'results';

      // Send results to backend
      try {
        const token = await auth.currentUser?.getIdToken();
        const userId = store.state.firebaseUserId || localStorage.getItem('firebaseUserId');

        if (token && userId) {
          // Send to existing endpoint with subject parameter
          await api.post(`learning-mode/placement-test/${userId}/complete`, {
            subject: selectedSubject.value,
            totalQuestions: totalQuestions.value,
            correctAnswers: correctAnswers.value,
            wrongAnswers: wrongAnswers.value,
            scorePercentage: scorePercentage.value,
            recommendedLevel: recommendedLevel.value,
            answers: answers.value
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (error) {
        console.error('Failed to submit results:', error);
        // Fail silently - results are shown to user regardless
      }
    };

    const retakeTest = () => {
      currentQuestionIndex.value = 0;
      selectedAnswer.value = null;
      answers.value = [];
      currentScreen.value = 'subject-select';
    };

    return {
      currentScreen,
      availableSubjects,
      selectedSubject,
      currentQuestion,
      currentQuestionIndex,
      totalQuestions,
      selectedAnswer,
      progressPercentage,
      correctAnswers,
      wrongAnswers,
      scorePercentage,
      recommendedLevel,
      getSubjectIcon,
      selectSubject,
      selectAnswer,
      nextQuestion,
      retakeTest
    };
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.placement-test {
  min-height: 100vh;
  background: #F9FAFB;
}

.screen {
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.header p {
  font-size: 1.125rem;
  color: #6B7280;
  margin: 0;
}

/* Subject Selection */
.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.subject-card {
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.subject-card:hover {
  border-color: #3B82F6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.subject-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.subject-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.subject-count {
  font-size: 0.875rem;
  color: #6B7280;
}

/* Test Screen */
.test-screen {
  padding: 0;
  align-items: stretch;
}

.test-wrapper {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.test-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #E5E7EB;
  padding: 2rem;
}

.test-info {
  position: sticky;
  top: 2rem;
}

.subject-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #F3F4F6;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.badge-icon {
  font-size: 1.5rem;
}

.badge-text {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.progress-section {
  padding: 1.5rem;
  background: #F9FAFB;
  border-radius: 8px;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6B7280;
  margin-bottom: 0.5rem;
}

.progress-stats {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
}

.progress-bar {
  height: 8px;
  background: #E5E7EB;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3B82F6;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.test-main {
  flex: 1;
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-container {
  width: 100%;
  max-width: 700px;
}

.question-header {
  margin-bottom: 1.5rem;
}

.question-number {
  font-size: 0.875rem;
  font-weight: 600;
  color: #3B82F6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.question-text {
  font-size: 1.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 2.5rem 0;
  line-height: 1.3;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.option-item:hover {
  border-color: #3B82F6;
  background: #F9FAFB;
}

.option-item.selected {
  border-color: #3B82F6;
  background: #EFF6FF;
}

.option-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #D1D5DB;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.option-item.selected .option-radio {
  border-color: #3B82F6;
}

.radio-dot {
  width: 10px;
  height: 10px;
  background: #3B82F6;
  border-radius: 50%;
}

.option-label {
  flex: 1;
  font-size: 1.0625rem;
  color: #374151;
  font-weight: 500;
  line-height: 1.5;
}

.question-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-next {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-next:hover:not(:disabled) {
  background: #2563EB;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-next:disabled {
  background: #D1D5DB;
  cursor: not-allowed;
  transform: none;
}

/* Results */
.results-container {
  max-width: 800px;
}

.results-header {
  text-align: center;
  margin-bottom: 3rem;
}

.results-icon {
  margin: 0 auto 1.5rem;
  width: 64px;
  height: 64px;
}

.results-header h1 {
  font-size: 2.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.results-header p {
  font-size: 1.125rem;
  color: #6B7280;
  margin: 0;
}

.results-content {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  border: 1px solid #E5E7EB;
}

.score-card {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 3rem;
  border-bottom: 1px solid #E5E7EB;
}

.score-circle {
  margin: 0 auto 2rem;
  width: 200px;
  height: 200px;
}

.level-badge {
  display: inline-flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: #F9FAFB;
  border-radius: 8px;
}

.level-label {
  font-size: 0.875rem;
  color: #6B7280;
  font-weight: 500;
}

.level-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3B82F6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #F9FAFB;
  border-radius: 8px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}

.stat-icon.correct {
  background: #D1FAE5;
  color: #059669;
}

.stat-icon.wrong {
  background: #FEE2E2;
  color: #DC2626;
}

.stat-icon.total {
  background: #DBEAFE;
  color: #2563EB;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6B7280;
  font-weight: 500;
}

.results-actions {
  display: flex;
  gap: 1rem;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3B82F6;
  color: white;
}

.btn-primary:hover {
  background: #2563EB;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
  background: #F3F4F6;
  color: #374151;
}

.btn-secondary:hover {
  background: #E5E7EB;
}

@media (max-width: 1024px) {
  .test-wrapper {
    flex-direction: column;
  }

  .test-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #E5E7EB;
    padding: 1.5rem;
  }

  .test-info {
    position: static;
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .subject-badge {
    margin-bottom: 0;
  }

  .test-main {
    padding: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .results-actions {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .header h1 {
    font-size: 2rem;
  }

  .question-text {
    font-size: 1.5rem;
  }

  .subjects-grid {
    grid-template-columns: 1fr;
  }

  .results-content {
    padding: 2rem 1.5rem;
  }
}
</style>
