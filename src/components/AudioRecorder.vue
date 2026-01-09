<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Mic, Square, X } from 'lucide-vue-next'
import { Capacitor } from '@capacitor/core'

const emit = defineEmits<{
  send: [blob: Blob]
  cancel: []
}>()

const props = defineProps<{
  disabled?: boolean
}>()

const isRecording = ref(false)
const recordingTime = ref(0)
const mediaRecorder = ref<MediaRecorder | null>(null)
const chunks = ref<Blob[]>([])
const timer = ref<number | null>(null)

async function requestMicrophonePermission(): Promise<boolean> {
  try {
    // Try to get user media - this will trigger the native permission dialog
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // Stop the stream immediately, we just wanted to trigger permission
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (err: any) {
    console.log('Microphone permission error:', err.name, err.message)
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      // User denied permission
      if (Capacitor.isNativePlatform()) {
        alert('Pristup mikrofonu je odbijen. Molimo omogućite pristup mikrofonu u postavkama aplikacije.')
      } else {
        alert('Pristup mikrofonu je odbijen. Molimo omogućite pristup mikrofonu u postavkama preglednika.')
      }
      return false
    }
    
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      alert('Mikrofon nije pronađen na ovom uređaju.')
      return false
    }
    
    alert('Greška pri pristupu mikrofonu: ' + err.message)
    return false
  }
}

async function startRecording() {
  try {
    // Request permission and get stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    const recorder = new MediaRecorder(stream)
    mediaRecorder.value = recorder
    chunks.value = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.value.push(e.data)
      }
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks.value, { type: 'audio/webm' })
      stream.getTracks().forEach(track => track.stop())
      emit('send', blob)
      resetState()
    }

    recorder.start()
    isRecording.value = true
    recordingTime.value = 0

    timer.value = window.setInterval(() => {
      recordingTime.value++
    }, 1000)
  } catch (err: any) {
    console.log('Recording error:', err.name, err.message)
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      if (Capacitor.isNativePlatform()) {
        alert('Pristup mikrofonu je odbijen. Molimo omogućite pristup mikrofonu u postavkama aplikacije.')
      } else {
        alert('Pristup mikrofonu je odbijen. Molimo omogućite pristup u postavkama preglednika.')
      }
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      alert('Mikrofon nije pronađen na ovom uređaju.')
    } else {
      alert('Greška pri snimanju: ' + err.message)
    }
  }
}

function stopRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
  }
}

function cancelRecording() {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
    mediaRecorder.value = null
  }
  resetState()
  emit('cancel')
}

function resetState() {
  isRecording.value = false
  recordingTime.value = 0
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
  if (mediaRecorder.value) {
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
  }
})
</script>

<template>
  <div class="flex items-center">
    <!-- Sending State -->
    <div
      v-if="disabled && !isRecording"
      class="flex items-center space-x-2 bg-gold-50 dark:bg-gold-900/20 px-3 py-2 rounded-xl border border-gold-200 dark:border-gold-800"
    >
      <div class="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
      <span class="text-sm text-gold-600 dark:text-gold-400 font-medium">Šalje se...</span>
    </div>

    <!-- Start Recording Button -->
    <button
      v-else-if="!isRecording"
      @click="startRecording"
      :disabled="disabled"
      class="flex-shrink-0 p-2.5 rounded-xl bg-gray-100 dark:bg-dark-800 hover:bg-gold-100 dark:hover:bg-gold-900/30 text-gray-500 hover:text-gold-600 dark:hover:text-gold-400 disabled:opacity-50 transition-all border border-gray-200 dark:border-dark-700"
      title="Snimi glasovnu poruku"
    >
      <Mic class="w-5 h-5" />
    </button>

    <!-- Recording State -->
    <div
      v-else
      class="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800"
    >
      <div class="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
      <span class="text-sm text-red-600 dark:text-red-400 font-medium tabular-nums min-w-[40px]">
        {{ formatTime(recordingTime) }}
      </span>
      <button
        @click="cancelRecording"
        class="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
        title="Otkaži"
      >
        <X class="w-4 h-4" />
      </button>
      <button
        @click="stopRecording"
        class="flex-shrink-0 p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
        title="Zaustavi i pošalji"
      >
        <Square class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
