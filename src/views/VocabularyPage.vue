<template>
  <div class="vocabulary-system">
    <!-- Header -->
    <div class="header">
      <button v-if="canGoBack" @click="goBack" class="back-btn">← Назад</button>
      <h1>{{ currentTitle }}</h1>
      <div v-if="breadcrumb" class="breadcrumb">{{ breadcrumb }}</div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Загрузка...</p>
    </div>

    <!-- Languages Grid -->
    <div v-else-if="currentView === 'languages'" class="cards-grid">
      <div v-for="lang in languages" :key="lang.code" class="card language-card" @click="selectLanguage(lang)">
        <div class="card-header">
          <span class="flag">{{ lang.flag }}</span>
          <h3>{{ lang.nameRu }}</h3>
        </div>
        <div class="stats">
          <div class="stat">
            <span class="number">{{ lang.totalWords }}</span>
            <span class="label">слов</span>
          </div>
          <div class="stat">
            <span class="number">{{ lang.levels?.length || 0 }}</span>
            <span class="label">уровней</span>
          </div>
        </div>
        <div class="progress">
          <div class="progress-bar">
            <div class="fill" :style="{ width: lang.progress + '%' }"></div>
          </div>
          <span>{{ lang.progress }}% изучено</span>
        </div>
      </div>
    </div>

    <!-- Levels Grid -->
    <div v-else-if="currentView === 'levels'" class="cards-grid">
      <div v-for="level in levels" :key="level.level" class="card level-card" @click="selectLevel(level)">
        <div class="card-header">
          <span class="icon">{{ getLevelIcon(level.level) }}</span>
          <h3>Уровень {{ level.level }}</h3>
        </div>
        <p class="description">{{ getLevelDescription(level.level) }}</p>
        <div class="stats">
          <div class="stat">
            <span class="number">{{ level.totalWords }}</span>
            <span class="label">слов</span>
          </div>
          <div class="stat">
            <span class="number">{{ level.topicCount }}</span>
            <span class="label">тем</span>
          </div>
        </div>
        <div class="difficulty" :class="getDifficulty(level.level)">
          {{ getDifficultyLabel(getDifficulty(level.level)) }}
        </div>
      </div>
    </div>

    <!-- Topics Grid -->
    <div v-else-if="currentView === 'topics'" class="cards-grid">
      <div v-for="topic in topics" :key="topic.name" class="card topic-card" @click="selectTopic(topic)">
        <div class="card-header">
          <span class="icon">{{ getTopicIcon(topic.name) }}</span>
          <h3>{{ getTopicNameRu(topic.name) }}</h3>
        </div>
        <p class="description">{{ getTopicDescription(topic.name) }}</p>
        <div class="stats">
          <div class="stat">
            <span class="number">{{ topic.totalWords }}</span>
            <span class="label">слов</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Words List -->
    <div v-else-if="currentView === 'words'" class="words-container">
      <div class="words-header">
        <div class="search-bar">
          <input v-model="searchQuery" placeholder="Поиск слов..." class="search-input">
        </div>
        <div class="filters">
          <button @click="showAll = !showAll" :class="{ active: showAll }" class="filter-btn">
            {{ showAll ? 'Показать изученные' : 'Показать все' }}
          </button>
        </div>
      </div>

      <div class="words-grid">
        <div v-for="word in filteredWords" :key="word.id" class="word-card" @click="selectWord(word)">
          <div class="word-header">
            <h4 class="word-text">{{ word.word }}</h4>
            <button @click.stop="pronounceWord(word.word)" class="pronounce-btn">🔊</button>
          </div>
          <p class="translation">{{ word.translation }}</p>
          <div v-if="word.definition" class="definition">{{ word.definition }}</div>
          <div class="word-meta">
            <span class="pos">{{ getPartOfSpeechRu(word.partOfSpeech) }}</span>
            <span class="difficulty" :class="word.difficulty">{{ getDifficultyLabel(word.difficulty) }}</span>
          </div>
          <div class="progress">
            <div class="progress-bar">
              <div class="fill" :style="{ width: (word.progress || 0) + '%' }"></div>
            </div>
            <span>{{ word.progress || 0 }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Word Detail Modal -->
    <div v-if="selectedWord" class="modal-overlay" @click="closeWordModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedWord.word }}</h3>
          <button @click="closeWordModal">×</button>
        </div>
        <div class="modal-body">
          <div class="word-details">
            <div class="pronunciation" v-if="selectedWord.pronunciation">
              /{{ selectedWord.pronunciation }}/
              <button @click="pronounceWord(selectedWord.word)" class="pronounce-btn">🔊</button>
            </div>
            <div class="translation-large">{{ selectedWord.translation }}</div>
            <div v-if="selectedWord.definition" class="definition-large">{{ selectedWord.definition }}</div>
            <div v-if="selectedWord.examples?.length" class="examples">
              <h4>Примеры:</h4>
              <div v-for="example in selectedWord.examples" :key="example.sentence" class="example">
                <p class="sentence">{{ example.sentence }}</p>
                <p class="translation">{{ example.translation }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="markAsKnown(selectedWord)" class="btn success">✅ Знаю</button>
          <button @click="markAsUnknown(selectedWord)" class="btn warning">❌ Не знаю</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.visible" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

// ========================================
// STATE & REACTIVE DATA
// ========================================
const { currentUser } = useAuth()

const loading = ref(false)
const currentView = ref('languages') // 'languages', 'levels', 'topics', 'words'
const selectedLanguage = ref(null)
const selectedLevel = ref(null)
const selectedTopic = ref(null)
const selectedWord = ref(null)
const searchQuery = ref('')
const showAll = ref(false)

const languages = ref([])
const levels = ref([])
const topics = ref([])
const words = ref([])

const toast = ref({ visible: false, message: '', type: 'success' })

// ========================================
// COMPUTED PROPERTIES
// ========================================
const canGoBack = computed(() => currentView.value !== 'languages')

const currentTitle = computed(() => {
  switch (currentView.value) {
    case 'languages': return '📚 Словарь'
    case 'levels': return selectedLanguage.value?.nameRu || 'Уровни'
    case 'topics': return `Уровень ${selectedLevel.value} - Темы`
    case 'words': return selectedTopic.value?.nameRu || 'Слова'
    default: return 'Словарь'
  }
})

const breadcrumb = computed(() => {
  const parts = []
  if (selectedLanguage.value) parts.push(selectedLanguage.value.nameRu)
  if (selectedLevel.value) parts.push(`Уровень ${selectedLevel.value}`)
  if (selectedTopic.value) parts.push(selectedTopic.value.nameRu)
  return parts.join(' → ')
})

const filteredWords = computed(() => {
  let filtered = words.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(word => 
      word.word.toLowerCase().includes(query) ||
      word.translation.toLowerCase().includes(query)
    )
  }
  
  if (!showAll.value) {
    filtered = filtered.filter(word => (word.progress || 0) < 90)
  }
  
  return filtered
})

// ========================================
// API FUNCTIONS (SIMPLIFIED)
// ========================================
const getUserVocabulary = async (userId, languageCode = null) => {
  try {
    const endpoint = languageCode 
      ? `/api/vocabulary/user/${userId}/language/${languageCode}`
      : `/api/vocabulary/user/${userId}`
    
    const response = await fetch(endpoint)
    const data = await response.json()
    
    if (data.success) {
      return languageCode ? data.vocabulary : data.data
    } else {
      throw new Error(data.error || 'Failed to fetch vocabulary')
    }
  } catch (error) {
    console.error('❌ API Error:', error)
    return []
  }
}

// ========================================
// NAVIGATION METHODS
// ========================================
const selectLanguage = async (language) => {
  selectedLanguage.value = language
  currentView.value = 'levels'
  await loadLevels(language)
}

const selectLevel = async (level) => {
  selectedLevel.value = level.level
  currentView.value = 'topics'
  await loadTopics(selectedLanguage.value, level.level)
}

const selectTopic = async (topic) => {
  selectedTopic.value = topic
  currentView.value = 'words'
  await loadWords(selectedLanguage.value, selectedLevel.value, topic)
}

const selectWord = (word) => {
  selectedWord.value = word
}

const closeWordModal = () => {
  selectedWord.value = null
}

const goBack = () => {
  switch (currentView.value) {
    case 'levels':
      currentView.value = 'languages'
      selectedLanguage.value = null
      levels.value = []
      break
    case 'topics':
      currentView.value = 'levels'
      selectedLevel.value = null
      topics.value = []
      break
    case 'words':
      currentView.value = 'topics'
      selectedTopic.value = null
      words.value = []
      break
  }
}

// ========================================
// DATA LOADING METHODS
// ========================================
const loadLanguages = async () => {
  loading.value = true
  try {
    const vocabulary = await getUserVocabulary(currentUser.value.uid)
    
    // Group by language
    const languageMap = new Map()
    
    vocabulary.forEach(word => {
      const langCode = word.language || 'english'
      
      if (!languageMap.has(langCode)) {
        const config = getLanguageConfig(langCode)
        languageMap.set(langCode, {
          code: langCode,
          nameRu: config.nameRu,
          flag: config.flag,
          totalWords: 0,
          levels: new Set(),
          mastered: 0
        })
      }
      
      const lang = languageMap.get(langCode)
      lang.totalWords++
      
      // Extract level from word metadata
      const level = word.level || word.metadata?.lessonLevel || 1
      lang.levels.add(level)
      
      if (word.progress >= 90) {
        lang.mastered++
      }
    })
    
    languages.value = Array.from(languageMap.values()).map(lang => ({
      ...lang,
      levels: Array.from(lang.levels).sort((a, b) => a - b),
      progress: lang.totalWords > 0 ? Math.round((lang.mastered / lang.totalWords) * 100) : 0
    })).filter(lang => lang.totalWords > 0)
    
    showToast(`Найдено ${languages.value.length} языков с словарем`)
  } catch (error) {
    showToast('Ошибка загрузки языков', 'error')
  } finally {
    loading.value = false
  }
}

const loadLevels = async (language) => {
  loading.value = true
  try {
    const vocabulary = await getUserVocabulary(currentUser.value.uid, language.code)
    
    // Group by level
    const levelMap = new Map()
    
    vocabulary.forEach(word => {
      const level = word.level || word.metadata?.lessonLevel || 1
      
      if (!levelMap.has(level)) {
        levelMap.set(level, {
          level,
          totalWords: 0,
          topics: new Set()
        })
      }
      
      const levelData = levelMap.get(level)
      levelData.totalWords++
      
      const topicName = word.topic || word.lessonName || 'General'
      levelData.topics.add(topicName)
    })
    
    levels.value = Array.from(levelMap.values()).map(level => ({
      ...level,
      topicCount: level.topics.size
    })).sort((a, b) => a.level - b.level)
    
    showToast(`Найдено ${levels.value.length} уровней`)
  } catch (error) {
    showToast('Ошибка загрузки уровней', 'error')
  } finally {
    loading.value = false
  }
}

const loadTopics = async (language, level) => {
  loading.value = true
  try {
    const vocabulary = await getUserVocabulary(currentUser.value.uid, language.code)
    
    // Filter by level and group by topic
    const topicMap = new Map()
    
    vocabulary
      .filter(word => (word.level || 1) === level)
      .forEach(word => {
        const topicName = word.topic || word.lessonName || 'General'
        
        if (!topicMap.has(topicName)) {
          topicMap.set(topicName, {
            name: topicName,
            nameRu: getTopicNameRu(topicName),
            totalWords: 0,
            words: []
          })
        }
        
        const topic = topicMap.get(topicName)
        topic.totalWords++
        topic.words.push(word)
      })
    
    topics.value = Array.from(topicMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    showToast(`Найдено ${topics.value.length} тем`)
  } catch (error) {
    showToast('Ошибка загрузки тем', 'error')
  } finally {
    loading.value = false
  }
}

const loadWords = async (language, level, topic) => {
  loading.value = true
  try {
    words.value = topic.words.map(word => ({
      ...word,
      id: word.id || `${word.word}_${word.language}`,
      isLearned: word.progress >= 90
    })).sort((a, b) => a.word.localeCompare(b.word))
    
    showToast(`Найдено ${words.value.length} слов`)
  } finally {
    loading.value = false
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================
const getLanguageConfig = (code) => {
  const configs = {
    english: { nameRu: 'Английский', flag: '🇺🇸' },
    spanish: { nameRu: 'Испанский', flag: '🇪🇸' },
    french: { nameRu: 'Французский', flag: '🇫🇷' },
    german: { nameRu: 'Немецкий', flag: '🇩🇪' },
    chinese: { nameRu: 'Китайский', flag: '🇨🇳' },
    arabic: { nameRu: 'Арабский', flag: '🇸🇦' },
    japanese: { nameRu: 'Японский', flag: '🇯🇵' },
    korean: { nameRu: 'Корейский', flag: '🇰🇷' },
    uzbek: { nameRu: 'Узбекский', flag: '🇺🇿' },
    russian: { nameRu: 'Русский', flag: '🇷🇺' }
  }
  return configs[code] || { nameRu: code, flag: '🌍' }
}

const getLevelIcon = (level) => {
  const icons = ['🌱', '🌿', '🌳', '🏔️', '⭐', '👑']
  return icons[level - 1] || '📚'
}

const getLevelDescription = (level) => {
  const descriptions = {
    1: 'Базовые слова и фразы',
    2: 'Повседневная лексика',
    3: 'Расширенный словарь',
    4: 'Продвинутые темы',
    5: 'Специализированная лексика'
  }
  return descriptions[level] || `Уровень ${level}`
}

const getDifficulty = (level) => {
  if (level <= 2) return 'beginner'
  if (level <= 4) return 'intermediate'
  return 'advanced'
}

const getDifficultyLabel = (difficulty) => {
  const labels = { beginner: 'Легкий', intermediate: 'Средний', advanced: 'Сложный' }
  return labels[difficulty] || difficulty
}

const getTopicIcon = (topicName) => {
  const icons = {
    'Travel': '✈️', 'Business': '💼', 'Food': '🍽️', 'Family': '👨‍👩‍👧‍👦',
    'Education': '🎓', 'Health': '🏥', 'Technology': '💻', 'Sports': '⚽',
    'Music': '🎵', 'Art': '🎨', 'Nature': '🌿', 'Animals': '🐾'
  }
  return icons[topicName] || '📖'
}

const getTopicNameRu = (topicName) => {
  const translations = {
    'Travel': 'Путешествия', 'Business': 'Бизнес', 'Food': 'Еда',
    'Family': 'Семья', 'Education': 'Образование', 'Health': 'Здоровье',
    'Technology': 'Технологии', 'Sports': 'Спорт'
  }
  return translations[topicName] || topicName
}

const getTopicDescription = (topicName) => {
  const descriptions = {
    'Travel': 'Слова для путешествий',
    'Business': 'Деловая лексика',
    'Food': 'Еда и напитки'
  }
  return descriptions[topicName] || `Изучайте слова по теме "${topicName}"`
}

const getPartOfSpeechRu = (partOfSpeech) => {
  const translations = {
    'noun': 'сущ.', 'verb': 'глаг.', 'adjective': 'прил.',
    'adverb': 'нар.', 'phrase': 'фраза'
  }
  return translations[partOfSpeech] || partOfSpeech
}

// ========================================
// ACTIONS
// ========================================
const pronounceWord = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = selectedLanguage.value?.code === 'russian' ? 'ru-RU' : 'en-US'
    speechSynthesis.speak(utterance)
  }
}

const markAsKnown = async (word) => {
  try {
    // Update word progress to 100%
    word.progress = 100
    showToast('Слово отмечено как изученное')
    closeWordModal()
  } catch (error) {
    showToast('Ошибка обновления', 'error')
  }
}

const markAsUnknown = async (word) => {
  try {
    // Reset word progress
    word.progress = 0
    showToast('Слово добавлено для повторения')
    closeWordModal()
  } catch (error) {
    showToast('Ошибка обновления', 'error')
  }
}

const showToast = (message, type = 'success') => {
  toast.value = { visible: true, message, type }
  setTimeout(() => { toast.value.visible = false }, 3000)
}

// ========================================
// LIFECYCLE
// ========================================
onMounted(() => {
  if (currentUser.value) {
    loadLanguages()
  }
})
</script>

<style scoped>
.vocabulary-system {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

/* Header */
.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: #f1f5f9;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e2e8f0;
  transform: translateX(-2px);
}

.header h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.breadcrumb {
  color: #64748b;
  font-size: 0.875rem;
}

/* Loading */
.loading {
  text-align: center;
  padding: 4rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Cards Grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
}

.card:hover {
  transform: translateY(-4px);
  border-color: #3b82f6;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.flag, .icon {
  font-size: 2rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.description {
  color: #64748b;
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
}

.stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat {
  text-align: center;
}

.stat .number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
}

.stat .label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress {
  margin-top: 1rem;
}

.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress .fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  transition: width 0.3s;
}

.progress span {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.difficulty {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.difficulty.beginner {
  background: #dcfce7;
  color: #166534;
}

.difficulty.intermediate {
  background: #fef3c7;
  color: #92400e;
}

.difficulty.advanced {
  background: #fecaca;
  color: #991b1b;
}

/* Words Container */
.words-container {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.words-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.filter-btn {
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn.active,
.filter-btn:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.word-card {
  background: #f8fafc;
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.word-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.word-text {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

.pronounce-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.pronounce-btn:hover {
  background: #e2e8f0;
}

.translation {
  color: #3b82f6;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.definition {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.word-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.pos {
  background: #e2e8f0;
  color: #64748b;
  padding: 0.125rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 1rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.modal-header button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.modal-header button:hover {
  background: #f1f5f9;
}

.modal-body {
  padding: 0 1.5rem;
}

.pronunciation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-style: italic;
  margin-bottom: 1rem;
}

.translation-large {
  font-size: 1.25rem;
  color: #3b82f6;
  font-weight: 600;
  margin-bottom: 1rem;
}

.definition-large {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.examples h4 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1rem;
}

.example {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  border-left: 4px solid #3b82f6;
}

.example .sentence {
  margin: 0 0 0.5rem 0;
  font-weight: 500;
  color: #1e293b;
}

.example .translation {
  margin: 0;
  color: #64748b;
  font-style: italic;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn.success {
  background: #10b981;
  color: white;
}

.btn.success:hover {
  background: #059669;
  transform: translateY(-1px);
}

.btn.warning {
  background: #f59e0b;
  color: white;
}

.btn.warning:hover {
  background: #d97706;
  transform: translateY(-1px);
}

/* Toast */
.toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: white;
  color: #1e293b;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #10b981;
  z-index: 1001;
  animation: slideIn 0.3s ease;
  max-width: 300px;
}

.toast.error {
  border-left-color: #ef4444;
  background: #fef2f2;
  color: #991b1b;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .vocabulary-system {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .cards-grid {
    grid-template-columns: 1fr;
  }
  
  .words-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .words-grid {
    grid-template-columns: 1fr;
  }
  
  .modal {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    justify-content: center;
  }
}
</style>