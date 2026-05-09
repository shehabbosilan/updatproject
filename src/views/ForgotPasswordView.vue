<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="auth-title">Forgot Password</h2>
      <p class="auth-subtitle">Enter your email address to receive a password reset link.</p>
      
      <form @submit.prevent="handleForgotPassword" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            placeholder="Enter your email"
          />
        </div>
        
        <div v-if="message" :class="['message', isError ? 'error' : 'success']">
          {{ message }}
        </div>
        
        <button type="submit" class="auth-btn" :disabled="isLoading">
          {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>
      
      <div class="auth-footer">
        Remember your password? <router-link to="/login">Login here</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ForgotPasswordView',
  data() {
    return {
      email: '',
      message: '',
      isError: false,
      isLoading: false
    }
  },
  methods: {
    async handleForgotPassword() {
      this.isLoading = true;
      this.message = '';
      this.isError = false;
      
      try {
        const response = await fetch(`${process.env.VUE_APP_API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: this.email })
        });

        const data = await response.json();

        if (response.ok) {
          this.message = data.message;
          this.email = ''; // Clear form
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
  margin-bottom: 0.5rem;
  color: #333;
}
.auth-subtitle {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #666;
  font-size: 0.9rem;
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
}
.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}
.auth-footer a {
  color: #2196F3;
  text-decoration: none;
}
</style>
