<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useEditsStore } from '@/stores/edits'

const emit = defineEmits(['open-search'])
const edits = useEditsStore()

const links = computed(() => [
  { to: '/', label: 'Início', icon: 'home', exact: true },
  { to: '/characters', label: 'Personagens', icon: 'users', badge: edits.countBy.character, local: true },
  { to: '/locations', label: 'Locais', icon: 'globe', badge: edits.countBy.location, local: true },
  { to: '/episodes', label: 'Episódios', icon: 'tv', badge: edits.countBy.episode, local: true },
])
</script>

<template>
  <aside
    class="fixed z-50 bg-[#05080d]/80 backdrop-blur-xl border-white/10
           max-[900px]:inset-x-0 max-[900px]:bottom-0 max-[900px]:top-auto max-[900px]:h-16 max-[900px]:px-2.5 max-[900px]:py-2 max-[900px]:flex-row max-[900px]:border-t
           min-[901px]:inset-y-0 min-[901px]:left-0 min-[901px]:w-[248px] min-[901px]:p-5 min-[901px]:flex-col min-[901px]:border-r
           flex gap-5"
  >
    <!-- Brand / Logo (desktop only) -->
    <RouterLink to="/" class="hidden min-[901px]:flex items-center gap-3 px-2 py-1" aria-label="Portal Explorer — início">
      <span class="brand-portal" />
      <span class="flex flex-col leading-none">
        <strong class="font-display text-[22px] font-normal text-portal-glow drop-shadow-[0_0_16px_rgba(151,206,76,0.5)]">
          Portal
        </strong>
        <small class="font-mono text-[10.5px] tracking-[0.3em] uppercase text-text-dim mt-1">
          Explorer
        </small>
      </span>
    </RouterLink>

    <!-- Search trigger -->
    <button
      id="open-search"
      type="button"
      class="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-text-mute text-[13px] cursor-pointer transition-colors duration-200 hover:border-portal/40 hover:text-text-dim
             max-[900px]:w-11 max-[900px]:h-12 max-[900px]:p-0 max-[900px]:justify-center
             min-[901px]:h-10 min-[901px]:pl-3 min-[901px]:pr-2.5"
      @click="emit('open-search')"
    >
      <AppIcon name="search" :size="16" />
      <span class="hidden min-[901px]:inline flex-1 text-left">Buscar</span>
      <kbd class="hidden min-[901px]:inline">Ctrl K</kbd>
    </button>

    <!-- Navigation links -->
    <nav class="flex max-[900px]:flex-1 max-[900px]:flex-row max-[900px]:justify-around min-[901px]:flex-col gap-1">
      <template v-for="(l, i) in links" :key="i">
        <hr v-if="l.divider" class="hidden min-[901px]:block border-0 border-t border-white/10 my-2.5 mx-2" />
        <RouterLink
          v-else
          :to="l.to"
          class="nav-item relative flex items-center gap-3 rounded-xl text-text-dim font-medium transition-all duration-200 hover:text-text-main hover:bg-white/[0.04]
                 max-[900px]:flex-col max-[900px]:gap-0.5 max-[900px]:h-12 max-[900px]:px-2 max-[900px]:justify-center max-[900px]:text-[10px]
                 min-[901px]:h-[42px] min-[901px]:px-3"
          :class="{ exact: l.exact }"
          :exact-active-class="l.exact ? 'nav-active' : ''"
          :active-class="l.exact ? '' : 'nav-active'"
        >
          <AppIcon :name="l.icon" :size="18" />
          <span class="max-[520px]:hidden min-[901px]:flex-1">{{ l.label }}</span>
          <span
            v-if="l.badge"
            class="grid place-items-center rounded-full font-mono text-[11px] px-1.5 h-5 min-w-[22px]
                   max-[900px]:absolute max-[900px]:top-0 max-[900px]:right-0 max-[900px]:text-[9px] max-[900px]:h-4 max-[900px]:min-w-[16px]"
            :class="l.local ? 'bg-local-bg text-local' : 'bg-[#ff6fb5]/15 text-[#ff8cc6]'"
            :title="l.local ? 'Edições locais' : ''"
          >
            {{ l.badge }}
          </span>
        </RouterLink>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
/* CSS puro dedicado exclusivamente à animação de rotação do portal e barra ativa */
.brand-portal {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle, #d8ff9e 0%, var(--portal) 35%, var(--portal-deep) 70%, transparent 72%);
  box-shadow: 0 0 24px rgba(151, 206, 76, 0.6);
}

.brand-portal::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px dashed rgba(184, 255, 92, 0.6);
  animation: portal-spin 8s linear infinite;
}

.nav-active {
  color: var(--portal-glow);
  background: linear-gradient(90deg, rgba(151, 206, 76, 0.16), rgba(151, 206, 76, 0.02));
}

@media (min-width: 901px) {
  .nav-active::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 10px;
    bottom: 10px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: var(--portal);
    box-shadow: 0 0 12px var(--portal);
  }
}

@keyframes portal-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
