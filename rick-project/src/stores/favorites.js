import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePersistedRef } from '@/utils/storage'
import { keyOf } from './edits'

export const useFavoritesStore = defineStore('favorites', () => {
  const items = usePersistedRef('rm-explorer:favorites:v1', [])

  const count = computed(() => items.value.length)
  const byResource = computed(() => {
    const out = { character: [], location: [], episode: [] }
    for (const key of items.value) {
      const [resource, id] = key.split(':')
      out[resource]?.push(Number(id))
    }
    return out
  })

  const has = (resource, id) => items.value.includes(keyOf(resource, id))

  function toggle(resource, id) {
    const key = keyOf(resource, id)
    const i = items.value.indexOf(key)
    if (i >= 0) items.value.splice(i, 1)
    else items.value.unshift(key)
    return i < 0
  }

  return { items, count, byResource, has, toggle }
})
