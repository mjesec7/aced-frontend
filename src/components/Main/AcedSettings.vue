<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- MAIN CONTENT -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      
      <!-- HEADER -->
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-5 bg-white rounded-2xl shadow-sm">
        <div class="flex items-center gap-4">
          <button @click="goToProfile" class="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-medium transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>{{ $t('common.back') }}</span>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">{{ $t('settings.accountSettings') }}</h1>
            <p class="text-sm text-slate-500 mt-1">{{ $t('settings.manageProfile') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <LanguageSwitcher :compact="true" />
          <button @click="saveChanges" :disabled="loading" class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>{{ $t('common.save') }}</span>
          </button>
        </div>
      </header>

      <!-- STATS OVERVIEW -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <!-- Current Plan Stat -->
        <div class="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm">
          <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{{ $t('settings.plan') }}</p>
            <h3 class="text-base font-bold text-slate-900 truncate">{{ currentPlan !== 'free' ? 'Pro' : 'Free' }}</h3>
          </div>
        </div>

        <!-- Messages Stat -->
        <div class="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm">
          <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{{ $t('settings.messages') }}</p>
            <h3 class="text-base font-bold text-slate-900">{{ currentUsageMessages }}<span class="text-xs font-normal text-slate-400">/{{ usageLimitsMessages === -1 ? '∞' : usageLimitsMessages }}</span></h3>
          </div>
        </div>

        <!-- Images Stat -->
        <div class="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm">
          <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 text-white flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{{ $t('settings.images') }}</p>
            <h3 class="text-base font-bold text-slate-900">{{ currentUsageImages }}<span class="text-xs font-normal text-slate-400">/{{ usageLimitsImages === -1 ? '∞' : usageLimitsImages }}</span></h3>
          </div>
        </div>

        <!-- Days Remaining Stat -->
        <div class="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm">
          <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{{ $t('settings.daysLeft') }}</p>
            <h3 class="text-base font-bold text-slate-900">{{ currentPlan !== 'free' && subscriptionExpiryInfo ? subscriptionExpiryInfo.daysRemaining : '—' }}</h3>
          </div>
        </div>
      </div>

      <!-- SUBSCRIPTION TARIFFS -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div class="flex items-center gap-3 p-5 border-b border-slate-100">
          <div class="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <h2 class="text-base font-semibold text-slate-900">{{ $t('settings.subscriptionPlans') }}</h2>
            <p class="text-xs text-slate-500">{{ $t('settings.chooseBestPlan') }}</p>
          </div>
        </div>
        
        <div class="p-5">
          <!-- Tariff Cards - 3 equal columns -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- 1 Month -->
            <div class="relative p-5 border-2 border-slate-200 hover:border-indigo-400 rounded-2xl transition-all hover:shadow-lg flex flex-col">
              <div class="text-center flex-1 flex flex-col">
                <h3 class="text-lg font-bold text-slate-900">{{ $t('settings.oneMonth') }}</h3>
                <div class="text-2xl font-bold text-indigo-600 mt-2">250,000</div>
                <div class="text-sm text-slate-500 mb-4">UZS</div>
                <ul class="text-left text-xs text-slate-600 space-y-2 flex-1">
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Unlimited messages
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Unlimited images
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    AI tutor access
                  </li>
                </ul>
                <button 
                  @click="goToUpgrade(1)" 
                  :disabled="currentPlan !== 'free'"
                  class="w-full py-2.5 mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ currentPlan === 'free' ? $t('tariffs.getStarted') : $t('common.active') }}
                </button>
              </div>
            </div>

            <!-- 3 Months - Popular -->
            <div class="relative p-5 border-2 border-amber-400 rounded-2xl shadow-lg bg-gradient-to-b from-amber-50 to-white flex flex-col">
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold uppercase rounded-full tracking-wide whitespace-nowrap">
                Popular
              </div>
              <div class="text-center flex-1 flex flex-col pt-1">
                <h3 class="text-lg font-bold text-slate-900">{{ $t('settings.threeMonths') }}</h3>
                <div class="text-2xl font-bold text-indigo-600 mt-2">675,000</div>
                <div class="text-sm text-slate-500">UZS</div>
                <div class="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full my-2 mx-auto">{{ $t('tariffs.save', { percent: 10 }) }}</div>
                <ul class="text-left text-xs text-slate-600 space-y-2 flex-1">
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Unlimited messages
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Unlimited images
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    AI tutor + Analytics
                  </li>
                </ul>
                <button 
                  @click="goToUpgrade(3)" 
                  :disabled="currentPlan !== 'free'"
                  class="w-full py-2.5 mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ currentPlan === 'free' ? 'Best Value' : 'Active' }}
                </button>
              </div>
            </div>

            <!-- 6 Months - Best Deal -->
            <div class="relative p-5 border-2 border-emerald-400 rounded-2xl shadow-md bg-gradient-to-b from-emerald-50 to-white flex flex-col">
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold uppercase rounded-full tracking-wide whitespace-nowrap">
                Best Deal
              </div>
              <div class="text-center flex-1 flex flex-col pt-1">
                <h3 class="text-lg font-bold text-slate-900">6 Months</h3>
                <div class="text-2xl font-bold text-indigo-600 mt-2">1,200,000</div>
                <div class="text-sm text-slate-500">UZS</div>
                <div class="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full my-2 mx-auto">SAVE 20%</div>
                <ul class="text-left text-xs text-slate-600 space-y-2 flex-1">
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Unlimited everything
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Priority support
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Custom courses
                  </li>
                </ul>
                <button 
                  @click="goToUpgrade(6)" 
                  :disabled="currentPlan !== 'free'"
                  class="w-full py-2.5 mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ currentPlan === 'free' ? 'Get Pro' : 'Active' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Promocode Section -->
          <div class="mt-6 pt-5 border-t border-slate-100">
            <div class="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                v-model="promocode" 
                class="flex-1 px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="Enter promocode"
                :disabled="applyingPromo || currentPlan !== 'free'"
              />
              <button 
                @click="applyPromocode" 
                class="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                :disabled="!promocode || applyingPromo || currentPlan !== 'free'"
              >
                {{ applyingPromo ? 'Applying...' : 'Apply Code' }}
              </button>
            </div>
            <p v-if="promoError" class="text-red-500 text-xs mt-2">{{ promoError }}</p>
            <p v-if="promoSuccess" class="text-emerald-600 text-xs mt-2">{{ promoSuccess }}</p>
          </div>
        </div>
      </div>

      <!-- PROFILE & SECURITY SECTION -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- PROFILE CARD -->
        <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="flex justify-between items-center p-5 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl text-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <h2 class="text-base font-semibold text-slate-900">Personal Information</h2>
                <p class="text-xs text-slate-500">Update your personal details</p>
              </div>
            </div>
            <button v-if="!isEditingName" @click="startEditingName" class="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
          
          <div class="p-5">
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-2">First Name</label>
                <input 
                  v-if="isEditingName"
                  type="text" 
                  v-model="tempUser.name" 
                  class="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all"
                  placeholder="First name"
                />
                <div v-else class="px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-900">
                  {{ user.name || 'Not specified' }}
                </div>
              </div>
              
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-2">Last Name</label>
                <input 
                  v-if="isEditingName"
                  type="text" 
                  v-model="tempUser.surname" 
                  class="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all"
                  placeholder="Last name"
                />
                <div v-else class="px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-900">
                  {{ user.surname || 'Not specified' }}
                </div>
              </div>
            </div>

            <div>
              <label class="flex items-center gap-2 text-xs font-medium text-slate-600 mb-2">
                Email
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Verified
                </span>
              </label>
              <input 
                type="email" 
                v-model="user.email" 
                class="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm text-slate-900 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                :disabled="!isEditingName"
              />
            </div>

            <div v-if="isEditingName" class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
              <button @click="cancelEditingName" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm">Cancel</button>
              <button @click="saveNameChanges" class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl transition-all text-sm">Save</button>
            </div>
          </div>
        </div>

        <!-- SECURITY CARD -->
        <div v-if="!isGoogleUser" class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div class="flex items-center gap-3 p-5 border-b border-slate-100">
            <div class="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl text-indigo-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <h2 class="text-base font-semibold text-slate-900">Security</h2>
              <p class="text-xs text-slate-500">Change your password</p>
            </div>
          </div>
          
          <div class="p-5">
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-slate-600 mb-2">Current Password</label>
                <input 
                  type="password" 
                  v-model="oldPassword" 
                  class="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all"
                  placeholder="••••••••"
                  :disabled="loading"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-600 mb-2">New Password</label>
                <input 
                  type="password" 
                  v-model="newPassword" 
                  class="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all"
                  placeholder="••••••••"
                  :disabled="loading"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-slate-600 mb-2">Confirm Password</label>
                <input 
                  type="password" 
                  v-model="confirmPassword" 
                  class="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl text-sm text-slate-900 outline-none transition-all"
                  placeholder="••••••••"
                  :disabled="loading"
                />
              </div>
            </div>

            <div class="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
              <button @click="sendPasswordReset" class="text-indigo-500 hover:text-indigo-600 font-medium text-sm hover:underline">
                Forgot Password?
              </button>
              <button @click="saveChanges" class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-60" :disabled="loading">
                {{ loading ? 'Updating...' : 'Update' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- DANGER ZONE -->
      <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div class="flex items-center gap-3 p-5 border-b border-slate-100 bg-red-50">
          <div class="w-10 h-10 flex items-center justify-center bg-red-100 rounded-xl text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 class="text-base font-semibold text-slate-900">Danger Zone</h2>
            <p class="text-xs text-slate-500">Irreversible actions</p>
          </div>
        </div>
        
        <div class="p-5 flex flex-col sm:flex-row gap-4">
          <div class="flex-1 flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <h4 class="text-sm font-semibold text-slate-900">Sign Out</h4>
              <p class="text-xs text-slate-500">Sign out from your account</p>
            </div>
            <button @click="handleLogout" class="px-4 py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-semibold rounded-xl transition-all text-sm whitespace-nowrap">
              Sign Out
            </button>
          </div>

          <div class="flex-1 flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl">
            <div>
              <h4 class="text-sm font-semibold text-slate-900">Delete Account</h4>
              <p class="text-xs text-slate-500">Permanently delete account</p>
            </div>
            <button @click="confirmDeleteAccount" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all text-sm whitespace-nowrap">
              Delete
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- DELETE CONFIRMATION MODAL -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5" @click.self="showDeleteModal = false">
      <div class="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div class="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 class="text-lg font-semibold text-slate-900">Delete Account</h3>
          <button @click="showDeleteModal = false" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 text-2xl">×</button>
        </div>
        <div class="p-5">
          <p class="text-slate-700 mb-3">Are you sure you want to delete your account? This action cannot be undone.</p>
          <p class="text-red-500 font-medium">All your data, progress, and subscription will be permanently deleted.</p>
        </div>
        <div class="flex justify-end gap-3 p-5 bg-slate-50">
          <button @click="showDeleteModal = false" class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all">Cancel</button>
          <button @click="deleteAccount" class="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all">Delete Forever</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { auth } from '@/firebase';
import { 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  deleteUser
} from 'firebase/auth';
import { fetchSubscriptionFromServer } from '@/api/subscription';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';

export default {
  name: 'AcedSettings',

  components: {
    LanguageSwitcher
  },
  
  setup() {
    const store = useStore();
    const router = useRouter();

    // State
    const loading = ref(false);
    const user = ref({ name: '', surname: '', email: '' });
    const tempUser = ref({ name: '', surname: '' });
    const isEditingName = ref(false);
    const oldPassword = ref('');
    const newPassword = ref('');
    const confirmPassword = ref('');
    const serverSubscriptionData = ref(null);
    const promocode = ref('');
    const applyingPromo = ref(false);
    const promoError = ref('');
    const promoSuccess = ref('');
    const showDeleteModal = ref(false);

    // Computed
    const currentPlan = computed(() => serverSubscriptionData.value?.plan || 'free');
    const currentPlanLabel = computed(() => currentPlan.value === 'pro' || currentPlan.value === 'premium' ? 'Pro Plan' : 'Free Plan');
    
    const subscriptionExpiryInfo = computed(() => {
      if (currentPlan.value === 'free' || !serverSubscriptionData.value?.expiryDate) return null;
      const expiry = new Date(serverSubscriptionData.value.expiryDate);
      const now = new Date();
      const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      return {
        date: expiry,
        formattedDate: expiry.toLocaleDateString(),
        daysRemaining: Math.max(0, daysRemaining),
        isExpiring: daysRemaining <= 3
      };
    });

    const currentUsageMessages = computed(() => store.getters['user/currentUsage']?.messages || 0);
    const currentUsageImages = computed(() => store.getters['user/currentUsage']?.images || 0);
    const usageLimitsMessages = computed(() => store.getters['user/usageLimits']?.messages || 50);
    const usageLimitsImages = computed(() => store.getters['user/usageLimits']?.images || 5);
    const isGoogleUser = computed(() => auth.currentUser?.providerData?.some(p => p.providerId === 'google.com') || false);

    // Methods
    const refreshFromServer = async () => {
      try {
        const userId = auth.currentUser?.uid || localStorage.getItem('userId') || localStorage.getItem('firebaseUserId');
        if (!userId) return;
        const result = await fetchSubscriptionFromServer(userId);
        if (result.success && result.subscription) {
          serverSubscriptionData.value = result.subscription;
          store.commit('user/UPDATE_SUBSCRIPTION', { ...result.subscription, serverFetch: true });
        }
      } catch (error) { /* Silent */ }
    };

    const loadInitialData = async () => {
      loading.value = true;
      try {
        const currentUser = auth.currentUser;
        const storedUser = store.getters['user/getUser'];
        if (storedUser) {
          user.value = {
            name: storedUser.name || storedUser.displayName?.split(' ')[0] || '',
            surname: storedUser.surname || storedUser.displayName?.split(' ')[1] || '',
            email: storedUser.email || currentUser?.email || ''
          };
        } else if (currentUser) {
          user.value = {
            name: currentUser.displayName?.split(' ')[0] || '',
            surname: currentUser.displayName?.split(' ')[1] || '',
            email: currentUser.email || ''
          };
        }
        await refreshFromServer();
      } catch (error) { /* Silent */ }
      finally { loading.value = false; }
    };

    const startEditingName = () => { tempUser.value = { ...user.value }; isEditingName.value = true; };
    const cancelEditingName = () => { isEditingName.value = false; tempUser.value = { name: '', surname: '' }; };
    
    const saveNameChanges = async () => {
      try {
        loading.value = true;
        user.value.name = tempUser.value.name;
        user.value.surname = tempUser.value.surname;
        isEditingName.value = false;
      } catch (error) { /* Silent */ }
      finally { loading.value = false; }
    };

    const saveChanges = async () => {
      if (!oldPassword.value || !newPassword.value || !confirmPassword.value) return;
      if (newPassword.value !== confirmPassword.value || newPassword.value.length < 6) return;
      try {
        loading.value = true;
        const currentUser = auth.currentUser;
        if (!currentUser?.email) throw new Error('No user');
        const credential = EmailAuthProvider.credential(currentUser.email, oldPassword.value);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword.value);
        oldPassword.value = ''; newPassword.value = ''; confirmPassword.value = '';
      } catch (error) { /* Silent */ }
      finally { loading.value = false; }
    };

    const sendPasswordReset = async () => {
      try {
        const email = user.value.email || auth.currentUser?.email;
        if (email) await sendPasswordResetEmail(auth, email);
      } catch (error) { /* Silent */ }
    };

    const goToUpgrade = (months = 1) => router.push({ path: '/pay/pro', query: { duration: months } });

    const applyPromocode = async () => {
      if (!promocode.value.trim()) { promoError.value = 'Please enter a promocode'; return; }
      promoError.value = ''; promoSuccess.value = ''; applyingPromo.value = true;
      try {
        const result = await store.dispatch('user/applyPromocode', { promoCode: promocode.value.trim(), plan: 'pro' });
        if (result.success) { promoSuccess.value = result.message || 'Promocode applied!'; promocode.value = ''; await refreshFromServer(); }
        else { promoError.value = result.error || 'Invalid promocode'; }
      } catch (error) { promoError.value = 'Failed to apply promocode'; }
      finally { applyingPromo.value = false; }
    };

    const goToProfile = () => router.push('/profile');
    
    const handleLogout = async () => {
      try { await auth.signOut(); await store.dispatch('user/logout'); router.push('/login'); }
      catch (error) { /* Silent */ }
    };

    const confirmDeleteAccount = () => { showDeleteModal.value = true; };
    
    const deleteAccount = async () => {
      try {
        loading.value = true;
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('No user');
        await deleteUser(currentUser);
        await store.dispatch('user/logout');
        showDeleteModal.value = false;
        router.push('/');
      } catch (error) { /* Silent */ }
      finally { loading.value = false; }
    };

    // Lifecycle
    onMounted(() => {
      loadInitialData();
      window.addEventListener('subscriptionUpdated', refreshFromServer);
      window.addEventListener('userStatusChanged', refreshFromServer);
    });

    onUnmounted(() => {
      window.removeEventListener('subscriptionUpdated', refreshFromServer);
      window.removeEventListener('userStatusChanged', refreshFromServer);
    });

    return {
      loading, user, tempUser, isEditingName, oldPassword, newPassword, confirmPassword,
      promocode, applyingPromo, promoError, promoSuccess, showDeleteModal,
      currentPlan, currentPlanLabel, subscriptionExpiryInfo,
      currentUsageMessages, currentUsageImages, usageLimitsMessages, usageLimitsImages, isGoogleUser,
      refreshFromServer, loadInitialData, startEditingName, cancelEditingName, saveNameChanges,
      saveChanges, sendPasswordReset, goToUpgrade, applyPromocode, goToProfile, handleLogout,
      confirmDeleteAccount, deleteAccount
    };
  }
};
</script>