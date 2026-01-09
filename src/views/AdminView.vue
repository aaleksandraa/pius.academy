<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/imageUrl'
import { useConfirm } from '@/composables/useConfirm'
import { Users, BookOpen, Video, FileText, Award, Plus, Edit2, Trash2, X, ChevronDown, ChevronRight, Eye, EyeOff, GripVertical, Calendar, CheckCircle, XCircle, Package, Download, AlertTriangle } from 'lucide-vue-next'

type Tab = 'users' | 'courses' | 'zoom' | 'tests' | 'results' | 'materials'

interface User { id: number; name: string; email: string; phone: string | null; address: string | null; role: string; educator_id: number | null; educator: { id: number; name: string } | null }
interface Lesson { id: number; course_id: number; title: string; vimeo_embed: string; vimeo_id: string | null; vimeo_hash: string | null; thumbnail_url: string | null; description: string | null; order_number: number; is_active: boolean }
interface Course { id: number; title: string; description: string | null; is_active: boolean; lessons: Lesson[]; created_at: string }
interface ZoomRecording { id: number; title: string; vimeo_embed: string; vimeo_id: string | null; vimeo_hash: string | null; recorded_at: string }
interface TestQuestion { id: number; test_id: number; question_text: string; question_type: 'multiple_choice' | 'true_false' | 'text'; correct_answer: string | null; options: string[] | null; order_number: number }
interface Test { id: number; title: string; description: string | null; is_active: boolean; questions_count: number; questions: TestQuestion[]; created_at: string }
interface TestResult { id: number; test_id: number; test: { id: number; title: string } | null; user: { id: number; name: string; email: string } | null; answers: any[]; score: number; total_questions: number; percentage: number; passed: boolean; completed_at: string }
interface Material { id: number; title: string; description: string | null; image_url: string | null; file_url: string | null; file_name: string | null; is_active: boolean; sort_order: number; created_at: string }

const activeTab = ref<Tab>('users')
const { confirm } = useConfirm()
const loading = ref(false)
const error = ref('')
const success = ref('')

// Users
const users = ref<User[]>([])
const educators = ref<{ id: number; name: string }[]>([])
const showUserModal = ref(false)
const editingUser = ref<User | null>(null)
const userForm = ref({ name: '', email: '', password: '', phone: '', address: '', role: 'student', educator_id: '' })
const stats = ref({ admins: 0, educators: 0, students: 0 })

// Courses
const courses = ref<Course[]>([])
const expandedCourses = ref<Set<number>>(new Set())
const showCourseModal = ref(false)
const showLessonModal = ref(false)
const editingCourse = ref<Course | null>(null)
const editingLesson = ref<Lesson | null>(null)
const selectedCourseId = ref<number | null>(null)
const courseForm = ref({ title: '', description: '', is_active: true })
const lessonForm = ref({ title: '', vimeo_embed: '', description: '', order_number: 1 })

// Zoom
const zoomRecordings = ref<ZoomRecording[]>([])
const showZoomModal = ref(false)
const editingZoom = ref<ZoomRecording | null>(null)
const zoomForm = ref({ title: '', vimeo_embed: '', recorded_at: '' })

// Tests
const tests = ref<Test[]>([])
const expandedTests = ref<Set<number>>(new Set())
const showTestModal = ref(false)
const showQuestionModal = ref(false)
const editingTest = ref<Test | null>(null)
const editingQuestion = ref<TestQuestion | null>(null)
const selectedTestId = ref<number | null>(null)
const testForm = ref({ title: '', description: '', is_active: true })
const questionForm = ref({ question_text: '', question_type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'text', correct_answer: '', options: ['', '', '', ''], order_number: 1 })

// Results
const testResults = ref<TestResult[]>([])
const selectedResultDetail = ref<TestResult | null>(null)
const showResultModal = ref(false)

// Materials
const materials = ref<Material[]>([])
const materialsEnabled = ref(true)
const showMaterialModal = ref(false)
const editingMaterial = ref<Material | null>(null)
const materialForm = ref({ title: '', description: '' })
const materialImage = ref<File | null>(null)
const materialFile = ref<File | null>(null)

onMounted(() => loadUsers())

watch(activeTab, (tab) => {
  error.value = ''
  success.value = ''
  if (tab === 'users') loadUsers()
  if (tab === 'courses') loadCourses()
  if (tab === 'zoom') loadZoomRecordings()
  if (tab === 'tests') loadTests()
  if (tab === 'results') loadResults()
  if (tab === 'materials') loadMaterials()
})

// User functions
async function loadUsers() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/users')
    users.value = data.users
    stats.value = data.stats
    const educatorsRes = await api.get('/admin/educators')
    educators.value = educatorsRes.data.educators
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri učitavanju' }
  finally { loading.value = false }
}

function openUserModal(user?: User) {
  editingUser.value = user || null
  userForm.value = user ? { name: user.name, email: user.email, password: '', phone: user.phone || '', address: user.address || '', role: user.role, educator_id: user.educator_id?.toString() || '' } : { name: '', email: '', password: '', phone: '', address: '', role: 'student', educator_id: '' }
  showUserModal.value = true
}

