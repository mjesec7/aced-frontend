/**
 * SINGLE SOURCE OF TRUTH for subscription plan pricing & durations.
 * Mirrors backend config/subscriptionConfig.js — keep in sync.
 *
 * All amounts are in TIYINS (1 UZS = 100 tiyin).
 * Use priceUZS for display, priceTiyin for payment APIs.
 */

export const PLANS = [
  { id: 'pro-1day', duration: 0, durationDays: 1,   label: '1 Day',     priceTiyin: 1_000_000,   priceUZS: 10_000,    displayPrice: '10,000',   savings: null, featured: false },
  { id: 'pro-1',    duration: 1, durationDays: 30,  label: '1 Month',   priceTiyin: 25_000_000,  priceUZS: 250_000,   displayPrice: '250,000',  savings: null, featured: false },
  { id: 'pro-3',    duration: 3, durationDays: 90,  label: '3 Months',  priceTiyin: 67_500_000,  priceUZS: 675_000,   displayPrice: '675,000',  savings: '10%', featured: true },
  { id: 'pro-6',    duration: 6, durationDays: 180, label: '6 Months',  priceTiyin: 120_000_000, priceUZS: 1_200_000, displayPrice: '1,200,000', savings: '20%', featured: false },
];

/** Map duration (months: 0,1,3,6) → plan config */
export const getPlanByDuration = (months) => PLANS.find(p => p.duration === months) || PLANS[1];

/** Map tier id → plan config */
export const getPlanById = (id) => PLANS.find(p => p.id === id) || null;

/** Get tiyin amount for a duration (months) — used by payment APIs */
export const getAmountForDuration = (months) => getPlanByDuration(months).priceTiyin;

/** Duration→amount lookup object (for backward compat) */
export const DURATION_AMOUNTS = Object.fromEntries(PLANS.map(p => [p.duration, p.priceTiyin]));
