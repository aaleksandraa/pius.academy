<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/lib/api'
import { FileText, CheckCircle, XCircle, Award, ArrowLeft } from 'lucide-vue-next'

interface TestQuestion {
  id: number
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'text'
  options: string[] | null
  order_number: number
}

interface Test {
  id: number
  title: string
  description: string | null
  questions_count: number
  questions?: TestQuestion[]
}

interface TestResult {
  id: number
  test_id: number
  test: { id: number; title: string }
  answers: Array<{ question_id: number; question_text: string; selected_answer: string; correct_answer: string; is_correct: boolean }>
  score: number
  total_questions: number
  percentage: number
  completed_at: string
}

const tests = ref<Test[]>([])
const results = ref<TestResult[]>([])
const selectedTest = ref<Test | null>(null)
const answers = ref<Record<number, string>>({})
const completedResult = ref<TestResult | null>(null)
const viewingResult = ref<TestResult | null>(null)
const loading = ref(false)
const submitting = ref(false)

onMounted(() => { loadTests(); loadResults() })

async function loadTests() {
  loading.value = true
  try {
    const { data } = await api.get('/tests')
    tests.value = data.tests
  } finally {
    loading.value = false
  }
}

async function loadResults() {
  const { data } = await api.get('/test-results')
  results.value = data.results
}

async function startTest(test: Test) {
  const { data } = await api.get(`/tests/${test.id}`)
  selectedTest.value = data.test
  answers.value = {}
  completedResult.value = null
}

async function submitTest() {
  if (!selectedTest.value) return
  submitting.value = true
  try {
    const { data } = await api.post(`/tests/${selectedTest.value.id}/submit`, { answers: answers.value })
    completedResult.value = data.result
    loadResults()
  } finally {
    submitting.value = false
  }
}

function isTestCompleted(testId: number) {
  return results.value.some(r => r.test_id === testId)
}

function getLatestResult(testId: number) {
  return results.value.find(r => r.test_id === testId)
}

