<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/imageUrl'
import { useAuthStore } from '@/stores/auth'
import { useConfirm } from '@/composables/useConfirm'
import { Plus, MessageSquare, FileText, Trash2, Send, X, Image as ImageIcon, Edit2, Reply } from 'lucide-vue-next'
import ImageLightbox from '@/components/ImageLightbox.vue'
import MentionInput from '@/components/MentionInput.vue'
import AudioRecorder from '@/components/AudioRecorder.vue'

interface Work {
  id: number
  student_id: number
  student: { id: number; name: string }
  title: string
  description: string | null
  image_url: string | null
  file_url: string | null
  feedback_count: number
  created_at: string
}

interface Feedback {
  id: number
  educator_id: number
  educator: { id: number; name: string; role: string }
  feedback_text: string
  audio_url: string | null
  created_at: string
}

const authStore = useAuthStore()
const { confirm } = useConfirm()
const works = ref<Work[]>([])
const feedback = ref<Record<number, Feedback[]>>({})
const expandedWork = ref<number | null>(null)
const feedbackText = ref<Record<number, string>>({})
const showModal = ref(false)
const newWork = ref({ title: '', description: '' })
const selectedImage = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const loading = ref(false)
const lightboxImage = ref<string | null>(null)
const feedbackInputRefs = ref<Record<number, any>>({})
const sendingAudio = ref<Record<number, boolean>>({})

// Edit states
const editingWorkId = ref<number | null>(null)
const editWorkTitle = ref('')
const editWorkDescription = ref('')
const editingFeedbackId = ref<number | null>(null)
const editFeedbackText = ref('')

onMounted(() => loadWorks())

async function loadWorks() {
  loading.value = true
  try {
    const { data } = await api.get('/works')
    works.value = data.works
  } finally {
    loading.value = false
  }
}

async function loadFeedback(workId: number) {
  const { data } = await api.get(`/works/${workId}/feedback`)
  feedback.value[workId] = data.feedback
}

async function toggleFeedback(workId: number) {
  if (expandedWork.value === workId) {
    expandedWork.value = null
  } else {
    expandedWork.value = workId
    if (!feedback.value[workId]) await loadFeedback(workId)
  }
}

function handleImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    selectedImage.value = file
    const reader = new FileReader()
    reader.onloadend = () => imagePreview.value = reader.result as string
    reader.readAsDataURL(file)
  }
}

