<script setup>
import { computed } from 'vue'
import { t } from '@/config/resources'

const props = defineProps({
  status: { type: String, default: 'unknown' },
  label: { type: Boolean, default: false },
})
const kind = computed(() => (['Alive', 'Dead'].includes(props.status) ? props.status.toLowerCase() : 'unknown'))
</script>

<template>
  <span class="inline-flex items-center gap-1.5" :class="kind">
    <span class="dot w-2 h-2 rounded-full shrink-0" />
    <span v-if="label" class="text-sm font-medium">{{ t(status) }}</span>
  </span>
</template>

<style scoped>
.alive {
  --c: var(--alive);
}
.alive .dot {
  animation: pulse 2s ease-in-out infinite;
}
.dead {
  --c: var(--dead);
}
.unknown {
  --c: var(--unknown);
}
.dot {
  background: var(--c);
  box-shadow: 0 0 10px var(--c);
}

@keyframes pulse {
  50% {
    box-shadow: 0 0 0 5px rgba(110, 226, 107, 0);
    transform: scale(1.15);
  }
}
</style>
