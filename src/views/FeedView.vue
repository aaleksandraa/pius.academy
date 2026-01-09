<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/imageUrl'
import { useAuthStore } from '@/stores/auth'
import { useConfirm } from '@/composables/useConfirm'
import { Plus, MessageCircle, Pin, PinOff, Trash2, Send, Edit2, Reply } from 'lucide-vue-next'
import PostModal from '@/components/PostModal.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import MentionInput from '@/components/MentionInput.vue'
import AudioRecorder from '@/components/AudioRecorder.vue'

interface Post {
  id: number
  author_id: number
  author: { id: number; name: string; role: string }
  content: string | null
  image_url: string | null
  post_type: 'question' | 'work' | 'status'
  is_pinned: boolean
  comments_count: number
  created_at: string
}

interface Comment {
  id: number
  author_id: number
  author: { id: number; name: string; role: string }
  content: string
  audio_url: string | null
  created_at: string
}

const authStore = useAuthStore()
const { confirm } = useConfirm()
const posts = ref<Post[]>([])
const comments = ref<Record<number, Comment[]>>({})
const loading = ref(false)
const showModal = ref(false)
const expandedPost = ref<number | null>(null)
const commentText = ref<Record<number, string>>({})
const lightboxImage = ref<string | null>(null)
const commentInputRefs = ref<Record<number, any>>({})
const sendingAudio = ref<Record<number, boolean>>({})

// Edit states
const editingPostId = ref<number | null>(null)
const editPostContent = ref('')
const editingCommentId = ref<number | null>(null)
const editCommentContent = ref('')

onMounted(() => loadPosts())

async function loadPosts() {
  loading.value = true
  try {
    const { data } = await api.get('/feed')
    posts.value = data.posts
  } finally {
    loading.value = false
  }
}

async function loadComments(postId: number) {
  const { data } = await api.get(`/feed/${postId}/comments`)
  comments.value[postId] = data.comments
}

async function toggleComments(postId: number) {
  if (expandedPost.value === postId) {
    expandedPost.value = null
  } else {
    expandedPost.value = postId
    if (!comments.value[postId]) await loadComments(postId)
  }
}

async function addComment(postId: number) {
  if (!commentText.value[postId]?.trim()) return
  await api.post(`/feed/${postId}/comments`, { content: commentText.value[postId] })
  commentText.value[postId] = ''
  await loadComments(postId)
  const post = posts.value.find(p => p.id === postId)
  if (post) post.comments_count++
}

