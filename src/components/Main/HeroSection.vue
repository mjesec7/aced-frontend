<template>
  <div class="relative w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-hidden flex flex-col">
    <!-- Background orbs -->
    <div class="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-gradient-radial from-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-gradient-radial from-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

    <!-- Top Navigation -->
    <nav class="relative z-10 w-full h-20 flex justify-center items-center">
      <div class="max-w-7xl w-full px-6 md:px-12 flex justify-between items-center">
        <img src="@/assets/logo.png" alt="ACED Logo" class="h-12 md:h-14 w-auto" />
        <UserSection />
      </div>
    </nav>

    <!-- Main Hero Content -->
    <main class="flex-1 flex items-center justify-center px-6 md:px-12 pb-12 z-10">
      <div class="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        
        <!-- Left Side -->
        <div class="flex flex-col gap-8 text-center lg:text-left items-center lg:items-start">
          
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-full text-indigo-600 text-sm font-semibold">
            🎓 Proven Quality Education
          </div>

          <!-- Title & Subtitle -->
          <div class="flex flex-col gap-5">
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
              Your path to knowledge<br class="hidden sm:block" />
              starts here
            </h1>
            <p class="text-lg text-slate-600 max-w-xl leading-relaxed">
              Over 2,800 students are already learning on ACED. Join and get access to lessons right now — it takes 30 seconds
            </p>
          </div>

          <!-- Social Proof -->
          <div class="flex items-center gap-4 p-5 bg-white/80 backdrop-blur-xl border border-indigo-100 rounded-2xl shadow-lg shadow-indigo-500/5">
            <div class="flex -space-x-3">
              <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg border-2 border-white shadow-sm">👤</div>
              <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-lg border-2 border-white shadow-sm">👤</div>
              <div class="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-white text-lg border-2 border-white shadow-sm">👤</div>
              <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">+2.8K</div>
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-bold text-slate-900">2,844 students</span>
              <span class="text-sm text-slate-500">already learning and achieving results</span>
            </div>
          </div>

          <!-- Trust Badges -->
          <div class="flex flex-wrap gap-3 justify-center lg:justify-start">
            <div class="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 text-sm font-medium">
              <span class="text-emerald-600">✓</span>
              Free to start
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 text-sm font-medium">
              <span class="text-emerald-600">✓</span>
              No credit card required
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-700 text-sm font-medium">
              <span class="text-emerald-600">✓</span>
              Cancel anytime
            </div>
          </div>
        </div>

        <!-- Right Side - Cards -->
        <div class="flex items-center justify-center">
          <div class="flex flex-col gap-5 w-full max-w-md">
            
            <!-- Free Card -->
            <div 
              @click="handleStartFree"
              class="group relative p-8 bg-white/80 backdrop-blur-2xl rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20 border-2 border-indigo-500/20 hover:border-indigo-500/40 overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative z-10 flex flex-col gap-4">
                <h3 class="text-xl font-semibold text-slate-900">Try it free</h3>
                <p class="text-slate-600 leading-relaxed">Start learning right now. No cards, no commitments.</p>
                <span class="text-indigo-600 font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                  Start learning 
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </span>
              </div>
            </div>

            <!-- Premium Card -->
            <div 
              @click="handleRegister"
              class="group relative p-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/30 overflow-hidden"
            >
              <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative z-10 flex flex-col gap-4">
                <h3 class="text-xl font-semibold text-white">Sign up and save your progress</h3>
                <p class="text-indigo-100 leading-relaxed">Track achievements, earn certificates, learn anywhere.</p>
                <span class="text-white font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                  Create account 
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </span>
              </div>
              <!-- Shine effect -->
              <div class="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
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
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      }
    },
    
    handleRegister() {
      window.dispatchEvent(new Event("open-Login-modal"));
    }
  }
};
</script>