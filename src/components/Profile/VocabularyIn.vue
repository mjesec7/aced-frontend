<template>
  <div class="vocabulary-in-page">
    <!-- Header -->
    <div class="page-header">
      <button @click="goBack" class="back-btn">
        <div class="btn-icon">←</div>
        <span>Назад</span>
      </button>
      
      <div class="language-info">
        <div class="language-flag-container">
          <span class="language-flag">{{ getLanguageFlag(languageCode) }}</span>
          <div class="flag-glow"></div>
        </div>
        <div class="language-details">
          <h1 class="language-title">{{ getSelectedLanguageName() }}</h1>
          <p class="language-subtitle">
            {{ currentView === 'topics' ? 'Выберите тему для начала изучения' : 
               currentView === 'learning' ? `Изучение: ${selectedTopic}` :
               currentView === 'test' ? 'Режим тестирования' : '' }}
          </p>
        </div>
      </div>

      <button 
        v-if="currentView === 'topics'"
        @click="openCreateTestModal" 
        class="create-test-btn"
      >
        <div class="btn-icon">🎯</div>
        <span>Создать тест</span>
        <div class="btn-glow"></div>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-animation">
        <div class="loading-circle"></div>
        <div class="loading-circle"></div>
        <div class="loading-circle"></div>
      </div>
      <span>Загрузка...</span>
    </div>

    <!-- Topics View -->
    <section v-else-if="currentView === 'topics'" class="topics-section">
      <!-- Search and Filter -->
      <div class="controls">
        <div class="search-container">
          <div class="search-icon">🔍</div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск тем..."
            class="search-input"
          />
          <div class="search-glow"></div>
        </div>
        
        <div class="filter-buttons">
          <button
            v-for="difficulty in difficultyLevels"
            :key="difficulty.value"
            @click="toggleDifficulty(difficulty.value)"
            class="filter-btn"
            :class="{ active: selectedDifficulty === difficulty.value }"
          >
            <span class="filter-icon">{{ difficulty.icon }}</span>
            {{ difficulty.label }}
          </button>
        </div>
      </div>

      <!-- Topics Grid -->
      <div v-if="filteredTopics.length > 0" class="topics-grid">
        <div
          v-for="topic in filteredTopics"
          :key="topic.name"
          class="topic-card"
          :class="{ 
            completed: isTopicCompleted(topic),
            'in-progress': isTopicInProgress(topic)
          }"
          @click="selectTopic(topic)"
        >
          <div class="card-glow"></div>
          <div class="card-header">
            <div class="topic-icon-container">
              <div class="topic-icon">{{ getTopicIcon(topic.name) }}</div>
              <div class="icon-pulse"></div>
            </div>
            <div class="topic-status">
              <div v-if="isTopicCompleted(topic)" class="status-indicator completed">
                <span class="status-icon">✓</span>
              </div>
              <div v-else-if="isTopicInProgress(topic)" class="status-indicator in-progress">
                <span class="status-icon">⋯</span>
              </div>
            </div>
          </div>
          
          <div class="card-content">
            <h3 class="topic-name">{{ getTopicNameRu(topic.name) }}</h3>
            <p class="topic-description">{{ getTopicDescription(topic.name) }}</p>
            
            <div class="topic-meta">
              <div class="meta-item">
                <span class="meta-icon">📝</span>
                <span>{{ topic.wordCount || 8 }} слов</span>
              </div>
              <div class="meta-item difficulty" :class="topic.difficulty || 'beginner'">
                <span class="meta-icon">{{ getDifficultyIcon(topic.difficulty || 'beginner') }}</span>
                <span>{{ getDifficultyLabel(topic.difficulty || 'beginner') }}</span>
              </div>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="progress-container" v-if="getTopicProgress(topic) > 0">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: getTopicProgress(topic) + '%' }"
              ></div>
              <div class="progress-glow"></div>
            </div>
            <span class="progress-text">{{ Math.round(getTopicProgress(topic)) }}%</span>
          </div>

          <div class="card-hover-effect">
            <div class="hover-text">Начать изучение</div>
            <div class="hover-arrow">→</div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-animation">
          <div class="empty-icon">📚</div>
          <div class="empty-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <h3>Темы не найдены</h3>
        <p>Попробуйте изменить поисковый запрос или сбросить фильтры</p>
        <button v-if="searchQuery || selectedDifficulty" @click="clearFilters" class="clear-btn">
          Очистить фильтры
        </button>
      </div>
    </section>

    <!-- Learning View -->
    <section v-else-if="currentView === 'learning'" class="learning-section">
      <div class="learning-header">
        <div class="learning-info">
          <h2>{{ getTopicNameRu(selectedTopic) }}</h2>
          <p>{{ currentWords.length }} слов для изучения</p>
        </div>

        <div class="learning-progress">
          <div class="progress-stats">
            <span class="progress-counter">{{ currentWordIndex + 1 }} / {{ currentWords.length }}</span>
            <span class="progress-percentage">{{ Math.round(((currentWordIndex + 1) / currentWords.length) * 100) }}%</span>
          </div>
          <div class="progress-bar-learning">
            <div 
              class="progress-fill-learning" 
              :style="{ width: ((currentWordIndex + 1) / currentWords.length) * 100 + '%' }"
            ></div>
            <div class="progress-sparkle"></div>
          </div>
        </div>
      </div>

      <!-- Learning Complete -->
      <div v-if="learningComplete" class="learning-complete">
        <div class="complete-animation">
          <div class="complete-icon">🎉</div>
          <div class="celebration-particles">
            <span v-for="i in 6" :key="i" class="particle"></span>
          </div>
        </div>
        <div class="complete-content">
          <h3>Поздравляем!</h3>
          <p>Вы завершили все слова в теме "{{ getTopicNameRu(selectedTopic) }}"</p>
          
          <div class="complete-stats">
            <div class="stat-item">
              <div class="stat-circle">
                <span class="stat-number">{{ currentWords.length }}</span>
              </div>
              <span class="stat-label">слов изучено</span>
            </div>
            <div class="stat-item">
              <div class="stat-circle">
                <span class="stat-number">{{ learningProgress.length }}</span>
              </div>
              <span class="stat-label">отмечено как изученные</span>
            </div>
          </div>
          
          <div class="complete-actions">
            <button @click="startTopicTest" class="btn primary">
              <span class="btn-icon">🎯</span>
              <span>Пройти тест по теме</span>
              <div class="btn-glow"></div>
            </button>
            <button @click="goBackToTopics" class="btn secondary">
              <span>Выбрать другую тему</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Word Card -->
      <div v-else class="word-container">
        <div class="word-card" :key="currentWordIndex">
          <div class="word-card-glow"></div>
          <div class="word-header">
            <div class="word-number">{{ currentWordIndex + 1 }}</div>
            <div class="word-type" v-if="currentWords[currentWordIndex]?.partOfSpeech">
              {{ currentWords[currentWordIndex].partOfSpeech }}
            </div>
          </div>

          <!-- Updated Word Main with Pronunciation -->
          <div class="word-main-container">
            <div class="word-main">{{ currentWords[currentWordIndex]?.word }}</div>
            <button 
              @click="pronounceWord(currentWords[currentWordIndex]?.word)"
              class="pronunciation-btn"
              title="Произношение (клавиша P)"
            >
              🔊
            </button>
          </div>
          
          <div class="word-details">
            <div class="translation-section">
              <button @click="toggleTranslation" class="toggle-btn" :class="{ active: showTranslation }">
                <span class="toggle-icon">{{ showTranslation ? '👁️' : '👁️‍🗨️' }}</span>
                <span>{{ showTranslation ? 'Скрыть перевод' : 'Показать перевод' }}</span>
                <div class="toggle-glow"></div>
              </button>
              
              <div v-if="showTranslation" class="word-translation">
                <div class="translation-text">
                  {{ currentWords[currentWordIndex]?.translation }}
                  <button 
                    @click="pronounceWord(currentWords[currentWordIndex]?.translation, 'russian')"
                    class="mini-pronunciation-btn"
                    title="Произношение перевода"
                  >
                    🔊
                  </button>
                </div>
                <div class="translation-glow"></div>
              </div>
            </div>

            <div v-if="showTranslation && currentWords[currentWordIndex]?.example" class="word-example">
              <div class="example-label">Пример:</div>
              <div class="example-text">
                {{ currentWords[currentWordIndex].example }}
                <button 
                  @click="pronounceWord(currentWords[currentWordIndex].example)"
                  class="mini-pronunciation-btn"
                  title="Произношение примера"
                >
                  🔊
                </button>
              </div>
            </div>
          </div>

          <div class="word-actions">
            <button 
              @click="previousWord" 
              :disabled="currentWordIndex === 0"
              class="btn secondary nav-btn"
            >
              <span class="btn-icon">←</span>
              <span>Предыдущее</span>
            </button>
            
            <button @click="markWordAsLearned" class="btn success learn-btn">
              <span class="btn-icon">✓</span>
              <span>Изучено</span>
              <div class="btn-glow"></div>
            </button>
            
            <button 
              @click="nextWord" 
              class="btn primary nav-btn"
            >
              <span>{{ currentWordIndex === currentWords.length - 1 ? 'Завершить' : 'Следующее' }}</span>
              <span class="btn-icon">→</span>
            </button>
          </div>
        </div>

        <!-- Floating Test Button -->
        <button 
          @click="startTopicTest" 
          class="floating-test-btn" 
          :disabled="learningProgress.length < 3"
          :title="`Нужно 3+ изученных слов (${learningProgress.length}/${currentWords.length})`"
        >
          <div class="floating-icon">🎯</div>
          <div class="floating-text">
            <span>Тест</span>
            <span class="floating-counter">({{ learningProgress.length }}/{{ currentWords.length }})</span>
          </div>
          <div class="floating-glow"></div>
        </button>
      </div>
    </section>

    <!-- Test View -->
    <section v-else-if="currentView === 'test'" class="test-section">
      <div class="test-header">
        <h2>{{ testConfig.type === 'random' ? 'Тест: Случайные слова' : `Тест: ${getTopicNameRu(selectedTopic)}` }}</h2>
        <p v-if="!testComplete">Вопрос {{ currentQuestionIndex + 1 }} из {{ testQuestions.length }}</p>
      </div>

      <!-- Test Results -->
      <div v-if="testComplete" class="test-results">
        <div class="results-animation">
          <div class="results-icon" :class="{ passed: testResults.passed, failed: !testResults.passed }">
            {{ testResults.passed ? '🎉' : '📚' }}
          </div>
          <div class="results-particles" v-if="testResults.passed">
            <span v-for="i in 8" :key="i" class="result-particle"></span>
          </div>
        </div>
        
        <div class="results-content">
          <h3>{{ testResults.passed ? 'Тест пройден!' : 'Продолжайте практиковаться' }}</h3>
          
          <div class="results-stats">
            <div class="result-item">
              <div class="result-circle" :class="getScoreClass(testResults.percentage)">
                <span class="result-number">{{ testResults.percentage }}%</span>
              </div>
              <span class="result-label">Результат</span>
            </div>
            <div class="result-item">
              <div class="result-circle">
                <span class="result-number">{{ testResults.correct }}/{{ testResults.total }}</span>
              </div>
              <span class="result-label">Правильных</span>
            </div>
          </div>

          <div class="results-actions">
            <button @click="retakeTest" class="btn primary">
              <span class="btn-icon">🔄</span>
              <span>Пройти заново</span>
              <div class="btn-glow"></div>
            </button>
            <button @click="goBackToTopics" class="btn secondary">
              <span>Вернуться к темам</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Test Question -->
      <div v-else class="test-question">
        <div class="question-progress">
          <div class="progress-bar-test">
            <div 
              class="progress-fill-test" 
              :style="{ width: ((currentQuestionIndex + 1) / testQuestions.length) * 100 + '%' }"
            ></div>
            <div class="progress-pulse"></div>
          </div>
        </div>

        <div class="question-content">
          <div class="question-header">
            <div class="question-number">{{ currentQuestionIndex + 1 }}</div>
            <h3>Как переводится это слово?</h3>
          </div>
          <!-- Updated Test Word with Pronunciation -->
          <div class="test-word">
            <span class="word-text">{{ testQuestions[currentQuestionIndex]?.word }}</span>
            <button 
              @click="pronounceWord(testQuestions[currentQuestionIndex]?.word)"
              class="word-pronunciation-btn"
              title="Произношение"
            >
              🔊
            </button>
            <div class="word-glow"></div>
          </div>
        </div>

        <div class="question-options">
          <button 
            v-for="(option, index) in testQuestions[currentQuestionIndex]?.options" 
            :key="index"
            @click="submitTestAnswer(option)"
            class="option-btn"
          >
            <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
            <span class="option-text">{{ option }}</span>
            <div class="option-glow"></div>
          </button>
        </div>
      </div>
    </section>

    <!-- Create Test Modal -->
    <CreateTestModal 
      v-if="showCreateTestModal"
      :language="languageCode"
      :languageName="getSelectedLanguageName()"
      :topics="topics"
      @close="closeCreateTestModal"
      @create="createCustomTest"
    />

    <!-- Toast Messages -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      <div class="toast-icon">
        {{ toastType === 'success' ? '✅' : toastType === 'error' ? '❌' : 'ℹ️' }}
      </div>
      <span>{{ toastMessage }}</span>
      <div class="toast-glow"></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import CreateTestModal from '../Modals/CreateTestModal.vue';

