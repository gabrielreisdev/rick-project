import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePersistedRef } from '@/utils/storage'
import { keyOf } from './edits'

function normalizeItems(raw) {
  if (Array.isArray(raw)) {
    const list = []
    for (const item of raw) {
      if (typeof item === 'string') {
        if (item.includes(':')) {
          list.push(item)
        } else if (!isNaN(Number(item)) && Number(item) > 0) {
          list.push(`character:${Number(item)}`)
        }
      } else if (item && typeof item === 'object') {
        const res = item.resource || 'character'
        const id = item.id
        if (id) list.push(`${res}:${id}`)
      } else if (typeof item === 'number' && Number.isFinite(item) && item > 0) {
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
    if (Array.isArray(charList)) for (const id of charList) if (id) list.push(`character:${id}`)
    if (Array.isArray(locList)) for (const id of locList) if (id) list.push(`location:${id}`)
    if (Array.isArray(epList)) for (const id of epList) if (id) list.push(`episode:${id}`)
    return [...new Set(list)]
  }
  return []
}

export const useFavoritesStore = defineStore('favorites', () => {
  const items = usePersistedRef('rm-explorer:favorites:v1', [])

  items.value = normalizeItems(items.value)

  const count = computed(() => {
    return Array.isArray(items.value) ? items.value.length : 0
  })

  const byResource = computed(() => {
    const out = { character: [], location: [], episode: [] }
    const list = Array.isArray(items.value) ? items.value : []
    for (const key of list) {
      if (typeof key !== 'string') continue
      const [resource, id] = key.split(':')
      if (out[resource]) {
        const numId = Number(id)
        if (Number.isFinite(numId) && numId > 0 && !out[resource].includes(numId)) {
          out[resource].push(numId)
        }
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
