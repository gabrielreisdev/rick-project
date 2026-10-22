<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import SourceBadge from '@/components/ui/SourceBadge.vue'
import SafeImage from '@/components/ui/SafeImage.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonGrid from '@/components/ui/SkeletonGrid.vue'
import FilterBar from '@/components/FilterBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import { CARD_BY_RESOURCE } from '@/components/cards'
import { fetchPage } from '@/api/rickmorty'
import { RESOURCES } from '@/config/resources'
import { useEditsStore } from '@/stores/edits'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  resource: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()
const edits = useEditsStore()

const schema = computed(() => RESOURCES[props.resource])
const Card = computed(() => CARD_BY_RESOURCE[props.resource])

const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const filters = computed(() => {
  const out = {}
  for (const f of schema.value.filters) if (route.query[f.key]) out[f.key] = String(route.query[f.key])
  return out
})

const state = reactive({ loading: true, error: null, info: null, results: [] })
let reqId = 0

async function load() {
  const id = ++reqId
  state.loading = true
  state.error = null
  try {
    const data = await fetchPage(props.resource, page.value, filters.value)
    if (id !== reqId) return
    state.info = data.info
    state.results = data.results
  } catch (e) {
    if (id === reqId) state.error = e.message
  } finally {
    if (id === reqId) state.loading = false
  }
}

watch(() => JSON.stringify([props.resource, page.value, filters.value]), load, { immediate: true })

/** Always render merged data (remote + local overrides). */
const items = computed(() => state.results.map((r) => edits.apply(props.resource, r)))
const localOnPage = computed(() => items.value.filter((i) => i._source === 'local').length)

/** Items whose locally-edited name matches the search, but the API doesn't know about. */
const localMatches = computed(() => {
  const q = filters.value.name?.toLowerCase()
  if (!q) return []
  const onPage = new Set(state.results.map((r) => r.id))
  return edits.list.filter(
    (r) =>
      r.resource === props.resource &&
      !onPage.has(r.id) &&
      String(r.fields.name ?? '').toLowerCase().includes(q),
  )
})

function setFilters(next) {
  const query = {}
  for (const [k, v] of Object.entries(next)) if (v) query[k] = v
  router.push({ query })
}

function setPage(p) {
  router.push({ query: { ...route.query, page: p } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onKey(e) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return
  if (!state.info) return
  if (e.key === 'ArrowRight' && page.value < state.info.pages) setPage(page.value + 1)
  if (e.key === 'ArrowLeft' && page.value > 1) setPage(page.value - 1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="w-full max-w-[1360px] mx-auto pt-8 px-4 sm:px-6 lg:px-10 pb-20">
    <header class="flex justify-between items-end gap-6 flex-wrap mb-7">
      <div>
        <p class="font-mono text-xs tracking-[0.14em] uppercase text-portal">{{ schema.label }}</p>
        <h1 class="flex items-center gap-3.5 text-3xl sm:text-4xl md:text-5xl font-bold my-2">
          <AppIcon :name="schema.icon" :size="34" class="text-portal drop-shadow-[0_0_14px_rgba(151,206,76,0.6)]" />
          {{ schema.label }}
        </h1>
        <p class="text-text-dim max-w-[520px]">{{ schema.tagline }}</p>
      </div>
      <div class="flex gap-3">
        <div class="flex flex-col py-3 px-4.5 rounded-2xl border border-white/10 bg-surface min-w-[110px]">
          <strong class="font-display font-normal text-[28px] text-portal-glow leading-tight">
            {{ state.info ? formatNumber(state.info.count) : '—' }}
          </strong>
          <span class="text-xs text-text-mute uppercase tracking-wider">
            {{ Object.keys(filters).length ? 'resultados' : 'no total' }}
          </span>
        </div>
        <div class="flex flex-col py-3 px-4.5 rounded-2xl border border-white/10 bg-surface min-w-[110px]">
          <strong class="font-display font-normal text-[28px] text-local leading-tight">
            {{ edits.countBy[resource] }}
          </strong>
          <span class="text-xs text-text-mute uppercase tracking-wider">editados</span>
        </div>
      </div>
    </header>

    <section class="max-[700px]:static sticky top-3 z-20 p-3 rounded-[18px] mb-4 glass shadow-2xl">
      <FilterBar :resource="resource" :model-value="filters" @update:model-value="setFilters" />
    </section>

    <div v-if="localMatches.length" class="flex items-center flex-wrap gap-2 p-3 sm:px-3.5 mb-4 rounded-2xl border border-dashed border-local-border bg-local-bg">
      <span class="inline-flex items-center gap-1.5 text-[13px] text-local font-semibold mr-1.5">
        <AppIcon name="database" :size="14" /> Correspondências locais
      </span>
      <RouterLink
        v-for="m in localMatches"
        :key="m.id"
        :to="`/${schema.route}/${m.id}`"
        class="inline-flex items-center gap-2 py-1 pr-2 pl-1 rounded-full bg-[#05080d]/60 border border-local-border text-[13px] transition-transform duration-200 hover:-translate-y-0.5"
        title="Encontrado pelo nome editado localmente"
      >
        <span class="w-6 h-6 rounded-full overflow-hidden shrink-0">
          <SafeImage v-if="resource === 'character'" :src="m.fields.image ?? m.image" :alt="m.fields.name" :seed="m.id" />
          <span v-else class="grid place-items-center w-full h-full text-xs">
            <AppIcon :name="schema.icon" :size="14" />
          </span>
        </span>
        <span>{{ m.fields.name }}</span>
        <SourceBadge source="local" compact />
      </RouterLink>
    </div>

    <div v-if="state.info && !state.loading" class="flex items-center gap-4.5 flex-wrap my-1 mx-1 mb-4.5 text-sm text-text-dim">
      <span>
        Página <strong class="text-text-main font-semibold">{{ page }}</strong> de <strong class="text-text-main font-semibold">{{ state.info.pages || 1 }}</strong>
        <span class="text-text-mute"> · {{ items.length }} itens</span>
      </span>
      <span v-if="localOnPage" class="inline-flex items-center gap-2 text-local">
        <SourceBadge source="local" compact /> {{ localOnPage }} editado{{ localOnPage > 1 ? 's' : '' }} nesta página
      </span>
      <span class="max-[700px]:hidden ml-auto text-xs text-text-mute"><kbd>←</kbd> <kbd>→</kbd> trocar página</span>
    </div>

    <SkeletonGrid v-if="state.loading" :variant="resource" :count="12" />

    <EmptyState
      v-else-if="state.error"
      icon="⚠️"
      title="O portal falhou"
      :message="state.error"
    >
      <button class="btn btn-primary" @click="load">Tentar novamente</button>
    </EmptyState>

    <EmptyState
      v-else-if="!items.length"
      icon="🛸"
      title="Nada nesta dimensão"
      message="Nenhum resultado para esses filtros. Tente outra combinação ou limpe a busca."
    >
      <button class="btn" @click="setFilters({})">Limpar filtros</button>
    </EmptyState>

    <div
      v-else
      class="grid gap-5"
      :class="resource === 'location' || resource === 'episode'
        ? 'grid-cols-[repeat(auto-fill,minmax(260px,1fr))]'
        : 'grid-cols-[repeat(auto-fill,minmax(230px,1fr))]'"
    >
      <component :is="Card" v-for="(item, i) in items" :key="item.id" :item="item" :index="i" />
    </div>

    <div v-if="state.info && !state.error" class="mt-8">
      <AppPagination :page="page" :pages="state.info.pages" @update:page="setPage" />
    </div>
  </div>
</template>