export default {
  name: 'VocabularyIn',
  components: {
    CreateTestModal
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    
    // Reactive data
    const loading = ref(true);
    const languageCode = ref(route.params.languageCode);
    const currentView = ref('topics'); // 'topics', 'learning', 'test'
    const topics = ref([]);
    const currentWords = ref([]);
    const searchQuery = ref('');
    const selectedDifficulty = ref('');
    const selectedTopic = ref('');
    const showCreateTestModal = ref(false);
    const toastMessage = ref('');
    const toastType = ref('success');
    
    // Learning state
    const currentWordIndex = ref(0);
    const learningProgress = ref([]);
    const showTranslation = ref(false);
    const learningComplete = ref(false);
    
    // Test state
    const testConfig = ref({});
    const testQuestions = ref([]);
    const currentQuestionIndex = ref(0);
    const userAnswers = ref([]);
    const testComplete = ref(false);
    const testResults = ref({});
    const userProgress = ref(null);

    // Constants
    const difficultyLevels = [
      { value: 'beginner', label: 'Начальный', icon: '🟢' },
      { value: 'intermediate', label: 'Средний', icon: '🟡' },
      { value: 'advanced', label: 'Продвинутый', icon: '🔴' }
    ];

    const languageNames = {
      english: { name: 'English', nameRu: 'Английский' },
      spanish: { name: 'Spanish', nameRu: 'Испанский' },
      french: { name: 'French', nameRu: 'Французский' },
      german: { name: 'German', nameRu: 'Немецкий' },
      chinese: { name: 'Chinese', nameRu: 'Китайский' },
      arabic: { name: 'Arabic', nameRu: 'Арабский' },
      japanese: { name: 'Japanese', nameRu: 'Японский' },
      korean: { name: 'Korean', nameRu: 'Корейский' },
      uzbek: { name: 'Uzbek', nameRu: 'Узбекский' },
      russian: { name: 'Russian', nameRu: 'Русский' }
    };

    // Language mapping for speech synthesis
    const languageMap = {
      english: 'en-US',
      spanish: 'es-ES', 
      french: 'fr-FR',
      german: 'de-DE',
      chinese: 'zh-CN',
      arabic: 'ar-SA',
      japanese: 'ja-JP',
      korean: 'ko-KR',
      uzbek: 'uz-UZ', // May fallback to en-US if not supported
      russian: 'ru-RU'
    };

    // Computed properties
    const currentUser = computed(() => store.getters.user);
    
    const filteredTopics = computed(() => {
      let filtered = [...topics.value];
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(topic =>
          topic.name.toLowerCase().includes(query) ||
          getTopicNameRu(topic.name).toLowerCase().includes(query)
        );
      }
      
      if (selectedDifficulty.value) {
        filtered = filtered.filter(topic => 
          (topic.difficulty || 'beginner') === selectedDifficulty.value
        );
      }
      
      return filtered;
    });

    // Helper methods
    const getLanguageFlag = (code) => {
      const flags = {
        english: '🇺🇸', spanish: '🇪🇸', french: '🇫🇷', german: '🇩🇪',
        chinese: '🇨🇳', arabic: '🇸🇦', japanese: '🇯🇵', korean: '🇰🇷',
        uzbek: '🇺🇿', russian: '🇷🇺'
      };
      return flags[code] || '🌐';
    };

    const getSelectedLanguageName = () => {
      const lang = languageNames[languageCode.value];
      return lang ? lang.nameRu : languageCode.value;
    };

    const getTopicIcon = (topicName) => {
      const icons = {
        'Travel': '✈️', 'Business': '💼', 'Food': '🍽️', 'Family': '👨‍👩‍👧‍👦',
        'Education': '🎓', 'Health': '🏥', 'Technology': '💻', 'Sports': '⚽',
        'Music': '🎵', 'Art': '🎨', 'Nature': '🌿', 'Animals': '🐾'
      };
      return icons[topicName] || '📖';
    };

    const getTopicNameRu = (topicName) => {
      const translations = {
        'Travel': 'Путешествия', 'Business': 'Бизнес', 'Food': 'Еда',
        'Family': 'Семья', 'Education': 'Образование', 'Health': 'Здоровье',
        'Technology': 'Технологии', 'Sports': 'Спорт', 'Music': 'Музыка',
        'Art': 'Искусство', 'Nature': 'Природа', 'Animals': 'Животные'
      };
      return translations[topicName] || topicName;
    };

    const getTopicDescription = (topicName) => {
      const descriptions = {
        'Travel': 'Основные слова для путешествий и туризма',
        'Business': 'Деловая лексика и термины',
        'Food': 'Еда, напитки и приготовление пищи',
        'Family': 'Семья, родственники и отношения',
        'Education': 'Образование, школа, университет',
        'Health': 'Здоровье, медицина, части тела',
        'Technology': 'Технологии, компьютеры, интернет',
        'Sports': 'Спорт, игры, физическая активность'
      };
      return descriptions[topicName] || 'Изучайте новые слова и выражения';
    };

    const getDifficultyIcon = (difficulty) => {
      const icons = { beginner: '🟢', intermediate: '🟡', advanced: '🔴' };
      return icons[difficulty] || '⚪';
    };

    const getDifficultyLabel = (difficulty) => {
      const labels = { 
        beginner: 'Начальный', 
        intermediate: 'Средний', 
        advanced: 'Продвинутый' 
      };
      return labels[difficulty] || difficulty;
    };

    const getTopicProgress = (topic) => {
      if (!userProgress.value || !userProgress.value.topics) return 0;
      const topicProgress = userProgress.value.topics[topic.name];
      return topicProgress ? topicProgress.percentage : 0;
    };

    const isTopicCompleted = (topic) => getTopicProgress(topic) >= 90;
    const isTopicInProgress = (topic) => {
      const progress = getTopicProgress(topic);
      return progress > 0 && progress < 90;
    };

    const getScoreClass = (score) => {
      if (score >= 90) return 'excellent';
      if (score >= 70) return 'good';
      if (score >= 50) return 'average';
      return 'poor';
    };

    // Pronunciation method
    const pronounceWord = async (text, language = languageCode.value) => {
      if (!text || !text.trim()) {
        showToast('Нет текста для произношения', 'error');
        return;
      }

      if ('speechSynthesis' in window) {
        try {
          // Cancel any ongoing speech
          speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(text.trim());
          
          // Set language
          utterance.lang = languageMap[language] || 'en-US';
          utterance.rate = 0.8;
          utterance.pitch = 1;
          utterance.volume = 1;
          
          // Add event listeners
          utterance.onstart = () => {
            console.log('🔊 Speech started:', text);
          };
          
          utterance.onend = () => {
            console.log('🔊 Speech ended:', text);
          };
          
          utterance.onerror = (event) => {
            console.error('🔊 Speech error:', event.error);
            showToast('Ошибка произношения', 'error');
          };
          
          speechSynthesis.speak(utterance);
          
          // Show feedback toast
          const languageName = languageNames[language]?.nameRu || language;
          showToast(`🔊 ${text} (${languageName})`, 'info');
          
        } catch (error) {
          console.warn('⚠️ Speech synthesis failed:', error);
          showToast('Произношение недоступно', 'error');
        }
      } else {
        showToast('Ваш браузер не поддерживает произношение', 'error');
      }
    };

    // Action methods
    const showToast = (message, type = 'success') => {
      toastMessage.value = message;
      toastType.value = type;
      setTimeout(() => { toastMessage.value = ''; }, 3000);
    };

    const goBack = () => {
      if (currentView.value === 'learning' || currentView.value === 'test') {
        currentView.value = 'topics';
        resetLearningState();
      } else {
        router.push({ name: 'VocabularyPage' });
      }
    };

    const goBackToTopics = () => {
      currentView.value = 'topics';
      resetLearningState();
    };

    const selectTopic = async (topic) => {
      selectedTopic.value = topic.name;
      currentView.value = 'learning';
      await fetchTopicWords(topic.name);
    };

    const toggleDifficulty = (difficulty) => {
      selectedDifficulty.value = selectedDifficulty.value === difficulty ? '' : difficulty;
    };

    const clearFilters = () => {
      searchQuery.value = '';
      selectedDifficulty.value = '';
    };

    const openCreateTestModal = () => {
      if (!currentUser.value) {
        showToast('Пожалуйста, войдите в систему для создания теста', 'error');
        return;
      }
      showCreateTestModal.value = true;
    };

    const closeCreateTestModal = () => {
      showCreateTestModal.value = false;
    };

    const createCustomTest = async (config) => {
      testConfig.value = config;
      closeCreateTestModal();
      
      if (config.type === 'random') {
        await fetchRandomWords(config.wordCount);
      } else {
        await fetchTopicsWords(config.topics);
      }
      
      if (currentWords.value.length > 0) {
        startTest();
      } else {
        showToast('Не удалось найти слова для теста', 'error');
      }
    };

    // Learning methods
    const resetLearningState = () => {
      currentWordIndex.value = 0;
      learningProgress.value = [];
      showTranslation.value = false;
      learningComplete.value = false;
      testQuestions.value = [];
      currentQuestionIndex.value = 0;
      userAnswers.value = [];
      testComplete.value = false;
      testResults.value = {};
    };

    const nextWord = () => {
      if (currentWordIndex.value < currentWords.value.length - 1) {
        currentWordIndex.value++;
        showTranslation.value = false;
        window.wordStartTime = Date.now(); // Track time for new word
      } else {
        learningComplete.value = true;
        showToast('🎉 Вы изучили все слова!');
      }
    };

    const previousWord = () => {
      if (currentWordIndex.value > 0) {
        currentWordIndex.value--;
        showTranslation.value = false;
        window.wordStartTime = Date.now(); // Track time for new word
      }
    };

    const toggleTranslation = () => {
      showTranslation.value = !showTranslation.value;
    };

    const markWordAsLearned = async () => {
      const currentWord = currentWords.value[currentWordIndex.value];
      if (!currentWord || learningProgress.value.includes(currentWord._id)) {
        return;
      }

      learningProgress.value.push(currentWord._id);
      
      // Save progress to backend
      await saveLearningProgress(currentWord._id, true);
      
      showToast('✅ Слово отмечено как изученное');
      
      // Track time for next word
      window.wordStartTime = Date.now();
    };

    // Test methods
    const startTest = () => {
      testQuestions.value = generateTestQuestions(currentWords.value);
      currentQuestionIndex.value = 0;
      userAnswers.value = [];
      testComplete.value = false;
      currentView.value = 'test';
    };

    const startTopicTest = () => {
      const learnedWords = currentWords.value.filter(word => 
        learningProgress.value.includes(word._id)
      );

      if (learnedWords.length < 3) {
        showToast('Изучите минимум 3 слова для прохождения теста', 'error');
        return;
      }

      testConfig.value = { type: 'topic', topics: [selectedTopic.value] };
      currentWords.value = learnedWords;
      startTest();
    };

    const generateTestQuestions = (words) => {
      const questions = [];
      const shuffledWords = [...words].sort(() => Math.random() - 0.5);
      const numQuestions = Math.min(10, shuffledWords.length);

      shuffledWords.slice(0, numQuestions).forEach(word => {
        const options = [word.translation];
        const otherWords = words.filter(w => w._id !== word._id);
        const wrongAnswers = otherWords
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(w => w.translation);
        
        options.push(...wrongAnswers);
        
        questions.push({
          word: word.word,
          correctAnswer: word.translation,
          options: options.sort(() => Math.random() - 0.5)
        });
      });

      return questions;
    };

    const submitTestAnswer = (selectedAnswer) => {
      const currentQuestion = testQuestions.value[currentQuestionIndex.value];
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      
      userAnswers.value.push({
        question: currentQuestion,
        userAnswer: selectedAnswer,
        correct: isCorrect
      });

      if (currentQuestionIndex.value < testQuestions.value.length - 1) {
        currentQuestionIndex.value++;
      } else {
        completeTest();
      }
    };

    const completeTest = async () => {
      const correctAnswers = userAnswers.value.filter(a => a.correct).length;
      const totalQuestions = testQuestions.value.length;
      const percentage = Math.round((correctAnswers / totalQuestions) * 100);

      testResults.value = {
        correct: correctAnswers,
        total: totalQuestions,
        percentage: percentage,
        passed: percentage >= 70
      };

      testComplete.value = true;
      
      // Save test results to backend
      if (currentUser.value) {
        try {
          await fetch('/api/vocabulary/test-results', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentUser.value.token || localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
              userId: currentUser.value.uid,
              language: languageCode.value,
              testType: testConfig.value.type,
              topics: testConfig.value.topics || [],
              totalQuestions: totalQuestions,
              correctAnswers: correctAnswers,
              percentage: percentage,
              answers: userAnswers.value,
              timestamp: new Date().toISOString()
            })
          });
        } catch (error) {
          console.error('Error saving test results:', error);
        }
      }
      
      if (testResults.value.passed) {
        showToast(`🎉 Тест пройден! Результат: ${percentage}%`);
      } else {
        showToast(`📚 Продолжайте изучение. Результат: ${percentage}%`, 'info');
      }
    };

    const retakeTest = () => {
      testQuestions.value = generateTestQuestions(currentWords.value);
      currentQuestionIndex.value = 0;
      userAnswers.value = [];
      testComplete.value = false;
    };

    // Data fetching methods with real API integration
    const fetchTopics = async () => {
      try {
        loading.value = true;
        
        if (!currentUser.value) {
          showToast('Пожалуйста, войдите в систему', 'error');
          topics.value = getDefaultTopics();
          return;
        }

        // Fetch topics with vocabulary from lessons and manual topics
        const response = await fetch(`/api/vocabulary/topics/${languageCode.value}?userId=${currentUser.value.uid}`, {
          headers: {
            'Authorization': `Bearer ${currentUser.value.token || localStorage.getItem('authToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          topics.value = data.topics || [];
          
          // Update user progress from API
          userProgress.value = data.userProgress || null;
          
          if (topics.value.length === 0) {
            showToast('В этом языке пока нет доступных тем', 'info');
            topics.value = getDefaultTopics();
          }
        } else if (response.status === 404) {
          showToast('Темы для изучения не найдены', 'info');
          topics.value = getDefaultTopics();
        } else {
          throw new Error('Failed to fetch topics');
        }
        
      } catch (err) {
        console.error('Error fetching topics:', err);
        showToast('Не удалось загрузить темы', 'error');
        // Fallback to default topics
        topics.value = getDefaultTopics();
      } finally {
        loading.value = false;
      }
    };

    const fetchTopicWords = async (topicName) => {
      try {
        loading.value = true;
        
        if (!currentUser.value) {
          showToast('Пожалуйста, войдите в систему', 'error');
          return;
        }

        // Fetch words from both lessons and manual vocabulary for this topic
        const response = await fetch(`/api/vocabulary/topic/${languageCode.value}/${topicName}?userId=${currentUser.value.uid}`, {
          headers: {
            'Authorization': `Bearer ${currentUser.value.token || localStorage.getItem('authToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          currentWords.value = data.words || [];
          
          if (currentWords.value.length === 0) {
            showToast('В этой теме пока нет слов', 'info');
          } else {
            // Initialize word timing
            window.wordStartTime = Date.now();
          }
        } else if (response.status === 404) {
          showToast('Тема не найдена', 'error');
          currentWords.value = [];
        } else {
          throw new Error('Failed to fetch words');
        }
        
        resetLearningState();
        
      } catch (err) {
        console.error('Error fetching words:', err);
        showToast('Не удалось загрузить слова', 'error');
        currentWords.value = [];
      } finally {
        loading.value = false;
      }
    };

    const fetchRandomWords = async (count) => {
      try {
        loading.value = true;
        
        if (!currentUser.value) {
          showToast('Пожалуйста, войдите в систему', 'error');
          return;
        }

        // Fetch random words from user's vocabulary across all topics
        const response = await fetch(`/api/vocabulary/random/${languageCode.value}?userId=${currentUser.value.uid}&count=${count}`, {
          headers: {
            'Authorization': `Bearer ${currentUser.value.token || localStorage.getItem('authToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          currentWords.value = data.words || [];
          
          if (currentWords.value.length === 0) {
            showToast('Недостаточно слов для создания теста', 'error');
          } else if (currentWords.value.length < count) {
            showToast(`Найдено только ${currentWords.value.length} слов из ${count} запрошенных`, 'info');
          }
        } else {
          throw new Error('Failed to fetch random words');
        }
        
      } catch (err) {
        console.error('Error fetching random words:', err);
        showToast('Не удалось загрузить случайные слова', 'error');
        currentWords.value = [];
      } finally {
        loading.value = false;
      }
    };

    const fetchTopicsWords = async (topicNames) => {
      try {
        loading.value = true;
        
        if (!currentUser.value) {
          showToast('Пожалуйста, войдите в систему', 'error');
          return;
        }

        // Fetch words from multiple topics
        const response = await fetch(`/api/vocabulary/topics-words/${languageCode.value}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.value.token || localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            userId: currentUser.value.uid,
            topics: topicNames
          })
        });

        if (response.ok) {
          const data = await response.json();
          currentWords.value = data.words || [];
          
          if (currentWords.value.length === 0) {
            showToast('В выбранных темах нет слов', 'error');
          }
        } else {
          throw new Error('Failed to fetch topics words');
        }
        
      } catch (err) {
        console.error('Error fetching topics words:', err);
        showToast('Не удалось загрузить слова из выбранных тем', 'error');
        currentWords.value = [];
      } finally {
        loading.value = false;
      }
    };

    // Progress tracking method
    const saveLearningProgress = async (wordId, isCorrect = true) => {
      if (!currentUser.value) return;

      try {
        await fetch('/api/vocabulary/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.value.token || localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            userId: currentUser.value.uid,
            vocabularyId: wordId,
            language: languageCode.value,
            correct: isCorrect,
            timeSpent: Date.now() - (window.wordStartTime || Date.now())
          })
        });
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    };

    // Helper function for default topics (fallback only)
    const getDefaultTopics = () => {
      return [
        { name: 'Travel', difficulty: 'beginner', wordCount: 0 },
        { name: 'Food', difficulty: 'beginner', wordCount: 0 },
        { name: 'Family', difficulty: 'intermediate', wordCount: 0 },
        { name: 'Business', difficulty: 'intermediate', wordCount: 0 },
        { name: 'Technology', difficulty: 'advanced', wordCount: 0 },
        { name: 'Health', difficulty: 'beginner', wordCount: 0 }
      ];
    };

    // Keyboard shortcuts
    const handleKeyPress = (event) => {
      // Only handle keyboard shortcuts if not typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'p':
          event.preventDefault();
          if (currentView.value === 'learning' && currentWords.value[currentWordIndex.value]) {
            pronounceWord(currentWords.value[currentWordIndex.value].word);
          } else if (currentView.value === 'test' && testQuestions.value[currentQuestionIndex.value]) {
            pronounceWord(testQuestions.value[currentQuestionIndex.value].word);
          }
          break;
        case 't':
          event.preventDefault();
          if (currentView.value === 'learning' && showTranslation.value && currentWords.value[currentWordIndex.value]) {
            pronounceWord(currentWords.value[currentWordIndex.value].translation, 'russian');
          }
          break;
        case 'arrowleft':
          event.preventDefault();
          if (currentView.value === 'learning') {
            previousWord();
          }
          break;
        case 'arrowright':
          event.preventDefault();
          if (currentView.value === 'learning') {
            nextWord();
          }
          break;
        case ' ':
          event.preventDefault();
          if (currentView.value === 'learning') {
            toggleTranslation();
          }
          break;
      }
    };

    // Lifecycle
    onMounted(async () => {
      await fetchTopics();
      
      // Add keyboard event listener
      document.addEventListener('keydown', handleKeyPress);
      
      // Check for test mode from query params
      if (route.query.mode === 'test') {
        const config = {
          type: route.query.type || 'random',
          wordCount: parseInt(route.query.count) || 10,
          topics: route.query.topics ? route.query.topics.split(',') : []
        };
        
        createCustomTest(config);
      }
      
      // Initialize word timing
      window.wordStartTime = Date.now();
    });

    onUnmounted(() => {
      // Remove keyboard event listener
      document.removeEventListener('keydown', handleKeyPress);
      
      // Cancel any ongoing speech
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    });

    return {
      // Data
      loading,
      languageCode,
      currentView,
      topics,
      currentWords,
      searchQuery,
      selectedDifficulty,
      selectedTopic,
      showCreateTestModal,
      toastMessage,
      toastType,
      currentWordIndex,
      learningProgress,
      showTranslation,
      learningComplete,
      testConfig,
      testQuestions,
      currentQuestionIndex,
      userAnswers,
      testComplete,
      testResults,
      difficultyLevels,
      
      // Computed
      filteredTopics,
      currentUser,
      
      // Methods
      getLanguageFlag,
      getSelectedLanguageName,
      getTopicIcon,
      getTopicNameRu,
      getTopicDescription,
      getDifficultyIcon,
      getDifficultyLabel,
      getTopicProgress,
      isTopicCompleted,
      isTopicInProgress,
      getScoreClass,
      pronounceWord,
      goBack,
      goBackToTopics,
      selectTopic,
      toggleDifficulty,
      clearFilters,
      openCreateTestModal,
      closeCreateTestModal,
      createCustomTest,
      nextWord,
      previousWord,
      toggleTranslation,
      markWordAsLearned,
      startTopicTest,
      submitTestAnswer,
      retakeTest
    };
  }
};
</script>

