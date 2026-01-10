<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/api'
import { useAppResume } from '@/composables/useAppResume'
import { useNotificationRefresh } from '@/composables/useNotificationRefresh'
import { Video, Calendar, X } from 'lucide-vue-next'

interface Recording {
  id: number
  title: string
  vimeo_embed: string
  vimeo_id: string | null
  vimeo_hash: string | null
  recorded_at: string
}

const recordings = ref<Recording[]>([])
const selectedRecording = ref<Recording | null>(null)
const loading = ref(false)

onMounted(() => loadRecordings())

// Refresh when app returns from background
useAppResume(() => {
  loadRecordings()
})

// Refresh when user taps on push notification
useNotificationRefresh(() => {
  loadRecordings()
}, '/zoom')

async function loadRecordings() {
  loading.value = true
  try {
    const { data } = await api.get('/zoom-recordings')
    recordings.value = data.recordings
  } finally {
    loading.value = false
  }
}

function getVimeoSrc(recording: Recording): string {
  if (!recording.vimeo_id) return ''
  return recording.vimeo_hash
    ? `https://player.vimeo.com/video/${recording.vimeo_id}?h=${recording.vimeo_hash}&badge=0&autopause=0`
    : `https://player.vimeo.com/video/${recording.vimeo_id}?badge=0&autopause=0`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-gradient-gold mb-6">Zoom Snimci</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <button v-for="recording in recordings" :key="recording.id" @click="selectedRecording = recording" class="bg-white dark:bg-dark-900 rounded-xl overflow-hidden border border-gray-200 dark:border-dark-800 hover:border-gold-500 transition-all text-left card-hover">
        <div class="aspect-video bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/20 dark:to-gold-800/20 flex items-center justify-center border-b border-gray-200 dark:border-dark-700">
          <Video class="w-16 h-16 text-gold-500 opacity-80" />
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{{ recording.title }}</h3>
          <div class="flex items-center text-sm text-gray-500 dark:text-gray-500">
            <Calendar class="w-4 h-4 mr-1 text-gold-500" />
            <span>{{ formatDate(recording.recorded_at) }}</span>
          </div>
        </div>
      </button>
    </div>

    <div v-if="!recordings.length && !loading" class="text-center py-12">
      <p class="text-gray-400 dark:text-gray-500">Nema dostupnih snimaka</p>
    </div>

    <!-- Modal -->
    <div v-if="selectedRecording" class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-800 shadow-2xl">
        <div class="sticky top-0 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-800 p-4 flex justify-between items-center">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ selectedRecording.title }}</h3>
          <button @click="selectedRecording = null" class="text-gray-400 hover:text-gold-500 transition-colors">
            <X class="w-6 h-6" />
          </button>
        </div>
        <div class="p-4">
          <div class="aspect-video rounded-xl overflow-hidden relative bg-black border border-gray-200 dark:border-dark-700">
            <iframe :src="getVimeoSrc(selectedRecording)" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe>
          </div>
          <div class="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-500">
            <Calendar class="w-4 h-4 mr-2 text-gold-500" />
            <span>{{ formatDate(selectedRecording.recorded_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
