<template>
  <section class="relative py-24 overflow-hidden bg-slate-50" id="tariffs">
    <!-- Background Elements -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-200/30 blur-[100px]"></div>
      <div class="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-200/30 blur-[100px]"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <div class="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold mb-6 shadow-sm">
          ✨ Simple Pricing
        </div>
        <h2 class="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
          Choose the perfect plan for your journey
        </h2>
        <p class="text-lg text-slate-600 leading-relaxed">
          Unlock your full potential with our flexible pricing options. No hidden fees, cancel anytime.
        </p>
      </div>

      <!-- Pricing Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        
        <!-- 1 Month Card -->
        <div class="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-200 to-slate-300 rounded-t-3xl"></div>
          
          <div class="mb-6">
            <h3 class="text-2xl font-bold text-slate-900 mb-2">Monthly</h3>
            <p class="text-slate-500">Perfect for trying out</p>
          </div>

          <div class="flex items-baseline gap-1 mb-8">
            <span class="text-4xl font-bold text-slate-900">250,000</span>
            <span class="text-lg font-semibold text-slate-500">UZS</span>
            <span class="text-sm text-slate-400 ml-1">/mo</span>
          </div>

          <ul class="space-y-4 mb-8">
            <li v-for="(feature, i) in features" :key="i" class="flex items-start gap-3 text-slate-600">
              <svg class="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span class="text-sm font-medium">{{ feature }}</span>
            </li>
          </ul>

          <button 
            @click="handleSubscribe(1)"
            class="w-full py-4 rounded-xl bg-slate-50 text-slate-900 font-bold border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 group-hover:shadow-md"
          >
            Get Started
          </button>
        </div>

        <!-- 3 Months Card - POPULAR -->
        <div class="relative bg-white rounded-3xl p-8 border-2 border-indigo-500 shadow-2xl scale-105 z-10">
          <div class="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-indigo-500/30">
            MOST POPULAR
          </div>
          
          <div class="mb-6 mt-2">
            <h3 class="text-2xl font-bold text-slate-900 mb-2">Quarterly</h3>
            <p class="text-indigo-600 font-medium">Best value for learners</p>
          </div>

          <div class="flex items-baseline gap-1 mb-2">
            <span class="text-5xl font-bold text-slate-900 tracking-tight">675,000</span>
            <span class="text-xl font-semibold text-slate-500">UZS</span>
          </div>
          <div class="flex items-center gap-2 mb-8 text-sm">
            <span class="text-slate-500">225,000 UZS/mo</span>
            <span class="bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold text-xs">SAVE 10%</span>
          </div>

          <ul class="space-y-4 mb-8">
            <li v-for="(feature, i) in features" :key="i" class="flex items-start gap-3 text-slate-700">
              <div class="p-0.5 rounded-full bg-indigo-100 text-indigo-600">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span class="text-sm font-semibold">{{ feature }}</span>
            </li>
          </ul>

          <button 
            @click="handleSubscribe(3)"
            class="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            Start Learning Now
          </button>
        </div>

        <!-- 6 Months Card -->
        <div class="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-t-3xl"></div>
          
          <div class="mb-6">
            <h3 class="text-2xl font-bold text-slate-900 mb-2">Biannual</h3>
            <p class="text-slate-500">Maximum savings</p>
          </div>

          <div class="flex items-baseline gap-1 mb-2">
            <span class="text-4xl font-bold text-slate-900">1,200,000</span>
            <span class="text-lg font-semibold text-slate-500">UZS</span>
          </div>
          <div class="flex items-center gap-2 mb-8 text-sm">
            <span class="text-slate-500">200,000 UZS/mo</span>
            <span class="bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold text-xs">SAVE 20%</span>
          </div>

          <ul class="space-y-4 mb-8">
            <li v-for="(feature, i) in features" :key="i" class="flex items-start gap-3 text-slate-600">
              <svg class="w-5 h-5 text-purple-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span class="text-sm font-medium">{{ feature }}</span>
            </li>
          </ul>

          <button 
            @click="handleSubscribe(6)"
            class="w-full py-4 rounded-xl bg-white text-slate-900 font-bold border-2 border-slate-100 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200"
          >
            Subscribe
          </button>
        </div>

      </div>

      <!-- Trust Badges -->
      <div class="mt-16 flex flex-wrap justify-center gap-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
        <div class="flex items-center gap-2 text-slate-500 font-medium">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          Secure Payment
        </div>
        <div class="flex items-center gap-2 text-slate-500 font-medium">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Cancel Anytime
        </div>
        <div class="flex items-center gap-2 text-slate-500 font-medium">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Instant Access
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