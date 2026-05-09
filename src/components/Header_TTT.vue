<template>
  <header :class="['app-header', { 'sidebar-shifted': isSidebarOpen }]">
    <div class="header-content">
      <div class="header-left">
        <button 
          class="menu-toggle" 
          @click="$emit('toggle-sidebar')"
          :aria-label="$t('common.toggle_sidebar')"
          :aria-expanded="isSidebarOpen"
          type="button"
        >
          <span class="icon" aria-hidden="true">☰</span>
        </button>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <span class="breadcrumb-item">{{ $t('common.app_name') }}</span>
          <span class="breadcrumb-separator" aria-hidden="true">/</span>
          <span class="breadcrumb-current">{{ $t(currentPage + '.title') }}</span>
        </nav>
      </div>
      
      <div class="header-right">
        <div class="lang-picker">
          <span class="current-lang-flag" aria-hidden="true">{{ currentLang === 'ar' ? '🇪🇬' : '🇺🇸' }}</span>
          <select 
            v-model="$i18n.locale" 
            class="lang-select"
            :aria-label="$t('common.select_language')"
          >
            <option value="en">EN</option>
            <option value="ar">AR</option>
          </select>
        </div>
        
        <div 
          class="user-profile" 
          @click="toggleUserDropdown" 
          @keydown.enter="toggleUserDropdown"
          @keydown.space.prevent="toggleUserDropdown"
          ref="userProfile" 
          tabindex="0"
          role="button"
          :aria-label="$t('common.user_profile')"
          :aria-expanded="isUserDropdownOpen"
          :aria-haspopup="true"
          style="position: relative; cursor: pointer;"
        >
          <div class="user-avatar" aria-hidden="true">{{ userInitials }}</div>
          <div class="user-info">
            <span class="user-name">{{ email }}</span>
            <span class="user-role">{{ $t('common.shop_owner') }}</span>
          </div>
          
          <div v-if="isUserDropdownOpen" class="user-dropdown" role="menu">
            <button 
              class="dropdown-item text-danger" 
              @click.stop="handleLogout"
              role="menuitem"
            >
              <span class="icon" aria-hidden="true">🚪</span> {{ $t('auth.logout') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  props: ["isSidebarOpen", "currentPage"],
  data() {
    return {
      isUserDropdownOpen: false
    };
  },
  computed: {
    currentLang() { return this.$i18n.locale; },
    email() {
      return localStorage.getItem('email') || 'User';
    },
    userInitials() {
      const name = this.email;
      return name ? name.substring(0, 2).toUpperCase() : 'US';
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    toggleUserDropdown() {
      this.isUserDropdownOpen = !this.isUserDropdownOpen;
    },
    handleClickOutside(event) {
      if (this.$refs.userProfile && !this.$refs.userProfile.contains(event.target)) {
        this.isUserDropdownOpen = false;
      }
    },
    async handleLogout() {
      if (window.confirm("Are you sure you want to logout?")) {
        try {
          await fetch(`${process.env.VUE_APP_API_URL}/auth/logout`, {
            method: 'POST'
          });
        } catch (e) {
          console.error("Logout request failed:", e);
        } finally {
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('email');
          this.$router.push('/login');
        }
      }
    }
  }
}
</script>

<style scoped>
.app-header {
  height: var(--header-height);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: all 0.3s ease;
}

.header-content {
  height: 100%;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left { display: flex; align-items: center; gap: 20px; }

.menu-toggle {
  background: var(--bg-muted);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: 0.2s;
}
.menu-toggle:hover { background: var(--primary-light); color: var(--primary); }

.breadcrumb { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.breadcrumb-item { color: var(--text-light); }
.breadcrumb-separator { color: var(--text-light); font-size: 0.8rem; }
.breadcrumb-current { color: var(--text-main); }

.header-right { display: flex; align-items: center; gap: 24px; }

.lang-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-muted);
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
}
.lang-select {
  background: transparent;
  border: none;
  font-weight: 700;
  color: var(--text-main);
  outline: none;
  cursor: pointer;
  font-size: 0.85rem;
}

.user-profile { display: flex; align-items: center; gap: 12px; }
.user-avatar {
  width: 36px;
  height: 36px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8rem;
}
.user-info { display: flex; flex-direction: column; line-height: 1.2; }
.user-name { font-weight: 700; font-size: 0.9rem; color: var(--text-main); }
.user-role { font-size: 0.75rem; color: var(--text-light); }

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid var(--border-color);
  min-width: 150px;
  overflow: hidden;
  z-index: 1001;
}
.dropdown-item {
  width: 100%;
  padding: 10px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: 0.2s;
}
.dropdown-item:hover {
  background: var(--bg-muted);
}
.text-danger {
  color: #dc3545;
}
.text-danger:hover {
  background: #fff5f5;
}

@media (min-width: 769px) {
  html[dir="ltr"] .app-header { margin-left: var(--sidebar-width); }
  html[dir="rtl"] .app-header { margin-right: var(--sidebar-width); }

  html[dir="ltr"] .sidebar-shifted { margin-left: var(--sidebar-width); }
  html[dir="rtl"] .sidebar-shifted { margin-right: var(--sidebar-width); }
}

@media (max-width: 768px) {
  /* Sidebar no longer pushes header on mobile */
  html[dir="ltr"] .app-header,
  html[dir="rtl"] .app-header { margin: 0 !important; }

  /* Hide breadcrumb app name on mobile */
  .breadcrumb-item { display: none; }
  .breadcrumb-separator { display: none; }

  /* Compact header layout */
  .header-content { padding: 0 12px; }
  .header-right { gap: 12px; }

  /* Hide email text, show only avatar */
  .user-info { display: none; }

  /* Compact lang picker */
  .lang-picker { 
    padding: 4px 8px; 
    gap: 4px;
    border-radius: var(--radius-md);
  }
  .lang-select { font-size: 0.75rem; }
}

@media (max-width: 480px) {
  .user-name { max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .breadcrumb-current { font-size: 0.85rem; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

</style>
