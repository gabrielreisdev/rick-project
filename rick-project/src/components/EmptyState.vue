<script setup>
defineProps({
  title: { type: String, default: 'Nada por aqui' },
  message: { type: String, default: '' },
  icon: { type: String, default: '🌀' },
})
</script>

<template>
  <div class="flex flex-col items-center text-center gap-2.5 py-16 px-6 border border-dashed border-portal/30 rounded-3xl bg-portal/[0.03]">
    <div class="relative w-[84px] h-[84px] grid place-items-center mb-2 text-3xl portal-aura">
      <span class="relative z-10">{{ icon }}</span>
    </div>
    <h3 class="text-xl font-bold">{{ title }}</h3>
    <p v-if="message" class="text-text-dim max-w-[420px]">{{ message }}</p>
    <div class="mt-2 flex gap-2.5">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.portal-aura::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--portal), transparent, var(--portal-glow), transparent, var(--portal));
  filter: blur(6px);
  animation: portal-spin 4s linear infinite;
  opacity: 0.7;
}

@keyframes portal-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
