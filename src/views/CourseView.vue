<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/api'
import { Play, ArrowLeft } from 'lucide-vue-next'

interface Lesson {
  id: number
  title: string
  vimeo_embed: string
  vimeo_id: string | null
  vimeo_hash: string | null
  thumbnail_url: string | null
  description: string | null
  order_number: number
}

interface Course {
  id: number
  title: string
  description: string | null
  lessons: Lesson[]
}

const courses = ref<Course[]>([])
const selectedLesson = ref<Lesson | null>(null)
const loading = ref(false)

onMounted(() => loadCourses())

async function loadCourses() {
  loading.value = true
  try {
    const { data } = await api.get('/courses')
    courses.value = data.courses
  } finally {
    loading.value = false
  }
}

function getVimeoSrc(lesson: Lesson): string {
  if (!lesson.vimeo_id) return ''
  return lesson.vimeo_hash
    ? `https://player.vimeo.com/video/${lesson.vimeo_id}?h=${lesson.vimeo_hash}&badge=0&autopause=0`
    : `https://player.vimeo.com/video/${lesson.vimeo_id}?badge=0&autopause=0`
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <h1 class="text-3xl font-bold text-gradient-gold mb-6">Kurs Video Materijal</h1>

    <div v-if="selectedLesson" class="space-y-6">
      <button @click="selectedLesson = null" class="flex items-center space-x-2 text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 font-medium transition-colors">
        <ArrowLeft class="w-4 h-4" />
        <span>Nazad na listu lekcija</span>
      </button>

      <div class="bg-white dark:bg-dark-900 rounded-xl shadow-lg border border-gray-200 dark:border-dark-800 overflow-hidden">
        <div class="p-4">
          <div class="aspect-video rounded-xl overflow-hidden relative bg-black border border-gray-200 dark:border-dark-700">
            <iframe :src="getVimeoSrc(selectedLesson)" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe>
          </div>
        </div>
        <div class="p-6 pt-2">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{{ selectedLesson.title }}</h2>
          <p v-if="selectedLesson.description" class="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{{ selectedLesson.description }}</p>
        </div>
      </div>
    </div>

    <div v-else class="space-y-8">
      <div v-for="course in courses" :key="course.id" class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800 card-hover">
        <h2 class="text-2xl font-bold text-gradient-gold mb-2">{{ course.title }}</h2>
        <p v-if="course.description" class="text-gray-600 dark:text-gray-400 mb-6">{{ course.description }}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button v-for="lesson in course.lessons" :key="lesson.id" @click="selectedLesson = lesson" class="group relative aspect-video bg-gray-100 dark:bg-dark-800 rounded-xl overflow-hidden border border-gray-200 dark:border-dark-700 hover:border-gold-500 transition-all hover:shadow-lg hover:shadow-gold-500/10">
            <img v-if="lesson.thumbnail_url" :src="lesson.thumbnail_url" :alt="lesson.title" class="absolute inset-0 w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-gold-500/30">
                <Play class="w-8 h-8 text-white ml-1" fill="currentColor" />
              </div>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <h3 class="text-white font-semibold text-sm line-clamp-2">{{ lesson.title }}</h3>
            </div>
          </button>
        </div>

        <p v-if="!course.lessons.length" class="text-gray-400 dark:text-gray-500 text-center py-8">Nema dostupnih lekcija</p>
      </div>

      <div v-if="!courses.length && !loading" class="text-center py-12">
        <p class="text-gray-400 dark:text-gray-500">Nema dostupnih kurseva</p>
      </div>
    </div>
  </div>
</template>
