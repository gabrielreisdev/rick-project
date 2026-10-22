<script setup>
import { computed, ref, watch } from 'vue'
import CharacterCard from '@/components/cards/CharacterCard.vue'
import CastBreakdown from './CastBreakdown.vue'
import SkeletonGrid from '@/components/ui/SkeletonGrid.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { fetchMany, idFromUrl } from '@/api/rickmorty'
import { useEditsStore } from '@/stores/edits'

const props = defineProps({
  urls: { type: Array, required: true },
  title: { type: String, default: 'Personagens' },
  emptyMessage: { type: String, default: 'Ninguém por aqui.' },
})

const edits = useEditsStore()
const raw = ref([])
const loading = ref(true)
const filter = ref('')
const limit = ref(24)

watch(
  () => props.urls.join(),
  async () => {
    loading.value = true
    try {
      raw.value = await fetchMany('character', props.urls.map(idFromUrl))
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

const merged = computed(() => raw.value.map((c) => edits.apply('character', c)))
const filtered = computed(() => {
  const q = filter.value.toLowerCase()
  return q ? merged.value.filter((c) => c.name.toLowerCase().includes(q)) : merged.value
})
const visible = computed(() => filtered.value.slice(0, limit.value))
</script>

<template>
  <section class="section">
    <div class="section-head">
      <div>
        <h2 class="section-title"><AppIcon name="users" :size="20" /> {{ title }}</h2>
        <p class="section-sub">{{ urls.length }} personagem{{ urls.length === 1 ? '' : 's' }}</p>
      </div>
      <input
        v-if="urls.length > 8"
        id="cast-filter"
        v-model="filter"
        class="input filter"
        type="search"
        placeholder="Filtrar por nome…"
      />
    </div>

    <EmptyState v-if="!urls.length" icon="👻" title="Vazio" :message="emptyMessage" />
    <SkeletonGrid v-else-if="loading" :count="Math.min(urls.length, 8)" />
    <template v-else>
      <CastBreakdown :characters="merged" />
      <div class="grid-cards">
        <CharacterCard v-for="(c, i) in visible" :key="c.id" :item="c" :index="i % 24" />
      </div>
      <div v-if="filtered.length > limit" class="more">
        <button class="btn" @click="limit += 24">
          Mostrar mais ({{ filtered.length - limit }} restantes)
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.filter {
  max-width: 260px;
}
.more {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
