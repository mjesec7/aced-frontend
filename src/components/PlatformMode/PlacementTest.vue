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
            <div class="subject-count">40 Questions</div>
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
        { question: "Identify the subject: 'The quick brown fox jumps'", options: ["quick", "brown", "fox", "jumps"], correct: 2, difficulty: 2 },
        { question: "What is an antonym for 'difficult'?", options: ["Hard", "Easy", "Complex", "Tough"], correct: 1, difficulty: 1 },
        { question: "Which is a proper noun?", options: ["city", "London", "building", "street"], correct: 1, difficulty: 2 },
        { question: "What tense is 'will go'?", options: ["Past", "Present", "Future", "Present perfect"], correct: 2, difficulty: 2 },
        { question: "What is a simile?", options: ["Direct comparison", "Comparison using like/as", "Exaggeration", "Personification"], correct: 1, difficulty: 3 },
        { question: "Choose the correct article: '___ apple a day'", options: ["A", "An", "The", "No article"], correct: 1, difficulty: 2 },
        { question: "What is personification?", options: ["Human qualities to non-human things", "Comparison", "Rhyme", "Repetition"], correct: 0, difficulty: 3 },
        { question: "Which is a compound word?", options: ["Beautiful", "Bookshelf", "Running", "Happiness"], correct: 1, difficulty: 2 },
        { question: "What is an adverb?", options: ["Describes a noun", "Describes a verb", "Action word", "Naming word"], correct: 1, difficulty: 2 },
        { question: "Choose the correct pronoun: 'John and ___ went'", options: ["me", "I", "myself", "mine"], correct: 1, difficulty: 3 },
        { question: "What is onomatopoeia?", options: ["Rhyming", "Sound words", "Repetition", "Comparison"], correct: 1, difficulty: 3 },
        { question: "Which sentence has correct punctuation?", options: ["Hello, how are you", "Hello how are you?", "Hello, how are you?", "Hello how, are you?"], correct: 2, difficulty: 2 },
        { question: "What is a conjunction?", options: ["Action word", "Describing word", "Connecting word", "Naming word"], correct: 2, difficulty: 2 },
        { question: "Choose the correct form: 'She ___ been waiting'", options: ["have", "has", "had", "having"], correct: 1, difficulty: 3 },
        { question: "What is hyperbole?", options: ["Comparison", "Exaggeration", "Sound words", "Repetition"], correct: 1, difficulty: 3 },
        { question: "Which is a plural noun?", options: ["Child", "Children", "Mouse", "Foot"], correct: 1, difficulty: 1 },
        { question: "What is the past participle of 'go'?", options: ["Went", "Going", "Gone", "Goes"], correct: 2, difficulty: 3 },
        { question: "Choose the correct form: 'Neither Jack nor Jill ___ here'", options: ["is", "are", "was", "were"], correct: 0, difficulty: 4 },
        { question: "What is an oxymoron?", options: ["Contradictory terms together", "Exaggeration", "Repetition", "Rhyme"], correct: 0, difficulty: 4 },
        { question: "Which sentence uses passive voice?", options: ["I wrote the letter", "The letter was written by me", "I am writing", "I will write"], correct: 1, difficulty: 4 },
        { question: "What is euphemism?", options: ["Harsh expression", "Mild expression for harsh reality", "Exaggeration", "Comparison"], correct: 1, difficulty: 4 },
        { question: "Choose the correct form: 'If I ___ rich, I would travel'", options: ["am", "was", "were", "be"], correct: 2, difficulty: 4 },
        { question: "What is anaphora?", options: ["Repetition at end", "Repetition at beginning", "No repetition", "Random repetition"], correct: 1, difficulty: 5 },
        { question: "Which is a gerund: 'Swimming is fun'", options: ["is", "fun", "Swimming", "None"], correct: 2, difficulty: 4 },
        { question: "What is synecdoche?", options: ["Part represents whole", "Whole represents part", "Direct comparison", "Exaggeration"], correct: 0, difficulty: 5 },
        { question: "Choose correct form: 'I wish I ___ studied harder'", options: ["have", "has", "had", "having"], correct: 2, difficulty: 4 },
        { question: "What is metonymy?", options: ["Using one thing to represent another related thing", "Direct comparison", "Exaggeration", "Repetition"], correct: 0, difficulty: 5 },
        { question: "Which shows correct comma use?", options: ["I like apples oranges and pears", "I like apples, oranges and pears", "I like apples, oranges, and pears", "I like, apples oranges and pears"], correct: 2, difficulty: 3 },
        { question: "What is assonance?", options: ["Consonant repetition", "Vowel repetition", "Word repetition", "Phrase repetition"], correct: 1, difficulty: 4 },
        { question: "Identify the infinitive: 'To learn is important'", options: ["is", "important", "To learn", "learn"], correct: 2, difficulty: 3 },
        { question: "What is zeugma?", options: ["Using word with two others in different senses", "Repetition", "Exaggeration", "Comparison"], correct: 0, difficulty: 5 }
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
        { question: "What is the perimeter of a square with side 7cm?", options: ["14 cm", "21 cm", "28 cm", "49 cm"], correct: 2, difficulty: 2 },
        { question: "What is 12 + 18?", options: ["28", "29", "30", "31"], correct: 2, difficulty: 1 },
        { question: "What is 9 × 7?", options: ["56", "63", "72", "81"], correct: 1, difficulty: 2 },
        { question: "What is 0.5 + 0.25?", options: ["0.5", "0.65", "0.75", "1.0"], correct: 2, difficulty: 2 },
        { question: "What is 2³?", options: ["6", "8", "9", "16"], correct: 1, difficulty: 2 },
        { question: "What is the value of π (pi) approximately?", options: ["2.14", "3.14", "4.14", "5.14"], correct: 1, difficulty: 2 },
        { question: "What is 40% of 200?", options: ["60", "70", "80", "90"], correct: 2, difficulty: 3 },
        { question: "Solve: 2x - 4 = 10", options: ["x = 3", "x = 5", "x = 7", "x = 9"], correct: 2, difficulty: 3 },
        { question: "What is the circumference of a circle with radius 7? (Use π ≈ 22/7)", options: ["22", "44", "88", "154"], correct: 1, difficulty: 3 },
        { question: "What is √81?", options: ["7", "8", "9", "10"], correct: 2, difficulty: 2 },
        { question: "What is 5²?", options: ["10", "15", "20", "25"], correct: 3, difficulty: 1 },
        { question: "Simplify: 3/6", options: ["1/3", "1/2", "2/3", "3/4"], correct: 1, difficulty: 2 },
        { question: "What is the volume of a cube with side 3cm?", options: ["9 cm³", "18 cm³", "27 cm³", "81 cm³"], correct: 2, difficulty: 3 },
        { question: "Solve: x/5 = 4", options: ["x = 10", "x = 15", "x = 20", "x = 25"], correct: 2, difficulty: 3 },
        { question: "What is 15% of 60?", options: ["6", "7", "8", "9"], correct: 3, difficulty: 3 },
        { question: "If a = 3 and b = 4, what is a² + b²?", options: ["7", "12", "25", "49"], correct: 2, difficulty: 3 },
        { question: "What is the slope of y = 3x + 2?", options: ["2", "3", "5", "-3"], correct: 1, difficulty: 4 },
        { question: "Solve: (x + 3)(x - 2) = 0", options: ["x = -3 or 2", "x = 3 or -2", "x = -3 or -2", "x = 3 or 2"], correct: 0, difficulty: 4 },
        { question: "What is the sum of angles in a triangle?", options: ["90°", "180°", "270°", "360°"], correct: 1, difficulty: 2 },
        { question: "What is log₁₀(100)?", options: ["1", "2", "10", "100"], correct: 1, difficulty: 4 },
        { question: "Solve quadratic: x² - 5x + 6 = 0", options: ["x = 1, 6", "x = 2, 3", "x = -2, -3", "x = 1, 5"], correct: 1, difficulty: 4 },
        { question: "What is sin(90°)?", options: ["0", "0.5", "1", "√2/2"], correct: 2, difficulty: 4 },
        { question: "What is the derivative of x²?", options: ["x", "2x", "x²", "2"], correct: 1, difficulty: 5 },
        { question: "What is the integral of 2x?", options: ["2", "x", "x²", "2x²"], correct: 2, difficulty: 5 },
        { question: "Solve: 2ˣ = 16", options: ["x = 2", "x = 3", "x = 4", "x = 8"], correct: 2, difficulty: 4 },
        { question: "What is the determinant of [[2,3],[1,4]]?", options: ["5", "6", "8", "11"], correct: 0, difficulty: 5 },
        { question: "What is lim(x→0) (sin x)/x?", options: ["0", "1", "∞", "undefined"], correct: 1, difficulty: 5 },
        { question: "What is cos(0°)?", options: ["0", "0.5", "1", "-1"], correct: 2, difficulty: 3 },
        { question: "Solve system: x+y=5, x-y=1", options: ["x=2,y=3", "x=3,y=2", "x=4,y=1", "x=1,y=4"], correct: 1, difficulty: 4 },
        { question: "What is ∫₀¹ x dx?", options: ["0", "1/2", "1", "2"], correct: 1, difficulty: 5 },
        { question: "What is e^(ln 5)?", options: ["1", "e", "5", "ln 5"], correct: 2, difficulty: 5 }
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
        { question: "What is an ecosystem?", options: ["A type of animal", "Living and non-living things interacting", "A food chain", "A habitat"], correct: 1, difficulty: 3 },
        { question: "What is the freezing point of water?", options: ["0°C", "-10°C", "10°C", "100°C"], correct: 0, difficulty: 1 },
        { question: "What gas do humans breathe in?", options: ["Carbon dioxide", "Nitrogen", "Oxygen", "Helium"], correct: 2, difficulty: 1 },
        { question: "What is the largest planet?", options: ["Earth", "Mars", "Jupiter", "Saturn"], correct: 2, difficulty: 2 },
        { question: "What is gravity?", options: ["Force that pulls objects together", "Type of energy", "Form of light", "Kind of gas"], correct: 0, difficulty: 2 },
        { question: "What do plants need for photosynthesis?", options: ["Sunlight, water, CO2", "Only water", "Only sunlight", "Only CO2"], correct: 0, difficulty: 2 },
        { question: "What is the closest star to Earth?", options: ["Alpha Centauri", "Sirius", "The Sun", "Polaris"], correct: 2, difficulty: 1 },
        { question: "What is evaporation?", options: ["Liquid to gas", "Gas to liquid", "Solid to liquid", "Liquid to solid"], correct: 0, difficulty: 2 },
        { question: "What are the three states of matter?", options: ["Solid, liquid, gas", "Hot, cold, warm", "Big, small, medium", "Hard, soft, medium"], correct: 0, difficulty: 1 },
        { question: "What is a carnivore?", options: ["Plant eater", "Meat eater", "Both eater", "Neither"], correct: 1, difficulty: 2 },
        { question: "What is the chemical formula for carbon dioxide?", options: ["CO", "CO2", "C2O", "O2C"], correct: 1, difficulty: 2 },
        { question: "What is inertia?", options: ["Resistance to change in motion", "Type of energy", "Form of matter", "Kind of force"], correct: 0, difficulty: 3 },
        { question: "What is the smallest particle of an element?", options: ["Molecule", "Atom", "Electron", "Proton"], correct: 1, difficulty: 2 },
        { question: "What is a herbivore?", options: ["Meat eater", "Plant eater", "Both eater", "Neither"], correct: 1, difficulty: 1 },
        { question: "What causes day and night?", options: ["Earth's rotation", "Moon's rotation", "Sun's movement", "Star movement"], correct: 0, difficulty: 2 },
        { question: "What is the Milky Way?", options: ["A planet", "A star", "Our galaxy", "A constellation"], correct: 2, difficulty: 2 },
        { question: "What is condensation?", options: ["Gas to liquid", "Liquid to gas", "Solid to liquid", "Liquid to solid"], correct: 0, difficulty: 2 },
        { question: "What is Newton's Third Law?", options: ["F=ma", "Every action has equal opposite reaction", "Objects at rest stay at rest", "Energy is conserved"], correct: 1, difficulty: 3 },
        { question: "What is the atomic number?", options: ["Number of neutrons", "Number of protons", "Number of electrons", "Total particles"], correct: 1, difficulty: 3 },
        { question: "What is the greenhouse effect?", options: ["Trapping heat in atmosphere", "Plant growth", "Cloud formation", "Rain cycle"], correct: 0, difficulty: 3 },
        { question: "What is a black hole?", options: ["Empty space", "Region of extreme gravity", "Dark planet", "Exploded star"], correct: 1, difficulty: 4 },
        { question: "What is entropy?", options: ["Order in system", "Disorder in system", "Energy type", "Force type"], correct: 1, difficulty: 4 },
        { question: "What is the Doppler effect?", options: ["Change in frequency due to motion", "Light bending", "Sound reflection", "Wave interference"], correct: 0, difficulty: 4 },
        { question: "What is nuclear fusion?", options: ["Splitting atoms", "Combining atoms", "Atom decay", "Electron transfer"], correct: 1, difficulty: 4 },
        { question: "What is dark matter?", options: ["Black paint", "Invisible matter affecting gravity", "Dark energy", "Empty space"], correct: 1, difficulty: 5 },
        { question: "What is quantum entanglement?", options: ["Particle correlation", "Wave interference", "Energy transfer", "Matter creation"], correct: 0, difficulty: 5 },
        { question: "What is Heisenberg's Uncertainty Principle?", options: ["Cannot know position and momentum precisely", "Energy is uncertain", "Time is relative", "Matter is uncertain"], correct: 0, difficulty: 5 },
        { question: "What is antimatter?", options: ["Dark matter", "Opposite charge particles", "Empty space", "Negative energy"], correct: 1, difficulty: 5 },
        { question: "What is the speed of sound (approx)?", options: ["343 m/s", "3000 m/s", "300,000 km/s", "1000 m/s"], correct: 0, difficulty: 3 },
        { question: "What is Schrödinger's cat about?", options: ["Quantum superposition", "Pet care", "Chemistry", "Biology"], correct: 0, difficulty: 5 },
        { question: "What is the half-life?", options: ["Time for half decay", "Time to live", "Half mass", "Half energy"], correct: 0, difficulty: 4 }
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
        { question: "Who wrote 'The Great Gatsby'?", options: ["Ernest Hemingway", "F. Scott Fitzgerald", "John Steinbeck", "William Faulkner"], correct: 1, difficulty: 3 },
        { question: "What is a theme?", options: ["Main character", "Central idea", "Setting", "Plot"], correct: 1, difficulty: 2 },
        { question: "Who wrote 'To Kill a Mockingbird'?", options: ["Harper Lee", "Toni Morrison", "Alice Walker", "Maya Angelou"], correct: 0, difficulty: 2 },
        { question: "What is a metaphor in literature?", options: ["Direct comparison", "Indirect comparison", "Rhyme", "Rhythm"], correct: 1, difficulty: 2 },
        { question: "Who wrote 'Hamlet'?", options: ["Christopher Marlowe", "William Shakespeare", "Ben Jonson", "John Milton"], correct: 1, difficulty: 2 },
        { question: "What is the climax of a story?", options: ["Beginning", "Turning point", "End", "Exposition"], correct: 1, difficulty: 2 },
        { question: "Who wrote 'The Odyssey'?", options: ["Virgil", "Homer", "Sophocles", "Euripides"], correct: 1, difficulty: 3 },
        { question: "What is stream of consciousness?", options: ["River description", "Narrative technique showing thoughts", "Type of poem", "Writing style"], correct: 1, difficulty: 4 },
        { question: "Who wrote 'Brave New World'?", options: ["George Orwell", "Ray Bradbury", "Aldous Huxley", "Philip K. Dick"], correct: 2, difficulty: 3 },
        { question: "What is magical realism?", options: ["Pure fantasy", "Blend of realistic and magical elements", "Science fiction", "Horror genre"], correct: 1, difficulty: 4 },
        { question: "Who wrote 'Wuthering Heights'?", options: ["Charlotte Brontë", "Emily Brontë", "Jane Austen", "George Eliot"], correct: 1, difficulty: 3 },
        { question: "What is blank verse?", options: ["Unrhymed iambic pentameter", "Free verse", "Rhymed poetry", "Prose"], correct: 0, difficulty: 4 },
        { question: "Who wrote 'Moby Dick'?", options: ["Herman Melville", "Nathaniel Hawthorne", "Edgar Allan Poe", "Mark Twain"], correct: 0, difficulty: 3 },
        { question: "What is an epic?", options: ["Short story", "Long narrative poem", "Play", "Novel"], correct: 1, difficulty: 2 },
        { question: "Who wrote 'The Catcher in the Rye'?", options: ["J.D. Salinger", "Jack Kerouac", "Allen Ginsberg", "William Burroughs"], correct: 0, difficulty: 3 },
        { question: "What is symbolism?", options: ["Direct meaning", "Using symbols for deeper meaning", "Rhyme scheme", "Plot device"], correct: 1, difficulty: 3 },
        { question: "Who wrote 'Crime and Punishment'?", options: ["Leo Tolstoy", "Fyodor Dostoevsky", "Anton Chekhov", "Ivan Turgenev"], correct: 1, difficulty: 3 },
        { question: "What is a bildungsroman?", options: ["War novel", "Coming-of-age story", "Detective fiction", "Romance"], correct: 1, difficulty: 4 },
        { question: "Who wrote 'One Hundred Years of Solitude'?", options: ["Jorge Luis Borges", "Gabriel García Márquez", "Pablo Neruda", "Octavio Paz"], correct: 1, difficulty: 4 },
        { question: "What is dramatic irony?", options: ["Audience knows more than characters", "Characters know more", "No one knows", "Everyone knows"], correct: 0, difficulty: 3 },
        { question: "Who wrote 'Mrs Dalloway'?", options: ["Virginia Woolf", "James Joyce", "T.S. Eliot", "Ezra Pound"], correct: 0, difficulty: 4 },
        { question: "What is modernist literature?", options: ["Traditional narrative", "Experimental forms and consciousness", "Medieval stories", "Romantic poetry"], correct: 1, difficulty: 4 },
        { question: "Who wrote 'The Divine Comedy'?", options: ["Petrarch", "Boccaccio", "Dante", "Chaucer"], correct: 2, difficulty: 3 },
        { question: "What is postmodernism in literature?", options: ["Before modernism", "Skeptical of grand narratives", "Traditional forms", "Romantic style"], correct: 1, difficulty: 5 },
        { question: "Who wrote 'Ulysses'?", options: ["James Joyce", "Samuel Beckett", "Oscar Wilde", "W.B. Yeats"], correct: 0, difficulty: 4 },
        { question: "What is intertextuality?", options: ["Writing within text", "References to other texts", "Text structure", "Plot device"], correct: 1, difficulty: 5 },
        { question: "Who wrote 'The Waste Land'?", options: ["Ezra Pound", "T.S. Eliot", "W.H. Auden", "Robert Frost"], correct: 1, difficulty: 4 },
        { question: "What is the unreliable narrator?", options: ["Narrator who tells truth", "Narrator whose credibility is questionable", "Third person narrator", "Omniscient narrator"], correct: 1, difficulty: 4 },
        { question: "Who won Nobel Prize for 'The Old Man and the Sea'?", options: ["William Faulkner", "Ernest Hemingway", "John Steinbeck", "Sinclair Lewis"], correct: 1, difficulty: 3 },
        { question: "What is metafiction?", options: ["About fiction itself", "Science fiction", "Historical fiction", "Romance fiction"], correct: 0, difficulty: 5 },
        { question: "Who wrote 'In Search of Lost Time'?", options: ["Marcel Proust", "André Gide", "Albert Camus", "Jean-Paul Sartre"], correct: 0, difficulty: 5 }
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
        { question: "What is gravity on Earth?", options: ["8.8 m/s²", "9.8 m/s²", "10.8 m/s²", "11.8 m/s²"], correct: 1, difficulty: 2 },
        { question: "What is Newton's Second Law?", options: ["Inertia", "F = ma", "Action-reaction", "Gravity"], correct: 1, difficulty: 2 },
        { question: "What is work in physics?", options: ["Force × distance", "Mass × velocity", "Power × time", "Energy × time"], correct: 0, difficulty: 2 },
        { question: "What is the unit of energy?", options: ["Newton", "Watt", "Joule", "Pascal"], correct: 2, difficulty: 2 },
        { question: "What is friction?", options: ["Resistance to motion", "Type of energy", "Form of power", "Kind of force"], correct: 0, difficulty: 2 },
        { question: "What is electromagnetic radiation?", options: ["Sound waves", "Light and similar waves", "Heat only", "Mechanical waves"], correct: 1, difficulty: 3 },
        { question: "What is Ohm's Law?", options: ["V = IR", "F = ma", "E = mc²", "P = IV"], correct: 0, difficulty: 3 },
        { question: "What is the formula for work?", options: ["W = Fd", "W = ma", "W = Pt", "W = mv"], correct: 0, difficulty: 2 },
        { question: "What is centripetal force?", options: ["Outward force", "Inward force in circular motion", "Gravitational force", "Frictional force"], correct: 1, difficulty: 3 },
        { question: "What is the law of conservation of energy?", options: ["Energy can be created", "Energy cannot be destroyed", "Energy stays constant", "Energy always increases"], correct: 1, difficulty: 3 },
        { question: "What is thermal energy?", options: ["Motion energy", "Heat energy", "Light energy", "Sound energy"], correct: 1, difficulty: 2 },
        { question: "What is refraction?", options: ["Light bouncing", "Light bending", "Light absorption", "Light emission"], correct: 1, difficulty: 3 },
        { question: "What is the Doppler Effect?", options: ["Change in frequency due to motion", "Light diffraction", "Sound absorption", "Wave interference"], correct: 0, difficulty: 4 },
        { question: "What is the unit of electric current?", options: ["Volt", "Ampere", "Ohm", "Watt"], correct: 1, difficulty: 2 },
        { question: "What is the formula for kinetic energy?", options: ["KE = mv", "KE = 1/2 mv²", "KE = mgh", "KE = Fd"], correct: 1, difficulty: 3 },
        { question: "What is simple harmonic motion?", options: ["Linear motion", "Oscillatory motion", "Circular motion", "Random motion"], correct: 1, difficulty: 4 },
        { question: "What is Young's modulus?", options: ["Elasticity measure", "Viscosity measure", "Density measure", "Pressure measure"], correct: 0, difficulty: 4 },
        { question: "What is the photoelectric effect?", options: ["Light creating current", "Light bending", "Light reflection", "Light absorption"], correct: 0, difficulty: 4 },
        { question: "What is wave-particle duality?", options: ["Waves are particles", "Light behaves as both wave and particle", "Only waves exist", "Only particles exist"], correct: 1, difficulty: 5 },
        { question: "What is the Heisenberg Uncertainty Principle?", options: ["Everything is certain", "Position and momentum cannot both be precise", "Energy is uncertain", "Time is relative"], correct: 1, difficulty: 5 },
        { question: "What is special relativity about?", options: ["Gravity", "Motion at high speeds", "Quantum mechanics", "Thermodynamics"], correct: 1, difficulty: 4 },
        { question: "What is E=mc²?", options: ["Energy-mass equivalence", "Force formula", "Power formula", "Work formula"], correct: 0, difficulty: 3 },
        { question: "What is entropy?", options: ["Order", "Disorder in a system", "Energy", "Force"], correct: 1, difficulty: 4 },
        { question: "What is the strong nuclear force?", options: ["Gravity", "Electromagnetic force", "Force binding nucleus", "Weak force"], correct: 2, difficulty: 4 },
        { question: "What is superconductivity?", options: ["Very high resistance", "Zero electrical resistance", "High conductivity", "Low resistance"], correct: 1, difficulty: 5 },
        { question: "What is quantum tunneling?", options: ["Digging tunnels", "Particle passing through barrier", "Wave reflection", "Energy absorption"], correct: 1, difficulty: 5 },
        { question: "What is the Higgs boson?", options: ["Type of atom", "Particle giving mass", "Energy particle", "Force carrier"], correct: 1, difficulty: 5 },
        { question: "What is string theory?", options: ["Music theory", "Fundamental particles as strings", "Rope physics", "Wave theory"], correct: 1, difficulty: 5 },
        { question: "What is dark energy?", options: ["Black holes", "Energy causing universe expansion", "Dark matter", "Negative energy"], correct: 1, difficulty: 5 },
        { question: "What is the Pauli Exclusion Principle?", options: ["Fermions cannot occupy same state", "Bosons repel", "Energy quantization", "Wave-particle duality"], correct: 0, difficulty: 5 },
        { question: "What is Planck's constant used for?", options: ["Gravity", "Quantum mechanics", "Relativity", "Thermodynamics"], correct: 1, difficulty: 4 }
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
        { question: "What is CO2?", options: ["Carbon monoxide", "Carbon dioxide", "Calcium oxide", "Cobalt"], correct: 1, difficulty: 1 },
        { question: "What is the symbol for Sodium?", options: ["S", "So", "Na", "Sd"], correct: 2, difficulty: 2 },
        { question: "What is a covalent bond?", options: ["Electron sharing", "Electron transfer", "Proton sharing", "Neutron sharing"], correct: 0, difficulty: 3 },
        { question: "What is an ionic bond?", options: ["Electron sharing", "Electron transfer", "Proton transfer", "Neutron transfer"], correct: 1, difficulty: 3 },
        { question: "What is the symbol for Oxygen?", options: ["O", "Ox", "Og", "Om"], correct: 0, difficulty: 1 },
        { question: "What is an acid?", options: ["pH > 7", "pH < 7", "pH = 7", "pH = 0"], correct: 1, difficulty: 2 },
        { question: "What is a base?", options: ["pH < 7", "pH > 7", "pH = 7", "pH = 14"], correct: 1, difficulty: 2 },
        { question: "What is the periodic table?", options: ["Element organization", "Compound list", "Molecule chart", "Atom diagram"], correct: 0, difficulty: 2 },
        { question: "What is the symbol for Helium?", options: ["H", "He", "Hl", "Hm"], correct: 1, difficulty: 1 },
        { question: "What is reduction?", options: ["Lose electrons", "Gain electrons", "Lose protons", "Gain protons"], correct: 1, difficulty: 4 },
        { question: "What is the symbol for Carbon?", options: ["Ca", "C", "Cb", "Cr"], correct: 1, difficulty: 1 },
        { question: "What is an endothermic reaction?", options: ["Releases heat", "Absorbs heat", "No heat change", "Creates heat"], correct: 1, difficulty: 3 },
        { question: "What is an exothermic reaction?", options: ["Absorbs heat", "Releases heat", "No heat change", "Destroys heat"], correct: 1, difficulty: 3 },
        { question: "What is the symbol for Nitrogen?", options: ["Ni", "N", "Nt", "Nr"], correct: 1, difficulty: 1 },
        { question: "What is Avogadro's number?", options: ["6.02 × 10²³", "3.14 × 10¹⁰", "9.8 × 10²", "1.6 × 10⁻¹⁹"], correct: 0, difficulty: 4 },
        { question: "What is a noble gas?", options: ["Reactive gas", "Inert gas", "Toxic gas", "Heavy gas"], correct: 1, difficulty: 3 },
        { question: "What is the symbol for Silver?", options: ["Si", "Ag", "Sr", "Sv"], correct: 1, difficulty: 2 },
        { question: "What is a chemical equation?", options: ["Math formula", "Representation of reaction", "Chemical formula", "Element list"], correct: 1, difficulty: 2 },
        { question: "What is the molar mass of water (H2O)?", options: ["16 g/mol", "18 g/mol", "20 g/mol", "22 g/mol"], correct: 1, difficulty: 3 },
        { question: "What is electronegativity?", options: ["Atom's ability to attract electrons", "Positive charge", "Negative charge", "Neutral charge"], correct: 0, difficulty: 4 },
        { question: "What is the symbol for Copper?", options: ["Co", "Cp", "Cu", "Cr"], correct: 2, difficulty: 2 },
        { question: "What is a polymer?", options: ["Single molecule", "Large molecule from repeating units", "Small molecule", "Atom chain"], correct: 1, difficulty: 3 },
        { question: "What is equilibrium in chemistry?", options: ["One direction", "Forward and reverse rates equal", "No reaction", "Complete reaction"], correct: 1, difficulty: 4 },
        { question: "What is the symbol for Potassium?", options: ["P", "K", "Po", "Pt"], correct: 1, difficulty: 2 },
        { question: "What is Le Chatelier's principle?", options: ["System responds to stress", "Energy conservation", "Mass conservation", "Charge conservation"], correct: 0, difficulty: 4 },
        { question: "What is organic chemistry?", options: ["Study of metals", "Study of carbon compounds", "Study of gases", "Study of acids"], correct: 1, difficulty: 3 },
        { question: "What is the symbol for Lead?", options: ["L", "Ld", "Pb", "Pl"], correct: 2, difficulty: 3 },
        { question: "What is quantum chemistry?", options: ["Old chemistry", "Chemistry using quantum mechanics", "Classical chemistry", "Basic chemistry"], correct: 1, difficulty: 5 },
        { question: "What is a Lewis structure?", options: ["Molecular geometry", "Electron dot diagram", "Orbital diagram", "Energy diagram"], correct: 1, difficulty: 4 },
        { question: "What is the Haber process?", options: ["Making steel", "Synthesizing ammonia", "Refining oil", "Producing acids"], correct: 1, difficulty: 4 },
        { question: "What is spectroscopy?", options: ["Study of spectra", "Study of speed", "Study of space", "Study of species"], correct: 0, difficulty: 5 }
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
        { question: "What are genes made of?", options: ["Proteins", "DNA", "RNA", "Lipids"], correct: 1, difficulty: 3 },
        { question: "What is the function of the nucleus?", options: ["Energy production", "Contains genetic material", "Protein synthesis", "Waste removal"], correct: 1, difficulty: 2 },
        { question: "What is cellular respiration?", options: ["Breathing", "Converting glucose to energy", "Photosynthesis", "Cell division"], correct: 1, difficulty: 3 },
        { question: "What is a prokaryote?", options: ["Cell with nucleus", "Cell without nucleus", "Plant cell", "Animal cell"], correct: 1, difficulty: 3 },
        { question: "What is a eukaryote?", options: ["Cell without nucleus", "Cell with nucleus", "Bacteria", "Virus"], correct: 1, difficulty: 3 },
        { question: "What is mitosis?", options: ["Sexual reproduction", "Cell division for growth", "Energy production", "Protein synthesis"], correct: 1, difficulty: 3 },
        { question: "What is meiosis?", options: ["Cell division for growth", "Cell division for sex cells", "Energy production", "Protein synthesis"], correct: 1, difficulty: 3 },
        { question: "What is the function of ribosomes?", options: ["Energy production", "Protein synthesis", "Genetic storage", "Waste removal"], correct: 1, difficulty: 2 },
        { question: "What is homeostasis?", options: ["Cell division", "Maintaining stable conditions", "Energy production", "Growth"], correct: 1, difficulty: 3 },
        { question: "What are the four bases in DNA?", options: ["A, B, C, D", "A, T, G, C", "A, U, G, C", "W, X, Y, Z"], correct: 1, difficulty: 3 },
        { question: "What is natural selection?", options: ["Random change", "Survival of fittest", "Artificial breeding", "Mutation"], correct: 1, difficulty: 3 },
        { question: "What is an ecosystem?", options: ["Single organism", "Community of organisms and environment", "Food chain", "Population"], correct: 1, difficulty: 2 },
        { question: "What is the difference between DNA and RNA?", options: ["DNA has thymine, RNA has uracil", "No difference", "RNA is double-stranded", "DNA is single-stranded"], correct: 0, difficulty: 4 },
        { question: "What is the cell membrane?", options: ["Cell powerhouse", "Protective barrier around cell", "Genetic material", "Energy producer"], correct: 1, difficulty: 2 },
        { question: "What is chlorophyll?", options: ["Animal protein", "Green pigment in plants", "Type of cell", "Enzyme"], correct: 1, difficulty: 2 },
        { question: "What is a species?", options: ["Group of similar individuals", "Single organism", "Type of cell", "Ecosystem"], correct: 0, difficulty: 2 },
        { question: "What is ATP?", options: ["Type of DNA", "Energy currency of cell", "Protein", "Enzyme"], correct: 1, difficulty: 3 },
        { question: "What is mutation?", options: ["Normal growth", "Change in DNA sequence", "Cell division", "Energy production"], correct: 1, difficulty: 3 },
        { question: "What is biodiversity?", options: ["Single species", "Variety of life", "Population size", "Food chain"], correct: 1, difficulty: 2 },
        { question: "What is the function of chloroplasts?", options: ["Energy from respiration", "Photosynthesis", "Protein synthesis", "Waste removal"], correct: 1, difficulty: 2 },
        { question: "What is a food chain?", options: ["Energy flow through organisms", "Cell structure", "DNA sequence", "Protein structure"], correct: 0, difficulty: 2 },
        { question: "What is symbiosis?", options: ["Competition", "Close relationship between species", "Predation", "Parasitism only"], correct: 1, difficulty: 3 },
        { question: "What is the endoplasmic reticulum?", options: ["Energy producer", "Protein and lipid synthesis network", "Genetic material", "Cell membrane"], correct: 1, difficulty: 4 },
        { question: "What is the Golgi apparatus?", options: ["Powerhouse", "Packaging and shipping center", "Genetic storage", "Energy producer"], correct: 1, difficulty: 4 },
        { question: "What is a genotype?", options: ["Physical traits", "Genetic makeup", "Cell type", "Organism size"], correct: 1, difficulty: 4 },
        { question: "What is a phenotype?", options: ["Genetic makeup", "Observable characteristics", "DNA sequence", "Cell structure"], correct: 1, difficulty: 4 },
        { question: "What is CRISPR?", options: ["Gene editing tool", "Protein", "Cell part", "Disease"], correct: 0, difficulty: 5 },
        { question: "What is epigenetics?", options: ["Gene changes without DNA sequence change", "Mutation", "Evolution", "Natural selection"], correct: 0, difficulty: 5 },
        { question: "What is the Central Dogma?", options: ["DNA → RNA → Protein", "Protein → RNA → DNA", "RNA → DNA → Protein", "DNA → Protein → RNA"], correct: 0, difficulty: 4 },
        { question: "What are stem cells?", options: ["Specialized cells", "Undifferentiated cells", "Dead cells", "Cancer cells"], correct: 1, difficulty: 4 },
        { question: "What is apoptosis?", options: ["Cell growth", "Programmed cell death", "Cell division", "Mutation"], correct: 1, difficulty: 5 }
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
