<template>
  <div class="placement-test">
    <!-- Subject Selection Screen -->
    <div v-if="currentScreen === 'subject-select'" class="screen">
      <div class="container">
        <div class="card">
          <h1>Choose Your Subject</h1>
          <p class="subtitle">Select a subject to test your knowledge</p>

          <div class="subjects-grid">
            <button
              v-for="subject in availableSubjects"
              :key="subject.id"
              class="subject-card"
              @click="selectSubject(subject.id)"
            >
              <div class="subject-icon">{{ subject.icon }}</div>
              <div class="subject-name">{{ subject.name }}</div>
            </button>
          </div>

          <button class="back-link" @click="$router.push('/profile/main')">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>

    <!-- Test Screen -->
    <div v-else-if="currentScreen === 'test'" class="screen">
      <div class="test-container">
        <div class="test-header">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <div class="progress-text">Question {{ currentQuestionIndex + 1 }} / {{ totalQuestions }}</div>
        </div>

        <div class="question-card">
          <div class="question-number">Question {{ currentQuestionIndex + 1 }}</div>
          <h2 class="question-text">{{ currentQuestion.question }}</h2>

          <div class="options">
            <button
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              class="option-btn"
              :class="{ selected: selectedAnswer === index }"
              @click="selectAnswer(index)"
            >
              <span class="option-letter">{{ ['A', 'B', 'C', 'D'][index] }}</span>
              <span class="option-text">{{ option }}</span>
              <span v-if="selectedAnswer === index" class="check">✓</span>
            </button>
          </div>

          <button
            class="next-btn"
            :disabled="selectedAnswer === null"
            @click="nextQuestion"
          >
            {{ currentQuestionIndex === totalQuestions - 1 ? 'Finish Test' : 'Next Question' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results Screen -->
    <div v-else-if="currentScreen === 'results'" class="screen">
      <div class="container">
        <div class="card results-card">
          <div class="success-icon">🎉</div>
          <h1>Test Complete!</h1>
          <p class="subtitle">Here's how you did</p>

          <div class="score-circle">
            <div class="score-number">{{ scorePercentage }}%</div>
            <div class="score-label">Your Score</div>
          </div>

          <div class="stats">
            <div class="stat">
              <div class="stat-value">{{ correctAnswers }}</div>
              <div class="stat-label">Correct</div>
            </div>
            <div class="stat">
              <div class="stat-value">{{ wrongAnswers }}</div>
              <div class="stat-label">Wrong</div>
            </div>
            <div class="stat">
              <div class="stat-value">{{ recommendedLevel }}</div>
              <div class="stat-label">Level</div>
            </div>
          </div>

          <button class="primary-btn" @click="$router.push('/profile/catalogue')">
            Start Learning
          </button>
          <button class="secondary-btn" @click="retakeTest">
            Retake Test
          </button>
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

    // Hardcoded questions for each subject
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

      // Record answer
      const isCorrect = selectedAnswer.value === currentQuestion.value.correct;
      answers.value.push({
        questionIndex: currentQuestionIndex.value,
        selectedAnswer: selectedAnswer.value,
        correctAnswer: currentQuestion.value.correct,
        correct: isCorrect
      });

      // Move to next question or finish
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
          await api.post('learning-mode/placement-test/submit-results', {
            userId,
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
      currentQuestion,
      currentQuestionIndex,
      totalQuestions,
      selectedAnswer,
      progressPercentage,
      correctAnswers,
      wrongAnswers,
      scorePercentage,
      recommendedLevel,
      selectSubject,
      selectAnswer,
      nextQuestion,
      retakeTest
    };
  }
};
</script>

<style scoped>
.placement-test {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 4rem);
}

.container {
  width: 100%;
  max-width: 900px;
}

.card {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.subtitle {
  font-size: 1.125rem;
  color: #718096;
  text-align: center;
  margin: 0 0 3rem 0;
}

/* Subject Selection */
.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.subject-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 16px;
  padding: 2rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.subject-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
}

.subject-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.subject-name {
  color: white;
  font-size: 1.125rem;
  font-weight: 700;
}

.back-link {
  display: block;
  text-align: center;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

/* Test Screen */
.test-container {
  max-width: 800px;
  margin: 0 auto;
}

.test-header {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
  border-radius: 999px;
}

.progress-text {
  text-align: center;
  font-weight: 700;
  color: #4a5568;
  font-size: 0.875rem;
}

.question-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.question-number {
  color: #667eea;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.question-text {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 2rem 0;
  line-height: 1.4;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #f7fafc;
  border: 3px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.option-btn:hover {
  background: #edf2f7;
  border-color: #cbd5e0;
}

.option-btn.selected {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-color: #667eea;
}

.option-letter {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  font-weight: 800;
  color: #667eea;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.option-text {
  flex: 1;
  font-size: 1.125rem;
  color: #2d3748;
  font-weight: 500;
}

.check {
  color: #667eea;
  font-size: 1.5rem;
  font-weight: 800;
}

.next-btn {
  width: 100%;
  padding: 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.next-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5);
}

.next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Results */
.results-card {
  text-align: center;
}

.success-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.score-circle {
  width: 200px;
  height: 200px;
  margin: 2rem auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.3);
}

.score-number {
  font-size: 3rem;
  font-weight: 900;
  color: white;
}

.score-label {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: 1rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
}

.stat {
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 12px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #718096;
  font-weight: 600;
  font-size: 0.875rem;
}

.primary-btn, .secondary-btn {
  width: 100%;
  padding: 1.25rem;
  border: none;
  border-radius: 12px;
  font-size: 1.125rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5);
}

.secondary-btn {
  background: #edf2f7;
  color: #4a5568;
}

.secondary-btn:hover {
  background: #e2e8f0;
}

@media (max-width: 768px) {
  .card {
    padding: 2rem 1.5rem;
  }

  h1 {
    font-size: 2rem;
  }

  .question-text {
    font-size: 1.375rem;
  }

  .subjects-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
