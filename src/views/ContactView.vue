<script setup lang="ts">
import { Mail, MessageCircle } from 'lucide-vue-next'
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-gradient-gold mb-2">Kontakt</h1>
    <p class="text-gray-500 dark:text-gray-400 mb-8">
      Imate pitanje ili trebate tehničku pomoć? Kontaktirajte nas!
    </p>

    <div class="grid md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800 card-hover">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Informacije</h2>

        <div class="space-y-4">
          <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0">
              <Mail class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
              <a href="mailto:info@pius-academy.com" class="text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors">
                info@pius-academy.com
              </a>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0">
              <MessageCircle class="w-5 h-5 text-white" />
            </div>
            <div>
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Viber</p>
              <a href="viber://chat?number=%2B38766882702" class="text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors">
                +387 66 882 702
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
