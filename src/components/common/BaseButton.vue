<template>
  <button 
    :class="['btn', `btn-${variant}`, { 'btn-loading': loading }]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="spinner" aria-hidden="true"></span>
    <span class="btn-text" :class="{ 'text-transparent': loading }">
      <slot></slot>
    </span>
  </button>
</template>

<script>
export default {
  props: {
    variant: { type: String, default: 'primary' },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
  }
}
</script>

<style scoped>
.btn-loading {
  position: relative;
  pointer-events: none;
}

.spinner {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 18px;
  height: 18px;
  margin-left: -9px;
  margin-top: -9px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

.btn-secondary .spinner {
  border-top-color: var(--primary);
  border-color: rgba(0,0,0,0.1);
}

.text-transparent {
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
