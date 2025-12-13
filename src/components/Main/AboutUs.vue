<template>
  <section class="py-20 lg:py-24 bg-white">
    <div class="max-w-7xl mx-auto px-6 lg:px-16">
      <!-- Section header -->
      <div class="text-center mb-20">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100 mb-8">
          <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
          <span class="text-sm font-medium text-violet-700">Why Choose Us</span>
        </div>
        <div class="flex flex-col gap-4">
          <h2 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900">
            Learning made <span class="text-violet-600">simple</span>
          </h2>
          <p class="text-lg lg:text-xl text-gray-500 max-w-2xl mx-auto">
            We've built an education platform that's effective, engaging, and easy to use
          </p>
        </div>
      </div>

      <!-- Features grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div class="bg-gray-50 rounded-2xl p-8 hover:bg-violet-50 transition-colors">
          <div class="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Interactive Learning</h3>
          <p class="text-gray-500 leading-relaxed">
            Hands-on exercises with instant feedback. No boring lectures.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="bg-gray-50 rounded-2xl p-8 hover:bg-amber-50 transition-colors">
          <div class="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">AI-Powered Help</h3>
          <p class="text-gray-500 leading-relaxed">
            Our AI tutor is available 24/7 to explain concepts clearly.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="bg-gray-50 rounded-2xl p-8 hover:bg-violet-50 transition-colors">
          <div class="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Track Progress</h3>
          <p class="text-gray-500 leading-relaxed">
            See your growth with analytics. Earn badges as you level up.
          </p>
        </div>

        <!-- Feature 4 -->
        <div class="bg-gray-50 rounded-2xl p-8 hover:bg-amber-50 transition-colors">
          <div class="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Rich Content</h3>
          <p class="text-gray-500 leading-relaxed">
            100+ courses in math, science, languages. New content weekly.
          </p>
        </div>

        <!-- Feature 5 -->
        <div class="bg-gray-50 rounded-2xl p-8 hover:bg-violet-50 transition-colors">
          <div class="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-7 h-7 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Learn Anytime</h3>
          <p class="text-gray-500 leading-relaxed">
            Access on any device. Progress syncs automatically.
          </p>
        </div>

        <!-- Feature 6 -->
        <div class="bg-gray-50 rounded-2xl p-8 hover:bg-amber-50 transition-colors">
          <div class="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Actually Fun</h3>
          <p class="text-gray-500 leading-relaxed">
            Learning that doesn't feel like a chore. Stay motivated.
          </p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div class="text-center">
          <div class="text-5xl font-bold text-violet-600 mb-2">2,800+</div>
          <div class="text-gray-500 text-lg">Active Students</div>
        </div>
        <div class="text-center">
          <div class="text-5xl font-bold text-amber-500 mb-2">100+</div>
          <div class="text-gray-500 text-lg">Courses</div>
        </div>
        <div class="text-center">
          <div class="text-5xl font-bold text-violet-600 mb-2">95%</div>
          <div class="text-gray-500 text-lg">Completion Rate</div>
        </div>
        <div class="text-center">
          <div class="text-5xl font-bold text-amber-500 mb-2">24/7</div>
          <div class="text-gray-500 text-lg">AI Support</div>
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