async function saveUser() {
  loading.value = true; error.value = ''; success.value = ''
  try {
    if (editingUser.value) {
      await api.put(`/admin/users/${editingUser.value.id}`, { ...userForm.value, educator_id: userForm.value.educator_id || null })
      success.value = 'Korisnik je uspješno ažuriran'
    } else {
      const { data } = await api.post('/admin/users', { ...userForm.value, educator_id: userForm.value.educator_id || null })
      success.value = `Korisnik je uspješno kreiran!\n\nPristupni podaci:\nEmail: ${data.credentials.email}\nLozinka: ${data.credentials.password}`
    }
    showUserModal.value = false; loadUsers()
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri čuvanju' }
  finally { loading.value = false }
}

async function deleteUser(userId: number) {
  const confirmed = await confirm({ title: 'Obriši korisnika', message: 'Da li ste sigurni da želite obrisati ovog korisnika?' })
  if (!confirmed) return
  try { await api.delete(`/admin/users/${userId}`); success.value = 'Korisnik je uspješno obrisan'; loadUsers() }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri brisanju' }
}

async function clearAllContent() {
  const confirmed = await confirm({ 
    title: 'Obriši sav korisnički sadržaj', 
    message: 'UPOZORENJE: Ova akcija će obrisati SVE objave, pitanja, radove, komentare, rezultate testova i notifikacije.\n\nKorisnici, kursevi, testovi, materijali i zoom snimci NEĆE biti obrisani.\n\nOva akcija se NE MOŽE poništiti!' 
  })
  if (!confirmed) return
  
  // Double confirmation for safety
  const doubleConfirmed = await confirm({
    title: 'Potvrdi brisanje',
    message: 'Jeste li POTPUNO sigurni? Sav korisnički sadržaj će biti trajno obrisan.'
  })
  if (!doubleConfirmed) return
  
  loading.value = true
  try {
    const { data } = await api.post('/admin/clear-content')
    success.value = data.message
  } catch (err: any) { 
    error.value = err.response?.data?.message || 'Greška pri brisanju sadržaja' 
  } finally { 
    loading.value = false 
  }
}

// Course functions
async function loadCourses() {
  loading.value = true
  try { const { data } = await api.get('/admin/courses'); courses.value = data.courses }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri učitavanju kurseva' }
  finally { loading.value = false }
}

function toggleCourseExpand(courseId: number) {
  expandedCourses.value.has(courseId) ? expandedCourses.value.delete(courseId) : expandedCourses.value.add(courseId)
}

function openCourseModal(course?: Course) {
  editingCourse.value = course || null
  courseForm.value = course ? { title: course.title, description: course.description || '', is_active: course.is_active } : { title: '', description: '', is_active: true }
  showCourseModal.value = true
}

async function saveCourse() {
  loading.value = true; error.value = ''
  try {
    if (editingCourse.value) { await api.put(`/admin/courses/${editingCourse.value.id}`, courseForm.value); success.value = 'Kurs je uspješno ažuriran' }
    else { await api.post('/admin/courses', courseForm.value); success.value = 'Kurs je uspješno kreiran' }
    showCourseModal.value = false; loadCourses()
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri čuvanju kursa' }
  finally { loading.value = false }
}

async function toggleCourseActive(course: Course) {
  try { await api.put(`/admin/courses/${course.id}`, { ...course, is_active: !course.is_active }); course.is_active = !course.is_active; success.value = course.is_active ? 'Kurs je sada aktivan' : 'Kurs je sada neaktivan' }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri promjeni statusa' }
}

async function deleteCourse(courseId: number) {
  const confirmed = await confirm({ title: 'Obriši kurs', message: 'Da li ste sigurni da želite obrisati ovaj kurs i sve njegove lekcije?' })
  if (!confirmed) return
  try { await api.delete(`/admin/courses/${courseId}`); success.value = 'Kurs je uspješno obrisan'; loadCourses() }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri brisanju kursa' }
}

// Lesson functions
function openLessonModal(courseId: number, lesson?: Lesson) {
  selectedCourseId.value = courseId
  const course = courses.value.find(c => c.id === courseId)
  editingLesson.value = lesson || null
  lessonForm.value = lesson ? { title: lesson.title, vimeo_embed: lesson.vimeo_embed, description: lesson.description || '', order_number: lesson.order_number } : { title: '', vimeo_embed: '', description: '', order_number: (course?.lessons.length ? Math.max(...course.lessons.map(l => l.order_number)) : 0) + 1 }
  showLessonModal.value = true
}

async function saveLesson() {
  if (!selectedCourseId.value) return
  loading.value = true; error.value = ''
  try {
    if (editingLesson.value) { await api.put(`/admin/lessons/${editingLesson.value.id}`, lessonForm.value); success.value = 'Lekcija je uspješno ažurirana' }
    else { await api.post(`/admin/courses/${selectedCourseId.value}/lessons`, lessonForm.value); success.value = 'Lekcija je uspješno kreirana' }
    showLessonModal.value = false; loadCourses()
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri čuvanju lekcije' }
  finally { loading.value = false }
}

async function deleteLesson(lessonId: number) {
  const confirmed = await confirm({ title: 'Obriši lekciju', message: 'Da li ste sigurni da želite obrisati ovu lekciju?' })
  if (!confirmed) return
  try { await api.delete(`/admin/lessons/${lessonId}`); success.value = 'Lekcija je uspješno obrisana'; loadCourses() }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri brisanju lekcije' }
}

async function toggleLessonActive(lesson: Lesson) {
  try {
    const { data } = await api.post(`/admin/lessons/${lesson.id}/toggle-active`)
    lesson.is_active = !lesson.is_active
    success.value = data.message
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri promjeni statusa lekcije' }
}

// Zoom functions
async function loadZoomRecordings() {
  loading.value = true
  try { const { data } = await api.get('/zoom-recordings'); zoomRecordings.value = data.recordings }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri učitavanju snimaka' }
  finally { loading.value = false }
}

function openZoomModal(recording?: ZoomRecording) {
  editingZoom.value = recording || null
  zoomForm.value = recording ? { title: recording.title, vimeo_embed: recording.vimeo_embed, recorded_at: recording.recorded_at } : { title: '', vimeo_embed: '', recorded_at: new Date().toISOString().split('T')[0] }
  showZoomModal.value = true
}

async function saveZoom() {
  loading.value = true; error.value = ''
  try {
    if (editingZoom.value) { await api.put(`/admin/zoom-recordings/${editingZoom.value.id}`, zoomForm.value); success.value = 'Snimak je uspješno ažuriran' }
    else { await api.post('/admin/zoom-recordings', zoomForm.value); success.value = 'Snimak je uspješno dodan' }
    showZoomModal.value = false; loadZoomRecordings()
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri čuvanju snimka' }
  finally { loading.value = false }
}

async function deleteZoom(id: number) {
  const confirmed = await confirm({ title: 'Obriši snimak', message: 'Da li ste sigurni da želite obrisati ovaj Zoom snimak?' })
  if (!confirmed) return
  try { await api.delete(`/admin/zoom-recordings/${id}`); success.value = 'Snimak je uspješno obrisan'; loadZoomRecordings() }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri brisanju snimka' }
}

// Test functions
async function loadTests() {
  loading.value = true
  try { const { data } = await api.get('/admin/tests'); tests.value = data.tests }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri učitavanju testova' }
  finally { loading.value = false }
}

function toggleTestExpand(testId: number) {
  expandedTests.value.has(testId) ? expandedTests.value.delete(testId) : expandedTests.value.add(testId)
}

function openTestModal(test?: Test) {
  editingTest.value = test || null
  testForm.value = test ? { title: test.title, description: test.description || '', is_active: test.is_active } : { title: '', description: '', is_active: true }
  showTestModal.value = true
}

async function saveTest() {
  loading.value = true; error.value = ''
  try {
    if (editingTest.value) { await api.put(`/admin/tests/${editingTest.value.id}`, testForm.value); success.value = 'Test je uspješno ažuriran' }
    else { await api.post('/admin/tests', testForm.value); success.value = 'Test je uspješno kreiran' }
    showTestModal.value = false; loadTests()
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri čuvanju testa' }
  finally { loading.value = false }
}

async function toggleTestActive(test: Test) {
  try { await api.put(`/admin/tests/${test.id}`, { ...test, is_active: !test.is_active }); test.is_active = !test.is_active; success.value = test.is_active ? 'Test je sada aktivan' : 'Test je sada neaktivan' }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri promjeni statusa' }
}

async function deleteTest(testId: number) {
  const confirmed = await confirm({ title: 'Obriši test', message: 'Da li ste sigurni da želite obrisati ovaj test i sva njegova pitanja?' })
  if (!confirmed) return
  try { await api.delete(`/admin/tests/${testId}`); success.value = 'Test je uspješno obrisan'; loadTests() }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri brisanju testa' }
}

// Question functions
function openQuestionModal(testId: number, question?: TestQuestion) {
  selectedTestId.value = testId
  const test = tests.value.find(t => t.id === testId)
  editingQuestion.value = question || null
  if (question) {
    questionForm.value = { 
      question_text: question.question_text, 
      question_type: question.question_type, 
      correct_answer: question.correct_answer || '', 
      options: question.options && question.options.length > 0 ? [...question.options, '', '', '', ''].slice(0, 4) : ['', '', '', ''], 
      order_number: question.order_number 
    }
  } else {
    questionForm.value = { 
      question_text: '', 
      question_type: 'multiple_choice', 
      correct_answer: '', 
      options: ['', '', '', ''], 
      order_number: (test?.questions.length ? Math.max(...test.questions.map(q => q.order_number)) : 0) + 1 
    }
  }
  showQuestionModal.value = true
}

async function saveQuestion() {
  if (!selectedTestId.value) return
  loading.value = true; error.value = ''
  try {
    const payload = {
      question_text: questionForm.value.question_text,
      question_type: questionForm.value.question_type,
      correct_answer: questionForm.value.correct_answer,
      options: questionForm.value.question_type === 'multiple_choice' ? questionForm.value.options.filter(o => o.trim()) : null,
      order_number: questionForm.value.order_number
    }
    if (editingQuestion.value) { await api.put(`/admin/test-questions/${editingQuestion.value.id}`, payload); success.value = 'Pitanje je uspješno ažurirano' }
    else { await api.post(`/admin/tests/${selectedTestId.value}/questions`, payload); success.value = 'Pitanje je uspješno kreirano' }
    showQuestionModal.value = false; loadTests()
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri čuvanju pitanja' }
  finally { loading.value = false }
}

async function deleteQuestion(questionId: number) {
  const confirmed = await confirm({ title: 'Obriši pitanje', message: 'Da li ste sigurni da želite obrisati ovo pitanje iz testa?' })
  if (!confirmed) return
  try { await api.delete(`/admin/test-questions/${questionId}`); success.value = 'Pitanje je uspješno obrisano'; loadTests() }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri brisanju pitanja' }
}

// Results functions
async function loadResults() {
  loading.value = true
  try { const { data } = await api.get('/admin/test-results'); testResults.value = data.results }
  catch (err: any) { error.value = err.response?.data?.message || 'Greška pri učitavanju rezultata' }
  finally { loading.value = false }
}

function openResultDetail(result: TestResult) {
  selectedResultDetail.value = result
  showResultModal.value = true
}

// Materials functions
async function loadMaterials() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/materials')
    materials.value = data.materials
    materialsEnabled.value = data.enabled
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri učitavanju materijala' }
  finally { loading.value = false }
}

function openMaterialModal(material?: Material) {
  editingMaterial.value = material || null
  materialForm.value = material ? { title: material.title, description: material.description || '' } : { title: '', description: '' }
  materialImage.value = null
  materialFile.value = null
  showMaterialModal.value = true
}

async function saveMaterial() {
  loading.value = true; error.value = ''
  try {
    const formData = new FormData()
    formData.append('title', materialForm.value.title)
    formData.append('description', materialForm.value.description)
    if (materialImage.value) formData.append('image', materialImage.value)
    if (materialFile.value) formData.append('file', materialFile.value)

    if (editingMaterial.value) {
      await api.post(`/admin/materials/${editingMaterial.value.id}?_method=PUT`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      success.value = 'Materijal je uspješno ažuriran'
    } else {
      await api.post('/admin/materials', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      success.value = 'Materijal je uspješno dodan'
    }
    showMaterialModal.value = false
    loadMaterials()
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri čuvanju materijala' }
  finally { loading.value = false }
}

async function deleteMaterial(id: number) {
  const confirmed = await confirm({ title: 'Obriši materijal', message: 'Da li ste sigurni da želite obrisati ovaj materijal?' })
  if (!confirmed) return
  try {
    await api.delete(`/admin/materials/${id}`)
    success.value = 'Materijal je uspješno obrisan'
    loadMaterials()
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri brisanju materijala' }
}

async function toggleMaterialActive(material: Material) {
  try {
    const formData = new FormData()
    formData.append('title', material.title)
    formData.append('description', material.description || '')
    formData.append('is_active', (!material.is_active).toString())
    await api.post(`/admin/materials/${material.id}?_method=PUT`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    material.is_active = !material.is_active
    success.value = material.is_active ? 'Materijal je sada vidljiv' : 'Materijal je sada sakriven'
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri promjeni statusa' }
}

async function toggleMaterialsEnabled() {
  try {
    const { data } = await api.post('/admin/materials/toggle-enabled')
    materialsEnabled.value = data.enabled
    success.value = data.message
  } catch (err: any) { error.value = err.response?.data?.message || 'Greška pri promjeni statusa stranice' }
}

function handleMaterialImage(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) materialImage.value = file
}

function handleMaterialFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) materialFile.value = file
}

function getQuestionTypeLabel(type: string) {
  switch (type) {
    case 'multiple_choice': return 'Višestruki izbor'
    case 'true_false': return 'Tačno/Netačno'
    case 'text': return 'Tekstualni odgovor'
    default: return type
  }
}

function formatDate(date: string) { return new Date(date).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'long', year: 'numeric' }) }
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold text-gradient-gold mb-6">Admin Panel</h1>

    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
      <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
    </div>
    <div v-if="success" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
      <p class="text-sm text-green-600 dark:text-green-400 whitespace-pre-line">{{ success }}</p>
    </div>

    <div class="flex space-x-2 mb-6 overflow-x-auto pb-2">
      <button v-for="tab in [{ key: 'users', name: 'Korisnici', icon: Users }, { key: 'courses', name: 'Kursevi', icon: BookOpen }, { key: 'zoom', name: 'Zoom Snimci', icon: Video }, { key: 'tests', name: 'Testovi', icon: FileText }, { key: 'results', name: 'Rezultati', icon: Award }, { key: 'materials', name: 'Materijali', icon: Package }]" :key="tab.key" @click="activeTab = tab.key as Tab" :class="['flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all', activeTab === tab.key ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white' : 'bg-white dark:bg-dark-900 text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-400 border border-gray-200 dark:border-dark-800']">
        <component :is="tab.icon" class="w-4 h-4" /><span>{{ tab.name }}</span>
      </button>
    </div>

    <!-- Users Tab -->
    <div v-if="activeTab === 'users'" class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Korisnici</h2>
        <div class="flex items-center space-x-3">
          <button @click="clearAllContent" class="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"><AlertTriangle class="w-4 h-4" /><span>Očisti sadržaj</span></button>
          <button @click="openUserModal()" class="flex items-center space-x-2 btn-gold text-white px-4 py-2.5 rounded-xl font-medium"><Plus class="w-4 h-4" /><span>Dodaj korisnika</span></button>
        </div>
      </div>
      <div class="bg-gray-50 dark:bg-dark-800 rounded-xl p-4 mb-4 border border-gray-100 dark:border-dark-700">
        <h3 class="font-semibold text-gold-600 dark:text-gold-400 mb-3">Ukupno korisnika</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white dark:bg-dark-900 rounded-xl p-4 text-center border border-gray-200 dark:border-dark-800"><p class="text-2xl font-bold text-gradient-gold">{{ stats.admins }}</p><p class="text-sm text-gray-500">Admini</p></div>
          <div class="bg-white dark:bg-dark-900 rounded-xl p-4 text-center border border-gray-200 dark:border-dark-800"><p class="text-2xl font-bold text-gradient-gold">{{ stats.educators }}</p><p class="text-sm text-gray-500">Edukatori</p></div>
          <div class="bg-white dark:bg-dark-900 rounded-xl p-4 text-center border border-gray-200 dark:border-dark-800"><p class="text-2xl font-bold text-gradient-gold">{{ stats.students }}</p><p class="text-sm text-gray-500">Učenici</p></div>
        </div>
      </div>
      <div class="space-y-4">
        <div v-for="user in users" :key="user.id" class="bg-white dark:bg-dark-900 rounded-xl p-6 border border-gray-200 dark:border-dark-800 card-hover">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-semibold text-lg">{{ user.name.charAt(0).toUpperCase() }}</div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ user.name }}</h3>
                  <span :class="['inline-block px-2 py-1 rounded-full text-xs font-medium border', user.role === 'admin' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' : user.role === 'educator' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800']">{{ user.role === 'admin' ? 'Admin' : user.role === 'educator' ? 'Edukator' : 'Učenik' }}</span>
                </div>
              </div>
              <div class="grid md:grid-cols-2 gap-3 mt-4 text-sm">
                <div class="bg-gray-50 dark:bg-dark-800 rounded-xl p-3 border border-gray-100 dark:border-dark-700"><p class="text-xs text-gray-400 mb-1">Email</p><p class="font-mono text-gray-900 dark:text-white text-sm">{{ user.email }}</p></div>
                <div v-if="user.phone" class="bg-gray-50 dark:bg-dark-800 rounded-xl p-3 border border-gray-100 dark:border-dark-700"><p class="text-xs text-gray-400 mb-1">Telefon</p><p class="text-gray-900 dark:text-white">{{ user.phone }}</p></div>
                <div v-if="user.educator" class="bg-gray-50 dark:bg-dark-800 rounded-xl p-3 border border-gray-100 dark:border-dark-700"><p class="text-xs text-gray-400 mb-1">Edukator</p><p class="text-gold-600 dark:text-gold-400">{{ user.educator.name }}</p></div>
              </div>
            </div>
            <div class="flex space-x-2 ml-4">
              <button @click="openUserModal(user)" class="p-2 text-gold-600 dark:text-gold-500 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-xl transition-colors"><Edit2 class="w-4 h-4" /></button>
              <button @click="deleteUser(user.id)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 class="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Courses Tab -->
    <div v-else-if="activeTab === 'courses'" class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Kursevi</h2>
        <button @click="openCourseModal()" class="flex items-center space-x-2 btn-gold text-white px-4 py-2.5 rounded-xl font-medium"><Plus class="w-4 h-4" /><span>Novi kurs</span></button>
      </div>
      <div class="space-y-4">
        <div v-for="course in courses" :key="course.id" class="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden">
          <div class="p-4 flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1">
              <button @click="toggleCourseExpand(course.id)" class="p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">
                <ChevronRight v-if="!expandedCourses.has(course.id)" class="w-5 h-5 text-gray-500" />
                <ChevronDown v-else class="w-5 h-5 text-gold-500" />
              </button>
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ course.title }}</h3>
                  <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', course.is_active ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-dark-800 text-gray-500']">{{ course.is_active ? 'Aktivan' : 'Neaktivan' }}</span>
                </div>
                <p v-if="course.description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ course.description }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ course.lessons.length }} lekcija</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button @click="toggleCourseActive(course)" :title="course.is_active ? 'Deaktiviraj' : 'Aktiviraj'" class="p-2 rounded-xl transition-colors" :class="course.is_active ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'"><Eye v-if="course.is_active" class="w-5 h-5" /><EyeOff v-else class="w-5 h-5" /></button>
              <button @click="openLessonModal(course.id)" class="p-2 text-gold-500 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded-xl transition-colors" title="Dodaj lekciju"><Plus class="w-5 h-5" /></button>
              <button @click="openCourseModal(course)" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"><Edit2 class="w-5 h-5" /></button>
              <button @click="deleteCourse(course.id)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 class="w-5 h-5" /></button>
            </div>
          </div>
          <div v-if="expandedCourses.has(course.id)" class="border-t border-gray-100 dark:border-dark-800 bg-gray-50 dark:bg-dark-800/50">
            <div v-if="course.lessons.length === 0" class="p-6 text-center text-gray-400 dark:text-gray-500">Nema lekcija. Kliknite + da dodate prvu lekciju.</div>
            <div v-else class="divide-y divide-gray-100 dark:divide-dark-700">
              <div v-for="lesson in course.lessons" :key="lesson.id" class="p-4 flex items-center space-x-4 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
                <div class="text-gray-400"><GripVertical class="w-5 h-5" /></div>
                <div class="w-10 h-10 rounded-lg bg-gray-200 dark:bg-dark-700 flex items-center justify-center text-gray-500 font-semibold">{{ lesson.order_number }}</div>
                <img v-if="lesson.thumbnail_url" :src="lesson.thumbnail_url" :alt="lesson.title" class="w-24 h-14 object-cover rounded-lg" />
                <div v-else class="w-24 h-14 bg-gray-200 dark:bg-dark-700 rounded-lg flex items-center justify-center"><Video class="w-6 h-6 text-gray-400" /></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <h4 class="font-medium text-gray-900 dark:text-white truncate">{{ lesson.title }}</h4>
                    <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', lesson.is_active ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-dark-800 text-gray-500']">{{ lesson.is_active ? 'Aktivna' : 'Neaktivna' }}</span>
                  </div>
                  <p v-if="lesson.description" class="text-sm text-gray-500 truncate">{{ lesson.description }}</p>
                </div>
                <div class="flex items-center space-x-2">
                  <button @click="toggleLessonActive(lesson)" :title="lesson.is_active ? 'Deaktiviraj' : 'Aktiviraj'" class="p-2 rounded-lg transition-colors" :class="lesson.is_active ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'"><Eye v-if="lesson.is_active" class="w-4 h-4" /><EyeOff v-else class="w-4 h-4" /></button>
                  <button @click="openLessonModal(course.id, lesson)" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 class="w-4 h-4" /></button>
                  <button @click="deleteLesson(lesson.id)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 class="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="courses.length === 0 && !loading" class="text-center py-12 bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800"><BookOpen class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><p class="text-gray-500">Nema kurseva. Kreirajte prvi kurs.</p></div>
      </div>
    </div>

    <!-- Zoom Tab -->
    <div v-else-if="activeTab === 'zoom'" class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Zoom Snimci</h2>
        <button @click="openZoomModal()" class="flex items-center space-x-2 btn-gold text-white px-4 py-2.5 rounded-xl font-medium"><Plus class="w-4 h-4" /><span>Dodaj snimak</span></button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="recording in zoomRecordings" :key="recording.id" class="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden card-hover">
          <div class="aspect-video bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/20 dark:to-gold-800/20 flex items-center justify-center border-b border-gray-200 dark:border-dark-700">
            <Video class="w-16 h-16 text-gold-500 opacity-80" />
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{{ recording.title }}</h3>
            <div class="flex items-center text-sm text-gray-500 mb-3">
              <Calendar class="w-4 h-4 mr-1 text-gold-500" />
              <span>{{ formatDate(recording.recorded_at) }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <button @click="openZoomModal(recording)" class="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 class="w-4 h-4" /><span>Uredi</span></button>
              <button @click="deleteZoom(recording.id)" class="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 class="w-4 h-4" /><span>Obriši</span></button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="zoomRecordings.length === 0 && !loading" class="text-center py-12 bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800"><Video class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><p class="text-gray-500">Nema Zoom snimaka. Dodajte prvi snimak.</p></div>
    </div>

    <!-- Tests Tab -->
    <div v-else-if="activeTab === 'tests'" class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Testovi</h2>
        <button @click="openTestModal()" class="flex items-center space-x-2 btn-gold text-white px-4 py-2.5 rounded-xl font-medium"><Plus class="w-4 h-4" /><span>Novi test</span></button>
      </div>
      <div class="space-y-4">
        <div v-for="test in tests" :key="test.id" class="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden">
          <div class="p-4 flex items-center justify-between">
            <div class="flex items-center space-x-3 flex-1">
              <button @click="toggleTestExpand(test.id)" class="p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">
                <ChevronRight v-if="!expandedTests.has(test.id)" class="w-5 h-5 text-gray-500" />
                <ChevronDown v-else class="w-5 h-5 text-gold-500" />
              </button>
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ test.title }}</h3>
                  <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', test.is_active ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-dark-800 text-gray-500']">{{ test.is_active ? 'Aktivan' : 'Neaktivan' }}</span>
                </div>
                <p v-if="test.description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ test.description }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ test.questions?.length || test.questions_count || 0 }} pitanja</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button @click="toggleTestActive(test)" :title="test.is_active ? 'Deaktiviraj' : 'Aktiviraj'" class="p-2 rounded-xl transition-colors" :class="test.is_active ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'"><Eye v-if="test.is_active" class="w-5 h-5" /><EyeOff v-else class="w-5 h-5" /></button>
              <button @click="openQuestionModal(test.id)" class="p-2 text-gold-500 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded-xl transition-colors" title="Dodaj pitanje"><Plus class="w-5 h-5" /></button>
              <button @click="openTestModal(test)" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"><Edit2 class="w-5 h-5" /></button>
              <button @click="deleteTest(test.id)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 class="w-5 h-5" /></button>
            </div>
          </div>
          <div v-if="expandedTests.has(test.id)" class="border-t border-gray-100 dark:border-dark-800 bg-gray-50 dark:bg-dark-800/50">
            <div v-if="!test.questions || test.questions.length === 0" class="p-6 text-center text-gray-400 dark:text-gray-500">Nema pitanja. Kliknite + da dodate prvo pitanje.</div>
            <div v-else class="divide-y divide-gray-100 dark:divide-dark-700">
              <div v-for="question in test.questions" :key="question.id" class="p-4 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">
                <div class="flex items-start space-x-4">
                  <div class="w-10 h-10 rounded-lg bg-gray-200 dark:bg-dark-700 flex items-center justify-center text-gray-500 font-semibold flex-shrink-0">{{ question.order_number }}</div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2 mb-1">
                      <span :class="['px-2 py-0.5 rounded text-xs font-medium', question.question_type === 'multiple_choice' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : question.question_type === 'true_false' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400']">{{ getQuestionTypeLabel(question.question_type) }}</span>
                    </div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ question.question_text }}</p>
                    <div v-if="question.question_type === 'multiple_choice' && question.options" class="mt-2 space-y-1">
                      <div v-for="(option, idx) in question.options" :key="idx" :class="['text-sm px-2 py-1 rounded', option === question.correct_answer ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400']">
                        {{ String.fromCharCode(65 + idx) }}. {{ option }} <CheckCircle v-if="option === question.correct_answer" class="w-4 h-4 inline ml-1" />
                      </div>
                    </div>
                    <div v-else-if="question.question_type === 'true_false'" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Tačan odgovor: <span class="font-medium text-green-600 dark:text-green-400">{{ question.correct_answer === 'true' ? 'Tačno' : 'Netačno' }}</span>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2 flex-shrink-0">
                    <button @click="openQuestionModal(test.id, question)" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit2 class="w-4 h-4" /></button>
                    <button @click="deleteQuestion(question.id)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 class="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="tests.length === 0 && !loading" class="text-center py-12 bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800"><FileText class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><p class="text-gray-500">Nema testova. Kreirajte prvi test.</p></div>
      </div>
    </div>

    <!-- Results Tab -->
    <div v-else-if="activeTab === 'results'" class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Rezultati testova</h2>
      </div>
      <div class="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Učenik</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Test</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rezultat</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Datum</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Akcije</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-dark-800">
              <tr v-for="result in testResults" :key="result.id" class="hover:bg-gray-50 dark:hover:bg-dark-800/50 transition-colors">
                <td class="px-4 py-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-semibold text-sm">{{ result.user?.name?.charAt(0).toUpperCase() || '?' }}</div>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">{{ result.user?.name || 'Nepoznat' }}</p>
                      <p class="text-xs text-gray-500">{{ result.user?.email || '' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4"><span class="text-gray-900 dark:text-white">{{ result.test?.title || 'Nepoznat test' }}</span></td>
                <td class="px-4 py-4 text-center">
                  <div class="flex items-center justify-center space-x-1">
                    <span class="font-bold text-lg" :class="result.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ result.score }}/{{ result.total_questions }}</span>
                    <span class="text-sm text-gray-500">({{ result.percentage }}%)</span>
                  </div>
                </td>
                <td class="px-4 py-4 text-center">
                  <span :class="['inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium', result.passed ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400']">
                    <CheckCircle v-if="result.passed" class="w-3.5 h-3.5" />
                    <XCircle v-else class="w-3.5 h-3.5" />
                    <span>{{ result.passed ? 'Položio' : 'Nije položio' }}</span>
                  </span>
                </td>
                <td class="px-4 py-4 text-gray-500 dark:text-gray-400 text-sm">{{ formatDate(result.completed_at) }}</td>
                <td class="px-4 py-4 text-center">
                  <button @click="openResultDetail(result)" class="p-2 text-gold-500 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded-lg transition-colors" title="Pogledaj detalje"><Eye class="w-4 h-4" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="testResults.length === 0 && !loading" class="p-12 text-center"><Award class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" /><p class="text-gray-500">Nema rezultata testova.</p></div>
      </div>
    </div>

    <!-- User Modal -->
    <div v-if="showUserModal" class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-800 shadow-2xl">
        <div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ editingUser ? 'Uredi korisnika' : 'Dodaj korisnika' }}</h3><button @click="showUserModal = false" class="text-gray-400 hover:text-gold-500 transition-colors"><X class="w-6 h-6" /></button></div>
        <form @submit.prevent="saveUser" class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Ime i prezime</label><input v-model="userForm.name" type="text" required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <div v-if="!editingUser"><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label><input v-model="userForm.email" type="email" required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <div v-if="!editingUser"><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Lozinka</label><input v-model="userForm.password" type="password" required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Telefon</label><input v-model="userForm.phone" type="tel" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Adresa</label><input v-model="userForm.address" type="text" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Uloga</label><select v-model="userForm.role" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"><option value="student">Učenik</option><option value="educator">Edukator</option><option value="admin">Admin</option></select></div>
          <div v-if="userForm.role === 'student'"><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Edukator</label><select v-model="userForm.educator_id" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"><option value="">Izaberi edukatora</option><option v-for="educator in educators" :key="educator.id" :value="educator.id.toString()">{{ educator.name }}</option></select></div>
          <button type="submit" :disabled="loading" class="w-full btn-gold text-white font-medium py-3 rounded-xl disabled:opacity-50">{{ loading ? 'Čuvanje...' : editingUser ? 'Ažuriraj' : 'Kreiraj' }}</button>
        </form>
      </div>
    </div>

    <!-- Course Modal -->
    <div v-if="showCourseModal" class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-dark-800 shadow-2xl">
        <div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ editingCourse ? 'Uredi kurs' : 'Novi kurs' }}</h3><button @click="showCourseModal = false" class="text-gray-400 hover:text-gold-500 transition-colors"><X class="w-6 h-6" /></button></div>
        <form @submit.prevent="saveCourse" class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Naziv kursa</label><input v-model="courseForm.title" type="text" required placeholder="npr. PMU Osnovni Kurs" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Opis (opciono)</label><textarea v-model="courseForm.description" rows="3" placeholder="Kratak opis kursa..." class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea></div>
          <div class="flex items-center space-x-3"><input type="checkbox" id="is_active" v-model="courseForm.is_active" class="w-5 h-5 rounded border-gray-300 text-gold-500 focus:ring-gold-500" /><label for="is_active" class="text-sm font-medium text-gray-700 dark:text-gray-300">Kurs je aktivan (vidljiv učenicima)</label></div>
          <button type="submit" :disabled="loading" class="w-full btn-gold text-white font-medium py-3 rounded-xl disabled:opacity-50">{{ loading ? 'Čuvanje...' : editingCourse ? 'Ažuriraj' : 'Kreiraj kurs' }}</button>
        </form>
      </div>
    </div>

    <!-- Lesson Modal -->
    <div v-if="showLessonModal" class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-lg w-full p-6 border border-gray-200 dark:border-dark-800 shadow-2xl">
        <div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ editingLesson ? 'Uredi lekciju' : 'Nova lekcija' }}</h3><button @click="showLessonModal = false" class="text-gray-400 hover:text-gold-500 transition-colors"><X class="w-6 h-6" /></button></div>
        <form @submit.prevent="saveLesson" class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Naziv lekcije</label><input v-model="lessonForm.title" type="text" required placeholder="npr. Uvod u PMU tehnike" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Vimeo Embed/URL</label><textarea v-model="lessonForm.vimeo_embed" rows="3" required placeholder="Zalijepite Vimeo embed kod ili URL" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea><p class="text-xs text-gray-400 mt-1">Kopirajte embed kod sa Vimeo-a ili samo URL videa</p></div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Opis (opciono)</label><textarea v-model="lessonForm.description" rows="2" placeholder="Kratak opis lekcije..." class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea></div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Redni broj</label><input v-model.number="lessonForm.order_number" type="number" min="1" required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <button type="submit" :disabled="loading" class="w-full btn-gold text-white font-medium py-3 rounded-xl disabled:opacity-50">{{ loading ? 'Čuvanje...' : editingLesson ? 'Ažuriraj' : 'Dodaj lekciju' }}</button>
        </form>
      </div>
    </div>

    <!-- Zoom Modal -->
    <div v-if="showZoomModal" class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-lg w-full p-6 border border-gray-200 dark:border-dark-800 shadow-2xl">
        <div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ editingZoom ? 'Uredi snimak' : 'Novi Zoom snimak' }}</h3><button @click="showZoomModal = false" class="text-gray-400 hover:text-gold-500 transition-colors"><X class="w-6 h-6" /></button></div>
        <form @submit.prevent="saveZoom" class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Naziv snimka</label><input v-model="zoomForm.title" type="text" required placeholder="npr. Zoom sesija - 15. januar 2025" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Vimeo Embed/URL</label><textarea v-model="zoomForm.vimeo_embed" rows="3" required placeholder="Zalijepite Vimeo embed kod ili URL" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea><p class="text-xs text-gray-400 mt-1">Kopirajte embed kod sa Vimeo-a ili samo URL videa</p></div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Datum snimanja</label><input v-model="zoomForm.recorded_at" type="date" required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <button type="submit" :disabled="loading" class="w-full btn-gold text-white font-medium py-3 rounded-xl disabled:opacity-50">{{ loading ? 'Čuvanje...' : editingZoom ? 'Ažuriraj' : 'Dodaj snimak' }}</button>
        </form>
      </div>
    </div>

    <!-- Test Modal -->
    <div v-if="showTestModal" class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-dark-800 shadow-2xl">
        <div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ editingTest ? 'Uredi test' : 'Novi test' }}</h3><button @click="showTestModal = false" class="text-gray-400 hover:text-gold-500 transition-colors"><X class="w-6 h-6" /></button></div>
        <form @submit.prevent="saveTest" class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Naziv testa</label><input v-model="testForm.title" type="text" required placeholder="npr. Test iz PMU tehnika" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Opis (opciono)</label><textarea v-model="testForm.description" rows="3" placeholder="Kratak opis testa..." class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea></div>
          <div class="flex items-center space-x-3"><input type="checkbox" id="test_is_active" v-model="testForm.is_active" class="w-5 h-5 rounded border-gray-300 text-gold-500 focus:ring-gold-500" /><label for="test_is_active" class="text-sm font-medium text-gray-700 dark:text-gray-300">Test je aktivan (vidljiv učenicima)</label></div>
          <button type="submit" :disabled="loading" class="w-full btn-gold text-white font-medium py-3 rounded-xl disabled:opacity-50">{{ loading ? 'Čuvanje...' : editingTest ? 'Ažuriraj' : 'Kreiraj test' }}</button>
        </form>
      </div>
    </div>

    <!-- Question Modal -->
    <div v-if="showQuestionModal" class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-800 shadow-2xl">
        <div class="flex justify-between items-center mb-4"><h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ editingQuestion ? 'Uredi pitanje' : 'Novo pitanje' }}</h3><button @click="showQuestionModal = false" class="text-gray-400 hover:text-gold-500 transition-colors"><X class="w-6 h-6" /></button></div>
        <form @submit.prevent="saveQuestion" class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tekst pitanja</label><textarea v-model="questionForm.question_text" rows="3" required placeholder="Unesite tekst pitanja..." class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea></div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tip pitanja</label>
            <select v-model="questionForm.question_type" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all">
              <option value="multiple_choice">Višestruki izbor</option>
              <option value="true_false">Tačno/Netačno</option>
              <option value="text">Tekstualni odgovor</option>
            </select>
          </div>
          <div v-if="questionForm.question_type === 'multiple_choice'" class="space-y-3">
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400">Opcije (označite tačan odgovor)</label>
            <div v-for="(_, idx) in questionForm.options" :key="idx" class="flex items-center space-x-2">
              <input type="radio" :name="'correct_answer'" :value="questionForm.options[idx]" v-model="questionForm.correct_answer" class="w-4 h-4 text-gold-500 focus:ring-gold-500" :disabled="!questionForm.options[idx]" />
              <span class="text-gray-500 font-medium w-6">{{ String.fromCharCode(65 + idx) }}.</span>
              <input v-model="questionForm.options[idx]" type="text" :placeholder="'Opcija ' + String.fromCharCode(65 + idx)" class="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" />
            </div>
            <p class="text-xs text-gray-400">Unesite najmanje 2 opcije i označite tačan odgovor</p>
          </div>
          <div v-else-if="questionForm.question_type === 'true_false'">
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tačan odgovor</label>
            <div class="flex space-x-4">
              <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" v-model="questionForm.correct_answer" value="true" class="w-4 h-4 text-gold-500 focus:ring-gold-500" /><span class="text-gray-700 dark:text-gray-300">Tačno</span></label>
              <label class="flex items-center space-x-2 cursor-pointer"><input type="radio" v-model="questionForm.correct_answer" value="false" class="w-4 h-4 text-gold-500 focus:ring-gold-500" /><span class="text-gray-700 dark:text-gray-300">Netačno</span></label>
            </div>
          </div>
          <div v-else>
            <p class="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-800 rounded-lg p-3">Tekstualni odgovori se ručno pregledaju. Nema automatskog bodovanja.</p>
          </div>
          <div><label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Redni broj</label><input v-model.number="questionForm.order_number" type="number" min="1" required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" /></div>
          <button type="submit" :disabled="loading" class="w-full btn-gold text-white font-medium py-3 rounded-xl disabled:opacity-50">{{ loading ? 'Čuvanje...' : editingQuestion ? 'Ažuriraj' : 'Dodaj pitanje' }}</button>
        </form>
      </div>
    </div>

    <!-- Materials Tab -->
    <div v-else-if="activeTab === 'materials'" class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Materijali</h2>
        <div class="flex items-center space-x-3">
          <button @click="toggleMaterialsEnabled" :class="['flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all border', materialsEnabled ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-dark-800 text-gray-500 border-gray-200 dark:border-dark-700']">
            <Eye v-if="materialsEnabled" class="w-4 h-4" />
            <EyeOff v-else class="w-4 h-4" />
            <span>{{ materialsEnabled ? 'Stranica aktivna' : 'Stranica neaktivna' }}</span>
          </button>
          <button @click="openMaterialModal()" class="flex items-center space-x-2 btn-gold text-white px-4 py-2.5 rounded-xl font-medium">
            <Plus class="w-4 h-4" /><span>Dodaj materijal</span>
          </button>
        </div>
      </div>

      <div v-if="!materialsEnabled" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
        <p class="text-sm text-yellow-700 dark:text-yellow-400">Stranica Materijali je trenutno onemogućena i nije vidljiva korisnicima.</p>
      </div>

      <div class="space-y-4">
        <div v-for="material in materials" :key="material.id" class="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800 overflow-hidden card-hover">
          <div class="flex">
            <img v-if="material.image_url" :src="getImageUrl(material.image_url)" :alt="material.title" class="w-32 h-32 object-cover flex-shrink-0" />
            <div v-else class="w-32 h-32 bg-gray-100 dark:bg-dark-800 flex items-center justify-center flex-shrink-0">
              <Package class="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <div class="flex-1 p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ material.title }}</h3>
                    <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', material.is_active ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-dark-800 text-gray-500']">
                      {{ material.is_active ? 'Vidljiv' : 'Sakriven' }}
                    </span>
                  </div>
                  <p v-if="material.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{{ material.description }}</p>
                  <div v-if="material.file_url" class="flex items-center space-x-2 text-sm text-gold-600 dark:text-gold-400">
                    <Download class="w-4 h-4" />
                    <span>{{ material.file_name }}</span>
                  </div>
                </div>
                <div class="flex items-center space-x-2 ml-4">
                  <button @click="toggleMaterialActive(material)" :title="material.is_active ? 'Sakrij' : 'Prikaži'" class="p-2 rounded-xl transition-colors" :class="material.is_active ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'">
                    <Eye v-if="material.is_active" class="w-5 h-5" />
                    <EyeOff v-else class="w-5 h-5" />
                  </button>
                  <button @click="openMaterialModal(material)" class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors">
                    <Edit2 class="w-5 h-5" />
                  </button>
                  <button @click="deleteMaterial(material.id)" class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="materials.length === 0 && !loading" class="text-center py-12 bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-800">
          <Package class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p class="text-gray-500">Nema materijala. Dodajte prvi materijal.</p>
        </div>
      </div>
    </div>

    <!-- Material Modal -->
    <div v-if="showMaterialModal" class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-lg w-full p-6 border border-gray-200 dark:border-dark-800 shadow-2xl">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ editingMaterial ? 'Uredi materijal' : 'Novi materijal' }}</h3>
          <button @click="showMaterialModal = false" class="text-gray-400 hover:text-gold-500 transition-colors"><X class="w-6 h-6" /></button>
        </div>
        <form @submit.prevent="saveMaterial" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Naslov <span class="text-red-500">*</span></label>
            <input v-model="materialForm.title" type="text" required class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Opis</label>
            <textarea v-model="materialForm.description" rows="3" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Slika</label>
            <input type="file" accept="image/*" @change="handleMaterialImage" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100 dark:file:bg-gold-900/20 dark:file:text-gold-400" />
            <p v-if="editingMaterial?.image_url" class="text-xs text-gray-400 mt-1">Trenutna slika će biti zadržana ako ne odaberete novu.</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Fajl za preuzimanje</label>
            <input type="file" @change="handleMaterialFile" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100 dark:file:bg-gold-900/20 dark:file:text-gold-400" />
            <p v-if="editingMaterial?.file_name" class="text-xs text-gray-400 mt-1">Trenutni fajl: {{ editingMaterial.file_name }}</p>
          </div>
          <button type="submit" :disabled="loading || !materialForm.title" class="w-full btn-gold text-white font-medium py-3 rounded-xl disabled:opacity-50">
            {{ loading ? 'Čuvanje...' : (editingMaterial ? 'Sačuvaj izmjene' : 'Dodaj materijal') }}
          </button>
        </form>
      </div>
    </div>

    <!-- Result Detail Modal -->
    <div v-if="showResultModal && selectedResultDetail" class="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-dark-900 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-800 shadow-2xl">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">Detalji rezultata</h3>
            <p class="text-sm text-gray-500 mt-1">{{ selectedResultDetail.user?.name }} - {{ selectedResultDetail.test?.title }}</p>
          </div>
          <button @click="showResultModal = false" class="text-gray-400 hover:text-gold-500 transition-colors"><X class="w-6 h-6" /></button>
        </div>
        <div class="bg-gray-50 dark:bg-dark-800 rounded-xl p-4 mb-6 border border-gray-100 dark:border-dark-700">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div><p class="text-2xl font-bold" :class="selectedResultDetail.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ selectedResultDetail.score }}/{{ selectedResultDetail.total_questions }}</p><p class="text-xs text-gray-500">Bodovi</p></div>
            <div><p class="text-2xl font-bold" :class="selectedResultDetail.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ selectedResultDetail.percentage }}%</p><p class="text-xs text-gray-500">Procenat</p></div>
            <div><span :class="['inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium', selectedResultDetail.passed ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400']"><CheckCircle v-if="selectedResultDetail.passed" class="w-4 h-4" /><XCircle v-else class="w-4 h-4" /><span>{{ selectedResultDetail.passed ? 'Položio' : 'Nije položio' }}</span></span></div>
          </div>
        </div>
        <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Odgovori</h4>
        <div class="space-y-4">
          <div v-for="(answer, idx) in selectedResultDetail.answers" :key="idx" :class="['p-4 rounded-xl border', answer.is_correct ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800']">
            <div class="flex items-start space-x-3">
              <div :class="['w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', answer.is_correct ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400']">
                <CheckCircle v-if="answer.is_correct" class="w-5 h-5" />
                <XCircle v-else class="w-5 h-5" />
              </div>
              <div class="flex-1">
                <p class="font-medium text-gray-900 dark:text-white mb-2">{{ answer.question_text }}</p>
                <div class="text-sm space-y-1">
                  <p><span class="text-gray-500">Odgovor učenika:</span> <span :class="answer.is_correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ answer.selected_answer || '(bez odgovora)' }}</span></p>
                  <p v-if="!answer.is_correct && answer.correct_answer"><span class="text-gray-500">Tačan odgovor:</span> <span class="text-green-600 dark:text-green-400">{{ answer.correct_answer }}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>