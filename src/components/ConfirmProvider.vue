<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import ConfirmModal from './ConfirmModal.vue'

const { isOpen, options, handleConfirm, handleCancel } = useConfirm()
</script>

<template>
  <ConfirmModal
    v-if="isOpen"
    :title="options.title"
    :message="options.message"
    :confirm-text="options.confirmText"
    :cancel-text="options.cancelText"
    :danger="options.danger"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>
