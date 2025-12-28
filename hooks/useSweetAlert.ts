import Swal from 'sweetalert2'

export const useSweetAlert = () => {
  const showSuccess = (title: string, text?: string) => {
    return Swal.fire({
      title,
      text: text || '',
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#2563eb',
      timer: 3000,
      timerProgressBar: true,
    })
  }

  const showError = (title: string, text?: string) => {
    return Swal.fire({
      title,
      text: text || '',
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc2626',
    })
  }

  const showWarning = (title: string, text?: string) => {
    return Swal.fire({
      title,
      text: text || '',
      icon: 'warning',
      confirmButtonText: 'OK',
      confirmButtonColor: '#f59e0b',
    })
  }

  const showInfo = (title: string, text?: string) => {
    return Swal.fire({
      title,
      text: text || '',
      icon: 'info',
      confirmButtonText: 'OK',
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
      confirmButtonText,
      cancelButtonText,
      confirmButtonColor: danger ? '#dc2626' : confirmButtonColor,
      cancelButtonColor: '#6b7280',
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

  // Direct access to Swal for custom usage
  const fire = (options: any) => {
    return Swal.fire(options)
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showLoading,
    close,
    fire, // Direct access for custom alerts
    Swal, // Export Swal for advanced usage
  }
}

