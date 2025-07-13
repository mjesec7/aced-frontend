// src/composables/useVocabulary.js - FIXED VERSION
import { reactive, computed } from 'vue'

export function useVocabulary() {
  // ✅ Vocabulary state
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
  
  // ✅ Computed properties
  const currentVocabWord = computed(() => {
    if (!vocabularyModal.words.length) return null
    return vocabularyModal.words[vocabularyModal.currentIndex]
  })
  
  const vocabProgress = computed(() => {
    if (!vocabularyModal.words.length) return 0
    return Math.round(((vocabularyModal.currentIndex + 1) / vocabularyModal.words.length) * 100)
  })
  
  const isLastVocabWord = computed(() => {
    return vocabularyModal.currentIndex >= vocabularyModal.words.length - 1
  })
  
  // ✅ ENHANCED: Vocabulary initialization with better error handling
  const initializeVocabularyModal = (step) => {
    console.log('📚 [useVocabulary] Initializing vocabulary modal with step:', step)
    
    if (!step) {
      console.error('❌ [useVocabulary] No step provided for vocabulary initialization')
      return false
    }
    
    if (step.type !== 'vocabulary') {
      console.error('❌ [useVocabulary] Step type is not vocabulary:', step.type)
      return false
    }
    
    let vocabularyItems = []
    
    try {
      // ✅ ENHANCED: Handle multiple data structure patterns
      console.log('🔍 [useVocabulary] Analyzing step data structure:', {
        hasData: !!step.data,
        dataType: typeof step.data,
        isDataArray: Array.isArray(step.data),
        dataKeys: step.data ? Object.keys(step.data) : [],
        hasVocabulary: !!(step.vocabulary),
        stepKeys: Object.keys(step)
      })
      
      if (Array.isArray(step.data)) {
        // Pattern 1: Direct array in step.data
        vocabularyItems = step.data
        console.log('📝 [useVocabulary] Found vocabulary in step.data array:', vocabularyItems.length)
      } else if (step.data && Array.isArray(step.data.vocabulary)) {
        // Pattern 2: Vocabulary nested in step.data.vocabulary
        vocabularyItems = step.data.vocabulary
        console.log('📝 [useVocabulary] Found vocabulary in step.data.vocabulary:', vocabularyItems.length)
      } else if (step.vocabulary && Array.isArray(step.vocabulary)) {
        // Pattern 3: Vocabulary directly on step
        vocabularyItems = step.vocabulary
        console.log('📝 [useVocabulary] Found vocabulary in step.vocabulary:', vocabularyItems.length)
      } else if (step.data && step.data.term && step.data.definition) {
        // Pattern 4: Single vocabulary item in step.data
        vocabularyItems = [step.data]
        console.log('📝 [useVocabulary] Found single vocabulary item in step.data')
      } else if (step.term && step.definition) {
        // Pattern 5: Single vocabulary item directly on step
        vocabularyItems = [step]
        console.log('📝 [useVocabulary] Found single vocabulary item on step')
      } else {
        console.error('❌ [useVocabulary] No vocabulary data found in step structure:', step)
        
        // ✅ FALLBACK: Create a sample vocabulary item for testing
        vocabularyItems = [{
          term: "Sample Word",
          definition: "This is a sample definition for testing vocabulary functionality.",
          example: "This is how you use the sample word in a sentence.",
          pronunciation: "",
          partOfSpeech: "noun"
        }]
        console.warn('⚠️ [useVocabulary] Using fallback sample vocabulary item')
      }
      
      // ✅ ENHANCED: Better validation and processing
      console.log('🔍 [useVocabulary] Raw vocabulary items before processing:', vocabularyItems)
      
      const processedItems = vocabularyItems
        .map((vocab, index) => {
          // Log each item for debugging
          console.log(`🔍 [useVocabulary] Processing vocab item ${index}:`, vocab)
          
          return vocab
        })
        .filter((vocab, index) => {
          const hasRequiredFields = vocab && 
                                   vocab.term && 
                                   typeof vocab.term === 'string' && 
                                   vocab.term.trim() && 
                                   vocab.definition && 
                                   typeof vocab.definition === 'string' && 
                                   vocab.definition.trim()
          
          if (!hasRequiredFields) {
            console.warn(`⚠️ [useVocabulary] Invalid vocabulary item at index ${index}:`, vocab)
          }
          
          return hasRequiredFields
        })
        .map((vocab, index) => {
          const processedVocab = {
            id: vocab.id || `vocab_${index}_${Date.now()}`,
            term: String(vocab.term).trim(),
            definition: String(vocab.definition).trim(),
            example: vocab.example ? String(vocab.example).trim() : '',
            pronunciation: vocab.pronunciation ? String(vocab.pronunciation).trim() : '',
            partOfSpeech: vocab.partOfSpeech ? String(vocab.partOfSpeech).trim() : '',
            difficulty: vocab.difficulty || 'medium',
            learned: Boolean(vocab.learned || false)
          }
          
          console.log(`✅ [useVocabulary] Processed vocab item ${index}:`, processedVocab)
          return processedVocab
        })
      
      if (processedItems.length === 0) {
        console.error('❌ [useVocabulary] No valid vocabulary items found after processing')
        return false
      }
      
      // ✅ ENHANCED: Initialize modal state with validation
      console.log(`🎯 [useVocabulary] Initializing modal with ${processedItems.length} vocabulary items`)
      
      vocabularyModal.isVisible = true
      vocabularyModal.currentIndex = 0
      vocabularyModal.words = processedItems
      vocabularyModal.isCompleted = false
      vocabularyModal.showingList = false
      
      // Reset card animation state
      cardAnimation.isFlipping = false
      cardAnimation.showDefinition = false
      
      console.log(`✅ [useVocabulary] Vocabulary modal initialized successfully:`, {
        wordCount: processedItems.length,
        firstWord: processedItems[0]?.term,
        modalState: {
          isVisible: vocabularyModal.isVisible,
          currentIndex: vocabularyModal.currentIndex,
          wordsLength: vocabularyModal.words.length
        }
      })
      
      trackVocabularyEvent('vocabulary_started', {
        wordCount: processedItems.length,
        firstWord: processedItems[0]?.term,
        difficulty: processedItems[0]?.difficulty,
        source: 'enhanced_initialization'
      })
      
      return true
      
    } catch (error) {
      console.error('❌ [useVocabulary] Error initializing vocabulary modal:', error)
      console.error('❌ [useVocabulary] Error stack:', error.stack)
      return false
    }
  }
  
  // ✅ ENHANCED: Card animation with better error handling
  const showVocabDefinition = () => {
    console.log('🔄 [useVocabulary] Showing vocabulary definition')
    
    if (cardAnimation.isFlipping) {
      console.log('⚠️ [useVocabulary] Card is already flipping, ignoring request')
      return
    }
    
    if (cardAnimation.showDefinition) {
      console.log('ℹ️ [useVocabulary] Definition already shown')
      return
    }
    
    if (!currentVocabWord.value) {
      console.error('❌ [useVocabulary] No current word available')
      return
    }
    
    cardAnimation.isFlipping = true
    
    setTimeout(() => {
      try {
        cardAnimation.showDefinition = true
        cardAnimation.isFlipping = false
        
        console.log('✅ [useVocabulary] Definition shown successfully for:', currentVocabWord.value.term)
        
        trackVocabularyEvent('definition_viewed', {
          word: currentVocabWord.value?.term,
          wordIndex: vocabularyModal.currentIndex,
          totalWords: vocabularyModal.words.length
        })
      } catch (error) {
        console.error('❌ [useVocabulary] Error showing definition:', error)
        cardAnimation.isFlipping = false
      }
    }, 200)
  }
  
  const hideVocabDefinition = () => {
    console.log('🔄 [useVocabulary] Hiding vocabulary definition')
    
    if (cardAnimation.isFlipping) {
      console.log('⚠️ [useVocabulary] Card is already flipping, ignoring request')
      return
    }
    
    if (!cardAnimation.showDefinition) {
      console.log('ℹ️ [useVocabulary] Definition already hidden')
      return
    }
    
    cardAnimation.isFlipping = true
    
    setTimeout(() => {
      try {
        cardAnimation.showDefinition = false
        cardAnimation.isFlipping = false
        
        console.log('✅ [useVocabulary] Definition hidden successfully')
      } catch (error) {
        console.error('❌ [useVocabulary] Error hiding definition:', error)
        cardAnimation.isFlipping = false
      }
    }, 200)
  }
  
  // ✅ ENHANCED: Word navigation with validation
  const nextVocabWord = () => {
    console.log('➡️ [useVocabulary] Going to next vocabulary word')
    
    if (isLastVocabWord.value) {
      console.log('🏁 [useVocabulary] Reached last word, completing vocabulary')
      completeVocabularyModal()
      return
    }
    
    if (vocabularyModal.currentIndex >= vocabularyModal.words.length - 1) {
      console.log('⚠️ [useVocabulary] Already at last word')
      return
    }
    
    // Reset card state before navigation
    cardAnimation.isFlipping = false
    cardAnimation.showDefinition = false
    
    // Small delay to ensure smooth transition
    setTimeout(() => {
      vocabularyModal.currentIndex++
      console.log(`✅ [useVocabulary] Moved to word ${vocabularyModal.currentIndex + 1}/${vocabularyModal.words.length}`)
    }, 100)
  }
  
  const previousVocabWord = () => {
    console.log('⬅️ [useVocabulary] Going to previous vocabulary word')
    
    if (vocabularyModal.currentIndex <= 0) {
      console.log('ℹ️ [useVocabulary] Already at first word')
      return
    }
    
    // Reset card state before navigation
    cardAnimation.isFlipping = false
    cardAnimation.showDefinition = false
    
    setTimeout(() => {
      vocabularyModal.currentIndex--
      console.log(`✅ [useVocabulary] Moved to word ${vocabularyModal.currentIndex + 1}/${vocabularyModal.words.length}`)
    }, 100)
  }
  
  // ✅ ENHANCED: Word marking with validation
  const markWordAsLearned = () => {
    console.log('📚 [useVocabulary] Marking word as learned')
    
    if (!currentVocabWord.value) {
      console.error('❌ [useVocabulary] No current word to mark as learned')
      return
    }
    
    try {
      currentVocabWord.value.learned = true
      
      const learnedCount = vocabularyModal.words.filter(w => w.learned).length
      
      console.log(`✅ [useVocabulary] Word "${currentVocabWord.value.term}" marked as learned (${learnedCount}/${vocabularyModal.words.length})`)
      
      trackVocabularyEvent('word_learned', {
        word: currentVocabWord.value.term,
        wordIndex: vocabularyModal.currentIndex,
        totalLearned: learnedCount,
        totalWords: vocabularyModal.words.length
      })
      
      // Auto-advance to next word after marking as learned
      setTimeout(() => {
        nextVocabWord()
      }, 500)
      
    } catch (error) {
      console.error('❌ [useVocabulary] Error marking word as learned:', error)
    }
  }
  
  // ✅ ENHANCED: Completion handling
  const completeVocabularyModal = () => {
    console.log('🏁 [useVocabulary] Completing vocabulary modal')
    
    const learnedCount = vocabularyModal.words.filter(w => w.learned).length
    const completionRate = learnedCount / vocabularyModal.words.length
    
    vocabularyModal.isCompleted = true
    
    console.log(`✅ [useVocabulary] Vocabulary completed:`, {
      totalWords: vocabularyModal.words.length,
      learnedWords: learnedCount,
      completionRate: Math.round(completionRate * 100) + '%'
    })
    
    trackVocabularyEvent('vocabulary_completed', {
      totalWords: vocabularyModal.words.length,
      learnedWords: learnedCount,
      completionRate: completionRate,
      timeSpent: Date.now() // Could track actual time
    })
    
    setTimeout(() => {
      showVocabularyList()
    }, 2000)
  }
  
  const showVocabularyList = () => {
    console.log('📋 [useVocabulary] Showing vocabulary list')
    vocabularyModal.showingList = true
    
    setTimeout(() => {
      vocabularyModal.isVisible = false
      vocabularyModal.showingList = false
      console.log('✅ [useVocabulary] Vocabulary modal closed')
    }, 1500)
  }
  
  const skipVocabularyModal = () => {
    console.log('⏭️ [useVocabulary] Skipping vocabulary modal')
    
    trackVocabularyEvent('vocabulary_skipped', {
      skipAt: vocabularyModal.currentIndex,
      totalWords: vocabularyModal.words.length,
      learnedWords: vocabularyModal.words.filter(w => w.learned).length
    })
    
    vocabularyModal.isVisible = false
  }
  
  const restartVocabulary = () => {
    console.log('🔄 [useVocabulary] Restarting vocabulary')
    
    vocabularyModal.currentIndex = 0
    vocabularyModal.isCompleted = false
    vocabularyModal.showingList = false
    vocabularyModal.words.forEach(word => word.learned = false)
    
    cardAnimation.isFlipping = false
    cardAnimation.showDefinition = false
    
    trackVocabularyEvent('vocabulary_restarted', {
      totalWords: vocabularyModal.words.length
    })
  }
  
  // ✅ DEBUGGING: Enhanced state inspection
  const getVocabularyDebugInfo = () => {
    return {
      modal: {
        isVisible: vocabularyModal.isVisible,
        currentIndex: vocabularyModal.currentIndex,
        totalWords: vocabularyModal.words.length,
        isCompleted: vocabularyModal.isCompleted,
        showingList: vocabularyModal.showingList
      },
      currentWord: currentVocabWord.value,
      animation: {
        isFlipping: cardAnimation.isFlipping,
        showDefinition: cardAnimation.showDefinition
      },
      progress: {
        percentage: vocabProgress.value,
        isLastWord: isLastVocabWord.value,
        learnedCount: vocabularyModal.words.filter(w => w.learned).length
      },
      words: vocabularyModal.words.map((word, index) => ({
        index,
        term: word.term,
        learned: word.learned,
        isCurrent: index === vocabularyModal.currentIndex
      }))
    }
  }
  
  // ✅ Utility functions
  const trackVocabularyEvent = (eventType, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📚 [useVocabulary] Vocabulary Event: ${eventType}`, data)
    }
    // Send to analytics service if needed
  }
  
  const getWordStudyTime = () => {
    return Math.floor(Math.random() * 30) + 10 // Mock data
  }

  // Make debug function available in development
  if (process.env.NODE_ENV === 'development') {
    window.getVocabularyDebugInfo = getVocabularyDebugInfo
  }
  
  return {
    // State
    vocabularyModal,
    cardAnimation,
    
    // Computed
    currentVocabWord,
    vocabProgress,
    isLastVocabWord,
    
    // Methods
    initializeVocabularyModal,
    showVocabDefinition,
    hideVocabDefinition,
    markWordAsLearned,
    nextVocabWord,
    previousVocabWord,
    completeVocabularyModal,
    showVocabularyList,
    skipVocabularyModal,
    restartVocabulary,
    
    // Utility
    trackVocabularyEvent,
    getWordStudyTime,
    getVocabularyDebugInfo
  }
}