<style scoped>
/* ===== CSS VARIABLES ===== */
:root {
  /* Brand Colors */
  --brand-purple: #8b5cf6;
  --brand-purple-dark: #7c3aed;
  --brand-purple-light: #a78bfa;
  
  /* Base Colors */
  --black: #000000;
  --white: #ffffff;
  
  /* Gray Scale */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* Status Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-purple-dark) 100%);
  --gradient-success: linear-gradient(135deg, var(--success) 0%, #059669 100%);
  --gradient-card: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.3s ease;
  --transition-slow: 0.5s ease;
}

/* ===== BASE STYLES ===== */
.vocabulary-in-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px 24px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: var(--black);
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
}

.vocabulary-in-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.06) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

/* ===== HEADER STYLES ===== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 48px;
  padding: 24px 32px;
  background: var(--white);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.1);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--gradient-primary);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--gray-50);
  border: 2px solid var(--gray-200);
  color: var(--gray-700);
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.back-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent);
  transition: left var(--transition-slow);
}

.back-btn:hover::before {
  left: 100%;
}

.back-btn:hover {
  background: var(--gray-100);
  border-color: var(--brand-purple);
  transform: translateX(-4px);
}

.language-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  justify-content: center;
}

.language-flag-container {
  position: relative;
}

.language-flag {
  font-size: 48px;
  position: relative;
  z-index: 2;
  animation: bounce 3s ease-in-out infinite;
}

.flag-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

.language-details {
  text-align: center;
}

.language-title {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 8px 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.025em;
}

.language-subtitle {
  font-size: 16px;
  color: var(--gray-600);
  margin: 0;
  font-weight: 500;
}

.create-test-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--gradient-primary);
  color: var(--white);
  border: none;
  padding: 12px 20px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.btn-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left var(--transition-slow);
}

.create-test-btn:hover .btn-glow {
  left: 100%;
}

.create-test-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

/* ===== PRONUNCIATION BUTTONS ===== */
.word-main-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.pronunciation-btn {
  background: var(--gradient-primary);
  color: var(--white);
  border: none;
  padding: 12px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.pronunciation-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left var(--transition-slow);
}

