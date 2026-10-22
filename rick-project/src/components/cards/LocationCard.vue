<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import SourceBadge from '@/components/ui/SourceBadge.vue'
import FavButton from '@/components/ui/FavButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
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
      
      <!-- Dormant / Active Portal Ring -->
      <div class="portal-core">
        <span class="portal-ring-outer" />
        <span class="portal-ring-mid" />
        <span class="portal-energy" />
        <div class="portal-center-icon">
          <AppIcon name="orbit" :size="20" />
        </div>
      </div>

      <!-- Explosive Dimensional Portal Opening Animation on click -->
      <div v-if="isOpening" class="portal-burst">
        <span class="burst-flash" />
        <span class="burst-swirl swirl-1" />
        <span class="burst-swirl swirl-2" />
        <span class="burst-ring" />
      </div>

      <div class="art-top">
        <SourceBadge :source="item._source" :updated-at="item._updatedAt" />
        <FavButton resource="location" :id="item.id" :name="item.name" />
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
    linear-gradient(rgba(151, 206, 76, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(151, 206, 76, 0.05) 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: center center;
  opacity: 0.7;
  pointer-events: none;
}

.portal-core {
  position: relative;
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  transition: transform 0.4s var(--ease);
}

.loc-card:hover .portal-core {
  transform: scale(1.14);
}

.portal-ring-outer {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px dashed rgba(151, 206, 76, 0.35);
  animation: spin 14s linear infinite;
}

.loc-card:hover .portal-ring-outer {
  border-color: rgba(184, 255, 92, 0.75);
  animation-duration: 6s;
}

.portal-ring-mid {
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  border: 1px solid rgba(151, 206, 76, 0.2);
  animation: spin-reverse 9s linear infinite;
}

.portal-energy {
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(184, 255, 92, 0.25), transparent 70%);
  filter: blur(4px);
  animation: pulse-energy 2.4s ease-in-out infinite;
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

/* Dimensional Portal Burst Animation on click */
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
  animation: swirl-expand-rev 0.48s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
  opacity: 0.8;
  mix-blend-mode: screen;
}

.burst-ring {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 4px solid var(--portal-glow);
  box-shadow: 0 0 30px var(--portal-glow);
  animation: ring-shockwave 0.48s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
}

.loc-card.opening-portal {
  transform: scale(0.98);
  box-shadow: 0 0 50px rgba(151, 206, 76, 0.8);
  border-color: var(--portal-glow);
  transition: all 0.2s ease-out;
}

@keyframes flash-expand {
  0% {
    opacity: 0;
    transform: scale(0.2);
  }
  30% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0.95;
    transform: scale(3.5);
  }
}

@keyframes swirl-expand {
  0% {
    transform: scale(0.2) rotate(0deg);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: scale(3) rotate(420deg);
    opacity: 1;
  }
}

@keyframes swirl-expand-rev {
  0% {
    transform: scale(0.1) rotate(0deg);
    opacity: 0;
  }
  30% {
    opacity: 0.9;
  }
  100% {
    transform: scale(2.6) rotate(-360deg);
    opacity: 0.8;
  }
}

@keyframes ring-shockwave {
  0% {
    transform: scale(0.5);
    opacity: 1;
    border-width: 6px;
  }
  100% {
    transform: scale(6);
    opacity: 0;
    border-width: 1px;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin-reverse {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes pulse-energy {
  0%, 100% {
    transform: scale(0.9);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.15);
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
  z-index: 5;
}

.body {
  padding: 16px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.type {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--portal);
}

.name {
  font-size: 17px;
  font-weight: 700;
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
  gap: 8px;
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
