<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/imageUrl'
import { useAuthStore } from '@/stores/auth'
import { useConfirm } from '@/composables/useConfirm'
import { useAppResume } from '@/composables/useAppResume'
import { useNotificationRefresh } from '@/composables/useNotificationRefresh'
import { Plus, HelpCircle, MessageCircle, Trash2, Send, X, Edit2, Reply } from 'lucide-vue-next'
import ImageLightbox from '@/components/ImageLightbox.vue'
import MentionInput from '@/components/MentionInput.vue'
import AudioRecorder from '@/components/AudioRecorder.vue'

interface Question {
  id: number
  student_id: number
  student: { id: number; name: string }
  question_text: string
  image_url: string | null
  answers_count: number
  created_at: string
}

interface Answer {
  id: number
  educator_id: number
  educator: { id: number; name: string }
  answer_text: string
  audio_url: string | null
  created_at: string
}

const authStore = useAuthStore()
const { confirm } = useConfirm()
const questions = ref<Question[]>([])
const answers = ref<Record<number, Answer[]>>({})
const expandedQuestion = ref<number | null>(null)
const answerText = ref<Record<number, string>>({})
const showModal = ref(false)
const newQuestion = ref({ question_text: '' })
const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(1)
const hasMore = ref(false)
const lightboxImage = ref<string | null>(null)
const answerInputRefs = ref<Record<number, any>>({})
const sendingAudio = ref<Record<number, boolean>>({})

// Edit states
const editingQuestionId = ref<number | null>(null)
const editQuestionText = ref('')
const editingAnswerId = ref<number | null>(null)
const editAnswerText = ref('')

onMounted(() => loadQuestions())

// Refresh data when app returns from background
useAppResume(() => {
  loadQuestions()
  // Refresh answers for expanded question if any
  if (expandedQuestion.value) {
    loadAnswers(expandedQuestion.value)
  }
})

// Refresh when user taps on push notification
useNotificationRefresh(() => {
  loadQuestions()
  // Refresh answers for expanded question if any
  if (expandedQuestion.value) {
    loadAnswers(expandedQuestion.value)
  }
}, '/questions')

async function loadQuestions(page = 1) {
  const isLoadMore = page > 1
  if (isLoadMore) {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const { data } = await api.get('/questions', {
      params: { page }
    })
    const loadedQuestions = data.questions ?? []

    questions.value = isLoadMore ? [...questions.value, ...loadedQuestions] : loadedQuestions
    currentPage.value = data.meta?.current_page ?? page
    const lastPage = data.meta?.last_page ?? currentPage.value
    hasMore.value = currentPage.value < lastPage
  } finally {
    if (isLoadMore) {
      loadingMore.value = false
    } else {
      loading.value = false
    }
  }
}

async function loadMoreQuestions() {
  await loadQuestions(currentPage.value + 1)
}

async function loadAnswers(questionId: number) {
  const { data } = await api.get(`/questions/${questionId}/answers`)
  answers.value[questionId] = data.answers
}

async function toggleAnswers(questionId: number) {
  if (expandedQuestion.value === questionId) {
    expandedQuestion.value = null
  } else {
    expandedQuestion.value = questionId
    if (!answers.value[questionId]) await loadAnswers(questionId)
  }
}

async function createQuestion() {
  if (!newQuestion.value.question_text) return
  loading.value = true
  try {
    await api.post('/questions', newQuestion.value)
    showModal.value = false
    newQuestion.value = { question_text: '' }
    await loadQuestions()
  } finally {
    loading.value = false
  }
}

async function addAnswer(questionId: number) {
  if (!answerText.value[questionId]?.trim()) return
  await api.post(`/questions/${questionId}/answers`, { answer_text: answerText.value[questionId] })
  answerText.value[questionId] = ''
  await loadAnswers(questionId)
  const q = questions.value.find(q => q.id === questionId)
  if (q) q.answers_count++
}

