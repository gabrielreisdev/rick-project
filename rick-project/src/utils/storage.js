import { ref, watch } from 'vue'

/** A ref persisted in localStorage and synced across browser tabs. */
export function usePersistedRef(key, fallback) {
  let initial = fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw) initial = JSON.parse(raw)
  } catch {
    /* corrupted storage – fall back */
  }

  const state = ref(initial)

  watch(
    state,
    (value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch {
        /* quota exceeded / private mode */
      }
    },
    { deep: true },
  )

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return
      try {
        state.value = e.newValue ? JSON.parse(e.newValue) : fallback
      } catch {
        /* ignore */
      }
    })
  }

  return state
}
