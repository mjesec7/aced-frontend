// src/composables/usePaymentValidation.js
import { ref, computed } from 'vue'
import { auth } from '@/firebase'
import { getUserStatus } from '@/api'

export function usePaymentValidation() {
  // ✅ Payment state
  const showPaywallModal = ref(false)
  const userStatus = ref('free')
  const isCheckingStatus = ref(false)
  const statusError = ref(null)
  
  // ✅ Computed properties
  const isPremiumUser = computed(() => {
    const status = userStatus.value
    const premiumStatuses = ['premium', 'start', 'pro']
    return premiumStatuses.includes(status) || 
           premiumStatuses.includes(localStorage.getItem('subscriptionPlan'))
  })
  
  const canAccessLesson = computed(() => {
    return (lessonType) => {
      if (!lessonType || lessonType === 'free') return true
      return lessonType !== 'premium' || isPremiumUser.value
    }
  })
  
  // ✅ Status checking methods
  const checkUserStatus = async () => {
    try {
      isCheckingStatus.value = true
      statusError.value = null
      
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User not authenticated')
      }
      
      const userId = currentUser.uid || localStorage.getItem('firebaseUserId')
      if (!userId) {
        throw new Error('No user ID available')
      }
      
      // Try to get status from store first
      const storeStatus = getStatusFromStore()
      if (storeStatus && storeStatus !== 'unknown') {
        userStatus.value = storeStatus
        console.log('✅ Using cached user status:', storeStatus)
        return storeStatus
      }
      
      // Fetch from API
      const statusResult = await getUserStatus(userId)
      if (statusResult.success) {
        const newStatus = statusResult.status || statusResult.data?.subscriptionPlan || 'free'
        userStatus.value = newStatus
        
        // Cache in localStorage
        localStorage.setItem('subscriptionPlan', newStatus)
        localStorage.setItem('statusLastChecked', Date.now().toString())
        
        console.log('✅ Updated user status:', newStatus)
        return newStatus
      } else {
        throw new Error(statusResult.error || 'Failed to get user status')
      }
      
    } catch (error) {
      console.error('❌ Error checking user status:', error)
      statusError.value = error.message
      
      // Fallback to cached status
      const cachedStatus = localStorage.getItem('subscriptionPlan') || 'free'
      userStatus.value = cachedStatus
      
      return cachedStatus
    } finally {
      isCheckingStatus.value = false
    }
  }
  
  const getStatusFromStore = () => {
    // Try multiple sources for status
    const sources = [
      () => localStorage.getItem('subscriptionPlan'),
      () => sessionStorage.getItem('userStatus'),
      () => {
        try {
          const vuexStore = window.__VUE_STORE__
          return vuexStore?.state?.user?.subscriptionPlan
        } catch {
          return null
        }
      }
    ]
    
    for (const getStatus of sources) {
      try {
        const status = getStatus()
        if (status && status !== 'null' && status !== 'undefined') {
          return status
        }
      } catch (error) {
        continue
      }
    }
    
    return null
  }
  
  // ✅ Access validation methods
  const validateLessonAccess = async (lesson) => {
    try {
      if (!lesson) {
        throw new Error('Lesson data not provided')
      }
      
      const lessonType = lesson.type || 'free'
      console.log('🔍 Validating access for lesson type:', lessonType)
      
      // Free lessons are always accessible
      if (lessonType === 'free') {
        console.log('✅ Free lesson - access granted')
        return { hasAccess: true, reason: 'free_lesson' }
      }
      
      // Check user authentication
      const currentUser = auth.currentUser
      if (!currentUser) {
        console.log('❌ User not authenticated')
        return { hasAccess: false, reason: 'not_authenticated' }
      }
      
      // Check premium status
      await checkUserStatus()
      
      if (lessonType === 'premium' && !isPremiumUser.value) {
        console.log('❌ Premium lesson requires subscription')
        return { hasAccess: false, reason: 'premium_required' }
      }
      
      console.log('✅ Access granted')
      return { hasAccess: true, reason: 'premium_user' }
      
    } catch (error) {
      console.error('❌ Access validation error:', error)
      return { hasAccess: false, reason: 'validation_error', error: error.message }
    }
  }
  
  const handleAccessDenied = (reason, lessonType = 'premium') => {
    console.log('🚫 Access denied:', reason)
    
    switch (reason) {
      case 'not_authenticated':
        // Redirect to login
        return { action: 'redirect', path: '/login' }
        
      case 'premium_required':
        // Show paywall modal
        showPaywallModal.value = true
        return { action: 'paywall' }
        
      case 'validation_error':
        // Show error message
        return { action: 'error', message: 'Ошибка проверки доступа' }
        
      default:
        // Show generic paywall
        showPaywallModal.value = true
        return { action: 'paywall' }
    }
  }
  
  // ✅ Subscription helpers
  const getSubscriptionInfo = () => {
    return {
      plan: userStatus.value,
      isPremium: isPremiumUser.value,
      features: getFeaturesByPlan(userStatus.value),
      upgradeOptions: getUpgradeOptions(userStatus.value)
    }
  }
  
  const getFeaturesByPlan = (plan) => {
    const features = {
      free: [
        'Доступ к бесплатным урокам',
        'Базовая статистика прогресса',
        'Сохранение прогресса'
      ],
      start: [
        'Все функции Free',
        'Доступ к премиум урокам',
        'Детальная аналитика',
        'Домашние задания',
        'AI помощник (ограниченно)'
      ],
      pro: [
        'Все функции Start',
        'Неограниченный AI помощник',
        'Персонализированные рекомендации',
        'Приоритетная поддержка',
        'Расширенная статистика'
      ]
    }
    
    return features[plan] || features.free
  }
  
  const getUpgradeOptions = (currentPlan) => {
    if (currentPlan === 'free') {
      return [
        { plan: 'start', price: '260,000 сум', popular: true },
        { plan: 'pro', price: '455,000 сум', premium: true }
      ]
    } else if (currentPlan === 'start') {
      return [
        { plan: 'pro', price: '195,000 сум', upgrade: true }
      ]
    }
    
    return []
  }
  
  // ✅ Cache management
  const clearStatusCache = () => {
    localStorage.removeItem('subscriptionPlan')
    localStorage.removeItem('statusLastChecked')
    sessionStorage.removeItem('userStatus')
    userStatus.value = 'free'
    console.log('🗑️ Status cache cleared')
  }
  
  const isStatusCacheValid = () => {
    const lastChecked = localStorage.getItem('statusLastChecked')
    if (!lastChecked) return false
    
    const cacheAge = Date.now() - parseInt(lastChecked)
    const maxCacheAge = 15 * 60 * 1000 // 15 minutes
    
    return cacheAge < maxCacheAge
  }
  
  const refreshStatus = async () => {
    clearStatusCache()
    return await checkUserStatus()
  }
  
  // ✅ Paywall modal controls
  const closePaywallModal = () => {
    showPaywallModal.value = false
  }
  
  const goToUpgrade = (plan = 'start') => {
    showPaywallModal.value = false
    // Navigate to payment page
    return { action: 'navigate', path: `/pay/${plan}` }
  }
  
  // ✅ Development helpers
  const simulatePremiumAccess = () => {
    if (process.env.NODE_ENV === 'development') {
      userStatus.value = 'pro'
      localStorage.setItem('subscriptionPlan', 'pro')
      console.log('🧪 Simulated premium access for development')
    }
  }
  
  const simulateFreeAccess = () => {
    if (process.env.NODE_ENV === 'development') {
      userStatus.value = 'free'
      localStorage.setItem('subscriptionPlan', 'free')
      console.log('🧪 Simulated free access for development')
    }
  }
  
  return {
    // State
    showPaywallModal,
    userStatus,
    isCheckingStatus,
    statusError,
    
    // Computed
    isPremiumUser,
    canAccessLesson,
    
    // Methods
    checkUserStatus,
    validateLessonAccess,
    handleAccessDenied,
    getSubscriptionInfo,
    getFeaturesByPlan,
    getUpgradeOptions,
    clearStatusCache,
    isStatusCacheValid,
    refreshStatus,
    closePaywallModal,
    goToUpgrade,
    
    // Development helpers
    simulatePremiumAccess,
    simulateFreeAccess
  }
}