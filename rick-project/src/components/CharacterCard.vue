<script setup>
import { computed } from 'vue'
import SourceBadge from './SourceBadge.vue'
import StatusDot from './StatusDot.vue'
import FavButton from './FavButton.vue'
import SafeImage from './SafeImage.vue'
import AppIcon from './AppIcon.vue'
import { t } from '@/config/resources'

const props = defineProps({
  item: { type: Object, required: true },
  index: { type: Number, default: 0 },
})

const edited = (key) => (props.item._edited?.includes(key) ? 'field-local' : '')
const isLocal = computed(() => props.item._source === 'local')
</script>

<template>
  <RouterLink
    :to="`/characters/${item.id}`"
    class="card group flex flex-col"
    :class="{ 'is-local': isLocal }"
    :style="{ '--i': index }"
  >
    <div class="relative aspect-square overflow-hidden bg-bg-subtle">
      <SafeImage
        :src="item.image"
        :alt="item.name"
        :seed="item.id"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-106"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-[#0a1018]/95 via-transparent to-transparent pointer-events-none" />
      <div class="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <SourceBadge :source="item._source" :updated-at="item._updatedAt" />
        <FavButton resource="character" :id="item.id" :name="item.name" class="ml-auto" />
      </div>
      <span class="absolute bottom-2.5 right-3.5 z-10 text-xs text-white/55 font-mono">
        #{{ String(item.id).padStart(3, '0') }}
      </span>
    </div>

    <div class="pt-2 px-4.5 pb-4.5 flex flex-col gap-2.5 flex-1">
      <h3 class="text-lg font-bold leading-tight" :class="edited('name')">{{ item.name }}</h3>
      <p class="flex items-center flex-wrap gap-1.5 text-[13.5px] text-text-dim">
        <StatusDot :status="item.status" />
        <span :class="edited('status')">{{ t(item.status) }}</span>
        <span class="text-text-mute">·</span>
        <span :class="edited('species')">{{ t(item.species) }}</span>
        <template v-if="item.type">
          <span class="text-text-mute">·</span>
          <span class="italic" :class="edited('type')">{{ t(item.type) }}</span>
        </template>
      </p>

      <dl class="m-0 grid gap-2">
        <div>
          <dt class="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-mute">
            <AppIcon name="pin" :size="12" /> Última localização
          </dt>
          <dd class="m-0 mt-0.5 text-[13.5px] truncate text-text-main">{{ t(item.location?.name) }}</dd>
        </div>
        <div>
          <dt class="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-mute">
            <AppIcon name="orbit" :size="12" /> Origem
          </dt>
          <dd class="m-0 mt-0.5 text-[13.5px] truncate text-text-main">{{ t(item.origin?.name) }}</dd>
        </div>
      </dl>

      <footer class="mt-auto flex flex-wrap gap-1.5 pt-1">
        <span class="tag"><AppIcon name="tv" :size="12" /> {{ item.episode?.length ?? 0 }} ep.</span>
        <span class="tag" :class="edited('gender')">{{ t(item.gender) }}</span>
        <span v-if="item.notes" class="tag" title="Possui anotações locais">📝</span>
      </footer>
    </div>
  </RouterLink>
</template>
