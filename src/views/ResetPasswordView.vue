<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="auth-title">Set New Password</h2>
      
      <form @submit.prevent="handleResetPassword" class="auth-form" v-if="!success">
        <div class="form-group">
          <label for="password">New Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="Enter new password"
          />
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            required 
            placeholder="Confirm new password"
          />
        </div>
        
        <div v-if="message" :class="['message', isError ? 'error' : 'success']">
          {{ message }}
        </div>
        
        <button type="submit" class="auth-btn" :disabled="isLoading">
          {{ isLoading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>

      <div v-else class="success-view">
        <div class="message success">{{ message }}</div>
        <router-link to="/login" class="auth-btn" style="text-align: center; display: block; text-decoration: none;">Go to Login</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResetPasswordView',
  data() {
    return {
      password: '',
      confirmPassword: '',
      message: '',
      isError: false,
      isLoading: false,
      success: false
    }
  },
  methods: {
    async handleResetPassword() {
      if (this.password !== this.confirmPassword) {
        this.isError = true;
        this.message = "Passwords do not match.";
        return;
      }

      this.isLoading = true;
      this.message = '';
      this.isError = false;
      
      const token = this.$route.params.token;

      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            token,
            newPassword: this.password 
          })
        });

        const data = await response.json();

        if (response.ok) {
          this.success = true;
          this.message = data.message;
        } else {
          this.isError = true;
          this.message = data.message || 'Failed to process request';
        }
      } catch (err) {
        this.isError = true;
        this.message = 'Network error. Please try again.';
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
  height: 100vh;
  background-color: #f5f7fa;
}
.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}
.auth-title {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}
.auth-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}
.auth-btn:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}
.message {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
  padding: 10px;
  border-radius: 4px;
}
.message.error {
  color: #f44336;
  background-color: #ffebee;
}
.message.success {
  color: #4CAF50;
  background-color: #e8f5e9;
  margin-bottom: 1rem;
}
</style>
