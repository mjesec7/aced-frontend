<template>
  <div class="language-switcher" :class="{ 'compact': compact }" ref="switcherRef">
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

    <!-- Teleport dropdown to body to avoid z-index/overflow issues -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div 
          v-if="isDropdownOpen" 
          class="lang-dropdown" 
          :style="dropdownStyle"
          @click.stop
        >
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

      <!-- Backdrop also teleported to body -->
      <div 
        v-if="isDropdownOpen" 
        class="dropdown-backdrop" 
        @click="closeDropdown"
      ></div>
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
    
    // Reactive dropdown positioning
    const dropdownStyle = reactive({
      position: 'fixed',
      top: '0px',
      right: '0px',
      zIndex: 99999
    });

    const updateDropdownPosition = () => {
      if (!switcherRef.value || !isDropdownOpen.value) return;
      
      const rect = switcherRef.value.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 220;
      
      // Calculate right position
      let rightPos = viewportWidth - rect.right;
      
      // Ensure dropdown doesn't go off-screen
      if (rect.right - dropdownWidth < 16) {
        rightPos = viewportWidth - dropdownWidth - 16;
      }
      
      dropdownStyle.top = `${rect.bottom + 8}px`;
      dropdownStyle.right = `${Math.max(rightPos, 16)}px`;
    };

    const toggleDropdown = () => {
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

    const handleClickOutside = (event) => {
      if (!isDropdownOpen.value) return;
      
      // Check if click is on the switcher button
      if (switcherRef.value && switcherRef.value.contains(event.target)) {
        return;
      }
      
      // Check if click is on the dropdown
      const dropdown = document.querySelector('.lang-dropdown');
      if (dropdown && dropdown.contains(event.target)) {
        return;
      }
      
      isDropdownOpen.value = false;
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
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
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
/* Global styles for teleported dropdown - not scoped */
.lang-dropdown {
  position: fixed;
  min-width: 200px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(139, 92, 246, 0.1);
  overflow: hidden;
  z-index: 99999;
}

.lang-dropdown .dropdown-header {
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

.lang-dropdown .header-icon svg {
  width: 16px;
  height: 16px;
  color: #8b5cf6;
}

.lang-dropdown .dropdown-options {
  padding: 8px;
}

.lang-dropdown .lang-option {
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

.lang-dropdown .lang-option:hover {
  background: #f3e8ff;
  color: #7c3aed;
}

.lang-dropdown .lang-option.active {
  background: #f3e8ff;
  color: #7c3aed;
}

.lang-dropdown .option-flag {
  font-size: 1.25rem;
}

.lang-dropdown .option-label {
  flex: 1;
}

.lang-dropdown .option-check svg {
  width: 16px;
  height: 16px;
  color: #7c3aed;
}

/* Backdrop - teleported to body */
.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99998;
  background: transparent;
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

/* Mobile adjustments */
@media (max-width: 640px) {
  .lang-dropdown {
    min-width: 180px;
  }
  
  .lang-dropdown .lang-option {
    padding: 10px 12px;
    font-size: 0.875rem;
  }
  
  .lang-dropdown .dropdown-header {
    padding: 12px 14px;
  }
}
</style>