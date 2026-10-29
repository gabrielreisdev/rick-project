<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { useFavoritesStore } from '@/stores/favorites'
import { useToastStore } from '@/stores/toast'

const props = defineProps({
  resource: { type: String, required: true },
  id: { type: Number, required: true },
  name: { type: String, default: '' },
  size: { type: String, default: 'sm' },
})

const favorites = useFavoritesStore()
const toast = useToastStore()
const active = computed(() => favorites.has(props.resource, props.id))

function toggle(e) {
  e.preventDefault()
  e.stopPropagation()
  const added = favorites.toggle(props.resource, props.id)
  toast.push({
    type: 'success',
    message: added ? `${props.name || 'Item'} adicionado aos favoritos` : `${props.name || 'Item'} removido dos favoritos`,
  })
}
</script>

<template>
  <button
    type="button"
    class="fav grid place-items-center rounded-full border backdrop-blur-md cursor-pointer transition-all duration-250 active:scale-95 hover:scale-105 hover:text-[#ff6fb5] hover:border-[#ff6fb5]/50"
    :class="[
      size === 'lg' ? 'w-11 h-11' : 'w-8 h-8',
      active
        ? 'active text-[#ff6fb5] border-[#ff6fb5]/60 bg-[#ff6fb5]/15'
        : 'text-text-dim border-white/12 bg-[#05080d]/65',
    ]"
    :aria-pressed="active"
    :title="active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'"
    @click="toggle"
  >
    <AppIcon name="heart" :size="size === 'lg' ? 20 : 15" :stroke="2.2" />
  </button>
</template>

<style scoped>
.active :deep(svg) {
  fill: currentColor;
  animation: heart-pop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes heart-pop {
  40% {
    transform: scale(1.35);
  }
}
</style>
