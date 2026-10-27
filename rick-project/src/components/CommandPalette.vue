<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'
import SourceBadge from './SourceBadge.vue'
import SafeImage from './SafeImage.vue'
import { fetchPage } from '@/api/rickmorty'
import { RESOURCES, t } from '@/config/resources'
import { formatDate } from '@/utils/format'
import { useEditsStore } from '@/stores/edits'

const open = defineModel({ type: Boolean, default: false })
const router = useRouter()
const edits = useEditsStore()

const query = ref('')
const loading = ref(false)
const remote = ref({ character: [], location: [], episode: [] })
const cursor = ref(0)
const inputEl = ref(null)

let timer
let reqId = 0

watch(open, async (v) => {
  if (v) {
    await nextTick()
    inputEl.value?.focus()
  } else {
    query.value = ''
    remote.value = { character: [], location: [], episode: [] }
  }
})

watch(query, (q) => {
  clearTimeout(timer)
  cursor.value = 0
  if (!q.trim()) {
    remote.value = { character: [], location: [], episode: [] }
    loading.value = false
    return
  }
  loading.value = true
  timer = setTimeout(async () => {
    const id = ++reqId
    try {
      const [c, l, e] = await Promise.all(
        ['character', 'location', 'episode'].map((r) => fetchPage(r, 1, { name: q.trim() })),
      )
      if (id !== reqId) return
      remote.value = { character: c.results, location: l.results, episode: e.results }
    } finally {
      if (id === reqId) loading.value = false
    }
  }, 280)
})

const groups = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  return Object.values(RESOURCES)
    .map((schema) => {
      const r = schema.key
      const seen = new Set()
      const items = []
      for (const raw of remote.value[r]) {
        seen.add(raw.id)
        items.push(edits.apply(r, raw))
      }
      for (const rec of edits.list) {
        if (rec.resource !== r || seen.has(rec.id)) continue
        const name = String(rec.fields.name ?? rec.base.name ?? '').toLowerCase()
        if (name.includes(q))
          items.unshift({ ...rec.base, ...rec.fields, id: rec.id, image: rec.fields.image ?? rec.image, _source: 'local' })
      }
      return { schema, items: items.slice(0, 6) }
    })
    .filter((g) => g.items.length)
})

const flat = computed(() => groups.value.flatMap((g) => g.items.map((item) => ({ item, schema: g.schema }))))

function indexOf(schema, item) {
  return flat.value.findIndex((f) => f.schema.key === schema.key && f.item.id === item.id)
}

function go(entry) {
  if (!entry) return
  router.push(`/${entry.schema.route}/${entry.item.id}`)
  open.value = false
}

function onKey(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    cursor.value = Math.min(cursor.value + 1, flat.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    cursor.value = Math.max(cursor.value - 1, 0)
  } else if (e.key === 'Enter') {
    go(flat.value[cursor.value])
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

function subtitle(schema, item) {
  if (schema.key === 'character') return `${t(item.species) ?? ''} · ${t(item.status) ?? ''}`
  if (schema.key === 'location') return `${t(item.type) ?? ''} · ${t(item.dimension) ?? ''}`
  return `${item.episode ?? ''} · ${formatDate(item.air_date) ?? ''}`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div v-if="open" class="overlay" @mousedown.self="open = false">
        <div class="palette" role="dialog" aria-label="Busca global">
          <div class="search">
            <AppIcon name="search" :size="18" />
            <input
              id="palette-input"
              ref="inputEl"
              v-model="query"
              placeholder="Busque personagens, locais e episódios…"
              autocomplete="off"
              @keydown="onKey"
            />
            <span v-if="loading" class="spinner" />
            <kbd>Esc</kbd>
          </div>

          <div class="results">
            <p v-if="!query" class="hint">
              <AppIcon name="sparkles" :size="16" /> Digite para buscar em toda a API — itens editados localmente também
              aparecem pelo nome novo.
            </p>
            <p v-else-if="!loading && !groups.length" class="hint">Nenhum resultado em nenhuma dimensão. 🛸</p>

            <section v-for="g in groups" :key="g.schema.key" class="group">
              <h4>
                <AppIcon :name="g.schema.icon" :size="13" /> {{ g.schema.label }}
              </h4>
              <button
                v-for="item in g.items"
                :key="item.id"
                class="row"
                :class="{ active: indexOf(g.schema, item) === cursor }"
                @mouseenter="cursor = indexOf(g.schema, item)"
                @click="go({ schema: g.schema, item })"
              >
                <span class="thumb">
                  <SafeImage v-if="g.schema.key === 'character'" :src="item.image" :alt="item.name" :seed="item.id" />
                  <span v-else class="art-icon">
                    <AppIcon :name="g.schema.icon" :size="18" />
                  </span>
                </span>
                <span class="info">
                  <strong>{{ item.name }}</strong>
                  <small>{{ subtitle(g.schema, item) }}</small>
                </span>
                <SourceBadge :source="item._source" compact />
                <AppIcon name="arrow-right" :size="14" class="go" />
              </button>
            </section>
          </div>

          <footer>
            <span><kbd>↑</kbd> <kbd>↓</kbd> navegar</span>
            <span><kbd>Enter</kbd> abrir</span>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(2, 4, 8, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 10vh 16px 16px;
}
.palette {
  width: 100%;
  max-width: 640px;
  max-height: 72vh;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  background: rgba(12, 19, 28, 0.96);
  border: 1px solid var(--border-strong);
  box-shadow:
    0 30px 80px -20px rgba(0, 0, 0, 0.8),
    0 0 60px -20px rgba(151, 206, 76, 0.4);
  overflow: hidden;
}
.search {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-2);
  color: var(--portal);
}
.search input {
  flex: 1;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 17px;
  outline: none;
}
.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(151, 206, 76, 0.2);
  border-top-color: var(--portal);
  animation: spin 0.7s linear infinite;
}
.results {
  overflow-y: auto;
  padding: 8px;
}
.hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 14px;
  color: var(--text-dim);
  font-size: 14px;
}
.group h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 10px 6px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-mute);
  font-weight: 600;
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.row.active {
  background: rgba(151, 206, 76, 0.1);
}
.thumb {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}
.art-icon {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: rgba(151, 206, 76, 0.08);
  border: 1px solid rgba(151, 206, 76, 0.25);
  border-radius: 10px;
  color: var(--portal);
}
.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.info strong {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.info small {
  color: var(--text-mute);
  font-size: 12px;
}
.go {
  color: var(--portal);
  opacity: 0;
  transition: opacity 0.2s;
}
.row.active .go {
  opacity: 1;
}
footer {
  display: flex;
  gap: 16px;
  padding: 10px 18px;
  border-top: 1px solid var(--border-2);
  font-size: 12px;
  color: var(--text-mute);
}
.palette-enter-active,
.palette-leave-active {
  transition: opacity 0.2s;
}
.palette-enter-active .palette,
.palette-leave-active .palette {
  transition: transform 0.25s var(--ease);
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}
.palette-enter-from .palette {
  transform: translateY(-12px) scale(0.97);
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
