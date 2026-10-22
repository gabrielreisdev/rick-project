<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ToastHost from '@/components/layout/ToastHost.vue'
import CommandPalette from '@/components/layout/CommandPalette.vue'

const searchOpen = ref(false)

function onKey(e) {
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchOpen.value = !searchOpen.value
  } else if (e.key === '/' && !typing) {
    e.preventDefault()
    searchOpen.value = true
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <AppSidebar @open-search="searchOpen = true" />
  <main class="min-h-screen ml-0 pb-16 min-[901px]:ml-[248px] min-[901px]:pb-0">
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </main>
  <CommandPalette v-model="searchOpen" />
  <ToastHost />
</template>
