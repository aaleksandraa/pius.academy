<script setup lang="ts">
import { Bell, MessageCircle, HelpCircle, Briefcase, Megaphone, AtSign, FileText, Video, BookOpen, Package, X } from 'lucide-vue-next'

interface ToastNotification {
  id: number
  type: string
  title: string
  message: string
  link: string | null
  created_at: string
  show: boolean
}

interface Props {
  notifications: ToastNotification[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [notification: ToastNotification]
  close: [id: number]
}>()

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
</script>

<template>
  <div class="fixed top-20 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
    <TransitionGroup
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 translate-x-full"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-full"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        @click="emit('click', notification)"
        class="bg-white dark:bg-dark-900 rounded-xl shadow-2xl border border-gray-200 dark:border-dark-800 p-4 cursor-pointer hover:shadow-3xl transition-all pointer-events-auto"
      >
        <div class="flex items-start gap-3">
          <!-- Icon -->
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
            <component :is="getIcon(notification.type)" :class="['w-5 h-5', getIconColor(notification.type)]" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {{ notification.title }}
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {{ notification.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            @click.stop="emit('close', notification.id)"
            class="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="mt-3 h-1 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-gold-400 to-gold-600 animate-progress"></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-progress {
  animation: progress 5s linear forwards;
}
</style>
