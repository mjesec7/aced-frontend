<template>
  <div class="vocabulary-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <button v-if="canGoBack" @click="goBack" class="back-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Назад
        </button>
        <div class="header-info">
          <h1 class="page-title">{{ currentTitle }}</h1>
          <p v-if="breadcrumb" class="breadcrumb-text">{{ breadcrumb }}</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка словаря...</p>
    </div>

    <!-- Languages View -->
    <div v-else-if="currentView === 'languages'" class="content-container">
      <div v-if="languages.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <p class="empty-text">У вас пока нет слов в словаре</p>
        <p class="empty-subtext">Начните изучать уроки для добавления новых слов</p>
      </div>

      <div v-else class="cards-grid">
        <div 
          v-for="lang in languages" 
          :key="lang.code" 
          class="language-card"
          @click="selectLanguage(lang)"
        >
          <div class="card-icon">{{ lang.flag }}</div>
          <div class="card-content">
            <h3 class="card-title">{{ lang.nameRu }}</h3>
            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-number">{{ lang.totalWords }}</span>
                <span class="stat-label">слов</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-number">{{ lang.levels?.length || 0 }}</span>
                <span class="stat-label">уровней</span>
              </div>
            </div>
            <div class="progress-section">
              <div class="progress-bar-container">
                <div class="progress-bar-fill" :style="{ width: lang.progress + '%' }"></div>
              </div>
              <span class="progress-text">{{ lang.progress }}% изучено</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Levels View -->
    <div v-else-if="currentView === 'levels'" class="content-container">
      <div class="cards-grid">
        <div 
          v-for="level in levels" 
          :key="level.level" 
          class="level-card"
          @click="selectLevel(level)"
        >
          <div class="card-header-row">
            <div class="level-badge">
              <span class="level-icon">{{ getLevelIcon(level.level) }}</span>
              <span class="level-number">Уровень {{ level.level }}</span>
            </div>
            <div :class="['difficulty-badge', getDifficulty(level.level)]">
              {{ getDifficultyLabel(getDifficulty(level.level)) }}
            </div>
          </div>
          <p class="card-description">{{ getLevelDescription(level.level) }}</p>
          <div class="card-stats-row">
            <div class="stat-group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <span>{{ level.totalWords }} слов</span>
            </div>
            <div class="stat-group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <span>{{ level.topicCount }} тем</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Topics View -->
    <div v-else-if="currentView === 'topics'" class="content-container">
      <div class="cards-grid">
        <div 
          v-for="topic in topics" 
          :key="topic.name" 
          class="topic-card"
          @click="selectTopic(topic)"
        >
          <div class="card-icon-wrapper">
            <span class="topic-emoji">{{ getTopicIcon(topic.name) }}</span>
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ getTopicNameRu(topic.name) }}</h3>
            <p class="card-subtitle">{{ getTopicDescription(topic.name) }}</p>
            <div class="word-count">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>{{ topic.totalWords }} слов</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Words View -->
    <div v-else-if="currentView === 'words'" class="content-container">
      <div class="words-header">
        <div class="search-container">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            v-model="searchQuery" 
            placeholder="Поиск слов..." 
            class="search-input"
          >
        </div>
        <button 
          @click="showAll = !showAll" 
          :class="['filter-button', { active: showAll }]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="21" x2="4" y2="14"/>
            <line x1="4" y1="10" x2="4" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12" y2="3"/>
            <line x1="20" y1="21" x2="20" y2="16"/>
            <line x1="20" y1="12" x2="20" y2="3"/>
            <line x1="1" y1="14" x2="7" y2="14"/>
            <line x1="9" y1="8" x2="15" y2="8"/>
            <line x1="17" y1="16" x2="23" y2="16"/>
          </svg>
          {{ showAll ? 'Все слова' : 'Активные' }}
        </button>
      </div>

      <div class="words-grid">
        <div 
          v-for="word in filteredWords" 
          :key="word.id" 
          class="word-card"
          @click="selectWord(word)"
        >
          <div class="word-header">
            <h4 class="word-text">{{ word.word }}</h4>
            <button @click.stop="pronounceWord(word.word)" class="pronounce-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            </button>
          </div>
          <p class="word-translation">{{ word.translation }}</p>
          <div v-if="word.definition" class="word-definition">{{ word.definition }}</div>
          <div class="word-meta">
            <span class="meta-badge pos">{{ getPartOfSpeechRu(word.partOfSpeech) }}</span>
            <span :class="['meta-badge difficulty', word.difficulty]">
              {{ getDifficultyLabel(word.difficulty) }}
            </span>
          </div>
          <div class="word-progress">
            <div class="progress-bar-container small">
              <div 
                class="progress-bar-fill"
                :style="{ width: (word.progress || 0) + '%' }"
              ></div>
            </div>
            <span class="progress-percent">{{ word.progress || 0 }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Word Detail Modal -->
    <div v-if="selectedWord" class="modal-overlay" @click="closeWordModal">
      <div class="modal-card" @click.stop>
        <div class="modal-header">
          <div class="modal-title-row">
            <h3>{{ selectedWord.word }}</h3>
            <button @click="closeWordModal" class="close-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div v-if="selectedWord.pronunciation" class="pronunciation-row">
            <span class="pronunciation-text">/{{ selectedWord.pronunciation }}/</span>
            <button @click="pronounceWord(selectedWord.word)" class="pronounce-button small">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="modal-body">
          <div class="translation-section">
            <p class="translation-large">{{ selectedWord.translation }}</p>
            <div class="meta-tags">
              <span class="meta-badge pos">{{ getPartOfSpeechRu(selectedWord.partOfSpeech) }}</span>
              <span :class="['meta-badge difficulty', selectedWord.difficulty]">
                {{ getDifficultyLabel(selectedWord.difficulty) }}
              </span>
            </div>
          </div>

          <div v-if="selectedWord.definition" class="definition-section">
            <h4 class="section-title">Определение</h4>
            <p class="definition-text">{{ selectedWord.definition }}</p>
          </div>

          <div v-if="selectedWord.examples?.length" class="examples-section">
            <h4 class="section-title">Примеры использования</h4>
            <div v-for="(example, index) in selectedWord.examples" :key="index" class="example-item">
              <p class="example-sentence">{{ example.sentence }}</p>
              <p class="example-translation">{{ example.translation }}</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="markAsUnknown(selectedWord)" class="action-button secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Повторить
          </button>
          <button @click="markAsKnown(selectedWord)" class="action-button primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Знаю
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="toast.visible" :class="['toast-notification', toast.type]">
      <div class="toast-content">
        <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { currentUser } = useAuth()

const loading = ref(false)
const currentView = ref('languages')
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

const canGoBack = computed(() => currentView.value !== 'languages')

const currentTitle = computed(() => {
  switch (currentView.value) {
    case 'languages': return '📚 Мой словарь'
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

// [Keep all the existing API functions and helper methods from the original file]
// getUserVocabulary, isValidVocabularyItem, extractVocabularyFromStep, etc.
// I'm keeping them the same to maintain functionality

const getUserVocabulary = async (userId, languageCode = null) => {
  try {
    if (!userId) {
return getDemoVocabulary(languageCode)
    }
    
    let progressResponse
    try {
      progressResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live'}/users/${userId}/progress`)
    } catch (fetchError) {
return await extractVocabularyFromAllLessons(languageCode)
    }
    
    if (!progressResponse || !progressResponse.ok) {
return await extractVocabularyFromAllLessons(languageCode)
    }
    
    let progressData
    try {
      progressData = await progressResponse.json()
    } catch (jsonError) {
return await extractVocabularyFromAllLessons(languageCode)
    }
    
    const userProgress = Array.isArray(progressData) ? progressData : progressData.data || []
    const completedLessons = userProgress.filter(p => p && p.completed && p.lessonId)
    
    if (completedLessons.length === 0) {
      return getDemoVocabulary(languageCode)
    }
    
    const allVocabulary = []
    
    for (const progress of completedLessons.slice(0, 20)) {
      try {
        if (!progress || !progress.lessonId) continue
        
        const lessonResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live'}/lessons/${progress.lessonId}`)
        
        if (!lessonResponse.ok) continue
        
        const lessonData = await lessonResponse.json()
        const lesson = lessonData.lesson || lessonData
        
        if (!lesson || !lesson.steps || !Array.isArray(lesson.steps)) continue
        
        lesson.steps.forEach((step, stepIndex) => {
          if (!step || !step.type) return
          
          if (step.type === 'vocabulary' && step.data) {
            const vocabularyItems = Array.isArray(step.data) ? step.data : [step.data]
            
            vocabularyItems.forEach((vocab, vocabIndex) => {
              if (isValidVocabularyItem(vocab)) {
                const extractedWord = extractVocabularyFromStep(vocab, lesson, progress, `${stepIndex}_${vocabIndex}`)
                if (extractedWord) {
                  allVocabulary.push(extractedWord)
                }
              }
            })
          }
          
          if (step.vocabulary && Array.isArray(step.vocabulary)) {
            step.vocabulary.forEach((vocab, vocabIndex) => {
              if (isValidVocabularyItem(vocab)) {
                const extractedWord = extractVocabularyFromStep(vocab, lesson, progress, `vocab_${stepIndex}_${vocabIndex}`)
                if (extractedWord) {
                  allVocabulary.push(extractedWord)
                }
              }
            })
          }
        })
        
      } catch (lessonError) {
continue
      }
    }
    
    const uniqueVocabulary = []
    const seenWords = new Set()
    
    allVocabulary.forEach(word => {
      if (!word || !word.word || !word.language) return
      const uniqueKey = `${word.word.toLowerCase()}_${word.language.toLowerCase()}`
      
      if (!seenWords.has(uniqueKey)) {
        seenWords.add(uniqueKey)
        uniqueVocabulary.push(word)
      }
    })
    
    if (languageCode) {
      return uniqueVocabulary.filter(word => 
        word && word.language && word.language.toLowerCase() === languageCode.toLowerCase()
      )
    }
    
    return uniqueVocabulary
    
  } catch (error) {
return getDemoVocabulary(languageCode)
  }
}

const isValidVocabularyItem = (vocab) => {
  if (!vocab || typeof vocab !== 'object') return false
  const hasTermDefinition = vocab.term && vocab.definition
  const hasWordTranslation = vocab.word && vocab.translation
  const hasFrontBack = vocab.front && vocab.back
  const hasQuestionAnswer = vocab.question && vocab.answer
  return hasTermDefinition || hasWordTranslation || hasFrontBack || hasQuestionAnswer
}

const extractVocabularyFromStep = (vocab, lesson, progress, uniqueId) => {
  try {
    if (!vocab || typeof vocab !== 'object') return null
    
    let word, translation, definition = '', examples = []
    
    if (vocab.term && vocab.definition) {
      word = vocab.term
      translation = vocab.definition
      definition = vocab.example || vocab.description || ''
    } else if (vocab.word && vocab.translation) {
      word = vocab.word
      translation = vocab.translation
      definition = vocab.definition || vocab.example || ''
    } else if (vocab.front && vocab.back) {
      word = vocab.front
      translation = vocab.back
      definition = vocab.hint || vocab.example || ''
    } else if (vocab.question && vocab.answer) {
      word = vocab.question
      translation = vocab.answer
      definition = vocab.explanation || ''
    } else {
      return null
    }
    
    if (!word || !translation || typeof word !== 'string' || typeof translation !== 'string') {
      return null
    }
    
    if (vocab.example && typeof vocab.example === 'string') {
      examples.push({
        sentence: vocab.example,
        translation: translation
      })
    }
    
    if (vocab.examples && Array.isArray(vocab.examples)) {
      examples = [...examples, ...vocab.examples.filter(ex => ex && typeof ex === 'object')]
    }
    
    const language = getLanguageFromLesson(lesson)
    
    return {
      id: `${progress.lessonId}_${uniqueId}_${word}`,
      word: word.trim(),
      translation: translation.trim(),
      definition: (definition || '').trim(),
      language: language,
      topic: lesson.topic || lesson.subject || 'General',
      lessonName: lesson.lessonName || lesson.title || 'Unknown Lesson',
      level: lesson.level || 1,
      partOfSpeech: vocab.partOfSpeech || vocab.type || 'noun',
      difficulty: getDifficultyFromLevel(lesson.level || 1),
      progress: Math.round(progress.progressPercent || 0),
      examples: examples,
      pronunciation: vocab.pronunciation || '',
      metadata: {
        source: 'lesson_extraction',
        lessonId: lesson._id,
        stepType: 'vocabulary',
        extractedAt: new Date().toISOString()
      }
    }
    
  } catch (error) {
return null
  }
}

const getLanguageFromLesson = (lesson) => {
  const title = (lesson.lessonName || lesson.title || '').toLowerCase()
  const subject = (lesson.subject || '').toLowerCase()
  const description = (lesson.description || '').toLowerCase()
  
  const patterns = {
    english: ['english', 'английский', 'англ', 'eng', 'vocabulary', 'words'],
    russian: ['russian', 'русский', 'рус', 'rus', 'русский язык'],
    spanish: ['spanish', 'испанский', 'español', 'esp'],
    french: ['french', 'французский', 'français', 'fr'],
    german: ['german', 'немецкий', 'deutsch', 'de'],
    uzbek: ['uzbek', 'узбекский', 'o\'zbek', 'uz'],
    chinese: ['chinese', 'китайский', '中文', 'zh'],
    arabic: ['arabic', 'арабский', 'العربية', 'ar'],
    japanese: ['japanese', 'японский', '日本語', 'jp'],
    korean: ['korean', 'корейский', '한국어', 'kr']
  }
  
  const searchText = `${title} ${subject} ${description}`.toLowerCase()
  
  for (const [language, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      return language
    }
  }
  
  return 'english'
}

const getDifficultyFromLevel = (level) => {
  if (level <= 2) return 'beginner'
  if (level <= 4) return 'intermediate'
  return 'advanced'
}

const extractVocabularyFromAllLessons = async (languageCode = null) => {
  try {
    const lessonsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live'}/lessons`)
    
    if (!lessonsResponse.ok) {
      return getDemoVocabulary(languageCode)
    }
    
    const lessonsData = await lessonsResponse.json()
    const allLessons = Array.isArray(lessonsData) ? lessonsData : []
    
    const allVocabulary = []
    
    allLessons.slice(0, 10).forEach((lesson) => {
      if (!lesson || !lesson.steps) return
      
      lesson.steps.forEach((step, stepIndex) => {
        if (!step || !step.type) return
        
        if (step.type === 'vocabulary' && step.data) {
          const vocabularyItems = Array.isArray(step.data) ? step.data : [step.data]
          
          vocabularyItems.forEach((vocab, vocabIndex) => {
            if (isValidVocabularyItem(vocab)) {
              const mockProgress = {
                lessonId: lesson._id,
                progressPercent: 0,
                updatedAt: new Date().toISOString()
              }
              
              const extractedWord = extractVocabularyFromStep(vocab, lesson, mockProgress, `${stepIndex}_${vocabIndex}`)
              if (extractedWord) {
                allVocabulary.push(extractedWord)
              }
            }
          })
        }
      })
    })
    
    if (languageCode) {
      return allVocabulary.filter(word => 
        word.language && word.language.toLowerCase() === languageCode.toLowerCase()
      )
    }
    
    return allVocabulary
    
  } catch (error) {
return getDemoVocabulary(languageCode)
  }
}

const getDemoVocabulary = (languageCode = null) => {
  const demoWords = [
    { id: 'hello_en', word: 'Hello', translation: 'Привет', language: 'english', topic: 'Greetings', level: 1, progress: 75, partOfSpeech: 'interjection', difficulty: 'beginner', definition: 'A greeting used when meeting someone' },
    { id: 'goodbye_en', word: 'Goodbye', translation: 'До свидания', language: 'english', topic: 'Greetings', level: 1, progress: 50, partOfSpeech: 'interjection', difficulty: 'beginner', definition: 'A farewell greeting' },
    { id: 'house_en', word: 'House', translation: 'Дом', language: 'english', topic: 'Home', level: 1, progress: 90, partOfSpeech: 'noun', difficulty: 'beginner', definition: 'A building for human habitation' },
    { id: 'water_en', word: 'Water', translation: 'Вода', language: 'english', topic: 'Nature', level: 1, progress: 100, partOfSpeech: 'noun', difficulty: 'beginner', definition: 'A clear liquid that forms the seas, lakes, rivers, and rain' },
    { id: 'computer_en', word: 'Computer', translation: 'Компьютер', language: 'english', topic: 'Technology', level: 2, progress: 25, partOfSpeech: 'noun', difficulty: 'intermediate', definition: 'An electronic device for storing and processing data' },
    { id: 'hola_es', word: 'Hola', translation: 'Привет', language: 'spanish', topic: 'Greetings', level: 1, progress: 60, partOfSpeech: 'interjection', difficulty: 'beginner', definition: 'A Spanish greeting' },
    { id: 'casa_es', word: 'Casa', translation: 'Дом', language: 'spanish', topic: 'Home', level: 1, progress: 80, partOfSpeech: 'noun', difficulty: 'beginner', definition: 'A house or home in Spanish' },
    { id: 'bonjour_fr', word: 'Bonjour', translation: 'Привет', language: 'french', topic: 'Greetings', level: 1, progress: 40, partOfSpeech: 'interjection', difficulty: 'beginner', definition: 'A French greeting meaning good day' }
  ]
  
  if (languageCode) {
    return demoWords.filter(w => w.language === languageCode)
  }
  
  return demoWords
}

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

const loadLanguages = async () => {
  loading.value = true
  try {
    const userId = currentUser.value?.uid || 'demo_user'
    const vocabulary = await getUserVocabulary(userId)
    
    if (!vocabulary || vocabulary.length === 0) {
      showToast('Словарь пуст. Начните изучать уроки для добавления слов!', 'warning')
      languages.value = []
      return
    }
    
    const languageMap = new Map()
    
    vocabulary.forEach(word => {
      if (!word || !word.language) return
      
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
    
    if (languages.value.length === 0) {
      showToast('Нет доступных языков в словаре', 'warning')
    }
  } catch (error) {
showToast('Ошибка загрузки языков', 'error')
    languages.value = []
  } finally {
    loading.value = false
  }
}

const loadLevels = async (language) => {
  loading.value = true
  try {
    const userId = currentUser.value?.uid || 'demo_user'
    const vocabulary = await getUserVocabulary(userId, language.code)
    
    const levelMap = new Map()
    
    vocabulary.forEach(word => {
      if (!word) return
      
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
    
  } catch (error) {
    showToast('Ошибка загрузки уровней', 'error')
  } finally {
    loading.value = false
  }
}

const loadTopics = async (language, level) => {
  loading.value = true
  try {
    const userId = currentUser.value?.uid || 'demo_user'
    const vocabulary = await getUserVocabulary(userId, language.code)
    
    const topicMap = new Map()
    
    vocabulary
      .filter(word => word && (word.level || 1) === level)
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
  } catch (error) {
    showToast('Ошибка загрузки тем', 'error')
  } finally {
    loading.value = false
  }
}

const loadWords = async (language, level, topic) => {
  loading.value = true
  try {
    const uniqueWords = []
    const seenWords = new Set()
    
    topic.words.forEach(word => {
      if (!word || !word.word) return
      
      const uniqueKey = word.word.toLowerCase()
      
      if (!seenWords.has(uniqueKey)) {
        seenWords.add(uniqueKey)
        uniqueWords.push({
          ...word,
          id: word.id || `${word.word}_${word.language}`,
          isLearned: word.progress >= 90
        })
      }
    })
    
    words.value = uniqueWords.sort((a, b) => a.word.localeCompare(b.word))
  } finally {
    loading.value = false
  }
}

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
    'Music': '🎵', 'Art': '🎨', 'Nature': '🌿', 'Animals': '🐾',
    'Greetings': '👋', 'Home': '🏠', 'General': '📖'
  }
  return icons[topicName] || '📖'
}

const getTopicNameRu = (topicName) => {
  const translations = {
    'Travel': 'Путешествия', 'Business': 'Бизнес', 'Food': 'Еда',
    'Family': 'Семья', 'Education': 'Образование', 'Health': 'Здоровье',
    'Technology': 'Технологии', 'Sports': 'Спорт', 'Greetings': 'Приветствие',
    'Home': 'Дом', 'Nature': 'Природа', 'General': 'Общее'
  }
  return translations[topicName] || topicName
}

const getTopicDescription = (topicName) => {
  const descriptions = {
    'Travel': 'Слова для путешествий',
    'Business': 'Деловая лексика',
    'Food': 'Еда и напитки',
    'Greetings': 'Приветствие и знакомство',
    'Home': 'Дом и семья',
    'Technology': 'Компьютеры и технологии'
  }
  return descriptions[topicName] || `Изучайте слова по теме "${topicName}"`
}

const getPartOfSpeechRu = (partOfSpeech) => {
  const translations = {
    'noun': 'сущ.', 'verb': 'глаг.', 'adjective': 'прил.',
    'adverb': 'нар.', 'phrase': 'фраза', 'interjection': 'межд.'
  }
  return translations[partOfSpeech] || partOfSpeech
}

const pronounceWord = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = selectedLanguage.value?.code === 'russian' ? 'ru-RU' : 'en-US'
    speechSynthesis.speak(utterance)
  }
}

const markAsKnown = async (word) => {
  try {
    word.progress = 100
    showToast('Слово отмечено как изученное')
    closeWordModal()
  } catch (error) {
    showToast('Ошибка обновления', 'error')
  }
}

const markAsUnknown = async (word) => {
  try {
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

onMounted(() => {
  loadLanguages()
})
</script>

<style scoped>
/* GENERAL STYLES */
.vocabulary-page {
  min-height: 100vh;
  background: #fafafa;
  padding: 1.5rem;
}

/* HEADER */
.page-header {
  max-width: 1400px;
  margin: 0 auto 2rem;
}

.header-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  padding: 0.625rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.back-button:hover {
  background: #e5e7eb;
  color: #111827;
}

.back-button svg {
  width: 1rem;
  height: 1rem;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.breadcrumb-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

/* LOADING STATE */
.loading-state {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #e5e7eb;
  border-top-color: #a855f7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #6b7280;
  margin: 0;
}

/* CONTENT CONTAINER */
.content-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* EMPTY STATE */
.empty-state {
  background: white;
  border-radius: 12px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: #d1d5db;
  margin: 0 auto 1rem;
}

.empty-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.empty-subtext {
  color: #9ca3af;
  margin: 0;
  font-size: 0.875rem;
}

/* CARDS GRID */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* LANGUAGE CARD */
.language-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 1rem;
}

.language-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 10px;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

.card-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #a855f7;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.stat-divider {
  width: 1px;
  height: 2rem;
  background: #e5e7eb;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-bar-container {
  width: 100%;
  height: 6px;
  background: #f3f4f6;
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar-container.small {
  height: 5px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #a855f7, #9333ea);
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* LEVEL CARD */
.level-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.level-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
  transform: translateY(-2px);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.level-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.level-icon {
  font-size: 1.5rem;
}

.level-number {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.difficulty-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.difficulty-badge.beginner {
  background: #dcfce7;
  color: #166534;
}

.difficulty-badge.intermediate {
  background: #fef3c7;
  color: #92400e;
}

.difficulty-badge.advanced {
  background: #fecaca;
  color: #991b1b;
}

.card-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 1rem 0;
}

.card-stats-row {
  display: flex;
  gap: 1.5rem;
}

.stat-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-group svg {
  width: 1rem;
  height: 1rem;
}

/* TOPIC CARD */
.topic-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 1rem;
}

.topic-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
  transform: translateY(-2px);
}

.card-icon-wrapper {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.topic-emoji {
  font-size: 1.5rem;
}

.card-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 0.75rem 0;
}

.word-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.word-count svg {
  width: 1rem;
  height: 1rem;
}

/* WORDS HEADER */
.words-header {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.search-container {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.filter-button {
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
  font-size: 0.875rem;
  white-space: nowrap;
}

.filter-button:hover {
  background: #e5e7eb;
}

.filter-button.active {
  background: #a855f7;
  border-color: #a855f7;
  color: white;
}

.filter-button svg {
  width: 1rem;
  height: 1rem;
}

/* WORDS GRID */
.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

/* WORD CARD */
.word-card {
  background: white;
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.word-card:hover {
  border-color: #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.1);
  transform: translateY(-2px);
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.word-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.pronounce-button {
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.pronounce-button:hover {
  background: #a855f7;
  color: white;
}

.pronounce-button.small {
  width: 1.75rem;
  height: 1.75rem;
}

.pronounce-button svg {
  width: 1rem;
  height: 1rem;
}

.pronounce-button.small svg {
  width: 0.875rem;
  height: 0.875rem;
}

.word-translation {
  color: #a855f7;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  font-size: 0.9375rem;
}

.word-definition {
  color: #6b7280;
  font-size: 0.8125rem;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.word-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.meta-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.meta-badge.pos {
  background: #f3f4f6;
  color: #6b7280;
}

.meta-badge.difficulty.beginner {
  background: #dcfce7;
  color: #166534;
}

.meta-badge.difficulty.intermediate {
  background: #fef3c7;
  color: #92400e;
}

.meta-badge.difficulty.advanced {
  background: #fecaca;
  color: #991b1b;
}

.word-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.word-progress .progress-bar-container {
  flex: 1;
}

.progress-percent {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  flex-shrink: 0;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.modal-title-row h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.close-button {
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.close-button:hover {
  background: #e5e7eb;
  color: #111827;
}

.close-button svg {
  width: 1.25rem;
  height: 1.25rem;
}

.pronunciation-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pronunciation-text {
  color: #6b7280;
  font-style: italic;
  font-size: 0.9375rem;
}

.modal-body {
  padding: 1.5rem;
}

.translation-section {
  margin-bottom: 1.5rem;
}

.translation-large {
  font-size: 1.25rem;
  font-weight: 600;
  color: #a855f7;
  margin: 0 0 0.75rem 0;
}

.meta-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.definition-section,
.examples-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0 0 0.75rem 0;
}

.definition-text {
  color: #374151;
  line-height: 1.6;
  margin: 0;
  font-size: 0.9375rem;
}

.example-item {
  background: #f9fafb;
  border-left: 3px solid #a855f7;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.example-item:last-child {
  margin-bottom: 0;
}

.example-sentence {
  color: #111827;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  font-size: 0.9375rem;
}

.example-translation {
  color: #6b7280;
  font-style: italic;
  margin: 0;
  font-size: 0.875rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.action-button {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-button svg {
  width: 1rem;
  height: 1rem;
}

.action-button.primary {
  background: #10b981;
  color: white;
}

.action-button.primary:hover {
  background: #059669;
}

.action-button.secondary {
  background: #f3f4f6;
  color: #374151;
}

.action-button.secondary:hover {
  background: #e5e7eb;
}

/* TOAST NOTIFICATION */
.toast-notification {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  background: white;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  z-index: 1001;
  animation: slideIn 0.3s ease;
  max-width: 400px;
}

.toast-notification.success {
  border-left: 4px solid #10b981;
}

.toast-notification.error {
  border-left: 4px solid #ef4444;
}

.toast-notification.warning {
  border-left: 4px solid #f59e0b;
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

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #111827;
  font-size: 0.875rem;
  font-weight: 500;
}

.toast-content svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.toast-notification.success .toast-content svg {
  color: #10b981;
}

.toast-notification.error .toast-content svg {
  color: #ef4444;
}

.toast-notification.warning .toast-content svg {
  color: #f59e0b;
}

/* RESPONSIVE DESIGN */
@media (min-width: 768px) {
  .vocabulary-page {
    padding: 2rem 2.5rem;
  }
}

@media (max-width: 768px) {
  .vocabulary-page {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .back-button {
    align-self: flex-start;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .words-header {
    flex-direction: column;
  }

  .filter-button {
    width: 100%;
    justify-content: center;
  }

  .words-grid {
    grid-template-columns: 1fr;
  }

  .modal-card {
    margin: 0;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .toast-notification {
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}

@media (max-width: 640px) {
  .page-header {
    margin-bottom: 1.5rem;
  }

  .header-content {
    padding: 1.125rem;
  }

  .language-card,
  .level-card,
  .topic-card {
    padding: 1.125rem;
  }

  .card-icon {
    font-size: 2rem;
    width: 3rem;
    height: 3rem;
  }

  .words-header {
    padding: 1.125rem;
  }

  .word-card {
    padding: 0.875rem;
  }
}

/* ACCESSIBILITY */
.back-button:focus-visible,
.filter-button:focus-visible,
.pronounce-button:focus-visible,
.action-button:focus-visible,
.close-button:focus-visible {
  outline: 2px solid #a855f7;
  outline-offset: 2px;
}

.language-card:focus-visible,
.level-card:focus-visible,
.topic-card:focus-visible,
.word-card:focus-visible {
  outline: 2px solid #a855f7;
  outline-offset: 2px;
}

/* REDUCED MOTION */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

</style>