<template>
  <div class="completion-screen" @click.self="$emit('return-to-catalogue')">
    <div class="completion-content">
      <div class="completion-header">
        <h3 class="completion-title">🏆 Lesson completed!</h3>
        <div class="medal-section">
          <div class="medal-icon" :class="getMedalClass()">{{ medalIcon }}</div>
          <p class="medal-label">{{ medalLabel }}</p>
        </div>
      </div>
      
      <div class="completion-stats-grid">
        <div class="stat-card time-stat">
          <div class="stat-icon">⏱️</div>
          <div class="stat-value">{{ readableTime }}</div>
          <div class="stat-label">Time</div>
        </div>
        <div class="stat-card stars-stat">
          <div class="stat-icon">⭐</div>
          <div class="stat-value">{{ stars }}</div>
          <div class="stat-label">Stars</div>
        </div>
        <div class="stat-card mistakes-stat">
          <div class="stat-icon">❌</div>
          <div class="stat-value">{{ mistakeCount }}</div>
          <div class="stat-label">Mistakes</div>
        </div>
        <div class="stat-card points-stat">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">{{ earnedPoints }}</div>
          <div class="stat-label">Points</div>
        </div>
      </div>
      
      <!-- Performance metrics -->
      <div class="performance-metrics">
        <div class="metric-item">
          <span class="metric-label">Accuracy:</span>
          <div class="metric-bar">
            <div class="metric-fill" :style="{ width: accuracyPercentage + '%' }"></div>
          </div>
          <span class="metric-value">{{ accuracyPercentage }}%</span>
        </div>
        
        <div class="metric-item">
          <span class="metric-label">Speed:</span>
          <div class="metric-bar">
            <div class="metric-fill speed-fill" :style="{ width: speedPercentage + '%' }"></div>
          </div>
          <span class="metric-value">{{ getSpeedText() }}</span>
        </div>
      </div>
      
      <!-- AI Progress Insight -->
      <div v-if="progressInsight" class="progress-insight">
        <h4>🤖 Progress Analysis</h4>
        <p>{{ progressInsight }}</p>
      </div>
      
      <!-- Achievement badges -->
      <div v-if="achievements.length" class="achievements-section">
        <h4>🏅 Achievements</h4>
        <div class="achievements-grid">
          <div 
            v-for="achievement in achievements" 
            :key="achievement.id"
            class="achievement-badge"
            :title="achievement.description"
          >
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-name">{{ achievement.name }}</div>
          </div>
        </div>
      </div>
      
      <div class="completion-actions">
        <button class="action-btn primary" @click="$emit('return-to-catalogue')">
          📚 To Catalogue
        </button>
        <button class="action-btn secondary" @click="$emit('share')">
          📤 Share
        </button>
        <button class="action-btn secondary" @click="$emit('homework')">
          📝 Homework
        </button>
      </div>
      
      <!-- Lesson recommendations -->
      <div class="recommendations-section">
        <h4>📖 Recommended lessons</h4>
        <p>Continue learning with these lessons:</p>
        <div class="recommendation-tags">
          <span class="recommendation-tag">Lesson 2: Advanced Grammar</span>
          <span class="recommendation-tag">Lesson 3: Conversation Practice</span>
          <span class="recommendation-tag">Lesson 4: Listening</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CompletionScreen',
  props: {
    lesson: {
      type: Object,
      required: true
    },
    readableTime: {
      type: String,
      required: true
    },
    stars: {
      type: Number,
      required: true
    },
    mistakeCount: {
      type: Number,
      required: true
    },
    earnedPoints: {
      type: Number,
      required: true
    },
    medalLabel: {
      type: String,
      required: true
    },
    medalIcon: {
      type: String,
      required: true
    },
    progressInsight: {
      type: String,
      default: ''
    },
    totalSteps: {
      type: Number,
      default: 1
    }
  },
  emits: ['return-to-catalogue', 'share', 'homework'],
  computed: {
    accuracyPercentage() {
      if (this.totalSteps === 0) return 100;
      const correctSteps = this.totalSteps - this.mistakeCount;
      return Math.max(0, Math.round((correctSteps / this.totalSteps) * 100));
    },
    
    speedPercentage() {
      // Calculate speed based on time taken (faster = higher percentage)
      const timeInMinutes = this.parseTimeToMinutes(this.readableTime);
      const expectedTime = this.totalSteps * 2; // 2 minutes per step
      const speedRatio = expectedTime / Math.max(timeInMinutes, 1);
      return Math.min(100, Math.max(0, Math.round(speedRatio * 50))); // Cap at 100%
    },
    
    achievements() {
      const achievements = [];
      
      if (this.mistakeCount === 0) {
        achievements.push({
          id: 'perfect',
          name: 'Perfect',
          icon: '🎯',
          description: 'Completed the lesson without mistakes'
        });
      }
      
      if (this.stars >= this.totalSteps * 0.8) {
        achievements.push({
          id: 'star_collector',
          name: 'Star Collector',
          icon: '⭐',
          description: 'Collected most stars'
        });
      }
      
      const timeInMinutes = this.parseTimeToMinutes(this.readableTime);
      if (timeInMinutes <= this.totalSteps * 1.5) {
        achievements.push({
          id: 'speed_runner',
          name: 'Speed Runner',
          icon: '⚡',
          description: 'Completed the lesson very fast'
        });
      }
      
      if (this.earnedPoints >= 80) {
        achievements.push({
          id: 'high_scorer',
          name: 'High Achiever',
          icon: '📚',
          description: 'Achieved high score'
        });
      }
      
      return achievements;
    }
  },
  methods: {
    getMedalClass() {
      if (this.mistakeCount === 0) return 'gold-medal';
      if (this.mistakeCount <= 2) return 'silver-medal';
      return 'bronze-medal';
    },
    
    parseTimeToMinutes(timeString) {
      const parts = timeString.split(' ');
      let minutes = 0;
      
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].includes('min')) {
          minutes += parseInt(parts[i - 1]) || 0;
        }
        if (parts[i].includes('sec')) {
          minutes += (parseInt(parts[i - 1]) || 0) / 60;
        }
      }
      
      return Math.max(minutes, 0.1); // Minimum 0.1 minutes
    },
    
    getSpeedText() {
      const percentage = this.speedPercentage;
      if (percentage >= 80) return 'Very fast';
      if (percentage >= 60) return 'Fast';
      if (percentage >= 40) return 'Normal';
      if (percentage >= 20) return 'Slow';
      return 'Very slow';
    }
  }
}
</script>

