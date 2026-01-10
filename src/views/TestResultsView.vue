<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/api'
import { Award, CheckCircle, XCircle, ArrowLeft, Search } from 'lucide-vue-next'

interface TestResult {
  id: number
  test_id: number
  test: { id: number; title: string }
  user: { id: number; name: string; email: string }
  answers: Array<{ 
    question_id: number
    question_text: string
    selected_answer: string
    correct_answer: string
    is_correct: boolean 
  }>
  score: number
  total_questions: number
  percentage: number
  completed_at: string
}

const results = ref<TestResult[]>([])
const filteredResults = ref<TestResult[]>([])
const viewingResult = ref<TestResult | null>(null)
const loading = ref(false)
const searchQuery = ref('')

onMounted(() => loadResults())

async function loadResults() {
  loading.value = true
  try {
    const { data } = await api.get('/educator/test-results')
    results.value = data.results
    filteredResults.value = data.results
  } finally {
    loading.value = false
  }
}

function filterResults() {
  const query = searchQuery.value.toLowerCase()
  if (!query) {
    filteredResults.value = results.value
    return
  }
  
  filteredResults.value = results.value.filter(result => 
    result.user.name.toLowerCase().includes(query) ||
    result.user.email.toLowerCase().includes(query) ||
    result.test.title.toLowerCase().includes(query)
  )
}

function getPassedClass(percentage: number) {
  if (percentage >= 90) return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
  if (percentage >= 70) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
  return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Viewing Result Detail -->
    <div v-if="viewingResult">
      <button @click="viewingResult = null" class="flex items-center space-x-2 text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 font-medium mb-6 transition-colors">
        <ArrowLeft class="w-4 h-4" />
        <span>Nazad na rezultate</span>
      </button>
      
      <div class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Pregled rezultata</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Student: <span class="font-medium">{{ viewingResult.user.name }}</span>
            </p>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              {{ viewingResult.user.email }}
            </p>
            <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Test: <span class="font-medium">{{ viewingResult.test.title }}</span>
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <Award class="w-6 h-6 text-gold-500" />
            <span class="text-2xl font-bold text-gradient-gold">{{ viewingResult.score }}/{{ viewingResult.total_questions }}</span>
          </div>
        </div>
        <p class="text-gray-600 dark:text-gray-400">Procenat: {{ viewingResult.percentage }}%</p>
      </div>

      <div class="space-y-4">
        <div v-for="(answer, index) in viewingResult.answers" :key="index" 
             :class="['bg-white dark:bg-dark-900 rounded-xl p-6 border-2', 
                      answer.is_correct ? 'border-green-500' : 'border-red-500']">
          <div class="flex items-start space-x-3 mb-3">
            <span class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white flex items-center justify-center font-semibold">
              {{ index + 1 }}
            </span>
            <div class="flex-1">
              <p class="text-gray-900 dark:text-white font-medium mb-2">{{ answer.question_text }}</p>
              <div v-if="answer.is_correct" class="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle class="w-5 h-5" />
                <span class="font-medium">Tačno</span>
              </div>
              <div v-else class="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <XCircle class="w-5 h-5" />
                <span class="font-medium">Netačno</span>
              </div>
            </div>
          </div>
          <div class="ml-11 space-y-2">
            <div class="p-3 rounded-xl bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700">
              <p class="text-sm text-gray-500 dark:text-gray-500 mb-1">Odgovor studenta:</p>
              <p class="text-gray-900 dark:text-white">{{ answer.selected_answer || 'Nije odgovoreno' }}</p>
            </div>
            <div v-if="!answer.is_correct && answer.correct_answer" 
                 class="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p class="text-sm text-gray-500 dark:text-gray-500 mb-1">Tačan odgovor:</p>
              <p class="text-green-700 dark:text-green-400 font-medium">{{ answer.correct_answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Results List -->
    <div v-else>
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gradient-gold mb-2">Rezultati testova</h1>
        <p class="text-gray-600 dark:text-gray-400">Pregled svih rezultata testova studenata</p>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            v-model="searchQuery"
            @input="filterResults"
            type="text"
            placeholder="Pretraži po imenu studenta, email-u ili testu..."
            class="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600"></div>
        <p class="text-gray-600 dark:text-gray-400 mt-4">Učitavanje rezultata...</p>
      </div>

      <!-- No Results -->
      <div v-else-if="filteredResults.length === 0" class="text-center py-12">
        <Award class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p class="text-gray-600 dark:text-gray-400">
          {{ searchQuery ? 'Nema rezultata za pretragu' : 'Još nema rezultata testova' }}
        </p>
      </div>

      <!-- Results Table -->
      <div v-else class="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Test
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rezultat
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Procenat
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Datum
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Akcije
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-dark-700">
              <tr v-for="result in filteredResults" :key="result.id" 
                  class="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">{{ result.user.name }}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{{ result.user.email }}</div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 dark:text-white">{{ result.test.title }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ result.score }}/{{ result.total_questions }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getPassedClass(result.percentage)]">
                    {{ result.percentage }}%
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ new Date(result.completed_at).toLocaleDateString('sr-RS', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button @click="viewingResult = result" 
                          class="text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 font-medium transition-colors">
                    Pregled
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Summary Stats -->
      <div v-if="!loading && filteredResults.length > 0" class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Ukupno rezultata</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ filteredResults.length }}</p>
        </div>
        <div class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Prosječan procenat</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ Math.round(filteredResults.reduce((sum, r) => sum + r.percentage, 0) / filteredResults.length) }}%
          </p>
        </div>
        <div class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Položilo (≥70%)</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ filteredResults.filter(r => r.percentage >= 70).length }} / {{ filteredResults.length }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
