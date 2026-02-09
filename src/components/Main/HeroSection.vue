<template>
  <div class="hero-wrapper">
    <!-- Centered decorative element - contained within hero, no interaction -->
    <div class="hero-decoration"></div>

    <!-- Navigation - highest z-index within hero for dropdown visibility -->
    <nav class="hero-nav">
      <img src="@/assets/logo.png" alt="ACED" class="h-8 sm:h-10 lg:h-12" />
      <UserSection />
    </nav>

    <!-- Hero Content - below navigation -->
    <div class="hero-content">
      <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center py-6 sm:py-8 lg:py-12">

        <!-- Left side - Text content -->
        <div class="relative">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-violet-50 rounded-full border border-violet-100 mb-6 sm:mb-8">
            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span class="text-xs sm:text-sm font-medium text-violet-700">{{ $t('heroSection.platformLive') }}</span>
          </div>

          <!-- Main heading + Subtitle -->
          <div class="flex flex-col gap-4 sm:gap-6 mb-8 sm:mb-10">
            <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.15] tracking-tight">
              {{ $t('heroSection.headline') }}
              <span class="relative inline-block">
                <span class="relative z-10 text-violet-600">{{ $t('heroSection.headlineHighlight') }}</span>
                <span class="absolute bottom-1 sm:bottom-2 left-0 w-full h-2 sm:h-3 bg-violet-200/60 -z-0 rounded"></span>
              </span>
            </h1>

            <p class="text-base sm:text-lg lg:text-xl text-gray-500 leading-relaxed max-w-md">
              {{ $t('heroSection.subtitle') }}
            </p>
          </div>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-3 mb-8 sm:mb-10">
            <button
              @click="handleStartFree"
              class="w-full sm:w-auto px-6 sm:px-8 py-3 bg-violet-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25"
            >
              {{ $t('heroSection.startFree') }}
            </button>
            <button
              @click="handleRegister"
              class="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-gray-700 text-sm sm:text-base font-semibold rounded-xl border-2 border-gray-200 hover:border-violet-400 hover:text-violet-600 transition-all"
            >
              {{ $t('heroSection.registerAndSave') }}
            </button>
          </div>

          <!-- Features -->
          <div class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8 pt-6 border-t border-gray-100">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <div class="text-lg sm:text-xl font-bold text-gray-900">{{ $t('heroSection.aiPowered') }}</div>
                <div class="text-xs sm:text-sm text-gray-500">{{ $t('heroSection.aiPoweredDesc') }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <div>
                <div class="text-lg sm:text-xl font-bold text-gray-900">{{ $t('heroSection.interactive') }}</div>
                <div class="text-xs sm:text-sm text-gray-500">{{ $t('heroSection.interactiveDesc') }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <div class="text-lg sm:text-xl font-bold text-gray-900">{{ $t('heroSection.multiLang') }}</div>
                <div class="text-xs sm:text-sm text-gray-500">{{ $t('heroSection.multiLangDesc') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side - Visual/Cards -->
        <div class="relative hidden lg:block">
          <!-- Main card -->
          <div class="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-6 xl:p-8 border border-gray-100 relative">
            <!-- Decorative element inside card -->
            <div class="absolute top-4 right-4 w-12 xl:w-16 h-12 xl:h-16 bg-amber-400 rounded-2xl rotate-12 opacity-20"></div>

            <div class="space-y-4 xl:space-y-5 relative">
              <!-- Course preview card 1 -->
              <div class="flex items-center gap-3 xl:gap-4 p-3 xl:p-4 bg-gray-50 rounded-2xl">
                <div class="w-12 xl:w-14 h-12 xl:h-14 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg class="w-6 xl:w-7 h-6 xl:h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-gray-900 truncate">{{ $t('heroSection.mathematics') }}</div>
                  <div class="text-sm text-gray-500 truncate">{{ $t('heroSection.mathLessons') }}</div>
                </div>
                <span class="px-2 xl:px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full whitespace-nowrap">{{ $t('common.free') }}</span>
              </div>

              <!-- Course preview card 2 -->
              <div class="flex items-center gap-3 xl:gap-4 p-3 xl:p-4 bg-gray-50 rounded-2xl">
                <div class="w-12 xl:w-14 h-12 xl:h-14 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg class="w-6 xl:w-7 h-6 xl:h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-gray-900 truncate">{{ $t('heroSection.languages') }}</div>
                  <div class="text-sm text-gray-500 truncate">{{ $t('heroSection.langLessons') }}</div>
                </div>
                <span class="px-2 xl:px-3 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full whitespace-nowrap">{{ $t('common.pro') }}</span>
              </div>

              <!-- Course preview card 3 -->
              <div class="flex items-center gap-3 xl:gap-4 p-3 xl:p-4 bg-gray-50 rounded-2xl">
                <div class="w-12 xl:w-14 h-12 xl:h-14 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg class="w-6 xl:w-7 h-6 xl:h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-gray-900 truncate">{{ $t('heroSection.science') }}</div>
                  <div class="text-sm text-gray-500 truncate">{{ $t('heroSection.sciLessons') }}</div>
                </div>
                <span class="px-2 xl:px-3 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full whitespace-nowrap">{{ $t('common.pro') }}</span>
              </div>
            </div>

            <!-- Bottom features -->
            <div class="mt-5 xl:mt-6 pt-5 xl:pt-6 border-t border-gray-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-4 xl:w-5 h-4 xl:h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="text-xs xl:text-sm text-gray-500">{{ $t('heroSection.freeToStart') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 xl:w-5 h-4 xl:h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span class="text-xs xl:text-sm text-gray-500">{{ $t('heroSection.mobileReady') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UserSection from "@/components/Main/UserSection.vue";

export default {
  components: { UserSection },
  methods: {
    handleStartFree() {
      const acedSection = document.getElementById('aced');
      if (acedSection) {
        acedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    handleRegister() {
      window.dispatchEvent(new Event("open-Login-modal"));
    }
  }
};
</script>

<style scoped>
/* Hero wrapper - main container */
.hero-wrapper {
  position: relative;
  background: white;
  /* No overflow:hidden - allows dropdowns to show */
  /* No transform or filter - doesn't create stacking context that traps dropdowns */
}

/* Decorative background element */
.hero-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 800px;
  background: rgba(196, 181, 253, 0.2); /* violet-200/20 */
  border-radius: 9999px;
  filter: blur(48px); /* blur-3xl equivalent */
  pointer-events: none;
  z-index: 0;
}

/* Navigation bar - high z-index for dropdowns */
.hero-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem;
  max-width: 80rem;
  margin: 0 auto;
  position: relative;
  z-index: 50; /* High but below teleported dropdown (z-index: max) */
}

@media (min-width: 640px) {
  .hero-nav {
    padding: 1.25rem 1.5rem;
  }
}

@media (min-width: 1024px) {
  .hero-nav {
    padding: 1.25rem 4rem;
  }
}

/* Hero content section */
.hero-content {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1rem 3rem;
  position: relative;
  z-index: 1; /* Below navigation */
}

@media (min-width: 640px) {
  .hero-content {
    padding: 0 1.5rem 4rem;
  }
}

@media (min-width: 1024px) {
  .hero-content {
    padding: 0 4rem 5rem;
  }
}
</style>