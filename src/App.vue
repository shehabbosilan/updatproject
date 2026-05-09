<template>
  <div class="app-wrapper">
    <!-- Global Loading Bar -->
    <div v-if="isLoading" class="global-loader"></div>
    
    <router-view />
    
    <!-- Global Toast System -->
    <BaseToast />
  </div>
</template>

<script>
import { watch, ref, provide } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseToast from '@/components/common/BaseToast.vue';

export default {
  components: { BaseToast },
  setup() {
    const { locale } = useI18n();
    const isLoading = ref(false);

    // Provide global loading state to all components
    provide('setLoading', (val) => { isLoading.value = val; });
    
    // Persistence and Document updates
    watch(locale, (newLocale) => {
      document.documentElement.lang = newLocale;
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem('lang', newLocale);
    }, { immediate: true });

    return { isLoading };
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700;800&display=swap');
@import './assets/main.css';

/* Global Loading Bar */
.global-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--primary);
  z-index: 9999;
  animation: loadingBar 2s infinite ease-in-out;
  transform-origin: 0% 50%;
}

@keyframes loadingBar {
  0% { transform: scaleX(0); }
  50% { transform: scaleX(0.5); }
  100% { transform: scaleX(1); opacity: 0; }
}

/* Accessibility: Focus Rings */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Custom Scrollbar for better look */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bg-main);
}
::-webkit-scrollbar-thumb {
  background: var(--text-light);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>

