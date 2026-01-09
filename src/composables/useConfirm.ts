import { ref, markRaw } from 'vue'

interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

const isOpen = ref(false)
const options = ref<ConfirmOptions>({})
let resolvePromise: ((value: boolean) => void) | null = null

export function useConfirm() {
  const confirm = (opts: ConfirmOptions = {}): Promise<boolean> => {
    options.value = opts
    isOpen.value = true
    
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const handleConfirm = () => {
    isOpen.value = false
    resolvePromise?.(true)
    resolvePromise = null
  }

  const handleCancel = () => {
    isOpen.value = false
    resolvePromise?.(false)
    resolvePromise = null
  }

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel
  }
}
