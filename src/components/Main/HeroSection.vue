<template>
  <div class="min-h-screen bg-gray-50 relative overflow-hidden">
    <!-- Subtle background pattern -->
    <div class="absolute inset-0 opacity-40">
      <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
      <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-100 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
    </div>

    <!-- Navigation -->
    <nav class="relative z-10 flex items-center justify-between px-6 lg:px-16 py-5">
      <img src="@/assets/logo.png" alt="ACED" class="h-10 lg:h-12" />
      <UserSection />
    </nav>

    <!-- Hero Content -->
    <div class="relative z-10 max-w-6xl mx-auto px-6 lg:px-16 pt-20 lg:pt-28 pb-20">
      <div class="text-center max-w-3xl mx-auto">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm mb-8">
          <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          <span class="text-xs font-medium text-gray-600">2,800+ students already learning</span>
        </div>

        <!-- Main heading -->
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
          The smarter way
          <br />
          to <span class="text-violet-600">learn anything</span>
        </h1>

        <!-- Subtitle -->
        <p class="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto">
          Interactive lessons with AI-powered help. Learn at your own pace and actually enjoy the process.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <button
            @click="handleStartFree"
            class="w-full sm:w-auto px-8 py-3.5 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/20"
          >
            Start Learning Free
          </button>
          <button
            @click="handleRegister"
            class="w-full sm:w-auto px-8 py-3.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all"
          >
            Create Account
          </button>
        </div>

        <!-- Stats Row -->
        <div class="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
          <div class="text-center">
            <div class="text-2xl lg:text-3xl font-bold text-gray-900">100+</div>
            <div class="text-sm text-gray-500">Courses</div>
          </div>
          <div class="w-px h-10 bg-gray-200 hidden sm:block"></div>
          <div class="text-center">
            <div class="text-2xl lg:text-3xl font-bold text-gray-900">24/7</div>
            <div class="text-sm text-gray-500">AI Support</div>
          </div>
          <div class="w-px h-10 bg-gray-200 hidden sm:block"></div>
          <div class="text-center">
            <div class="text-2xl lg:text-3xl font-bold text-gray-900">95%</div>
            <div class="text-sm text-gray-500">Completion</div>
          </div>
        </div>
      </div>

      <!-- Feature Cards Row -->
      <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div class="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">Interactive</h3>
          <p class="text-sm text-gray-500">Hands-on exercises with instant feedback</p>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">AI-Powered</h3>
          <p class="text-sm text-gray-500">Personal tutor available anytime</p>
        </div>

        <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div class="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
            <svg class="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1">Proven Results</h3>
          <p class="text-sm text-gray-500">Track progress and earn certificates</p>
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