<style scoped>
.completion-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  animation: screenFadeIn 0.5s ease-out;
}

@keyframes screenFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(12px);
  }
}

.completion-content {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 24px;
  padding: 48px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  text-align: center;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: contentSlideUp 0.6s ease-out;
  position: relative;
}

@keyframes contentSlideUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.completion-header {
  margin-bottom: 40px;
  animation: headerBounce 0.8s ease-out 0.2s both;
}

@keyframes headerBounce {
  0% { transform: translateY(-20px); opacity: 0; }
  60% { transform: translateY(5px); opacity: 1; }
  100% { transform: translateY(0); }
}

.completion-title {
  font-size: 2.2rem;
  color: #1e293b;
  margin: 0 0 32px 0;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.medal-section {
  margin-bottom: 24px;
}

.medal-icon {
  font-size: 5rem;
  margin-bottom: 16px;
  animation: medalSpin 1s ease-out 0.5s both;
  display: inline-block;
}

@keyframes medalSpin {
  from { 
    transform: rotateY(0deg) scale(0.5); 
    opacity: 0; 
  }
  to { 
    transform: rotateY(360deg) scale(1); 
    opacity: 1; 
  }
}

.medal-icon.gold-medal {
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
}

.medal-icon.silver-medal {
  color: #9ca3af;
  text-shadow: 0 0 20px rgba(156, 163, 175, 0.5);
}

.medal-icon.bronze-medal {
  color: #d97706;
  text-shadow: 0 0 20px rgba(217, 119, 6, 0.5);
}

.medal-label {
  font-size: 1.3rem;
  font-weight: 600;
  color: #059669;
  margin: 0;
}

.completion-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px 16px;
  border-radius: 16px;
  text-align: center;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: statSlideIn 0.6s ease-out;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transition: transform 0.3s ease;
}

