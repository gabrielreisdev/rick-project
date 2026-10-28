<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import SourceBadge from '@/components/SourceBadge.vue'
import SafeImage from '@/components/SafeImage.vue'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonGrid from '@/components/SkeletonGrid.vue'
import FilterBar from '@/components/FilterBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import CharacterCard from '@/components/CharacterCard.vue'
import LocationCard from '@/components/LocationCard.vue'
import EpisodeCard from '@/components/EpisodeCard.vue'
import { fetchMany, fetchPage } from '@/api/rickmorty'
import { RESOURCES } from '@/config/resources'
import { useEditsStore } from '@/stores/edits'
import { useFavoritesStore } from '@/stores/favorites'
import { formatNumber } from '@/utils/format'

const props = defineProps({
  resource: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()
const edits = useEditsStore()
const favorites = useFavoritesStore()

const cardComponents = {
  character: CharacterCard,
  location: LocationCard,
  episode: EpisodeCard,
}

const schema = computed(() => RESOURCES[props.resource])
const Card = computed(() => cardComponents[props.resource])

const onlyEdited = computed(() => route.query.edited === 'true')

const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const filters = computed(() => {
  const out = {}
  for (const f of schema.value.filters) if (route.query[f.key]) out[f.key] = String(route.query[f.key])
  return out
})

const state = reactive({ loading: true, error: null, info: null, results: [] })
let reqId = 0

async function load() {
  if (onlyEdited.value) return
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

watch(
  () => JSON.stringify([props.resource, page.value, filters.value, onlyEdited.value]),
  () => {
    if (!onlyEdited.value) load()
  },
  { immediate: true },
)

const editedRecords = computed(() => edits.list.filter((r) => r.resource === props.resource))
const editedRemoteData = ref([])
const editedLoading = ref(false)

async function loadEditedRemote() {
  const ids = editedRecords.value.map((r) => r.id)
  if (!ids.length) {
    editedRemoteData.value = []
    return
  }
  editedLoading.value = true
  try {
    const data = await fetchMany(props.resource, ids)
    editedRemoteData.value = data
  } catch (e) {
    void e
  } finally {
    editedLoading.value = false
  }
}

watch(
  () => [props.resource, onlyEdited.value, editedRecords.value.map((r) => r.id).join(',')],
  () => {
    if (onlyEdited.value) {
      loadEditedRemote()
    }
  },
  { immediate: true },
)

const editedItems = computed(() => {
  const remoteMap = new Map(editedRemoteData.value.map((item) => [item.id, item]))
  return editedRecords.value.map((rec) => {
    const remote = remoteMap.get(rec.id)
    if (remote) {
      return edits.apply(props.resource, remote)
    }
    return {
      ...rec.base,
      ...rec.fields,
      id: rec.id,
      image: rec.fields.image ?? rec.image ?? rec.base?.image,
      _source: 'local',
      _edited: Object.keys(rec.fields),
      _original: rec.base,
      _updatedAt: rec.updatedAt,
    }
  })
})

const filteredEditedItems = computed(() => {
  let list = editedItems.value
  const nameQuery = filters.value.name?.toLowerCase()
  if (nameQuery) {
    list = list.filter((item) => String(item.name ?? '').toLowerCase().includes(nameQuery))
  }
  if (filters.value.status) {
    list = list.filter((item) => item.status === filters.value.status)
  }
  if (filters.value.gender) {
    list = list.filter((item) => item.gender === filters.value.gender)
  }
  if (filters.value.species) {
    const sp = filters.value.species.toLowerCase()
    list = list.filter((item) => String(item.species ?? '').toLowerCase().includes(sp))
  }
  if (filters.value.type) {
    const tp = filters.value.type.toLowerCase()
    list = list.filter((item) => String(item.type ?? '').toLowerCase().includes(tp))
  }
  return list
})

const items = computed(() => {
  if (onlyEdited.value) {
    return filteredEditedItems.value
  }
  return state.results.map((r) => edits.apply(props.resource, r))
})

const localOnPage = computed(() => {
  if (onlyEdited.value) return items.value.length
  return items.value.filter((i) => i._source === 'local').length
})

const localMatches = computed(() => {
  if (onlyEdited.value) return []
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
  const query = { ...route.query }
  for (const f of schema.value.filters) {
    if (next[f.key]) query[f.key] = next[f.key]
    else delete query[f.key]
  }
  delete query.page
  router.push({ query })
}

function toggleOnlyEdited() {
  const query = { ...route.query }
  if (onlyEdited.value) {
    delete query.edited
  } else {
    query.edited = 'true'
  }
  delete query.page
  router.push({ query })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function setPage(p) {
  router.push({ query: { ...route.query, page: p } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onKey(e) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return
  if (!state.info || onlyEdited.value) return
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
        <button
          type="button"
          class="flex flex-col py-3 px-4.5 rounded-2xl border transition-all min-w-[110px] text-left"
          :class="!onlyEdited ? 'border-portal/40 bg-portal/[0.04]' : 'border-white/10 bg-surface cursor-pointer hover:border-white/20'"
          :title="onlyEdited ? 'Clique para voltar a todos os itens' : ''"
          @click="onlyEdited ? toggleOnlyEdited() : null"
        >
          <strong class="font-display font-normal text-[28px] text-portal-glow leading-tight">
            {{ state.info ? formatNumber(state.info.count) : '—' }}
          </strong>
          <span class="text-xs text-text-mute uppercase tracking-wider">
            {{ Object.keys(filters).length ? 'resultados' : 'no total' }}
          </span>
        </button>

        <button
          v-if="schema.editable"
          type="button"
          class="flex flex-col py-3 px-4.5 rounded-2xl border transition-all cursor-pointer min-w-[120px] text-left group"
          :class="onlyEdited
            ? 'border-local bg-local-bg shadow-[0_0_24px_rgba(215,123,255,0.35)] ring-1 ring-local'
            : 'border-white/10 bg-surface hover:border-local/50 hover:bg-local/[0.04]'"
          :title="onlyEdited ? 'Clique para ver todos os itens' : 'Clique para filtrar apenas os editados'"
          @click="toggleOnlyEdited"
        >
          <strong class="font-display font-normal text-[28px] text-local leading-tight flex items-center justify-between">
            {{ edits.countBy[resource] }}
            <AppIcon v-if="onlyEdited" name="check" :size="16" class="text-local" />
          </strong>
          <span class="text-xs uppercase tracking-wider flex items-center gap-1.5" :class="onlyEdited ? 'text-local font-semibold' : 'text-text-mute group-hover:text-local'">
            <span class="w-2 h-2 rounded-full" :class="onlyEdited ? 'bg-local' : 'bg-local/60'" />
            {{ onlyEdited ? 'Filtrando' : 'editados' }}
          </span>
        </button>

        <RouterLink
          to="/favorites"
          class="flex flex-col py-3 px-4.5 rounded-2xl border border-white/10 bg-surface hover:border-[#ff6fb5]/50 hover:bg-[#ff6fb5]/[0.04] transition-all cursor-pointer min-w-[110px] text-left group"
          title="Ver seus favoritos salvos"
        >
          <strong class="font-display font-normal text-[28px] text-[#ff8cc6] leading-tight flex items-center justify-between">
            {{ favorites.byResource[resource]?.length ?? 0 }}
            <AppIcon name="heart" :size="16" class="text-[#ff6fb5]" />
          </strong>
          <span class="text-xs uppercase tracking-wider text-text-mute group-hover:text-[#ff8cc6] flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-[#ff6fb5]/60" />
            favoritos
          </span>
        </RouterLink>
      </div>
    </header>

    <section class="max-[700px]:static sticky top-3 z-20 p-3 rounded-[18px] mb-4 glass shadow-2xl">
      <FilterBar :resource="resource" :model-value="filters" @update:model-value="setFilters" />
    </section>

    <div v-if="schema.editable && onlyEdited" class="flex items-center justify-between gap-3 p-3.5 mb-5 rounded-2xl border border-local-border bg-local-bg">
      <div class="flex items-center gap-2.5 text-sm text-local font-medium">
        <AppIcon name="database" :size="16" />
        <span>Exibindo <strong>{{ items.length }}</strong> {{ schema.singular.toLowerCase() }}{{ items.length === 1 ? '' : 's' }} com edições locais</span>
      </div>
      <button type="button" class="btn btn-sm btn-local" @click="toggleOnlyEdited">
        <AppIcon name="x" :size="14" /> Ver todos
      </button>
    </div>

    <div v-if="schema.editable && localMatches.length" class="flex items-center flex-wrap gap-2 p-3 sm:px-3.5 mb-4 rounded-2xl border border-dashed border-local-border bg-local-bg">
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

    <div v-if="!onlyEdited && state.info && !state.loading" class="flex items-center gap-4.5 flex-wrap my-1 mx-1 mb-4.5 text-sm text-text-dim">
      <span>
        Página <strong class="text-text-main font-semibold">{{ page }}</strong> de <strong class="text-text-main font-semibold">{{ state.info.pages || 1 }}</strong>
        <span class="text-text-mute"> · {{ items.length }} itens</span>
      </span>
      <button
        v-if="schema.editable && localOnPage"
        type="button"
        class="inline-flex items-center gap-1.5 text-local hover:underline cursor-pointer"
        title="Clique para filtrar apenas os editados"
        @click="toggleOnlyEdited"
      >
        <SourceBadge source="local" compact /> {{ localOnPage }} editado{{ localOnPage > 1 ? 's' : '' }} nesta página
      </button>
      <span class="max-[700px]:hidden ml-auto text-xs text-text-mute"><kbd>←</kbd> <kbd>→</kbd> trocar página</span>
    </div>

    <SkeletonGrid v-if="onlyEdited ? (editedLoading && !items.length) : state.loading" :variant="resource" :count="12" />

    <EmptyState
      v-else-if="onlyEdited && !items.length"
      icon="📝"
      :title="`Nenhum ${schema.singular.toLowerCase()} editado encontrado`"
      :message="Object.keys(filters).length ? 'Nenhuma edição local corresponde aos filtros buscados.' : `Você ainda não fez alterações em nenhum ${schema.singular.toLowerCase()}. Abra qualquer card e edite os campos para personalizá-lo!`"
    >
      <button class="btn btn-primary" @click="toggleOnlyEdited">Ver todos os {{ schema.label.toLowerCase() }}</button>
    </EmptyState>

    <EmptyState
      v-else-if="!onlyEdited && state.error"
      icon="⚠️"
      title="O portal falhou"
      :message="state.error"
    >
      <button class="btn btn-primary" @click="load">Tentar novamente</button>
    </EmptyState>

    <EmptyState
      v-else-if="!onlyEdited && !items.length"
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

    <div v-if="!onlyEdited && state.info && !state.error" class="mt-8">
      <AppPagination :page="page" :pages="state.info.pages" @update:page="setPage" />
    </div>
  </div>
</template>