.pronunciation-btn:hover::before {
  left: 100%;
}

.pronunciation-btn:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.pronunciation-btn:active {
  transform: translateY(0) scale(0.95);
}

.word-pronunciation-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background: var(--gradient-primary);
  color: var(--white);
  border: none;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  z-index: 10;
}

.word-pronunciation-btn:hover {
  transform: scale(1.2);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.mini-pronunciation-btn {
  background: var(--gradient-primary);
  color: var(--white);
  border: none;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-left: 8px;
  transition: all var(--transition-normal);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

.mini-pronunciation-btn:hover {
  background: var(--brand-purple-dark);
  transform: scale(1.1);
}

/* ===== LOADING STATE ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
  background: var(--white);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.loading-animation {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
}

.loading-circle {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--brand-purple);
  border-radius: 50%;
  animation: loadingBounce 1.5s infinite ease-in-out;
}

.loading-circle:nth-child(1) {
  left: 0;
  top: 30px;
  animation-delay: -0.32s;
}

.loading-circle:nth-child(2) {
  left: 30px;
  top: 30px;
  animation-delay: -0.16s;
}

.loading-circle:nth-child(3) {
  left: 60px;
  top: 30px;
}

.loading-state span {
  color: var(--gray-600);
  font-size: 16px;
  font-weight: 500;
}

/* ===== TOPICS SECTION ===== */
.topics-section {
  margin-bottom: 64px;
  animation: fadeInUp 0.8s ease 0.2s both;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 40px;
  align-items: center;
}

.search-container {
  position: relative;
  max-width: 500px;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: var(--gray-400);
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 16px 16px 16px 50px;
  border: 2px solid var(--gray-200);
  border-radius: 16px;
  font-size: 16px;
  background: var(--white);
  transition: all var(--transition-normal);
  position: relative;
  z-index: 1;
}

.search-input:focus {
  outline: none;
  border-color: var(--brand-purple);
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}

.search-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 16px;
  opacity: 0;
  transition: opacity var(--transition-normal);
  z-index: 0;
}

.search-input:focus ~ .search-glow {
  opacity: 0.1;
}

.filter-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  border: 2px solid var(--gray-200);
  color: var(--gray-700);
  padding: 10px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.filter-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: var(--gradient-primary);
  transition: left 0.4s ease;
  z-index: 0;
}

