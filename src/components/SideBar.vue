<template>
  <aside id="sidebar" :class="['sidebar', { 'sidebar-closed': !isOpen }]">
    <div class="sidebar-logo">
      <span class="logo-emoji">🌾</span>
      <span class="logo-text">{{ $t('common.app_name') }}</span>
    </div>
    
    <nav class="sidebar-nav">
      <button
        v-for="item in menuItems"
        :key="item.id"
        :class="['nav-item', { active: currentPage === item.id }]"
        @click="selectPage(item.id)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-text">{{ $t(item.id + '.title') }}</span>
      </button>
    </nav>
  </aside>
</template>

<script>
export default {
  props: ["isOpen", "currentPage"],
  data() {
    return {
      menuItems: [
        { id: 'dashboard', icon: '📊' },
        { id: 'products', icon: '📦' },
        { id: 'inventory', icon: '📋' },
        { id: 'sales', icon: '💰' },
        { id: 'purchases', icon: '🛒' },
        { id: 'customers', icon: '👥' },
        { id: 'suppliers', icon: '🏭' },
        { id: 'treasury', icon: '👛' },
        { id: 'reports', icon: '📈' },
      ]
    };
  },
  methods: {
    selectPage(page) {
      this.$emit("changePage", page);
    },
  },
};
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background: #1e293b;
  color: white;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: fixed;
  top: 0;
  z-index: 1001;
}

html[dir="ltr"] .sidebar { left: 0; }
html[dir="rtl"] .sidebar { right: 0; }

.sidebar-closed {
  transform: translateX(-100%);
}
html[dir="rtl"] .sidebar-closed {
  transform: translateX(100%);
}

.sidebar-logo {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 12px;
  background: rgba(0,0,0,0.2);
}

.logo-emoji { font-size: 1.5rem; }
.logo-text { font-weight: 800; font-size: 1.1rem; letter-spacing: 0.5px; }

.sidebar-nav {
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-weight: 600;
  text-align: inherit;
  width: 100%;
}

.nav-item:hover {
  background: rgba(255,255,255,0.05);
  color: white;
}

.nav-item.active {
  background: var(--primary);
  color: white;
}

.nav-icon { font-size: 1.2rem; min-width: 24px; text-align: center; }

@media (max-width: 768px) {
  .sidebar { width: 280px; }
}
</style>
