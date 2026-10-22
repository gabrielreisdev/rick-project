<script setup>
import { computed } from 'vue'
import { t } from '@/config/resources'

const props = defineProps({
  characters: { type: Array, required: true },
})

const total = computed(() => props.characters.length || 1)

const status = computed(() => {
  const c = { Alive: 0, Dead: 0, unknown: 0 }
  for (const ch of props.characters) c[ch.status in c ? ch.status : 'unknown']++
  return [
    { key: 'Alive', n: c.Alive, color: 'var(--alive)' },
    { key: 'Dead', n: c.Dead, color: 'var(--dead)' },
    { key: 'unknown', n: c.unknown, color: 'var(--unknown)' },
  ]
})

function topBy(key, limit = 5) {
  const m = new Map()
  for (const ch of props.characters) {
    const v = ch[key] || '—'
    m.set(v, (m.get(v) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
}
const species = computed(() => topBy('species'))
const genders = computed(() => topBy('gender', 4))
</script>

<template>
  <div class="breakdown">
    <div class="block">
      <p class="title">Status</p>
      <div class="bar">
        <span
          v-for="s in status"
          :key="s.key"
          :style="{ flex: s.n, background: s.color }"
          :title="`${t(s.key)}: ${s.n}`"
        />
      </div>
      <div class="legend">
        <span v-for="s in status" :key="s.key">
          <i :style="{ background: s.color }" /> {{ t(s.key) }} <strong>{{ s.n }}</strong>
          <small>{{ Math.round((s.n / total) * 100) }}%</small>
        </span>
      </div>
    </div>
    <div class="block">
      <p class="title">Espécies</p>
      <div class="chips">
        <span v-for="[name, n] in species" :key="name" class="tag">{{ t(name) }} <strong>{{ n }}</strong></span>
      </div>
    </div>
    <div class="block">
      <p class="title">Gênero</p>
      <div class="chips">
        <span v-for="[name, n] in genders" :key="name" class="tag">{{ t(name) }} <strong>{{ n }}</strong></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.breakdown {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}
.block {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--border-2);
  background: var(--surface);
}
.title {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-mute);
  margin-bottom: 10px;
}
.bar {
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  gap: 2px;
  background: rgba(255, 255, 255, 0.04);
}
.bar span {
  transition: flex 0.6s var(--ease);
  box-shadow: 0 0 12px currentColor;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--text-dim);
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.legend strong {
  color: var(--text);
}
.legend small {
  color: var(--text-mute);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag strong {
  color: var(--portal);
  font-family: var(--mono);
}
@media (max-width: 900px) {
  .breakdown {
    grid-template-columns: 1fr;
  }
}
</style>
