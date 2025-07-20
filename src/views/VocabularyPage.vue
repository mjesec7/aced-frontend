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
// API FUNCTIONS (MATCHING VOCABULARY MODAL APPROACH)
// ========================================
const getUserVocabulary = async (userId, languageCode = null) => {
  try {
    console.log('📚 [VocabularyPage] Extracting vocabulary from completed lessons for user:', userId)
    
    if (!userId) {
      console.warn('⚠️ No user ID provided, using demo data')
      return getDemoVocabulary(languageCode)
    }
    
    // Get user's completed lessons (same as VocabularyModal)
    let progressResponse
    try {
      progressResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live'}/users/${userId}/progress`)
    } catch (fetchError) {
      console.warn('⚠️ Progress fetch failed:', fetchError.message)
      return await extractVocabularyFromAllLessons(languageCode)
    }
    
    if (!progressResponse || !progressResponse.ok) {
      console.warn('⚠️ Could not fetch user progress, trying lessons directly...')
      return await extractVocabularyFromAllLessons(languageCode)
    }
    
    let progressData
    try {
      progressData = await progressResponse.json()
    } catch (jsonError) {
      console.warn('⚠️ Progress JSON parse failed:', jsonError.message)
      return await extractVocabularyFromAllLessons(languageCode)
    }
    
    const userProgress = Array.isArray(progressData) ? progressData : progressData.data || []
    
    console.log(`📊 Found ${userProgress.length} progress records`)
    
    // Get completed lessons
    const completedLessons = userProgress.filter(p => p && p.completed && p.lessonId)
    console.log(`✅ Found ${completedLessons.length} completed lessons`)
    
    if (completedLessons.length === 0) {
      console.log('ℹ️ No completed lessons found, using demo data')
      return getDemoVocabulary(languageCode)
    }
    
    const allVocabulary = []
    
    // Extract vocabulary from each completed lesson (same logic as VocabularyModal)
    for (const progress of completedLessons.slice(0, 20)) {
      try {
        if (!progress || !progress.lessonId) continue
        
        const lessonResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live'}/lessons/${progress.lessonId}`)
        
        if (!lessonResponse.ok) continue
        
        const lessonData = await lessonResponse.json()
        const lesson = lessonData.lesson || lessonData
        
        if (!lesson || !lesson.steps || !Array.isArray(lesson.steps)) continue
        
        // Extract vocabulary from lesson steps (EXACT same logic as VocabularyModal)
        lesson.steps.forEach((step, stepIndex) => {
          if (!step || !step.type) return
          
          // Check for vocabulary step
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
          
          // Also check for vocabulary within other step types
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
        console.warn(`⚠️ Error processing lesson ${progress.lessonId}:`, lessonError.message)
        continue
      }
    }
    
    console.log(`📚 Extracted ${allVocabulary.length} vocabulary items from completed lessons`)
    
    // ✅ DEDUPLICATE vocabulary by word + language combination
    const uniqueVocabulary = []
    const seenWords = new Set()
    
    allVocabulary.forEach(word => {
      if (!word || !word.word || !word.language) return
      
      // Create unique key from word + language (case insensitive)
      const uniqueKey = `${word.word.toLowerCase()}_${word.language.toLowerCase()}`
      
      if (!seenWords.has(uniqueKey)) {
        seenWords.add(uniqueKey)
        uniqueVocabulary.push(word)
      }
    })
    
    console.log(`📚 After deduplication: ${uniqueVocabulary.length} unique vocabulary items`)
    
    // Filter by language if specified
    if (languageCode) {
      const filteredVocabulary = uniqueVocabulary.filter(word => 
        word && word.language && word.language.toLowerCase() === languageCode.toLowerCase()
      )
      console.log(`🔍 Filtered to ${filteredVocabulary.length} words for language: ${languageCode}`)
      return filteredVocabulary
    }
    
    return uniqueVocabulary
    
  } catch (error) {
    console.error('❌ Error extracting vocabulary from lessons:', error)
    
    // Fallback to demo data
    console.log('📚 Using demo vocabulary data as fallback...')
    return getDemoVocabulary(languageCode)
  }
}

// Helper function to check if vocabulary item is valid (same as VocabularyModal)
const isValidVocabularyItem = (vocab) => {
  if (!vocab || typeof vocab !== 'object') return false
  
  // Check various vocabulary formats
  const hasTermDefinition = vocab.term && vocab.definition
  const hasWordTranslation = vocab.word && vocab.translation
  const hasFrontBack = vocab.front && vocab.back
  const hasQuestionAnswer = vocab.question && vocab.answer
  
  return hasTermDefinition || hasWordTranslation || hasFrontBack || hasQuestionAnswer
}

// Helper function to extract vocabulary from step (same logic as VocabularyModal)
const extractVocabularyFromStep = (vocab, lesson, progress, uniqueId) => {
  try {
    if (!vocab || typeof vocab !== 'object') return null
    
    let word, translation, definition = '', examples = []
    
    // Handle different vocabulary formats (same as VocabularyModal)
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
    
    // Ensure word and translation are strings
    if (!word || !translation || typeof word !== 'string' || typeof translation !== 'string') {
      return null
    }
    
    // Handle examples
    if (vocab.example && typeof vocab.example === 'string') {
      examples.push({
        sentence: vocab.example,
        translation: translation
      })
    }
    
    if (vocab.examples && Array.isArray(vocab.examples)) {
      examples = [...examples, ...vocab.examples.filter(ex => ex && typeof ex === 'object')]
    }
    
    // Determine language from lesson (same logic as VocabularyModal)
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
    console.error('❌ Error extracting vocabulary from step:', error)
    return null
  }
}

// Helper function to determine language from lesson (same as VocabularyModal)
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
  
  // Default to English if no language detected
  return 'english'
}

// Helper function to get difficulty from lesson level
const getDifficultyFromLevel = (level) => {
  if (level <= 2) return 'beginner'
  if (level <= 4) return 'intermediate'
  return 'advanced'
}

// Fallback function to extract from all lessons if no progress available
const extractVocabularyFromAllLessons = async (languageCode = null) => {
  try {
    console.log('🔄 Extracting vocabulary from all available lessons...')
    
    const lessonsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://api.aced.live'}/lessons`)
    
    if (!lessonsResponse.ok) {
      return getDemoVocabulary(languageCode)
    }
    
    const lessonsData = await lessonsResponse.json()
    const allLessons = Array.isArray(lessonsData) ? lessonsData : []
    
    console.log(`📚 Found ${allLessons.length} total lessons`)
    
    const allVocabulary = []
    
    // Process a subset of lessons to extract vocabulary
    allLessons.slice(0, 10).forEach((lesson, lessonIndex) => {
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
    
    console.log(`📚 Extracted ${allVocabulary.length} vocabulary items from all lessons`)
    
    if (languageCode) {
      return allVocabulary.filter(word => 
        word.language && word.language.toLowerCase() === languageCode.toLowerCase()
      )
    }
    
    return allVocabulary
    
  } catch (error) {
    console.error('❌ Error extracting from all lessons:', error)
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
    // Get user ID safely
    const userId = currentUser.value?.uid || 'demo_user'
    console.log('📚 Loading languages for user:', userId)
    
    const vocabulary = await getUserVocabulary(userId)
    
    if (!vocabulary || vocabulary.length === 0) {
      showToast('Словарь пуст. Начните изучать уроки для добавления слов!', 'warning')
      languages.value = []
      return
    }
    
    // Group by language
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
    
    if (languages.value.length === 0) {
      showToast('Нет доступных языков в словаре', 'warning')
    } else {
      showToast(`Найдено ${languages.value.length} языков с словарем`)
    }
  } catch (error) {
    console.error('❌ Error loading languages:', error)
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
    
    // Group by level
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
    const userId = currentUser.value?.uid || 'demo_user'
    const vocabulary = await getUserVocabulary(userId, language.code)
    
    // Filter by level and group by topic
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
    // ✅ DEDUPLICATE words within the topic to prevent repeats
    const uniqueWords = []
    const seenWords = new Set()
    
    topic.words.forEach(word => {
      if (!word || !word.word) return
      
      // Create unique key from word text (case insensitive)
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
    
    showToast(`Найдено ${words.value.length} уникальных слов`)
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
  // Always try to load languages, even without user check
  console.log('🔄 VocabularyPage mounted, loading languages...')
  loadLanguages()
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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(59, 130, 246, 0.1) 50%,
    rgba(139, 92, 246, 0.1) 70%,
    transparent
  );
  opacity: 0;
  transition: all 0.5s ease;
  z-index: 1;
}


.card::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: #8b5cf6;
  border-radius: 1rem;
  opacity: 0;
  z-index: -1;
  transition: all 0.5s ease;
}

.card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 0 30px rgba(59, 130, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.card:hover::before {
  opacity: 1;
}

.card:hover::after {
  opacity: 1;
  filter: blur(8px);
}

.card > * {
  position: relative;
  z-index: 2;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.flag, .icon {
  font-size: 2rem;
  transition: all 0.3s ease;
}

.card:hover .flag,
.card:hover .icon {
  transform: scale(1.1) rotate(5deg);
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  transition: all 0.3s ease;
}

.card:hover .card-header h3 {
  color: #3b82f6;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
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
  transition: all 0.3s ease;
}

.card:hover .stat .number {
  color: #8b5cf6;
  text-shadow: 0 0 15px rgba(139, 92, 246, 0.7);
  transform: scale(1.1);
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
  position: relative;
}

.progress .fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  transition: all 0.5s ease;
  position: relative;
}

.card:hover .progress .fill {
  background: linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981);
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.8);
}

.progress .fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  transition: all 0.5s ease;
}

.card:hover .progress .fill::after {
  left: 100%;
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
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.difficulty::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: all 0.5s ease;
}

.card:hover .difficulty::before {
  left: 100%;
}

.difficulty.beginner {
  background: #dcfce7;
  color: #166534;
}

.card:hover .difficulty.beginner {
  background: #10b981;
  color: white;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
}

.difficulty.intermediate {
  background: #fef3c7;
  color: #92400e;
}

.card:hover .difficulty.intermediate {
  background: #f59e0b;
  color: white;
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.6);
}

.difficulty.advanced {
  background: #fecaca;
  color: #991b1b;
}

.card:hover .difficulty.advanced {
  background: #ef4444;
  color: white;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
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
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.filter-btn {
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
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
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: all 0.5s ease;
}

.filter-btn.active,
.filter-btn:hover {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}

.filter-btn:hover::before {
  left: 100%;
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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.word-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(139, 92, 246, 0.1) 50%,
    rgba(6, 182, 212, 0.1) 100%
  );
  opacity: 0;
  transition: all 0.5s ease;
  z-index: 1;
}

.word-card::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(
    45deg,
    #3b82f6,
    #8b5cf6,
    #06b6d4,
    #3b82f6
  );
  background-size: 200% 200%;
  border-radius: 0.75rem;
  opacity: 0;
  z-index: -1;
  transition: all 0.5s ease;
  animation: wordGradientShift 2s ease infinite;
}

