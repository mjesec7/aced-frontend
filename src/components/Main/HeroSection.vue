<template>
  <div class="min-h-screen bg-white relative">
    <!-- Navigation -->
    <nav class="flex items-center justify-between px-6 lg:px-16 py-6">
      <img src="@/assets/logo.png" alt="ACED" class="h-12 lg:h-14" />
      <UserSection />
    </nav>

    <!-- Hero Content -->
    <div class="max-w-7xl mx-auto px-6 lg:px-16 pt-16 lg:pt-24 pb-24">
      <div class="grid lg:grid-cols-2 gap-16 items-center">
        <!-- Left Content -->
        <div class="space-y-8">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100">
            <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
            <span class="text-sm font-medium text-violet-700">2,800+ students learning</span>
          </div>

          <!-- Main heading -->
          <h1 class="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Learn smarter,
            <br />
            <span class="text-violet-600">not harder</span>
          </h1>

          <!-- Subtitle -->
          <p class="text-lg text-gray-500 leading-relaxed max-w-lg">
            Interactive lessons, AI-powered help, and a learning experience that actually works. Start for free in 30 seconds.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-wrap gap-4">
            <button
              @click="handleStartFree"
              class="px-8 py-4 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors"
            >
              Start Learning Free
            </button>
            <button
              @click="handleRegister"
              class="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-all"
            >
              Create Account
            </button>
          </div>

          <!-- Trust indicators -->
          <div class="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-500">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span>No credit card</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span>Cancel anytime</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span>Instant access</span>
            </div>
          </div>
        </div>

        <!-- Right Content - Simple Cards -->
        <div class="hidden lg:flex flex-col gap-6">
          <!-- Main card -->
          <div class="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <div class="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Interactive Lessons</h3>
            <p class="text-gray-500">Learn by doing with hands-on exercises and real-time feedback</p>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <!-- Stat card 1 -->
            <div class="bg-violet-600 rounded-2xl p-6 text-white">
              <div class="text-3xl font-bold mb-1">100+</div>
              <div class="text-violet-200 text-sm">Courses</div>
            </div>
            <!-- Stat card 2 -->
            <div class="bg-amber-400 rounded-2xl p-6">
              <div class="text-3xl font-bold text-gray-900 mb-1">24/7</div>
              <div class="text-amber-700 text-sm">AI Support</div>
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
