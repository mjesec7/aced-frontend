const fs = require('fs');

const filePath = 'd:/ACED/aced-frontend/src/views/UniversalCheckout.vue';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original length:', content.length);

// The fix: Find the pattern where methods are inside computed and fix it
const pattern = /(\s+\}\s*\r?\n\s+\},)\s*\r?\n\s*\r?\n\s+async submitOtp\(\) \{/;

const match = content.match(pattern);
console.log('Pattern match:', match ? 'Found' : 'Not found');

if (match) {
    const replacement = `      }
    }
  },

  created() {
    if (this.$route.query.duration) {
      this.selectedDuration = parseInt(this.$route.query.duration) || 3;
    }
    if (this.$route.query.plan) {
      this.selectedPlan = this.$route.query.plan;
    }
  },

  async mounted() {
    this.loadPaymentData();
    this.validatePaymentData();
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
    async applyPromoCode() {
      if (!this.promoCodeInput || this.promoApplying) return;
      this.promoApplying = true; this.promoError = false; this.promoMessage = '';
      try {
        const result = await this.$store.dispatch('user/validatePromocode', this.promoCodeInput.toUpperCase());
        if (result && result.valid) { this.promoApplied = true; this.promoData = result.data; this.promoMessage = 'Promo code applied!'; }
        else { this.promoError = true; this.promoMessage = result?.error || 'Invalid promo code'; }
      } catch (err) { this.promoError = true; this.promoMessage = 'Error validating promo code'; }
      finally { this.promoApplying = false; }
    },
    async processPayment() {
      if (!this.canProceedToPayment || this.processing) return;
      this.processing = true; this.error = '';
      try {
        if (this.promoApplied && this.promoData) {
          const result = await this.$store.dispatch('user/applyPromocode', { promoCode: this.promoCodeInput, plan: this.promoData.grantsPlan || 'pro', duration: this.selectedDuration });
          if (result.success) { this.handlePaymentSuccess({ transactionId: 'PROMO-' + Date.now() }); return; }
          else throw new Error(result.error || 'Failed to apply promo code');
        }
        if (this.paymentProvider === 'payme') await this.processPaymePayment();
        else if (this.paymentProvider === 'multicard') await this.processMulticardPayment();
        else throw new Error('Please select a valid payment method');
      } catch (err) { this.error = this.formatError(err); this.processing = false; }
    },
    async processPaymePayment() {
      const paymentData = { userId: this.finalUserId, userName: this.finalUserName, userEmail: this.finalUserEmail, plan: this.finalPlan, amount: this.finalAmount, duration: this.selectedDuration, lang: this.selectedLanguage };
      const result = await initiatePaymePayment(paymentData);
      if (result.success && result.data?.paymentUrl) window.location.href = result.data.paymentUrl;
      else throw new Error(result.error || 'Failed to initiate payment');
    },
    async processMulticardPayment() {
      const paymentData = { userId: this.finalUserId, userName: this.finalUserName, userEmail: this.finalUserEmail, plan: this.finalPlan, amount: this.finalAmount, duration: this.selectedDuration, lang: this.selectedLanguage };
      let result = this.selectedCardToken ? await createPaymentByToken(this.selectedCardToken, paymentData) : await initiateMulticardPayment(paymentData);
      if (result.success) {
        if (result.data?.paymentUrl) window.location.href = result.data.paymentUrl;
        else if (result.data?.requiresOtp) { this.currentPaymentUuid = result.data.uuid; this.showOtpModal = true; }
        else if (result.data?.status === 'success') this.handlePaymentSuccess(result.data);
      } else throw new Error(result.error || 'Failed to process payment');
    },
    handleOtpInput(index, event) { if (event.target.value && index < 5) this.$nextTick(() => { this.otpInputs[index + 1]?.focus(); }); },
    handleOtpBackspace(index, event) { if (!event.target.value && index > 0) this.$nextTick(() => { this.otpInputs[index - 1]?.focus(); }); },

    async submitOtp() {`;

    content = content.replace(pattern, replacement);
    fs.writeFileSync(filePath, content);
    console.log('File fixed successfully!');
    console.log('New length:', content.length);
} else {
    console.log('Pattern not found, checking file content...');
    // Find the area around line 703-706
    const lines = content.split('\n');
    console.log('Lines 700-710:');
    for (let i = 699; i < 710 && i < lines.length; i++) {
        console.log(`${i + 1}: ${lines[i]}`);
    }
}