.word-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.15),
    0 0 25px rgba(59, 130, 246, 0.4);
}

.word-card:hover::before {
  opacity: 1;
}

.word-card:hover::after {
  opacity: 1;
  filter: blur(6px);
}

.word-card > * {
  position: relative;
  z-index: 2;
}

@keyframes wordGradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
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
  transition: all 0.3s ease;
}

.word-card:hover .word-text {
  color: #3b82f6;
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.pronounce-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.3s ease;
}

.pronounce-btn:hover {
  background: #e2e8f0;
  transform: scale(1.2);
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6));
}

.translation {
  color: #3b82f6;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  transition: all 0.3s ease;
}

.word-card:hover .translation {
  color: #8b5cf6;
  text-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
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
  transition: all 0.3s ease;
}

.word-card:hover .pos {
  background: #3b82f6;
  color: white;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
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
  backdrop-filter: blur(8px);
}

.modal {
  background: white;
  border-radius: 1rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 0 30px rgba(59, 130, 246, 0.2);
  position: relative;
  overflow: hidden;
}

.modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4, #10b981);
  background-size: 200% 200%;
  animation: modalGradient 3s ease infinite;
}

@keyframes modalGradient {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
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
  transition: all 0.3s ease;
}

.modal-header button:hover {
  background: #f1f5f9;
  color: #3b82f6;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
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
  transition: all 0.3s ease;
}

