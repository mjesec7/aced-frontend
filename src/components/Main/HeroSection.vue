<template>
  <div class="min-h-screen bg-gradient-to-br from-amber-50 via-white to-teal-50 relative overflow-hidden">
    <!-- Fun background shapes -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-orange-300/30 to-pink-300/30 rounded-full blur-3xl"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-teal-300/30 to-cyan-300/30 rounded-full blur-3xl"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-lime-200/20 to-emerald-200/20 rounded-full blur-3xl"></div>

    <!-- Navigation -->
    <nav class="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
      <img src="@/assets/logo.png" alt="ACED" class="h-12 lg:h-14" />
      <UserSection />
    </nav>

    <!-- Hero Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-12 lg:pt-20 pb-24">
      <div class="grid lg:grid-cols-2 gap-16 items-center">
        <!-- Left Content -->
        <div class="space-y-8">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full border border-orange-200/50">
            <span class="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
            <span class="text-sm font-semibold text-orange-700">2,800+ students learning</span>
          </div>

          <!-- Main heading -->
          <h1 class="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
            Learn
            <span class="relative inline-block">
              <span class="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-teal-500">smarter</span>
              <svg class="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 2 150 2 198 10" stroke="url(#grad)" stroke-width="4" stroke-linecap="round"/>
                <defs><linearGradient id="grad"><stop stop-color="#f97316"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs>
              </svg>
            </span>
            <br />not harder
          </h1>

          <!-- Subtitle -->
          <p class="text-xl text-gray-600 leading-relaxed max-w-lg">
            Interactive lessons, AI-powered help, and a learning experience that actually feels fun. Start for free in 30 seconds.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-wrap gap-4">
            <button
              @click="handleStartFree"
              class="group px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              <span class="flex items-center gap-2">
                Start Learning Free
                <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            <button
              @click="handleRegister"
              class="px-8 py-4 bg-white text-gray-800 font-bold rounded-2xl border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all duration-300"
            >
              Create Account
            </button>
          </div>

          <!-- Trust indicators -->
          <div class="flex flex-wrap items-center gap-6 pt-4">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <div class="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span>No credit card</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <div class="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span>Cancel anytime</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <div class="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg class="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span>Instant access</span>
            </div>
          </div>
        </div>

        <!-- Right Content - Fun Cards -->
        <div class="relative hidden lg:block">
          <!-- Floating cards -->
          <div class="relative w-full h-[500px]">
            <!-- Main card -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 rotate-3 hover:rotate-0 transition-transform duration-500">
              <div class="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-900 mb-3">Interactive Lessons</h3>
              <p class="text-gray-600">Learn by doing with hands-on exercises and real-time feedback</p>
              <div class="mt-6 flex -space-x-2">
                <div class="w-8 h-8 rounded-full bg-teal-400"></div>
                <div class="w-8 h-8 rounded-full bg-orange-400"></div>
                <div class="w-8 h-8 rounded-full bg-pink-400"></div>
                <div class="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center text-xs font-bold text-white">+99</div>
              </div>
            </div>

            <!-- Secondary card -->
            <div class="absolute top-10 right-0 w-56 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl p-5 text-white -rotate-6 hover:rotate-0 transition-transform duration-500 shadow-xl shadow-teal-500/25">
              <div class="text-4xl font-bold">AI</div>
              <div class="text-sm opacity-90 mt-1">Powered Help</div>
            </div>

            <!-- Third card -->
            <div class="absolute bottom-10 left-0 w-48 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-2xl p-5 text-white rotate-6 hover:rotate-0 transition-transform duration-500 shadow-xl shadow-lime-500/25">
              <div class="text-3xl font-bold">100+</div>
              <div class="text-sm opacity-90 mt-1">Courses Available</div>
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
