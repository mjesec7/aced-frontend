// src/services/performanceMonitor.js

/**
 * PerformanceMonitor - Track and analyze application performance
 */
export class PerformanceMonitor {
  static metrics = {
    lessonLoadTime: [],
    exerciseRenderTime: [],
    apiResponseTime: [],
    navigationTime: [],
    componentRenderTime: []
  }

  static maxMetricsPerType = 100 // Keep last 100 metrics per type

  /**
   * Start a performance timer
   * @param {string} metricName - Name of the metric to track
   * @returns {Function} Function to call when done to record the metric
   */
  static startTimer(metricName) {
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      if (!this.metrics[metricName]) {
        this.metrics[metricName] = []
      }

      // Add new metric
      this.metrics[metricName].push({
        duration,
        timestamp: Date.now()
      })

      // Keep only the most recent metrics
      if (this.metrics[metricName].length > this.maxMetricsPerType) {
        this.metrics[metricName] = this.metrics[metricName].slice(-this.maxMetricsPerType)
      }

      // Alert if performance is degraded
      if (duration > 3000) {
        console.warn(`Slow ${metricName}: ${duration.toFixed(2)}ms`)
        this.reportSlowPerformance(metricName, duration)
      }

      return duration
    }
  }

  /**
   * Get average metric value
   * @param {string} metricName - Name of the metric
   * @returns {number} Average duration in milliseconds
   */
  static getAverageMetric(metricName) {
    const values = this.metrics[metricName] || []
    if (values.length === 0) return 0

    const sum = values.reduce((acc, val) => acc + val.duration, 0)
    return sum / values.length
  }

  /**
   * Get metric percentile
   * @param {string} metricName - Name of the metric
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  static getPercentile(metricName, percentile = 95) {
    const values = this.metrics[metricName] || []
    if (values.length === 0) return 0

    const sorted = [...values].sort((a, b) => a.duration - b.duration)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)].duration
  }

  /**
   * Get all metrics summary
   * @returns {Object} Summary of all metrics
   */
  static getMetricsSummary() {
    const summary = {}

    for (const [metricName, values] of Object.entries(this.metrics)) {
      if (values.length === 0) {
        summary[metricName] = {
          count: 0,
          average: 0,
          p50: 0,
          p95: 0,
          p99: 0
        }
        continue
      }

      const durations = values.map(v => v.duration).sort((a, b) => a - b)

      summary[metricName] = {
        count: values.length,
        average: this.getAverageMetric(metricName),
        min: Math.min(...durations),
        max: Math.max(...durations),
        p50: durations[Math.floor(durations.length * 0.5)],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)]
      }
    }

    return summary
  }

  /**
   * Report slow performance to analytics
   * @param {string} metricName - Name of the metric
   * @param {number} duration - Duration in milliseconds
   */
  static reportSlowPerformance(metricName, duration) {
    // Only report in production
    if (process.env.NODE_ENV !== 'production') return

    try {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: metricName,
          duration,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          connection: navigator.connection?.effectiveType || 'unknown'
        })
      }).catch(err => console.error('Failed to report performance:', err))
    } catch (error) {
      console.error('Error reporting performance:', error)
    }
  }

  /**
   * Clear all metrics
   */
  static clearMetrics() {
    for (const key in this.metrics) {
      this.metrics[key] = []
    }
  }

  /**
   * Track a specific metric value
   * @param {string} metricName - Name of the metric
   * @param {number} value - Value to track
   */
  static trackMetric(metricName, value) {
    if (!this.metrics[metricName]) {
      this.metrics[metricName] = []
    }

    this.metrics[metricName].push({
      duration: value,
      timestamp: Date.now()
    })

    // Keep only recent metrics
    if (this.metrics[metricName].length > this.maxMetricsPerType) {
      this.metrics[metricName] = this.metrics[metricName].slice(-this.maxMetricsPerType)
    }
  }

  /**
   * Log metrics summary to console
   */
  static logSummary() {
    // Metrics summary available via getMetricsSummary()
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor
}

export default PerformanceMonitor
