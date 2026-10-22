<script setup>
defineProps({
  count: { type: Number, default: 8 },
  variant: { type: String, default: 'character' },
})
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
    <div
      v-for="n in count"
      :key="n"
      class="rounded-3xl border border-white/10 bg-surface overflow-hidden backdrop-blur-md"
    >
      <!-- .skeleton usa animação pura em animations.css; dimensões usam Tailwind -->
      <div
        class="skeleton rounded-none"
        :class="variant === 'location' || variant === 'episode' ? 'aspect-[16/8]' : 'aspect-square'"
      />
      <div class="p-4 grid gap-2.5">
        <div class="skeleton h-3.5 w-[70%]" />
        <div class="skeleton h-3.5 w-[45%]" />
        <div class="skeleton h-2.5 w-[85%]" />
      </div>
    </div>
  </div>
</template>
