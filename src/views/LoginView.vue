<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Logo -->
      <div class="auth-logo">🌾</div>
      <h2 class="auth-title">{{ $t('common.app_name') }}</h2>
      <p class="auth-subtitle">{{ $t('auth.login') }}</p>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label" for="email">{{ $t('auth.email') }}</label>
          <input
            type="email"
            id="email"
            class="form-control"
            v-model="email"
            required
            :placeholder="$t('auth.email')"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="password">{{ $t('auth.password') }}</label>
          <input
            type="password"
            id="password"
            class="form-control"
            v-model="password"
            required
            :placeholder="$t('auth.password')"
            autocomplete="current-password"
          />
          <div class="forgot-row">
            <router-link to="/forgot-password" class="forgot-link">
              {{ $t('auth.forgot_password') }}
            </router-link>
          </div>
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <BaseButton 
          type="submit" 
          variant="primary" 
          class="auth-btn" 
          :loading="isLoading"
        >
          {{ $t('auth.login') }}
        </BaseButton>
      </form>

      <div class="auth-footer">
        <router-link to="/register" class="auth-link">{{ $t('auth.register') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { useAppSystem } from '@/composables/useAppSystem';
import BaseButton from '@/components/common/BaseButton.vue';

export default {
  name: 'LoginView',
  components: { BaseButton },
  setup() {
    const { toast, setLoading } = useAppSystem();
    return { toast, setLoading };
  },
  data() {
    return { email: '', password: '', errorMessage: '', isLoading: false };
  },
  methods: {
    async handleLogin() {
      this.isLoading = true;
      this.errorMessage = '';
      this.setLoading(true);

      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: this.email, password: this.password })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('jwt_token', data.token);
          localStorage.setItem('email', data.email);
          localStorage.setItem('role', data.role);
          if (data.storeName) localStorage.setItem('store_name', data.storeName);
          this.toast.success(this.$t('auth.login_success') || 'Welcome back!');
          this.$router.push('/');
        } else {
          this.errorMessage = data.message || this.$t('auth.login_error');
          this.toast.error(this.errorMessage);
        }
      } catch (err) {
        this.errorMessage = this.$t('auth.network_error');
        this.toast.error(this.errorMessage);
      } finally {
        this.isLoading = false;
        this.setLoading(false);
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

.auth-logo {
  font-size: 3rem;
  margin-bottom: 8px;
}

.auth-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 4px;
}

.auth-subtitle {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.auth-form { text-align: start; }

.forgot-row {
  margin-top: 6px;
  text-align: end;
}

.forgot-link {
  font-size: 0.82rem;
  color: var(--primary);
  text-decoration: none;
}
.forgot-link:hover { text-decoration: underline; }

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
  border-radius: var(--radius-md);
}

.auth-footer {
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.auth-link {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
}
.auth-link:hover { text-decoration: underline; }

@media (max-width: 480px) {
  .auth-card { padding: 2rem 1.25rem; }
}
</style>

