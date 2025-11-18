// src/composables/useAuth.js
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { auth } from '@/firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth'
import { useRouter } from 'vue-router'

// Global auth state
const currentUser = ref(null)
const isLoading = ref(true)
const isAuthenticated = ref(false)
const userProfile = ref(null)
const authError = ref(null)

// Auth state listeners
const authStateListeners = []

/**
 * Enhanced Firebase Authentication Composable
 * Provides reactive authentication state and methods
 */
export function useAuth() {
  const router = useRouter()

  // Computed properties
  const user = computed(() => currentUser.value)
  const loading = computed(() => isLoading.value)
  const authenticated = computed(() => isAuthenticated.value)
  const profile = computed(() => userProfile.value)
  const error = computed(() => authError.value)

  /**
   * Initialize authentication state listener
   */
  const initializeAuth = () => {    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {      
      isLoading.value = true
      authError.value = null

      try {
        if (user) {
          // User is signed in
          currentUser.value = user
          isAuthenticated.value = true
          
          // Build user profile
          userProfile.value = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            phoneNumber: user.phoneNumber,
            createdAt: user.metadata.creationTime,
            lastLoginAt: user.metadata.lastSignInTime
          }

          // Save user to backend
          try {
            const token = await user.getIdToken()
            
            // Import API function dynamically to avoid circular dependencies
            const { saveUser } = await import('@/api')
            
            await saveUser({
              token,
              name: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email,
              subscriptionPlan: 'free'
            })          } catch (saveError) {            // Don't block auth flow if backend save fails
          }        } else {
          // User is signed out
          currentUser.value = null
          isAuthenticated.value = false
          userProfile.value = null        }
      } catch (error) {        authError.value = error.message
      } finally {
        isLoading.value = false
      }

      // Notify listeners
      authStateListeners.forEach(listener => {
        try {
          listener(user)
        } catch (listenerError) {        }
      })
    })

    return unsubscribe
  }

  /**
   * Sign in with email and password
   */
  const signIn = async (email, password) => {    
    try {
      isLoading.value = true
      authError.value = null
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      return { success: true, user }

    } catch (error) {
      authError.value = getReadableAuthError(error)
      return { success: false, error: authError.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Sign up with email and password
   */
  const signUp = async (email, password, displayName = '') => {    
    try {
      isLoading.value = true
      authError.value = null
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Update display name if provided
      if (displayName.trim()) {
        await updateProfile(user, { displayName: displayName.trim() })      }

      // Send email verification
      try {
        await sendEmailVerification(user)      } catch (verificationError) {      }      return { success: true, user }
      
    } catch (error) {      authError.value = getReadableAuthError(error)
      return { success: false, error: authError.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async () => {    
    try {
      isLoading.value = true
      authError.value = null
      
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      // Use popup or redirect based on environment
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      let result
      if (isMobile) {
        // Use redirect for mobile
        await signInWithRedirect(auth, provider)
        // Result will be handled by getRedirectResult in initializeAuth
        return { success: true, pending: true }
      } else {
        // Use popup for desktop
        result = await signInWithPopup(auth, provider)
      }

      const user = result.user
      return { success: true, user }

    } catch (error) {
      authError.value = getReadableAuthError(error)
      return { success: false, error: authError.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Handle redirect result (for mobile Google sign-in)
   */
  const handleRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth)
      if (result) {        return { success: true, user: result.user }
      }
      return { success: true, user: null }
    } catch (error) {      authError.value = getReadableAuthError(error)
      return { success: false, error: authError.value }
    }
  }

  /**
   * Sign out current user
   */
  const signOutUser = async () => {    
    try {
      isLoading.value = true
      authError.value = null
      
      await signOut(auth)
      
      // Clear local state
      currentUser.value = null
      isAuthenticated.value = false
      userProfile.value = null      
      // Redirect to login page
      router.push('/auth/login')
      
      return { success: true }
      
    } catch (error) {      authError.value = getReadableAuthError(error)
      return { success: false, error: authError.value }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Send password reset email
   */
  const resetPassword = async (email) => {    
    try {
      authError.value = null

      await sendPasswordResetEmail(auth, email)
      return { success: true }

    } catch (error) {
      authError.value = getReadableAuthError(error)
      return { success: false, error: authError.value }
    }
  }

  /**
   * Update user profile
   */
  const updateUserProfile = async (updates) => {    
    try {
      if (!currentUser.value) {
        throw new Error('No authenticated user')
      }
      
      authError.value = null
      
      await updateProfile(currentUser.value, updates)
      
      // Update local profile
      if (userProfile.value) {
        userProfile.value = {
          ...userProfile.value,
          ...updates
        }
      }      return { success: true }
      
    } catch (error) {      authError.value = getReadableAuthError(error)
      return { success: false, error: authError.value }
    }
  }

  /**
   * Refresh current user token
   */
  const refreshToken = async () => {
    try {
      if (!currentUser.value) {
        throw new Error('No authenticated user')
      }

      const token = await currentUser.value.getIdToken(true)
      return { success: true, token }

    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get current user token
   */
  const getToken = async () => {
    try {
      if (!currentUser.value) {
        return null
      }
      
      return await currentUser.value.getIdToken()
    } catch (error) {      return null
    }
  }

  /**
   * Check if user has specific permissions
   */
  const hasPermission = (permission) => {
    if (!userProfile.value) return false
    
    // Add your permission logic here
    // For now, just check if user is authenticated
    return isAuthenticated.value
  }

  /**
   * Add auth state change listener
   */
  const onAuthStateChange = (callback) => {
    authStateListeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = authStateListeners.indexOf(callback)
      if (index > -1) {
        authStateListeners.splice(index, 1)
      }
    }
  }

  /**
   * Clear auth error
   */
  const clearError = () => {
    authError.value = null
  }

  /**
   * Convert Firebase auth error to readable message
   */
  const getReadableAuthError = (error) => {
    const errorMessages = {
      'auth/user-not-found': 'User with this email not found',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'User with this email already exists',
      'auth/weak-password': 'Password must contain at least 6 characters',
      'auth/invalid-email': 'Invalid email format',
      'auth/user-disabled': 'Account disabled',
      'auth/too-many-requests': 'Too many login attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Check your internet connection',
      'auth/popup-closed-by-user': 'Authorization window was closed',
      'auth/popup-blocked': 'Browser blocked the popup window',
      'auth/invalid-credential': 'Invalid credentials',
      'auth/expired-action-code': 'Link expired',
      'auth/invalid-action-code': 'Invalid link'
    }
    
    return errorMessages[error.code] || error.message || 'An authorization error occurred'
  }

  // Auto-initialize auth state listener
  let unsubscribeAuth = null
  
  onMounted(async () => {
    unsubscribeAuth = initializeAuth()
    
    // Handle redirect result on page load (for mobile Google sign-in)
    await handleRedirectResult()
  })
  
  onUnmounted(() => {
    if (unsubscribeAuth) {
      unsubscribeAuth()
    }
  })

  // Return auth interface
  return {
    // State
    currentUser: user,
    isLoading: loading,
    isAuthenticated: authenticated,
    userProfile: profile,
    authError: error,
    
    // Methods
    signIn,
    signUp,
    signInWithGoogle,
    signOut: signOutUser,
    resetPassword,
    updateUserProfile,
    refreshToken,
    getToken,
    hasPermission,
    onAuthStateChange,
    clearError,
    
    // Utilities
    initializeAuth,
    handleRedirectResult
  }
}

// Export for use in other composables/components
export {
  currentUser,
  isLoading,
  isAuthenticated,
  userProfile,
  authError
}