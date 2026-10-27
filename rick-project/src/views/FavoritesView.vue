<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import SkeletonGrid from '@/components/SkeletonGrid.vue'
import CharacterCard from '@/components/CharacterCard.vue'
import LocationCard from '@/components/LocationCard.vue'
import EpisodeCard from '@/components/EpisodeCard.vue'
import { fetchMany } from '@/api/rickmorty'
import { useFavoritesStore } from '@/stores/favorites'
import { useEditsStore } from '@/stores/edits'

const favorites = useFavoritesStore()
const edits = useEditsStore()

const currentTab = ref('all')
const loading = ref(false)

const characters = ref([])
const locations = ref([])
const episodes = ref([])

async function loadData(silent = false) {
  if (!silent) loading.value = true
  try {
    const { character, location, episode } = favorites.byResource
    const results = await Promise.allSettled([
      character?.length ? fetchMany('character', character) : Promise.resolve([]),
      location?.length ? fetchMany('location', location) : Promise.resolve([]),
      episode?.length ? fetchMany('episode', episode) : Promise.resolve([]),
    ])

    const cData = results[0].status === 'fulfilled' ? results[0].value : []
    const lData = results[1].status === 'fulfilled' ? results[1].value : []
    const eData = results[2].status === 'fulfilled' ? results[2].value : []

    characters.value = cData.filter(Boolean).map((item) => edits.apply('character', item))
    locations.value = lData.filter(Boolean).map((item) => edits.apply('location', item))
    episodes.value = eData.filter(Boolean).map((item) => edits.apply('episode', item))
  } catch (err) {
    console.error('Falha ao carregar favoritos:', err)
  } finally {
    if (!silent) loading.value = false
  }
}

watch(
  () => favorites.items.length,
  () => {
    loadData(true)
  },
)

onMounted(() => {
  loadData()
})

const tabs = computed(() => [
  { key: 'all', label: 'Todos', count: favorites.count },
  { key: 'character', label: 'Personagens', count: favorites.byResource.character.length },
  { key: 'location', label: 'Locais', count: favorites.byResource.location.length },
  { key: 'episode', label: 'Episódios', count: favorites.byResource.episode.length },
])

const emptyTabInfo = computed(() => {
  if (currentTab.value === 'character') return { label: 'Personagens', link: '/characters' }
  if (currentTab.value === 'location') return { label: 'Locais', link: '/locations' }
  if (currentTab.value === 'episode') return { label: 'Episódios', link: '/episodes' }
  return null
})
</script>

<template>
  <div class="container">
    <header class="fav-header">
      <div>
        <p class="eyebrow">Arquivo pessoal</p>
        <h1>
          <AppIcon name="heart" :size="32" class="fav-icon" />
          Seus Favoritos
        </h1>
        <p class="tagline">Coleção salva de seres, dimensões e momentos do multiverso.</p>
      </div>

      <div class="tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="tab-btn"
          :class="{ active: currentTab === t.key }"
          @click="currentTab = t.key"
        >
          {{ t.label }}
          <span class="tab-count mono">{{ t.count }}</span>
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <SkeletonGrid :count="6" />
    </div>

    <div v-else-if="favorites.count === 0" class="empty-wrap">
      <EmptyState
        icon="💔"
        title="Nenhum favorito salvo"
        message="Você ainda não favoritou nada. Navegue pelos cards e clique no ícone de coração para guardar aqui."
      >
        <RouterLink to="/characters" class="btn btn-primary">
          <AppIcon name="search" :size="16" /> Explorar Personagens
        </RouterLink>
      </EmptyState>
    </div>

    <div v-else-if="emptyTabInfo && tabs.find((t) => t.key === currentTab)?.count === 0" class="empty-wrap">
      <EmptyState
        icon="💔"
        :title="`Nenhum ${emptyTabInfo.label.toLowerCase()} favorito`"
        :message="`Você ainda não adicionou nenhum ${emptyTabInfo.label.toLowerCase()} aos favoritos. Explore a lista e clique no coração para adicionar.`"
      >
        <RouterLink :to="emptyTabInfo.link" class="btn btn-primary">
          <AppIcon name="search" :size="16" /> Explorar {{ emptyTabInfo.label }}
        </RouterLink>
      </EmptyState>
    </div>

    <div v-else class="fav-content">
      <section v-if="(currentTab === 'all' || currentTab === 'character') && characters.length" class="section">
        <div class="section-head">
          <h2 class="section-title">
            <AppIcon name="users" :size="20" /> Personagens ({{ characters.length }})
          </h2>
        </div>
        <div class="grid-cards">
          <CharacterCard
            v-for="(c, i) in characters"
            :key="c.id"
            :item="c"
            :index="i"
          />
        </div>
      </section>

      <section v-if="(currentTab === 'all' || currentTab === 'location') && locations.length" class="section">
        <div class="section-head">
          <h2 class="section-title">
            <AppIcon name="globe" :size="20" /> Locais ({{ locations.length }})
          </h2>
        </div>
        <div class="grid-cards grid-location">
          <LocationCard
            v-for="(loc, i) in locations"
            :key="loc.id"
            :item="loc"
            :index="i"
          />
        </div>
      </section>

      <section v-if="(currentTab === 'all' || currentTab === 'episode') && episodes.length" class="section">
        <div class="section-head">
          <h2 class="section-title">
            <AppIcon name="tv" :size="20" /> Episódios ({{ episodes.length }})
          </h2>
        </div>
        <div class="grid-cards grid-episode">
          <EpisodeCard
            v-for="(ep, i) in episodes"
            :key="ep.id"
            :item="ep"
            :index="i"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.fav-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}
h1 {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: clamp(32px, 5vw, 44px);
  font-weight: 700;
  margin: 8px 0;
}
.fav-icon {
  color: #ff6fb5;
  filter: drop-shadow(0 0 16px rgba(255, 111, 181, 0.6));
}
.tagline {
  color: var(--text-dim);
}

.tabs {
  display: flex;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--border-2);
  padding: 6px;
  border-radius: 14px;
  backdrop-filter: blur(12px);
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 0;
  background: transparent;
  color: var(--text-dim);
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.04);
}
.tab-btn.active {
  background: var(--surface-2);
  color: var(--text);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}
.tab-count {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}
.tab-btn.active .tab-count {
  background: rgba(255, 111, 181, 0.2);
  color: #ff6fb5;
}

.grid-location,
.grid-episode {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.empty-wrap {
  margin-top: 40px;
}
</style>
