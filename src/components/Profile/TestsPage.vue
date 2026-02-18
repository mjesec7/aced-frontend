<template>
  <div class="tests-page-wrapper">
    <!-- Left: Dashboard -->
    <main :class="['tests-dashboard', mobileView === 'game' && 'hide-mobile']">
      <!-- Mobile Header -->
      <div class="mobile-header lg-hide">
        <div class="mobile-brand">
          <div class="brand-icon">A</div>
          <span class="brand-text">Aced</span>
        </div>
      </div>

      <div class="dashboard-scroll">
        <div class="dashboard-inner">
          <!-- Page Header -->
          <div class="page-header">
            <div class="page-header-left">
              <div class="title-row">
                <h1 class="page-title">{{ t.myTests }}</h1>
                <div class="lang-picker">
                  <button v-for="lang in ['en','uz','ru']" :key="lang" @click="currentLanguage = lang"
                    :class="['lang-btn', currentLanguage === lang && 'active']">{{ lang.toUpperCase() }}</button>
                </div>
              </div>
              <p class="page-subtitle">{{ t.manageExams }}</p>
            </div>
            <div class="header-actions">
              <button @click="mobileView = 'game'" class="ai-tutor-btn lg-hide">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                <span>{{ t.aiTutor }}</span>
              </button>
              <button @click="isModalOpen = true" class="new-exam-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M12 5v14M5 12h14"/></svg>
                <span>{{ t.newExam }}</span>
              </button>
            </div>
          </div>

          <!-- Stats Overview -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-header indigo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="stat-icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span class="stat-label">{{ t.nextUp }}</span>
              </div>
              <p class="stat-value-lg">{{ activePathways.length > 0 ? activePathways[0].examTitle : t.introPhysics }}</p>
              <p class="stat-sub">{{ activePathways.length > 0 ? `${t.target}: ${activePathways[0].targetDate}` : 'Nov 02 • 10:00' }}</p>
            </div>
            <div class="stat-card">
              <div class="stat-header emerald">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="stat-icon"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                <span class="stat-label">{{ t.averageScore }}</span>
              </div>
              <p class="stat-value-big">88%</p>
              <p class="stat-sub emerald-text">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mini-icon"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                +2.4% {{ t.vsLastMonth }}
              </p>
            </div>
            <div class="stat-card">
              <div class="stat-header amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="stat-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span class="stat-label">{{ t.completed }}</span>
              </div>
              <p class="stat-value-big">12</p>
              <p class="stat-sub muted">{{ t.testsTaken }}</p>
            </div>
          </div>

          <!-- Active Study Pathways -->
          <div v-if="activePathways.length > 0" class="pathways-section">
            <h3 class="section-title"><span class="section-icon">🗺️</span> {{ t.activePathways }}</h3>
            <div v-for="pathway in activePathways" :key="pathway.id" class="pathway-card">
              <div class="pathway-header">
                <div>
                  <div class="pathway-badges">
                    <span class="pw-badge indigo">{{ t[pathway.subject] || pathway.subject }}</span>
                    <span class="pw-badge gray">{{ t[pathway.level?.toLowerCase()] || pathway.level }}</span>
                  </div>
                  <h4 class="pathway-title">{{ pathway.examTitle }}</h4>
                  <p class="pathway-goal">{{ t.goal }}: {{ pathway.topics }}</p>
                </div>
                <div class="pathway-date-badge">🕐 {{ pathway.targetDate }}</div>
              </div>
              <div class="pathway-timeline">
                <div class="timeline-line"></div>
                <div class="timeline-items">
                  <div v-for="(ms, idx) in pathway.milestones" :key="ms.id" class="timeline-item">
                    <div :class="['timeline-dot', idx === 0 && 'active']"></div>
                    <div class="timeline-content">
                      <div class="timeline-content-inner">
                        <div>
                          <h5 class="timeline-title">{{ ms.title }} <span v-if="idx === 0" class="next-badge">{{ t.nextUpBadge }}</span></h5>
                          <p class="timeline-desc">{{ ms.description }}</p>
                        </div>
                        <div class="timeline-type">{{ t[ms.type?.toLowerCase()] || ms.type }}</div>
                      </div>
                      <button v-if="idx === 0" @click="handleStartTest(pathway.subject, pathway.level, ms.description, true)" class="timeline-start-btn">
                        <span>▶</span> {{ t.startFullTest }}
                      </button>
                    </div>
                  </div>
                  <div class="timeline-item">
                    <div class="timeline-dot final"></div>
                    <div class="timeline-final">
                      <h5 class="timeline-final-title">{{ t.examDay }}</h5>
                      <p class="timeline-final-date">{{ pathway.targetDate }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="activity-card">
            <div class="activity-header">
              <h3 class="activity-title">{{ t.recentActivity }}</h3>
              <span class="view-all">{{ t.viewAll }}</span>
            </div>
            <div class="activity-list">
              <div v-for="test in mockTests" :key="test.id" class="activity-item">
                <div class="activity-item-left">
                  <div :class="['activity-icon', test.status === 'Completed' ? 'completed' : 'upcoming']">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div>
                    <h4 class="activity-name">{{ test.title }}</h4>
                    <p class="activity-meta">{{ test.date }} • {{ test.status }}</p>
                  </div>
                </div>
                <div class="activity-item-right">
                  <div v-if="test.score" class="activity-score">
                    <p class="score-num">{{ test.score }}<span class="score-total">/{{ test.total }}</span></p>
                    <p class="score-label">{{ t.passed }}</p>
                  </div>
                  <button v-else @click="handleStartTest('General', 'Intermediate', test.title, true)" class="prepare-btn">{{ t.prepare }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile FAB -->
      <button @click="mobileView = 'game'" class="mobile-fab lg-hide">🧠</button>
    </main>

    <!-- Right: Game Panel -->
    <div :class="['game-panel-wrap', mobileView === 'tests' && 'hide-mobile']">
      <TestGamePanel
        :externalConfig="activeGameConfig"
        :currentLanguage="currentLanguage"
        :showBackButton="true"
        @mobileBack="mobileView = 'tests'"
      />
    </div>

    <!-- Schedule Modal -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="!isGenerating && (isModalOpen = false)">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">{{ t.createStudyPlan }}</h3>
          <button @click="!isGenerating && (isModalOpen = false)" class="modal-close">✕</button>
        </div>
        <form @submit.prevent="handleCreatePlan" class="modal-form">
          <div class="form-group">
            <label class="form-label">{{ t.subject }}</label>
            <select v-model="formSubject" class="form-select" required>
              <option v-for="s in subjects" :key="s.id" :value="s.name">{{ s.icon }} {{ t[s.name] || s.name }}</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ t.targetDate }}</label>
              <input type="date" v-model="formDate" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t.currentLevel }}</label>
              <select v-model="formLevel" class="form-select">
                <option v-for="d in difficulties" :key="d" :value="d">{{ t[d.toLowerCase()] || d }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t.topicsToCover }}</label>
            <textarea v-model="formTopics" class="form-textarea" :placeholder="t.topicsPlaceholder" required></textarea>
            <p class="form-hint">{{ t.tailorTests }}</p>
          </div>
          <button type="submit" :disabled="isGenerating" :class="['submit-btn', isGenerating && 'disabled']">
            <template v-if="isGenerating"><div class="submit-spinner"></div> {{ t.generating }}</template>
            <template v-else><span>✨</span> {{ t.generate }}</template>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import TestGamePanel from './TestGamePanel.vue';
