<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-container">
      <div class="error-icon">😕</div>
      <h2>Oops! Something went wrong</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <div class="error-actions">
        <button @click="retry" class="retry-button">
          🔄 Try Again
        </button>
        <button @click="reportIssue" class="report-button">
          📝 Report Issue
        </button>
      </div>
      <details class="error-details" v-if="showDetails">
        <summary>Technical Details</summary>
        <pre class="error-stack">{{ errorStack }}</pre>
      </details>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script>
export default {
  name: 'ErrorBoundary',
  props: {
    showDetails: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      hasError: false,
      errorMessage: '',
      errorStack: '',
      errorInfo: null
    }
  },
  errorCaptured(err, instance, info) {
    console.error('Error captured by ErrorBoundary:', err, info)

    this.hasError = true
    this.errorMessage = err.message || 'An unexpected error occurred'
    this.errorStack = err.stack || ''
    this.errorInfo = {
      componentName: instance?.$options.name || 'Unknown Component',
      info: info,
      timestamp: new Date().toISOString()
    }

    // Emit error event for parent components
    this.$emit('error', {
      error: err,
      errorInfo: this.errorInfo
    })

    // Send error to analytics if available
    if (this.$analytics?.trackError) {
      this.$analytics.trackError({
        error: err.message,
        component: instance?.$options.name,
        info,
        stack: err.stack
      })
    }

    // Prevent error from propagating
    return false
  },
  methods: {
    retry() {
      this.hasError = false
      this.errorMessage = ''
      this.errorStack = ''
      this.errorInfo = null
      this.$emit('retry')
    },
    reportIssue() {
      this.$emit('report', {
        error: this.errorMessage,
        stack: this.errorStack,
        info: this.errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }
  }
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  background: #fef2f2;
}

.error-container {
  max-width: 600px;
  width: 100%;
  text-align: center;
  background: white;
  padding: 3rem 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-container h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.error-message {
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.retry-button,
.report-button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.retry-button {
  background: #3b82f6;
  color: white;
}

.retry-button:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.report-button {
  background: #f3f4f6;
  color: #374151;
}

.report-button:hover {
  background: #e5e7eb;
  transform: translateY(-2px);
}

.error-details {
  margin-top: 2rem;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: #6b7280;
  font-weight: 600;
  padding: 0.5rem;
}

.error-details summary:hover {
  color: #1f2937;
}

.error-stack {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 0.875rem;
  color: #374151;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}
</style>