.filter-btn:hover::before,
.filter-btn.active::before {
  left: 0;
}

.filter-btn:hover,
.filter-btn.active {
  border-color: var(--brand-purple);
  color: var(--white);
  transform: translateY(-2px);
}

.filter-icon,
.filter-btn span {
  position: relative;
  z-index: 1;
}

/* ===== TOPICS GRID ===== */
.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.topic-card {
  background: var(--white);
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.topic-card:hover .card-glow {
  transform: scaleX(1);
}

.topic-card:hover {
  transform: translateY(-12px) scale(1.02);
  border-color: var(--brand-purple);
  box-shadow: 0 20px 60px rgba(139, 92, 246, 0.25);
}

.topic-card.completed {
  border-color: var(--success);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%);
}

.topic-card.in-progress {
  border-color: var(--warning);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.topic-icon-container {
  position: relative;
}

.topic-icon {
  font-size: 48px;
  position: relative;
  z-index: 2;
  animation: float 4s ease-in-out infinite;
}

.icon-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 40px;
  background: radial-gradient(ellipse, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  animation: translationGlow 2s ease-in-out infinite;
}

.topic-status {
  position: relative;
}

.status-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--white);
  position: relative;
  overflow: hidden;
}

.status-indicator.completed {
  background: var(--gradient-success);
  animation: successPulse 2s ease-in-out infinite;
}

