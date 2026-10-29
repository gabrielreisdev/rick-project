<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import SourceBadge from './SourceBadge.vue'
import FavButton from './FavButton.vue'
import AppIcon from './AppIcon.vue'
import { t } from '@/config/resources'
import { characterAvatar, idFromUrl } from '@/api/rickmorty'

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, default: 0 },
})

const router = useRouter()
const isOpening = ref(false)

const edited = (key) => (props.item._edited?.includes(key) ? 'field-local' : '')
const residents = computed(() => props.item.residents ?? [])
const preview = computed(() => residents.value.slice(0, 5).map(idFromUrl))

function openPortal(e) {
  if (e.target.closest('.fav') || isOpening.value) return
  e.preventDefault()
  isOpening.value = true
  setTimeout(() => {
    router.push(`/locations/${props.item.id}`)
  }, 480)
}
</script>

<template>
  <a
    :href="`/locations/${item.id}`"
    class="card loc-card"
    :class="{ 'is-local': item._source === 'local', 'opening-portal': isOpening }"
    :style="{ '--i': index }"
    @click="openPortal"
  >
    <div class="portal-viewport">
      <div class="radar-grid" />
      
      <div class="portal-core">
        <span class="portal-ring-outer" />
        <span class="portal-ring-mid" />
        <span class="portal-energy" />
        <div class="portal-center-icon">
          <AppIcon name="orbit" :size="20" />
        </div>
      </div>

      <div v-if="isOpening" class="portal-burst">
        <span class="burst-flash" />
        <span class="burst-swirl swirl-1" />
        <span class="burst-swirl swirl-2" />
        <span class="burst-ring" />
      </div>

      <div class="art-top">
        <SourceBadge :source="item._source" :updated-at="item._updatedAt" />
        <FavButton resource="location" :id="item.id" :name="item.name" class="ml-auto" />
      </div>
    </div>

    <div class="body">
      <span class="type mono" :class="edited('type')">{{ t(item.type) || 'Tipo desconhecido' }}</span>
      <h3 class="name" :class="edited('name')">{{ item.name }}</h3>
      <p class="dim">
        <AppIcon name="orbit" :size="13" />
        <span :class="edited('dimension')">{{ t(item.dimension) || 'Dimensão desconhecida' }}</span>
      </p>
      <footer>
        <div class="avatars">
          <img v-for="id in preview" :key="id" :src="characterAvatar(id)" alt="" loading="lazy" />
        </div>
        <span class="count">
          <strong>{{ residents.length }}</strong> residente{{ residents.length === 1 ? '' : 's' }}
        </span>
      </footer>
    </div>
  </a>
</template>

<style scoped>
.portal-viewport {
  position: relative;
  aspect-ratio: 16/9;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: radial-gradient(circle at 50% 50%, rgba(14, 25, 18, 0.95), #060a10);
  border-bottom: 1px solid var(--border-2);
}

.radar-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(151, 206, 76, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(151, 206, 76, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  mask-image: radial-gradient(circle at 50% 50%, black 40%, transparent 80%);
}

.portal-core {
  position: relative;
  width: 90px;
  height: 90px;
  display: grid;
  place-items: center;
}

.portal-ring-outer {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px dashed rgba(151, 206, 76, 0.35);
  animation: portal-spin 14s linear infinite;
  transition: all 0.4s var(--ease);
}

.loc-card:hover .portal-ring-outer {
  border-color: rgba(184, 255, 92, 0.7);
  animation-duration: 6s;
  box-shadow: 0 0 20px rgba(151, 206, 76, 0.3);
}

.portal-ring-mid {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(184, 255, 92, 0.5);
  box-shadow: inset 0 0 14px rgba(151, 206, 76, 0.4);
  animation: portal-spin-reverse 9s linear infinite;
}

.portal-energy {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(184, 255, 92, 0.4) 0%, rgba(151, 206, 76, 0.15) 50%, transparent 70%);
  animation: portal-energy-pulse 2.4s ease-in-out infinite;
}

.loc-card:hover .portal-energy {
  background: radial-gradient(circle, rgba(200, 255, 120, 0.7) 0%, rgba(151, 206, 76, 0.35) 60%, transparent 75%);
}

.portal-center-icon {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(5, 12, 8, 0.85);
  border: 1px solid rgba(151, 206, 76, 0.4);
  display: grid;
  place-items: center;
  color: var(--portal);
  box-shadow: 0 0 16px rgba(151, 206, 76, 0.35);
  transition: all 0.3s;
}

.loc-card:hover .portal-center-icon {
  color: var(--portal-glow);
  border-color: var(--portal-glow);
  box-shadow: 0 0 24px rgba(184, 255, 92, 0.7);
}

.portal-burst {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 10;
  pointer-events: none;
}

.burst-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(200, 255, 120, 0.95), rgba(151, 206, 76, 0.8), transparent 70%);
  animation: flash-expand 0.48s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
}

.burst-swirl {
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #d8ff9e, var(--portal-deep), var(--portal), #f2ffd9, var(--portal-deep), var(--portal-glow), #d8ff9e);
  filter: blur(6px);
}

.burst-swirl.swirl-1 {
  animation: swirl-expand 0.48s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
}

.burst-swirl.swirl-2 {
  animation: swirl-expand-alt 0.48s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
}

.burst-ring {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 4px solid #f2ffd9;
  box-shadow: 0 0 30px #b8ff5c, 0 0 60px #97ce4c;
  animation: shockwave 0.48s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
}

@keyframes flash-expand {
  0% {
    opacity: 0;
    transform: scale(0.2);
  }
  30% {
    opacity: 1;
    transform: scale(1.4);
  }
  100% {
    opacity: 0.9;
    transform: scale(2.5);
  }
}

@keyframes swirl-expand {
  0% {
    opacity: 0.3;
    transform: scale(0.3) rotate(0deg);
  }
  100% {
    opacity: 1;
    transform: scale(3.5) rotate(540deg);
  }
}

@keyframes swirl-expand-alt {
  0% {
    opacity: 0.3;
    transform: scale(0.2) rotate(0deg);
  }
  100% {
    opacity: 0.9;
    transform: scale(3.2) rotate(-540deg);
  }
}

@keyframes shockwave {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(28);
    opacity: 0;
  }
}

@keyframes portal-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes portal-spin-reverse {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes portal-energy-pulse {
  0%, 100% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
}

.art-top {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 5;
}

.body {
  padding: 14px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.type {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-mute);
}

.name {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.25;
}

.dim {
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
