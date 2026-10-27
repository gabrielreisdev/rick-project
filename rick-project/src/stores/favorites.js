import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePersistedRef } from '@/utils/storage'
import { keyOf } from './edits'

function normalizeItems(raw) {
  if (Array.isArray(raw)) {
    const list = []
    for (const item of raw) {
      if (typeof item === 'string' && item.includes(':')) {
        list.push(item)
      } else if (item && typeof item === 'object' && item.resource && item.id) {
        list.push(`${item.resource}:${item.id}`)
      } else if (typeof item === 'number') {
        list.push(`character:${item}`)
      }
    }
    return [...new Set(list)]
  }
  if (raw && typeof raw === 'object') {
    const list = []
    const charList = raw.characters ?? raw.character ?? []
    const locList = raw.locations ?? raw.location ?? []
    const epList = raw.episodes ?? raw.episode ?? []
    if (Array.isArray(charList)) for (const id of charList) list.push(`character:${id}`)
    if (Array.isArray(locList)) for (const id of locList) list.push(`location:${id}`)
    if (Array.isArray(epList)) for (const id of epList) list.push(`episode:${id}`)
    return [...new Set(list)]
  }
  return []
}

export const useFavoritesStore = defineStore('favorites', () => {
  const items = usePersistedRef('rm-explorer:favorites:v1', [])

  if (!Array.isArray(items.value)) {
    items.value = normalizeItems(items.value)
  }

  const count = computed(() => {
    return Array.isArray(items.value) ? items.value.length : 0
  })

  const byResource = computed(() => {
    const out = { character: [], location: [], episode: [] }
    const list = Array.isArray(items.value) ? items.value : normalizeItems(items.value)
    for (const key of list) {
      if (typeof key !== 'string') continue
      const [resource, id] = key.split(':')
      if (out[resource]) {
        const numId = Number(id)
        if (!isNaN(numId) && numId > 0) out[resource].push(numId)
      }
    }
    return out
  })

  const has = (resource, id) => {
    if (!Array.isArray(items.value)) return false
    return items.value.includes(keyOf(resource, id))
  }

  function toggle(resource, id) {
    if (!Array.isArray(items.value)) items.value = normalizeItems(items.value)
    const key = keyOf(resource, id)
    const i = items.value.indexOf(key)
    if (i >= 0) items.value.splice(i, 1)
    else items.value.unshift(key)
    return i < 0
  }

  return { items, count, byResource, has, toggle }
})
