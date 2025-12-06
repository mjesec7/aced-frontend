// src/services/dataNormalizer.js

/**
 * DataNormalizer - Ensures consistent data structures across the application
 * Handles the various data structures that can come from the backend
 */
export class DataNormalizer {
  /**
   * Normalize a lesson step to ensure consistent data location
   * @param {Object} step - The step to normalize
   * @returns {Object} Normalized step
   */
  static normalizeStep(step) {
    if (!step) return null

    const normalized = { ...step }

    // Ensure consistent data location based on step type
    switch (step.type) {
      case 'exercise':
      case 'practice':
        normalized.data = this.extractExercises(step)
        break
      case 'vocabulary':
        normalized.data = this.extractVocabulary(step)
        break
      case 'quiz':
        normalized.data = this.extractQuizzes(step)
        break
      case 'game':
        normalized.data = this.extractGameData(step)
        break
      case 'explanation':
      case 'reading':
      case 'example':
        normalized.data = this.extractContent(step)
        break
      default:
        // Keep data as is for unknown types
        break
    }

    return normalized
  }

  /**
   * Extract exercises from various possible locations
   * @param {Object} step - The step containing exercises
   * @returns {Array} Normalized exercises array
   */
  static extractExercises(step) {
    const locations = [
      step.data,
      step.data?.exercises,
      step.content?.exercises,
      step.exercises
    ]

    for (const location of locations) {
      if (Array.isArray(location) && location.length > 0) {
        return location
      }
    }

    // Check for single exercise as object
    if (step.data?.question || step.content?.question || step.question) {
      const exercise = step.data || step.content || step
      return [exercise]
    }

    return []
  }

  /**
   * Extract vocabulary terms from various possible locations
   * @param {Object} step - The step containing vocabulary
   * @returns {Array} Normalized vocabulary array
   */
  static extractVocabulary(step) {
    const locations = [
      step.data?.terms,
      step.data,
      step.vocabulary,
      step.content?.vocabulary,
      step.content?.terms
    ]

    for (const location of locations) {
      if (Array.isArray(location)) {
        // Filter to ensure we have valid vocabulary items
        const valid = location.filter(item =>
          item && (item.term || item.word) && (item.definition || item.meaning)
        )
        if (valid.length > 0) {
          // Normalize vocabulary item structure
          return valid.map(item => ({
            term: item.term || item.word,
            definition: item.definition || item.meaning,
            example: item.example || null,
            learned: item.learned || false,
            id: item.id || item._id || null
          }))
        }
      }
    }

    return []
  }

  /**
   * Extract quizzes from various possible locations
   * @param {Object} step - The step containing quizzes
   * @returns {Array} Normalized quizzes array
   */
  static extractQuizzes(step) {
    const locations = [
      step.data,
      step.data?.questions,
      step.quizzes,
      step.content?.quizzes,
      step.content?.questions
    ]

    for (const location of locations) {
      if (Array.isArray(location) && location.length > 0) {
        return location
      }
    }

    // Check for single quiz as object
    if (step.data?.question || step.content?.question) {
      const quiz = step.data || step.content
      return [quiz]
    }

    return []
  }

  /**
   * Extract game data from various possible locations
   * @param {Object} step - The step containing game data
   * @returns {Object} Normalized game data
   */
  static extractGameData(step) {
    return {
      gameType: step.gameType || step.type || 'unknown',
      gameConfig: step.gameConfig || step.data || {},
      instructions: step.instructions || step.description || 'Complete the game!',
      title: step.title || 'Game',
      targetScore: step.targetScore || step.data?.targetScore || 100,
      timeLimit: step.timeLimit || step.data?.timeLimit || 60
    }
  }

  /**
   * Extract content from various possible locations
   * @param {Object} step - The step containing content
   * @returns {Object} Normalized content
   */
  static extractContent(step) {
    let content = null

    // Try multiple content locations
    const locations = [
      step.data?.content,
      step.data?.text,
      step.content?.text,
      step.content?.content,
      step.content,
      step.data,
      step.description,
      step.text
    ]

    for (const location of locations) {
      if (typeof location === 'string' && location.length > 0) {
        content = location
        break
      }
    }

    return {
      content: content || 'No content available',
      title: step.title || step.name || null
    }
  }

  /**
   * Normalize an entire lesson
   * @param {Object} lesson - The lesson to normalize
   * @returns {Object} Normalized lesson
   */
  static normalizeLesson(lesson) {
    if (!lesson) return null

    return {
      ...lesson,
      steps: (lesson.steps || []).map(step => this.normalizeStep(step))
    }
  }

  /**
   * Validate step data structure
   * @param {Object} step - The step to validate
   * @returns {Object} Validation result with status and messages
   */
  static validateStep(step) {
    const errors = []
    const warnings = []

    if (!step) {
      errors.push('Step is null or undefined')
      return { valid: false, errors, warnings }
    }

    if (!step.type) {
      errors.push('Step type is missing')
    }

    // Type-specific validation
    switch (step.type) {
      case 'exercise':
      case 'practice':
        const exercises = this.extractExercises(step)
        if (exercises.length === 0) {
          warnings.push('No exercises found in exercise step')
        }
        break

      case 'vocabulary':
        const vocab = this.extractVocabulary(step)
        if (vocab.length === 0) {
          warnings.push('No vocabulary terms found in vocabulary step')
        }
        break

      case 'quiz':
        const quizzes = this.extractQuizzes(step)
        if (quizzes.length === 0) {
          warnings.push('No quizzes found in quiz step')
        }
        break

      case 'game':
        if (!step.gameType && step.type !== 'game') {
          warnings.push('Game step missing gameType property')
        }
        break

      case 'explanation':
      case 'reading':
      case 'example':
        const content = this.extractContent(step)
        if (!content.content || content.content === 'No content available') {
          warnings.push('No content found in content step')
        }
        break
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

export default DataNormalizer
