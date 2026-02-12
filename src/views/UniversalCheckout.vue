<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center p-4 md:p-8">
    <div class="bg-white rounded-2xl shadow-xl shadow-indigo-500/5 max-w-2xl w-full overflow-hidden">
      
      <!-- Payment Success View -->
      <div v-if="paymentStatus === 'success'" class="p-8 md:p-12 text-center">
        <div class="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 mb-2">{{ $t('checkout.paymentSuccessful') }}</h1>
        <p class="text-slate-600 mb-8">{{ $t('checkout.subscriptionActivated', { plan: planName }) }}</p>

        <div class="bg-slate-50 rounded-xl p-5 mb-8 text-left space-y-3">
          <div class="flex justify-between items-center py-2 border-b border-slate-200">
            <span class="text-sm text-slate-500">{{ $t('checkout.plan') }}</span>
            <span class="font-semibold text-slate-900">{{ planName }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-slate-200">
            <span class="text-sm text-slate-500">{{ $t('checkout.amount') }}</span>
            <span class="font-semibold text-indigo-600">{{ formatAmount(finalAmount) }}</span>
          </div>
          <div v-if="transactionId" class="flex justify-between items-center py-2">
            <span class="text-sm text-slate-500">{{ $t('checkout.transactionId') }}</span>
            <span class="font-mono text-sm text-slate-600">{{ transactionId }}</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button @click="goToSettings" class="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
            {{ $t('checkout.viewSubscription') }}
          </button>
          <button @click="goToDashboard" class="px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all">
            {{ $t('checkout.startLearning') }}
          </button>
        </div>
      </div>

      <!-- Payment Failed View -->
      <div v-else-if="paymentStatus === 'failed'" class="p-8 md:p-12 text-center">
        <div class="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 mb-2">{{ $t('checkout.paymentFailed') }}</h1>
        <p class="text-slate-600 mb-8">{{ failureReason || $t('checkout.couldNotProcess') }}</p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button @click="retryPayment" class="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
            {{ $t('checkout.tryAgain') }}
          </button>
          <button @click="goBack" class="px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all">
            {{ $t('checkout.changeMethod') }}
          </button>
        </div>
      </div>

      <!-- Payment Cancelled View -->
      <div v-else-if="paymentStatus === 'cancelled'" class="p-8 md:p-12 text-center">
        <div class="w-20 h-20 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 mb-2">{{ $t('checkout.paymentCancelled') }}</h1>
        <p class="text-slate-600 mb-8">{{ $t('checkout.cancelledMessage') }}</p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button @click="retryPayment" class="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
            {{ $t('checkout.returnToPayment') }}
          </button>
          <button @click="goHome" class="px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all">
            {{ $t('checkout.backToHome') }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="p-8 md:p-12 text-center">
        <div class="w-16 h-16 mx-auto mb-6 relative">
          <div class="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
          <div class="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 class="text-xl font-semibold text-slate-900 mb-2">{{ loadingMessage }}</h2>
        <p class="text-slate-500 mb-6">Please wait while we prepare your payment...</p>
        
        <div v-if="userName" class="bg-slate-50 rounded-xl p-4 text-left space-y-2">
          <div class="flex justify-between"><span class="text-sm text-slate-500">User</span><span class="text-sm font-medium text-slate-700">{{ finalUserName }}</span></div>
          <div class="flex justify-between"><span class="text-sm text-slate-500">Plan</span><span class="text-sm font-medium text-slate-700">{{ planName }}</span></div>
          <div class="flex justify-between"><span class="text-sm text-slate-500">Amount</span><span class="text-sm font-medium text-indigo-600">{{ formatAmount(finalAmount) }}</span></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-8 md:p-12 text-center">
        <div class="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-slate-900 mb-2">{{ $t('checkout.unableToProcess') }}</h2>
        <p class="text-slate-600 mb-6">{{ error }}</p>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button @click="retryPayment" class="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
            {{ $t('checkout.tryAgain') }}
          </button>
          <button @click="goBack" class="px-6 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all">
            {{ $t('checkout.goBack') }}
          </button>
        </div>
      </div>

      <!-- Main Checkout View -->
      <div v-else class="p-6 md:p-8">
        <!-- Header -->
        <div class="text-center mb-8 pb-6 border-b border-slate-100">
          <div class="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <img src="@/assets/logo.png" alt="ACED" class="w-full h-full object-contain" />
          </div>
          <h1 class="text-2xl font-bold text-slate-900 mb-1">{{ $t('checkout.title') }}</h1>
          <p class="text-slate-500">{{ $t('checkout.subtitle') }}</p>
        </div>

        <!-- Payment Summary -->
        <div class="bg-slate-50 rounded-xl p-5 mb-6">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{{ $t('checkout.paymentDetails') }}</h3>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span class="text-xs text-slate-500 uppercase">{{ $t('checkout.account') }}</span>
              <p class="font-semibold text-slate-900 truncate">{{ finalUserName || $t('checkout.notSpecified') }}</p>
            </div>
            <div>
              <span class="text-xs text-slate-500 uppercase">{{ $t('checkout.email') }}</span>
              <p class="font-semibold text-slate-900 truncate">{{ finalUserEmail || $t('checkout.notSpecified') }}</p>
            </div>
            <div>
              <span class="text-xs text-slate-500 uppercase">{{ $t('checkout.currentPlan') }}</span>
              <span class="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg">{{ currentPlan || $t('checkout.free') }}</span>
            </div>
            <div v-if="finalPlan">
              <span class="text-xs text-slate-500 uppercase">{{ $t('checkout.upgradingTo') }}</span>
              <span class="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg">{{ planName }}</span>
            </div>
          </div>
          <div class="flex justify-between items-center p-4 bg-white rounded-lg">
            <span class="text-slate-600">{{ $t('checkout.totalAmount') }}</span>
            <span class="text-2xl font-bold text-indigo-600">{{ formatAmount(finalAmount) }}</span>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="mb-6">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{{ $t('checkout.paymentMethod') }}</h3>
          <div class="space-y-3">
            <label
              v-for="(provider, key) in translatedProviders" :key="key"
              :class="['flex items-center gap-4 p-4 bg-white border-2 rounded-xl cursor-pointer transition-all',
                paymentProvider === key ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300',
                !provider.enabled && 'opacity-50 cursor-not-allowed']"
              @click="provider.enabled && (paymentProvider = key)"
            >
              <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl shrink-0">{{ provider.emoji }}</div>
              <div class="flex-1 min-w-0">
                <span class="font-semibold text-slate-900 block">{{ provider.name }}</span>
                <span class="text-sm text-slate-500">{{ provider.description }}</span>
                <span v-if="!provider.enabled" class="text-xs text-amber-600 font-medium block">{{ $t('checkout.comingSoon') }}</span>
              </div>
              <div v-if="paymentProvider === key && provider.enabled" class="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white shrink-0">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              </div>
              <input type="radio" v-model="paymentProvider" :value="key" :disabled="!provider.enabled" class="hidden"/>
            </label>
          </div>
        </div>

        <!-- Duration Selection -->
        <div class="mb-6">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {{ $t('checkout.selectDuration') }}
          </h3>
          <div class="grid grid-cols-4 gap-3">
            <!-- 1 Day -->
            <label :class="['relative p-4 border-2 rounded-xl cursor-pointer transition-all text-center', selectedDuration === 0 ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300 bg-white']" @click="selectedDuration = 0">
              <input type="radio" v-model="selectedDuration" :value="0" class="hidden"/>
              <span class="block text-xl font-bold text-slate-900">1</span>
              <span class="block text-xs text-slate-500 uppercase">{{ $t('checkout.day') || 'Day' }}</span>
              <span class="block text-lg font-semibold text-amber-600 mt-2">10,000</span>
              <span class="text-xs text-slate-400">UZS</span>
              <div v-if="selectedDuration === 0" class="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
            </label>
            <!-- 1 Month -->
            <label :class="['relative p-4 border-2 rounded-xl cursor-pointer transition-all text-center', selectedDuration === 1 ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white']" @click="selectedDuration = 1">
              <input type="radio" v-model="selectedDuration" :value="1" class="hidden"/>
              <span class="block text-xl font-bold text-slate-900">1</span>
              <span class="block text-xs text-slate-500 uppercase">{{ $t('checkout.month') }}</span>
              <span class="block text-lg font-semibold text-indigo-600 mt-2">250,000</span>
              <span class="text-xs text-slate-400">UZS</span>
              <div v-if="selectedDuration === 1" class="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
            </label>
            <!-- 3 Months -->
            <label :class="['relative p-4 border-2 rounded-xl cursor-pointer transition-all text-center', selectedDuration === 3 ? 'border-purple-500 bg-purple-50' : 'border-purple-200 hover:border-purple-300 bg-white']" @click="selectedDuration = 3">
              <div class="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full">{{ $t('checkout.popular') }}</div>
              <input type="radio" v-model="selectedDuration" :value="3" class="hidden"/>
              <span class="block text-xl font-bold text-slate-900">3</span>
              <span class="block text-xs text-slate-500 uppercase">{{ $t('checkout.months') }}</span>
              <span class="block text-lg font-semibold text-purple-600 mt-2">675,000</span>
              <span class="text-xs text-slate-400">UZS</span>
              <span class="block text-[10px] text-emerald-500 font-medium">{{ $t('checkout.save', { percent: 10 }) }}</span>
              <div v-if="selectedDuration === 3" class="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
            </label>
            <!-- 6 Months -->
            <label :class="['relative p-4 border-2 rounded-xl cursor-pointer transition-all text-center', selectedDuration === 6 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white']" @click="selectedDuration = 6">
              <input type="radio" v-model="selectedDuration" :value="6" class="hidden"/>
              <span class="block text-xl font-bold text-slate-900">6</span>
              <span class="block text-xs text-slate-500 uppercase">{{ $t('checkout.months') }}</span>
              <span class="block text-lg font-semibold text-emerald-600 mt-2">1,200,000</span>
              <span class="text-xs text-slate-400">UZS</span>
              <span class="block text-[10px] text-emerald-500 font-medium">{{ $t('checkout.save', { percent: 20 }) }}</span>
              <div v-if="selectedDuration === 6" class="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
            </label>
          </div>
        </div>

        <!-- Promo Code -->
        <div class="mb-6">
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            {{ $t('checkout.havePromoCode') }}
          </h3>
          <div class="flex gap-2">
            <div class="flex-1 relative">
              <input v-model="promoCodeInput" type="text" :placeholder="$t('checkout.enterPromoCode')" :disabled="promoApplying"
                @input="handlePromoCodeInput" @keyup.enter="applyPromoCode"
                :class="['w-full px-4 py-3 border-2 rounded-xl text-sm uppercase tracking-wider font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500',
                  promoApplied ? 'border-emerald-500 bg-emerald-50' : promoError ? 'border-red-500 bg-red-50' : 'border-slate-200']"/>
              <div v-if="promoApplied" class="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              </div>
            </div>
            <button @click="applyPromoCode" :disabled="!promoCodeInput || promoApplying || promoApplied"
              class="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="promoApplying" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else>{{ $t('checkout.apply') }}</span>
            </button>
          </div>
          <p v-if="promoMessage" :class="['mt-2 text-sm font-medium', promoError ? 'text-red-500' : 'text-emerald-600']">{{ promoMessage }}</p>
        </div>

        <!-- Language -->
        <div class="mb-6">
          <label class="flex items-center gap-2 text-sm text-slate-600 mb-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {{ $t('checkout.paymentPageLanguage') }}
          </label>
          <select v-model="selectedLanguage" class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="en">🇺🇸 English</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="uz">🇺🇿 O'zbek</option>
          </select>
        </div>

        <!-- Pay Button -->
        <button @click="processPayment" :disabled="!canProceedToPayment || processing"
          class="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none">
          <span v-if="processing" class="inline-flex items-center gap-2">
            <span class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ $t('checkout.processing') }}
          </span>
          <span v-else-if="providers[paymentProvider]?.enabled && canProceedToPayment">
            {{ $t('checkout.continueToPayment') }} • {{ formatAmount(finalAmount) }}
          </span>
          <span v-else>{{ translatedValidationMessage }}</span>
        </button>

        <!-- Security Badge -->
        <div class="flex items-center justify-center gap-2 mt-4 text-slate-400 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>{{ $t('checkout.securePayment') }}</span>
        </div>
      </div>

      <!-- OTP Modal -->
      <div v-if="showOtpModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="closeOtpModal">
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-slate-900">{{ $t('checkout.verifyPayment') }}</h3>
            <button @click="closeOtpModal" :disabled="processing" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <p class="text-slate-600 text-sm mb-6">{{ $t('checkout.enterCode') }}</p>

          <div class="flex gap-2 justify-center mb-4">
            <input v-for="(digit, index) in otpDigits" :key="index" v-model="otpDigits[index]"
              type="text" inputmode="numeric" maxlength="1"
              class="w-12 h-14 text-center text-xl font-bold border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
              @input="handleOtpInput(index, $event)" @keydown.backspace="handleOtpBackspace(index, $event)"
              :ref="el => { if (el) otpInputs[index] = el }"/>
          </div>

          <p v-if="otpError" class="text-red-500 text-sm text-center mb-4">{{ otpError }}</p>

          <div class="flex gap-3">
            <button @click="closeOtpModal" :disabled="processing" class="flex-1 py-3 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all">{{ $t('checkout.cancel') }}</button>
            <button @click="submitOtp" :disabled="processing || otp.length < 6" class="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
              {{ processing ? $t('checkout.verifying') : $t('checkout.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '@/firebase';
import { initiatePaymePayment, initiateMulticardPayment, createPaymentByToken, confirmPayment } from '@/api';
import { applyPromocode, validatePromocode } from '@/api/promocodes';

export default {
  name: 'UniversalCheckout',
  props: {
    plan: { type: String, default: '' },
    provider: { type: String, default: 'multicard' },
    userId: { type: String, default: '' },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    currentPlan: { type: String, default: 'free' },
    amount: { type: [String, Number], default: 0 }
  },
  
  data() {
    return {
      loading: false, processing: false, error: '', paymentStatus: null, transactionId: null, failureReason: '',
      showOtpModal: false, otpDigits: ['', '', '', '', '', ''], otpInputs: [], otpError: null, currentPaymentUuid: null,
      internalUserId: '', internalUserName: '', internalUserEmail: '',
      selectedDuration: 3, selectedPlan: 'pro', paymentProvider: 'multicard', selectedCardToken: null, savedCards: [],
      selectedLanguage: 'en', loadingMessage: 'Processing your payment...',
      providers: {
        multicard: { name: 'Bank Card', description: 'Visa, Mastercard, UzCard, Humo', emoji: '💳', enabled: true },
        payme: { name: 'Payme', description: 'Pay with Payme app', emoji: '📱', enabled: true },
        click: { name: 'Click', description: 'Pay with Click app', emoji: '🔵', enabled: false }
      },
      promoCodeInput: '', promoApplying: false, promoApplied: false, promoError: false, promoMessage: '', promoData: null,
      showDebugInfo: process.env.NODE_ENV === 'development'
    };
  },
  
  computed: {
    finalPlan() { return this.plan || this.selectedPlan || ''; },
    finalUserId() { return this.internalUserId || this.userId || this.$route.query.userId || auth.currentUser?.uid || ''; },
    finalUserName() { return this.internalUserName || this.userName || this.$route.query.userName || auth.currentUser?.displayName || 'User'; },
    finalUserEmail() { return this.internalUserEmail || this.userEmail || this.$route.query.userEmail || auth.currentUser?.email || ''; },
    finalAmount() {
      if (this.promoApplied && this.promoData) return 0;
      let amt = parseInt(this.amount) || 0;
      if (amt > 0) return amt;
      const amounts = { 0: 1000000, 1: 25000000, 3: 67500000, 6: 120000000 };
      return amounts[this.selectedDuration] || amounts[3];
    },
    planName() {
      if (this.promoApplied && this.promoData) {
        const days = this.promoData.subscriptionDays || 30;
        let durationText = this.promoData.durationText || (days <= 31 ? '1 Month' : days <= 95 ? '3 Months' : days <= 185 ? '6 Months' : `${days} Days`);
        return `${(this.promoData.grantsPlan || 'Pro').toUpperCase()} Plan (via Promocode - ${durationText})`;
      }
      return this.selectedDuration === 0 ? 'Pro Plan (1 Day)' : this.selectedDuration === 1 ? 'Pro Plan (1 Month)' : this.selectedDuration === 3 ? 'Pro Plan (3 Months)' : 'Pro Plan (6 Months)';
    },
    canProceedToPayment() {
      if (this.promoApplied && this.promoData) return Boolean(this.finalUserId);
      return Boolean(this.finalUserId && this.finalPlan && this.finalAmount > 0 && this.providers[this.paymentProvider]?.enabled);
    },
    validationMessage() {
      if (!this.finalUserId) return 'User ID not specified';
      if (!this.finalPlan) return 'Please select a plan';
      if (!this.finalAmount || this.finalAmount <= 0) return 'Invalid payment amount';
      if (!this.providers[this.paymentProvider]?.enabled) return 'Please select an available payment method';
      return 'Complete all required fields';
    },
    translatedValidationMessage() {
      if (!this.finalUserId) return this.$t('checkout.userIdRequired');
      if (!this.finalPlan) return this.$t('checkout.selectPlan');
      if (!this.finalAmount || this.finalAmount <= 0) return this.$t('checkout.invalidAmount');
      if (!this.providers[this.paymentProvider]?.enabled) return this.$t('checkout.selectPaymentMethod');
      return this.$t('checkout.completeFields');
    },
    translatedProviders() {
      return {
        multicard: { name: this.$t('checkout.bankCard'), description: this.$t('checkout.bankCardDesc'), emoji: '💳', enabled: true },
        payme: { name: this.$t('checkout.payme'), description: this.$t('checkout.paymeDesc'), emoji: '📱', enabled: true },
        click: { name: this.$t('checkout.click'), description: this.$t('checkout.clickDesc'), emoji: '🔵', enabled: false }
      };
    },
    otp() { return this.otpDigits.join(''); }
  },

  created() {
    if (this.$route.query.duration) this.selectedDuration = parseInt(this.$route.query.duration) || 3;
    if (this.$route.query.plan) this.selectedPlan = this.$route.query.plan;
    if (this.$route.query.promoCode) this.promoCodeInput = this.$route.query.promoCode;
    if (this.$route.query.billing_id) this.billingId = this.$route.query.billing_id; // ✅ Read billing_id from URL
  },

  async mounted() {
    this.loadPaymentData();
    this.validatePaymentData();
    if (this.promoCodeInput) await this.validatePromoCodeOnLoad();
  },

  data() {
    return {
      billingId: null, // ✅ Add to data
      // ... existing data ...
    };
  },

  methods: {
    loadSavedCards() { this.savedCards = []; },
    selectCard(cardToken) { this.selectedCardToken = cardToken; },
    getCardTypeName(ps) { return { '01': 'UzCard', '02': 'Humo', '03': 'Visa', '04': 'Mastercard' }[ps] || 'Card'; },
    loadPaymentData() {
      if (auth.currentUser) {
        if (!this.internalUserId) this.internalUserId = auth.currentUser.uid;
        if (!this.internalUserName) this.internalUserName = auth.currentUser.displayName || '';
        if (!this.internalUserEmail) this.internalUserEmail = auth.currentUser.email || '';
      }
      if (!this.selectedPlan && this.$route.params.plan) this.selectedPlan = this.$route.params.plan;
      if (!this.selectedPlan) this.selectedPlan = 'pro';
    },
    validatePaymentData() {
      if (!this.finalUserId) { this.error = 'User authentication required.'; return false; }
      if (!this.finalPlan) { this.error = 'Please select a plan.'; return false; }
      return true;
    },
    handlePromoCodeInput() { this.promoApplied = false; this.promoError = false; this.promoMessage = ''; this.promoData = null; },
    async validatePromoCodeOnLoad() {
      if (!this.promoCodeInput) return;
      try {
        const result = await validatePromocode(this.promoCodeInput.toUpperCase());
        if (result?.valid) { this.promoData = result.data; this.promoMessage = `Valid! ${(result.data?.grantsPlan || 'Pro').toUpperCase()} Plan`; }
      } catch (err) { /* Silent fail for promo validation */ }
    },
    async applyPromoCode() {
      if (!this.promoCodeInput || this.promoApplying) return;
      this.promoApplying = true; this.promoError = false; this.promoMessage = '';
      try {
        const validationResult = await validatePromocode(this.promoCodeInput.toUpperCase());
        if (validationResult?.valid) {
          this.promoApplied = true; this.promoData = validationResult.data;
          this.promoMessage = `Promo code applied! ${(validationResult.data?.grantsPlan || 'Pro').toUpperCase()} Plan`;
        } else { this.promoError = true; this.promoMessage = validationResult?.error || 'Invalid promo code'; }
      } catch (err) { this.promoError = true; this.promoMessage = 'Error validating promo code.'; }
      finally { this.promoApplying = false; }
    },
    async processPayment() {
      if (!this.canProceedToPayment || this.processing) return;
      this.processing = true; this.error = '';
      try {
        if (this.promoApplied && this.promoData) {
          const result = await applyPromocode(this.promoCodeInput.toUpperCase());
          if (result.success) {
            localStorage.setItem('userStatus', result.plan || this.promoData.grantsPlan || 'pro');
            if (result.expiryDate) localStorage.setItem('subscriptionExpiry', result.expiryDate);
            if (this.$store?.dispatch) { await this.$store.dispatch('user/loadUserStatus'); this.$store.commit('user/FORCE_UPDATE'); }
            window.dispatchEvent(new CustomEvent('userStatusChanged', { detail: { source: 'promocode' } }));
            this.handlePaymentSuccess({ transactionId: 'PROMO-' + Date.now(), plan: result.plan });
            return;
          } else throw new Error(result.error || 'Failed to apply promo code');
        }
        if (this.paymentProvider === 'payme') await this.processPaymePayment();
        else if (this.paymentProvider === 'multicard') await this.processMulticardPayment();
        else throw new Error('Please select a valid payment method');
      } catch (err) { this.error = err.message || 'An error occurred'; this.processing = false; }
    },
    async processPaymePayment() {
      const paymentData = { userId: this.finalUserId, userName: this.finalUserName, userEmail: this.finalUserEmail, plan: this.finalPlan, amount: this.finalAmount, duration: this.selectedDuration, lang: this.selectedLanguage };
      const result = await initiatePaymePayment(paymentData);
      if (result.success && result.data?.paymentUrl) window.location.href = result.data.paymentUrl;
      else throw new Error(result.error || 'Failed to initiate payment');
    },
    async processMulticardPayment() {
      const paymentData = { userId: this.finalUserId, userName: this.finalUserName, userEmail: this.finalUserEmail, plan: this.finalPlan, amount: this.finalAmount, duration: this.selectedDuration, lang: this.selectedLanguage, billingId: this.billingId }; // ✅ Add billingId
      let result = this.selectedCardToken ? await createPaymentByToken(this.selectedCardToken, paymentData) : await initiateMulticardPayment(paymentData);
      if (result.success) {
        if (result.data?.paymentUrl || result.data?.checkoutUrl) window.location.href = result.data.paymentUrl || result.data.checkoutUrl;
        else if (result.data?.requiresOtp) { this.currentPaymentUuid = result.data.uuid; this.showOtpModal = true; }
        else if (result.data?.status === 'success') this.handlePaymentSuccess(result.data);
      } else throw new Error(result.error || 'Failed to process payment');
    },
    handleOtpInput(index, event) { if (event.target.value && index < 5) this.$nextTick(() => { this.otpInputs[index + 1]?.focus(); }); },
    handleOtpBackspace(index, event) { if (!event.target.value && index > 0) this.$nextTick(() => { this.otpInputs[index - 1]?.focus(); }); },
    async submitOtp() {
      this.processing = true; this.otpError = null;
      try {
        const result = await confirmPayment(this.currentPaymentUuid, this.otp);
        if (result.success && result.data.status === 'success') { this.closeOtpModal(); this.handlePaymentSuccess(result.data); }
        else throw new Error(result.error || 'Payment not confirmed');
      } catch (err) { this.otpError = err.message || 'Invalid verification code'; }
      finally { this.processing = false; }
    },
    closeOtpModal() { this.showOtpModal = false; this.otpDigits = ['', '', '', '', '', '']; this.otpError = null; },
    async handlePaymentSuccess(paymentData) {
      this.paymentStatus = 'success'; this.transactionId = paymentData.uuid || paymentData.transactionId;
      this.loading = false; this.processing = false;
      try {
        await this.$store.dispatch('user/loadUserStatus'); this.$store.commit('user/FORCE_UPDATE');
        window.dispatchEvent(new CustomEvent('userStatusChanged', { detail: { source: 'payment' } }));
        setTimeout(() => { this.$router.push('/settings'); }, 3000);
      } catch (error) { /* Silent fail for status update */ }
    },
    formatAmount(amount) {
      if (!amount) return 'FREE';
      const uzs = Math.floor(amount / 100);
      return new Intl.NumberFormat('en-US').format(uzs) + ' sum';
    },
    goBack() { this.paymentStatus ? this.paymentStatus = null : this.$router.go(-1); },
    goToDashboard() { this.$router.push('/dashboard'); },
    goToSettings() { this.$router.push('/settings'); },
    goHome() { this.$router.push('/'); },
    retryPayment() { this.error = ''; this.loading = false; this.processing = false; this.paymentStatus = null; this.loadPaymentData(); }
  }
};
</script>