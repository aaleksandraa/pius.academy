import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/api'
import { storage } from '@/lib/storage'
import router from '@/router'

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  role: 'admin' | 'educator' | 'student'
  educator_id?: number
  educator?: { id: number; name: string }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isEducator = computed(() => user.value?.role === 'educator')
  const isStudent = computed(() => user.value?.role === 'student')

  async function checkAuth() {
    // Try to get token from storage
    const token = await storage.get('token')
    if (!token) {
      loading.value = false
      return
    }

    // Sync to localStorage for API interceptor
    storage.setSync('token', token)

    try {
      const { data } = await api.get('/user')
      user.value = data.user
    } catch {
      await storage.remove('token')
      storage.removeSync('token')
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/login', { email, password })
    
    // Save token to both storages
    await storage.set('token', data.token)
    storage.setSync('token', data.token)
    
    user.value = data.user
    router.push('/')
  }

  async function logout() {
    try {
      await api.post('/logout')
    } finally {
      await storage.remove('token')
      storage.removeSync('token')
      user.value = null
      router.push('/login')
    }
  }

  async function updatePassword(currentPassword: string, password: string, passwordConfirmation: string) {
    await api.put('/password', {
      current_password: currentPassword,
      password,
      password_confirmation: passwordConfirmation,
    })
  }

  return {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isEducator,
    isStudent,
    checkAuth,
    login,
    logout,
    updatePassword,
  }
})