function resetTest() {
  selectedTest.value = null
  completedResult.value = null
  answers.value = {}
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Viewing Result -->
    <div v-if="viewingResult">
      <button @click="viewingResult = null" class="flex items-center space-x-2 text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 font-medium mb-6 transition-colors">
        <ArrowLeft class="w-4 h-4" /><span>Nazad</span>
      </button>
      <div class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Pregled rezultata</h1>
          <div class="flex items-center space-x-2">
            <Award class="w-6 h-6 text-gold-500" />
            <span class="text-2xl font-bold text-gradient-gold">{{ viewingResult.score }}/{{ viewingResult.total_questions }}</span>
          </div>
        </div>
        <p class="text-gray-600 dark:text-gray-400">Procenat: {{ viewingResult.percentage }}%</p>
      </div>
      <div class="space-y-4">
        <div v-for="(answer, index) in viewingResult.answers" :key="index" :class="['bg-white dark:bg-dark-900 rounded-xl p-6 border-2', answer.is_correct ? 'border-green-500' : 'border-red-500']">
          <div class="flex items-start space-x-3 mb-3">
            <span class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white flex items-center justify-center font-semibold">{{ index + 1 }}</span>
            <div class="flex-1">
              <p class="text-gray-900 dark:text-white font-medium mb-2">{{ answer.question_text }}</p>
              <div v-if="answer.is_correct" class="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle class="w-5 h-5" /><span class="font-medium">Tačno</span>
              </div>
              <div v-else class="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <XCircle class="w-5 h-5" /><span class="font-medium">Netačno</span>
              </div>
            </div>
          </div>
          <div class="ml-11 space-y-2">
            <div class="p-3 rounded-xl bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-dark-700">
              <p class="text-sm text-gray-500 dark:text-gray-500 mb-1">Vaš odgovor:</p>
              <p class="text-gray-900 dark:text-white">{{ answer.selected_answer || 'Nije odgovoreno' }}</p>
            </div>
            <div v-if="!answer.is_correct && answer.correct_answer" class="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p class="text-sm text-gray-500 dark:text-gray-500 mb-1">Tačan odgovor:</p>
              <p class="text-green-700 dark:text-green-400 font-medium">{{ answer.correct_answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Completed Result -->
    <div v-else-if="completedResult" class="max-w-3xl mx-auto">
      <div class="bg-white dark:bg-dark-900 rounded-xl p-8 border border-gray-200 dark:border-dark-800 shadow-xl text-center">
        <div class="mb-6">
          <div class="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30">
            <Award class="w-12 h-12 text-white" />
          </div>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Test je završen!</h2>
          <p class="text-gray-500 dark:text-gray-400">{{ selectedTest?.title }}</p>
        </div>
        <div class="bg-gray-50 dark:bg-dark-800 rounded-xl p-6 mb-6 border border-gray-100 dark:border-dark-700">
          <div class="text-5xl font-bold text-gradient-gold mb-2">{{ completedResult.score }}/{{ completedResult.total_questions }}</div>
          <p class="text-xl text-gray-600 dark:text-gray-400">{{ completedResult.percentage }}% tačnih odgovora</p>
        </div>
        <div class="flex gap-4 justify-center">
          <button @click="viewingResult = completedResult" class="btn-gold text-white font-medium px-6 py-3 rounded-xl">Pregledaj detalje</button>
          <button @click="resetTest" class="bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-white font-medium px-6 py-3 rounded-xl border border-gray-200 dark:border-dark-700 transition-colors">Nazad na listu</button>
        </div>
      </div>
    </div>

    <!-- Taking Test -->
    <div v-else-if="selectedTest" class="max-w-3xl mx-auto">
      <button @click="resetTest" class="flex items-center space-x-2 text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 font-medium mb-6 transition-colors">
        <ArrowLeft class="w-4 h-4" /><span>Nazad na listu testova</span>
      </button>
      <div class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800 mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{{ selectedTest.title }}</h1>
        <p v-if="selectedTest.description" class="text-gray-600 dark:text-gray-400 mb-4">{{ selectedTest.description }}</p>
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-500">
          <FileText class="w-4 h-4 mr-1 text-gold-500" /><span>{{ selectedTest.questions?.length }} pitanja</span>
        </div>
      </div>
      <div class="space-y-6">
        <div v-for="(question, index) in selectedTest.questions" :key="question.id" class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800">
          <div class="flex items-start space-x-3 mb-4">
            <span class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white flex items-center justify-center font-semibold">{{ index + 1 }}</span>
            <p class="flex-1 text-gray-900 dark:text-white font-medium">{{ question.question_text }}</p>
          </div>
          <div v-if="question.question_type === 'multiple_choice' && question.options" class="space-y-2 ml-11">
            <label v-for="(option, optIndex) in question.options" :key="optIndex" class="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-gold-500 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer transition-all">
              <input type="radio" :name="`q-${question.id}`" :value="option" v-model="answers[question.id]" class="w-4 h-4 text-gold-500 bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-600 focus:ring-gold-500" />
              <span class="text-gray-700 dark:text-gray-300">{{ option }}</span>
            </label>
          </div>
          <div v-else-if="question.question_type === 'true_false'" class="space-y-2 ml-11">
            <label v-for="value in ['true', 'false']" :key="value" class="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-gold-500 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer transition-all">
              <input type="radio" :name="`q-${question.id}`" :value="value" v-model="answers[question.id]" class="w-4 h-4 text-gold-500 bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-600 focus:ring-gold-500" />
              <span class="text-gray-700 dark:text-gray-300">{{ value === 'true' ? 'Tačno' : 'Netačno' }}</span>
            </label>
          </div>
          <div v-else class="ml-11">
            <textarea v-model="answers[question.id]" rows="4" placeholder="Unesite vaš odgovor..." class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea>
          </div>
        </div>
      </div>
      <div class="mt-8 flex justify-end">
        <button @click="submitTest" :disabled="submitting || Object.keys(answers).length === 0" class="btn-gold text-white font-medium px-8 py-3 rounded-xl disabled:opacity-50">
          {{ submitting ? 'Predavanje...' : 'Predaj test' }}
        </button>
      </div>
    </div>

    <!-- Test List -->
    <div v-else>
      <h1 class="text-3xl font-bold text-gradient-gold mb-6">Testovi</h1>
      <div class="grid gap-4">
        <div v-for="test in tests" :key="test.id" class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800 flex items-center justify-between card-hover">
          <div class="flex-1">
            <div class="flex items-center space-x-3 mb-2">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ test.title }}</h3>
              <span v-if="isTestCompleted(test.id)" class="flex items-center space-x-1 text-xs px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800">
                <CheckCircle class="w-3 h-3" /><span>Završeno</span>
              </span>
            </div>
            <p v-if="test.description" class="text-gray-500 dark:text-gray-500 text-sm mb-2">{{ test.description }}</p>
            <div v-if="getLatestResult(test.id)" class="flex items-center space-x-4 text-sm">
              <span class="text-gold-600 dark:text-gold-400 font-medium">Rezultat: {{ getLatestResult(test.id)!.score }}/{{ getLatestResult(test.id)!.total_questions }} ({{ getLatestResult(test.id)!.percentage }}%)</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button v-if="isTestCompleted(test.id)" @click="viewingResult = getLatestResult(test.id)!" class="bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-white font-medium px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-700 transition-colors text-sm">Pregled</button>
            <button @click="startTest(test)" class="btn-gold text-white font-medium px-4 py-2 rounded-xl text-sm">{{ isTestCompleted(test.id) ? 'Uradi ponovo' : 'Započni test' }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
