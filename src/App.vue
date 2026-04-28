<template>
  <div class="app-wrapper">
    <router-view />
  </div>
</template>

<script>
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const { locale } = useI18n();
    
    // Persistence and Document updates
    watch(locale, (newLocale) => {
      document.documentElement.lang = newLocale;
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
      localStorage.setItem('lang', newLocale);
    }, { immediate: true });

    return { };
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700;800&display=swap');
@import './assets/main.css';

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
