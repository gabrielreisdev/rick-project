import { ref, watch } from 'vue'

export function usePersistedRef(key, fallback) {
  let initial = fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw) initial = JSON.parse(raw)
  } catch (e) {
    void e
  }

  const state = ref(initial)

  watch(
    state,
    (value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (e) {
        void e
      }
    },
    { deep: true },
  )

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return
      try {
        state.value = e.newValue ? JSON.parse(e.newValue) : fallback
      } catch (err) {
        void err
      }
    })
  }

  return state
}
