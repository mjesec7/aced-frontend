<template>
  <section class="py-24 bg-white" id="tariffs">
    <div class="max-w-7xl mx-auto px-6 lg:px-16">
      <!-- Header -->
      <div class="text-center mb-20">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full border border-violet-100 mb-5">
          <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
          <span class="text-sm font-medium text-violet-700">Pricing</span>
        </div>
        <h2 class="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
          Simple <span class="text-violet-600">pricing</span>
        </h2>
        <p class="text-xl text-gray-500">
          No hidden fees. Cancel anytime.
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">

        <!-- 1 Month -->
        <div class="bg-white rounded-2xl border border-gray-100 p-8 hover:border-violet-200 transition-colors">
          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-1">Monthly</h3>
            <p class="text-gray-500 text-sm">Great for trying out</p>
          </div>

          <div class="mb-6">
            <span class="text-4xl font-bold text-gray-900">250K</span>
            <span class="text-gray-500 ml-1">UZS/mo</span>
          </div>

          <button
            @click="handleSubscribe(1)"
            class="w-full py-3 px-6 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-violet-500 hover:text-violet-600 transition-all mb-6"
          >
            Get Started
          </button>

          <ul class="space-y-3">
            <li v-for="(feature, i) in features" :key="i" class="flex items-center gap-3 text-sm text-gray-600">
              <svg class="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              {{ feature }}
            </li>
          </ul>
        </div>

        <!-- 3 Months - Popular -->
        <div class="bg-white rounded-2xl p-8 relative md:-translate-y-4 ring-2 ring-violet-500 shadow-xl shadow-violet-500/10">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2">
            <span class="px-4 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-full shadow-lg">POPULAR</span>
          </div>

          <div class="mb-6 pt-2">
            <h3 class="text-lg font-bold text-gray-900 mb-1">Quarterly</h3>
            <p class="text-gray-500 text-sm">Best value</p>
          </div>

          <div class="mb-2">
            <span class="text-4xl font-bold text-gray-900">675K</span>
            <span class="text-gray-500 ml-1">UZS</span>
          </div>
          <div class="mb-6">
            <span class="text-sm text-gray-500">for 3 months</span>
            <span class="ml-2 px-2 py-0.5 bg-amber-100 rounded text-xs text-amber-700 font-medium">Save 10%</span>
          </div>

          <button
            @click="handleSubscribe(3)"
            class="w-full py-3 px-6 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors mb-6 shadow-lg shadow-violet-600/20"
          >
            Start Learning
          </button>

          <ul class="space-y-3">
            <li v-for="(feature, i) in features" :key="i" class="flex items-center gap-3 text-sm text-gray-600">
              <svg class="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              {{ feature }}
            </li>
          </ul>
        </div>

        <!-- 6 Months -->
        <div class="bg-white rounded-2xl border border-gray-100 p-8 hover:border-violet-200 transition-colors">
          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-1">Biannual</h3>
            <p class="text-gray-500 text-sm">Maximum savings</p>
          </div>

          <div class="mb-2">
            <span class="text-4xl font-bold text-gray-900">1.2M</span>
            <span class="text-gray-500 ml-1">UZS</span>
          </div>
          <div class="mb-6">
            <span class="text-sm text-gray-500">for 6 months</span>
            <span class="ml-2 px-2 py-0.5 bg-amber-100 rounded text-xs text-amber-700 font-medium">Save 20%</span>
          </div>

          <button
            @click="handleSubscribe(6)"
            class="w-full py-3 px-6 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-violet-500 hover:text-violet-600 transition-all mb-6"
          >
            Subscribe
          </button>

          <ul class="space-y-3">
            <li v-for="(feature, i) in features" :key="i" class="flex items-center gap-3 text-sm text-gray-600">
              <svg class="w-5 h-5 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              {{ feature }}
            </li>
          </ul>
        </div>

      </div>

      <!-- Trust -->
      <div class="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
        <span class="flex items-center gap-2">
          <svg class="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure payment
        </span>
        <span class="flex items-center gap-2">
          <svg class="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Cancel anytime
        </span>
        <span class="flex items-center gap-2">
          <svg class="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Instant access
        </span>
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
