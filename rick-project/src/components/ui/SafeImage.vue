<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  seed: { type: [Number, String], default: 1 },
})

const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false),
)

const initials = computed(() =>
  (props.alt || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase(),
)
const hue = computed(() => (Number(props.seed) * 53) % 360)
</script>

<template>
  <img v-if="src && !failed" :src="src" :alt="alt" loading="lazy" decoding="async" @error="failed = true" />
  <div v-else class="fallback" :style="{ '--h': hue }" role="img" :aria-label="alt">
    <span>{{ initials }}</span>
  </div>
</template>

<style scoped>
img,
.fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.fallback {
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 30% 25%, hsl(var(--h) 80% 60% / 0.6), transparent 60%),
    linear-gradient(135deg, hsl(var(--h) 40% 18%), hsl(calc(var(--h) + 80) 40% 10%));
  font-family: var(--display);
  font-size: clamp(18px, 30%, 64px);
  color: rgba(255, 255, 255, 0.85);
}
</style>
