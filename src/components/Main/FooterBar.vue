<template>
  <footer class="bg-white py-20 lg:py-24" id="contacts">
    <div class="max-w-7xl mx-auto px-6 lg:px-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

        <!-- Brand Column -->
        <div class="lg:col-span-2">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <span class="text-xl font-bold text-gray-900">ACED</span>
          </div>
          <p class="text-gray-500 text-sm leading-relaxed mb-6 max-w-sm">
            Making education simple, interactive, and accessible for everyone.
          </p>
          <div class="flex gap-3">
            <a href="#" class="w-10 h-10 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-violet-50 hover:text-violet-600 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </a>
            <a href="#" class="w-10 h-10 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-violet-50 hover:text-violet-600 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="#" class="w-10 h-10 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-violet-50 hover:text-violet-600 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
          </div>
        </div>

        <!-- Navigation Column -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-4">Navigation</h4>
          <ul class="space-y-3">
            <li><a href="#about-us" class="text-gray-500 hover:text-violet-600 text-sm transition-colors">About Us</a></li>
            <li><a href="#aced" class="text-gray-500 hover:text-violet-600 text-sm transition-colors">Courses</a></li>
            <li><a href="#tariffs" class="text-gray-500 hover:text-violet-600 text-sm transition-colors">Pricing</a></li>
            <li><a href="#" @click.prevent="showAIHelperModal" class="text-gray-500 hover:text-violet-600 text-sm transition-colors">AI Assistant</a></li>
          </ul>
        </div>

        <!-- Contact Column -->
        <div>
          <h4 class="font-semibold text-gray-900 mb-4">Contact</h4>
          <ul class="space-y-3">
            <li class="text-gray-500 text-sm">@aced.live</li>
            <li>
              <a href="#" @click.prevent="showContactModal" class="text-violet-600 hover:text-violet-700 text-sm font-medium transition-colors">
                Contact Us
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer Bottom -->
      <div class="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <p class="text-gray-400 text-sm">
          2025 ACED. All rights reserved.
        </p>
        <div class="flex items-center gap-6">
          <a href="#" class="text-gray-400 hover:text-violet-600 text-sm transition-colors">Privacy Policy</a>
          <a href="#" class="text-gray-400 hover:text-violet-600 text-sm transition-colors">Terms of Service</a>
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
        <h3 class="text-xl font-bold text-gray-900 mb-2">AI Assistant</h3>
        <p class="text-gray-500 text-sm mb-6">
          Look for the chat bubble in the bottom right corner. Our AI is ready to help!
        </p>
        <button class="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors" @click="showAIModal = false">
          Got it
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
