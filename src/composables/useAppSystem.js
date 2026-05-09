import { inject } from 'vue';
import { toastState } from '@/components/common/BaseToast.vue';

export const useAppSystem = () => {
  const setLoading = inject('setLoading');
  
  const showToast = (message, type = 'info', duration = 3000) => {
    toastState.add(message, type, duration);
  };

  const success = (msg) => showToast(msg, 'success');
  const error = (msg) => showToast(msg, 'error');
  const warn = (msg) => showToast(msg, 'warning');
  const info = (msg) => showToast(msg, 'info');

  return {
    setLoading,
    toast: { success, error, warn, info }
  };
};
