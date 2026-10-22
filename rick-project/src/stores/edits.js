import { defineStore } from 'pinia'
import { computed } from 'vue'
import { RESOURCES } from '@/config/resources'
import { usePersistedRef } from '@/utils/storage'

export const EDITS_KEY = 'rm-explorer:edits:v1'
export const ACTIVITY_KEY = 'rm-explorer:activity:v1'
const MAX_ACTIVITY = 60

export const keyOf = (resource, id) => `${resource}:${id}`
const normalize = (v) => (typeof v === 'string' ? v.trim() : (v ?? ''))
const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)))

/**
 * Local overrides layered on top of remote API data.
 *
 * Each record stores only the fields that differ from the remote value, plus a
 * snapshot of the original remote values (`base`) so we can show diffs, revert,
 * and render the item even without hitting the API.
 *
 * record = { resource, id, fields, base, image, createdAt, updatedAt }
 */
export const useEditsStore = defineStore('edits', () => {
  const records = usePersistedRef(EDITS_KEY, {})
  const activity = usePersistedRef(ACTIVITY_KEY, [])

  const list = computed(() =>
    Object.values(records.value).sort((a, b) => b.updatedAt - a.updatedAt),
  )
  const count = computed(() => list.value.length)
  const countBy = computed(() => {
    const c = { character: 0, location: 0, episode: 0 }
    for (const r of list.value) c[r.resource] = (c[r.resource] ?? 0) + 1
    return c
  })

  function get(resource, id) {
    return records.value[keyOf(resource, id)] ?? null
  }

  /** Returns the entity merged with local edits + source metadata. */
  function apply(resource, entity) {
    if (!entity) return entity
    const rec = get(resource, entity.id)
    if (!rec) return { ...entity, _source: 'remote', _edited: [] }
    return {
      ...entity,
      ...rec.fields,
      _source: 'local',
      _edited: Object.keys(rec.fields),
      _original: rec.base,
      _updatedAt: rec.updatedAt,
    }
  }

  function displayName(rec) {
    return rec?.fields?.name ?? rec?.base?.name ?? `#${rec?.id}`
  }

  function log(type, resource, id, name, fields) {
    activity.value.unshift({ type, resource, id, name, fields, at: Date.now() })
    if (activity.value.length > MAX_ACTIVITY) activity.value.length = MAX_ACTIVITY
  }

  function snapshotBase(resource, entity) {
    const base = {}
    for (const f of RESOURCES[resource].fields) base[f.key] = entity[f.key] ?? ''
    return base
  }

  /**
   * Updates one or more fields. `entity` must be the raw remote entity.
   * Values equal to the remote original are dropped (auto-revert).
   * Returns an undo token `{ key, previous }` or null when nothing changed.
   */
  function update(resource, entity, values) {
    const key = keyOf(resource, entity.id)
    const prev = records.value[key]
    const base = prev?.base ?? snapshotBase(resource, entity)
    const fields = { ...prev?.fields }
    const changed = []

    for (const [field, raw] of Object.entries(values)) {
      const value = normalize(raw)
      if (value === normalize(base[field])) {
        if (field in fields) {
          delete fields[field]
          changed.push(field)
        }
      } else if (fields[field] !== value) {
        fields[field] = value
        changed.push(field)
      }
    }
    if (!changed.length) return null

    const previous = clone(prev ?? null)
    if (!Object.keys(fields).length) {
      delete records.value[key]
      log('revert', resource, entity.id, base.name, changed)
    } else {
      const now = Date.now()
      records.value[key] = {
        resource,
        id: entity.id,
        fields,
        base,
        image: entity.image ?? null,
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
      }
      log('edit', resource, entity.id, fields.name ?? base.name, changed)
    }
    return { key, previous }
  }

  function revertField(resource, id, field) {
    const key = keyOf(resource, id)
    const rec = records.value[key]
    if (!rec || !(field in rec.fields)) return null
    const previous = clone(rec)
    const fields = { ...rec.fields }
    delete fields[field]
    if (!Object.keys(fields).length) delete records.value[key]
    else records.value[key] = { ...rec, fields, updatedAt: Date.now() }
    log('revert', resource, id, rec.base.name, [field])
    return { key, previous }
  }

  function revert(resource, id) {
    const key = keyOf(resource, id)
    const rec = records.value[key]
    if (!rec) return null
    const previous = clone(rec)
    delete records.value[key]
    log('revert', resource, id, rec.base.name, Object.keys(rec.fields))
    return { key, previous }
  }

  /** Restores a record snapshot (used for undo). */
  function restore(token) {
    if (!token) return
    if (token.previous) records.value[token.key] = token.previous
    else delete records.value[token.key]
  }

  function clearAll() {
    const previous = clone(records.value)
    records.value = {}
    log('clear', null, null, 'Todas as edições', [])
    return previous
  }

  function restoreAll(snapshot) {
    records.value = snapshot ?? {}
  }

  function clearActivity() {
    activity.value = []
  }

  function exportJSON() {
    return JSON.stringify(
      { app: 'portal-explorer', version: 1, exportedAt: new Date().toISOString(), records: records.value },
      null,
      2,
    )
  }

  function importJSON(text) {
    const data = JSON.parse(text)
    const incoming = data?.records
    if (!incoming || typeof incoming !== 'object') throw new Error('Arquivo inválido')
    let n = 0
    for (const [key, rec] of Object.entries(incoming)) {
      if (!rec?.resource || !RESOURCES[rec.resource] || !rec.id || !rec.fields || !rec.base) continue
      records.value[key] = rec
      n++
    }
    log('import', null, null, `${n} registro(s) importado(s)`, [])
    return n
  }

  return {
    records,
    activity,
    list,
    count,
    countBy,
    get,
    apply,
    displayName,
    update,
    revertField,
    revert,
    restore,
    clearAll,
    restoreAll,
    clearActivity,
    exportJSON,
    importJSON,
  }
})
