import Swal from 'sweetalert2'

export const useSweetAlert = () => {
  const showSuccess = (title: string, text?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text: text || '',
      confirmButtonColor: '#2563eb',
      timer: 3000,
      timerProgressBar: true,
    })
  }

  const showError = (title: string, text?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text: text || '',
      confirmButtonColor: '#dc2626',
    })
  }

  const showWarning = (title: string, text?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text: text || '',
      confirmButtonColor: '#f59e0b',
    })
  }

  const showInfo = (title: string, text?: string) => {
    return Swal.fire({
      icon: 'info',
      title,
      text: text || '',
      confirmButtonColor: '#2563eb',
    })
  }

  const showConfirm = async (
    title: string,
    text: string,
    confirmButtonText: string = 'Yes, proceed',
    cancelButtonText: string = 'Cancel',
    confirmButtonColor: string = '#2563eb',
    danger: boolean = false
  ) => {
    const result = await Swal.fire({
      title,
      text,
      icon: danger ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: danger ? '#dc2626' : confirmButtonColor,
      cancelButtonColor: '#6b7280',
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
    })
    return result.isConfirmed
  }

  const showLoading = (title: string = 'Loading...') => {
    Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading()
      },
    })
  }

  const close = () => {
    Swal.close()
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showLoading,
    close,
  }
}

