import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let seq = 0

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function push({ message, type = 'info', action = null, timeout = 4500 }) {
    const id = ++seq
    toasts.value.push({ id, message, type, action })
    if (toasts.value.length > 4) toasts.value.shift()
    setTimeout(() => dismiss(id), timeout)
    return id
  }

  return { toasts, push, dismiss }
})
