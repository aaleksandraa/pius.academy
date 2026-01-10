import { ref, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { useRouter } from 'vue-router'
import api from '@/lib/api'

export function usePushNotifications() {
  const router = useRouter()
  const pushToken = ref<string | null>(null)
  const isSupported = ref(false)

  const registerPushNotifications = async () => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications not supported on web')
      return
    }

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions()
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted')
        return
      }

      isSupported.value = true

      // Register with FCM/APNs
      await PushNotifications.register()

      // Listen for registration success
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token:', token.value)
        pushToken.value = token.value

        // Send token to backend
        try {
          await api.post('/push-token', {
            token: token.value,
            platform: Capacitor.getPlatform(),
          })
          console.log('Push token saved to backend')
        } catch (error) {
          console.error('Failed to save push token:', error)
        }
      })

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error)
      })

      // Listen for push notifications received
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification)
        // You can show a local notification or update UI here
      })

      // Listen for push notification action (when user taps notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action:', notification)
        
        // Navigate based on notification data
        const data = notification.notification.data
        if (data?.link) {
          router.push(data.link)
          
          // Emit custom event to trigger refresh on the target page
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refresh-from-notification', {
              detail: { 
                link: data.link, 
                type: data.type || notification.notification.title 
              }
            }))
          }, 100) // Small delay to ensure navigation completes
        }
      })

    } catch (error) {
      console.error('Push notification setup error:', error)
    }
  }

  onMounted(() => {
    registerPushNotifications()
  })

  return {
    pushToken,
    isSupported,
    registerPushNotifications,
  }
}
