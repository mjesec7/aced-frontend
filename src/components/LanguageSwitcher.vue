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
      <div
        v-if="isDropdownOpen"
        data-lang-backdrop
        :style="backdropStyle"
        @click="closeDropdown"
      ></div>

      <!-- Dropdown menu - highest z-index -->
      <Transition name="lang-dropdown">
        <div
          v-if="isDropdownOpen"
          data-lang-dropdown
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
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
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
    const dropdownPosition = reactive({ top: 0, left: 0 });

    // Backdrop style - covers entire viewport
    const backdropStyle = computed(() => ({
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      width: '100vw',
      height: '100vh',
      zIndex: 2147483646,
      background: 'transparent',
      cursor: 'default'
    }));

    // Dropdown style - positioned relative to button, highest z-index
    const dropdownStyle = computed(() => ({
      position: 'fixed',
      top: `${dropdownPosition.top}px`,
      left: `${dropdownPosition.left}px`,
      zIndex: 2147483647,
      minWidth: '200px',
      maxWidth: '260px',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '14px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 12px 24px rgba(139, 92, 246, 0.15)',
      overflow: 'hidden',
      pointerEvents: 'auto'
    }));

    const updateDropdownPosition = () => {
      if (!switcherRef.value || !isDropdownOpen.value) return;

      const rect = switcherRef.value.getBoundingClientRect();
      const dropdownWidth = window.innerWidth < 480 ? 180 : 220;
      const dropdownHeight = 200;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 16;

      let top = rect.bottom + 8;
      let left = rect.left;

      // Align to right edge of button if dropdown would go off right edge
      if (left + dropdownWidth > viewportWidth - padding) {
        left = rect.right - dropdownWidth;
      }

      // Align to left with padding if still off left edge
      if (left < padding) {
        left = padding;
      }

      // Position above button if dropdown would go below viewport
      if (top + dropdownHeight > viewportHeight - padding) {
        top = rect.top - dropdownHeight - 8;
      }

      // Ensure top is never negative
      if (top < padding) {
        top = padding;
      }

      dropdownPosition.top = top;
      dropdownPosition.left = left;
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
      backdropStyle,
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
   Using data attributes for highest specificity
   ============================================ */

/* Dropdown header */
[data-lang-dropdown] .lang-dropdown-header {
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

[data-lang-dropdown] .lang-header-icon svg {
  width: 16px;
  height: 16px;
  color: #8b5cf6;
}

/* Dropdown options container */
[data-lang-dropdown] .lang-dropdown-options {
  padding: 8px;
  background: white;
}

/* Individual option buttons */
[data-lang-dropdown] .lang-dropdown-option {
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

[data-lang-dropdown] .lang-dropdown-option:hover {
  background: #f3e8ff;
  color: #7c3aed;
}

[data-lang-dropdown] .lang-dropdown-option.active {
  background: #f3e8ff;
  color: #7c3aed;
}

[data-lang-dropdown] .lang-option-flag {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  min-width: 28px;
}

[data-lang-dropdown] .lang-dropdown-option.active .lang-option-flag {
  color: #7c3aed;
}

[data-lang-dropdown] .lang-option-label {
  flex: 1;
}

[data-lang-dropdown] .lang-option-check svg {
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

/* Mobile adjustments */
@media (max-width: 640px) {
  [data-lang-dropdown] {
    min-width: 180px !important;
    max-width: calc(100vw - 32px) !important;
  }

  [data-lang-dropdown] .lang-dropdown-option {
    padding: 10px 12px;
    font-size: 0.875rem;
  }

  [data-lang-dropdown] .lang-dropdown-header {
    padding: 12px 14px;
    font-size: 0.75rem;
  }
}

/* Extra small mobile */
@media (max-width: 380px) {
  [data-lang-dropdown] {
    min-width: 160px !important;
  }

  [data-lang-dropdown] .lang-dropdown-option {
    padding: 8px 10px;
    font-size: 0.8125rem;
    gap: 8px;
  }
}
</style>
