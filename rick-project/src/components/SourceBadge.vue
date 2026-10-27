<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { timeAgo } from '@/utils/format'

const props = defineProps({
  source: { type: String, default: 'remote' },
  updatedAt: { type: Number, default: null },
  compact: { type: Boolean, default: false },
})

const isLocal = computed(() => props.source === 'local')
const title = computed(() =>
  `Dado editado localmente${props.updatedAt ? ' · ' + timeAgo(props.updatedAt) : ''}`,
)
</script>

<template>
  <span v-if="isLocal" class="source-badge local" :class="{ compact }" :title="title">
    <AppIcon name="database" :size="compact ? 11 : 12" :stroke="2.4" />
    <span v-if="!compact">Editado</span>
  </span>
</template>

<style scoped>
.source-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid var(--local-border);
  backdrop-filter: blur(10px);
  white-space: nowrap;
  color: var(--local);
  background: rgba(26, 8, 32, 0.8);
  box-shadow: 0 0 16px -2px rgba(215, 123, 255, 0.55);
  animation: glow 2.4s ease-in-out infinite;
}
.source-badge.compact {
  width: 22px;
  padding: 0;
  justify-content: center;
}
@keyframes glow {
  50% {
    box-shadow: 0 0 22px 0 rgba(215, 123, 255, 0.75);
  }
}
</style>
