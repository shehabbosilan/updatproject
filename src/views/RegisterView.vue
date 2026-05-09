<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-logo">🌾</div>
      <h2 class="auth-title">{{ $t('common.app_name') }}</h2>
      <p class="auth-subtitle">{{ $t('auth.register') }}</p>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label class="form-label" for="email">{{ $t('auth.email') }}</label>
          <input type="email" id="email" class="form-control" v-model="email" required :placeholder="$t('auth.email')" autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label" for="storeName">{{ $t('auth.store_name') }}</label>
          <input type="text" id="storeName" class="form-control" v-model="storeName" required :placeholder="$t('auth.store_name')" />
        </div>
        <div class="form-group">
          <label class="form-label" for="password">{{ $t('auth.password') }}</label>
          <input type="password" id="password" class="form-control" v-model="password" required :placeholder="$t('auth.password')" autocomplete="new-password" />
        </div>
        <div class="form-group">
          <label class="form-label" for="inviteCode">{{ $t('auth.invite_code') }}</label>
          <input type="text" id="inviteCode" class="form-control" v-model="inviteCode" required :placeholder="$t('auth.invite_code')" />
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <button type="submit" class="btn btn-primary auth-btn" :disabled="isLoading">
          {{ isLoading ? '...' : $t('auth.register') }}
        </button>
      </form>

      <div class="auth-footer">
        <router-link to="/login" class="auth-link">{{ $t('auth.login') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RegisterView',
  data() {
    return { email: '', password: '', storeName: '', inviteCode: '', errorMessage: '', isLoading: false };
  },
  methods: {
    async handleRegister() {
      this.isLoading = true;
      this.errorMessage = '';
      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: this.email, 
            password: this.password, 
            storeName: this.storeName,
            inviteCode: this.inviteCode 
          })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('jwt_token', data.token);
          localStorage.setItem('email', data.email);
          if (data.storeName) localStorage.setItem('store_name', data.storeName);
          if (data.role) localStorage.setItem('role', data.role);
          this.$router.push('/');
        } else {
          this.errorMessage = data.message || this.$t('auth.register_error');
        }
      } catch (err) {
        this.errorMessage = this.$t('auth.network_error');
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 20px;
}
.auth-card {
  background: white;
  padding: 2.5rem 2rem;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 420px;
  text-align: center;
}
.auth-logo { font-size: 3rem; margin-bottom: 8px; }
.auth-title { font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px; }
.auth-subtitle { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; }
.auth-form { text-align: start; }
.error-message {
  color: var(--danger);
  background: #fee2e2;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  font-size: 0.875rem;
  text-align: center;
}
.auth-btn {
  width: 100%;
  margin-top: 8px;
  padding: 14px;
  font-size: 1rem;
  min-height: 48px;
}
.auth-footer { margin-top: 1.5rem; font-size: 0.9rem; color: var(--text-muted); }
.auth-link { color: var(--primary); font-weight: 600; text-decoration: none; }
.auth-link:hover { text-decoration: underline; }
@media (max-width: 480px) {
  .auth-card { padding: 2rem 1.25rem; }
}
</style>
