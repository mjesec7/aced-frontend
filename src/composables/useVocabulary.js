// src/composables/useVocabulary.js
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
  
  // ✅ Vocabulary methods
  const initializeVocabularyModal = (step) => {
    if (!step || step.type !== 'vocabulary') return
    
    let vocabularyItems = []
    
    // Handle different data structures
    if (Array.isArray(step.data)) {
      vocabularyItems = step.data
    } else if (step.data && Array.isArray(step.data.vocabulary)) {
      vocabularyItems = step.data.vocabulary
    } else if (step.data && step.data.term && step.data.definition) {
      vocabularyItems = [step.data]
    }
    
    // Filter and validate vocabulary items
    vocabularyItems = vocabularyItems.filter(vocab => 
      vocab.term && vocab.term.trim() && 
      vocab.definition && vocab.definition.trim()
    ).map((vocab, index) => ({
      id: `vocab_${index}_${Date.now()}`,
      term: vocab.term.trim(),
      definition: vocab.definition.trim(),
      example: vocab.example ? String(vocab.example).trim() : '',
      pronunciation: vocab.pronunciation || '',
      partOfSpeech: vocab.partOfSpeech || '',
      difficulty: vocab.difficulty || 'medium',
      learned: false
    }))
    
    if (vocabularyItems.length > 0) {
      vocabularyModal.isVisible = true
      vocabularyModal.currentIndex = 0
      vocabularyModal.words = vocabularyItems
      vocabularyModal.isCompleted = false
      vocabularyModal.showingList = false
      
      cardAnimation.isFlipping = false
      cardAnimation.showDefinition = false
      
      trackVocabularyEvent('vocabulary_started', {
        wordCount: vocabularyItems.length
      })
    }
  }
  
  const showVocabDefinition = () => {
    if (cardAnimation.isFlipping) return
    
    cardAnimation.isFlipping = true
    
    setTimeout(() => {
      cardAnimation.showDefinition = true
      cardAnimation.isFlipping = false
      
      trackVocabularyEvent('definition_viewed', {
        word: currentVocabWord.value?.term,
        wordIndex: vocabularyModal.currentIndex
      })
    }, 150)
  }
  
  const hideVocabDefinition = () => {
    if (cardAnimation.isFlipping) return
    
    cardAnimation.isFlipping = true
    
    setTimeout(() => {
      cardAnimation.showDefinition = false
      cardAnimation.isFlipping = false
    }, 150)
  }
  
  const markWordAsLearned = () => {
    if (currentVocabWord.value) {
      currentVocabWord.value.learned = true
      
      trackVocabularyEvent('word_learned', {
        word: currentVocabWord.value.term,
        wordIndex: vocabularyModal.currentIndex
      })
    }
    
    nextVocabWord()
  }
  
  const nextVocabWord = () => {
    if (isLastVocabWord.value) {
      completeVocabularyModal()
    } else {
      cardAnimation.isFlipping = false
      cardAnimation.showDefinition = false
      
      setTimeout(() => {
        vocabularyModal.currentIndex++
      }, 100)
    }
  }
  
  const previousVocabWord = () => {
    if (vocabularyModal.currentIndex > 0) {
      cardAnimation.isFlipping = false
      cardAnimation.showDefinition = false
      
      setTimeout(() => {
        vocabularyModal.currentIndex--
      }, 100)
    }
  }
  
  const completeVocabularyModal = () => {
    vocabularyModal.isCompleted = true
    
    trackVocabularyEvent('vocabulary_completed', {
      totalWords: vocabularyModal.words.length,
      learnedWords: vocabularyModal.words.filter(w => w.learned).length,
      completionRate: vocabularyModal.words.filter(w => w.learned).length / vocabularyModal.words.length
    })
    
    setTimeout(() => {
      showVocabularyList()
    }, 2000)
  }
  
  const showVocabularyList = () => {
    vocabularyModal.showingList = true
    
    setTimeout(() => {
      vocabularyModal.isVisible = false
      vocabularyModal.showingList = false
    }, 1500)
  }
  
  const skipVocabularyModal = () => {
    vocabularyModal.isVisible = false
    
    trackVocabularyEvent('vocabulary_skipped', {
      skipAt: vocabularyModal.currentIndex,
      totalWords: vocabularyModal.words.length
    })
  }
  
  const restartVocabulary = () => {
    vocabularyModal.currentIndex = 0
    vocabularyModal.isCompleted = false
    vocabularyModal.showingList = false
    vocabularyModal.words.forEach(word => word.learned = false)
    
    cardAnimation.isFlipping = false
    cardAnimation.showDefinition = false
    
    trackVocabularyEvent('vocabulary_restarted')
  }
  
  // ✅ Utility functions
  const trackVocabularyEvent = (eventType, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📚 Vocabulary Event: ${eventType}`, data)
    }
    // Send to analytics service if needed
  }
  
  const getWordStudyTime = () => {
    return Math.floor(Math.random() * 30) + 10 // Mock data
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
    trackVocabularyEvent,
    getWordStudyTime
  }
}