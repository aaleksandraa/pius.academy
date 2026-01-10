import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable za detekciju novih podataka bez automatskog refresh-a
 * Prikazuje notifikaciju korisniku da ima novih podataka
 * Korisnik odlučuje kada da učita nove podatke
 */
export function useNewContentNotifier(
  checkForNewContent: () => Promise<boolean>,
  intervalSeconds: number = 30
) {
  const hasNewContent = ref(false)
  const newContentCount = ref(0)
  let intervalId: number | null = null
  let isActive = ref(true)

  onMounted(() => {
    // Pokreni interval za provjeru novih podataka
    intervalId = window.setInterval(async () => {
      if (isActive.value && !hasNewContent.value) {
        try {
          const hasNew = await checkForNewContent()
          if (hasNew) {
            hasNewContent.value = true
            newContentCount.value++
          }
        } catch (error) {
          console.error('Failed to check for new content:', error)
        }
      }
    }, intervalSeconds * 1000)

    // Pauziraj provjeru kada tab nije aktivan
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  function handleVisibilityChange() {
    isActive.value = !document.hidden
  }

  /**
   * Resetuje notifikaciju nakon što korisnik učita nove podatke
   */
  function markAsViewed() {
    hasNewContent.value = false
    newContentCount.value = 0
  }

  return {
    hasNewContent,
    newContentCount,
    markAsViewed,
  }
}