import { SUBJECTS, DIFFICULTIES, MOCK_TESTS_DATA, TRANSLATIONS } from '@/services/testConstants';
import { generateStudyPlan } from '@/services/geminiService';

export default {
  name: 'TestsPage',
  components: { TestGamePanel },
  setup() {
    const mobileView = ref('tests');
    const currentLanguage = ref(localStorage.getItem('lang') || 'en');
    const activeGameConfig = ref(null);
    const isModalOpen = ref(false);
    const isGenerating = ref(false);
    const activePathways = ref([]);
    const formSubject = ref(SUBJECTS[0].name);
    const formDate = ref('');
    const formLevel = ref('Intermediate');
    const formTopics = ref('');
    const subjects = SUBJECTS;
    const difficulties = DIFFICULTIES;
    const mockTests = MOCK_TESTS_DATA;

    const t = computed(() => TRANSLATIONS[currentLanguage.value] || TRANSLATIONS.en);

    const handleStartTest = (subject, level, topic, isFullTest = false) => {
      activeGameConfig.value = { subject, level, topic, timestamp: Date.now(), isFullTest };
      mobileView.value = 'game';
    };

    const handleCreatePlan = async () => {
      isGenerating.value = true;
      const newPathway = await generateStudyPlan(formSubject.value, formLevel.value, formDate.value, formTopics.value, currentLanguage.value);
      if (newPathway) {
        activePathways.value = [newPathway, ...activePathways.value];
        isModalOpen.value = false;
        formTopics.value = '';
        formDate.value = '';
      }
      isGenerating.value = false;
    };

    return {
      mobileView, currentLanguage, activeGameConfig, isModalOpen, isGenerating,
      activePathways, formSubject, formDate, formLevel, formTopics,
      subjects, difficulties, mockTests, t,
      handleStartTest, handleCreatePlan
    };
  }
};
</script>

