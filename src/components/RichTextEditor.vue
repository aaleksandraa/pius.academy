<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Bold, Italic, Link } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (editorRef.value && props.modelValue) {
    editorRef.value.innerHTML = props.modelValue
  }
})

watch(() => props.modelValue, (newVal) => {
  if (editorRef.value && editorRef.value.innerHTML !== newVal) {
    editorRef.value.innerHTML = newVal
  }
})

function handleInput() {
  if (editorRef.value) {
    emit('update:modelValue', editorRef.value.innerHTML)
  }
}

function execCommand(command: string, value?: string) {
  document.execCommand(command, false, value)
  editorRef.value?.focus()
  handleInput()
}

function toggleBold() {
  execCommand('bold')
}

function toggleItalic() {
  execCommand('italic')
}

function insertLink() {
  const url = prompt('Unesite URL:')
  if (url) {
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      execCommand('createLink', url)
    } else {
      execCommand('insertHTML', `<a href="${url}" target="_blank" class="text-gold-500 hover:underline">${url}</a>`)
    }
  }
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  
  // Auto-convert URLs to links
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const htmlWithLinks = text.replace(urlRegex, '<a href="$1" target="_blank" class="text-gold-500 hover:underline">$1</a>')
  
  execCommand('insertHTML', htmlWithLinks)
}

function isActive(command: string): boolean {
  return document.queryCommandState(command)
}
</script>

<template>
  <div class="rich-text-editor">
    <!-- Toolbar -->
    <div class="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 rounded-t-xl">
      <button
        type="button"
        @click="toggleBold"
        :class="[
          'p-2 rounded-lg transition-colors',
          isActive('bold') 
            ? 'bg-gold-100 dark:bg-gold-900/30 text-gold-600' 
            : 'hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-400'
        ]"
        title="Bold (Ctrl+B)"
      >
        <Bold class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="toggleItalic"
        :class="[
          'p-2 rounded-lg transition-colors',
          isActive('italic') 
            ? 'bg-gold-100 dark:bg-gold-900/30 text-gold-600' 
            : 'hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-400'
        ]"
        title="Italic (Ctrl+I)"
      >
        <Italic class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="insertLink"
        class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-600 dark:text-gray-400 transition-colors"
        title="Dodaj link"
      >
        <Link class="w-4 h-4" />
      </button>
    </div>
    
    <!-- Editor -->
    <div
      ref="editorRef"
      contenteditable="true"
      @input="handleInput"
      @paste="handlePaste"
      :data-placeholder="placeholder"
      class="min-h-[120px] max-h-[300px] overflow-y-auto px-4 py-3 border border-t-0 border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white rounded-b-xl focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all rich-editor-content"
    ></div>
  </div>
</template>

<style scoped>
.rich-editor-content:empty:before {
  content: attr(data-placeholder);
  color: #9ca3af;
  pointer-events: none;
}

.rich-editor-content :deep(a) {
  color: #f59e0b;
}
.rich-editor-content :deep(a:hover) {
  text-decoration: underline;
}
</style>
