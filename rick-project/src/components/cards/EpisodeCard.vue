<script setup>
import { computed } from 'vue'
import SourceBadge from '@/components/ui/SourceBadge.vue'
import FavButton from '@/components/ui/FavButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { parseEpisodeCode, SEASON_COLORS } from '@/config/resources'
import { characterAvatar, idFromUrl } from '@/api/rickmorty'
import { formatDate } from '@/utils/format'

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, default: 0 },
})

const edited = (key) => (props.item._edited?.includes(key) ? 'field-local' : '')
const code = computed(() => parseEpisodeCode(props.item.episode))
const color = computed(() => SEASON_COLORS[(code.value.season - 1 + 5) % 5] ?? SEASON_COLORS[0])
const cast = computed(() => props.item.characters ?? [])
const preview = computed(() => cast.value.slice(0, 6).map(idFromUrl))
</script>

<template>
  <RouterLink
    :to="`/episodes/${item.id}`"
    class="card ep-card"
    :class="{ 'is-local': item._source === 'local' }"
    :style="{ '--i': index, '--season': color }"
  >
    <div class="head">
      <div class="code">
        <span class="s mono">T{{ code.season || '?' }}</span>
        <span class="e">{{ String(code.number || item.id).padStart(2, '0') }}</span>
      </div>
      <div class="head-actions">
        <SourceBadge :source="item._source" :updated-at="item._updatedAt" />
        <FavButton resource="episode" :id="item.id" :name="item.name" />
      </div>
    </div>
    <div class="body">
      <span class="ep-code mono" :class="edited('episode')">{{ item.episode }}</span>
      <h3 class="name" :class="edited('name')">{{ item.name }}</h3>
      <p class="date">
        <AppIcon name="calendar" :size="13" />
        <span :class="edited('air_date')">{{ formatDate(item.air_date) }}</span>
      </p>
      <footer>
        <div class="avatars">
          <img v-for="id in preview" :key="id" :src="characterAvatar(id)" alt="" loading="lazy" />
        </div>
        <span class="count"><strong>{{ cast.length }}</strong> no elenco</span>
      </footer>
    </div>
  </RouterLink>
</template>

<style scoped>
.ep-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: var(--season);
  box-shadow: 0 0 20px var(--season);
}
.head {
  position: relative;
  padding: 18px 18px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: radial-gradient(260px 140px at 0% 0%, color-mix(in srgb, var(--season) 22%, transparent), transparent);
}
.code {
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1;
}
.s {
  font-size: 13px;
  color: var(--season);
  font-weight: 600;
}
.e {
  font-family: var(--display);
  font-size: 54px;
  color: transparent;
  -webkit-text-stroke: 1.5px var(--season);
  transition: color 0.4s var(--ease);
}
.ep-card:hover .e {
  color: color-mix(in srgb, var(--season) 25%, transparent);
}
.head-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.body {
  padding: 12px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.ep-code {
  font-size: 11.5px;
  color: var(--text-mute);
  letter-spacing: 0.08em;
}
.name {
  font-size: 17px;
  font-weight: 700;
}
.date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: var(--text-dim);
}
footer {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.avatars {
  display: flex;
}
.avatars img {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid var(--surface-solid);
  margin-left: -8px;
  object-fit: cover;
}
.avatars img:first-child {
  margin-left: 0;
}
.count {
  font-size: 13px;
  color: var(--text-dim);
}
.count strong {
  color: var(--text);
}
</style>