async function addAudioComment(postId: number, audioBlob: Blob) {
  sendingAudio.value[postId] = true
  try {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.webm')
    await api.post(`/feed/${postId}/comments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    await loadComments(postId)
    const post = posts.value.find(p => p.id === postId)
    if (post) post.comments_count++
  } finally {
    sendingAudio.value[postId] = false
  }
}

async function togglePin(post: Post) {
  await api.post(`/feed/${post.id}/pin`)
  post.is_pinned = !post.is_pinned
}

async function deletePost(postId: number) {
  const confirmed = await confirm({
    title: 'Obriši objavu',
    message: 'Da li ste sigurni da želite obrisati ovu objavu? Ova akcija se ne može poništiti.',
    confirmText: 'Da, obriši',
    cancelText: 'Otkaži'
  })
  if (!confirmed) return
  await api.delete(`/feed/${postId}`)
  posts.value = posts.value.filter(p => p.id !== postId)
}

function startEditPost(post: Post) {
  editingPostId.value = post.id
  editPostContent.value = post.content || ''
}

function cancelEditPost() {
  editingPostId.value = null
  editPostContent.value = ''
}

async function saveEditPost(post: Post) {
  if (!editPostContent.value.trim()) return
  await api.put(`/feed/${post.id}`, { content: editPostContent.value })
  post.content = editPostContent.value
  editingPostId.value = null
  editPostContent.value = ''
}

function startEditComment(comment: Comment) {
  editingCommentId.value = comment.id
  editCommentContent.value = comment.content
}

function cancelEditComment() {
  editingCommentId.value = null
  editCommentContent.value = ''
}

async function saveEditComment(_postId: number, comment: Comment) {
  if (!editCommentContent.value.trim()) return
  await api.put(`/comments/${comment.id}`, { content: editCommentContent.value })
  comment.content = editCommentContent.value
  editingCommentId.value = null
  editCommentContent.value = ''
}

async function deleteComment(postId: number, commentId: number) {
  const confirmed = await confirm({
    title: 'Obriši komentar',
    message: 'Da li ste sigurni da želite obrisati ovaj komentar?',
    confirmText: 'Da, obriši',
    cancelText: 'Otkaži'
  })
  if (!confirmed) return
  try {
    await api.delete(`/comments/${commentId}`)
    comments.value[postId] = comments.value[postId].filter(c => c.id !== commentId)
    const post = posts.value.find(p => p.id === postId)
    if (post) post.comments_count--
  } catch (err: any) {
    console.error('Delete comment error:', err.response?.data || err)
    alert(err.response?.data?.message || 'Greška pri brisanju komentara')
  }
}

function replyToComment(postId: number, authorName: string) {
  commentText.value[postId] = `@${authorName} `
  // Focus the input
  setTimeout(() => {
    commentInputRefs.value[postId]?.focus()
  }, 50)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatCommentContent(content: string) {
  // Convert @mentions to styled spans
  return content.replace(/@(\w+(?:\s+\w+)?)/g, '<span class="text-gold-600 dark:text-gold-400 font-medium">@$1</span>')
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gradient-gold">Početna</h1>
      <button @click="showModal = true" class="flex items-center space-x-2 btn-gold text-white px-4 py-2.5 rounded-xl font-medium">
        <Plus class="w-4 h-4" />
        <span>Nova objava</span>
      </button>
    </div>

    <div class="space-y-4">
      <div v-for="post in posts" :key="post.id" :class="['bg-white dark:bg-dark-900 rounded-xl p-6 border card-hover', post.is_pinned ? 'border-gold-500 shadow-lg shadow-gold-500/10' : 'border-gray-200 dark:border-dark-800']">
        <div v-if="post.is_pinned" class="flex items-center space-x-2 mb-3 text-gold-500">
          <Pin class="w-4 h-4" />
          <span class="text-sm font-medium">Zakačena objava</span>
        </div>

        <div class="mb-4">
          <div class="flex items-start space-x-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {{ post.author.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">{{ post.author.name }}</h3>
                  <p class="text-xs text-gray-500 dark:text-gray-500">{{ formatDate(post.created_at) }}</p>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <div class="flex items-center gap-1">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-800 text-gold-600 dark:text-gold-400 border border-gray-200 dark:border-dark-700">
                      {{ post.author.role === 'educator' ? 'Edukator' : post.author.role === 'admin' ? 'Admin' : 'Učenik' }}
                    </span>
                    <span v-if="post.post_type === 'question'" class="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">Pitanje</span>
                    <span v-if="post.post_type === 'work'" class="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">Rad</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <button v-if="authStore.isAdmin" @click="togglePin(post)" class="text-gold-500 hover:text-gold-600 p-1 transition-colors">
                      <PinOff v-if="post.is_pinned" class="w-4 h-4" />
                      <Pin v-else class="w-4 h-4" />
                    </button>
                    <button v-if="authStore.user?.id === post.author_id" @click="startEditPost(post)" class="text-blue-500 hover:text-blue-600 p-1 transition-colors">
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button v-if="authStore.user?.id === post.author_id || authStore.isAdmin" @click="deletePost(post.id)" class="text-red-500 hover:text-red-600 p-1 transition-colors">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Post content - editable -->
        <div v-if="editingPostId === post.id" class="mb-3">
          <textarea v-model="editPostContent" rows="3" class="w-full px-4 py-3 rounded-xl border border-gold-300 dark:border-gold-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea>
          <div class="flex justify-end gap-2 mt-2">
            <button @click="cancelEditPost" class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">Otkaži</button>
            <button @click="saveEditPost(post)" class="px-3 py-1.5 text-sm bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors">Sačuvaj</button>
          </div>
        </div>
        <!-- Status posts can have HTML formatting -->
        <div v-else-if="post.content && post.post_type === 'status'" class="text-gray-700 dark:text-gray-300 mb-3 post-content" v-html="post.content"></div>
        <!-- Regular posts show plain text -->
        <p v-else-if="post.content" class="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">{{ post.content }}</p>
        <img v-if="post.image_url" :src="getImageUrl(post.image_url)" alt="Post" @click="lightboxImage = getImageUrl(post.image_url)" class="rounded-xl mb-3 max-w-full h-auto cursor-pointer border border-gray-200 dark:border-dark-700 hover:opacity-90 transition-opacity" />

        <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-800">
          <button @click="toggleComments(post.id)" class="flex items-center space-x-2 text-gray-500 hover:text-gold-500 transition-colors">
            <MessageCircle class="w-5 h-5" />
            <span class="text-sm font-medium">{{ post.comments_count }}</span>
          </button>
        </div>

        <div v-if="expandedPost === post.id" class="mt-4 space-y-3">
          <div class="space-y-2">
            <div v-for="comment in comments[post.id]" :key="comment.id" class="bg-gray-50 dark:bg-dark-800 rounded-xl p-3 border border-gray-100 dark:border-dark-700">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-sm text-gray-800 dark:text-gold-300">{{ comment.author.name }}</span>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(comment.created_at) }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <button @click="replyToComment(post.id, comment.author.name)" class="text-gold-500 hover:text-gold-600 p-1 transition-colors" title="Odgovori"><Reply class="w-3 h-3" /></button>
                  <button v-if="authStore.user?.id === comment.author_id" @click="startEditComment(comment)" class="text-blue-500 hover:text-blue-600 p-1 transition-colors"><Edit2 class="w-3 h-3" /></button>
                  <button v-if="authStore.user?.id === comment.author_id || authStore.isAdmin" @click="deleteComment(post.id, comment.id)" class="text-red-500 hover:text-red-600 p-1 transition-colors"><Trash2 class="w-3 h-3" /></button>
                </div>
              </div>
              <audio v-if="comment.audio_url" :src="getImageUrl(comment.audio_url)" controls controlsList="nodownload" class="w-full max-w-sm mt-1" />
              <div v-else-if="editingCommentId === comment.id" class="mt-2">
                <input v-model="editCommentContent" @keypress.enter="saveEditComment(post.id, comment)" type="text" class="w-full px-3 py-2 rounded-lg border border-gold-300 dark:border-gold-700 bg-white dark:bg-dark-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" />
                <div class="flex justify-end gap-2 mt-2">
                  <button @click="cancelEditComment" class="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700 rounded transition-colors">Otkaži</button>
                  <button @click="saveEditComment(post.id, comment)" class="px-2 py-1 text-xs bg-gold-500 text-white rounded hover:bg-gold-600 transition-colors">Sačuvaj</button>
                </div>
              </div>
              <p v-else-if="comment.content" class="text-sm text-gray-600 dark:text-gray-400 comment-content" v-html="formatCommentContent(comment.content)"></p>
            </div>
          </div>

          <div class="flex items-center gap-2 w-full">
            <MentionInput
              :ref="el => commentInputRefs[post.id] = el"
              v-model="commentText[post.id]"
              @submit="addComment(post.id)"
              placeholder="Komentar... (koristi @ za označavanje)"
              class="flex-1 min-w-0"
            />
            <AudioRecorder 
              @send="(blob) => addAudioComment(post.id, blob)"
              @cancel="() => {}"
              :disabled="sendingAudio[post.id]"
            />
            <button @click="addComment(post.id)" :disabled="!commentText[post.id]?.trim()" class="flex-shrink-0 btn-gold text-white p-2.5 rounded-xl disabled:opacity-50 transition-all">
              <Send class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="posts.length === 0 && !loading" class="text-center py-12">
        <p class="text-gray-400 dark:text-gray-500">Nema objava</p>
      </div>
    </div>

    <PostModal v-if="showModal" @close="showModal = false" @created="loadPosts(); showModal = false" />
    <ImageLightbox v-if="lightboxImage" :src="lightboxImage" @close="lightboxImage = null" />
  </div>
</template>
