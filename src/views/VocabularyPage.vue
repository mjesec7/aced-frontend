<template>
  <div class="vocabulary-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>{{ loadingMessage }}</span>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>{{ error.title }}</h3>
      <p>{{ error.message }}</p>
      <button @click="initialize" class="retry-btn">Повторить</button>
    </div>
    
    <!-- No Languages Available -->
    <div v-else-if="!hasLanguages" class="empty-state">
      <div class="empty-icon">🌍</div>
      <h3>Добро пожаловать!</h3>
      <p>Выберите язык для начала изучения словаря</p>
      <button @click="initialize" class="primary-btn">Обновить</button>
    </div>
    
    <!-- Language Selection View -->
    <div v-else-if="!selectedLanguage" class="language-selection">
      <div class="page-header">
        <div class="header-content">
          <div class="header-main">
            <h1 class="page-title">📚 Словарь</h1>
            <p class="page-subtitle">Выберите язык для изучения</p>
          </div>
          
          <!-- Quick Stats -->
          <div class="stats-bar" v-if="overallStats">
            <div class="stat">
              <span class="stat-number">{{ overallStats.totalWords || 0 }}</span>
              <span class="stat-label">всего слов</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ availableLanguages.length }}</span>
              <span class="stat-label">языков доступно</span>
            </div>
            <div class="stat">
              <span class="stat-number">{{ overallStats.languagesStarted || 0 }}</span>
              <span class="stat-label">начато изучение</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="languages-grid">
        <div 
          v-for="language in availableLanguages" 
          :key="language.code"
          class="language-card"
          :class="{ 'has-progress': language.totalWords > 0 }"
          @click="selectLanguage(language)"
        >
          <div class="lang-flag">{{ language.flag }}</div>
          <div class="lang-info">
            <h3 class="lang-name">{{ language.nameRu || language.name }}</h3>
            <div class="lang-stats">
              <div v-if="language.totalWords > 0" class="stat-item">
                <span class="stat-icon">📚</span>
                <span class="stat-text">{{ language.totalWords }} слов изучается</span>
              </div>
              <div v-if="language.progress > 0" class="stat-item">
                <span class="stat-icon">✅</span>
                <span class="stat-text">{{ language.progress }}% изучено</span>
              </div>
              <div v-if="language.totalWords === 0" class="stat-item">
                <span class="stat-icon">🚀</span>
                <span class="stat-text">Начать изучение</span>
              </div>
            </div>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>
    </div>
    
    <!-- Selected Language View -->
    <div v-else class="language-view">
      <!-- Language Header -->
      <div class="language-header">
        <button @click="goBackToLanguages" class="back-btn">
          ← Назад к языкам
        </button>
        
        <div class="lang-title-section">
          <span class="lang-flag-large">{{ selectedLanguage.flag }}</span>
          <div class="lang-title-info">
            <h1 class="lang-title">{{ selectedLanguage.nameRu || selectedLanguage.name }}</h1>
            <p class="lang-subtitle">{{ getTotalWordsText() }}</p>
          </div>
        </div>
        
        <div class="lang-actions">
          <button 
            v-if="hasAnyContent" 
            @click="createTest" 
            class="action-btn primary"
          >
            <span class="btn-icon">🎯</span>
            <span>Тест</span>
          </button>
        </div>
      </div>

      <!-- Language Loading -->
      <div v-if="languageLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>Загрузка словаря...</span>
      </div>

      <!-- Language Content -->
      <div v-else-if="hasAnyContent" class="language-content">
        
        <!-- Topics Section -->
        <section v-if="topics.length > 0" class="vocabulary-section">
          <div class="section-header">
            <div class="section-info">
              <h2 class="section-title">📚 Темы для изучения</h2>
              <span class="section-count">{{ topics.length }}</span>
            </div>
          </div>

          <div class="topics-grid">
            <div 
              v-for="topic in topics"
              :key="topic.name"
              class="topic-card"
              @click="selectTopic(topic)"
            >
              <div class="topic-icon">{{ getTopicIcon(topic.name) }}</div>
              
              <div class="topic-content">
                <h3 class="topic-name">{{ getTopicNameRu(topic.name) }}</h3>
                <p class="topic-description">{{ getTopicDescription(topic.name) }}</p>
                
                <div class="topic-stats">
                  <div class="stat-badge">
                    <span class="stat-icon">📝</span>
                    <span>{{ topic.wordCount }} слов</span>
                  </div>
                  <div class="stat-badge difficulty" :class="topic.difficulty || 'beginner'">
                    <span class="stat-icon">{{ getDifficultyIcon(topic.difficulty || 'beginner') }}</span>
                    <span>{{ getDifficultyLabel(topic.difficulty || 'beginner') }}</span>
                  </div>
                </div>
              </div>
              
              <div class="card-arrow">→</div>
            </div>
          </div>
        </section>
        
      </div>
      
      <!-- Empty Language State -->
      <div v-else class="empty-language-state">
        <div class="empty-icon">📚</div>
        <h3>Начните изучение {{ selectedLanguage.nameRu || selectedLanguage.name }}</h3>
        <p>Выберите тему для начала изучения словаря</p>
        <div class="empty-actions">
          <button @click="goBackToLanguages" class="primary-btn">Выбрать другой язык</button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div v-if="toast.visible" class="toast" :class="toast.type">
      <div class="toast-icon">
        {{ toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️' }}
      </div>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { vocabularyService } from '@/services/vocabularyService'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { currentUser } = useAuth()

// Simple toast functionality
const toast = ref({ visible: false, message: '', type: 'success' })
const showToast = (message, type = 'success') => {
  toast.value = { visible: true, message, type }
  setTimeout(() => { toast.value.visible = false }, 3000)
}
const hideToast = () => { toast.value.visible = false }

// State
const isLoading = ref(true)
const languageLoading = ref(false)
const error = ref(null)
const selectedLanguage = ref(null)
const loadingMessage = ref('Загрузка языков...')
const topics = ref([])

// Data
const availableLanguages = ref([])
const overallStats = ref(null)

// Computed
const hasLanguages = computed(() => 
  availableLanguages.value && availableLanguages.value.length > 0
)

const hasAnyContent = computed(() => 
  topics.value.length > 0
)

const getTotalWordsText = () => {
  const topicsCount = topics.value.length
  const totalWords = topics.value.reduce((sum, topic) => sum + topic.wordCount, 0)
  
  if (totalWords === 0) return 'Нет слов'
  return `${topicsCount} тем, ${totalWords} слов`
}

// Helper functions
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
    'Technology': 'Технологии', 'Sports': 'Спорт', 'Music': 'Музыка',
    'Art': 'Искусство', 'Nature': 'Природа', 'Animals': 'Животные'
  }
  return translations[topicName] || topicName
}

