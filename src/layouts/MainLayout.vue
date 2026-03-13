<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import api from '@/lib/api'
import { Home, BookOpen, Video, FileText, HelpCircle, Image, Mail, Users, LogOut, Sun, Moon, Settings, Menu, X, Package, ClipboardList } from 'lucide-vue-next'
import PasswordModal from '@/components/PasswordModal.vue'
import NotificationDropdown from '@/components/NotificationDropdown.vue'
import InAppNotificationToast from '@/components/InAppNotificationToast.vue'
import { useInAppNotifications } from '@/composables/useInAppNotifications'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const mobileMenuOpen = ref(false)
const showPasswordModal = ref(false)
const materialsEnabled = ref(true)

// In-app notifications
const { toastNotifications, hideToast, handleToastClick } = useInAppNotifications()

onMounted(async () => {
  try {
    const { data } = await api.get('/materials/check-enabled')
    materialsEnabled.value = data.enabled
  } catch {
    materialsEnabled.value = false
  }
})

const navigation = [
  { name: 'Početna', icon: Home, route: 'feed', roles: ['admin', 'educator', 'student'] },
  { name: 'Kurs', icon: BookOpen, route: 'course', roles: ['admin', 'educator', 'student'] },
  { name: 'Zoom Snimci', icon: Video, route: 'zoom', roles: ['admin', 'educator', 'student'] },
  { name: 'Testovi', icon: FileText, route: 'tests', roles: ['admin', 'educator', 'student'] },
  { name: 'Rezultati testova', icon: ClipboardList, route: 'test-results', roles: ['admin', 'educator'] },
  { name: 'Pitanja', icon: HelpCircle, route: 'questions', roles: ['admin', 'educator', 'student'] },
  { name: 'Radovi', icon: Image, route: 'works', roles: ['admin', 'educator', 'student'] },
  { name: 'Materijali', icon: Package, route: 'materials', roles: ['admin', 'educator', 'student'], dynamic: true },
  { name: 'Kontakt', icon: Mail, route: 'contact', roles: ['admin', 'educator', 'student'] },
  { name: 'Admin', icon: Users, route: 'admin', roles: ['admin'] },
]

const visibleNav = computed(() => {
  return navigation.filter(item => {
    if (!item.roles.includes(authStore.user?.role || '')) return false
    // Show materials only if enabled (or always for admin)
    if (item.dynamic && item.route === 'materials') {
      return materialsEnabled.value || authStore.isAdmin
    }
    return true
  })
})

function navigate(routeName: string) {
  router.push({ name: routeName })
  mobileMenuOpen.value = false
}

async function handleLogout() {
  await authStore.logout()
}
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-dark-950">
    <!-- Top Navigation Bar -->
    <nav class="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800 sticky top-0 z-50 pt-[env(safe-area-inset-top)] native-status-bar-padding">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <span class="text-xl font-bold text-gradient-gold">PIUS ACADEMY</span>
          </div>
          <div class="flex items-center space-x-2 sm:space-x-4">
            <NotificationDropdown />
            <button @click="themeStore.toggleTheme" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 border border-gray-200 dark:border-dark-700 transition-all">
              <Moon v-if="!themeStore.isDark" class="w-5 h-5 text-gray-600" />
              <Sun v-else class="w-5 h-5 text-gold-400" />
            </button>
            <span class="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">{{ authStore.user?.name }}</span>
            <button @click="showPasswordModal = true" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 border border-gray-200 dark:border-dark-700 transition-all hidden sm:block" title="Promijeni lozinku">
              <Settings class="w-5 h-5 text-gray-600 dark:text-gold-400" />
            </button>
            <button @click="handleLogout" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 border border-gray-200 dark:border-dark-700 transition-all hidden sm:block">
              <LogOut class="w-5 h-5 text-gray-600 dark:text-gold-400" />
            </button>
            <button @click="mobileMenuOpen = !mobileMenuOpen" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 border border-gray-200 dark:border-dark-700 transition-all sm:hidden">
              <X v-if="mobileMenuOpen" class="w-5 h-5 text-gray-600 dark:text-gold-400" />
              <Menu v-else class="w-5 h-5 text-gray-600 dark:text-gold-400" />
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop Navigation -->
      <div class="hidden sm:block border-t border-gray-100 dark:border-dark-800 overflow-x-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex space-x-1 py-2">
            <button
              v-for="item in visibleNav"
              :key="item.route"
              @click="navigate(item.route)"
              :class="[
                'flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                route.name === item.route
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-lg shadow-gold-500/25'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-gray-50 dark:hover:bg-dark-800'
              ]"
            >
              <component :is="item.icon" class="w-4 h-4" />
              <span>{{ item.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div v-if="mobileMenuOpen" class="sm:hidden border-t border-gray-100 dark:border-dark-800 bg-white dark:bg-dark-900">
        <div class="px-4 py-3 space-y-1">
          <button
            v-for="item in visibleNav"
            :key="item.route"
            @click="navigate(item.route)"
            :class="[
              'w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
              route.name === item.route
                ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-gray-50 dark:hover:bg-dark-800'
            ]"
          >
            <component :is="item.icon" class="w-5 h-5" />
            <span>{{ item.name }}</span>
          </button>
          <div class="border-t border-gray-100 dark:border-dark-800 pt-2 mt-2">
            <button @click="showPasswordModal = true; mobileMenuOpen = false" class="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-gray-50 dark:hover:bg-dark-800 transition-all">
              <Settings class="w-5 h-5" />
              <span>Promijeni lozinku</span>
            </button>
            <button @click="handleLogout" class="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-400 hover:bg-gray-50 dark:hover:bg-dark-800 transition-all">
              <LogOut class="w-5 h-5" />
              <span>Odjavi se</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>

    <!-- In-App Notification Toasts -->
    <InAppNotificationToast 
      :notifications="toastNotifications" 
      @click="handleToastClick"
      @close="hideToast"
    />

    <PasswordModal v-if="showPasswordModal" @close="showPasswordModal = false" />
  </div>
</template>
