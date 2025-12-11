<template>
  <section class="py-24 bg-gradient-to-b from-amber-50/30 to-white relative overflow-hidden" id="tariffs">
    <!-- Decorative elements -->
    <div class="absolute top-20 right-10 w-80 h-80 bg-gradient-to-br from-teal-200/40 to-cyan-200/40 rounded-full blur-3xl"></div>
    <div class="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-full blur-3xl"></div>

    <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-full mb-6">
          <span class="w-2 h-2 bg-teal-400 rounded-full"></span>
          <span class="text-sm font-semibold text-teal-700">Simple Pricing</span>
        </div>
        <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Pick your
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">plan</span>
        </h2>
        <p class="text-xl text-gray-600">
          No hidden fees. Cancel anytime. Start learning today.
        </p>
      </div>

      <!-- Pricing Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">

        <!-- 1 Month Card -->
        <div class="group relative bg-white rounded-3xl border-2 border-gray-100 hover:border-orange-300 p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
          <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-pink-500 rounded-t-3xl"></div>

          <div class="mb-8">
            <h3 class="text-xl font-bold text-gray-900 mb-2">Monthly</h3>
            <p class="text-gray-500 text-sm">Great for trying out</p>
          </div>

          <div class="mb-8">
            <div class="flex items-baseline gap-1">
              <span class="text-5xl font-bold text-gray-900">250K</span>
              <span class="text-lg font-semibold text-gray-400">UZS</span>
            </div>
            <div class="text-sm text-gray-500 mt-1">per month</div>
          </div>

          <button
            @click="handleSubscribe(1)"
            class="w-full py-4 px-6 bg-gray-50 text-gray-900 font-bold rounded-2xl border-2 border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 mb-8"
          >
            Get Started
          </button>

          <div class="space-y-4">
            <div v-for="(feature, i) in features" :key="i" class="flex items-center gap-3">
              <div class="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span class="text-sm text-gray-600">{{ feature }}</span>
            </div>
          </div>
        </div>

        <!-- 3 Months Card - POPULAR -->
        <div class="group relative bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/25 hover:-translate-y-2 transform md:-translate-y-4">
          <!-- Popular badge -->
          <div class="absolute -top-4 left-1/2 -translate-x-1/2">
            <div class="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-lg">
              <span class="text-xs font-bold text-white uppercase tracking-wide">Most Popular</span>
            </div>
          </div>

          <div class="mb-8 pt-4">
            <h3 class="text-xl font-bold text-white mb-2">Quarterly</h3>
            <p class="text-teal-100 text-sm">Best for committed learners</p>
          </div>

          <div class="mb-2">
            <div class="flex items-baseline gap-1">
              <span class="text-5xl font-bold text-white">675K</span>
              <span class="text-lg font-semibold text-teal-200">UZS</span>
            </div>
            <div class="text-sm text-teal-100 mt-1">for 3 months</div>
          </div>

          <div class="mb-8">
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-sm font-semibold">
              Save 10%
            </span>
          </div>

          <button
            @click="handleSubscribe(3)"
            class="w-full py-4 px-6 bg-white text-teal-600 font-bold rounded-2xl hover:bg-teal-50 transition-all duration-300 shadow-lg mb-8"
          >
            Start Learning
          </button>

          <div class="space-y-4">
            <div v-for="(feature, i) in features" :key="i" class="flex items-center gap-3">
              <div class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span class="text-sm text-white/90">{{ feature }}</span>
            </div>
          </div>
        </div>

        <!-- 6 Months Card -->
        <div class="group relative bg-white rounded-3xl border-2 border-gray-100 hover:border-violet-300 p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
          <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-400 to-purple-500 rounded-t-3xl"></div>

          <div class="mb-8">
            <h3 class="text-xl font-bold text-gray-900 mb-2">Biannual</h3>
            <p class="text-gray-500 text-sm">Maximum savings</p>
          </div>

          <div class="mb-2">
            <div class="flex items-baseline gap-1">
              <span class="text-5xl font-bold text-gray-900">1.2M</span>
              <span class="text-lg font-semibold text-gray-400">UZS</span>
            </div>
            <div class="text-sm text-gray-500 mt-1">for 6 months</div>
          </div>

          <div class="mb-8">
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-lime-100 to-emerald-100 text-emerald-700 text-sm font-semibold">
              Save 20%
            </span>
          </div>

          <button
            @click="handleSubscribe(6)"
            class="w-full py-4 px-6 bg-gray-50 text-gray-900 font-bold rounded-2xl border-2 border-gray-100 hover:border-violet-300 hover:bg-violet-50 transition-all duration-300 mb-8"
          >
            Subscribe
          </button>

          <div class="space-y-4">
            <div v-for="(feature, i) in features" :key="i" class="flex items-center gap-3">
              <div class="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg class="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <span class="text-sm text-gray-600">{{ feature }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Trust Indicators -->
      <div class="mt-16 flex flex-wrap justify-center gap-8 lg:gap-16">
        <div class="flex items-center gap-3 text-gray-500">
          <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span class="font-semibold">Secure payment</span>
        </div>
        <div class="flex items-center gap-3 text-gray-500">
          <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <span class="font-semibold">Cancel anytime</span>
        </div>
        <div class="flex items-center gap-3 text-gray-500">
          <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span class="font-semibold">Instant access</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'TariffSection',

  data() {
    return {
      features: [
        'All subjects included',
        'Unlimited AI help',
        'Progress tracking',
        'Homework assistance',
        'Priority support'
      ]
    }
  },

  computed: {
    ...mapGetters(['getUser']),
    isAuthenticated() {
      return !!this.getUser;
    }
  },

  methods: {
    handleSubscribe(duration) {
      if (!this.isAuthenticated) {
        window.dispatchEvent(new CustomEvent("open-Login-modal"));
      } else {
        this.$router.push('/settings');
      }
    }
  }
};
</script>
