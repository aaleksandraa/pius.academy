import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/api'

interface InAppNotification {
  id: number
  type: string
  title: string
  message: string
  link: string | null
  created_at: string
}

interface ToastNotification extends InAppNotification {
  show: boolean
  timeout?: number
}

/**
 * Composable za in-app notifikacije (toast notifikacije)
 * Prikazuje notifikacije dok korisnik aktivno koristi aplikaciju
 * Kada korisnik klikne na notifikaciju, navigira na stranicu i refresh-uje podatke
 */
export function useInAppNotifications() {
  const router = useRouter()
  const toastNotifications = ref<ToastNotification[]>([])
  let pollInterval: number | null = null
  let lastCheckTime = new Date()

  onMounted(() => {
    // Poll for new notifications every 10 seconds
    pollInterval = window.setInterval(checkForNewNotifications, 10000)
    
    // Listen for push notifications received while app is open
    window.addEventListener('in-app-notification-received', handleInAppNotification as EventListener)
  })

  onUnmounted(() => {
    if (pollInterval) {
      clearInterval(pollInterval)
    }
    window.removeEventListener('in-app-notification-received', handleInAppNotification as EventListener)
  })

  function handleInAppNotification(event: any) {
    const notification = event.detail
    showToast(notification)
  }

  async function checkForNewNotifications() {
    try {
      const { data } = await api.get('/notifications', {
        params: {
          since: lastCheckTime.toISOString()
        }
      })

      if (data.notifications && data.notifications.length > 0) {
        // Filter only new notifications
        const newNotifications = data.notifications.filter((n: InAppNotification) => {
          const notificationTime = new Date(n.created_at)
          return notificationTime > lastCheckTime
        })

        // Show toast for each new notification
        newNotifications.forEach((notification: InAppNotification) => {
          showToast(notification)
        })

        lastCheckTime = new Date()
      }
    } catch (error) {
      // Ignore errors silently
      console.error('Failed to check for new notifications:', error)
    }
  }

  function showToast(notification: InAppNotification) {
    const toast: ToastNotification = {
      ...notification,
      show: true
    }

    toastNotifications.value.push(toast)

    // Auto-hide after 5 seconds
    toast.timeout = window.setTimeout(() => {
      hideToast(toast.id)
    }, 5000)
  }

  function hideToast(id: number) {
    const index = toastNotifications.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const toast = toastNotifications.value[index]
      if (toast.timeout) {
        clearTimeout(toast.timeout)
      }
      toastNotifications.value.splice(index, 1)
    }
  }

  function handleToastClick(notification: ToastNotification) {
    hideToast(notification.id)
    
    if (notification.link) {
      router.push(notification.link)
      
      // Emit event to trigger refresh on the target page
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refresh-from-notification', {
          detail: { 
            link: notification.link, 
            type: notification.type 
          }
        }))
      }, 100)
    }
  }

  return {
    toastNotifications,
    hideToast,
    handleToastClick
  }
}
