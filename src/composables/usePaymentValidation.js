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

        return newStatus
      } else {
        throw new Error(statusResult.error || 'Failed to get user status')
      }

    } catch (error) {
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

      // Free lessons are always accessible
      if (lessonType === 'free') {
        return { hasAccess: true, reason: 'free_lesson' }
      }

      // Check user authentication
      const currentUser = auth.currentUser
      if (!currentUser) {
        return { hasAccess: false, reason: 'not_authenticated' }
      }

      // Check premium status
      await checkUserStatus()

      if (lessonType === 'premium' && !isPremiumUser.value) {
        return { hasAccess: false, reason: 'premium_required' }
      }

      return { hasAccess: true, reason: 'premium_user' }

    } catch (error) {
      return { hasAccess: false, reason: 'validation_error', error: error.message }
    }
  }
  
  const handleAccessDenied = (reason, lessonType = 'premium') => {
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
        return { action: 'error', message: 'Access validation error' }
        
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
        'Access to free lessons',
        'Basic progress statistics',
        'Progress saving'
      ],
      start: [
        'All Free features',
        'Access to premium lessons',
        'Detailed analytics',
        'Homework assignments',
        'AI assistant (limited)'
      ],
      pro: [
        'All Start features',
        'Unlimited AI assistant',
        'Personalized recommendations',
        'Priority support',
        'Extended statistics'
      ]
    }
    
    return features[plan] || features.free
  }
  
  const getUpgradeOptions = (currentPlan) => {
    if (currentPlan === 'free') {
      return [
        { plan: 'start', price: '260,000 sum', popular: true },
        { plan: 'pro', price: '455,000 sum', premium: true }
      ]
    } else if (currentPlan === 'start') {
      return [
        { plan: 'pro', price: '195,000 sum', upgrade: true }
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
    }
  }

  const simulateFreeAccess = () => {
    if (process.env.NODE_ENV === 'development') {
      userStatus.value = 'free'
      localStorage.setItem('subscriptionPlan', 'free')
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