.status-indicator.in-progress {
  background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%);
  animation: progressSpin 3s linear infinite;
}

.status-icon {
  font-size: 16px;
}

.card-content {
  margin-bottom: 20px;
  text-align: center;
}

.topic-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--black);
  margin: 0 0 8px 0;
  line-height: 1.3;
}

.topic-description {
  font-size: 14px;
  color: var(--gray-600);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.topic-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--gray-50);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-700);
  transition: all var(--transition-normal);
}

.topic-card:hover .meta-item {
  background: var(--gradient-card);
  color: var(--brand-purple);
}

.meta-item.difficulty.beginner {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.meta-item.difficulty.intermediate {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.meta-item.difficulty.advanced {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.meta-icon {
  font-size: 14px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  position: relative;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--gray-200);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: progressShimmer 2s ease-in-out infinite;
}

.progress-text {
  font-size: 12px;
  font-weight: 700;
  color: var(--brand-purple);
  min-width: 35px;
}

.card-hover-effect {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--gradient-card);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  opacity: 0;
  transform: translateY(10px);
  transition: all var(--transition-normal);
}

.topic-card:hover .card-hover-effect {
  opacity: 1;
  transform: translateY(0);
}

.hover-text {
  font-weight: 600;
  color: var(--brand-purple);
  font-size: 14px;
}

.hover-arrow {
  font-size: 18px;
  color: var(--brand-purple);
  transition: transform var(--transition-normal);
}

.topic-card:hover .hover-arrow {
  transform: translateX(4px);
}

/* ===== EMPTY STATE ===== */
.empty-state {
  text-align: center;
  padding: 80px 24px;
  background: var(--white);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.empty-animation {
  margin-bottom: 24px;
  position: relative;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

.empty-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.empty-dots span {
  width: 8px;
  height: 8px;
  background: var(--brand-purple);
  border-radius: 50%;
  animation: dotBounce 1.5s infinite ease-in-out;
}

.empty-dots span:nth-child(1) { animation-delay: -0.32s; }
.empty-dots span:nth-child(2) { animation-delay: -0.16s; }

.empty-state h3 {
  font-size: 24px;
  font-weight: 700;
  color: var(--black);
  margin: 0 0 12px 0;
}

.empty-state p {
  color: var(--gray-600);
  margin-bottom: 32px;
  font-size: 16px;
  line-height: 1.6;
}

.clear-btn {
  background: var(--gradient-primary);
  color: var(--white);
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.clear-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left var(--transition-slow);
}

.clear-btn:hover::before {
  left: 100%;
}

.clear-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

/* ===== LEARNING SECTION ===== */
.learning-section {
  margin-bottom: 64px;
  animation: fadeInUp 0.8s ease 0.2s both;
}

.learning-header {
  text-align: center;
  margin-bottom: 40px;
  background: var(--white);
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.learning-info h2 {
  font-size: 28px;
  font-weight: 800;
  color: var(--black);
  margin: 0 0 8px 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.learning-info p {
  color: var(--gray-600);
  margin: 0 0 32px 0;
  font-size: 16px;
}

.learning-progress {
  max-width: 400px;
  margin: 0 auto;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-counter {
  font-weight: 700;
  color: var(--black);
  font-size: 16px;
}

.progress-percentage {
  font-weight: 700;
  color: var(--brand-purple);
  font-size: 16px;
}

.progress-bar-learning {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill-learning {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-sparkle {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: sparkle 2s ease-in-out infinite;
}

/* ===== LEARNING COMPLETE ===== */
.learning-complete {
  background: var(--white);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 2px solid var(--success);
  position: relative;
  overflow: hidden;
}

.complete-animation {
  position: relative;
  margin-bottom: 32px;
}

.complete-icon {
  font-size: 80px;
  animation: celebrate 2s ease-in-out infinite;
}

.celebration-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--success);
  border-radius: 50%;
  animation: particleFloat 3s ease-in-out infinite;
}

.particle:nth-child(1) { animation-delay: 0s; top: -40px; left: -30px; }
.particle:nth-child(2) { animation-delay: 0.5s; top: -50px; left: 20px; }
.particle:nth-child(3) { animation-delay: 1s; top: -30px; left: 40px; }
.particle:nth-child(4) { animation-delay: 1.5s; top: 30px; left: -40px; }
.particle:nth-child(5) { animation-delay: 2s; top: 40px; left: 30px; }
.particle:nth-child(6) { animation-delay: 2.5s; top: 20px; left: -20px; }

.complete-content h3 {
  font-size: 32px;
  font-weight: 800;
  color: var(--success);
  margin: 0 0 16px 0;
}

.complete-content p {
  color: var(--gray-600);
  margin-bottom: 32px;
  font-size: 18px;
  line-height: 1.6;
}

.complete-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-bottom: 40px;
}

.stat-item {
  text-align: center;
}

.stat-circle {
  width: 80px;
  height: 80px;
  background: var(--gradient-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  position: relative;
  overflow: hidden;
}

.stat-circle::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: statShimmer 3s ease-in-out infinite;
}

.stat-number {
  font-size: 24px;
  font-weight: 800;
  color: var(--white);
  position: relative;
  z-index: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--gray-600);
  font-weight: 500;
}

.complete-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* ===== BUTTONS ===== */
.btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.btn.primary {
  background: var(--gradient-primary);
  color: var(--white);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.btn.primary:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.btn.secondary {
  background: var(--white);
  color: var(--gray-700);
  border-color: var(--gray-300);
}

.btn.secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
  transform: translateY(-2px);
}

.btn.secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn.success {
  background: var(--gradient-success);
  color: var(--white);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.btn.success:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
}

.btn-icon {
  font-size: 18px;
  transition: transform var(--transition-normal);
}

.btn:hover .btn-icon {
  transform: scale(1.1);
}

/* ===== WORD CONTAINER ===== */
.word-container {
  position: relative;
  max-width: 700px;
  margin: 0 auto;
}

.word-card {
  background: var(--white);
  border-radius: 24px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 2px solid rgba(139, 92, 246, 0.1);
  position: relative;
  overflow: hidden;
  animation: wordAppear 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.word-card-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--gradient-primary);
  animation: wordGlow 3s ease-in-out infinite;
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.word-number {
  background: var(--gradient-primary);
  color: var(--white);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.word-type {
  background: var(--gray-100);
  color: var(--gray-700);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.word-main {
  font-size: 48px;
  font-weight: 800;
  color: var(--black);
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.word-details {
  margin-bottom: 40px;
}

.translation-section {
  margin-bottom: 24px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--gray-100);
  color: var(--gray-700);
  border: 2px solid var(--gray-300);
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  margin: 0 auto 20px;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.toggle-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: var(--gradient-primary);
  opacity: 0;
  transition: all var(--transition-normal);
}

.toggle-btn.active .toggle-glow,
.toggle-btn:hover .toggle-glow {
  left: 0;
  opacity: 1;
}

.toggle-btn.active,
.toggle-btn:hover {
  color: var(--white);
  border-color: var(--brand-purple);
  transform: translateY(-2px);
}

.toggle-icon {
  font-size: 16px;
  position: relative;
  z-index: 1;
}

.toggle-btn span {
  position: relative;
  z-index: 1;
}

.word-translation {
  position: relative;
  margin-bottom: 16px;
}

.translation-text {
  font-size: 24px;
  font-weight: 700;
  color: var(--brand-purple);
  animation: translateAppear 0.4s ease;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.translation-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 60px;
  background: radial-gradient(ellipse, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  animation: testWordGlow 3s ease-in-out infinite;
}

.word-example {
  background: var(--gray-50);
  padding: 20px;
  border-radius: 16px;
  border-left: 4px solid var(--brand-purple);
  text-align: left;
  margin-top: 16px;
}

.example-label {
  font-weight: 700;
  color: var(--brand-purple);
  margin-bottom: 8px;
  font-size: 14px;
}

.example-text {
  color: var(--gray-700);
  font-style: italic;
  line-height: 1.6;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.word-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.nav-btn {
  min-width: 140px;
}

.learn-btn {
  min-width: 120px;
}

/* ===== FLOATING TEST BUTTON ===== */
.floating-test-btn {
  position: fixed;
  bottom: 32px;
  right: 32px;
  background: var(--gradient-primary);
  color: var(--white);
  border: none;
  padding: 16px 20px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  position: relative;
  overflow: hidden;
}

.floating-test-btn:hover:not(:disabled) {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.5);
}

.floating-test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.floating-icon {
  font-size: 20px;
}

.floating-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.floating-counter {
  font-size: 12px;
  opacity: 0.9;
}

.floating-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: floatingGlow 3s ease-in-out infinite;
}

/* ===== TEST SECTION ===== */
.test-section {
  margin-bottom: 64px;
  animation: fadeInUp 0.8s ease 0.2s both;
}

.test-header {
  text-align: center;
  margin-bottom: 40px;
  background: var(--white);
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.test-header h2 {
  font-size: 28px;
  font-weight: 800;
  color: var(--black);
  margin: 0 0 8px 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.test-header p {
  color: var(--gray-600);
  font-size: 16px;
}

/* ===== TEST RESULTS ===== */
.test-results {
  background: var(--white);
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.results-animation {
  position: relative;
  margin-bottom: 32px;
}

.results-icon {
  font-size: 80px;
  animation: resultsAnimation 2s ease-in-out infinite;
}

.results-icon.passed {
  color: var(--success);
}

.results-icon.failed {
  color: var(--warning);
}

.results-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.result-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--success);
  border-radius: 50%;
  animation: resultParticleFloat 4s ease-in-out infinite;
}

.result-particle:nth-child(1) { animation-delay: 0s; top: -50px; left: -40px; }
.result-particle:nth-child(2) { animation-delay: 0.5s; top: -60px; left: 30px; }
.result-particle:nth-child(3) { animation-delay: 1s; top: -40px; left: 50px; }
.result-particle:nth-child(4) { animation-delay: 1.5s; top: 40px; left: -50px; }
.result-particle:nth-child(5) { animation-delay: 2s; top: 50px; left: 40px; }
.result-particle:nth-child(6) { animation-delay: 2.5s; top: 30px; left: -30px; }
.result-particle:nth-child(7) { animation-delay: 3s; top: -30px; left: 0px; }
.result-particle:nth-child(8) { animation-delay: 3.5s; top: 0px; left: 60px; }

.results-content h3 {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 32px 0;
}

.results-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-bottom: 40px;
}

.result-item {
  text-align: center;
}

.result-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  position: relative;
  overflow: hidden;
  background: var(--gradient-primary);
}

.result-circle.excellent {
  background: var(--gradient-success);
}

.result-circle.good {
  background: var(--gradient-primary);
}

.result-circle.average {
  background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%);
}

.result-circle.poor {
  background: linear-gradient(135deg, var(--error) 0%, #dc2626 100%);
}

.result-circle::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: resultShimmer 3s ease-in-out infinite;
}

.result-number {
  font-size: 24px;
  font-weight: 800;
  color: var(--white);
  position: relative;
  z-index: 1;
}

.result-label {
  font-size: 14px;
  color: var(--gray-600);
  font-weight: 500;
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* ===== TEST QUESTION ===== */
.test-question {
  max-width: 800px;
  margin: 0 auto;
}

.question-progress {
  margin-bottom: 32px;
}

.progress-bar-test {
  width: 100%;
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill-test {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-pulse {
  position: absolute;
  top: 0;
  right: 0;
  width: 30px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: progressPulse 2s ease-in-out infinite;
}

.question-content {
  text-align: center;
  margin-bottom: 40px;
  background: var(--white);
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.question-header {
  margin-bottom: 24px;
}

.question-number {
  background: var(--gradient-primary);
  color: var(--white);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  margin: 0 auto 16px;
  animation: questionNumberPulse 2s ease-in-out infinite;
}

.question-header h3 {
  font-size: 20px;
  color: var(--gray-600);
  margin: 0;
  font-weight: 600;
}

.test-word {
  position: relative;
  margin-bottom: 16px;
}

.word-text {
  font-size: 48px;
  font-weight: 800;
  color: var(--black);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.word-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 60px;
  background: radial-gradient(ellipse, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
  animation: testWordGlow 3s ease-in-out infinite;
}

.question-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.option-btn {
  background: var(--white);
  border: 2px solid var(--gray-200);
  color: var(--gray-700);
  padding: 20px;
  border-radius: 16px;
  cursor: pointer;
  transition: all var(--transition-normal);
  text-align: left;
  min-height: 80px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
}

.option-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: var(--gradient-primary);
  opacity: 0;
  transition: all var(--transition-normal);
}

.option-btn:hover .option-glow {
  left: 0;
  opacity: 0.1;
}

.option-btn:hover {
  border-color: var(--brand-purple);
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2);
}

.option-letter {
  background: var(--gray-100);
  color: var(--gray-700);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  transition: all var(--transition-normal);
  position: relative;
  z-index: 1;
}

.option-btn:hover .option-letter {
  background: var(--brand-purple);
  color: var(--white);
}

.option-text {
  font-size: 16px;
  font-weight: 500;
  position: relative;
  z-index: 1;
  flex: 1;
}

/* ===== TOAST ===== */
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  background: var(--white);
  color: var(--black);
  padding: 16px 24px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  animation: toastSlideIn 0.4s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 2px solid var(--brand-purple);
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 400px;
  position: relative;
  overflow: hidden;
}

.toast.error {
  border-color: var(--error);
  background: #fef2f2;
  color: #991b1b;
}

.toast.success {
  border-color: var(--success);
  background: #ecfdf5;
  color: #065f46;
}

.toast.info {
  border-color: var(--brand-purple);
  background: #f5f3ff;
  color: #5b21b6;
}

.toast-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.toast-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.2), transparent);
  animation: toastGlow 3s ease-in-out infinite;
}

/* ===== ANIMATIONS ===== */
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  60% { transform: translateY(-4px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
}

@keyframes loadingBounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}

@keyframes translationGlow {
  0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scaleX(1); }
  50% { opacity: 0.7; transform: translate(-50%, -50%) scaleX(1.2); }
}

@keyframes successPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}

@keyframes progressSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes progressShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes sparkle {
  0%, 100% { opacity: 0; transform: translateX(-10px); }
  50% { opacity: 1; transform: translateX(10px); }
}

@keyframes celebrate {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-5deg); }
  75% { transform: scale(1.1) rotate(5deg); }
}