async function addAudioAnswer(questionId: number, audioBlob: Blob) {
  sendingAudio.value[questionId] = true
  try {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.webm')
    await api.post(`/questions/${questionId}/answers`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    await loadAnswers(questionId)
    const q = questions.value.find(q => q.id === questionId)
    if (q) q.answers_count++
  } finally {
    sendingAudio.value[questionId] = false
  }
}

async function deleteQuestion(questionId: number) {
  const confirmed = await confirm({
    title: 'Obriši pitanje',
    message: 'Da li ste sigurni da želite obrisati ovo pitanje i sve odgovore?',
    confirmText: 'Da, obriši',
    cancelText: 'Otkaži'
  })
  if (!confirmed) return
  await api.delete(`/questions/${questionId}`)
  questions.value = questions.value.filter(q => q.id !== questionId)
}

function startEditQuestion(question: Question) {
  editingQuestionId.value = question.id
  editQuestionText.value = question.question_text
}

function cancelEditQuestion() {
  editingQuestionId.value = null
  editQuestionText.value = ''
}

async function saveEditQuestion(question: Question) {
  if (!editQuestionText.value.trim()) return
  await api.put(`/questions/${question.id}`, { question_text: editQuestionText.value })
  question.question_text = editQuestionText.value
  editingQuestionId.value = null
  editQuestionText.value = ''
}

function startEditAnswer(answer: Answer) {
  editingAnswerId.value = answer.id
  editAnswerText.value = answer.answer_text
}

function cancelEditAnswer() {
  editingAnswerId.value = null
  editAnswerText.value = ''
}

async function saveEditAnswer(answer: Answer) {
  if (!editAnswerText.value.trim()) return
  await api.put(`/question-answers/${answer.id}`, { answer_text: editAnswerText.value })
  answer.answer_text = editAnswerText.value
  editingAnswerId.value = null
  editAnswerText.value = ''
}

async function deleteAnswer(questionId: number, answerId: number) {
  const confirmed = await confirm({
    title: 'Obriši odgovor',
    message: 'Da li ste sigurni da želite obrisati ovaj odgovor?',
    confirmText: 'Da, obriši',
    cancelText: 'Otkaži'
  })
  if (!confirmed) return
  await api.delete(`/question-answers/${answerId}`)
  answers.value[questionId] = answers.value[questionId].filter(a => a.id !== answerId)
  const q = questions.value.find(q => q.id === questionId)
  if (q) q.answers_count--
}

function replyToAnswer(questionId: number, educatorName: string) {
  answerText.value[questionId] = `@${educatorName} `
  setTimeout(() => answerInputRefs.value[questionId]?.focus(), 50)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

function formatAnswerContent(content: string) {
  return content.replace(/@(\w+(?:\s+\w+)?)/g, '<span class="text-gold-600 dark:text-gold-400 font-medium">@$1</span>')
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gradient-gold">Pitanja</h1>
      <button @click="showModal = true" class="flex items-center space-x-2 btn-gold text-white px-4 py-2.5 rounded-xl font-medium">
        <Plus class="w-4 h-4" /><span>Postavi pitanje</span>
      </button>
    </div>

    <div class="space-y-4">
      <div v-for="question in questions" :key="question.id" class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800 card-hover">
        <div class="flex items-start space-x-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white">
            <HelpCircle class="w-5 h-5" />
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center space-x-2">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ question.student.name }}</h3>
                <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(question.created_at) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <button v-if="authStore.user?.id === question.student_id" @click="startEditQuestion(question)" class="text-blue-500 hover:text-blue-600 p-1 transition-colors"><Edit2 class="w-4 h-4" /></button>
                <button v-if="authStore.user?.id === question.student_id || authStore.isAdmin" @click="deleteQuestion(question.id)" class="text-red-500 hover:text-red-600 p-1 transition-colors"><Trash2 class="w-4 h-4" /></button>
              </div>
            </div>
            <div v-if="editingQuestionId === question.id" class="mt-2">
              <textarea v-model="editQuestionText" rows="3" class="w-full px-4 py-3 rounded-xl border border-gold-300 dark:border-gold-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea>
              <div class="flex justify-end gap-2 mt-2">
                <button @click="cancelEditQuestion" class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">Otkaži</button>
                <button @click="saveEditQuestion(question)" class="px-3 py-1.5 text-sm bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors">Sačuvaj</button>
              </div>
            </div>
            <p v-else class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ question.question_text }}</p>
            <img v-if="question.image_url" :src="getImageUrl(question.image_url)" alt="Question" @click="lightboxImage = getImageUrl(question.image_url)" class="mt-3 rounded-xl max-h-64 object-cover border border-gray-200 dark:border-dark-700 cursor-pointer hover:opacity-90 transition-opacity" />
          </div>
        </div>

        <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-800">
          <button @click="toggleAnswers(question.id)" class="flex items-center space-x-2 text-gray-500 hover:text-gold-500 transition-colors">
            <MessageCircle class="w-5 h-5" /><span class="text-sm font-medium">{{ question.answers_count }}</span>
          </button>
        </div>

        <div v-if="expandedQuestion === question.id" class="mt-4 space-y-3">
          <div class="space-y-2">
            <div v-for="answer in answers[question.id]" :key="answer.id" class="bg-gray-50 dark:bg-dark-800 rounded-xl p-3 border border-gray-100 dark:border-dark-700">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center space-x-2">
                  <span class="text-xs px-2 py-0.5 rounded-full bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400 border border-gold-200 dark:border-gold-800">Edukator</span>
                  <span class="font-medium text-sm text-gray-800 dark:text-gold-300">{{ answer.educator.name }}</span>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(answer.created_at) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button @click="replyToAnswer(question.id, answer.educator.name)" class="text-gold-500 hover:text-gold-600 p-1 transition-colors" title="Odgovori"><Reply class="w-3 h-3" /></button>
                  <button v-if="authStore.user?.id === answer.educator_id" @click="startEditAnswer(answer)" class="text-blue-500 hover:text-blue-600 p-1 transition-colors"><Edit2 class="w-3 h-3" /></button>
                  <button v-if="authStore.user?.id === answer.educator_id || authStore.isAdmin" @click="deleteAnswer(question.id, answer.id)" class="text-red-500 hover:text-red-600 p-1 transition-colors"><Trash2 class="w-3 h-3" /></button>
                </div>
              </div>
              <audio v-if="answer.audio_url" :src="getImageUrl(answer.audio_url)" controls controlsList="nodownload" class="w-full max-w-sm mt-1" />
              <div v-else-if="editingAnswerId === answer.id" class="mt-2">
                <input v-model="editAnswerText" @keypress.enter="saveEditAnswer(answer)" type="text" class="w-full px-3 py-2 rounded-lg border border-gold-300 dark:border-gold-700 bg-white dark:bg-dark-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" />
                <div class="flex justify-end gap-2 mt-2">
                  <button @click="cancelEditAnswer" class="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-colors">Otkaži</button>
                  <button @click="saveEditAnswer(answer)" class="px-2 py-1 text-xs bg-gold-500 text-white rounded hover:bg-gold-600 transition-colors">Sačuvaj</button>
                </div>
              </div>
              <p v-else-if="answer.answer_text" class="text-sm text-gray-600 dark:text-gray-400" v-html="formatAnswerContent(answer.answer_text)"></p>
            </div>
          </div>
          <div class="flex items-center gap-2 w-full">
            <MentionInput
              :ref="el => answerInputRefs[question.id] = el"
              v-model="answerText[question.id]"
              @submit="addAnswer(question.id)"
              placeholder="Odgovor... (koristi @ za označavanje)"
              class="flex-1 min-w-0"
            />
            <AudioRecorder 
              @send="(blob) => addAudioAnswer(question.id, blob)"
              @cancel="() => {}"
              :disabled="sendingAudio[question.id]"
            />
            <button @click="addAnswer(question.id)" :disabled="!answerText[question.id]?.trim()" class="flex-shrink-0 btn-gold text-white p-2.5 rounded-xl disabled:opacity-50 transition-all">
              <Send class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="!questions.length && !loading" class="text-center py-12">
        <p class="text-gray-400 dark:text-gray-500">Nema pitanja</p>
      </div>

      <div v-if="hasMore && questions.length > 0" class="flex justify-center pt-2">
        <button
          @click="loadMoreQuestions"
          :disabled="loadingMore"
          class="px-5 py-2.5 rounded-xl border border-gold-300 dark:border-gold-700 text-gold-600 dark:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ loadingMore ? 'Učitavanje...' : 'Učitaj starija pitanja' }}
        </button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-lg w-full p-6 border border-gray-200 dark:border-dark-800 shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">Novo pitanje</h3>
          <button @click="showModal = false" class="text-gray-400 hover:text-gold-500 transition-colors"><X class="w-6 h-6" /></button>
        </div>
        <form @submit.prevent="createQuestion" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Vaše pitanje</label>
            <textarea v-model="newQuestion.question_text" rows="4" placeholder="Postavite vaše pitanje..." required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea>
          </div>
          <button type="submit" :disabled="loading || !newQuestion.question_text" class="w-full btn-gold text-white font-medium py-3 rounded-xl disabled:opacity-50">
            {{ loading ? 'Slanje...' : 'Postavi pitanje' }}
          </button>
        </form>
      </div>
    </div>

    <ImageLightbox v-if="lightboxImage" :src="lightboxImage" @close="lightboxImage = null" />
  </div>
</template>