const getTopicDescription = (topicName) => {
  const descriptions = {
    'Travel': 'Основные слова для путешествий',
    'Business': 'Деловая лексика и термины',
    'Food': 'Еда, напитки и кулинария',
    'Family': 'Семья и родственники',
    'Education': 'Образование и обучение',
    'Health': 'Здоровье и медицина',
    'Technology': 'Технологии и компьютеры',
    'Sports': 'Спорт и физическая активность'
  }
  return descriptions[topicName] || 'Изучайте новые слова'
}

const getDifficultyIcon = (difficulty) => {
  const icons = { beginner: '🟢', intermediate: '🟡', advanced: '🔴' }
  return icons[difficulty] || '⚪'
}

const getDifficultyLabel = (difficulty) => {
  const labels = { beginner: 'Легкий', intermediate: 'Средний', advanced: 'Сложный' }
  return labels[difficulty] || difficulty
}

// Methods
const initialize = async () => {
  if (!currentUser.value) {
    showToast('Пожалуйста, войдите в систему', 'warning')
    router.push('/auth/login')
    return
  }

  try {
    isLoading.value = true
    error.value = null
    loadingMessage.value = 'Загрузка ваших языков...'
    
    const result = await vocabularyService.getUserLanguages(currentUser.value.uid)
    
    if (result.success) {
      availableLanguages.value = result.data.languages || []
      overallStats.value = result.data.stats || { totalWords: 0, languagesWithLessons: 0, mastered: 0 }
    } else {
      throw new Error(result.error)
    }
    
  } catch (err) {
    console.error('❌ Failed to initialize vocabulary:', err)
    error.value = {
      title: 'Ошибка загрузки',
      message: err.message || 'Не удалось загрузить словарь',
      code: err.code || 'UNKNOWN_ERROR'
    }
  } finally {
    isLoading.value = false
  }
}

const selectLanguage = async (language) => {
  selectedLanguage.value = language
  await loadLanguageContent(language)
}

const loadLanguageContent = async (language) => {
  try {
    languageLoading.value = true
    topics.value = []
    
    const result = await vocabularyService.getLanguageTopics(currentUser.value.uid, language.code)
    
    if (result.success) {
      topics.value = result.data.topics || []
    } else {
      throw new Error(result.error)
    }
    
  } catch (err) {
    console.error('❌ Failed to load language content:', err)
    showToast('Не удалось загрузить содержимое языка', 'error')
  } finally {
    languageLoading.value = false
  }
}

const selectTopic = (topic) => {
  router.push({
    name: 'VocabularyIn',
    params: { 
      languageCode: selectedLanguage.value.code
    },
    query: {
      topic: topic.name
    }
  })
}

