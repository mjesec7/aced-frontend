// src/services/logger.js

/**
 * Logger - Centralized logging service with categorization and remote reporting
 */
export class Logger {
  static logs = []
  static maxLogs = 100

  static levels = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  }

  static currentLevel = process.env.NODE_ENV === 'production'
    ? this.levels.WARN
    : this.levels.DEBUG

  /**
   * Log a message with specific level
   * @param {string} level - Log level (debug, info, warn, error)
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  static log(level, message, data = {}) {
    const levelValue = this.levels[level.toUpperCase()] || this.levels.INFO

    // Skip if below current log level
    if (levelValue < this.currentLevel) {
      return
    }

    const entry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    this.logs.push(entry)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Log to console based on level
    const consoleMethod = {
      DEBUG: 'log',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error'
    }[level.toUpperCase()] || 'log'

    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data)

    // Send errors to server
    if (level.toUpperCase() === 'ERROR') {
      this.sendToServer(entry)
    }
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  static debug(message, data = {}) {
    this.log('DEBUG', message, data)
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  static info(message, data = {}) {
    this.log('INFO', message, data)
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  static warn(message, data = {}) {
    this.log('WARN', message, data)
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  static error(message, data = {}) {
    this.log('ERROR', message, data)
  }

  /**
   * Send log entry to server
   * @param {Object} entry - Log entry to send
   */
  static async sendToServer(entry) {
    if (process.env.NODE_ENV !== 'production') {
      return // Don't send logs in development
    }

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      })
    } catch (err) {
      console.error('Failed to send log to server:', err)
    }
  }

  /**
   * Download logs as JSON file
   */
  static downloadLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Clear all logs
   */
  static clearLogs() {
    this.logs = []
  }

  /**
   * Get logs filtered by level
   * @param {string} level - Log level to filter
   * @returns {Array} Filtered logs
   */
  static getLogsByLevel(level) {
    return this.logs.filter(log => log.level.toUpperCase() === level.toUpperCase())
  }

  /**
   * Get logs from last N minutes
   * @param {number} minutes - Number of minutes
   * @returns {Array} Recent logs
   */
  static getRecentLogs(minutes = 10) {
    const cutoff = Date.now() - (minutes * 60 * 1000)
    return this.logs.filter(log => new Date(log.timestamp).getTime() > cutoff)
  }

  /**
   * Set log level
   * @param {string} level - Log level (debug, info, warn, error)
   */
  static setLevel(level) {
    const levelValue = this.levels[level.toUpperCase()]
    if (levelValue !== undefined) {
      this.currentLevel = levelValue
    }
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.Logger = Logger
}

export default Logger
