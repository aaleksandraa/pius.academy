<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import api from '@/lib/api'

interface User {
  id: number
  name: string
  role: string
}

const props = defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
  isTextarea?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const users = ref<User[]>([])
const filteredUsers = ref<User[]>([])
const showSuggestions = ref(false)
const mentionQuery = ref('')
const mentionStartPos = ref(0)
const selectedIndex = ref(0)
const cursorPosition = ref(0)

// Load users once
async function loadUsers() {
  if (users.value.length > 0) return
  try {
    const { data } = await api.get('/users/list')
    users.value = data.users
  } catch (e) {
    console.error('Failed to load users for mentions')
  }
}

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement | HTMLTextAreaElement
  const value = target.value
  cursorPosition.value = target.selectionStart || 0
  emit('update:modelValue', value)
  
  // Check for @ mention
  checkForMention(value, cursorPosition.value)
}

function checkForMention(text: string, pos: number) {
  // Find the last @ before cursor
  const textBeforeCursor = text.substring(0, pos)
  const lastAtIndex = textBeforeCursor.lastIndexOf('@')
  
  if (lastAtIndex === -1) {
    closeSuggestions()
    return
  }
  
  // Check if @ is at start or after a space
  const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' '
  if (charBefore !== ' ' && charBefore !== '\n' && lastAtIndex !== 0) {
    closeSuggestions()
    return
  }
  
  // Get the query after @
  const query = textBeforeCursor.substring(lastAtIndex + 1)
  
  // If there's a space in query, mention is complete
  if (query.includes(' ')) {
    closeSuggestions()
    return
  }
  
  mentionQuery.value = query.toLowerCase()
  mentionStartPos.value = lastAtIndex
  
  // Filter users
  if (mentionQuery.value.length === 0) {
    filteredUsers.value = users.value.slice(0, 5)
  } else {
    filteredUsers.value = users.value
      .filter(u => u.name.toLowerCase().includes(mentionQuery.value))
      .slice(0, 5)
  }
  
  showSuggestions.value = filteredUsers.value.length > 0
  selectedIndex.value = 0
  loadUsers()
}

function closeSuggestions() {
  showSuggestions.value = false
  mentionQuery.value = ''
  selectedIndex.value = 0
}

function selectUser(user: User) {
  const currentValue = props.modelValue
  const beforeMention = currentValue.substring(0, mentionStartPos.value)
  const afterMention = currentValue.substring(cursorPosition.value)
  
  const newValue = `${beforeMention}@${user.name} ${afterMention}`
  emit('update:modelValue', newValue)
  closeSuggestions()
  
  // Focus and set cursor position
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus()
      const newPos = mentionStartPos.value + user.name.length + 2
      inputRef.value.setSelectionRange(newPos, newPos)
    }
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (!showSuggestions.value) {
    if (e.key === 'Enter' && !props.isTextarea) {
      e.preventDefault()
      emit('submit')
    }
    return
  }
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredUsers.value.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
    case 'Tab':
      e.preventDefault()
      if (filteredUsers.value[selectedIndex.value]) {
        selectUser(filteredUsers.value[selectedIndex.value])
      }
      break
    case 'Escape':
      closeSuggestions()
      break
  }
}

function handleBlur() {
  // Delay to allow click on suggestion
  setTimeout(() => closeSuggestions(), 150)
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'admin': return 'Admin'
    case 'educator': return 'Edukator'
    default: return 'Učenik'
  }
}

function getRoleClass(role: string) {
  switch (role) {
    case 'admin': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
    case 'educator': return 'bg-gold-100 dark:bg-gold-900/30 text-gold-600 dark:text-gold-400'
    default: return 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
  }
}

// Expose method to insert mention programmatically
function insertMention(name: string) {
  const currentValue = props.modelValue
  const newValue = currentValue ? `${currentValue}@${name} ` : `@${name} `
  emit('update:modelValue', newValue)
  nextTick(() => inputRef.value?.focus())
}

defineExpose({ insertMention, focus: () => inputRef.value?.focus() })
</script>

<template>
  <div class="relative">
    <textarea
      v-if="isTextarea"
      ref="inputRef"
      :value="modelValue"
      @input="handleInput"
      @keydown="handleKeydown"
      @blur="handleBlur"
      @focus="loadUsers"
      :rows="rows || 2"
      :placeholder="placeholder"
      class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm resize-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
    />
    <input
      v-else
      ref="inputRef"
      type="text"
      :value="modelValue"
      @input="handleInput"
      @keydown="handleKeydown"
      @blur="handleBlur"
      @focus="loadUsers"
      :placeholder="placeholder"
      class="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 transition-all"
    />
    
    <!-- Suggestions dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="showSuggestions"
        class="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 shadow-lg overflow-hidden z-50"
      >
        <div class="py-1 max-h-48 overflow-y-auto">
          <button
            v-for="(user, index) in filteredUsers"
            :key="user.id"
            @mousedown.prevent="selectUser(user)"
            :class="[
              'w-full px-3 py-2 flex items-center space-x-3 text-left transition-colors',
              index === selectedIndex 
                ? 'bg-gold-50 dark:bg-gold-900/20' 
                : 'hover:bg-gray-50 dark:hover:bg-dark-800'
            ]"
          >
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ user.name }}</p>
            </div>
            <span :class="['text-xs px-2 py-0.5 rounded-full', getRoleClass(user.role)]">
              {{ getRoleLabel(user.role) }}
            </span>
          </button>
          <div v-if="filteredUsers.length === 0" class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            Nema rezultata
          </div>
        </div>
        <div class="px-3 py-1.5 bg-gray-50 dark:bg-dark-800 border-t border-gray-100 dark:border-dark-700">
          <p class="text-xs text-gray-400">↑↓ za navigaciju • Enter za odabir • Esc za zatvaranje</p>
        </div>
      </div>
    </Transition>
  </div>
</template>
