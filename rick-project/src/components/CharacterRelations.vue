<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import SourceBadge from './SourceBadge.vue'
import { fetchAll, fetchMany, idFromUrl } from '@/api/rickmorty'
import { parseEpisodeCode, SEASON_COLORS, t } from '@/config/resources'
import { useEditsStore } from '@/stores/edits'
import { formatDate } from '@/utils/format'

const props = defineProps({
  character: { type: Object, required: true },
})

const edits = useEditsStore()
const places = ref([])
const allEpisodes = ref([])
const loading = ref(true)

watch(
  () => props.character.id,
  async () => {
    loading.value = true
    const ids = [idFromUrl(props.character.origin?.url), idFromUrl(props.character.location?.url)]
    try {
      const [locs, eps] = await Promise.all([fetchMany('location', ids), fetchAll('episode')])
      places.value = locs
      allEpisodes.value = eps
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

function place(link) {
  const id = idFromUrl(link?.url)
  const found = places.value.find((p) => p.id === id)
  return found ? edits.apply('location', found) : null
}
const origin = computed(() => place(props.character.origin))
const current = computed(() => place(props.character.location))

const appearsIn = computed(() => new Set((props.character.episode ?? []).map(idFromUrl)))

const seasons = computed(() => {
  const map = new Map()
  for (const raw of allEpisodes.value) {
    const ep = edits.apply('episode', raw)
    const { season, number } = parseEpisodeCode(raw.episode)
    if (!map.has(season)) map.set(season, [])
    map.get(season).push({ ...ep, num: number, present: appearsIn.value.has(raw.id) })
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([season, eps]) => ({
      season,
      color: SEASON_COLORS[(season - 1) % 5],
      eps,
      present: eps.filter((e) => e.present).length,
    }))
})

const maxEps = computed(() => Math.max(1, ...seasons.value.map((s) => s.eps.length)))

const appearances = computed(() => seasons.value.flatMap((s) => s.eps.filter((e) => e.present).map((e) => ({ ...e, color: s.color }))))
const coverage = computed(() =>
  allEpisodes.value.length ? Math.round((appearsIn.value.size / allEpisodes.value.length) * 100) : 0,
)
</script>

<template>
  <section class="section">
    <div class="section-head">
      <h2 class="section-title"><AppIcon name="orbit" :size="20" /> Rota interdimensional</h2>
    </div>
    <div class="route">
      <component
        :is="origin ? 'RouterLink' : 'div'"
        :to="origin ? `/locations/${origin.id}` : undefined"
        class="place"
        :class="{ link: origin, 'is-local': origin?._source === 'local' }"
      >
        <span class="place-portal-ico"><AppIcon name="orbit" :size="24" /></span>
        <span class="place-info">
          <small>Origem</small>
          <strong>{{ t(origin?.name ?? character.origin?.name) }}</strong>
          <span v-if="origin" class="text-dim">{{ t(origin.type) }} · {{ t(origin.dimension) }}</span>
        </span>
        <SourceBadge v-if="origin" :source="origin._source" compact />
      </component>

      <div class="path"><span /><AppIcon name="zap" :size="16" /></div>

      <component
        :is="current ? 'RouterLink' : 'div'"
        :to="current ? `/locations/${current.id}` : undefined"
        class="place"
        :class="{ link: current, 'is-local': current?._source === 'local' }"
      >
        <span class="place-portal-ico"><AppIcon name="orbit" :size="24" /></span>
        <span class="place-info">
          <small>Última localização</small>
          <strong>{{ t(current?.name ?? character.location?.name) }}</strong>
          <span v-if="current" class="text-dim">{{ t(current.type) }} · {{ t(current.dimension) }}</span>
        </span>
        <SourceBadge v-if="current" :source="current._source" compact />
      </component>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <div>
        <h2 class="section-title"><AppIcon name="tv" :size="20" /> Mapa de aparições</h2>
        <p class="section-sub">
          Presente em <strong>{{ appearsIn.size }}</strong> de {{ allEpisodes.length || '…' }} episódios
          <span class="coverage">({{ coverage }}% da série)</span>
        </p>
      </div>
    </div>

    <div v-if="loading" class="skeleton heat-sk" />
    <div v-else class="heatmap glass" :style="{ '--cols': maxEps }">
      <div v-for="s in seasons" :key="s.season" class="season-row" :style="{ '--c': s.color }">
        <span class="season-label mono">T{{ s.season }}</span>
        <div class="cells">
          <RouterLink
            v-for="e in s.eps"
            :key="e.id"
            :to="`/episodes/${e.id}`"
            class="cell mono"
            :class="{ on: e.present }"
            :title="`${e.episode} · ${e.name}${e.present ? '' : ' (ausente)'}`"
          >
            {{ e.num }}
          </RouterLink>
        </div>
        <span class="season-count mono">{{ s.present }}/{{ s.eps.length }}</span>
      </div>
    </div>

    <ol v-if="!loading" class="ep-list">
      <li v-for="e in appearances" :key="e.id">
        <RouterLink :to="`/episodes/${e.id}`" class="ep-row" :style="{ '--c': e.color }">
          <span class="ep-code mono" :class="{ 'field-local': e._edited.includes('episode') }">{{ e.episode }}</span>
          <span class="ep-name" :class="{ 'field-local': e._edited.includes('name') }">{{ e.name }}</span>
          <span class="ep-date text-mute">{{ formatDate(e.air_date) }}</span>
          <SourceBadge :source="e._source" compact />
        </RouterLink>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.route {
  display: grid;
  grid-template-columns: 1fr 80px 1fr;
  align-items: center;
  gap: 8px;
}
.place {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid var(--border-2);
  background: var(--surface);
  transition: all 0.3s var(--ease);
}
.place.link:hover {
  border-color: var(--border-strong);
  transform: translateY(-2px);
}
.place.is-local {
  border-color: var(--local-border);
}
.place-portal-ico {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(151, 206, 76, 0.08);
  border: 1px solid rgba(151, 206, 76, 0.3);
  color: var(--portal);
  box-shadow: 0 0 16px rgba(151, 206, 76, 0.15);
  flex-shrink: 0;
  transition: all 0.3s var(--ease);
}
.place:hover .place-portal-ico {
  color: var(--portal-glow);
  border-color: var(--portal-glow);
  box-shadow: 0 0 20px rgba(151, 206, 76, 0.4);
  transform: rotate(30deg);
}
.place-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.place-info small {
  font-family: var(--mono);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--portal);
}
.place-info strong {
  font-size: 16px;
}
.place-info .text-dim {
  font-size: 13px;
}
.path {
  position: relative;
  display: grid;
  place-items: center;
  color: var(--portal-glow);
}
.path span {
  position: absolute;
  inset: 50% 0 auto;
  height: 2px;
  background: repeating-linear-gradient(90deg, var(--portal) 0 6px, transparent 6px 12px);
  background-size: 24px 2px;
  animation: flow 1s linear infinite;
}
.path :deep(svg) {
  position: relative;
  background: var(--bg);
  border-radius: 50%;
  padding: 2px;
  filter: drop-shadow(0 0 8px var(--portal));
}
@keyframes flow {
  to {
    background-position: 24px 0;
  }
}
.coverage {
  color: var(--portal);
}
.heat-sk {
  height: 200px;
  border-radius: 18px;
}
.heatmap {
  padding: 18px;
  border-radius: 18px;
  display: grid;
  gap: 10px;
}
.season-row {
  display: grid;
  grid-template-columns: 34px 1fr 50px;
  align-items: center;
  gap: 12px;
}
.season-label {
  font-size: 12px;
  color: var(--c);
  font-weight: 600;
}
.season-count {
  font-size: 12px;
  color: var(--text-mute);
  text-align: right;
}
.cells {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  gap: 6px;
}
.cell {
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  font-size: 11px;
  color: var(--text-mute);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: transform 0.2s var(--ease), border-color 0.2s;
}
.cell.on {
  background: var(--c);
  color: #05080d;
  font-weight: 700;
  border-color: transparent;
  box-shadow: 0 0 12px -2px var(--c);
}
.cell:hover {
  transform: translateY(-2px);
  border-color: var(--c);
  z-index: 1;
}
@media (max-width: 640px) {
  .cell {
    height: 24px;
    font-size: 9px;
  }
}
.ep-list {
  list-style: none;
  padding: 0;
  margin: 16px 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 8px;
}
.ep-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-2);
  border-left: 3px solid var(--c);
  background: rgba(255, 255, 255, 0.02);
  font-size: 14px;
  transition: background 0.2s;
}
.ep-row:hover {
  background: rgba(255, 255, 255, 0.05);
}
.ep-code {
  font-size: 12px;
  color: var(--c);
}
.ep-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ep-date {
  font-size: 12px;
}
@media (max-width: 760px) {
  .route {
    grid-template-columns: 1fr;
  }
  .path {
    height: 30px;
  }
  .path span {
    inset: 0 50% 0 auto;
    width: 2px;
    height: auto;
  }
}
</style>
