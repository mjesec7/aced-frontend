<template>
  <section class="relative py-24 bg-white overflow-hidden" id="tariffs">
    <!-- Vibrant Background Elements -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div class="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-purple-100/40 to-yellow-100/40 blur-[100px]"></div>
      <div class="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-100/40 to-amber-100/40 blur-[100px]"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <div class="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-yellow-500/10 border border-indigo-100 text-indigo-600 text-sm font-bold mb-6 shadow-sm">
          ✨ Flexible Plans
        </div>
        <h2 class="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
          Choose your <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-yellow-500">perfect path</span>
        </h2>
        <p class="text-lg text-slate-600 leading-relaxed">
          Unlock premium features and accelerate your learning with our tailored subscription plans.
        </p>
      </div>

      <!-- Pricing Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        
        <!-- 1 Month Card -->
        <div class="group relative flex flex-col p-8 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-indigo-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10">
          <div class="mb-6">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              🚀
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-2">Monthly</h3>
            <p class="text-slate-500">Perfect for getting started</p>
          </div>

          <div class="flex items-baseline gap-1 mb-8">
            <span class="text-4xl font-bold text-slate-900">250,000</span>
            <span class="text-lg font-semibold text-slate-500">UZS</span>
            <span class="text-sm text-slate-400 ml-1">/mo</span>
          </div>

          <button 
            @click="handleSubscribe(1)"
            class="w-full py-4 rounded-xl bg-slate-50 text-indigo-600 font-bold border-2 border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all duration-200 mb-8"
          >
            Get Started
          </button>

          <div class="space-y-4 flex-1">
            <div v-for="(feature, i) in features" :key="i" class="flex items-start gap-3">
              <div class="p-1 rounded-full bg-indigo-100 text-indigo-600 mt-0.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-sm font-medium text-slate-600">{{ feature }}</span>
            </div>
          </div>
        </div>

        <!-- 3 Months Card - POPULAR -->
        <div class="relative flex flex-col p-1 rounded-[2rem] bg-gradient-to-b from-indigo-500 via-purple-500 to-yellow-500 shadow-2xl shadow-purple-500/20 transform md:-translate-y-4 z-10">
          <div class="absolute top-0 left-1/2 -translate-x-1/2 -mt-4">
            <span class="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white shadow-lg uppercase tracking-wider border border-white/20">
              Most Popular
            </span>
          </div>
          
          <div class="flex-1 flex flex-col p-8 rounded-[1.8rem] bg-white h-full">
            <div class="mb-6">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-2xl mb-4 shadow-lg shadow-indigo-500/30">
                💎
              </div>
              <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">Quarterly</h3>
              <p class="text-slate-500">Best value for learners</p>
            </div>

            <div class="flex items-baseline gap-1 mb-2">
              <span class="text-5xl font-bold text-slate-900 tracking-tight">675,000</span>
              <span class="text-xl font-semibold text-slate-500">UZS</span>
            </div>
            <div class="mb-8 flex items-center gap-2">
              <span class="text-sm text-slate-400 line-through">750,000</span>
              <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-green-100 text-green-700">SAVE 10%</span>
            </div>

            <button 
              @click="handleSubscribe(3)"
              class="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-200 mb-8"
            >
              Start Learning Now
            </button>

            <div class="space-y-4 flex-1">
              <div v-for="(feature, i) in features" :key="i" class="flex items-start gap-3">
                <div class="p-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white mt-0.5 shadow-sm">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-sm font-bold text-slate-700">{{ feature }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 6 Months Card -->
        <div class="group relative flex flex-col p-8 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-yellow-400 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-500/10">
          <div class="mb-6">
            <div class="w-12 h-12 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
              👑
            </div>
            <h3 class="text-2xl font-bold text-slate-900 mb-2">Biannual</h3>
            <p class="text-slate-500">Maximum savings</p>
          </div>

          <div class="flex items-baseline gap-1 mb-2">
            <span class="text-4xl font-bold text-slate-900">1,200,000</span>
            <span class="text-lg font-semibold text-slate-500">UZS</span>
          </div>
          <div class="mb-8 flex items-center gap-2">
            <span class="text-sm text-slate-400 line-through">1,500,000</span>
            <span class="text-xs font-bold px-2.5 py-1 rounded-lg bg-green-100 text-green-700">SAVE 20%</span>
          </div>

          <button 
            @click="handleSubscribe(6)"
            class="w-full py-4 rounded-xl bg-slate-50 text-yellow-600 font-bold border-2 border-slate-100 hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-700 transition-all duration-200 mb-8"
          >
            Subscribe
          </button>

          <div class="space-y-4 flex-1">
            <div v-for="(feature, i) in features" :key="i" class="flex items-start gap-3">
              <div class="p-1 rounded-full bg-yellow-100 text-yellow-600 mt-0.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-sm font-medium text-slate-600">{{ feature }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Trust Indicators -->
      <div class="mt-16 flex flex-wrap justify-center gap-8">
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure payment
        </div>
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <svg class="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Cancel anytime
        </div>
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <svg class="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
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