async function createWork() {
  if (!newWork.value.title) return
  loading.value = true
  try {
    const formData = new FormData()
    formData.append('title', newWork.value.title)
    formData.append('description', newWork.value.description)
    if (selectedImage.value) formData.append('image', selectedImage.value)
    await api.post('/works', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    showModal.value = false
    newWork.value = { title: '', description: '' }
    selectedImage.value = null
    imagePreview.value = null
    loadWorks()
  } finally {
    loading.value = false
  }
}

async function addFeedback(workId: number) {
  if (!feedbackText.value[workId]?.trim()) return
  await api.post(`/works/${workId}/feedback`, { feedback_text: feedbackText.value[workId] })
  feedbackText.value[workId] = ''
  await loadFeedback(workId)
}

async function addAudioFeedback(workId: number, audioBlob: Blob) {
  sendingAudio.value[workId] = true
  try {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.webm')
    await api.post(`/works/${workId}/feedback`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    await loadFeedback(workId)
    const w = works.value.find(w => w.id === workId)
    if (w) w.feedback_count++
  } finally {
    sendingAudio.value[workId] = false
  }
}

async function deleteWork(workId: number) {
  const confirmed = await confirm({
    title: 'Obriši rad',
    message: 'Da li ste sigurni da želite obrisati ovaj rad i sve komentare?',
    confirmText: 'Da, obriši',
    cancelText: 'Otkaži'
  })
  if (!confirmed) return
  await api.delete(`/works/${workId}`)
  works.value = works.value.filter(w => w.id !== workId)
}

function startEditWork(work: Work) {
  editingWorkId.value = work.id
  editWorkTitle.value = work.title
  editWorkDescription.value = work.description || ''
}

function cancelEditWork() {
  editingWorkId.value = null
  editWorkTitle.value = ''
  editWorkDescription.value = ''
}

async function saveEditWork(work: Work) {
  if (!editWorkTitle.value.trim()) return
  await api.put(`/works/${work.id}`, { title: editWorkTitle.value, description: editWorkDescription.value })
  work.title = editWorkTitle.value
  work.description = editWorkDescription.value
  editingWorkId.value = null
  editWorkTitle.value = ''
  editWorkDescription.value = ''
}

function startEditFeedback(fb: Feedback) {
  editingFeedbackId.value = fb.id
  editFeedbackText.value = fb.feedback_text
}

function cancelEditFeedback() {
  editingFeedbackId.value = null
  editFeedbackText.value = ''
}

async function saveEditFeedback(fb: Feedback) {
  if (!editFeedbackText.value.trim()) return
  await api.put(`/work-feedback/${fb.id}`, { feedback_text: editFeedbackText.value })
  fb.feedback_text = editFeedbackText.value
  editingFeedbackId.value = null
  editFeedbackText.value = ''
}

async function deleteFeedback(workId: number, feedbackId: number) {
  const confirmed = await confirm({
    title: 'Obriši komentar',
    message: 'Da li ste sigurni da želite obrisati ovaj komentar?',
    confirmText: 'Da, obriši',
    cancelText: 'Otkaži'
  })
  if (!confirmed) return
  await api.delete(`/work-feedback/${feedbackId}`)
  feedback.value[workId] = feedback.value[workId].filter(f => f.id !== feedbackId)
  const w = works.value.find(w => w.id === workId)
  if (w) w.feedback_count--
}

function replyToFeedback(workId: number, educatorName: string) {
  feedbackText.value[workId] = `@${educatorName} `
  setTimeout(() => feedbackInputRefs.value[workId]?.focus(), 50)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatFeedbackContent(content: string) {
  return content.replace(/@(\w+(?:\s+\w+)?)/g, '<span class="text-gold-600 dark:text-gold-400 font-medium">@$1</span>')
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gradient-gold">Radovi</h1>
      <button @click="showModal = true" class="flex items-center space-x-2 btn-gold text-white px-4 py-2.5 rounded-xl font-medium">
        <Plus class="w-4 h-4" /><span>Dodaj novi rad</span>
      </button>
    </div>

    <div class="space-y-4">
      <div v-for="work in works" :key="work.id" class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800 card-hover">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <h3 v-if="editingWorkId !== work.id" class="text-xl font-semibold text-gray-900 dark:text-white">{{ work.student?.name }} - {{ work.title }}</h3>
              <div class="flex items-center gap-1">
                <button v-if="authStore.user?.id === work.student_id" @click="startEditWork(work)" class="text-blue-500 hover:text-blue-600 p-1 transition-colors"><Edit2 class="w-4 h-4" /></button>
                <button v-if="authStore.user?.id === work.student_id || authStore.isAdmin" @click="deleteWork(work.id)" class="text-red-500 hover:text-red-600 p-1 transition-colors"><Trash2 class="w-4 h-4" /></button>
              </div>
            </div>
            <p class="text-sm text-gray-400 dark:text-gray-500">{{ formatDate(work.created_at) }}</p>
          </div>
        </div>

        <!-- Edit work form -->
        <div v-if="editingWorkId === work.id" class="mb-4 space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Naslov</label>
            <input v-model="editWorkTitle" type="text" class="w-full px-4 py-2 rounded-xl border border-gold-300 dark:border-gold-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Opis</label>
            <textarea v-model="editWorkDescription" rows="3" class="w-full px-4 py-2 rounded-xl border border-gold-300 dark:border-gold-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea>
          </div>
          <div class="flex justify-end gap-2">
            <button @click="cancelEditWork" class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">Otkaži</button>
            <button @click="saveEditWork(work)" class="px-3 py-1.5 text-sm bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors">Sačuvaj</button>
          </div>
        </div>

        <p v-else-if="work.description" class="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">{{ work.description }}</p>
        <img v-if="work.image_url" :src="getImageUrl(work.image_url)" alt="Work" @click="lightboxImage = getImageUrl(work.image_url)" class="rounded-xl mb-3 max-w-full h-auto cursor-pointer border border-gray-200 dark:border-dark-700 hover:opacity-90 transition-opacity" style="max-height: 600px" />
        <a v-if="work.file_url" :href="getImageUrl(work.file_url)" target="_blank" class="inline-flex items-center space-x-2 text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 mb-3 transition-colors">
          <FileText class="w-4 h-4" /><span class="text-sm">Preuzmi priloženi dokument</span>
        </a>

        <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-800">
          <button @click="toggleFeedback(work.id)" class="flex items-center space-x-2 text-gray-500 hover:text-gold-500 transition-colors">
            <MessageSquare class="w-5 h-5" /><span class="text-sm font-medium">{{ work.feedback_count }}</span>
          </button>
        </div>

        <div v-if="expandedWork === work.id" class="mt-4 space-y-3">
          <div class="space-y-2">
            <div v-for="fb in feedback[work.id]" :key="fb.id" class="bg-gray-50 dark:bg-dark-800 rounded-xl p-3 border border-gray-100 dark:border-dark-700">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center space-x-2">
                  <span class="text-xs px-2 py-0.5 rounded-full bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400 border border-gold-200 dark:border-gold-800">
                    {{ fb.educator.role === 'admin' ? 'Admin' : fb.educator.role === 'educator' ? 'Edukator' : 'Učenik' }}
                  </span>
                  <span class="font-medium text-sm text-gray-800 dark:text-gold-300">{{ fb.educator.name }}</span>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(fb.created_at) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button @click="replyToFeedback(work.id, fb.educator.name)" class="text-gold-500 hover:text-gold-600 p-1 transition-colors" title="Odgovori"><Reply class="w-3 h-3" /></button>
                  <button v-if="authStore.user?.id === fb.educator_id" @click="startEditFeedback(fb)" class="text-blue-500 hover:text-blue-600 p-1 transition-colors"><Edit2 class="w-3 h-3" /></button>
                  <button v-if="authStore.user?.id === fb.educator_id || authStore.isAdmin" @click="deleteFeedback(work.id, fb.id)" class="text-red-500 hover:text-red-600 p-1 transition-colors"><Trash2 class="w-3 h-3" /></button>
                </div>
              </div>
              <audio v-if="fb.audio_url" :src="getImageUrl(fb.audio_url)" controls controlsList="nodownload" class="w-full max-w-sm mt-1" />
              <div v-else-if="editingFeedbackId === fb.id" class="mt-2">
                <input v-model="editFeedbackText" @keypress.enter="saveEditFeedback(fb)" type="text" class="w-full px-3 py-2 rounded-lg border border-gold-300 dark:border-gold-700 bg-white dark:bg-dark-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" />
                <div class="flex justify-end gap-2 mt-2">
                  <button @click="cancelEditFeedback" class="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-colors">Otkaži</button>
                  <button @click="saveEditFeedback(fb)" class="px-2 py-1 text-xs bg-gold-500 text-white rounded hover:bg-gold-600 transition-colors">Sačuvaj</button>
                </div>
              </div>
              <p v-else-if="fb.feedback_text" class="text-sm text-gray-600 dark:text-gray-400" v-html="formatFeedbackContent(fb.feedback_text)"></p>
            </div>
          </div>
          <div class="flex items-end gap-2 w-full">
            <MentionInput
              :ref="el => feedbackInputRefs[work.id] = el"
              v-model="feedbackText[work.id]"
              @submit="addFeedback(work.id)"
              placeholder="Komentar... (koristi @ za označavanje)"
              :is-textarea="true"
              :rows="2"
              class="flex-1 min-w-0"
            />
            <div class="flex flex-col gap-2">
              <AudioRecorder 
                @send="(blob) => addAudioFeedback(work.id, blob)"
                @cancel="() => {}"
                :disabled="sendingAudio[work.id]"
              />
              <button @click="addFeedback(work.id)" :disabled="!feedbackText[work.id]?.trim()" class="flex-shrink-0 btn-gold text-white p-2.5 rounded-xl disabled:opacity-50 transition-all">
                <Send class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!works.length && !loading" class="text-center py-12">
        <p class="text-gray-400 dark:text-gray-500">Nema predatih radova</p>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-lg w-full p-6 border border-gray-200 dark:border-dark-800 shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">Novi rad</h3>
          <button @click="showModal = false; selectedImage = null; imagePreview = null" class="text-gray-400 hover:text-gold-500 transition-colors"><X class="w-6 h-6" /></button>
        </div>
        <form @submit.prevent="createWork" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Naslov rada</label>
            <input v-model="newWork.title" type="text" required placeholder="Unesite naslov rada" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Opis (opciono)</label>
            <textarea v-model="newWork.description" rows="4" placeholder="Dodajte opis vašeg rada..." class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea>
          </div>
          <div>
            <label class="flex items-center space-x-2 cursor-pointer text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors">
              <ImageIcon class="w-5 h-5" /><span class="text-sm">Dodaj sliku</span>
              <input type="file" accept="image/*" @change="handleImageSelect" class="hidden" />
            </label>
            <img v-if="imagePreview" :src="imagePreview" alt="Preview" class="mt-2 rounded-xl max-h-48 object-cover border border-gray-200 dark:border-dark-700" />
          </div>
          <button type="submit" :disabled="loading || !newWork.title" class="w-full btn-gold text-white font-medium py-3 rounded-xl disabled:opacity-50">
            {{ loading ? 'Slanje...' : 'Predaj rad' }}
          </button>
        </form>
      </div>
    </div>

    <ImageLightbox v-if="lightboxImage" :src="lightboxImage" @close="lightboxImage = null" />
  </div>
</template>
