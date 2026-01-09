<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}>(), {
  title: 'Potvrda',
  message: 'Da li ste sigurni da želite nastaviti?',
  confirmText: 'Da, obriši',
  cancelText: 'Otkaži',
  danger: true
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-dark-800 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div class="flex items-start space-x-4">
          <div :class="['flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center', danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gold-100 dark:bg-gold-900/30']">
            <AlertTriangle :class="['w-6 h-6', danger ? 'text-red-600 dark:text-red-400' : 'text-gold-600 dark:text-gold-400']" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ title }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm">{{ message }}</p>
          </div>
          <button @click="emit('cancel')" class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button
            @click="emit('cancel')"
            class="px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 border border-gray-200 dark:border-dark-700 transition-colors"
          >
            {{ cancelText }}
          </button>
          <button
            @click="emit('confirm')"
            :class="[
              'px-4 py-2.5 rounded-xl font-medium transition-colors',
              danger
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'btn-gold text-white'
            ]"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
