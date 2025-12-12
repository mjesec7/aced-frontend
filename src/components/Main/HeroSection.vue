<template>
  <div class="min-h-screen bg-white relative overflow-hidden">
    <!-- Background decorations -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-[600px] h-[600px] bg-violet-100 rounded-full blur-3xl opacity-50"></div>
      <div class="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-amber-100 rounded-full blur-3xl opacity-50"></div>
    </div>

    <!-- Navigation -->
    <nav class="relative z-10 flex items-center justify-between px-6 lg:px-16 py-5 max-w-7xl mx-auto">
      <img src="@/assets/logo.png" alt="ACED" class="h-10 lg:h-12" />
      <UserSection />
    </nav>

    <!-- Hero Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-16">
      <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-100px)] py-12">

        <!-- Left side - Text content -->
        <div>
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100 mb-8">
            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span class="text-sm font-medium text-violet-700">2,800+ students already learning</span>
          </div>

          <!-- Main heading -->
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
            The smarter way to
            <span class="text-violet-600">learn anything</span>
          </h1>

          <!-- Subtitle -->
          <p class="text-xl lg:text-2xl text-gray-500 leading-relaxed mb-10 max-w-lg">
            Interactive lessons with AI-powered help. Learn at your own pace and actually enjoy the process.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 mb-12">
            <button
              @click="handleStartFree"
              class="px-10 py-4 bg-violet-600 text-white text-lg font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25"
            >
              Start Free - No Registration
            </button>
            <button
              @click="handleRegister"
              class="px-10 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-violet-400 hover:text-violet-600 transition-all"
            >
              Register & Save Progress
            </button>
          </div>

          <!-- Stats -->
          <div class="flex flex-wrap gap-8 lg:gap-12">
            <div>
              <div class="text-3xl lg:text-4xl font-bold text-gray-900">100+</div>
              <div class="text-gray-500">Courses</div>
            </div>
            <div>
              <div class="text-3xl lg:text-4xl font-bold text-gray-900">24/7</div>
              <div class="text-gray-500">AI Support</div>
            </div>
            <div>
              <div class="text-3xl lg:text-4xl font-bold text-gray-900">95%</div>
              <div class="text-gray-500">Completion</div>
            </div>
          </div>
        </div>

        <!-- Right side - Visual/Cards -->
        <div class="relative hidden lg:block">
          <!-- Main card -->
          <div class="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 border border-gray-100">
            <div class="space-y-6">
              <!-- Course preview card 1 -->
              <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div class="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="font-semibold text-gray-900">Mathematics</div>
                  <div class="text-sm text-gray-500">12 lessons • Beginner</div>
                </div>
                <span class="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Free</span>
              </div>

              <!-- Course preview card 2 -->
              <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div class="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="font-semibold text-gray-900">Languages</div>
                  <div class="text-sm text-gray-500">24 lessons • Intermediate</div>
                </div>
                <span class="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">Premium</span>
              </div>

              <!-- Course preview card 3 -->
              <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div class="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="font-semibold text-gray-900">Science</div>
                  <div class="text-sm text-gray-500">18 lessons • Advanced</div>
                </div>
                <span class="px-3 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">Pro</span>
              </div>
            </div>

            <!-- Bottom stats -->
            <div class="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="flex -space-x-2">
                  <div class="w-8 h-8 bg-violet-200 rounded-full border-2 border-white"></div>
                  <div class="w-8 h-8 bg-amber-200 rounded-full border-2 border-white"></div>
                  <div class="w-8 h-8 bg-green-200 rounded-full border-2 border-white"></div>
                </div>
                <span class="text-sm text-gray-500">2,800+ learners</span>
              </div>
              <div class="flex items-center gap-1 text-amber-500">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="font-semibold">4.9</span>
              </div>
            </div>
          </div>

          <!-- Floating elements -->
          <div class="absolute -top-4 -right-4 w-20 h-20 bg-amber-400 rounded-2xl rotate-12 opacity-80"></div>
          <div class="absolute -bottom-6 -left-6 w-16 h-16 bg-violet-500 rounded-xl -rotate-12 opacity-80"></div>
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
