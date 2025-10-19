/* ========================================
   TOPIC OVERVIEW - CLEAN REDESIGN
   ======================================== */

.topic-overview {
  min-height: 100vh;
  background: #fafafa;
}

/* ========================================
   LOADING & ERROR STATES
   ======================================== */

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #f3f4f6;
  border-left-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.error-message {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  text-align: center;
  max-width: 500px;
}

.debug-info {
  margin-top: 2rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  text-align: left;
  max-width: 600px;
  width: 100%;
}

.debug-info h4 {
  font-size: 0.8125rem;
  color: #dc2626;
  margin: 0 0 0.5rem 0;
}

.debug-info pre {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  overflow-x: auto;
  color: #374151;
}

/* ========================================
   NAVIGATION
   ======================================== */

.nav-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #111827;
}

.back-button svg {
  flex-shrink: 0;
}

/* ========================================
   TOPIC CONTENT
   ======================================== */

.topic-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 3rem;
}

/* ========================================
   TOPIC HEADER
   ======================================== */

.topic-header {
  padding: 2rem 0;
}

.topic-hero {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

.topic-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.topic-info {
  flex: 1;
}

.topic-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.topic-description {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

/* ========================================
   TOPIC STATS
   ======================================== */

.topic-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.25rem;
  text-align: center;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 800;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.375rem;
}

.stat-label {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

/* ========================================
   LESSONS SECTION
   ======================================== */

.lessons-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.section-icon {
  font-size: 1.125rem;
}

/* ========================================
   LESSON FILTERS
   ======================================== */

.lesson-filters {
  display: flex;
  gap: 0.5rem;
  background: #f9fafb;
  padding: 0.375rem;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 0.875rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.8125rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn.active {
  background: white;
  color: #6366f1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-btn:hover:not(.active) {
  color: #111827;
  background: rgba(255, 255, 255, 0.5);
}

/* ========================================
   NO LESSONS STATE
   ======================================== */

.no-lessons {
  text-align: center;
  padding: 3rem 2rem;
  color: #6b7280;
}

.no-lessons-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-lessons-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.no-lessons-text {
  font-size: 0.875rem;
  margin: 0;
}

/* ========================================
   LESSONS GRID
   ======================================== */

.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

/* ========================================
   LESSON CARD
   ======================================== */

.lesson-card {
  position: relative;
  background: #fafafa;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lesson-card:hover {
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.lesson-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
}

.lesson-card.locked:hover {
  transform: none;
  border-color: #e5e7eb;
  box-shadow: none;
}

.lesson-card.premium {
  border-color: #fbbf24;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
}

.lesson-card.completed {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
}

.lesson-card.in-progress {
  border-color: #6366f1;
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
}

.lesson-number {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8125rem;
  z-index: 2;
}

.lesson-card.premium .lesson-number {
  background: #f59e0b;
}

.lesson-card.completed .lesson-number {
  background: #10b981;
}

/* ========================================
   PROGRESS INDICATOR
   ======================================== */

.lesson-progress-indicator {
  position: absolute;
  top: 0.75rem;
  left: 1rem;
  z-index: 3;
}

.progress-circle {
  position: relative;
  width: 36px;
  height: 36px;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-circle {
  transition: stroke-dashoffset 0.5s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.6875rem;
  font-weight: 700;
  color: #6366f1;
}

.progress-circle.completed .progress-text {
  color: #10b981;
  font-size: 0.875rem;
}

/* ========================================
   LESSON BADGE
   ======================================== */

.lesson-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  width: fit-content;
}

.lesson-badge.free {
  background: #dcfce7;
  color: #065f46;
}

.lesson-badge.premium {
  background: #fef3c7;
  color: #92400e;
}

.lesson-badge svg {
  width: 12px;
  height: 12px;
}

/* ========================================
   LESSON CONTENT
   ======================================== */

.lesson-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lesson-title {
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.3;
  padding-right: 2.5rem;
}

.lesson-description {
  color: #6b7280;
  font-size: 0.8125rem;
  line-height: 1.5;
  margin: 0;
}

/* ========================================
   LESSON PROGRESS BAR
   ======================================== */

.lesson-progress {
  padding: 0.75rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}

.progress-percentage {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6366f1;
}

.progress-bar {
  width: 100%;
  height: 5px;
  background: #f3f4f6;
  border-radius: 100px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #6366f1;
  transition: width 0.5s ease;
  border-radius: 100px;
}

.progress-fill.completed {
  background: #10b981;
}

.progress-fill.in-progress {
  background: linear-gradient(90deg, #6366f1, #818cf8);
}

/* ========================================
   LESSON STARS
   ======================================== */

.lesson-stars {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
  justify-content: center;
}

.star {
  font-size: 0.75rem;
  opacity: 0.3;
}

.star.filled {
  opacity: 1;
}

/* ========================================
   LESSON META
   ======================================== */

.lesson-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.875rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
}

.meta-item.time-spent {
  color: #059669;
}

.meta-item svg {
  flex-shrink: 0;
}

/* ========================================
   LESSON ACTION BUTTON
   ======================================== */

.lesson-action {
  margin-top: auto;
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.2s;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
}

.action-btn:hover:not(:disabled) {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.action-btn.premium {
  background: #f59e0b;
}

.action-btn.premium:hover {
  background: #d97706;
}

.action-btn.completed {
  background: #10b981;
}

.action-btn.completed:hover {
  background: #059669;
}

.action-btn.continue {
  background: #6366f1;
}

.action-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.action-btn.locked {
  background: #9ca3af;
  cursor: not-allowed;
}

/* ========================================
   LOCK OVERLAY
   ======================================== */

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  pointer-events: none;
}

.lock-icon {
  color: #6b7280;
  opacity: 0.6;
}

/* ========================================
   ACTION SECTION
   ======================================== */

.action-section {
  background: white;
  padding: 2rem 1.5rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.action-content {
  max-width: 600px;
  margin: 0 auto;
}

.action-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.action-description {
  font-size: 0.9375rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* ========================================
   BUTTONS
   ======================================== */

.btn {
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-premium {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.btn-premium:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-back {
  background: #f3f4f6;
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
}

.btn-back:hover {
  background: #e5e7eb;
}

/* ========================================
   RESPONSIVE
   ======================================== */

@media (max-width: 768px) {
  .nav-header {
    padding: 1rem 1.5rem;
  }

  .topic-content {
    padding: 0 1.5rem 2rem;
  }

  .topic-hero {
    flex-direction: column;
    gap: 1rem;
  }

  .topic-icon {
    font-size: 2rem;
  }

  .topic-title {
    font-size: 1.5rem;
  }

  .topic-description {
    font-size: 0.875rem;
  }

  .topic-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .lesson-filters {
    justify-content: center;
  }

  .lessons-grid {
    grid-template-columns: 1fr;
  }

  .lessons-section {
    padding: 1.25rem;
  }

  .action-section {
    padding: 1.5rem 1.25rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .topic-header {
    padding: 1.5rem 0;
  }

  .topic-title {
    font-size: 1.25rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .lesson-card {
    padding: 1rem;
  }

  .lesson-title {
    font-size: 0.9375rem;
  }

  .lesson-number {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.75rem;
  }

  .filter-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }

  .progress-circle {
    width: 32px;
    height: 32px;
  }

  .section-title {
    font-size: 1rem;
  }
}

/* ========================================
   ACCESSIBILITY
   ======================================== */

.back-button:focus,
.action-btn:focus,
.btn:focus,
.filter-btn:focus,
.lesson-card:focus {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>