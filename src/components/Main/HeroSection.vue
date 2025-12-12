<template>
  <div class="min-h-screen bg-white relative overflow-hidden">
    <!-- Subtle background pattern -->
    <div class="absolute inset-0">
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-50 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 opacity-70"></div>
      <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 opacity-70"></div>
    </div>

    <!-- Navigation -->
    <nav class="relative z-10 flex items-center justify-between px-6 lg:px-16 py-5">
      <img src="@/assets/logo.png" alt="ACED" class="h-10 lg:h-12" />
      <UserSection />
    </nav>

    <!-- Hero Content -->
    <div class="relative z-10 max-w-5xl mx-auto px-6 lg:px-16 pt-16 lg:pt-24 pb-24">
      <div class="text-center">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100 mb-6">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span class="text-sm font-medium text-violet-700">2,800+ students already learning</span>
        </div>

        <!-- Main heading -->
        <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-5">
          The smarter way
          <br />
          to <span class="text-violet-600">learn anything</span>
        </h1>

        <!-- Subtitle -->
        <p class="text-xl lg:text-2xl text-gray-500 leading-relaxed mb-10 max-w-2xl mx-auto">
          Interactive lessons with AI-powered help. Learn at your own pace.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            @click="handleStartFree"
            class="w-full sm:w-auto px-10 py-4 bg-violet-600 text-white text-lg font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25"
          >
            Start Free - No Registration
          </button>
          <button
            @click="handleRegister"
            class="w-full sm:w-auto px-10 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-violet-400 hover:text-violet-600 transition-all"
          >
            Register & Save Progress
          </button>
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
