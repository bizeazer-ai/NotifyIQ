import Swal, { type SweetAlertIcon } from 'sweetalert2';

// Toast Mixin for floating notifications
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  background: 'var(--color-surface, #1e293b)',
  color: 'var(--color-foreground, #f8fafc)',
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
  customClass: {
    popup: 'notifyiq-swal-toast',
  },
});

export const toast = {
  success: (message: string, title?: string) => {
    return Toast.fire({
      icon: 'success',
      title: title || message,
      text: title ? message : undefined,
    });
  },
  error: (message: string, title?: string) => {
    return Toast.fire({
      icon: 'error',
      title: title || 'Error',
      text: message,
    });
  },
  info: (message: string, title?: string) => {
    return Toast.fire({
      icon: 'info',
      title: title || 'Notice',
      text: message,
    });
  },
  warning: (message: string, title?: string) => {
    return Toast.fire({
      icon: 'warning',
      title: title || 'Warning',
      text: message,
    });
  },
};

export const swal = {
  alert: (title: string, text: string, icon: SweetAlertIcon = 'info') => {
    return Swal.fire({
      title,
      text,
      icon,
      background: 'var(--color-surface, #1e293b)',
      color: 'var(--color-foreground, #f8fafc)',
      confirmButtonColor: 'var(--color-primary, #059669)',
      customClass: {
        popup: 'notifyiq-swal-modal',
        confirmButton: 'btn btn-primary',
      },
    });
  },

  confirm: async (
    title: string,
    text: string,
    confirmButtonText: string = 'Yes, Proceed',
    cancelButtonText: string = 'Cancel',
    icon: SweetAlertIcon = 'warning',
  ): Promise<boolean> => {
    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      background: 'var(--color-surface, #1e293b)',
      color: 'var(--color-foreground, #f8fafc)',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: 'var(--color-surface-secondary, #334155)',
      reverseButtons: true,
      customClass: {
        popup: 'notifyiq-swal-modal',
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-secondary',
      },
    });
    return result.isConfirmed;
  },
};
