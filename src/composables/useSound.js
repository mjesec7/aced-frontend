// src/composables/useSound.js
import { ref, reactive } from 'vue'

export function useSound() {
  // ✅ Sound state
  const isPlaying = ref(false)
  const isLoading = ref(false)
  const soundError = ref(null)
  const speechSupported = ref(false)
  const speechVoices = ref([])
  const currentVoice = ref(null)
  
  // ✅ Sound settings
  const soundSettings = reactive({
    speechRate: 0.8,
    speechPitch: 1.0,
    speechVolume: 1.0,
    language: 'en-US',
    autoPlay: false,
    pronunciation: true
  })
  
  // ✅ Initialize speech synthesis
  const initializeSpeech = () => {
    try {
      if ('speechSynthesis' in window) {
        speechSupported.value = true
        
        // Load available voices
        const loadVoices = () => {
          const voices = speechSynthesis.getVoices()
          speechVoices.value = voices
          
          // Set default voice based on language
          const defaultVoice = voices.find(voice => 
            voice.lang.startsWith(soundSettings.language.substring(0, 2))
          ) || voices[0]
          
          if (defaultVoice) {
            currentVoice.value = defaultVoice
            console.log('🔊 Default voice set:', defaultVoice.name)
          }
        }
        
        // Load voices when available
        if (speechSynthesis.getVoices().length > 0) {
          loadVoices()
        } else {
          speechSynthesis.addEventListener('voiceschanged', loadVoices)
        }
        
        console.log('✅ Speech synthesis initialized')
      } else {
        console.warn('⚠️ Speech synthesis not supported')
        speechSupported.value = false
      }
    } catch (error) {
      console.error('❌ Speech initialization error:', error)
      speechSupported.value = false
      soundError.value = error.message
    }
  }
  
  // ✅ Text-to-speech methods
  const pronounceWord = async (text, options = {}) => {
    if (!speechSupported.value) {
      console.warn('⚠️ Speech synthesis not available')
      return false
    }
    
    if (!text || typeof text !== 'string') {
      console.warn('⚠️ Invalid text for pronunciation')
      return false
    }
    
    try {
      isPlaying.value = true
      soundError.value = null
      
      // Stop any current speech
      speechSynthesis.cancel()
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text.trim())
      
      // Apply settings
      utterance.rate = options.rate || soundSettings.speechRate
      utterance.pitch = options.pitch || soundSettings.speechPitch
      utterance.volume = options.volume || soundSettings.speechVolume
      utterance.lang = options.language || soundSettings.language
      
      // Set voice if available
      if (currentVoice.value) {
        utterance.voice = currentVoice.value
      }
      
      // Event handlers
      utterance.onstart = () => {
        console.log('🔊 Started pronouncing:', text)
        isPlaying.value = true
      }
      
      utterance.onend = () => {
        console.log('✅ Finished pronouncing:', text)
        isPlaying.value = false
      }
      
      utterance.onerror = (event) => {
        console.error('❌ Speech error:', event.error)
        soundError.value = event.error
        isPlaying.value = false
      }
      
      // Speak the text
      speechSynthesis.speak(utterance)
      
      // Track pronunciation event
      trackSoundEvent('word_pronounced', {
        word: text,
        language: utterance.lang,
        voice: currentVoice.value?.name
      })
      
      return true
      
    } catch (error) {
      console.error('❌ Pronunciation error:', error)
      soundError.value = error.message
      isPlaying.value = false
      return false
    }
  }
  
  const pronounceSentence = async (sentence, options = {}) => {
    if (!sentence) return false
    
    try {
      // Clean and prepare text
      const cleanText = cleanTextForSpeech(sentence)
      
      // Split into chunks if too long
      const chunks = splitTextIntoChunks(cleanText, options.chunkSize || 100)
      
      for (const chunk of chunks) {
        await pronounceWord(chunk, options)
        
        // Small delay between chunks
        if (chunks.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      return true
      
    } catch (error) {
      console.error('❌ Sentence pronunciation error:', error)
      return false
    }
  }
  
  // ✅ Audio playback methods (for audio files)
  const playAudioFile = async (audioUrl, options = {}) => {
    if (!audioUrl) {
      console.warn('⚠️ No audio URL provided')
      return false
    }
    
    try {
      isLoading.value = true
      soundError.value = null
      
      const audio = new Audio(audioUrl)
      
      // Set audio properties
      audio.volume = options.volume || soundSettings.speechVolume
      audio.playbackRate = options.playbackRate || 1.0
      
      // Event handlers
      audio.addEventListener('loadstart', () => {
        console.log('🔄 Loading audio:', audioUrl)
      })
      
      audio.addEventListener('canplay', () => {
        isLoading.value = false
        console.log('✅ Audio ready to play')
      })
      
      audio.addEventListener('play', () => {
        isPlaying.value = true
        console.log('🔊 Audio started playing')
      })
      
      audio.addEventListener('ended', () => {
        isPlaying.value = false
        console.log('✅ Audio finished playing')
      })
      
      audio.addEventListener('error', (event) => {
        const error = `Audio error: ${event.target.error?.message || 'Unknown error'}`
        console.error('❌', error)
        soundError.value = error
        isLoading.value = false
        isPlaying.value = false
      })
      
      // Play the audio
      await audio.play()
      
      trackSoundEvent('audio_played', {
        url: audioUrl,
        duration: audio.duration
      })
      
      return true
      
    } catch (error) {
      console.error('❌ Audio playback error:', error)
      soundError.value = error.message
      isLoading.value = false
      isPlaying.value = false
      return false
    }
  }
  
  // ✅ Sound control methods
  const stopSound = () => {
    try {
      // Stop speech synthesis
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel()
      }
      
      // Stop any playing audio elements
      document.querySelectorAll('audio').forEach(audio => {
        if (!audio.paused) {
          audio.pause()
          audio.currentTime = 0
        }
      })
      
      isPlaying.value = false
      console.log('🛑 All sounds stopped')
      
    } catch (error) {
      console.error('❌ Error stopping sound:', error)
    }
  }
  
  const pauseSound = () => {
    try {
      // Pause speech synthesis (if supported)
      if (speechSynthesis.speaking && speechSynthesis.pause) {
        speechSynthesis.pause()
      }
      
      // Pause audio elements
      document.querySelectorAll('audio').forEach(audio => {
        if (!audio.paused) {
          audio.pause()
        }
      })
      
      isPlaying.value = false
      console.log('⏸️ Sound paused')
      
    } catch (error) {
      console.error('❌ Error pausing sound:', error)
    }
  }
  
  const resumeSound = () => {
    try {
      // Resume speech synthesis (if supported)
      if (speechSynthesis.paused && speechSynthesis.resume) {
        speechSynthesis.resume()
      }
      
      // Resume audio elements
      document.querySelectorAll('audio').forEach(audio => {
        if (audio.paused && audio.currentTime > 0) {
          audio.play()
        }
      })
      
      isPlaying.value = true
      console.log('▶️ Sound resumed')
      
    } catch (error) {
      console.error('❌ Error resuming sound:', error)
    }
  }
  
  // ✅ Settings methods
  const updateSoundSettings = (newSettings) => {
    Object.assign(soundSettings, newSettings)
    console.log('🔧 Sound settings updated:', newSettings)
    
    // Reinitialize if language changed
    if (newSettings.language && newSettings.language !== soundSettings.language) {
      initializeSpeech()
    }
  }
  
  const setVoice = (voiceName) => {
    const voice = speechVoices.value.find(v => v.name === voiceName)
    if (voice) {
      currentVoice.value = voice
      console.log('🎙️ Voice changed to:', voice.name)
      return true
    } else {
      console.warn('⚠️ Voice not found:', voiceName)
      return false
    }
  }
  
  const getAvailableLanguages = () => {
    const languages = new Set()
    speechVoices.value.forEach(voice => {
      languages.add(voice.lang)
    })
    return Array.from(languages).sort()
  }
  
  const getVoicesForLanguage = (language) => {
    return speechVoices.value.filter(voice => 
      voice.lang.startsWith(language.substring(0, 2))
    )
  }
  
  // ✅ Utility methods
  const cleanTextForSpeech = (text) => {
    return text
      .replace(/[^\w\s.,!?;:-]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }
  
  const splitTextIntoChunks = (text, maxLength = 100) => {
    if (text.length <= maxLength) {
      return [text]
    }
    
    const chunks = []
    const sentences = text.split(/[.!?]+/)
    let currentChunk = ''
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxLength) {
        currentChunk += sentence + '. '
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim())
        }
        currentChunk = sentence + '. '
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim())
    }
    
    return chunks
  }
  
  const trackSoundEvent = (eventType, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔊 Sound Event: ${eventType}`, data)
    }
    // Send to analytics service if needed
  }
  
  // ✅ Pronunciation helpers for different languages
  const pronunciationHelpers = {
    en: {
      cleanText: (text) => text.replace(/[^\w\s.,!?;:-]/g, ''),
      getPhonetics: (word) => {
        // Could integrate with phonetics API
        return null
      }
    },
    ru: {
      cleanText: (text) => text.replace(/[^\u0400-\u04FF\w\s.,!?;:-]/g, ''),
      getPhonetics: (word) => {
        // Russian phonetics helper
        return null
      }
    },
    uz: {
      cleanText: (text) => text.replace(/[^\u0100-\u017F\w\s.,!?;:-]/g, ''),
      getPhonetics: (word) => {
        // Uzbek phonetics helper
        return null
      }
    }
  }
  
  const getPronunciationHelper = (language = 'en') => {
    const lang = language.substring(0, 2)
    return pronunciationHelpers[lang] || pronunciationHelpers.en
  }
  
  // ✅ Advanced pronunciation features
  const pronounceWithPhonetics = async (word, phonetics) => {
    if (!phonetics) {
      return await pronounceWord(word)
    }
    
    try {
      // Use phonetic notation if supported
      const phoneticText = `<phoneme alphabet="ipa" ph="${phonetics}">${word}</phoneme>`
      return await pronounceWord(phoneticText)
    } catch (error) {
      // Fallback to regular pronunciation
      console.warn('⚠️ Phonetic pronunciation failed, using fallback')
      return await pronounceWord(word)
    }
  }
  
  const pronounceWithSSML = async (ssmlText) => {
    if (!speechSupported.value) return false
    
    try {
      const utterance = new SpeechSynthesisUtterance()
      utterance.text = ssmlText
      utterance.rate = soundSettings.speechRate
      utterance.pitch = soundSettings.speechPitch
      utterance.volume = soundSettings.speechVolume
      
      if (currentVoice.value) {
        utterance.voice = currentVoice.value
      }
      
      speechSynthesis.speak(utterance)
      return true
      
    } catch (error) {
      console.error('❌ SSML pronunciation error:', error)
      return false
    }
  }
  
  return {
    // State
    isPlaying,
    isLoading,
    soundError,
    speechSupported,
    speechVoices,
    currentVoice,
    soundSettings,
    
    // Methods
    initializeSpeech,
    pronounceWord,
    pronounceSentence,
    playAudioFile,
    stopSound,
    pauseSound,
    resumeSound,
    updateSoundSettings,
    setVoice,
    getAvailableLanguages,
    getVoicesForLanguage,
    cleanTextForSpeech,
    splitTextIntoChunks,
    trackSoundEvent,
    getPronunciationHelper,
    pronounceWithPhonetics,
    pronounceWithSSML
  }
}