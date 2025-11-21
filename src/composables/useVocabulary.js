// src/composables/useVocabulary.js - COMPLETE REWRITTEN VERSION
import { reactive, computed, watch, nextTick } from 'vue'

export function useVocabulary() {
  // ✅ Core Vocabulary State
  const vocabularyModal = reactive({
    isVisible: false,
    currentIndex: 0,
    words: [],
    isCompleted: false,
    showingList: false
  })
  
  const cardAnimation = reactive({
    isFlipping: false,
    showDefinition: false
  })

  const studyTimer = reactive({
    startTime: null,
    endTime: null,
    totalTime: 0,
    wordTimes: {},
    isActive: false
  })
  
  // ✅ Computed Properties
  const currentVocabWord = computed(() => {
    const validWords = getValidWords()
    if (!validWords.length) return null
    
    const currentWord = validWords[vocabularyModal.currentIndex] || null

    return currentWord
  })
  
  const vocabProgress = computed(() => {
    const validWords = getValidWords()
    if (!validWords.length) return 0
    return Math.round(((vocabularyModal.currentIndex + 1) / validWords.length) * 100)
  })
  
  const isLastVocabWord = computed(() => {
    const validWords = getValidWords()
    return vocabularyModal.currentIndex >= validWords.length - 1
  })

  // ✅ Core Helper Functions
  const extractWordProperty = (word, propertyType) => {
    if (!word || typeof word !== 'object') return ''
    
    let value = ''
    
    switch (propertyType) {
      case 'term':
        value = word.term || word.word || word.title || word.name || ''
        break
      case 'definition':
        value = word.definition || word.translation || word.meaning || word.desc || word.description || ''
        break
      case 'example':
        value = word.example || word.examples || word.usage || word.sample || ''
        break
      case 'pronunciation':
        value = word.pronunciation || word.phonetic || word.ipa || ''
        break
      case 'partOfSpeech':
        value = word.partOfSpeech || word.pos || word.type || word.category || ''
        break
      default:
        value = word[propertyType] || ''
    }
    
    return String(value).trim()
  }

  const getValidWords = () => {
    return vocabularyModal.words.filter(word => {
      if (!word || typeof word !== 'object') return false
      
      const hasTerm = extractWordProperty(word, 'term')
      const hasDefinition = extractWordProperty(word, 'definition')
      
      return !!(hasTerm && hasDefinition)
    })
  }

  const detectVocabularyPatterns = (step) => {
    const patterns = []
    
    if (!step) {
      return { patterns, recommendation: 'No step provided', bestPattern: null }
    }

    // Pattern 1: Direct array in step.data
    if (Array.isArray(step.data)) {
      const validCount = step.data.filter(item => 
        extractWordProperty(item, 'term') && extractWordProperty(item, 'definition')
      ).length
      
      patterns.push({
        type: 'step.data (array)',
        data: step.data,
        count: step.data.length,
        valid: validCount
      })
    }

    // Pattern 2: Vocabulary nested in step.data.vocabulary
    if (step.data && Array.isArray(step.data.vocabulary)) {
      const validCount = step.data.vocabulary.filter(item => 
        extractWordProperty(item, 'term') && extractWordProperty(item, 'definition')
      ).length
      
      patterns.push({
        type: 'step.data.vocabulary',
        data: step.data.vocabulary,
        count: step.data.vocabulary.length,
        valid: validCount
      })
    }

    // Pattern 3: Vocabulary in step.data.words
    if (step.data && Array.isArray(step.data.words)) {
      const validCount = step.data.words.filter(item => 
        extractWordProperty(item, 'term') && extractWordProperty(item, 'definition')
      ).length
      
      patterns.push({
        type: 'step.data.words',
        data: step.data.words,
        count: step.data.words.length,
        valid: validCount
      })
    }

    // Pattern 4: Vocabulary directly on step.vocabulary
    if (step.vocabulary && Array.isArray(step.vocabulary)) {
      const validCount = step.vocabulary.filter(item => 
        extractWordProperty(item, 'term') && extractWordProperty(item, 'definition')
      ).length
      
      patterns.push({
        type: 'step.vocabulary',
        data: step.vocabulary,
        count: step.vocabulary.length,
        valid: validCount
      })
    }

    // Pattern 5: Single vocabulary item in step.data
    if (step.data && typeof step.data === 'object' && !Array.isArray(step.data)) {
      const hasTerm = extractWordProperty(step.data, 'term')
      const hasDefinition = extractWordProperty(step.data, 'definition')
      
      if (hasTerm && hasDefinition) {
        patterns.push({
          type: 'step.data (single item)',
          data: [step.data],
          count: 1,
          valid: 1
        })
      }
    }

    // Pattern 6: Single vocabulary item directly on step
    if (extractWordProperty(step, 'term') && extractWordProperty(step, 'definition')) {
      patterns.push({
        type: 'step (direct)',
        data: [step],
        count: 1,
        valid: 1
      })
    }

    // Pattern 7: Nested arrays in step.data
    if (step.data && typeof step.data === 'object' && !Array.isArray(step.data)) {
      Object.entries(step.data).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          const validCount = value.filter(item => 
            extractWordProperty(item, 'term') && extractWordProperty(item, 'definition')
          ).length
          
          if (validCount > 0) {
            patterns.push({
              type: `step.data.${key}`,
              data: value,
              count: value.length,
              valid: validCount
            })
          }
        }
      })
    }

    // Find best pattern
    const bestPattern = patterns
      .filter(p => p.valid > 0)
      .sort((a, b) => b.valid - a.valid)[0]

    const recommendation = bestPattern 
      ? `Use ${bestPattern.type} (${bestPattern.valid}/${bestPattern.count} valid items)`
      : 'No valid vocabulary data found'

    return { patterns, recommendation, bestPattern }
  }

  // ✅ Vocabulary Initialization
  const initializeVocabularyModal = (step) => {    
    if (!step) {      return false
    }
    
    if (step.type !== 'vocabulary') {      return false
    }
    
    try {
      const { patterns, recommendation, bestPattern } = detectVocabularyPatterns(step)
      let vocabularyItems = []

      if (bestPattern) {
        vocabularyItems = bestPattern.data      } else {
        // Enhanced fallback with realistic vocabulary
        vocabularyItems = [
          {
            id: 'fallback_1',
            term: "Algorithm",
            definition: "A step-by-step procedure for solving a problem or completing a task.",
            example: "The sorting algorithm efficiently organized the data.",
            pronunciation: "al-guh-ri-thuhm",
            partOfSpeech: "noun",
            difficulty: "medium",
            learned: false
          },
          {
            id: 'fallback_2',
            term: "Variable",
            definition: "A storage location with an associated name that contains data.",
            example: "The variable stores the user's input value.",
            pronunciation: "vair-ee-uh-buhl",
            partOfSpeech: "noun",
            difficulty: "easy",
            learned: false
          },
          {
            id: 'fallback_3',
            term: "Function",
            definition: "A reusable block of code that performs a specific task.",
            example: "The function calculates the area of a rectangle.",
            pronunciation: "fuhngk-shuhn",
            partOfSpeech: "noun",
            difficulty: "medium",
            learned: false
          }
        ]      }
      
      // Process and validate vocabulary items
      const processedItems = vocabularyItems
        .map((vocab, index) => {
          if (!vocab || typeof vocab !== 'object') {            return null
          }
          
          const term = extractWordProperty(vocab, 'term')
          const definition = extractWordProperty(vocab, 'definition')
          
          if (!term || !definition) {            return null
          }
          
          return {
            id: vocab.id || vocab._id || `vocab_${index}_${Date.now()}`,
            term,
            definition,
            example: extractWordProperty(vocab, 'example'),
            pronunciation: extractWordProperty(vocab, 'pronunciation'),
            partOfSpeech: extractWordProperty(vocab, 'partOfSpeech'),
            difficulty: vocab.difficulty || 'medium',
            learned: Boolean(vocab.learned || false),
            originalIndex: index,
            category: vocab.category || 'general',
            tags: vocab.tags || [],
            createdAt: vocab.createdAt || new Date().toISOString(),
            lastStudied: vocab.lastStudied || null
          }
        })
        .filter(Boolean)
      
      if (processedItems.length === 0) {        return false
      }
      
      // Initialize modal state
      vocabularyModal.isVisible = true
      vocabularyModal.currentIndex = 0
      vocabularyModal.words = processedItems
      vocabularyModal.isCompleted = false
      vocabularyModal.showingList = false
      
      // Reset card animation
      cardAnimation.isFlipping = false
      cardAnimation.showDefinition = false
      
      // Start study timer
      startStudyTimer()      
      trackVocabularyEvent('vocabulary_started', {
        wordCount: processedItems.length,
        source: bestPattern ? 'detected' : 'fallback',
        patternUsed: bestPattern?.type || 'fallback'
      })
      
      return true
      
    } catch (error) {      return false
    }
  }
  
  // ✅ Card Animation Methods
  const showVocabDefinition = () => {
    if (cardAnimation.isFlipping || cardAnimation.showDefinition) return
    if (!currentVocabWord.value) return
    
    cardAnimation.isFlipping = true
    
    setTimeout(() => {
      cardAnimation.showDefinition = true
      cardAnimation.isFlipping = false
      
      trackVocabularyEvent('definition_viewed', {
        word: extractWordProperty(currentVocabWord.value, 'term'),
        wordIndex: vocabularyModal.currentIndex
      })
    }, 200)
  }
  
  const hideVocabDefinition = () => {
    if (cardAnimation.isFlipping || !cardAnimation.showDefinition) return
    
    cardAnimation.isFlipping = true
    
    setTimeout(() => {
      cardAnimation.showDefinition = false
      cardAnimation.isFlipping = false
    }, 200)
  }
  
  // ✅ Navigation Methods
  const nextVocabWord = () => {
    const validWords = getValidWords()
    
    if (vocabularyModal.currentIndex >= validWords.length - 1) {
      completeVocabularyModal()
      return
    }
    
    cardAnimation.isFlipping = false
    cardAnimation.showDefinition = false
    
    setTimeout(() => {
      vocabularyModal.currentIndex++
      announceForScreenReader(`Word ${vocabularyModal.currentIndex + 1} of ${validWords.length}: ${extractWordProperty(currentVocabWord.value, 'term')}`)
    }, 100)
  }
  
  const previousVocabWord = () => {
    if (vocabularyModal.currentIndex <= 0) return
    
    cardAnimation.isFlipping = false
    cardAnimation.showDefinition = false
    
    setTimeout(() => {
      vocabularyModal.currentIndex--
      announceForScreenReader(`Word ${vocabularyModal.currentIndex + 1} of ${getValidWords().length}: ${extractWordProperty(currentVocabWord.value, 'term')}`)
    }, 100)
  }
  
  const jumpToVocabWord = (index) => {
    const validWords = getValidWords()
    
    if (index < 0 || index >= validWords.length || index === vocabularyModal.currentIndex) {
      return
    }
    
    cardAnimation.isFlipping = false
    cardAnimation.showDefinition = false
    
    setTimeout(() => {
      vocabularyModal.currentIndex = index
      announceForScreenReader(`Jumped to word ${index + 1}: ${extractWordProperty(currentVocabWord.value, 'term')}`)
    }, 50)
  }
  
  // ✅ Learning Progress Methods
  const markWordAsLearned = () => {
    if (!currentVocabWord.value) return
    
    const currentWord = currentVocabWord.value
    const wasLearned = currentWord.learned
    
    currentWord.learned = !currentWord.learned
    currentWord.lastStudied = new Date().toISOString()
    
    const validWords = getValidWords()
    const learnedCount = validWords.filter(w => w.learned).length
    
    announceForScreenReader(
      currentWord.learned 
        ? `Word marked as learned. ${learnedCount} of ${validWords.length} words completed.`
        : `Word unmarked. ${learnedCount} of ${validWords.length} words completed.`
    )
    
    trackVocabularyEvent('word_learned_toggled', {
      word: extractWordProperty(currentWord, 'term'),
      wasLearned,
      nowLearned: currentWord.learned,
      totalLearned: learnedCount,
      totalWords: validWords.length
    })
    
    // Auto-advance if newly learned
    if (currentWord.learned && !wasLearned) {
      setTimeout(() => {
        nextVocabWord()
      }, 800)
    }
    
    // Auto-save progress
    setTimeout(autoSaveProgress, 100)
  }
  
  // ✅ Completion Methods
  const completeVocabularyModal = () => {
    const validWords = getValidWords()
    const learnedCount = validWords.filter(w => w.learned).length
    const completionRate = validWords.length > 0 ? (learnedCount / validWords.length) * 100 : 0
    
    vocabularyModal.isCompleted = true
    stopStudyTimer()
    
    announceForScreenReader(`Vocabulary completed! You learned ${learnedCount} out of ${validWords.length} words.`)
    
    trackVocabularyEvent('vocabulary_completed', {
      totalWords: validWords.length,
      learnedWords: learnedCount,
      completionRate,
      studyTime: studyTimer.totalTime
    })
    
    setTimeout(() => {
      showVocabularyList()
    }, 2500)
  }
  
  const showVocabularyList = () => {
    vocabularyModal.showingList = true
    
    setTimeout(() => {
      vocabularyModal.isVisible = false
      vocabularyModal.showingList = false
      
      trackVocabularyEvent('vocabulary_modal_closed', {
        reason: 'completed'
      })
    }, 1500)
  }
  
  const skipVocabularyModal = () => {
    const validWords = getValidWords()
    const learnedCount = validWords.filter(w => w.learned).length
    
    stopStudyTimer()
    vocabularyModal.isVisible = false
    
    trackVocabularyEvent('vocabulary_skipped', {
      skipAt: vocabularyModal.currentIndex,
      totalWords: validWords.length,
      learnedWords: learnedCount
    })
  }
  
  const restartVocabulary = () => {
    const validWords = getValidWords()
    
    vocabularyModal.currentIndex = 0
    vocabularyModal.isCompleted = false
    vocabularyModal.showingList = false
    
    validWords.forEach(word => {
      word.learned = false
      word.lastStudied = null
    })
    
    cardAnimation.isFlipping = false
    cardAnimation.showDefinition = false
    
    // Restart timer
    startStudyTimer()
    
    trackVocabularyEvent('vocabulary_restarted', {
      totalWords: validWords.length
    })
  }
  
  // ✅ Timer Functions
  const startStudyTimer = () => {
    studyTimer.startTime = Date.now()
    studyTimer.isActive = true
    studyTimer.endTime = null
    studyTimer.totalTime = 0
    
    trackVocabularyEvent('study_timer_started')
  }

  const stopStudyTimer = () => {
    if (!studyTimer.isActive) return
    
    studyTimer.endTime = Date.now()
    studyTimer.totalTime = studyTimer.endTime - studyTimer.startTime
    studyTimer.isActive = false
    
    trackVocabularyEvent('study_timer_stopped', {
      totalTime: studyTimer.totalTime,
      totalMinutes: Math.round(studyTimer.totalTime / 60000 * 10) / 10
    })
  }

  const recordWordTime = (wordId, timeSpent) => {
    if (!wordId) return
    studyTimer.wordTimes[wordId] = (studyTimer.wordTimes[wordId] || 0) + timeSpent
  }

  // ✅ Auto-Save Functions
  const autoSaveProgress = () => {
    try {
      const progressData = {
        currentIndex: vocabularyModal.currentIndex,
        words: getValidWords().map(word => ({
          id: word.id,
          learned: word.learned,
          lastStudied: word.lastStudied
        })),
        lastSaved: new Date().toISOString()
      }
      
      localStorage.setItem('vocabularyProgress', JSON.stringify(progressData))
      
      if (process.env.NODE_ENV === 'development') {      }
    } catch (error) {    }
  }

  const loadSavedProgress = () => {
    try {
      const saved = localStorage.getItem('vocabularyProgress')
      return saved ? JSON.parse(saved) : null
    } catch (error) {      return null
    }
  }

  const applySavedProgress = (progressData) => {
    if (!progressData?.words) return false

    try {
      const validWords = getValidWords()
      let appliedCount = 0

      progressData.words.forEach(savedWord => {
        const matchingWord = validWords.find(word => 
          word.id === savedWord.id || 
          extractWordProperty(word, 'term') === extractWordProperty(savedWord, 'term')
        )
        
        if (matchingWord) {
          matchingWord.learned = savedWord.learned
          matchingWord.lastStudied = savedWord.lastStudied
          appliedCount++
        }
      })

      if (progressData.currentIndex !== undefined && progressData.currentIndex < validWords.length) {
        vocabularyModal.currentIndex = progressData.currentIndex
      }      
      trackVocabularyEvent('progress_restored', {
        totalWords: validWords.length,
        restoredWords: appliedCount
      })

      return true
    } catch (error) {      return false
    }
  }

  // ✅ Voice Pronunciation
  const pronounceWord = (word, options = {}) => {
    if (!word || typeof word !== 'string') return

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        
        const utterance = new SpeechSynthesisUtterance(word.trim())
        utterance.lang = options.lang || 'en-US'
        utterance.rate = options.rate || 0.8
        utterance.pitch = options.pitch || 1
        utterance.volume = options.volume || 1
        
        utterance.onstart = () => {
          trackVocabularyEvent('word_pronounced', { word, lang: utterance.lang })
        }
        
        utterance.onerror = (event) => {        }
        
        window.speechSynthesis.speak(utterance)
      }
    } catch (error) {    }
  }

  // ✅ Accessibility
  const announceForScreenReader = (message) => {
    if (typeof window === 'undefined') return
    
    try {
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;'
      
      document.body.appendChild(announcement)
      announcement.textContent = message
      
      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    } catch (error) {    }
  }

  // ✅ Keyboard Shortcuts
  const handleKeyboardShortcuts = (event) => {
    if (!vocabularyModal.isVisible) return

    const { key, ctrlKey, altKey } = event

    const shortcuts = {
      ' ': (e) => {
        e.preventDefault()
        cardAnimation.showDefinition ? hideVocabDefinition() : showVocabDefinition()
      },
      'ArrowLeft': (e) => {
        e.preventDefault()
        previousVocabWord()
      },
      'ArrowRight': (e) => {
        e.preventDefault()
        nextVocabWord()
      },
      'Enter': (e) => {
        e.preventDefault()
        markWordAsLearned()
      },
      'Escape': (e) => {
        e.preventDefault()
        skipVocabularyModal()
      },
      'Home': (e) => {
        e.preventDefault()
        jumpToVocabWord(0)
      },
      'End': (e) => {
        e.preventDefault()
        jumpToVocabWord(getValidWords().length - 1)
      }
    }

    // Handle Ctrl/Alt + R for restart
    if ((ctrlKey || altKey) && key === 'r') {
      event.preventDefault()
      restartVocabulary()
      return
    }

    // Handle number keys (1-9) for quick jump
    if (/^[1-9]$/.test(key)) {
      const index = parseInt(key) - 1
      const validWords = getValidWords()
      if (index < validWords.length) {
        event.preventDefault()
        jumpToVocabWord(index)
      }
      return
    }

    const shortcut = shortcuts[key]
    if (shortcut) {
      shortcut(event)
      
      trackVocabularyEvent('keyboard_shortcut_used', {
        key,
        ctrlKey,
        altKey,
        currentWord: extractWordProperty(currentVocabWord.value, 'term')
      })
    }
  }

  // ✅ Statistics and Analysis
  const getStudySessionStats = () => {
    const validWords = getValidWords()
    const learnedWords = validWords.filter(w => w.learned)
    const unlearnedWords = validWords.filter(w => !w.learned)
    
    return {
      total: validWords.length,
      learned: learnedWords.length,
      unlearned: unlearnedWords.length,
      progress: validWords.length > 0 ? Math.round((learnedWords.length / validWords.length) * 100) : 0,
      currentIndex: vocabularyModal.currentIndex,
      currentWord: currentVocabWord.value ? {
        term: extractWordProperty(currentVocabWord.value, 'term'),
        definition: extractWordProperty(currentVocabWord.value, 'definition'),
        learned: currentVocabWord.value.learned,
        difficulty: currentVocabWord.value.difficulty
      } : null,
      isCompleted: vocabularyModal.isCompleted,
      isVisible: vocabularyModal.isVisible,
      studyTime: studyTimer.totalTime
    }
  }

  const getStudyRecommendations = () => {
    const validWords = getValidWords()
    const learnedWords = validWords.filter(w => w.learned)
    const progressPercentage = validWords.length > 0 ? (learnedWords.length / validWords.length) * 100 : 0
    
    const recommendations = []

    if (progressPercentage === 0) {
      recommendations.push({
        type: 'start',
        priority: 'high',
        message: 'Start your vocabulary journey! Begin with the first word.',
        action: 'start_studying'
      })
    } else if (progressPercentage < 25) {
      recommendations.push({
        type: 'continue',
        priority: 'high',
        message: 'Great start! Keep building momentum.',
        action: 'continue_studying'
      })
    } else if (progressPercentage < 50) {
      recommendations.push({
        type: 'halfway',
        priority: 'medium',
        message: 'You\'re making good progress! Halfway there.',
        action: 'continue_studying'
      })
    } else if (progressPercentage < 100) {
      recommendations.push({
        type: 'almost_done',
        priority: 'high',
        message: 'Almost finished! Push through to complete the set.',
        action: 'finish_studying'
      })
    } else {
      recommendations.push({
        type: 'completed',
        priority: 'low',
        message: 'Excellent! You\'ve learned all words. Consider reviewing.',
        action: 'review_or_restart'
      })
    }

    return recommendations
  }

  // ✅ Search and Filter
  const searchWords = (query) => {
    if (!query || typeof query !== 'string') return getValidWords()
    
    const searchTerm = query.toLowerCase().trim()
    const validWords = getValidWords()
    
    return validWords.filter(word => {
      const term = extractWordProperty(word, 'term').toLowerCase()
      const definition = extractWordProperty(word, 'definition').toLowerCase()
      const example = extractWordProperty(word, 'example').toLowerCase()
      
      return term.includes(searchTerm) || 
             definition.includes(searchTerm) || 
             example.includes(searchTerm)
    })
  }

  const filterWordsByDifficulty = (difficulty) => {
    return getValidWords().filter(word => word.difficulty === difficulty)
  }

  const filterWordsByLearned = (learnedStatus = true) => {
    return getValidWords().filter(word => word.learned === learnedStatus)
  }

  // ✅ Data Export
  const exportVocabularyData = () => {
    const validWords = getValidWords()
    
    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalWords: validWords.length,
        learnedWords: validWords.filter(w => w.learned).length,
        version: '1.0'
      },
      vocabulary: validWords.map(word => ({
        id: word.id,
        term: extractWordProperty(word, 'term'),
        definition: extractWordProperty(word, 'definition'),
        example: extractWordProperty(word, 'example'),
        pronunciation: extractWordProperty(word, 'pronunciation'),
        partOfSpeech: extractWordProperty(word, 'partOfSpeech'),
        difficulty: word.difficulty,
        learned: word.learned,
        lastStudied: word.lastStudied
      }))
    }
  }

  // ✅ Validation
  const validateVocabularyStep = (step) => {
    if (!step || step.type !== 'vocabulary') {
      return { 
        isValid: false, 
        reason: 'Invalid step type',
        stepType: step?.type || 'undefined'
      }
    }
    
    const { patterns, recommendation, bestPattern } = detectVocabularyPatterns(step)
    
    return {
      isValid: bestPattern && bestPattern.valid > 0,
      reason: recommendation,
      patterns: patterns.map(p => ({
        type: p.type,
        count: p.count,
        valid: p.valid,
        validationRate: p.count > 0 ? Math.round((p.valid / p.count) * 100) : 0
      })),
      bestPattern: bestPattern ? {
        type: bestPattern.type,
        totalItems: bestPattern.count,
        validItems: bestPattern.valid,
        validationRate: Math.round((bestPattern.valid / bestPattern.count) * 100)
      } : null
    }
  }

  // ✅ Debug Functions
  const getVocabularyDebugInfo = () => {
    const validWords = getValidWords()
    const rawWords = vocabularyModal.words
    
    return {
      modal: {
        isVisible: vocabularyModal.isVisible,
        currentIndex: vocabularyModal.currentIndex,
        totalWords: rawWords.length,
        validWords: validWords.length,
        invalidWords: rawWords.length - validWords.length,
        isCompleted: vocabularyModal.isCompleted,
        showingList: vocabularyModal.showingList
      },
      currentWord: currentVocabWord.value ? {
        id: currentVocabWord.value.id,
        term: extractWordProperty(currentVocabWord.value, 'term'),
        definition: extractWordProperty(currentVocabWord.value, 'definition'),
        learned: currentVocabWord.value.learned,
        difficulty: currentVocabWord.value.difficulty
      } : null,
      animation: {
        isFlipping: cardAnimation.isFlipping,
        showDefinition: cardAnimation.showDefinition
      },
      progress: {
        percentage: vocabProgress.value,
        isLastWord: isLastVocabWord.value,
        learnedCount: validWords.filter(w => w.learned).length
      },
      timer: {
        isActive: studyTimer.isActive,
        totalTime: studyTimer.totalTime,
        startTime: studyTimer.startTime
      },
      words: validWords.map((word, index) => ({
        index,
        id: word.id,
        term: extractWordProperty(word, 'term'),
        learned: word.learned,
        isCurrent: index === vocabularyModal.currentIndex
      }))
    }
  }

  // ✅ Event Tracking
  const trackVocabularyEvent = (eventType, data = {}) => {
    const eventData = {
      ...data,
      timestamp: new Date().toISOString(),
      sessionId: `vocab_${Date.now()}`
    }
    
    if (process.env.NODE_ENV === 'development') {    }
    
    // Store events locally for analytics
    try {
      const events = JSON.parse(localStorage.getItem('vocabularyEvents') || '[]')
      events.push({ type: eventType, data: eventData })
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100)
      }
      
      localStorage.setItem('vocabularyEvents', JSON.stringify(events))
    } catch (error) {    }
  }

  // ✅ Cleanup
  const cleanup = () => {    
    stopStudyTimer()
    
    // Reset all state
    vocabularyModal.isVisible = false
    vocabularyModal.currentIndex = 0
    vocabularyModal.words = []
    vocabularyModal.isCompleted = false
    vocabularyModal.showingList = false
    
    cardAnimation.isFlipping = false
    cardAnimation.showDefinition = false
    
    // Reset timer
    studyTimer.startTime = null
    studyTimer.endTime = null
    studyTimer.totalTime = 0
    studyTimer.wordTimes = {}
    studyTimer.isActive = false
    
    trackVocabularyEvent('vocabulary_cleanup')
  }

  // ✅ Bulk Operations
  const markAllWordsAsLearned = () => {
    const validWords = getValidWords()
    const timestamp = new Date().toISOString()
    
    validWords.forEach(word => {
      word.learned = true
      word.lastStudied = timestamp
    })
    
    announceForScreenReader(`All ${validWords.length} words marked as learned`)
    
    trackVocabularyEvent('all_words_learned', {
      totalWords: validWords.length
    })
    
    autoSaveProgress()
  }

  const resetAllProgress = () => {
    const validWords = getValidWords()
    const previousLearnedCount = validWords.filter(w => w.learned).length
    
    validWords.forEach(word => {
      word.learned = false
      word.lastStudied = null
    })
    
    vocabularyModal.currentIndex = 0
    vocabularyModal.isCompleted = false
    
    announceForScreenReader(`All progress reset. ${previousLearnedCount} words unmarked.`)
    
    trackVocabularyEvent('progress_reset', {
      totalWords: validWords.length,
      previousLearnedCount
    })
    
    autoSaveProgress()
  }

  // ✅ Watch for auto-save triggers
  watch(() => vocabularyModal.currentIndex, () => {
    autoSaveProgress()
  })

  watch(() => getValidWords().filter(w => w.learned).length, () => {
    autoSaveProgress()
  })

  // ✅ Development Debug Functions
  if (process.env.NODE_ENV === 'development') {
    window.getVocabularyDebugInfo = getVocabularyDebugInfo
    window.validateVocabularyStep = validateVocabularyStep
    window.vocabularyModal = vocabularyModal
    window.extractWordProperty = extractWordProperty
    window.detectVocabularyPatterns = detectVocabularyPatterns
    window.getStudySessionStats = getStudySessionStats
    window.exportVocabularyData = exportVocabularyData
  }

  return {
    // ✅ State
    vocabularyModal,
    cardAnimation,
    studyTimer,
    
    // ✅ Computed
    currentVocabWord,
    vocabProgress,
    isLastVocabWord,
    
    // ✅ Core Methods
    initializeVocabularyModal,
    showVocabDefinition,
    hideVocabDefinition,
    markWordAsLearned,
    nextVocabWord,
    previousVocabWord,
    jumpToVocabWord,
    completeVocabularyModal,
    showVocabularyList,
    skipVocabularyModal,
    restartVocabulary,
    
    // ✅ Bulk Operations
    markAllWordsAsLearned,
    resetAllProgress,
    
    // ✅ Navigation & Interaction
    handleKeyboardShortcuts,
    pronounceWord,
    
    // ✅ Timer Functions
    startStudyTimer,
    stopStudyTimer,
    recordWordTime,
    
    // ✅ Data Management
    autoSaveProgress,
    loadSavedProgress,
    applySavedProgress,
    exportVocabularyData,
    
    // ✅ Search & Filter
    searchWords,
    filterWordsByDifficulty,
    filterWordsByLearned,
    
    // ✅ Statistics & Analysis
    getStudySessionStats,
    getStudyRecommendations,
    
    // ✅ Accessibility
    announceForScreenReader,
    
    // ✅ Helper Methods
    getValidWords,
    extractWordProperty,
    validateVocabularyStep,
    detectVocabularyPatterns,
    
    // ✅ Utility
    trackVocabularyEvent,
    getVocabularyDebugInfo,
    cleanup
  }
}