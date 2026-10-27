<script setup>
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  page: { type: Number, required: true },
  pages: { type: Number, required: true },
})
const emit = defineEmits(['update:page'])

const jump = ref('')

const windowPages = computed(() => {
  const { page, pages } = props
  const out = []
  const add = (p) => out.push(p)
  const span = 1
  add(1)
  if (page - span > 2) add('…l')
  for (let p = Math.max(2, page - span); p <= Math.min(pages - 1, page + span); p++) add(p)
  if (page + span < pages - 1) add('…r')
  if (pages > 1) add(pages)
  return out
})

function go(p) {
  const target = Math.min(Math.max(1, p), props.pages)
  if (target !== props.page) emit('update:page', target)
}

function submitJump() {
  const n = Number(jump.value)
  if (Number.isFinite(n) && n > 0) go(n)
  jump.value = ''
}
</script>

<template>
  <nav v-if="pages > 1" class="pagination" aria-label="Paginação">
    <div class="pager">
      <button class="btn btn-sm btn-icon btn-ghost" :disabled="page <= 1" title="Primeira página" @click="go(1)">
        <AppIcon name="chevrons-left" :size="16" />
      </button>
      <button class="btn btn-sm btn-icon" :disabled="page <= 1" title="Anterior (←)" @click="go(page - 1)">
        <AppIcon name="chevron-left" :size="16" />
      </button>

      <template v-for="p in windowPages" :key="p">
        <span v-if="typeof p === 'string'" class="ellipsis">…</span>
        <button
          v-else
          class="num"
          :class="{ active: p === page }"
          :aria-current="p === page ? 'page' : undefined"
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>

      <button class="btn btn-sm btn-icon" :disabled="page >= pages" title="Próxima (→)" @click="go(page + 1)">
        <AppIcon name="chevron-right" :size="16" />
      </button>
      <button class="btn btn-sm btn-icon btn-ghost" :disabled="page >= pages" title="Última página" @click="go(pages)">
        <AppIcon name="chevrons-right" :size="16" />
      </button>
    </div>

    <form class="jump" @submit.prevent="submitJump">
      <label for="page-jump" class="text-mute">Ir para</label>
      <input
        id="page-jump"
        v-model="jump"
        class="input"
        type="number"
        min="1"
        :max="pages"
        :placeholder="`1–${pages}`"
      />
    </form>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--border-2);
  backdrop-filter: blur(14px);
}
.pager {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.num {
  min-width: 34px;
  height: 32px;
  padding: 0 8px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.2s var(--ease);
}
.num:hover {
  color: var(--text);
  background: rgba(255, 255, 255, 0.05);
}
.num.active {
  color: #0b1404;
  background: var(--portal);
  font-weight: 600;
  box-shadow: 0 6px 18px -6px rgba(151, 206, 76, 0.8);
}
.ellipsis {
  color: var(--text-mute);
  padding: 0 4px;
}
.jump {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.jump .input {
  width: 90px;
  height: 32px;
  font-family: var(--mono);
}
</style>
