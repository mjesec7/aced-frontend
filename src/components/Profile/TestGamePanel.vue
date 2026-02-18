<template>
  <aside class="game-panel">
    <!-- Header -->
    <div class="panel-header-wrap">
      <div class="panel-header-card">
        <div class="panel-header-left">
          <button v-if="showBackButton" @click="$emit('mobileBack')" class="mobile-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div class="panel-icon-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg></div>
          <div><h2 class="panel-title">{{ t.sidekick }}</h2><span class="panel-subtitle">{{ t.aiTestCompanion }}</span></div>
        </div>
        <div class="panel-stats">
          <div class="stat-badge amber"><span>🏆</span><span class="stat-val">{{ stats.score }}</span></div>
          <div class="stat-badge indigo"><span>⚡</span><span class="stat-val">{{ stats.streak }}</span></div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="panel-content">
      <!-- IDLE: Summary after test -->
      <div v-if="gameState === 'IDLE' && isTestSession && sessionResults.length > 0" class="idle-content summary-view">
        <div class="summary-center">
          <div class="summary-trophy">🏆</div>
          <h3 class="summary-title">{{ t.testComplete }}</h3>
          <p class="summary-desc">{{ t.performance }}</p>
          <div class="summary-grid">
            <div class="summary-card"><p class="summary-label">{{ t.score }}</p><p class="summary-value indigo">{{ summaryPercentage }}%</p></div>
            <div class="summary-card"><p class="summary-label">{{ t.correct }}</p><p class="summary-value green">{{ summaryCorrect }}/{{ sessionResults.length }}</p></div>
          </div>
          <button @click="resetToIdle" class="btn-dark full-width">{{ t.backHome }}</button>
        </div>
      </div>

      <!-- IDLE: Selection -->
      <div v-else-if="gameState === 'IDLE'" class="idle-content">
        <div class="mode-toggle">
          <button @click="setMode('SUBJECT_PRACTICE')" :class="['mode-btn', mode === 'SUBJECT_PRACTICE' && 'active']">{{ t.quickPractice }}</button>
          <button @click="setMode('EXAM_SIMULATION')" :class="['mode-btn', mode === 'EXAM_SIMULATION' && 'active']">{{ t.mockExams }}</button>
        </div>
        <div class="mode-hero">
          <div class="mode-hero-icon">{{ mode === 'SUBJECT_PRACTICE' ? '📖' : '🎓' }}</div>
          <h3 class="mode-hero-title">{{ mode === 'SUBJECT_PRACTICE' ? t.masterSubject : t.aceExam }}</h3>
          <p class="mode-hero-desc">{{ mode === 'SUBJECT_PRACTICE' ? t.pickTopic : t.simulateExam }}</p>
        </div>
        <div class="selection-scroll">
          <!-- Difficulty (practice only) -->
          <div v-if="mode === 'SUBJECT_PRACTICE'" class="section-block">
            <p class="section-label">{{ t.difficulty }}</p>
            <div class="difficulty-grid">
              <button v-for="d in difficulties" :key="d" @click="selectedDifficulty = d"
                :class="['diff-btn', selectedDifficulty === d && 'active']">{{ t[d.toLowerCase()] || d }}</button>
            </div>
          </div>
          <p class="section-label">{{ t.select }} {{ mode === 'SUBJECT_PRACTICE' ? t.subject : t.exam }}</p>
          <div class="items-list">
            <button v-for="item in currentItems" :key="item.id" @click="selectedItem = item"
              :class="['item-btn', selectedItem?.id === item.id && 'active']">
              <div class="item-left"><span class="item-icon">{{ item.icon }}</span><span :class="['item-name', selectedItem?.id === item.id && 'active']">{{ t[item.name] || item.name }}</span></div>
              <div v-if="selectedItem?.id === item.id" class="item-dot"></div>
            </button>
          </div>
        </div>
        <button @click="startGame" class="btn-dark full-width start-btn">
          <span>{{ mode === 'SUBJECT_PRACTICE' ? t.startQuiz : t.startMock }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-arrow"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      <!-- LOADING -->
      <div v-else-if="gameState === 'LOADING'" class="loading-view">
        <div class="spinner-wrap"><div class="spinner"></div><div class="spinner-icon">🧠</div></div>
        <p class="loading-title">{{ t.generatingContent }}</p>
        <p class="loading-desc">{{ t.consulting }}</p>
      </div>

      <!-- PLAYING / SUCCESS / FAILURE -->
      <div v-else-if="['PLAYING','SUCCESS','FAILURE'].includes(gameState)" class="playing-view">
        <!-- Context Card -->
        <div class="context-card">
          <div class="context-bg-icon">{{ selectedItem?.icon }}</div>
          <div class="context-inner">
            <div class="context-badges">
              <span v-if="isTestSession" class="badge dark">{{ currentQuestionIndex + 1 }} / {{ quizQueue.length }}</span>
              <span class="badge gray">{{ t[selectedItem?.name] || selectedItem?.name }}</span>
              <span v-if="quizData?.tag" class="badge indigo">{{ quizData.tag }}</span>
              <span v-if="mode === 'SUBJECT_PRACTICE' && !isTestSession" class="badge purple">{{ t[selectedDifficulty.toLowerCase()] || selectedDifficulty }}</span>
              <span v-if="mode === 'EXAM_SIMULATION' || isTestSession" class="badge red">{{ t.examMode }}</span>
            </div>
            <div v-if="customTopic" class="context-topic"><span>{{ t.topic }}: {{ customTopic }}</span></div>
            <p class="context-text">{{ quizData?.context }}</p>
          </div>
        </div>
        <!-- Question -->
        <div class="question-text">{{ quizData?.question }}</div>
        <!-- Options -->
        <div class="options-list">
          <button v-for="opt in quizData?.options" :key="opt.id" :disabled="isFinished"
            @click="handleOptionClick(opt.id, opt.isCorrect)"
            :class="['option-btn', getOptionClass(opt)]">
            <div :class="['option-radio', (selectedOptionId === opt.id || (isFinished && opt.isCorrect)) && 'filled']">
              <div v-if="selectedOptionId === opt.id || (isFinished && opt.isCorrect)" class="option-radio-dot"></div>
            </div>
            <span>{{ opt.text }}</span>
          </button>
        </div>
        <!-- Feedback -->
        <div v-if="isFinished" :class="['feedback-card', gameState === 'SUCCESS' ? 'success' : 'failure']">
          <div class="feedback-row">
            <div :class="['feedback-icon', gameState === 'SUCCESS' ? 'success' : 'failure']">{{ gameState === 'SUCCESS' ? '✨' : '⚠️' }}</div>
            <div class="feedback-body">
              <p :class="['feedback-title', gameState === 'SUCCESS' ? 'success' : 'failure']">{{ gameState === 'SUCCESS' ? t.correct : t.incorrect }}</p>
              <p class="feedback-explanation">{{ quizData?.explanation }}</p>
              <div class="feedback-tip"><span>💡</span><span>{{ quizData?.tip }}</span></div>
            </div>
          </div>
          <button @click="handleNextQuestion" class="btn-dark full-width">
            <span>{{ isTestSession && currentQuestionIndex === quizQueue.length - 1 ? t.finishTest : t.nextQuestion }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-arrow"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <!-- ERROR -->
      <div v-else-if="gameState === 'ERROR'" class="error-view">
        <span class="error-icon">⚠️</span>
        <p class="error-desc">{{ t.connectionErrorDesc }}</p>
        <button @click="gameState = 'IDLE'" class="error-link">{{ t.returnHome }}</button>
      </div>
    </div>
  </aside>
</template>

<script>
import { ref, computed, watch } from 'vue';
import confetti from 'canvas-confetti';
import { SUBJECTS, LANGUAGES, EXAMS, DIFFICULTIES, TRANSLATIONS } from '@/services/testConstants';
import { generateQuiz, generateMockTest } from '@/services/geminiService';

export default {
  name: 'TestGamePanel',
  props: {
    externalConfig: { type: Object, default: null },
    currentLanguage: { type: String, default: 'en' },
    showBackButton: { type: Boolean, default: false }
  },
  emits: ['mobileBack'],
  setup(props) {
    const gameState = ref('IDLE');
    const mode = ref('SUBJECT_PRACTICE');
    const selectedItem = ref(SUBJECTS[0]);
    const selectedDifficulty = ref('Intermediate');
    const customTopic = ref(null);
    const quizQueue = ref([]);
    const currentQuestionIndex = ref(0);
    const sessionResults = ref([]);
    const isTestSession = ref(false);
    const quizData = ref(null);
    const selectedOptionId = ref(null);
    const stats = ref({ score: 0, streak: 0, xp: 0 });
    const difficulties = DIFFICULTIES;

    const t = computed(() => TRANSLATIONS[props.currentLanguage] || TRANSLATIONS.en);
    const PRACTICE_ITEMS = [...SUBJECTS, ...LANGUAGES];
    const currentItems = computed(() => mode.value === 'SUBJECT_PRACTICE' ? PRACTICE_ITEMS : EXAMS);
    const isFinished = computed(() => gameState.value === 'SUCCESS' || gameState.value === 'FAILURE');
    const summaryCorrect = computed(() => sessionResults.value.filter(Boolean).length);
    const summaryPercentage = computed(() => sessionResults.value.length ? Math.round((summaryCorrect.value / sessionResults.value.length) * 100) : 0);

    const setMode = (m) => {
      mode.value = m;
      selectedItem.value = m === 'SUBJECT_PRACTICE' ? PRACTICE_ITEMS[0] : EXAMS[0];
      customTopic.value = null;
    };

    const resetToIdle = () => { isTestSession.value = false; sessionResults.value = []; gameState.value = 'IDLE'; };

    const triggerConfetti = () => {
      const end = Date.now() + 1000;
      const colors = ['#8b5cf6', '#ec4899', '#fbbf24'];
      (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0.7, y: 0.5 }, colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 0.9, y: 0.5 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    };

    const startGame = async () => {
      gameState.value = 'LOADING';
      quizData.value = null;
      selectedOptionId.value = null;
      isTestSession.value = false;
      quizQueue.value = [];
      try {
        const data = await generateQuiz(mode.value, selectedItem.value.id, selectedItem.value.name, selectedDifficulty.value, customTopic.value, props.currentLanguage);
        if (!data?.options?.length) throw new Error('Invalid Data');
        quizData.value = data;
        gameState.value = 'PLAYING';
      } catch { gameState.value = 'ERROR'; }
    };

    const handleStartMockTest = async (item, diff, topic) => {
      gameState.value = 'LOADING';
      quizData.value = null;
      try {
        const questions = await generateMockTest(item.name, diff, topic, 5, props.currentLanguage);
        if (!questions?.length) throw new Error('No data');
        quizQueue.value = questions;
        quizData.value = questions[0];
        currentQuestionIndex.value = 0;
        sessionResults.value = [];
        gameState.value = 'PLAYING';
      } catch { gameState.value = 'ERROR'; }
    };

    const handleOptionClick = (optionId, isCorrect) => {
      if (gameState.value !== 'PLAYING') return;
      selectedOptionId.value = optionId;
      if (isTestSession.value) { const r = [...sessionResults.value]; r[currentQuestionIndex.value] = isCorrect; sessionResults.value = r; }
      if (isCorrect) {
        gameState.value = 'SUCCESS';
        stats.value = { ...stats.value, score: stats.value.score + 100, streak: stats.value.streak + 1, xp: stats.value.xp + 50 };
        triggerConfetti();
      } else {
        gameState.value = 'FAILURE';
        stats.value = { ...stats.value, streak: 0 };
      }
    };

    const handleNextQuestion = () => {
      if (isTestSession.value) {
        const next = currentQuestionIndex.value + 1;
        if (next < quizQueue.value.length) {
          quizData.value = quizQueue.value[next];
          currentQuestionIndex.value = next;
          gameState.value = 'PLAYING';
          selectedOptionId.value = null;
        } else { gameState.value = 'IDLE'; quizData.value = null; }
      } else { startGame(); }
    };

    const getOptionClass = (opt) => {
      if (!isFinished.value) return 'default';
      if (opt.isCorrect) return 'correct';
      if (selectedOptionId.value === opt.id && !opt.isCorrect) return 'incorrect';
      return 'dimmed';
    };

    // Watch external config
    watch(() => props.externalConfig, (cfg) => {
      if (!cfg) return;
      const allItems = [...SUBJECTS, ...LANGUAGES, ...EXAMS];
      const match = allItems.find(i => i.name === cfg.subject) || SUBJECTS[0];
      selectedItem.value = match;
      customTopic.value = cfg.topic;
      const matchedLevel = DIFFICULTIES.find(v => v === cfg.level) || 'Intermediate';
      selectedDifficulty.value = matchedLevel;
      mode.value = 'SUBJECT_PRACTICE';
      quizQueue.value = [];
      currentQuestionIndex.value = 0;
      sessionResults.value = [];
      isTestSession.value = !!cfg.isFullTest;
      setTimeout(() => {
        if (cfg.isFullTest) handleStartMockTest(match, matchedLevel, cfg.topic);
        else startGame();
      }, 100);
    }, { deep: true });

    return {
      gameState, mode, selectedItem, selectedDifficulty, customTopic, quizQueue,
      currentQuestionIndex, sessionResults, isTestSession, quizData, selectedOptionId,
      stats, difficulties, t, currentItems, isFinished, summaryCorrect, summaryPercentage,
      setMode, resetToIdle, startGame, handleOptionClick, handleNextQuestion, getOptionClass
    };
  }
};
</script>

<style scoped>
.game-panel { height: 100%; display: flex; flex-direction: column; overflow: hidden; background: #fafbfc; }
.panel-header-wrap { flex-shrink: 0; padding: 20px 20px 8px; }
.panel-header-card { display: flex; align-items: center; justify-content: space-between; background: white; padding: 14px; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.panel-header-left { display: flex; align-items: center; gap: 10px; }
.mobile-back-btn { display: none; background: none; border: none; padding: 6px; color: #64748b; cursor: pointer; border-radius: 50%; }
.mobile-back-btn:hover { background: #f1f5f9; color: #8b5cf6; }
.mobile-back-btn svg { width: 20px; height: 20px; }
@media (max-width: 1024px) { .mobile-back-btn { display: flex; } }
.panel-icon-box { width: 36px; height: 36px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(139,92,246,0.3); }
.panel-icon-box svg { width: 18px; height: 18px; color: white; }
.panel-title { font-weight: 700; font-size: 0.95rem; color: #1e293b; line-height: 1; margin: 0; }
.panel-subtitle { font-size: 0.7rem; color: #94a3b8; font-weight: 500; }
.panel-stats { display: flex; gap: 8px; }
.stat-badge { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px; font-size: 0.8rem; }
.stat-badge.amber { background: #fffbeb; color: #d97706; }
.stat-badge.indigo { background: #eef2ff; color: #6366f1; }
.stat-val { font-weight: 700; }
.panel-content { flex: 1; padding: 0 20px 20px; overflow-y: auto; display: flex; flex-direction: column; }
.panel-content::-webkit-scrollbar { width: 4px; }
.panel-content::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }

/* Idle */
.idle-content { display: flex; flex-direction: column; height: 100%; }
.mode-toggle { display: flex; padding: 4px; background: #e2e8f0; border-radius: 12px; margin-bottom: 20px; flex-shrink: 0; }
.mode-btn { flex: 1; padding: 8px; font-size: 0.8rem; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: transparent; color: #64748b; font-family: inherit; }
.mode-btn.active { background: white; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.mode-hero { text-align: center; margin-bottom: 20px; flex-shrink: 0; }
.mode-hero-icon { width: 72px; height: 72px; margin: 0 auto 14px; background: linear-gradient(135deg, #8b5cf6, #a855f7); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; box-shadow: 0 4px 16px rgba(139,92,246,0.3); }
.mode-hero-title { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 6px; }
.mode-hero-desc { font-size: 0.85rem; color: #64748b; margin: 0; padding: 0 16px; }
.selection-scroll { flex: 1; overflow-y: auto; min-height: 0; padding-right: 4px; }
.selection-scroll::-webkit-scrollbar { width: 4px; }
.selection-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
.section-block { margin-bottom: 14px; }
.section-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px; }
.difficulty-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.diff-btn { padding: 8px; font-size: 0.75rem; font-weight: 700; border: 1px solid #e2e8f0; border-radius: 8px; background: white; color: #475569; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.diff-btn.active { background: #8b5cf6; color: white; border-color: #8b5cf6; }
.items-list { display: flex; flex-direction: column; gap: 6px; padding-bottom: 12px; }
.item-btn { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.item-btn.active { border-color: #8b5cf6; background: #f5f3ff; box-shadow: 0 0 0 1px #8b5cf6; }
.item-left { display: flex; align-items: center; gap: 10px; }
.item-icon { font-size: 1.2rem; }
.item-name { font-weight: 600; color: #475569; font-size: 0.9rem; }
.item-name.active { color: #5b21b6; }
.item-dot { width: 8px; height: 8px; border-radius: 50%; background: #8b5cf6; }
.start-btn { margin-top: 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 8px; }

/* Buttons */
.btn-dark { padding: 12px; background: #1e293b; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: inherit; }
.btn-dark:hover { background: #0f172a; }
.full-width { width: 100%; }
.btn-arrow { width: 16px; height: 16px; }

/* Loading */
.loading-view { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 14px; }
.spinner-wrap { position: relative; }
.spinner { width: 56px; height: 56px; border: 4px solid #eef2ff; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 1s linear infinite; }
.spinner-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; animation: pulse 2s infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.loading-title { font-weight: 700; color: #1e293b; margin: 0; }
.loading-desc { color: #64748b; font-size: 0.85rem; margin: 0; }

/* Playing */
.playing-view { display: flex; flex-direction: column; height: 100%; animation: slideIn 0.4s ease; }
@keyframes slideIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
.context-card { background: white; padding: 18px; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 16px; position: relative; overflow: hidden; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.context-bg-icon { position: absolute; top: -4px; right: 4px; font-size: 3.5rem; opacity: 0.08; }
.context-inner { position: relative; z-index: 1; }
.context-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.badge { padding: 3px 8px; border-radius: 4px; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
.badge.dark { background: #1e293b; color: white; }
.badge.gray { background: #f1f5f9; color: #475569; }
.badge.indigo { background: #eef2ff; color: #6366f1; }
.badge.purple { background: #faf5ff; color: #9333ea; }
.badge.red { background: #fef2f2; color: #dc2626; }
.context-topic { margin-bottom: 8px; }
.context-topic span { font-size: 0.75rem; font-weight: 600; color: #5b21b6; background: #f5f3ff; padding: 4px 8px; border-radius: 4px; }
.context-text { color: #475569; font-size: 0.85rem; line-height: 1.6; white-space: pre-wrap; margin: 0; }
.question-text { font-weight: 700; font-size: 1.05rem; color: #1e293b; margin-bottom: 14px; padding: 0 2px; flex-shrink: 0; line-height: 1.4; }
.options-list { display: flex; flex-direction: column; gap: 8px; flex: 1; overflow-y: auto; min-height: 0; padding-right: 4px; }
.options-list::-webkit-scrollbar { width: 4px; }
.options-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
.option-btn { width: 100%; padding: 14px; border-radius: 12px; border: 2px solid #e2e8f0; background: white; text-align: left; cursor: pointer; transition: all 0.2s; font-size: 0.85rem; font-weight: 500; color: #475569; display: flex; align-items: flex-start; gap: 10px; font-family: inherit; }
.option-btn.default:hover { border-color: #c4b5fd; background: #faf5ff; }
.option-btn.correct { background: #f0fdf4; border-color: #22c55e; color: #166534; box-shadow: 0 0 0 1px #22c55e; }
.option-btn.incorrect { background: #fef2f2; border-color: #ef4444; color: #991b1b; box-shadow: 0 0 0 1px #ef4444; }
.option-btn.dimmed { opacity: 0.4; border-color: #e2e8f0; background: #f8fafc; }
.option-btn:disabled { cursor: default; }
.option-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #cbd5e1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; transition: border-color 0.2s; }
.option-radio.filled { border-color: currentColor; }
.option-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

/* Feedback */
.feedback-card { margin-top: 14px; padding: 14px; border-radius: 12px; border: 1px solid; flex-shrink: 0; animation: slideUp 0.3s ease; }
@keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.feedback-card.success { background: #f0fdf4; border-color: #bbf7d0; }
.feedback-card.failure { background: #fef2f2; border-color: #fecaca; }
.feedback-row { display: flex; gap: 10px; align-items: flex-start; }
.feedback-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.9rem; }
.feedback-icon.success { background: #bbf7d0; }
.feedback-icon.failure { background: #fecaca; }
.feedback-body { flex: 1; min-width: 0; }
.feedback-title { font-weight: 700; font-size: 0.85rem; margin: 0 0 4px; }
.feedback-title.success { color: #166534; }
.feedback-title.failure { color: #991b1b; }
.feedback-explanation { font-size: 0.78rem; color: #475569; line-height: 1.5; margin: 0 0 10px; }
.feedback-tip { display: flex; align-items: flex-start; gap: 6px; font-size: 0.75rem; font-weight: 500; color: #6d28d9; background: rgba(255,255,255,0.6); padding: 8px; border-radius: 6px; border: 1px solid rgba(139,92,246,0.1); }
.feedback-card .btn-dark { margin-top: 10px; padding: 10px; font-size: 0.85rem; }

/* Summary */
.summary-view { align-items: center; justify-content: center; }
.summary-center { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 18px; width: 100%; }
.summary-trophy { font-size: 3.5rem; width: 88px; height: 88px; background: #eef2ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.summary-title { font-size: 1.4rem; font-weight: 700; color: #1e293b; margin: 0; }
.summary-desc { color: #64748b; margin: 0; }
.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; }
.summary-card { background: white; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
.summary-label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin: 0 0 4px; }
.summary-value { font-size: 1.8rem; font-weight: 700; margin: 0; }
.summary-value.indigo { color: #8b5cf6; }
.summary-value.green { color: #22c55e; }

/* Error */
.error-view { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; gap: 10px; }
.error-icon { font-size: 2.5rem; }
.error-desc { color: #475569; padding: 0 32px; }
.error-link { background: none; border: none; color: #8b5cf6; font-weight: 700; cursor: pointer; font-family: inherit; font-size: 0.9rem; }
.error-link:hover { text-decoration: underline; }
</style>
