<template>
  <section class="py-24 bg-white" id="tariffs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <h2 class="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
          Simple, transparent pricing
        </h2>
        <p class="text-lg text-slate-500">
          Choose the plan that fits your learning pace.
        </p>
      </div>

      <!-- Pricing Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        
        <!-- 1 Month Card -->
        <div class="flex flex-col p-8 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-colors duration-300">
          <div class="mb-4">
            <h3 class="text-xl font-semibold text-slate-900">Monthly</h3>
            <p class="text-slate-500 text-sm mt-1">Flexible, cancel anytime</p>
          </div>

          <div class="flex items-baseline gap-1 mb-6">
            <span class="text-4xl font-bold text-slate-900">250,000</span>
            <span class="text-base font-medium text-slate-500">UZS/mo</span>
          </div>

          <button 
            @click="handleSubscribe(1)"
            class="w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors mb-8"
          >
            Get Started
          </button>

          <div class="space-y-4 flex-1">
            <div v-for="(feature, i) in features" :key="i" class="flex items-start gap-3">
              <svg class="w-5 h-5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-sm text-slate-600">{{ feature }}</span>
            </div>
          </div>
        </div>

        <!-- 3 Months Card - POPULAR -->
        <div class="relative flex flex-col p-8 bg-slate-900 rounded-2xl shadow-xl transform md:-translate-y-4">
          <div class="absolute top-0 right-0 -mt-3 mr-3">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-500 text-white">
              POPULAR
            </span>
          </div>

          <div class="mb-4">
            <h3 class="text-xl font-semibold text-white">Quarterly</h3>
            <p class="text-slate-400 text-sm mt-1">Best value for serious learners</p>
          </div>

          <div class="flex items-baseline gap-1 mb-6">
            <span class="text-4xl font-bold text-white">675,000</span>
            <span class="text-base font-medium text-slate-400">UZS</span>
          </div>
          
          <div class="mb-6 text-sm text-indigo-300 font-medium">
            Save 10% vs Monthly
          </div>

          <button 
            @click="handleSubscribe(3)"
            class="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors mb-8 shadow-lg shadow-indigo-900/20"
          >
            Start Learning
          </button>

          <div class="space-y-4 flex-1">
            <div v-for="(feature, i) in features" :key="i" class="flex items-start gap-3">
              <svg class="w-5 h-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-sm text-slate-300">{{ feature }}</span>
            </div>
          </div>
        </div>

        <!-- 6 Months Card -->
        <div class="flex flex-col p-8 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-colors duration-300">
          <div class="mb-4">
            <h3 class="text-xl font-semibold text-slate-900">Biannual</h3>
            <p class="text-slate-500 text-sm mt-1">Maximum long-term savings</p>
          </div>

          <div class="flex items-baseline gap-1 mb-6">
            <span class="text-4xl font-bold text-slate-900">1,200,000</span>
            <span class="text-base font-medium text-slate-500">UZS</span>
          </div>

          <div class="mb-6 text-sm text-green-600 font-medium">
            Save 20% vs Monthly
          </div>

          <button 
            @click="handleSubscribe(6)"
            class="w-full py-3 px-4 bg-white border border-slate-200 text-slate-900 font-semibold rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all mb-8"
          >
            Subscribe
          </button>

          <div class="space-y-4 flex-1">
            <div v-for="(feature, i) in features" :key="i" class="flex items-start gap-3">
              <svg class="w-5 h-5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-sm text-slate-600">{{ feature }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Trust Indicators -->
      <div class="mt-16 pt-8 border-t border-slate-100 flex flex-wrap justify-center gap-x-12 gap-y-4">
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure payment
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cancel anytime
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
        'Access to all subjects',
        'Unlimited messages',
        'Unlimited images',
        'AI homework help',
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
        // Navigate to settings page as requested
        this.$router.push('/settings');
      }
    }
  }
};
</script>