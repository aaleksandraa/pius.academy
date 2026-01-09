<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Eye, EyeOff } from 'lucide-vue-next'
import logo from '@/assets/pius-logo.png'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    console.log('Attempting login with:', email.value)
    await authStore.login(email.value, password.value)
    console.log('Login successful')
  } catch (err: any) {
    console.error('Login error:', err)
    console.error('Error response:', err.response)
    console.error('Error message:', err.message)
    error.value = err.response?.data?.message || err.message || 'Pogrešan email ili lozinka.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gold-600/5 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-md w-full relative z-10">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img :src="logo" alt="PMU Akademija" class="w-40 h-40 mx-auto object-contain" />
      </div>

      <!-- Login Card -->
      <div class="bg-dark-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gold-500/20 shadow-2xl shadow-gold-500/5">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-white mb-2">Dobrodošli</h1>
          <p class="text-gray-400">Prijavite se na vaš nalog</p>
        </div>

        <div v-if="error" class="bg-red-900/30 border border-red-500/30 rounded-xl p-4 mb-6">
          <p class="text-sm text-red-400">{{ error }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full px-4 py-3 rounded-xl border border-dark-700 bg-dark-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
              placeholder="vas@email.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">Lozinka</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full px-4 py-3 rounded-xl border border-dark-700 bg-dark-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold-500 transition-colors"
              >
                <EyeOff v-if="showPassword" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gold-500/20"
          >
            {{ loading ? 'Učitavanje...' : 'Prijavi se' }}
          </button>
        </form>

        <div class="mt-6 text-center">
          <p class="text-xs text-gray-500">© 2026 PMU Akademija. Sva prava zadržana.</p>
        </div>
      </div>
    </div>
  </div>
</template>
