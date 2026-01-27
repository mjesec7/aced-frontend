<template>
    <div class="modal-overlay" @click="closeOnOverlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Создать тест</h2>
          <button class="close-btn" @click="$emit('close')">×</button>
        </div>
  
        <div class="modal-body">
          <!-- Test Type Selection -->
          <div class="form-group">
            <label>Тип теста</label>
            <div class="radio-group">
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="testType" 
                  value="random"
                />
                <span class="radio-label">
                  <span class="radio-icon">🎲</span>
                  <span>
                    <strong>Случайные слова</strong>
                    <small>Тест из случайных слов выбранного языка</small>
                  </span>
                </span>
              </label>
              
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="testType" 
                  value="topics"
                />
                <span class="radio-label">
                  <span class="radio-icon">📚</span>
                  <span>
                    <strong>По темам</strong>
                    <small>Выберите одну или несколько тем</small>
                  </span>
                </span>
              </label>
            </div>
          </div>
  
          <!-- Language Selection (if from main page) -->
          <div v-if="!language && languages" class="form-group">
            <label>Язык</label>
            <select v-model="selectedLanguage" class="form-select">
              <option value="">Выберите язык</option>
              <option 
                v-for="lang in languages" 
                :key="lang.code" 
                :value="lang.code"
              >
                {{ lang.nameRu || lang.name }}
              </option>
            </select>
          </div>
  
          <!-- Topics Selection (if type is topics) -->
          <div v-if="testType === 'topics' && topics && topics.length > 0" class="form-group">
            <label>Темы</label>
            <div class="topics-checkbox-group">
              <label 
                v-for="topic in topics" 
                :key="topic.name" 
                class="checkbox-option"
              >
                <input 
                  type="checkbox" 
                  :value="topic.name" 
                  v-model="selectedTopics"
                />
                <span class="checkbox-label">
                  <span class="topic-icon">{{ getTopicIcon(topic.name) }}</span>
                  {{ getTopicNameRu(topic.name) }}
                  <span class="topic-count">({{ topic.wordCount || 8 }} слов)</span>
                </span>
              </label>
            </div>
            <p v-if="selectedTopics.length === 0" class="error-text">
              Выберите хотя бы одну тему
            </p>
          </div>
  
          <!-- Word Count Selection -->
          <div class="form-group">
            <label>Количество слов в тесте</label>
            <div class="word-count-options">
              <button 
                v-for="count in [5, 10, 15, 20]" 
                :key="count"
                @click="wordCount = count"
                class="count-btn"
                :class="{ active: wordCount === count }"
              >
                {{ count }}
              </button>
            </div>
          </div>
  
          <!-- Test Preview -->
          <div class="test-preview">
            <h3>Параметры теста:</h3>
            <ul>
              <li>
                <strong>Тип:</strong> 
                {{ testType === 'random' ? 'Случайные слова' : 'По темам' }}
              </li>
              <li v-if="language || selectedLanguage">
                <strong>Язык:</strong> 
                {{ languageName || getLanguageName(selectedLanguage) }}
              </li>
              <li v-if="testType === 'topics' && selectedTopics.length > 0">
                <strong>Темы:</strong> 
                {{ selectedTopics.map(t => getTopicNameRu(t)).join(', ') }}
              </li>
              <li>
                <strong>Количество вопросов:</strong> {{ wordCount }}
              </li>
            </ul>
          </div>
        </div>
  
        <div class="modal-footer">
          <button @click="$emit('close')" class="btn-secondary">
            Отмена
          </button>
          <button 
            @click="createTest" 
            class="btn-primary"
            :disabled="!isValid"
          >
            Создать тест
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue';
  
  export default {
    name: 'CreateTestModal',
    props: {
      language: String,
      languageName: String,
      languages: Array,
      topics: Array
    },
    emits: ['close', 'create'],
    setup(props, { emit }) {
      const testType = ref('random');
      const selectedLanguage = ref(props.language || '');
      const selectedTopics = ref([]);
      const wordCount = ref(10);
  
      const isValid = computed(() => {
        const hasLanguage = props.language || selectedLanguage.value;
        
        if (!hasLanguage) return false;
        
        if (testType.value === 'topics') {
          return selectedTopics.value.length > 0;
        }
        
        return true;
      });
  
      const getTopicIcon = (topicName) => {
        const icons = {
          'Travel': '✈️', 'Business': '💼', 'Food': '🍽️', 
          'Family': '👨‍👩‍👧‍👦', 'Education': '🎓', 'Health': '🏥',
          'Technology': '💻', 'Sports': '⚽', 'Music': '🎵',
          'Art': '🎨', 'Nature': '🌿', 'Animals': '🐾'
        };
        return icons[topicName] || '📖';
      };
  
      const getTopicNameRu = (topicName) => {
        const translations = {
          'Travel': 'Путешествия', 'Business': 'Бизнес', 
          'Food': 'Еда', 'Family': 'Семья', 
          'Education': 'Образование', 'Health': 'Здоровье',
          'Technology': 'Технологии', 'Sports': 'Спорт', 
          'Music': 'Музыка', 'Art': 'Искусство', 
          'Nature': 'Природа', 'Animals': 'Животные'
        };
        return translations[topicName] || topicName;
      };
  
      const getLanguageName = (code) => {
        const language = props.languages?.find(l => l.code === code);
        return language ? (language.nameRu || language.name) : code;
      };
  
      const closeOnOverlay = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
          emit('close');
        }
      };
  
      const createTest = () => {
        if (!isValid.value) return;
  
        const config = {
          type: testType.value,
          language: props.language || selectedLanguage.value,
          wordCount: wordCount.value,
          topics: testType.value === 'topics' ? selectedTopics.value : []
        };
  
        emit('create', config);
      };
  
      return {
        testType,
        selectedLanguage,
        selectedTopics,
        wordCount,
        isValid,
        getTopicIcon,
        getTopicNameRu,
        getLanguageName,
        closeOnOverlay,
        createTest
      };
    }
  };
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    backdrop-filter: blur(4px);
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .modal-content {
    background: white;
    border-radius: 20px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease;
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .modal-header h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    color: #9ca3af;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-btn:hover {
    color: #1f2937;
    background: #f3f4f6;
    transform: rotate(90deg);
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .form-group {
    margin-bottom: 24px;
  }
  
  .form-group label {
    display: block;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 12px;
    font-size: 1rem;
  }
  
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .radio-option {
    display: flex;
    align-items: flex-start;
    cursor: pointer;
    padding: 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    transition: all 0.2s;
  }
  
  .radio-option:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
  }
  
  .radio-option input[type="radio"] {
    margin-top: 2px;
    margin-right: 12px;
  }
  
  .radio-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
  }
  
  .radio-icon {
    font-size: 1.5rem;
  }
  
  .radio-label strong {
    display: block;
    color: #1f2937;
    margin-bottom: 4px;
  }
  
  .radio-label small {
    display: block;
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .form-select {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.2s;
    background: white;
  }
  
  .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }
  
  .topics-checkbox-group {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    max-height: 200px;
    overflow-y: auto;
    padding: 4px;
  }
  
  .checkbox-option {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s;
  }
  
  .checkbox-option:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
  }
  
  .checkbox-option input[type="checkbox"] {
    margin-right: 8px;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
  }
  
  .topic-icon {
    font-size: 1.25rem;
  }
  
  .topic-count {
    color: #6b7280;
    font-size: 0.75rem;
  }
  
  .error-text {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 8px;
  }
  
  .word-count-options {
    display: flex;
    gap: 12px;
  }
  
  .count-btn {
    padding: 12px 20px;
    border: 2px solid #e5e7eb;
    background: white;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 60px;
  }
  
  .count-btn:hover {
    border-color: #3b82f6;
    background: #f0f9ff;
  }
  
  .count-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
  
  .test-preview {
    background: #f9fafb;
    padding: 20px;
    border-radius: 12px;
    margin-top: 24px;
  }
  
  .test-preview h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 12px;
  }
  
  .test-preview ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .test-preview li {
    padding: 8px 0;
    color: #4b5563;
    font-size: 0.875rem;
  }
  
  .test-preview strong {
    color: #1f2937;
    margin-right: 8px;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 24px;
    border-top: 1px solid #e5e7eb;
  }
  
  .btn-secondary,
  .btn-primary {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
  }
  
  .btn-secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  .btn-secondary:hover {
    background: #e5e7eb;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }
  
  .btn-primary:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
  
  /* Responsive */
  @media (max-width: 640px) {
    .modal-content {
      width: 95%;
      margin: 20px;
    }
    
    .topics-checkbox-group {
      grid-template-columns: 1fr;
    }
    
    .word-count-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
    
    .modal-footer {
      flex-direction: column;
    }
    
    .btn-secondary,
    .btn-primary {
      width: 100%;
    }
  }
  </style>