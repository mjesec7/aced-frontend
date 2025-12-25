<template>
  <footer class="bg-white py-20 lg:py-24" id="contacts">
    <div class="max-w-7xl mx-auto px-6 lg:px-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

        <!-- Brand Column -->
        <div class="lg:col-span-2">
          <div class="flex items-center gap-3 mb-4">
            <img src="@/assets/logo.png" alt="ACED" class="h-10 w-10 object-contain" />
            <span class="text-xl font-bold text-gray-900">ACED</span>
          </div>
          <p class="text-gray-500 text-sm leading-relaxed mb-6 max-w-sm">
            {{ $t('footer.slogan') }}
          </p>
          <div class="flex gap-3">
            <!-- Instagram -->
            <a href="https://instagram.com/aced.live" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-violet-50 hover:text-violet-600 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <!-- TikTok -->
            <a href="https://tiktok.com/@aced.live" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-violet-50 hover:text-violet-600 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
            </a>
            <!-- Telegram -->
            <a href="https://t.me/aced_live" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-violet-50 hover:text-violet-600 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </a>
          </div>
        </div>

        <!-- Navigation Column -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-4">{{ $t('footer.navigation') }}</h4>
          <ul class="space-y-3">
            <li><a href="#about-us" class="text-gray-500 hover:text-violet-600 text-sm transition-colors">{{ $t('footer.aboutUs') }}</a></li>
            <li><a href="#aced" class="text-gray-500 hover:text-violet-600 text-sm transition-colors">{{ $t('footer.courses') }}</a></li>
            <li><a href="#tariffs" class="text-gray-500 hover:text-violet-600 text-sm transition-colors">{{ $t('footer.pricing') }}</a></li>
            <li><a href="#" @click.prevent="showAIHelperModal" class="text-gray-500 hover:text-violet-600 text-sm transition-colors">{{ $t('footer.aiAssistant') }}</a></li>
          </ul>
        </div>

        <!-- Contact Column -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-4">{{ $t('footer.contact') }}</h4>
          <ul class="space-y-3">
            <li class="text-gray-500 text-sm">@aced.live</li>
            <li>
              <a href="#" @click.prevent="showContactModal" class="text-violet-600 hover:text-violet-700 text-sm font-medium transition-colors">
                {{ $t('footer.contactUs') }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-gray-400 text-sm">
          {{ $t('footer.allRights') }}
        </p>
        <div class="flex items-center gap-6">
          <a href="/privacy-policy.html" target="_blank" class="text-gray-400 hover:text-violet-600 text-sm transition-colors">{{ $t('footer.privacyPolicy') }}</a>
          <a href="/terms-of-service.html" target="_blank" class="text-gray-400 hover:text-violet-600 text-sm transition-colors">{{ $t('footer.termsOfService') }}</a>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <div v-if="showAIModal || showContact" class="fixed inset-0 z-[100] flex items-center justify-center p-4" @click.self="closeModals">
      <div class="absolute inset-0 bg-gray-900/50"></div>

      <!-- AI Modal -->
      <div v-if="showAIModal" class="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600" @click="showAIModal = false">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div class="w-16 h-16 mx-auto bg-violet-100 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">{{ $t('footer.aiHelperTitle') }}</h3>
        <p class="text-gray-500 text-sm mb-6">
          {{ $t('footer.aiHelperText') }}
        </p>
        <button class="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors" @click="showAIModal = false">
          {{ $t('footer.gotIt') }}
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
