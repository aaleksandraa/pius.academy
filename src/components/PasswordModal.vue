<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { X } from 'lucide-vue-next'

const emit = defineEmits<{ close: [] }>()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const message = ref('')
const isSuccess = ref(false)

async function handleSubmit() {
  if (newPassword.value !== confirmPassword.value) {
    message.value = 'Lozinke se ne poklapaju'
    isSuccess.value = false
    return
  }

  if (newPassword.value.length < 6) {
    message.value = 'Lozinka mora imati najmanje 6 karaktera'
    isSuccess.value = false
    return
  }

  loading.value = true
  message.value = ''

  try {
    await authStore.updatePassword(currentPassword.value, newPassword.value, confirmPassword.value)
    message.value = 'Lozinka je uspješno promijenjena'
    isSuccess.value = true
    setTimeout(() => emit('close'), 2000)
  } catch (err: any) {
    message.value = err.response?.data?.message || 'Greška pri promjeni lozinke'
    isSuccess.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-dark-900 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-dark-800 shadow-2xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Promijeni lozinku</h3>
        <button @click="emit('close')" class="text-gray-400 hover:text-gold-500 transition-colors">
          <X class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Trenutna lozinka</label>
          <input v-model="currentPassword" type="password" required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nova lozinka</label>
          <input v-model="newPassword" type="password" required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Potvrdi lozinku</label>
          <input v-model="confirmPassword" type="password" required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" />
        </div>

        <p v-if="message" :class="['text-sm', isSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400']">{{ message }}</p>

        <button type="submit" :disabled="loading" class="w-full btn-gold text-white font-medium py-3 rounded-xl disabled:opacity-50">
          {{ loading ? 'Promena...' : 'Promijeni lozinku' }}
        </button>
      </form>
    </div>
  </div>
</template>
