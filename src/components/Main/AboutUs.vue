<template>
  <section class="py-24 bg-white relative overflow-hidden">
    <!-- Decorative elements -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
    <div class="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>

    <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
      <!-- Section header -->
      <div class="text-center mb-20">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full mb-6">
          <span class="w-2 h-2 bg-teal-400 rounded-full"></span>
          <span class="text-sm font-semibold text-teal-700">Why Choose Us</span>
        </div>
        <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          Learning should feel like
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">play</span>
        </h2>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          We've reimagined education to be engaging, effective, and actually enjoyable
        </p>
      </div>

      <!-- Features grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div class="group p-8 bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl border border-orange-100 hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Interactive Learning</h3>
          <p class="text-gray-600 leading-relaxed">
            No boring lectures here. Every lesson is hands-on with instant feedback and gamified progress.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="group p-8 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl border border-teal-100 hover:shadow-xl hover:shadow-teal-100/50 transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">AI-Powered Help</h3>
          <p class="text-gray-600 leading-relaxed">
            Stuck on a problem? Our AI tutor is available 24/7 to explain concepts in a way that clicks.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="group p-8 bg-gradient-to-br from-lime-50 to-emerald-50 rounded-3xl border border-lime-100 hover:shadow-xl hover:shadow-lime-100/50 transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-lime-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Track Progress</h3>
          <p class="text-gray-600 leading-relaxed">
            See your growth with detailed analytics. Earn badges and certificates as you level up.
          </p>
        </div>

        <!-- Feature 4 -->
        <div class="group p-8 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl border border-pink-100 hover:shadow-xl hover:shadow-pink-100/50 transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Rich Content</h3>
          <p class="text-gray-600 leading-relaxed">
            Over 100+ courses covering math, science, languages, and more. New content added weekly.
          </p>
        </div>

        <!-- Feature 5 -->
        <div class="group p-8 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border border-violet-100 hover:shadow-xl hover:shadow-violet-100/50 transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-violet-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Learn Anytime</h3>
          <p class="text-gray-600 leading-relaxed">
            Access lessons on any device. Your progress syncs automatically across all platforms.
          </p>
        </div>

        <!-- Feature 6 -->
        <div class="group p-8 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl border border-amber-100 hover:shadow-xl hover:shadow-amber-100/50 transition-all duration-300 hover:-translate-y-1">
          <div class="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Fun First</h3>
          <p class="text-gray-600 leading-relaxed">
            Learning shouldn't feel like a chore. We make education addictive in the best way possible.
          </p>
        </div>
      </div>

      <!-- Stats section -->
      <div class="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div class="text-center p-6">
          <div class="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-2">2,800+</div>
          <div class="text-gray-600 font-medium">Active Students</div>
        </div>
        <div class="text-center p-6">
          <div class="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500 mb-2">100+</div>
          <div class="text-gray-600 font-medium">Courses</div>
        </div>
        <div class="text-center p-6">
          <div class="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-emerald-500 mb-2">95%</div>
          <div class="text-gray-600 font-medium">Completion Rate</div>
        </div>
        <div class="text-center p-6">
          <div class="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500 mb-2">24/7</div>
          <div class="text-gray-600 font-medium">AI Support</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AboutUs'
};
</script>
