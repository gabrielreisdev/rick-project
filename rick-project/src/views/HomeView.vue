<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import SafeImage from '@/components/ui/SafeImage.vue'
import SourceBadge from '@/components/ui/SourceBadge.vue'
import CharacterCard from '@/components/cards/CharacterCard.vue'
import SkeletonGrid from '@/components/ui/SkeletonGrid.vue'
import { fetchAll, fetchCount, fetchMany, fetchOne } from '@/api/rickmorty'
import { RESOURCES, SEASON_COLORS, parseEpisodeCode, t } from '@/config/resources'
import { useEditsStore } from '@/stores/edits'
// import { useFavoritesStore } from '@/stores/favorites'
import { formatDate, formatNumber, timeAgo } from '@/utils/format'

const router = useRouter()
const edits = useEditsStore()
// const favorites = useFavoritesStore()

const counts = ref({ character: null, location: null, episode: null })
const featuredRaw = ref(null)
const portalSpinning = ref(false)
const encountersRaw = ref([])
const encountersLoading = ref(true)
const episodes = ref([])

const featured = computed(() => edits.apply('character', featuredRaw.value))
const encounters = computed(() => encountersRaw.value.map((c) => edits.apply('character', c)))

const randomId = (max) => Math.floor(Math.random() * max) + 1

async function spinPortal() {
  if (!counts.value.character) return
  portalSpinning.value = true
  const [c] = await Promise.all([
    fetchOne('character', randomId(counts.value.character)),
    new Promise((r) => setTimeout(r, 650)),
  ])
  featuredRaw.value = c
  portalSpinning.value = false
}

async function loadEncounters() {
  if (!counts.value.character) return
  encountersLoading.value = true
  const ids = new Set()
  while (ids.size < 8) ids.add(randomId(counts.value.character))
  encountersRaw.value = await fetchMany('character', [...ids])
  encountersLoading.value = false
}

function randomJump() {
  if (counts.value.character) router.push(`/characters/${randomId(counts.value.character)}`)
}

onMounted(async () => {
  const [c, l, e] = await Promise.all(['character', 'location', 'episode'].map(fetchCount))
  counts.value = { character: c, location: l, episode: e }
  spinPortal()
  loadEncounters()
  episodes.value = await fetchAll('episode')
})

const seasons = computed(() => {
  const map = new Map()
  for (const ep of episodes.value) {
    const { season } = parseEpisodeCode(ep.episode)
    if (!map.has(season)) map.set(season, [])
    map.get(season).push(ep)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([season, eps]) => ({
      season,
      count: eps.length,
      code: `S${String(season).padStart(2, '0')}`,
      color: SEASON_COLORS[(season - 1) % 5],
      from: formatDate(eps[0].air_date),
      to: formatDate(eps[eps.length - 1].air_date),
      cast: new Set(eps.flatMap((x) => x.characters)).size,
    }))
})

const stats = computed(() => [
  { label: 'Personagens', value: counts.value.character, icon: 'users', to: '/characters' },
  { label: 'Locais', value: counts.value.location, icon: 'globe', to: '/locations' },
  { label: 'Episódios', value: counts.value.episode, icon: 'tv', to: '/episodes' },
  // Temporariamente comentados:
  // { label: 'Edições locais', value: edits.count, icon: 'database', to: '/lab', local: true },
  // { label: 'Favoritos', value: favorites.count, icon: 'heart', to: '/favorites', fav: true },
])

const recent = computed(() => edits.activity.slice(0, 6))
const ACTIVITY_LABEL = { edit: 'editou', revert: 'restaurou', clear: 'limpou', import: 'importou' }
const activityLink = (a) => (a.resource ? `/${RESOURCES[a.resource].route}/${a.id}` : '/')
</script>

