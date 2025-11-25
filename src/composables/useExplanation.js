// src/composables/useExplanation.js
import { ref, reactive } from 'vue'
import { 
  getLessonAIResponse, 
  generateLessonSuggestions, 
  generateSmartHint, 
  generateProgressInsight,
  getExplanationHelp,
  getUserUsage,
  formatUsageDisplay
} from '@/services/GPTService'

export function useExplanation() {
  // ✅ Explanation state
  const showExplanationHelp = ref(false)
  const explanationQuestion = ref('')
  const explanationAIResponse = ref('')
  const isLoadingExplanation = ref(false)
  
  // ✅ AI Integration state
  const aiChatHistory = ref([])
  const aiChatInput = ref('')
  const aiSuggestions = ref([])
  const smartHint = ref('')
  const aiIsLoading = ref(false)
  const showFloatingAI = ref(false)
  const floatingAIInput = ref('')
  const quickSuggestions = ref([])
  const aiUsage = ref(null)
  const progressInsight = ref('')
  
  // ✅ AI settings
  const aiSettings = reactive({
    maxChatHistory: 10,
    hintThreshold: 2, // Show hints after 2 mistakes
    suggestionRefreshInterval: 5000,
    usageCheckInterval: 60000,
    enableSmartHints: true,
    enableProgressInsights: true
  })
  
  // ✅ Initialize AI services
  const initializeAI = async () => {
    try {
      await loadAIUsage()
    } catch (error) {
    }
  }
  
  // ✅ Explanation help methods
  const askAboutExplanation = async (explanationText, lessonContext) => {
    if (!explanationQuestion.value.trim()) {
      return
    }
    
    try {
      isLoadingExplanation.value = true
      explanationAIResponse.value = ''
      
      if (typeof getExplanationHelp === 'function') {
        const response = await getExplanationHelp(
          explanationText, 
          explanationQuestion.value.trim(), 
          lessonContext || {}
        )
        
        explanationAIResponse.value = response
        
        // Track explanation request
        trackAIEvent('explanation_requested', {
          question: explanationQuestion.value,
          hasResponse: !!response,
          responseLength: response?.length || 0
        })
        
        // Clear the question
        explanationQuestion.value = ''
        
      } else {
        throw new Error('Explanation help service not available')
      }

    } catch (error) {
      explanationAIResponse.value = 'Unable to get help. Please try again.'
    } finally {
      isLoadingExplanation.value = false
    }
  }
  
  const clearExplanationHelp = () => {
    showExplanationHelp.value = false
    explanationQuestion.value = ''
    explanationAIResponse.value = ''
  }
  
  const toggleExplanationHelp = () => {
    showExplanationHelp.value = !showExplanationHelp.value
    if (!showExplanationHelp.value) {
      clearExplanationHelp()
    }
  }
  
  // ✅ AI Chat methods
  const sendAIMessage = async (lessonContext, userProgress, stepContext) => {
    if (!aiChatInput.value.trim() || aiIsLoading.value) return
    
    const userMessage = aiChatInput.value.trim()
    aiChatInput.value = ''
    aiIsLoading.value = true
    
    // Add user message to history
    addToAIChatHistory('user', userMessage)
    
    try {
      if (typeof getLessonAIResponse === 'function') {
        const aiResponse = await getLessonAIResponse(
          userMessage, 
          lessonContext || {}, 
          userProgress || {}, 
          stepContext || {}
        )
        
        // Add AI response to history
        addToAIChatHistory('ai', aiResponse)
        
        // Refresh suggestions and usage
        await Promise.all([
          generateAISuggestions(stepContext, userProgress),
          loadAIUsage()
        ])
        
        trackAIEvent('chat_message_sent', {
          messageLength: userMessage.length,
          responseLength: aiResponse?.length || 0,
          chatHistorySize: aiChatHistory.value.length
        })
        
      } else {
        throw new Error('AI chat service not available')
      }

    } catch (error) {
      addToAIChatHistory('ai', 'Sorry, an error occurred. Please try again.')
    } finally {
      aiIsLoading.value = false
    }
  }
  
  const sendFloatingAIMessage = async (lessonContext, userProgress, stepContext) => {
    if (!floatingAIInput.value.trim() || aiIsLoading.value) return
    
    aiChatInput.value = floatingAIInput.value
    floatingAIInput.value = ''
    await sendAIMessage(lessonContext, userProgress, stepContext)
  }
  
  const askAI = async (question, lessonContext, userProgress, stepContext) => {
    aiChatInput.value = question
    await sendAIMessage(lessonContext, userProgress, stepContext)
  }
  
  // ✅ AI suggestions methods
  const generateAISuggestions = async (currentStep, userProgress) => {
    try {
      if (typeof generateLessonSuggestions === 'function') {
        const suggestions = await generateLessonSuggestions(currentStep, userProgress)
        
        if (Array.isArray(suggestions)) {
          aiSuggestions.value = suggestions
          quickSuggestions.value = suggestions.slice(0, 3)
          
          trackAIEvent('suggestions_generated', {
            count: suggestions.length,
            stepType: currentStep?.type
          })
        }
      }
    } catch (error) {
    }
  }
  
  const refreshSuggestions = async (currentStep, userProgress) => {
    await generateAISuggestions(currentStep, userProgress)
  }
  
  // ✅ Smart hints methods
  const generateSmartHintForMistakes = async (exerciseData, mistakeCount, lessonContext) => {
    if (!aiSettings.enableSmartHints || mistakeCount < aiSettings.hintThreshold) {
      return
    }
    
    try {
      if (typeof generateSmartHint === 'function') {
        const hint = await generateSmartHint(exerciseData, mistakeCount, lessonContext)
        
        if (hint && hint.trim()) {
          smartHint.value = hint
          
          trackAIEvent('smart_hint_generated', {
            mistakeCount,
            hintLength: hint.length,
            exerciseType: exerciseData?.type
          })
        }
      }
    } catch (error) {
    }
  }
  
  const clearSmartHint = () => {
    smartHint.value = ''
  }
  
  // ✅ Progress insights methods
  const generateProgressInsightForLesson = async (userProgress, lessonContext) => {
    if (!aiSettings.enableProgressInsights) return
    
    try {
      if (typeof generateProgressInsight === 'function') {
        const insight = await generateProgressInsight(userProgress, lessonContext)
        
        if (insight && insight.trim()) {
          progressInsight.value = insight
          
          trackAIEvent('progress_insight_generated', {
            progressData: {
              completedSteps: userProgress?.completedSteps?.length || 0,
              mistakes: userProgress?.mistakes || 0,
              stars: userProgress?.stars || 0
            }
          })
        }
      }
    } catch (error) {
    }
  }
  
  // ✅ AI usage tracking
  const loadAIUsage = async () => {
    try {
      if (typeof getUserUsage === 'function') {
        const usageInfo = await getUserUsage()
        if (usageInfo.success) {
          aiUsage.value = formatUsageDisplay(usageInfo.usage, usageInfo.plan)
          
          trackAIEvent('usage_loaded', {
            plan: usageInfo.plan,
            messages: usageInfo.usage?.messages || 0
          })
        }
      }
    } catch (error) {
    }
  }
  
  const checkUsageLimit = () => {
    if (!aiUsage.value) return { allowed: true, reason: 'unknown' }
    
    const plan = aiUsage.value.plan || 'free'
    const currentUsage = aiUsage.value.messages || 0
    
    const limits = {
      free: 50,
      start: 200,
      pro: Infinity
    }
    
    const limit = limits[plan] || limits.free
    
    if (currentUsage >= limit) {
      return { 
        allowed: false, 
        reason: 'limit_reached', 
        limit, 
        usage: currentUsage 
      }
    }
    
    return { 
      allowed: true, 
      remaining: limit - currentUsage,
      limit,
      usage: currentUsage
    }
  }
  
  // ✅ Chat history management
  const addToAIChatHistory = (type, content) => {
    const message = {
      id: Date.now() + Math.random(),
      type,
      content,
      timestamp: new Date().toISOString()
    }
    
    aiChatHistory.value.push(message)
    
    // Keep only recent messages
    if (aiChatHistory.value.length > aiSettings.maxChatHistory) {
      aiChatHistory.value = aiChatHistory.value.slice(-aiSettings.maxChatHistory)
    }
  }
  
  const clearAIChatHistory = () => {
    aiChatHistory.value = []
  }
  
  const exportChatHistory = () => {
    const chatData = {
      messages: aiChatHistory.value,
      exportedAt: new Date().toISOString(),
      settings: aiSettings
    }
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-chat-history-${Date.now()}.json`
    a.click()
    
    URL.revokeObjectURL(url)
  }
  
  // ✅ Floating AI controls
  const toggleFloatingAI = () => {
    showFloatingAI.value = !showFloatingAI.value
    if (showFloatingAI.value) {
      generateAISuggestions()
    }
  }
  
  const closeFloatingAI = () => {
    showFloatingAI.value = false
  }
  
  // ✅ Settings management
  const updateAISettings = (newSettings) => {
    Object.assign(aiSettings, newSettings)
  }
  
  const resetAISettings = () => {
    Object.assign(aiSettings, {
      maxChatHistory: 10,
      hintThreshold: 2,
      suggestionRefreshInterval: 5000,
      usageCheckInterval: 60000,
      enableSmartHints: true,
      enableProgressInsights: true
    })
  }
  
  // ✅ Analytics and tracking
  const trackAIEvent = (eventType, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
    }
    
    // Could send to analytics service
    // analytics.track(`ai_${eventType}`, { ...data, timestamp: Date.now() })
  }
  
  const getAIAnalytics = () => {
    return {
      chatHistorySize: aiChatHistory.value.length,
      suggestionsCount: aiSuggestions.value.length,
      hintsGenerated: smartHint.value ? 1 : 0,
      insightsGenerated: progressInsight.value ? 1 : 0,
      usage: aiUsage.value,
      settings: aiSettings
    }
  }
  
  // ✅ Utility methods
  const formatAIResponse = (response) => {
    if (!response) return ''
    
    return response
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/\n/g, '<br>') // Line breaks
      .trim()
  }
  
  const truncateMessage = (message, maxLength = 100) => {
    if (!message || message.length <= maxLength) return message
    
    return message.substring(0, maxLength).trim() + '...'
  }
  
  const isAIServiceAvailable = () => {
    return typeof getLessonAIResponse === 'function' &&
           typeof generateLessonSuggestions === 'function'
  }
  
  return {
    // Explanation state
    showExplanationHelp,
    explanationQuestion,
    explanationAIResponse,
    isLoadingExplanation,
    
    // AI state
    aiChatHistory,
    aiChatInput,
    aiSuggestions,
    smartHint,
    aiIsLoading,
    showFloatingAI,
    floatingAIInput,
    quickSuggestions,
    aiUsage,
    progressInsight,
    aiSettings,
    
    // Methods
    initializeAI,
    askAboutExplanation,
    clearExplanationHelp,
    toggleExplanationHelp,
    sendAIMessage,
    sendFloatingAIMessage,
    askAI,
    generateAISuggestions,
    refreshSuggestions,
    generateSmartHintForMistakes,
    clearSmartHint,
    generateProgressInsightForLesson,
    loadAIUsage,
    checkUsageLimit,
    addToAIChatHistory,
    clearAIChatHistory,
    exportChatHistory,
    toggleFloatingAI,
    closeFloatingAI,
    updateAISettings,
    resetAISettings,
    trackAIEvent,
    getAIAnalytics,
    formatAIResponse,
    truncateMessage,
    isAIServiceAvailable
  }
}