<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { X, Image as ImageIcon, HelpCircle, Briefcase, MessageSquare } from 'lucide-vue-next'
import RichTextEditor from '@/components/RichTextEditor.vue'

const emit = defineEmits<{ close: []; created: [] }>()
const authStore = useAuthStore()

const content = ref('')
const title = ref('')
const postType = ref<'status' | 'question' | 'work'>('question')
const selectedImage = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const loading = ref(false)

// Set default based on role
onMounted(() => {
  postType.value = authStore.isAdmin ? 'status' : 'question'
})

function handleImageSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    selectedImage.value = file
    const reader = new FileReader()
    reader.onloadend = () => imagePreview.value = reader.result as string
    reader.readAsDataURL(file)
  }
}

async function handleSubmit() {
  if (!content.value && !selectedImage.value) return
  if (postType.value === 'work' && !title.value.trim()) return

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('content', content.value)
    formData.append('post_type', postType.value)
    if (postType.value === 'work' && title.value) formData.append('title', title.value)
    if (selectedImage.value) formData.append('image', selectedImage.value)

    await api.post('/feed', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    emit('created')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-dark-900 rounded-xl max-w-lg w-full p-6 border border-gray-200 dark:border-dark-800 shadow-2xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Nova objava</h3>
        <button @click="emit('close')" class="text-gray-400 hover:text-gold-500 transition-colors"><X class="w-6 h-6" /></button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Post Type Selection as Buttons -->
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Šta želite objaviti?</label>
          <div class="grid gap-2" :class="authStore.isAdmin ? 'grid-cols-3' : 'grid-cols-2'">
            <!-- Status - Only for Admin -->
            <button
              v-if="authStore.isAdmin"
              type="button"
              @click="postType = 'status'"
              :class="[
                'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                postType === 'status'
                  ? 'border-gold-500 bg-gold-50 dark:bg-gold-900/20'
                  : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
              ]"
            >
              <MessageSquare :class="['w-6 h-6 mb-2', postType === 'status' ? 'text-gold-500' : 'text-gray-400']" />
              <span :class="['text-sm font-medium', postType === 'status' ? 'text-gold-600 dark:text-gold-400' : 'text-gray-600 dark:text-gray-400']">Status</span>
            </button>

            <!-- Question -->
            <button
              type="button"
              @click="postType = 'question'"
              :class="[
                'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                postType === 'question'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
              ]"
            >
              <HelpCircle :class="['w-6 h-6 mb-2', postType === 'question' ? 'text-blue-500' : 'text-gray-400']" />
              <span :class="['text-sm font-medium', postType === 'question' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400']">Pitanje</span>
            </button>

            <!-- Work -->
            <button
              type="button"
              @click="postType = 'work'"
              :class="[
                'flex flex-col items-center p-4 rounded-xl border-2 transition-all',
                postType === 'work'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
              ]"
            >
              <Briefcase :class="['w-6 h-6 mb-2', postType === 'work' ? 'text-green-500' : 'text-gray-400']" />
              <span :class="['text-sm font-medium', postType === 'work' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400']">Rad</span>
            </button>
          </div>
          <p v-if="postType === 'question'" class="text-xs text-blue-500 mt-2">Pitanje će se automatski pojaviti i na stranici Pitanja</p>
          <p v-if="postType === 'work'" class="text-xs text-green-500 mt-2">Rad će se automatski pojaviti i na stranici Radovi</p>
        </div>

        <div v-if="postType === 'work'">
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Naslov rada <span class="text-red-500">*</span></label>
          <input v-model="title" type="text" placeholder="Unesite naslov rada" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{{ postType === 'question' ? 'Vaše pitanje' : postType === 'work' ? 'Opis rada' : 'Sadržaj' }}</label>
          <!-- Rich text editor for status posts -->
          <RichTextEditor
            v-if="postType === 'status'"
            v-model="content"
            placeholder="Šta želite podijeliti? (podržava bold, italic i linkove)"
          />
          <!-- Regular textarea for questions and works -->
          <textarea v-else v-model="content" rows="4" :placeholder="postType === 'question' ? 'Postavite vaše pitanje...' : 'Opišite vaš rad...'" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea>
        </div>

        <div>
          <label class="flex items-center space-x-2 cursor-pointer text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors">
            <ImageIcon class="w-5 h-5" />
            <span class="text-sm">Dodaj sliku</span>
            <input type="file" accept="image/*" @change="handleImageSelect" class="hidden" />
          </label>
          <img v-if="imagePreview" :src="imagePreview" alt="Preview" class="mt-2 rounded-xl max-h-48 object-cover border border-gray-200 dark:border-dark-700" />
        </div>

        <button type="submit" :disabled="loading || (!content && !selectedImage) || (postType === 'work' && !title.trim())" class="w-full btn-gold text-white font-medium py-3 rounded-xl disabled:opacity-50">
          {{ loading ? 'Objavljivanje...' : 'Objavi' }}
        </button>
      </form>
    </div>
  </div>
</template>