@keyframes particleFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
  50% { transform: translateY(-20px) scale(1.2); opacity: 0.7; }
}

@keyframes statShimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes wordAppear {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes wordGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes translateAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes floatingGlow {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes resultsAnimation {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-3deg); }
  75% { transform: scale(1.1) rotate(3deg); }
}

@keyframes resultParticleFloat {
  0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
  50% { transform: translateY(-30px) scale(1.5); opacity: 0.7; }
}

@keyframes resultShimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes progressPulse {
  0%, 100% { opacity: 0; transform: translateX(-15px); }
  50% { opacity: 1; transform: translateX(15px); }
}

@keyframes questionNumberPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
}

@keyframes testWordGlow {
  0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes toastSlideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toastGlow {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 1024px) {
  .vocabulary-in-page {
    padding: 24px 20px;
  }

  .topics-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .complete-stats {
    gap: 32px;
  }

  .results-stats {
    gap: 32px;
  }
}

@media (max-width: 768px) {
  .vocabulary-in-page {
    padding: 20px 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
    padding: 20px;
  }

  .language-info {
    flex-direction: column;
    gap: 12px;
  }

  .language-flag {
    font-size: 40px;
  }

  .language-title {
    font-size: 24px;
  }

  .topics-grid {
    grid-template-columns: 1fr;
  }

  .controls {
    align-items: stretch;
  }

  .filter-buttons {
    gap: 8px;
  }

  .word-card {
    padding: 32px 24px;
  }

  .word-main {
    font-size: 36px;
  }

  .word-main-container {
    flex-direction: column;
    gap: 12px;
  }

  .pronunciation-btn {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }

  .word-pronunciation-btn {
    width: 32px;
    height: 32px;
    font-size: 14px;
    padding: 6px;
  }

  .word-actions {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    width: 100%;
    max-width: 250px;
    justify-content: center;
  }

  .complete-stats {
    flex-direction: column;
    gap: 24px;
  }

  .results-stats {
    flex-direction: column;
    gap: 24px;
  }

  .question-options {
    grid-template-columns: 1fr;
  }

  .floating-test-btn {
    bottom: 20px;
    right: 20px;
    padding: 12px 16px;
  }

  .floating-text {
    font-size: 14px;
  }

  .floating-counter {
    font-size: 11px;
  }

  .test-word .word-text {
    font-size: 36px;
  }
}

@media (max-width: 480px) {
  .language-flag {
    font-size: 32px;
  }

  .language-title {
    font-size: 20px;
  }

  .topic-meta {
    flex-direction: column;
    gap: 8px;
  }

  .word-main {
    font-size: 28px;
  }

  .pronunciation-btn {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .complete-content h3 {
    font-size: 24px;
  }

  .results-content h3 {
    font-size: 24px;
  }

  .test-word .word-text {
    font-size: 28px;
  }

  .option-btn {
    padding: 16px;
    min-height: 60px;
  }

  .option-text {
    font-size: 14px;
  }

  .toast {
    left: 16px;
    right: 16px;
    top: 16px;
    max-width: none;
  }
}

/* ===== ACCESSIBILITY ===== */
.topic-card:focus,
.btn:focus,
.option-btn:focus,
.toggle-btn:focus,
.pronunciation-btn:focus,
.word-pronunciation-btn:focus,
.mini-pronunciation-btn:focus {
  outline: 3px solid var(--brand-purple);
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .topic-card,
  .word-card,
  .option-btn {
    border-width: 3px;
  }
  
  .pronunciation-btn,
  .word-pronunciation-btn,
  .mini-pronunciation-btn {
    border: 2px solid var(--white);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ===== KEYBOARD SHORTCUTS INDICATOR ===== */
.vocabulary-in-page::after {
  content: "Горячие клавиши: P - произношение, T - перевод, ← → - навигация, Пробел - показать/скрыть перевод";
  position: fixed;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1001;
  max-width: 90vw;
  text-align: center;
}

.vocabulary-in-page:hover::after {
  opacity: 1;
}

@media (max-width: 768px) {
  .vocabulary-in-page::after {
    display: none;
  }
}
</style>