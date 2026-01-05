<template>
  <div class="language-switcher" :class="{ 'compact': compact }">
    <button
      class="lang-button"
      :class="{ 'active': isDropdownOpen }"
      @click="toggleDropdown"
    >
      <span class="lang-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </span>
      <span v-if="!compact" class="lang-text">{{ currentLanguageLabel }}</span>
      <span class="lang-arrow" :class="{ 'rotated': isDropdownOpen }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </span>
    </button>

    <Transition name="dropdown">
      <div v-if="isDropdownOpen" class="lang-dropdown" @click.stop>
        <div class="dropdown-header">
          <span class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </span>
          <span>{{ $t('common.selectLanguage') }}</span>
        </div>
        <div class="dropdown-options">
          <button
            v-for="lang in languages"
            :key="lang.code"
            class="lang-option"
            :class="{ 'active': currentLanguage === lang.code }"
            @click="selectLanguage(lang.code)"
          >
            <span class="option-flag">{{ lang.flag }}</span>
            <span class="option-label">{{ lang.label }}</span>
            <span v-if="currentLanguage === lang.code" class="option-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
          </button>
        </div>
      </div>
    </Transition>

    <div v-if="isDropdownOpen" class="dropdown-backdrop" @click="closeDropdown"></div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useLanguage } from '@/composables/useLanguage';

export default {
  name: 'LanguageSwitcher',

  props: {
    compact: {
      type: Boolean,
      default: false
    }
  },

  setup() {
    // Use the global language composable for reactive language management
    const {
      language: currentLanguage,
      languages,
      currentLanguageLabel,
      setLanguage
    } = useLanguage();

    const isDropdownOpen = ref(false);

    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value;
    };

    const closeDropdown = () => {
      isDropdownOpen.value = false;
    };

    const selectLanguage = (code) => {
      // Use the global setLanguage function - this updates i18n, localStorage, and emits events
      setLanguage(code);
      isDropdownOpen.value = false;
    };

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (isDropdownOpen.value && !event.target.closest('.language-switcher')) {
        isDropdownOpen.value = false;
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      languages,
      currentLanguage,
      currentLanguageLabel,
      isDropdownOpen,
      toggleDropdown,
      closeDropdown,
      selectLanguage
    };
  }
};
</script>

<style scoped>
.language-switcher {
  position: relative;
  z-index: 1000;
}

.lang-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lang-button:hover {
  background: rgba(255, 255, 255, 1);
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
}

.lang-button.active {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
}

.lang-icon svg {
  width: 18px;
  height: 18px;
  color: #8b5cf6;
}

.lang-text {
  min-width: 60px;
}

.lang-arrow svg {
  width: 14px;
  height: 14px;
  color: #9ca3af;
  transition: transform 0.2s ease;
}

.lang-arrow.rotated svg {
  transform: rotate(180deg);
}

/* Compact mode */
.language-switcher.compact .lang-button {
  padding: 8px 10px;
  gap: 4px;
}

.language-switcher.compact .lang-text {
  display: none;
}

/* Dropdown */
.lang-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 10000;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
}

.header-icon svg {
  width: 16px;
  height: 16px;
  color: #8b5cf6;
}

.dropdown-options {
  padding: 8px;
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.lang-option:hover {
  background: #f3e8ff;
  color: #7c3aed;
}

.lang-option.active {
  background: #f3e8ff;
  color: #7c3aed;
}

.option-flag {
  font-size: 1.25rem;
}

.option-label {
  flex: 1;
}

.option-check svg {
  width: 16px;
  height: 16px;
  color: #7c3aed;
}

/* Backdrop */
.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive */
@media (max-width: 640px) {
  .lang-dropdown {
    right: -10px;
    min-width: 180px;
  }

  .lang-text {
    display: none;
  }

  .lang-button {
    padding: 8px 10px;
    gap: 4px;
  }
}
</style>
