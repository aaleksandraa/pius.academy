<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-vue-next'

const props = defineProps<{ src: string; alt?: string }>()
const emit = defineEmits<{ close: [] }>()

const scale = ref(1)
const rotation = ref(0)
const isDragging = ref(false)
const position = ref({ x: 0, y: 0 })
const dragStart = ref({ x: 0, y: 0 })

function zoomIn() {
  scale.value = Math.min(scale.value + 0.5, 5)
}

function zoomOut() {
  scale.value = Math.max(scale.value - 0.5, 0.5)
}

function rotate() {
  rotation.value = (rotation.value + 90) % 360
}

function reset() {
  scale.value = 1
  rotation.value = 0
  position.value = { x: 0, y: 0 }
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.deltaY < 0) zoomIn()
  else zoomOut()
}

function handleMouseDown(e: MouseEvent) {
  if (scale.value > 1) {
    isDragging.value = true
    dragStart.value = { x: e.clientX - position.value.x, y: e.clientY - position.value.y }
  }
}

function handleMouseMove(e: MouseEvent) {
  if (isDragging.value) {
    position.value = { x: e.clientX - dragStart.value.x, y: e.clientY - dragStart.value.y }
  }
}

function handleMouseUp() {
  isDragging.value = false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  if (e.key === '+' || e.key === '=') zoomIn()
  if (e.key === '-') zoomOut()
  if (e.key === 'r') rotate()
  if (e.key === '0') reset()
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div 
      class="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      @click="handleBackdropClick"
      @wheel="handleWheel"
    >
      <!-- Controls -->
      <div class="absolute top-4 right-4 flex items-center space-x-2 z-10">
        <button @click="zoomOut" class="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Umanji (-)">
          <ZoomOut class="w-5 h-5" />
        </button>
        <span class="text-white text-sm font-medium min-w-[60px] text-center">{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn" class="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Uvećaj (+)">
          <ZoomIn class="w-5 h-5" />
        </button>
        <button @click="rotate" class="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title="Rotiraj (R)">
          <RotateCw class="w-5 h-5" />
        </button>
        <button @click="emit('close')" class="p-2 bg-white/10 hover:bg-red-500/80 rounded-lg text-white transition-colors" title="Zatvori (Esc)">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Help text -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs text-center">
        Scroll za zoom • Klikni i povuci za pomjeranje • Esc za zatvaranje
      </div>

      <!-- Image -->
      <div 
        class="max-w-[90vw] max-h-[90vh] overflow-hidden"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <img 
          :src="props.src" 
          :alt="props.alt || 'Image'" 
          class="max-w-full max-h-[90vh] object-contain select-none transition-transform duration-200"
          :class="{ 'cursor-grab': scale > 1, 'cursor-grabbing': isDragging }"
          :style="{ 
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
          }"
          draggable="false"
        />
      </div>
    </div>
  </Teleport>
</template>