.time-stat::before { background: linear-gradient(90deg, #3b82f6, #1d4ed8); }
.stars-stat::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
.mistakes-stat::before { background: linear-gradient(90deg, #ef4444, #dc2626); }
.points-stat::before { background: linear-gradient(90deg, #10b981, #059669); }

@keyframes statSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.stat-card:hover::before {
  transform: scaleY(2);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 12px;
  opacity: 0.8;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  display: block;
}

.stat-label {
  font-size: 0.9rem;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.performance-metrics {
  background: #f8fafc;
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 32px;
  border: 1px solid #e2e8f0;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-item:last-child {
  margin-bottom: 0;
}

.metric-label {
  min-width: 80px;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.metric-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: inherit;
  transition: width 1s ease-out 0.5s;
}

.speed-fill {
  background: linear-gradient(90deg, #10b981, #059669);
}

.metric-value {
  min-width: 80px;
  text-align: right;
  font-weight: 600;
  color: #1e293b;
  font-size: 0.9rem;
}

.progress-insight {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(29, 78, 216, 0.05) 100%);
  padding: 24px;
  border-radius: 16px;
  margin: 24px 0;
  border: 1px solid rgba(59, 130, 246, 0.2);
  text-align: left;
}

.progress-insight h4 {
  margin: 0 0 12px 0;
  color: #1d4ed8;
  font-size: 1.1rem;
}

.progress-insight p {
  margin: 0;
  color: #374151;
  line-height: 1.6;
}

.achievements-section {
  margin-bottom: 32px;
}

.achievements-section h4 {
  margin: 0 0 20px 0;
  color: #1e293b;
  font-size: 1.2rem;
}

.achievements-grid {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.achievement-badge {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 16px;
  border-radius: 12px;
  border: 2px solid #f59e0b;
  text-align: center;
  min-width: 100px;
  transition: all 0.3s ease;
  animation: achievementPop 0.6s ease-out;
}

@keyframes achievementPop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.achievement-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.3);
}

.achievement-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.achievement-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #92400e;
}

.completion-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.action-btn {
  padding: 16px 28px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 160px;
  min-height: 52px;
  font-size: 1rem;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}

.action-btn.secondary {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.action-btn:hover {
  transform: translateY(-3px);
}

.action-btn.primary:hover {
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4);
}

.action-btn.secondary:hover {
  background: #e2e8f0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.recommendations-section {
  background: #f8fafc;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  text-align: left;
}

.recommendations-section h4 {
  margin: 0 0 12px 0;
  color: #1e293b;
  font-size: 1.1rem;
  text-align: center;
}

.recommendations-section p {
  margin: 0 0 16px 0;
  color: #64748b;
  text-align: center;
}

.recommendation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.recommendation-tag {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #3730a3;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #c7d2fe;
  transition: all 0.2s ease;
  cursor: pointer;
}

.recommendation-tag:hover {
  background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .completion-content {
    padding: 32px 24px;
    margin: 10px;
  }

  .completion-title {
    font-size: 1.8rem;
  }

  .medal-icon {
    font-size: 4rem;
  }

  .completion-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .stat-card {
    padding: 20px 12px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .completion-actions {
    flex-direction: column;
    align-items: center;
  }

  .action-btn {
    width: 100%;
    max-width: 300px;
  }

  .achievements-grid {
    gap: 12px;
  }

  .achievement-badge {
    min-width: 80px;
    padding: 12px;
  }

  .achievement-icon {
    font-size: 1.5rem;
  }

  .performance-metrics {
    padding: 20px;
  }

  .metric-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .metric-label,
  .metric-value {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .completion-content {
    padding: 24px 16px;
    margin: 5px;
  }

  .completion-title {
    font-size: 1.5rem;
  }

  .medal-icon {
    font-size: 3rem;
  }

  .completion-stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .action-btn {
    font-size: 0.9rem;
    padding: 14px 24px;
    min-height: 48px;
  }

  .recommendation-tags {
    flex-direction: column;
    align-items: center;
  }

  .recommendation-tag {
    width: 100%;
    max-width: 280px;
    text-align: center;
  }
}

/* Focus states for accessibility */
.action-btn:focus,
.recommendation-tag:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .completion-content,
  .stat-card,
  .progress-insight,
  .achievements-section,
  .recommendations-section {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .completion-screen,
  .completion-content,
  .completion-header,
  .stat-card,
  .achievement-badge {
    animation: none;
  }

  .stat-card:hover,
  .action-btn:hover,
  .achievement-badge:hover,
  .recommendation-tag:hover {
    transform: none;
  }

  .medal-icon {
    animation: none;
  }

  .metric-fill {
    transition: none;
  }
}

/* Print styles */
@media print {
  .completion-screen {
    position: static;
    background: white;
    padding: 0;
  }

  .completion-content {
    box-shadow: none;
    border: 1px solid #000;
  }

  .completion-actions {
    display: none;
  }
}
</style>