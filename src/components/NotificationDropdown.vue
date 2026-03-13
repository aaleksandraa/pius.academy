<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/api'
import { Bell, Check, CheckCheck, Trash2, MessageCircle, HelpCircle, Briefcase, Megaphone, AtSign, FileText, Video, BookOpen, Package } from 'lucide-vue-next'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  from_user: { id: number; name: string } | null
  created_at: string
}

const router = useRouter()
const isOpen = ref(false)
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const loading = ref(false)
let pollInterval: number | null = null

onMounted(() => {
  loadUnreadCount()
  // Poll for new notifications every 30 seconds
  pollInterval = window.setInterval(loadUnreadCount, 30000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

async function loadUnreadCount() {
  try {
    const { data } = await api.get('/notifications/unread-count')
    unreadCount.value = data.count
  } catch (e) {
    // Ignore errors
  }
}

async function loadNotifications() {
  loading.value = true
  try {
    const { data } = await api.get('/notifications')
    notifications.value = data.notifications
    unreadCount.value = data.unread_count
    
    // Auto-mark all as read when dropdown is opened
    if (data.unread_count > 0) {
      await markAllAsRead()
    }
  } finally {
    loading.value = false
  }
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    loadNotifications()
  }
}

function closeDropdown() {
  isOpen.value = false
}

async function markAsRead(notification: Notification) {
  if (notification.is_read) return
  await api.post(`/notifications/${notification.id}/read`)
  notification.is_read = true
  unreadCount.value = Math.max(0, unreadCount.value - 1)
}

async function markAllAsRead() {
  await api.post('/notifications/read-all')
  notifications.value.forEach(n => n.is_read = true)
  unreadCount.value = 0
}

async function deleteNotification(notification: Notification) {
  await api.delete(`/notifications/${notification.id}`)
  notifications.value = notifications.value.filter(n => n.id !== notification.id)
  if (!notification.is_read) {
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
}

function handleNotificationClick(notification: Notification) {
  markAsRead(notification)
  if (notification.link) {
    router.push(notification.link)
    closeDropdown()
    
    // Emit event to trigger refresh on the target page
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('refresh-from-notification', {
        detail: { 
          link: notification.link, 
          type: notification.type 
        }
      }))
    }, 100) // Small delay to ensure navigation completes
  }
}

function getIcon(type: string) {
  switch (type) {
    case 'comment_reply': return MessageCircle
    case 'question_answer': return HelpCircle
    case 'work_feedback': return Briefcase
    case 'admin_announcement': return Megaphone
    case 'mention': return AtSign
    case 'new_test': return FileText
    case 'new_zoom': return Video
    case 'new_course': return BookOpen
    case 'new_lesson': return BookOpen
    case 'new_material': return Package
    default: return Bell
  }
}

function getIconColor(type: string) {
  switch (type) {
    case 'comment_reply': return 'text-blue-500'
    case 'question_answer': return 'text-purple-500'
    case 'work_feedback': return 'text-green-500'
    case 'admin_announcement': return 'text-gold-500'
    case 'mention': return 'text-pink-500'
    case 'new_test': return 'text-orange-500'
    case 'new_zoom': return 'text-red-500'
    case 'new_course': return 'text-indigo-500'
    case 'new_lesson': return 'text-indigo-500'
    case 'new_material': return 'text-teal-500'
    default: return 'text-gray-500'
  }
}

function formatDate(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Upravo sada'
  if (minutes < 60) return `Prije ${minutes} min`
  if (hours < 24) return `Prije ${hours}h`
  if (days < 7) return `Prije ${days} dana`
  return d.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="relative">
    <!-- Bell Button -->
    <button
      @click="toggleDropdown"
      class="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-600 dark:text-gray-400 hover:text-gold-500 transition-colors"
    >
      <Bell class="w-5 h-5" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="isOpen"
        class="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-1rem)] bg-white dark:bg-dark-900 rounded-xl shadow-2xl border border-gray-200 dark:border-dark-800 overflow-hidden z-50"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-800">
          <h3 class="font-semibold text-gray-900 dark:text-white">Notifikacije</h3>
          <button
            v-if="notifications.some(n => !n.is_read)"
            @click="markAllAsRead"
            class="text-xs text-gold-500 hover:text-gold-600 flex items-center gap-1"
          >
            <CheckCheck class="w-4 h-4" />
            Označi sve
          </button>
        </div>

        <!-- Notifications List -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="loading" class="p-8 text-center">
            <div class="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>

          <div v-else-if="notifications.length === 0" class="p-8 text-center text-gray-400 dark:text-gray-500">
            Nema notifikacija
          </div>

          <div v-else>
            <div
              v-for="notification in notifications"
              :key="notification.id"
              @click="handleNotificationClick(notification)"
              :class="[
                'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 dark:border-dark-800 last:border-0',
                notification.is_read
                  ? 'bg-white dark:bg-dark-900 hover:bg-gray-50 dark:hover:bg-dark-800'
                  : 'bg-gold-50/50 dark:bg-gold-900/10 hover:bg-gold-50 dark:hover:bg-gold-900/20'
              ]"
            >
              <!-- Icon -->
              <div :class="['flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', notification.is_read ? 'bg-gray-100 dark:bg-dark-800' : 'bg-gold-100 dark:bg-gold-900/30']">
                <component :is="getIcon(notification.type)" :class="['w-4 h-4', getIconColor(notification.type)]" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p :class="['text-sm', notification.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium']">
                  {{ notification.message }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ formatDate(notification.created_at) }}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex-shrink-0 flex items-center gap-1">
                <button
                  v-if="!notification.is_read"
                  @click.stop="markAsRead(notification)"
                  class="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-400 hover:text-green-500 transition-colors"
                  title="Označi kao pročitano"
                >
                  <Check class="w-4 h-4" />
                </button>
                <button
                  @click.stop="deleteNotification(notification)"
                  class="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-400 hover:text-red-500 transition-colors"
                  title="Obriši"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div v-if="isOpen" @click="closeDropdown" class="fixed inset-0 z-40"></div>
  </div>
</template>