.example:hover {
  background: #f1f5f9;
  border-left-color: #8b5cf6;
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.1);
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

.metadata h4 {
  margin: 1rem 0 0.5rem 0;
  color: #1e293b;
  font-size: 1rem;
}

.metadata p {
  margin: 0.25rem 0;
  color: #64748b;
  font-size: 0.875rem;
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
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: all 0.5s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn.success {
  background: #10b981;
  color: white;
}

.btn.success:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
}

.btn.warning {
  background: #f59e0b;
  color: white;
}

.btn.warning:hover {
  background: #d97706;
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
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
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.1),
    0 0 20px rgba(16, 185, 129, 0.3);
  border-left: 4px solid #10b981;
  z-index: 1001;
  animation: slideIn 0.3s ease;
  max-width: 300px;
  backdrop-filter: blur(8px);
}

.toast.error {
  border-left-color: #ef4444;
  background: #fef2f2;
  color: #991b1b;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.1),
    0 0 20px rgba(239, 68, 68, 0.3);
}

.toast.warning {
  border-left-color: #f59e0b;
  background: #fffbeb;
  color: #92400e;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.1),
    0 0 20px rgba(245, 158, 11, 0.3);
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

/* Additional Neon Pulse Animation for Active Elements */
@keyframes neonPulse {
  0%, 100% {
    box-shadow: 
      0 0 5px currentColor,
      0 0 10px currentColor,
      0 0 15px currentColor;
  }
  50% {
    box-shadow: 
      0 0 10px currentColor,
      0 0 20px currentColor,
      0 0 30px currentColor;
  }
}

.card:hover,
.word-card:hover {
  animation: neonPulse 2s ease-in-out infinite;
}
</style>