<style scoped>
/* === LAYOUT === */
.tests-page-wrapper { display: flex; height: calc(100vh - 73px); width: 100%; overflow: hidden; background: #f8fafc; }
.tests-dashboard { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; }
.game-panel-wrap { width: 400px; flex-shrink: 0; border-left: 1px solid #e2e8f0; height: 100%; }
@media (max-width: 1024px) {
  .tests-page-wrapper { height: 100vh; }
  .game-panel-wrap { width: 100%; position: absolute; inset: 0; z-index: 30; background: #fafbfc; }
  .hide-mobile { display: none !important; }
  .lg-hide { display: flex !important; }
}
@media (min-width: 1025px) { .lg-hide { display: none !important; } }

/* Mobile header */
.mobile-header { height: 56px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; padding: 0 20px; justify-content: space-between; flex-shrink: 0; }
.mobile-brand { display: flex; align-items: center; gap: 8px; }
.brand-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.1rem; }
.brand-text { font-weight: 800; font-size: 1.15rem; color: #1e293b; letter-spacing: -0.02em; }

/* Scroll area */
.dashboard-scroll { flex: 1; overflow-y: auto; padding: 20px; }
.dashboard-scroll::-webkit-scrollbar { width: 6px; }
.dashboard-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
.dashboard-inner { max-width: 960px; margin: 0 auto; }
@media (min-width: 1025px) { .dashboard-scroll { padding: 28px 36px; } }

/* Page Header */
.page-header { display: flex; flex-direction: column; gap: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
@media (min-width: 768px) { .page-header { flex-direction: row; align-items: flex-end; justify-content: space-between; } }
.page-header-left { flex: 1; }
.title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
@media (min-width: 768px) { .title-row { justify-content: flex-start; } }
.page-title { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.02em; }
.lang-picker { display: flex; background: white; border-radius: 8px; padding: 3px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
.lang-btn { padding: 4px 10px; font-size: 0.7rem; font-weight: 700; border: none; border-radius: 5px; cursor: pointer; transition: all 0.2s; background: transparent; color: #64748b; font-family: inherit; }
.lang-btn.active { background: #8b5cf6; color: white; }
.page-subtitle { color: #64748b; margin: 6px 0 0; font-size: 0.9rem; }
.header-actions { display: flex; gap: 10px; width: 100%; }
@media (min-width: 768px) { .header-actions { width: auto; } }
.ai-tutor-btn, .new-exam-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 16px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; border: none; font-family: inherit; }
@media (min-width: 768px) { .ai-tutor-btn, .new-exam-btn { flex: none; } }
.ai-tutor-btn { background: white; color: #475569; border: 1px solid #d1d5db; }
.ai-tutor-btn:hover { background: #f8fafc; }
.new-exam-btn { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; box-shadow: 0 4px 12px rgba(139,92,246,0.3); }
.new-exam-btn:hover { box-shadow: 0 6px 18px rgba(139,92,246,0.4); transform: translateY(-1px); }
.btn-icon { width: 18px; height: 18px; }

/* Stats */
.stats-grid { display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 28px; }
@media (min-width: 768px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
.stat-card { background: white; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.stat-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.stat-header.indigo { color: #8b5cf6; }
.stat-header.emerald { color: #10b981; }
.stat-header.amber { color: #f59e0b; }
.stat-icon { width: 18px; height: 18px; }
.stat-label { font-weight: 600; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
.stat-value-lg { font-size: 1.15rem; font-weight: 700; color: #1e293b; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stat-value-big { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0; }
.stat-sub { font-size: 0.8rem; color: #94a3b8; margin: 4px 0 0; display: flex; align-items: center; gap: 2px; }
.stat-sub.emerald-text { color: #10b981; }
.stat-sub.muted { color: #94a3b8; }
.mini-icon { width: 12px; height: 12px; }

/* Pathways */
.pathways-section { margin-bottom: 28px; }
.section-title { font-weight: 700; font-size: 1.15rem; color: #1e293b; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
.section-icon { font-size: 1.1rem; }
.pathway-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.pathway-header { padding: 20px; border-bottom: 1px solid #f1f5f9; background: linear-gradient(135deg, #faf5ff, white); display: flex; flex-direction: column; gap: 12px; }
@media (min-width: 768px) { .pathway-header { flex-direction: row; justify-content: space-between; align-items: flex-start; } }
.pathway-badges { display: flex; gap: 6px; margin-bottom: 8px; }
.pw-badge { padding: 3px 8px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; border-radius: 4px; }
.pw-badge.indigo { background: #eef2ff; color: #6366f1; }
.pw-badge.gray { background: #f1f5f9; color: #475569; }
.pathway-title { font-size: 1.35rem; font-weight: 700; color: #1e293b; margin: 0; }
.pathway-goal { font-size: 0.85rem; color: #64748b; margin: 4px 0 0; }
.pathway-date-badge { display: flex; align-items: center; gap: 6px; font-weight: 500; color: #475569; background: white; padding: 6px 14px; border-radius: 999px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.04); font-size: 0.85rem; align-self: flex-start; white-space: nowrap; }
.pathway-timeline { padding: 20px; background: #fafbfc; position: relative; }
.timeline-line { position: absolute; left: 44px; top: 36px; bottom: 36px; width: 2px; background: #e2e8f0; }
.timeline-items { display: flex; flex-direction: column; gap: 18px; }
.timeline-item { position: relative; display: flex; align-items: flex-start; }
.timeline-dot { position: absolute; left: 24px; width: 14px; height: 14px; border-radius: 50%; background: #cbd5e1; border: 3px solid white; margin-top: 6px; transform: translateX(-50%); z-index: 1; }
.timeline-dot.active { background: #8b5cf6; box-shadow: 0 0 0 4px #ede9fe; }
.timeline-dot.final { background: #8b5cf6; border-color: #ddd6fe; }
.timeline-content { margin-left: 48px; flex: 1; background: white; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.03); transition: all 0.2s; cursor: pointer; }
.timeline-content:hover { border-color: #c4b5fd; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.timeline-content-inner { display: flex; flex-direction: column; gap: 8px; }
@media (min-width: 768px) { .timeline-content-inner { flex-direction: row; justify-content: space-between; align-items: flex-start; } }
.timeline-title { font-weight: 700; color: #1e293b; margin: 0; font-size: 0.9rem; display: flex; align-items: center; gap: 6px; }
.next-badge { padding: 2px 8px; background: #dcfce7; color: #166534; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; border-radius: 999px; }
.timeline-desc { font-size: 0.8rem; color: #64748b; margin: 4px 0 0; }
.timeline-type { padding: 4px 10px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; font-size: 0.7rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap; align-self: flex-start; }
.timeline-start-btn { margin-top: 12px; width: 100%; padding: 8px; background: #8b5cf6; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s; font-family: inherit; }
.timeline-start-btn:hover { background: #7c3aed; }
.timeline-final { margin-left: 48px; }
.timeline-final-title { font-weight: 700; color: #5b21b6; margin: 0; font-size: 0.9rem; }
.timeline-final-date { font-size: 0.8rem; color: #8b5cf6; margin: 2px 0 0; }

/* Activity */
.activity-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.activity-header { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; background: #fafbfc; display: flex; justify-content: space-between; align-items: center; }
.activity-title { font-weight: 700; color: #1e293b; margin: 0; font-size: 0.95rem; }
.view-all { font-size: 0.8rem; color: #8b5cf6; font-weight: 500; cursor: pointer; }
.view-all:hover { text-decoration: underline; }
.activity-list { }
.activity-item { padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; transition: background 0.15s; }
.activity-item:not(:last-child) { border-bottom: 1px solid #f8fafc; }
.activity-item:hover { background: #fafbfc; }
.activity-item-left { display: flex; align-items: center; gap: 12px; }
.activity-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.activity-icon.completed { background: #eef2ff; color: #8b5cf6; }
.activity-icon.upcoming { background: #f1f5f9; color: #64748b; }
.activity-icon svg { width: 20px; height: 20px; }
.activity-name { font-weight: 700; color: #1e293b; margin: 0; font-size: 0.9rem; transition: color 0.2s; }
.activity-item:hover .activity-name { color: #8b5cf6; }
.activity-meta { font-size: 0.78rem; color: #94a3b8; margin: 2px 0 0; }
.activity-item-right { flex-shrink: 0; }
.activity-score { text-align: right; }
.score-num { font-weight: 700; color: #1e293b; font-size: 1.1rem; margin: 0; }
.score-total { color: #94a3b8; font-size: 0.8rem; font-weight: 400; }
.score-label { font-size: 0.7rem; font-weight: 600; color: #10b981; margin: 0; }
.prepare-btn { padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.8rem; font-weight: 600; color: #475569; background: white; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.prepare-btn:hover { background: #f8fafc; border-color: #94a3b8; }

/* Mobile FAB */
.mobile-fab { position: fixed; bottom: 20px; right: 20px; z-index: 50; width: 52px; height: 52px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border: none; border-radius: 50%; font-size: 1.6rem; cursor: pointer; box-shadow: 0 4px 20px rgba(139,92,246,0.4); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.mobile-fab:hover { transform: scale(1.08) translateY(-2px); box-shadow: 0 8px 28px rgba(139,92,246,0.5); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); overflow-y: auto; }
.modal-card { background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); width: 100%; max-width: 480px; overflow: hidden; animation: zoomIn 0.2s ease; }
@keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: none; } }
.modal-header { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fafbfc; }
.modal-title { font-weight: 700; font-size: 1.1rem; color: #1e293b; margin: 0; }
.modal-close { background: none; border: none; font-size: 1.1rem; color: #94a3b8; cursor: pointer; padding: 4px; transition: color 0.2s; }
.modal-close:hover { color: #475569; }
.modal-form { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-select, .form-input { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 0.85rem; font-family: inherit; outline: none; transition: border-color 0.2s; background: white; box-sizing: border-box; }
.form-select:focus, .form-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
.form-textarea { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 0.85rem; font-family: inherit; outline: none; min-height: 90px; resize: vertical; transition: border-color 0.2s; box-sizing: border-box; }
.form-textarea:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,0.1); }
.form-hint { font-size: 0.72rem; color: #94a3b8; margin: 0; }
.submit-btn { width: 100%; padding: 12px; border-radius: 12px; border: none; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; box-shadow: 0 4px 12px rgba(139,92,246,0.3); font-family: inherit; }
.submit-btn:hover { box-shadow: 0 6px 18px rgba(139,92,246,0.4); }
.submit-btn.disabled { opacity: 0.6; cursor: not-allowed; }
.submit-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>