<template>
  <div class="container">
    <!-- HERO -->
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Wubba lubba dub dub · Dimensão C-137</p>
        <h1>
          Explore o <span class="grad">multiverso</span><br />
          de Rick &amp; Morty
        </h1>
        <p class="lead">
          Navegue por todos os personagens, locais e episódios da série. Edite qualquer dado, mantenha suas versões
          locais e sempre saiba o que veio da API e o que foi alterado por você.
        </p>
        <div class="cta">
          <RouterLink to="/characters" class="btn btn-primary" id="cta-explore">
            <AppIcon name="users" :size="16" /> Explorar personagens
          </RouterLink>
          <button id="cta-random" class="btn" @click="randomJump">
            <AppIcon name="shuffle" :size="16" /> Personagem aleatório
          </button>
        </div>
      </div>

      <div class="portal-wrap">
        <button
          id="portal"
          class="portal"
          :class="{ spinning: portalSpinning }"
          title="Clique para abrir outro portal"
          @click="spinPortal"
        >
          <span class="swirl" />
          <span class="swirl s2" />
          <span class="core">
            <Transition name="pop" mode="out-in">
              <SafeImage
                v-if="featured && !portalSpinning"
                :key="featured.id"
                :src="featured.image"
                :alt="featured.name"
                :seed="featured.id"
              />
            </Transition>
          </span>
        </button>
        <Transition name="fade" mode="out-in">
          <RouterLink
            v-if="featured && !portalSpinning"
            :key="featured.id"
            :to="`/characters/${featured.id}`"
            class="featured-card glass"
          >
            <span class="fc-top">
              <span class="mono text-mute">#{{ featured.id }}</span>
              <SourceBadge :source="featured._source" compact />
            </span>
            <strong :class="{ 'field-local': featured._edited.includes('name') }">{{ featured.name }}</strong>
            <small>{{ t(featured.status) }} · {{ t(featured.species) }}</small>
          </RouterLink>
        </Transition>
        <p class="portal-hint text-mute"><AppIcon name="sparkles" :size="13" /> clique no portal</p>
      </div>
    </section>

    <!-- STATS -->
    <section class="stats">
      <RouterLink
        v-for="s in stats"
        :key="s.label"
        :to="s.to"
        class="stat"
        :class="{ local: s.local, fav: s.fav }"
      >
        <span class="stat-icon"><AppIcon :name="s.icon" :size="18" /></span>
        <strong>{{ s.value == null ? '…' : formatNumber(s.value) }}</strong>
        <span>{{ s.label }}</span>
      </RouterLink>
    </section>

    <!-- ENCOUNTERS -->
    <section class="section">
      <div class="section-head">
        <div>
          <h2 class="section-title"><AppIcon name="orbit" :size="20" /> Encontros interdimensionais</h2>
          <p class="section-sub">8 personagens sorteados de {{ formatNumber(counts.character) }} possibilidades.</p>
        </div>
        <button id="reroll" class="btn" :disabled="encountersLoading" @click="loadEncounters">
          <AppIcon name="shuffle" :size="15" /> Sortear de novo
        </button>
      </div>
      <SkeletonGrid v-if="encountersLoading" :count="8" />
      <div v-else class="grid-cards">
        <CharacterCard v-for="(c, i) in encounters" :key="c.id" :item="c" :index="i" />
      </div>
    </section>

    <!-- SEASONS -->
    <section class="section">
      <div class="section-head">
        <div>
          <h2 class="section-title"><AppIcon name="tv" :size="20" /> Temporadas</h2>
          <p class="section-sub">Linha do tempo da série a partir dos episódios da API.</p>
        </div>
      </div>
      <div class="seasons">
        <RouterLink
          v-for="s in seasons"
          :key="s.season"
          :to="{ path: '/episodes', query: { episode: s.code } }"
          class="season"
          :style="{ '--c': s.color }"
        >
          <span class="season-num">{{ s.season }}</span>
          <span class="season-info">
            <strong>Temporada {{ s.season }}</strong>
            <small>{{ s.from }} → {{ s.to }}</small>
            <span class="season-tags">
              <span class="tag">{{ s.count }} episódios</span>
              <span class="tag">{{ s.cast }} personagens</span>
            </span>
          </span>
        </RouterLink>
        <template v-if="!seasons.length">
          <div v-for="n in 5" :key="n" class="skeleton season-sk" />
        </template>
      </div>
    </section>

    <!-- ACTIVITY -->
    <section v-if="recent.length" class="section">
      <div class="section-head">
        <div>
          <h2 class="section-title"><AppIcon name="flask" :size="20" /> Atividade recente</h2>
          <p class="section-sub">Suas últimas alterações locais.</p>
        </div>
        <!-- <RouterLink to="/lab" class="btn btn-sm">Abrir laboratório <AppIcon name="arrow-right" :size="14" /></RouterLink> -->
      </div>
      <ul class="activity">
        <li v-for="(a, i) in recent" :key="i">
          <RouterLink :to="activityLink(a)" class="act-row">
            <span class="act-dot" :class="a.type" />
            <span>
              Você <strong>{{ ACTIVITY_LABEL[a.type] }}&nbsp;</strong>
              <template v-if="a.fields?.length">{{ a.fields.length }} campo(s) de&nbsp;</template>
              <em>{{ a.name }}</em>
            </span>
            <span class="text-mute when">{{ timeAgo(a.at) }}</span>
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 40px;
  align-items: center;
  min-height: 480px;
  padding: 24px 0 8px;
}
h1 {
  font-size: clamp(40px, 6vw, 72px);
  font-weight: 700;
  letter-spacing: -0.035em;
  margin: 16px 0 20px;
}
.grad {
  font-family: var(--display);
  font-weight: 400;
  background: linear-gradient(100deg, var(--portal-glow), var(--cyan) 55%, var(--local));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 30px rgba(151, 206, 76, 0.3));
}
.lead {
  font-size: 17px;
  color: var(--text-dim);
  max-width: 540px;
}
.cta {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  flex-wrap: wrap;
}
.cta .btn {
  height: 48px;
  padding: 0 22px;
  font-size: 15px;
}

