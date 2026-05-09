<template>
  <TransitionGroup name="toast" tag="div" class="toast-container">
    <div 
      v-for="toast in toasts" 
      :key="toast.id" 
      :class="['toast-item', toast.type]"
      role="alert"
      aria-live="polite"
    >
      <div class="toast-icon">
        <span v-if="toast.type === 'success'">✅</span>
        <span v-else-if="toast.type === 'error'">❌</span>
        <span v-else-if="toast.type === 'warning'">⚠️</span>
        <span v-else>ℹ️</span>
      </div>
      <div class="toast-content">
        {{ toast.message }}
      </div>
      <button class="toast-close" @click="remove(toast.id)" aria-label="Close">×</button>
    </div>
  </TransitionGroup>
</template>

<script>
import { reactive, onMounted, onUnmounted } from 'vue';

export const toastState = reactive({
  toasts: [],
  add(message, type = 'info', duration = 3000) {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  },
  remove(id) {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index !== -1) this.toasts.splice(index, 1);
  }
});

export default {
  setup() {
    const remove = (id) => toastState.remove(id);
    
    // Allow global access via window for non-vue files if needed (legacy or debug)
    onMounted(() => {
      window.showToast = (msg, type, dur) => toastState.add(msg, type, dur);
    });

    return { 
      toasts: toastState.toasts,
      remove
    };
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

html[dir="rtl"] .toast-container {
  right: auto;
  left: 20px;
}

.toast-item {
  pointer-events: auto;
  min-width: 280px;
  max-width: 400px;
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-left: 4px solid var(--primary);
  animation: slideIn 0.3s ease-out;
}

html[dir="rtl"] .toast-item {
  border-left: none;
  border-right: 4px solid var(--primary);
}

.toast-item.success { border-color: var(--success); }
.toast-item.error { border-color: var(--danger); }
.toast-item.warning { border-color: var(--warning); }

.toast-icon { font-size: 1.2rem; }
.toast-content { flex: 1; font-size: 0.9rem; font-weight: 600; color: var(--text-main); }

.toast-close {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: var(--text-light);
  cursor: pointer;
  padding: 0 4px;
}
.toast-close:hover { color: var(--text-main); }

@keyframes slideIn {
  from { opacity: 0; transform: translateX(50px); }
  to { opacity: 1; transform: translateX(0); }
}

html[dir="rtl"] @keyframes slideIn {
  from { opacity: 0; transform: translateX(-50px); }
  to { opacity: 1; transform: translateX(0); }
}

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateY(-20px); }
.toast-leave-to { opacity: 0; transform: scale(0.9); }
</style>
