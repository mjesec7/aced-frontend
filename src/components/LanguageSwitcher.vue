<template>
  <div class="language-switcher" :class="{ 'compact': compact }" ref="switcherRef">
    <button
      class="lang-button"
      :class="{ 'active': isDropdownOpen }"
      @click="toggleDropdown"
      type="button"
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

    <!-- Teleport dropdown to body to escape ALL parent stacking contexts -->
    <Teleport to="body">
      <!-- Backdrop - catches clicks outside dropdown -->
      <Transition name="lang-fade">
        <div
          v-if="isDropdownOpen"
          class="lang-switcher-backdrop"
          @click="closeDropdown"
        ></div>
      </Transition>

      <!-- Dropdown menu - highest z-index -->
      <Transition name="lang-dropdown">
        <div
          v-if="isDropdownOpen"
          class="lang-switcher-dropdown"
          :style="dropdownStyle"
          @click.stop
        >
          <div class="lang-dropdown-header">
            <span class="lang-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </span>
            <span>{{ $t('common.selectLanguage') }}</span>
          </div>
          <div class="lang-dropdown-options">
            <button
              v-for="lang in languages"
              :key="lang.code"
              class="lang-dropdown-option"
              :class="{ 'active': currentLanguage === lang.code }"
              @click="selectLanguage(lang.code)"
              type="button"
            >
              <span class="lang-option-flag">{{ lang.flag }}</span>
              <span class="lang-option-label">{{ lang.label }}</span>
              <span v-if="currentLanguage === lang.code" class="lang-option-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
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
    const {
      language: currentLanguage,
      languages,
      currentLanguageLabel,
      setLanguage
    } = useLanguage();

    const isDropdownOpen = ref(false);
    const switcherRef = ref(null);
    
    // Use maximum safe z-index to ensure dropdown is always on top
    const dropdownStyle = reactive({
      position: 'fixed',
      top: '0px',
      left: '0px',
      zIndex: 2147483647 // Maximum 32-bit signed integer
    });

    const updateDropdownPosition = () => {
      if (!switcherRef.value || !isDropdownOpen.value) return;

      const rect = switcherRef.value.getBoundingClientRect();
      const dropdownWidth = window.innerWidth < 480 ? 180 : 220;
      const dropdownHeight = 200; // Approximate height
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 16;

      // Position below the button
      let top = rect.bottom + 8;
      let left = rect.left;

      // If dropdown would go off right edge, align to right edge of button
      if (left + dropdownWidth > viewportWidth - padding) {
        left = rect.right - dropdownWidth;
      }

      // If still off left edge, align to left with padding
      if (left < padding) {
        left = padding;
      }

      // If dropdown would go below viewport, position above button
      if (top + dropdownHeight > viewportHeight - padding) {
        top = rect.top - dropdownHeight - 8;
      }

      // Ensure top is never negative
      if (top < padding) {
        top = padding;
      }

      dropdownStyle.top = `${top}px`;
      dropdownStyle.left = `${left}px`;
    };

    const toggleDropdown = (event) => {
      event.stopPropagation();
      isDropdownOpen.value = !isDropdownOpen.value;
      if (isDropdownOpen.value) {
        nextTick(() => {
          updateDropdownPosition();
        });
      }
    };

    const closeDropdown = () => {
      isDropdownOpen.value = false;
    };

    const selectLanguage = (code) => {
      setLanguage(code);
      isDropdownOpen.value = false;
    };

    const handleKeydown = (event) => {
      if (event.key === 'Escape' && isDropdownOpen.value) {
        closeDropdown();
      }
    };

    const handleScroll = () => {
      if (isDropdownOpen.value) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (isDropdownOpen.value) {
        updateDropdownPosition();
      }
    };

    onMounted(() => {
      document.addEventListener('keydown', handleKeydown);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    });

    return {
      languages,
      currentLanguage,
      currentLanguageLabel,
      isDropdownOpen,
      switcherRef,
      dropdownStyle,
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
  z-index: 100;
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

/* Responsive */
@media (max-width: 640px) {
  .lang-text {
    display: none;
  }

  .lang-button {
    padding: 8px 10px;
    gap: 4px;
  }
}
</style>

<style>
/* ============================================
   LANGUAGE SWITCHER - GLOBAL STYLES
   Teleported elements must NOT be scoped!
   Using unique prefixed class names to avoid conflicts
   ============================================ */

/* Backdrop - catches clicks and covers entire screen */
.lang-switcher-backdrop {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483646 !important; /* Just below dropdown */
  background: transparent !important;
  cursor: default;
}

/* Dropdown container */
.lang-switcher-dropdown {
  position: fixed !important;
  min-width: 200px;
  max-width: 260px;
  background: white !important;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 12px 24px rgba(139, 92, 246, 0.15),
    0 0 0 1px rgba(139, 92, 246, 0.05);
  overflow: hidden;
  z-index: 2147483647 !important; /* Maximum z-index */
  isolation: isolate;
  pointer-events: auto !important;
}

/* Dropdown header */
.lang-switcher-dropdown .lang-dropdown-header {
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

.lang-switcher-dropdown .lang-header-icon svg {
  width: 16px;
  height: 16px;
  color: #8b5cf6;
}

/* Dropdown options container */
.lang-switcher-dropdown .lang-dropdown-options {
  padding: 8px;
}

/* Individual option buttons */
.lang-switcher-dropdown .lang-dropdown-option {
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

.lang-switcher-dropdown .lang-dropdown-option:hover {
  background: #f3e8ff;
  color: #7c3aed;
}

.lang-switcher-dropdown .lang-dropdown-option.active {
  background: #f3e8ff;
  color: #7c3aed;
}

.lang-switcher-dropdown .lang-option-flag {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  min-width: 28px;
}

.lang-switcher-dropdown .lang-dropdown-option.active .lang-option-flag {
  color: #7c3aed;
}

.lang-switcher-dropdown .lang-option-label {
  flex: 1;
}

.lang-switcher-dropdown .lang-option-check svg {
  width: 16px;
  height: 16px;
  color: #7c3aed;
}

/* Dropdown animation */
.lang-dropdown-enter-active,
.lang-dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.lang-dropdown-enter-from,
.lang-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.lang-dropdown-enter-to,
.lang-dropdown-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Backdrop fade animation */
.lang-fade-enter-active,
.lang-fade-leave-active {
  transition: opacity 0.15s ease;
}

.lang-fade-enter-from,
.lang-fade-leave-to {
  opacity: 0;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .lang-switcher-dropdown {
    min-width: 180px;
    max-width: calc(100vw - 32px);
  }

  .lang-switcher-dropdown .lang-dropdown-option {
    padding: 10px 12px;
    font-size: 0.875rem;
  }

  .lang-switcher-dropdown .lang-dropdown-header {
    padding: 12px 14px;
    font-size: 0.75rem;
  }
}

/* Extra small mobile */
@media (max-width: 380px) {
  .lang-switcher-dropdown {
    min-width: 160px;
  }

  .lang-switcher-dropdown .lang-dropdown-option {
    padding: 8px 10px;
    font-size: 0.8125rem;
    gap: 8px;
  }
}
</style>