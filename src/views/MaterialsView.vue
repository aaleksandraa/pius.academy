<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/imageUrl'
import { Package, Download } from 'lucide-vue-next'
import ImageLightbox from '@/components/ImageLightbox.vue'

interface Material {
  id: number
  title: string
  description: string | null
  image_url: string | null
  file_url: string | null
  file_name: string | null
  created_at: string
}

const materials = ref<Material[]>([])
const loading = ref(false)
const lightboxImage = ref<string | null>(null)

onMounted(() => loadMaterials())

async function loadMaterials() {
  loading.value = true
  try {
    const { data } = await api.get('/materials')
    materials.value = data.materials
  } finally {
    loading.value = false
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center space-x-3 mb-6">
      <Package class="w-8 h-8 text-gold-500" />
      <h1 class="text-3xl font-bold text-gradient-gold">Materijali</h1>
    </div>

    <p class="text-gray-600 dark:text-gray-400 mb-8">
      Ovdje možete pronaći sve potrebne materijale i resurse za rad.
    </p>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="materials.length === 0" class="text-center py-12">
      <Package class="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <p class="text-gray-400 dark:text-gray-500">Nema dostupnih materijala</p>
    </div>

    <div v-else class="grid gap-6">
      <div
        v-for="material in materials"
        :key="material.id"
        class="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden card-hover"
      >
        <!-- Image -->
        <img
          v-if="material.image_url"
          :src="getImageUrl(material.image_url)"
          :alt="material.title"
          @click="lightboxImage = getImageUrl(material.image_url)"
          class="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
        />

        <div class="p-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {{ material.title }}
          </h3>

          <p v-if="material.description" class="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">
            {{ material.description }}
          </p>

          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400 dark:text-gray-500">
              {{ formatDate(material.created_at) }}
            </span>

            <a
              v-if="material.file_url"
              :href="getImageUrl(material.file_url)"
              target="_blank"
              download
              class="inline-flex items-center space-x-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors"
            >
              <Download class="w-4 h-4" />
              <span class="text-sm font-medium">{{ material.file_name || 'Preuzmi' }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <ImageLightbox v-if="lightboxImage" :src="lightboxImage" @close="lightboxImage = null" />
  </div>
</template>
