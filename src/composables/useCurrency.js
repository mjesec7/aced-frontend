import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/core';

// Module-level cache (shared across all component instances)
let cachedRate = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
let fetchPromise = null; // Dedup concurrent fetches

/**
 * Composable for currency-aware price display.
 * - Uzbek locale → show prices in UZS
 * - English/Russian locale → convert to USD using live exchange rate
 */
export function useCurrency() {
    const { locale } = useI18n();
    const exchangeRate = ref(cachedRate || 12800); // Default fallback rate
    const rateLoaded = ref(!!cachedRate);

    const isUzbekLocale = computed(() => locale.value === 'uz');

    // Fetch live exchange rate from backend
    const fetchRate = async () => {
        const now = Date.now();
        if (cachedRate && (now - cacheTimestamp) < CACHE_DURATION) {
            exchangeRate.value = cachedRate;
            rateLoaded.value = true;
            return;
        }

        // Dedup: if a fetch is already in progress, wait for it
        if (fetchPromise) {
            await fetchPromise;
            exchangeRate.value = cachedRate || exchangeRate.value;
            rateLoaded.value = true;
            return;
        }

        fetchPromise = (async () => {
            try {
                const { data } = await api.get('/exchange-rate');
                if (data.success && data.rate) {
                    cachedRate = data.rate;
                    cacheTimestamp = Date.now();
                    exchangeRate.value = data.rate;
                    rateLoaded.value = true;
                }
            } catch (e) {
                // Keep using default/last known rate
                rateLoaded.value = true;
            } finally {
                fetchPromise = null;
            }
        })();

        await fetchPromise;
    };

    /**
     * Format a price given in UZS.
     * - If locale is 'uz' → returns UZS formatted string (e.g. "10,000 UZS")
     * - If locale is 'en'/'ru' → converts to USD (e.g. "$0.78")
     * @param {number} uzsAmount - Price in UZS
     * @param {object} options - { showCurrency: true }
     * @returns {string} Formatted price string
     */
    const formatPrice = (uzsAmount, options = {}) => {
        if (isUzbekLocale.value) {
            return formatUZS(uzsAmount);
        }
        return formatUSD(uzsAmount);
    };

    /**
     * Get the currency code for the current locale.
     */
    const currencyCode = computed(() => isUzbekLocale.value ? 'UZS' : 'USD');

    /**
     * Get the currency symbol for the current locale.
     */
    const currencySymbol = computed(() => isUzbekLocale.value ? 'UZS' : '$');

    // Format helpers
    const formatUZS = (amount) => {
        if (!amount && amount !== 0) return '0 UZS';
        return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
    };

    const formatUSD = (uzsAmount) => {
        if (!uzsAmount && uzsAmount !== 0) return '$0';
        const usd = uzsAmount / exchangeRate.value;
        if (usd < 1) {
            return '$' + usd.toFixed(2);
        }
        if (usd < 10) {
            return '$' + usd.toFixed(1);
        }
        return '$' + Math.round(usd).toLocaleString('en-US');
    };

    // Auto-fetch rate on first use
    fetchRate();

    return {
        exchangeRate,
        rateLoaded,
        isUzbekLocale,
        currencyCode,
        currencySymbol,
        formatPrice,
        fetchRate
    };
}