const goBackToLanguages = () => {
  selectedLanguage.value = null
  topics.value = []
}

const createTest = () => {
  router.push({
    name: 'VocabularyIn',
    params: { languageCode: selectedLanguage.value.code },
    query: { mode: 'test' }
  })
}

const goToAdmin = () => {
  // Only available for admin users
  if (currentUser.value?.role === 'admin') {
    router.push('/admin/vocabulary')
  } else {
    showToast('Изучайте доступные темы и слова', 'info')
  }
}

// Lifecycle
onMounted(async () => {
  await initialize()
})

// Auto-hide toast
setTimeout(() => {
  if (toast.visible) {
    hideToast()
  }
}, 3000)
</script>
<style scoped>
/* Variables */
:root {
  --primary: #8b5cf6;
  --primary-dark: #7c3aed;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
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
  --white: #ffffff;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --transition: all 0.2s ease;
}

/* Base */
.vocabulary-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: 'Inter', system-ui, sans-serif;
  padding: 2rem;
}

/* Loading & Error States */
.loading-state, 
.error-state,
.empty-state,
.empty-language-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--white);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  margin: 0 auto;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

.error-icon,
.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.7;
}

.error-state h3,
.empty-state h3,
.empty-language-state h3 {
  color: var(--gray-900);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.error-state p,
.empty-state p,
.empty-language-state p {
  color: var(--gray-600);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.retry-btn,
.primary-btn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: var(--transition);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.retry-btn:hover,
.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

/* Page Header */
.page-header {
  background: var(--white);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-900);
}

.page-subtitle {
  margin: 0.5rem 0 0 0;
  color: var(--gray-600);
  font-size: 1rem;
}

.stats-bar {
  display: flex;
  gap: 2rem;
}

.stat {
  text-align: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%);
  border-radius: 0.75rem;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

/* Languages Grid */
.languages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.language-card {
  background: var(--white);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  position: relative;
  box-shadow: var(--shadow);
}

.language-card.has-progress:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
}

.lang-flag {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 1rem;
  animation: bounce 3s ease-in-out infinite;
}

.lang-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 0.75rem 0;
  text-align: center;
}

.lang-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gray-50);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-700);
}

.language-card:hover .stat-item {
  background: #ede9fe;
  color: var(--primary);
}

.stat-icon {
  font-size: 1rem;
}

.card-arrow {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  font-size: 1.25rem;
  color: var(--gray-400);
  transition: var(--transition);
}

.language-card:hover .card-arrow {
  color: var(--primary);
  transform: translateX(4px);
}

/* Language View */
.language-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  background: var(--white);
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
}

.back-btn {
  background: var(--gray-100);
  border: 1px solid var(--gray-300);
  color: var(--gray-700);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition);
}

.back-btn:hover {
  background: var(--gray-200);
  transform: translateX(-2px);
}

.lang-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: center;
}

.lang-flag-large {
  font-size: 3rem;
}

.lang-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.lang-subtitle {
  color: var(--gray-600);
  margin: 0.25rem 0 0 0;
}

.lang-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  border: 2px solid transparent;
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

/* Vocabulary Sections */
.vocabulary-section {
  background: var(--white);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--gray-100);
}

.section-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.section-count {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Topics Grid */
.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.topic-card {
  background: var(--gray-50);
  border-radius: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  position: relative;
}

.topic-card:hover {
  transform: translateY(-4px);
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
  background: var(--white);
}

.topic-icon {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 1rem;
}

.topic-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.topic-description {
  color: var(--gray-600);
  font-size: 0.875rem;
  text-align: center;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.topic-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--white);
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: var(--gray-700);
  font-weight: 500;
  border: 1px solid var(--gray-200);
}

.stat-badge.difficulty.beginner {
  background: #ecfdf5;
  color: #065f46;
  border-color: #a7f3d0;
}

.stat-badge.difficulty.intermediate {
  background: #fffbeb;
  color: #92400e;
  border-color: #fde68a;
}

.stat-badge.difficulty.advanced {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

/* Toast */
.toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  background: var(--white);
  color: var(--gray-900);
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.4s ease;
  box-shadow: var(--shadow-lg);
  border: 2px solid var(--primary);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 400px;
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

.toast.warning {
  border-color: var(--warning);
  background: #fffbeb;
  color: #92400e;
}

.toast-icon {
  font-size: 1.125rem;
}

.empty-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-8px); }
  60% { transform: translateY(-4px); }
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsive */
@media (max-width: 768px) {
  .vocabulary-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .stats-bar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .language-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .lang-title-section {
    justify-content: center;
  }
  
  .languages-grid,
  .topics-grid {
    grid-template-columns: 1fr;
  }
}
</style>