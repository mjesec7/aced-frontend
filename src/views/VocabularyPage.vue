<template>
    <div class="vocabulary-page">
      <!-- Header Section -->
      <header class="page-header">
        <h1 class="page-title">
          <span class="title-text">Vocabulary Mastery</span>
          <div class="title-decoration"></div>
        </h1>
        <p class="page-subtitle">Master languages through intelligent vocabulary building</p>
        
        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="stat-card" v-for="stat in stats" :key="stat.label">
            <div class="stat-number">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-trend">{{ stat.trend }}</div>
          </div>
        </div>
      </header>
  
      <!-- Language Cards Grid -->
      <section class="languages-section">
        <h2 class="section-title">Your Languages</h2>
        <div class="languages-grid">
          <div 
            v-for="language in languages" 
            :key="language.id"
            class="language-card"
            :class="{ popular: language.isPopular }"
            @click="selectLanguage(language)"
          >
            <div v-if="language.isPopular" class="language-badge">Most Active</div>
            <div class="progress-ring">
              <svg width="60" height="60" class="progress-circle">
                <circle cx="30" cy="30" r="25" fill="none" stroke="#e5e7eb" stroke-width="4"/>
                <circle 
                  cx="30" cy="30" r="25" fill="none" 
                  :stroke="language.color" 
                  stroke-width="4" 
                  stroke-dasharray="157" 
                  :stroke-dashoffset="157 - (157 * language.progress / 100)" 
                  class="progress-bar"
                />
              </svg>
              <div class="progress-text">{{ language.progress }}%</div>
            </div>
            <div class="language-flag">{{ language.flag }}</div>
            <div class="language-info">
              <h3 class="language-name">{{ language.name }}</h3>
              <p class="language-name-ru">{{ language.nativeName }}</p>
              <div class="language-stats">
                <span class="word-count">{{ language.wordCount }} words</span>
                <span class="topic-count">{{ language.topicCount }} topics</span>
              </div>
            </div>
            <div class="card-arrow">→</div>
          </div>
        </div>
      </section>
  
      <!-- Quick Actions -->
      <section class="quick-actions">
        <h2 class="section-title">Quick Actions</h2>
        <div class="action-cards">
          <div 
            v-for="action in actions" 
            :key="action.id"
            class="action-card"
            @click="performAction(action)"
          >
            <div v-if="action.count" class="action-count">{{ action.count }}</div>
            <div class="action-icon">{{ action.icon }}</div>
            <h4>{{ action.title }}</h4>
            <p>{{ action.description }}</p>
          </div>
        </div>
      </section>
  
      <!-- Recent Activity -->
      <section class="recent-activity">
        <h2 class="section-title">Recently Added Words</h2>
        <div class="recent-words">
          <div 
            v-for="word in recentWords" 
            :key="word.id"
            class="recent-word-card"
            @click="viewWord(word)"
          >
            <div class="word-main">{{ word.word }}</div>
            <div class="word-translation">{{ word.translation }}</div>
            <div class="word-meta">
              <span class="word-language">{{ word.language }}</span>
              <span class="word-topic">{{ word.topic }}</span>
            </div>
          </div>
        </div>
      </section>
  
      <!-- Floating Action Button -->
      <button class="fab" @click="openAddWordModal">
        <span class="fab-icon">+</span>
      </button>
  
      <!-- Add Word Modal -->
      <div v-if="showModal" class="modal-overlay" @click="closeModalOnOverlay">
        <div class="add-word-modal">
          <div class="modal-header">
            <h3>Add New Word</h3>
            <button class="close-btn" @click="closeAddWordModal">×</button>
          </div>
          <form class="add-word-form" @submit.prevent="submitWord">
            <div class="form-row">
              <div class="form-group">
                <label for="word">Word</label>
                <input 
                  type="text" 
                  id="word" 
                  v-model="newWord.word" 
                  placeholder="Enter word" 
                  required
                >
              </div>
              <div class="form-group">
                <label for="translation">Translation</label>
                <input 
                  type="text" 
                  id="translation" 
                  v-model="newWord.translation" 
                  placeholder="Enter translation" 
                  required
                >
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="language">Language</label>
                <select id="language" v-model="newWord.language" required>
                  <option value="">Select language</option>
                  <option v-for="lang in availableLanguages" :key="lang.value" :value="lang.value">
                    {{ lang.label }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="topic">Topic</label>
                <select id="topic" v-model="newWord.topic">
                  <option value="">Select topic</option>
                  <option v-for="topic in availableTopics" :key="topic.value" :value="topic.value">
                    {{ topic.label }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="closeAddWordModal">Cancel</button>
              <button type="submit" class="btn-primary" :disabled="!isFormValid">Add Word</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'VocabularyDashboard',
    data() {
      return {
        showModal: false,
        stats: [
          { value: 247, label: 'Words Learned', trend: '+12 this week' },
          { value: 5, label: 'Languages', trend: '2 active' },
          { value: '85%', label: 'Accuracy', trend: '+3% improved' }
        ],
        languages: [
          {
            id: 1,
            name: 'Spanish',
            nativeName: 'Español',
            flag: '🇪🇸',
            progress: 75,
            color: '#3b82f6',
            wordCount: 89,
            topicCount: 12,
            isPopular: true
          },
          {
            id: 2,
            name: 'French',
            nativeName: 'Français',
            flag: '🇫🇷',
            progress: 50,
            color: '#10b981',
            wordCount: 64,
            topicCount: 8,
            isPopular: false
          },
          {
            id: 3,
            name: 'German',
            nativeName: 'Deutsch',
            flag: '🇩🇪',
            progress: 30,
            color: '#f59e0b',
            wordCount: 43,
            topicCount: 6,
            isPopular: false
          }
        ],
        actions: [
          {
            id: 1,
            title: 'Review Due',
            description: 'Practice words you learned recently',
            icon: '📚',
            count: 5
          },
          {
            id: 2,
            title: 'Daily Challenge',
            description: 'Complete today\'s vocabulary quiz',
            icon: '🎯'
          },
          {
            id: 3,
            title: 'Progress Report',
            description: 'View your learning analytics',
            icon: '📊'
          },
          {
            id: 4,
            title: 'Achievements',
            description: 'Check your learning milestones',
            icon: '🏆'
          }
        ],
        recentWords: [
          {
            id: 1,
            word: 'Biblioteca',
            translation: 'Library',
            language: 'Spanish',
            topic: 'Education'
          },
          {
            id: 2,
            word: 'Cuisine',
            translation: 'Kitchen',
            language: 'French',
            topic: 'Home'
          },
          {
            id: 3,
            word: 'Wissenschaft',
            translation: 'Science',
            language: 'German',
            topic: 'Academic'
          }
        ],
        newWord: {
          word: '',
          translation: '',
          language: '',
          topic: ''
        },
        availableLanguages: [
          { value: 'spanish', label: 'Spanish' },
          { value: 'french', label: 'French' },
          { value: 'german', label: 'German' }
        ],
        availableTopics: [
          { value: 'education', label: 'Education' },
          { value: 'home', label: 'Home' },
          { value: 'academic', label: 'Academic' },
          { value: 'travel', label: 'Travel' }
        ]
      }
    },
    computed: {
      isFormValid() {
        return this.newWord.word.trim() && 
               this.newWord.translation.trim() && 
               this.newWord.language;
      }
    },
    methods: {
      openAddWordModal() {
        this.showModal = true;
        document.body.style.overflow = 'hidden';
      },
      closeAddWordModal() {
        this.showModal = false;
        document.body.style.overflow = 'auto';
        this.resetForm();
      },
      closeModalOnOverlay(e) {
        if (e.target.classList.contains('modal-overlay')) {
          this.closeAddWordModal();
        }
      },
      resetForm() {
        this.newWord = {
          word: '',
          translation: '',
          language: '',
          topic: ''
        };
      },
      submitWord() {
        if (!this.isFormValid) return;
        
        const wordData = { ...this.newWord, id: Date.now() };
        
        // Add to recent words (in real app, this would be an API call)
        this.recentWords.unshift({
          ...wordData,
          language: this.getLanguageLabel(wordData.language),
          topic: this.getTopicLabel(wordData.topic) || 'General'
        });
        
        // Keep only last 10 recent words
        if (this.recentWords.length > 10) {
          this.recentWords = this.recentWords.slice(0, 10);
        }
        
        // Update stats
        this.updateStats();
        
        // Emit event for parent component
        this.$emit('word-added', wordData);
        
        this.closeAddWordModal();
      },
      getLanguageLabel(value) {
        const lang = this.availableLanguages.find(l => l.value === value);
        return lang ? lang.label : value;
      },
      getTopicLabel(value) {
        const topic = this.availableTopics.find(t => t.value === value);
        return topic ? topic.label : value;
      },
      updateStats() {
        // Update word count
        this.stats[0].value += 1;
        this.stats[0].trend = `+${this.stats[0].value - 246} this week`;
      },
      selectLanguage(language) {
        this.$emit('language-selected', language);
      },
      performAction(action) {
        this.$emit('action-performed', action);
      },
      viewWord(word) {
        this.$emit('word-selected', word);
      }
    },
    mounted() {
      // Handle keyboard events
      const handleKeydown = (e) => {
        if (e.key === 'Escape' && this.showModal) {
          this.closeAddWordModal();
        }
      };
      
      document.addEventListener('keydown', handleKeydown);
      
      // Cleanup
      this.$once('hook:beforeDestroy', () => {
        document.removeEventListener('keydown', handleKeydown);
      });
    }
  }
  </script>

    <style>
        /* CSS Variables for consistent theming */
        :root {
            --primary-color: #3b82f6;
            --primary-dark: #2563eb;
            --primary-light: #dbeafe;
            --secondary-color: #10b981;
            --accent-color: #f59e0b;
            --danger-color: #ef4444;
            --text-primary: #1f2937;
            --text-secondary: #6b7280;
            --text-muted: #9ca3af;
            --background: #ffffff;
            --background-secondary: #f9fafb;
            --border-color: #e5e7eb;
            --border-light: #f3f4f6;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            --gradient-secondary: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            --gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
            --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            --border-radius-sm: 6px;
            --border-radius-md: 12px;
            --border-radius-lg: 16px;
            --border-radius-xl: 24px;
            --transition-fast: 0.15s ease;
            --transition-normal: 0.3s ease;
            --transition-slow: 0.5s ease;
        }

        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .vocabulary-page {
            max-width: 1400px;
            margin: 0 auto;
            padding: 32px 24px;
            position: relative;
        }

        /* Header Styles */
        .page-header {
            text-align: center;
            margin-bottom: 64px;
            position: relative;
        }

        .page-title {
            position: relative;
            margin-bottom: 16px;
        }

        .title-text {
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 900;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
            display: inline-block;
            position: relative;
            z-index: 2;
        }

        .title-decoration {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120%;
            height: 60%;
            background: linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
            border-radius: 50px;
            z-index: 1;
            animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
            33% { transform: translate(-50%, -50%) rotate(1deg) scale(1.05); }
            66% { transform: translate(-50%, -50%) rotate(-1deg) scale(0.95); }
        }

        .page-subtitle {
            font-size: 1.25rem;
            color: var(--text-secondary);
            font-weight: 400;
            margin-bottom: 48px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        /* Quick Stats */
        .quick-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 24px;
            max-width: 800px;
            margin: 0 auto;
        }

        .stat-card {
            background: var(--background);
            padding: 32px 24px;
            border-radius: var(--border-radius-lg);
            box-shadow: var(--shadow-lg);
            text-align: center;
            border: 1px solid var(--border-color);
            position: relative;
            overflow: hidden;
            transition: all var(--transition-normal);
            backdrop-filter: blur(10px);
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: var(--gradient-primary);
        }

        .stat-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: var(--shadow-xl);
            border-color: var(--primary-color);
        }

        .stat-number {
            font-size: 3rem;
            font-weight: 800;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            line-height: 1;
        }

        .stat-label {
            font-size: 1rem;
            color: var(--text-primary);
            font-weight: 600;
            margin-bottom: 4px;
        }

        .stat-trend {
            font-size: 0.875rem;
            color: var(--secondary-color);
            font-weight: 500;
        }

        /* Section Titles */
        .section-title {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 32px;
            text-align: center;
            position: relative;
        }

        .section-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: var(--gradient-primary);
            border-radius: 2px;
        }

        /* Languages Section */
        .languages-section {
            margin-bottom: 80px;
        }

        .languages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 32px;
        }

        .language-card {
            background: var(--background);
            border-radius: var(--border-radius-xl);
            padding: 32px;
            box-shadow: var(--shadow-lg);
            border: 2px solid transparent;
            cursor: pointer;
            transition: all var(--transition-normal);
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
        }

        .language-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%);
            z-index: 1;
        }

        .language-card:hover {
            transform: translateY(-12px) scale(1.02);
            box-shadow: var(--shadow-xl);
            border-color: var(--primary-color);
        }

        .language-card.popular {
            border-color: var(--accent-color);
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%);
        }

        .language-card.popular:hover {
            border-color: var(--accent-color);
            box-shadow: 0 20px 40px rgba(245, 158, 11, 0.2);
        }

        .language-flag {
            font-size: 4rem;
            text-align: center;
            margin-bottom: 24px;
            position: relative;
            z-index: 2;
            animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }

        .language-info {
            text-align: center;
            margin-bottom: 24px;
            position: relative;
            z-index: 2;
        }

        .language-name {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .language-name-ru {
            font-size: 1.125rem;
            color: var(--text-secondary);
            margin-bottom: 16px;
            font-style: italic;
        }

        .language-stats {
            display: flex;
            justify-content: center;
            gap: 16px;
            font-size: 0.875rem;
        }

        .word-count,
        .topic-count {
            background: var(--border-light);
            padding: 8px 16px;
            border-radius: var(--border-radius-md);
            color: var(--text-primary);
            font-weight: 600;
            transition: all var(--transition-fast);
        }

        .language-card:hover .word-count,
        .language-card:hover .topic-count {
            background: var(--primary-light);
            color: var(--primary-dark);
        }

        .language-badge {
            position: absolute;
            top: 16px;
            right: 16px;
            background: var(--gradient-warning);
            color: white;
            padding: 8px 16px;
            border-radius: var(--border-radius-md);
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            z-index: 3;
            box-shadow: var(--shadow-md);
        }

        .progress-ring {
            position: absolute;
            top: 20px;
            left: 20px;
            width: 60px;
            height: 60px;
            z-index: 3;
        }

        .progress-circle {
            transform: rotate(-90deg);
        }

        .progress-bar {
            transition: stroke-dashoffset 1s ease-in-out;
        }

        .progress-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 0.875rem;
            font-weight: 700;
            color: var(--primary-color);
        }

        .card-arrow {
            position: absolute;
            bottom: 20px;
            right: 20px;
            font-size: 1.5rem;
            color: var(--text-muted);
            transition: all var(--transition-normal);
            z-index: 2;
        }

        .language-card:hover .card-arrow {
            transform: translateX(8px);
            color: var(--primary-color);
        }

        /* Quick Actions */
        .quick-actions {
            margin-bottom: 80px;
        }

        .action-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
        }

        .action-card {
            background: var(--background);
            border-radius: var(--border-radius-lg);
            padding: 32px 24px;
            text-align: center;
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border-color);
            cursor: pointer;
            transition: all var(--transition-normal);
            position: relative;
            overflow: hidden;
        }

        .action-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%);
            transform: translateY(100%);
            transition: transform var(--transition-normal);
        }

        .action-card:hover::before {
            transform: translateY(0);
        }

        .action-card:hover {
            transform: translateY(-8px);
            box-shadow: var(--shadow-xl);
            border-color: var(--primary-color);
        }

        .action-icon {
            font-size: 3rem;
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
            transition: transform var(--transition-normal);
        }

        .action-card:hover .action-icon {
            transform: scale(1.1) rotate(5deg);
        }

        .action-card h4 {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
            position: relative;
            z-index: 2;
        }

        .action-card p {
            font-size: 0.875rem;
            color: var(--text-secondary);
            position: relative;
            z-index: 2;
        }

        .action-count {
            position: absolute;
            top: 16px;
            right: 16px;
            background: var(--gradient-primary);
            color: white;
            padding: 6px 12px;
            border-radius: var(--border-radius-md);
            font-size: 0.75rem;
            font-weight: 700;
            z-index: 3;
            box-shadow: var(--shadow-md);
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }

        /* Recent Activity */
        .recent-activity {
            margin-bottom: 100px;
        }

        .recent-words {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
        }

        .recent-word-card {
            background: var(--background);
            border-radius: var(--border-radius-lg);
            padding: 24px;
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border-color);
            cursor: pointer;
            transition: all var(--transition-normal);
            position: relative;
            overflow: hidden;
        }

        .recent-word-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--gradient-primary);
            transform: scaleY(0);
            transition: transform var(--transition-normal);
        }

        .recent-word-card:hover::before {
            transform: scaleY(1);
        }

        .recent-word-card:hover {
            transform: translateY(-6px) translateX(8px);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary-color);
        }

        .word-main {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .word-translation {
            font-size: 1.125rem;
            color: var(--text-secondary);
            margin-bottom: 16px;
            font-style: italic;
        }

        .word-meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
            gap: 8px;
        }

        .word-language,
        .word-topic {
            background: var(--border-light);
            padding: 6px 12px;
            border-radius: var(--border-radius-sm);
            color: var(--text-primary);
            font-weight: 600;
            flex: 1;
            text-align: center;
        }

        /* Floating Action Button */
        .fab {
            position: fixed;
            bottom: 32px;
            right: 32px;
            width: 70px;
            height: 70px;
            background: var(--gradient-primary);
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 1.75rem;
            cursor: pointer;
            box-shadow: var(--shadow-xl);
            transition: all var(--transition-normal);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .fab:hover {
            transform: scale(1.1) rotate(90deg);
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4);
        }

        .fab:active {
            transform: scale(0.95);
        }

        .fab-icon {
            transition: transform var(--transition-fast);
        }

        /* Modal Styles */
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

        .add-word-modal {
            background: var(--background);
            border-radius: var(--border-radius-xl);
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: var(--shadow-xl);
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
            padding: 32px 32px 0;
            margin-bottom: 32px;
        }

        .modal-header h3 {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
        }

        .close-btn {
            background: none;
            border: none;
            font-size: 2rem;
            color: var(--text-muted);
            cursor: pointer;
            padding: 8px;
            border-radius: var(--border-radius-sm);
            transition: all var(--transition-fast);
        }

        .close-btn:hover {
            color: var(--text-primary);
            background: var(--border-light);
            transform: rotate(90deg);
        }

        /* Form Styles */
        .add-word-form {
            padding: 0 32px 32px;
        }

        .form-group {
            margin-bottom: 24px;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .form-group label {
            display: block;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 8px;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 16px;
            border: 2px solid var(--border-color);
            border-radius: var(--border-radius-md);
            font-size: 1rem;
            font-family: inherit;
            transition: all var(--transition-fast);
            background: var(--background);
        }

        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
            transform: translateY(-2px);
        }

        .form-group input::placeholder {
            color: var(--text-muted);
        }

        /* Form Actions */
        .form-actions {
            display: flex;
            gap: 16px;
            justify-content: flex-end;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid var(--border-color);
        }

        .btn-secondary,
        .btn-primary {
            padding: 16px 32px;
            border: none;
            border-radius: var(--border-radius-md);
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-fast);
            font-size: 1rem;
            min-width: 120px;
        }

        .btn-secondary {
            background: var(--border-light);
            color: var(--text-primary);
            border: 2px solid var(--border-color);
        }

        .btn-secondary:hover {
            background: var(--border-color);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        .btn-primary {
            background: var(--gradient-primary);
            color: white;
            border: 2px solid transparent;
        }

        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
        }

        .btn-primary:disabled {
            background: var(--text-muted);
            cursor: not-allowed;
            transform: none;
        }

        /* Loading and Error States */
        .loading-container,
        .error-container {
            text-align: center;
            padding: 80px 24px;
        }

        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid var(--border-light);
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error-icon {
            font-size: 4rem;
            margin-bottom: 24px;
            color: var(--danger-color);
        }

        .error-container h3 {
            color: var(--danger-color);
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 16px;
        }

        .retry-btn {
            background: var(--gradient-primary);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: var(--border-radius-md);
            cursor: pointer;
            margin-top: 24px;
            transition: all var(--transition-fast);
            font-weight: 600;
        }

        .retry-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }

        /* Enhanced Animations */
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        /* Apply entrance animations */
        .page-header {
            animation: slideInUp 0.8s ease 0.1s both;
        }

        .stat-card:nth-child(1) {
            animation: fadeInScale 0.6s ease 0.3s both;
        }

        .stat-card:nth-child(2) {
            animation: fadeInScale 0.6s ease 0.4s both;
        }

        .stat-card:nth-child(3) {
            animation: fadeInScale 0.6s ease 0.5s both;
        }

        .language-card:nth-child(1) {
            animation: slideInLeft 0.6s ease 0.6s both;
        }

        .language-card:nth-child(2) {
            animation: slideInLeft 0.6s ease 0.7s both;
        }

        .language-card:nth-child(3) {
            animation: slideInLeft 0.6s ease 0.8s both;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
            .vocabulary-page {
                padding: 24px 20px;
            }

            .languages-grid {
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 24px;
            }

            .action-cards {
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            }
        }

        @media (max-width: 768px) {
            .vocabulary-page {
                padding: 20px 16px;
            }

            .title-text {
                font-size: 2.5rem;
            }

            .page-subtitle {
                font-size: 1.125rem;
            }

            .quick-stats {
                grid-template-columns: 1fr;
                gap: 16px;
                max-width: 400px;
            }

            .languages-grid {
                grid-template-columns: 1fr;
            }

            .language-card {
                padding: 24px;
            }

            .action-cards {
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
            }

            .recent-words {
                grid-template-columns: 1fr;
            }

            .form-row {
                grid-template-columns: 1fr;
                gap: 16px;
            }

            .fab {
                bottom: 24px;
                right: 24px;
                width: 60px;
                height: 60px;
                font-size: 1.5rem;
            }

            .modal-header,
            .add-word-form {
                padding-left: 24px;
                padding-right: 24px;
            }

            .form-actions {
                flex-direction: column;
            }

            .btn-secondary,
            .btn-primary {
                width: 100%;
            }
        }

        @media (max-width: 480px) {
            .title-text {
                font-size: 2rem;
            }

            .action-cards {
                grid-template-columns: 1fr;
            }

            .quick-stats {
                grid-template-columns: 1fr;
            }

            .language-stats {
                flex-direction: column;
                gap: 8px;
            }

            .word-meta {
                flex-direction: column;
                gap: 8px;
            }

            .word-language,
            .word-topic {
                text-align: center;
            }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            :root {
                --text-primary: #f9fafb;
                --text-secondary: #d1d5db;
                --text-muted: #9ca3af;
                --background: #1f2937;
                --background-secondary: #111827;
                --border-color: #374151;
                --border-light: #4b5563;
            }

            body {
                background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
            }

            .stat-card,
            .language-card,
            .action-card,
            .recent-word-card,
            .add-word-modal {
                background: rgba(31, 41, 55, 0.8);
                backdrop-filter: blur(20px);
                border-color: var(--border-color);
            }

            .form-group input,
            .form-group select {
                background: var(--background-secondary);
                color: var(--text-primary);
                border-color: var(--border-color);
            }

            .form-group input::placeholder {
                color: var(--text-muted);
            }
        }

        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
            :root {
                --border-color: #000000;
                --text-primary: #000000;
                --background: #ffffff;
            }

            .language-card,
            .stat-card,
            .action-card,
            .recent-word-card {
                border: 3px solid var(--text-primary);
            }
        }

        /* Focus styles for accessibility */
        .language-card:focus,
        .action-card:focus,
        .recent-word-card:focus,
        .fab:focus {
            outline: 3px solid var(--primary-color);
            outline-offset: 2px;
        }

        /* Print styles */
        @media print {
            .fab,
            .modal-overlay {
                display: none !important;
            }

            .vocabulary-page {
                max-width: none;
                padding: 0;
            }

            .language-card,
            .stat-card,
            .action-card,
            .recent-word-card {
                box-shadow: none;
                border: 1px solid var(--border-color);
                break-inside: avoid;
            }
        }
    </style>

