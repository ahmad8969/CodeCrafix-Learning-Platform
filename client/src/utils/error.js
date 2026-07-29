import toast from 'react-hot-toast'

export const notify = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  info: (message) => toast(message),
}

export function getErrorMessage(error, fallback = 'Something went wrong') {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  )
}

export function handleApiError(error) {
  const message = getErrorMessage(error)
  notify.error(message)
  return message
}
