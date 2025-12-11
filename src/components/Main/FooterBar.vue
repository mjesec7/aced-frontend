<template>
  <footer class="relative bg-white pt-24 pb-12 overflow-hidden" id="contacts">
    <!-- Background Elements -->
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div class="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
      <div class="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-50/50 to-purple-50/50 blur-[100px]"></div>
      <div class="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-yellow-50/50 to-amber-50/50 blur-[100px]"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        
        <!-- Brand Column -->
        <div class="lg:col-span-2">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20">
              A
            </div>
            <span class="text-2xl font-extrabold text-slate-900 tracking-tight">ACED</span>
          </div>
          <p class="text-slate-500 text-lg leading-relaxed mb-8 max-w-md">
            Next generation education. We're here to help you grow and achieve your goals with our interactive platform.
          </p>
          <div class="flex gap-4">
            <a href="#" class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 hover:scale-110 transition-all duration-300">
              📱
            </a>
            <a href="#" class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100 hover:scale-110 transition-all duration-300">
              💬
            </a>
            <a href="#" class="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center hover:bg-yellow-100 hover:scale-110 transition-all duration-300">
              📧
            </a>
          </div>
        </div>

        <!-- Navigation Column -->
        <div>
          <h4 class="font-bold text-slate-900 mb-6">Navigation</h4>
          <ul class="space-y-4">
            <li><a href="#about-us" class="text-slate-500 hover:text-indigo-600 font-medium transition-colors">About Us</a></li>
            <li><a href="#aced" class="text-slate-500 hover:text-indigo-600 font-medium transition-colors">Courses</a></li>
            <li><a href="#tariffs" class="text-slate-500 hover:text-indigo-600 font-medium transition-colors">Pricing</a></li>
            <li><a href="#" @click.prevent="showAIHelperModal" class="text-slate-500 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2">
              AI Assistant <span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase">New</span>
            </a></li>
          </ul>
        </div>

        <!-- Contact Column -->
        <div>
          <h4 class="font-bold text-slate-900 mb-6">Contact</h4>
          <ul class="space-y-4">
            <li class="flex items-center gap-3 text-slate-500">
              <span class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-lg">📱</span>
              <span class="font-medium">@aced.live</span>
            </li>
            <li>
              <a href="#" @click.prevent="showContactModal" class="flex items-center gap-3 text-slate-500 hover:text-indigo-600 transition-colors group">
                <span class="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-lg transition-colors">✉️</span>
                <span class="font-medium">Contact Us</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <p class="text-slate-400 font-medium text-sm">
          © 2025 ACED. All rights reserved.
        </p>
        <div class="flex items-center gap-8">
          <a href="#" class="text-slate-400 hover:text-indigo-600 text-sm font-medium transition-colors">Privacy Policy</a>
          <a href="#" class="text-slate-400 hover:text-indigo-600 text-sm font-medium transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <div v-if="showAIModal || showContact" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click.self="closeModals">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>
      
      <!-- AI Modal -->
      <div v-if="showAIModal" class="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 text-center transform transition-all animate-slide-up">
        <button class="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" @click="showAIModal = false">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        <div class="w-20 h-20 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl mb-6 animate-bounce">
          🤖
        </div>
        <h3 class="text-2xl font-bold text-slate-900 mb-4">AI Assistant</h3>
        <p class="text-slate-500 mb-8 leading-relaxed">
          Our AI assistant is located in the bottom right corner of the screen. Just click on the robot icon and it will be happy to help you!
        </p>
        <button class="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25" @click="showAIModal = false">
          Got it!
        </button>
      </div>

      <ContactModal v-if="showContact" @close="showContact = false" />
    </div>
  </footer>
</template>

<script>
import ContactModal from '../Modals/ContactsModal.vue';

export default {
  name: 'FooterBar',
  components: {
    ContactModal
  },
  data() {
    return {
      showAIModal: false,
      showContact: false
    };
  },
  methods: {
    showAIHelperModal() {
      this.showAIModal = true;
    },
    showContactModal() {
      this.showContact = true;
    },
    closeModals() {
      this.showAIModal = false;
      this.showContact = false;
    }
  }
};
</script>

<style scoped>
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out forwards;
}
</style>