/* portal */
.portal-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.portal {
  position: relative;
  width: min(380px, 80vw);
  aspect-ratio: 1;
  border: 0;
  padding: 0;
  background: none;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.swirl {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle, transparent 38%, rgba(184, 255, 92, 0.9) 42%, transparent 62%),
    conic-gradient(from 0deg, #d8ff9e, var(--portal-deep), var(--portal), #f2ffd9, var(--portal-deep), var(--portal-glow), #d8ff9e);
  filter: blur(14px);
  animation: spin 7s linear infinite;
  opacity: 0.9;
}
.swirl.s2 {
  inset: 8%;
  filter: blur(6px);
  animation-duration: 4s;
  animation-direction: reverse;
  opacity: 0.7;
  mix-blend-mode: screen;
}
.portal.spinning .swirl {
  animation-duration: 0.6s;
}
.portal.spinning .swirl.s2 {
  animation-duration: 0.4s;
}
.portal:hover .swirl {
  animation-duration: 3s;
}
.core {
  position: relative;
  width: 62%;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(circle, #1a2f0c, #050805);
  box-shadow:
    0 0 0 6px rgba(5, 8, 13, 0.8),
    0 0 60px rgba(151, 206, 76, 0.6),
    inset 0 0 40px rgba(0, 0, 0, 0.7);
}
.featured-card {
  position: absolute;
  bottom: 6%;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 16px;
  border-radius: 16px;
  min-width: 200px;
  box-shadow: var(--shadow);
  transition: transform 0.3s var(--ease);
}
.featured-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-strong);
}
.fc-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}
.featured-card strong {
  font-size: 17px;
}
.featured-card small {
  color: var(--text-dim);
}
.portal-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  font-size: 12px;
  font-family: var(--mono);
}

/* stats */
.stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-top: 32px;
}
.stat {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid var(--border-2);
  background: var(--surface);
  backdrop-filter: blur(12px);
  overflow: hidden;
  transition: all 0.3s var(--ease);
  --c: var(--portal);
}
.stat.local {
  --c: var(--local);
}
.stat.fav {
  --c: #ff6fb5;
}
.stat::after {
  content: '';
  position: absolute;
  width: 120px;
  height: 120px;
  right: -40px;
  top: -40px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--c) 30%, transparent), transparent 70%);
  transition: transform 0.4s var(--ease);
}
.stat:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--c) 45%, transparent);
}
.stat:hover::after {
  transform: scale(1.5);
}
.stat-icon {
  color: var(--c);
  margin-bottom: 8px;
}
.stat strong {
  font-family: var(--display);
  font-weight: 400;
  font-size: 34px;
  line-height: 1;
  color: var(--text);
}
.stat span:last-child {
  font-size: 13px;
  color: var(--text-dim);
}

/* seasons */
.seasons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}
.season {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 18px;
  border-radius: 20px;
  border: 1px solid var(--border-2);
  background:
    radial-gradient(200px 120px at 0% 50%, color-mix(in srgb, var(--c) 18%, transparent), transparent),
    var(--surface);
  transition: all 0.3s var(--ease);
}
.season:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--c) 50%, transparent);
  box-shadow: 0 14px 40px -16px var(--c);
}
.season-num {
  font-family: var(--display);
  font-size: 56px;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 1.5px var(--c);
}
.season-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.season-info small {
  color: var(--text-dim);
  font-size: 12.5px;
}
.season-tags {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.season-sk {
  height: 110px;
  border-radius: 20px;
}

/* activity */
.activity {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.act-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid var(--border-2);
  background: var(--surface);
  font-size: 14px;
  color: var(--text-dim);
  transition: border-color 0.2s;
}
.act-row:hover {
  border-color: var(--local-border);
}
.act-row strong {
  color: var(--text);
}
.act-row em {
  color: var(--local);
  font-style: normal;
}
.act-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--local);
  box-shadow: 0 0 10px var(--local);
  flex-shrink: 0;
}
.act-dot.revert,
.act-dot.clear {
  background: var(--remote);
  box-shadow: 0 0 10px var(--remote);
}
.when {
  margin-left: auto;
  font-size: 12px;
  white-space: nowrap;
}

.pop-enter-active,
.pop-leave-active {
  transition: all 0.35s var(--ease);
}
.pop-enter-from {
  opacity: 0;
  transform: scale(0.4) rotate(-90deg);
}
.pop-leave-to {
  opacity: 0;
  transform: scale(0.2) rotate(120deg);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .lead {
    margin: 0 auto;
  }
  .cta {
    justify-content: center;
  }
  .featured-card {
    position: static;
    margin-top: 16px;
  }
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
