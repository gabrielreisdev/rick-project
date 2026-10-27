<script setup>
import { computed, reactive, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { RESOURCES, t } from '@/config/resources'

const props = defineProps({
  resource: { type: String, required: true },
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

const schema = computed(() => RESOURCES[props.resource])
const local = reactive({})

watch(
  () => [props.resource, props.modelValue],
  () => {
    for (const k of Object.keys(local)) delete local[k]
    for (const f of schema.value.filters) local[f.key] = props.modelValue[f.key] ?? ''
  },
  { immediate: true, deep: true },
)

let timer
function commit(debounce = false) {
  clearTimeout(timer)
  const fire = () => emit('update:modelValue', { ...local })
  if (debounce) timer = setTimeout(fire, 380)
  else fire()
}

function toggleChip(key, value) {
  local[key] = local[key] === value ? '' : value
  commit()
}

const active = computed(() => Object.values(props.modelValue).filter(Boolean).length)

function clear() {
  for (const k of Object.keys(local)) local[k] = ''
  commit()
}
</script>

<template>
  <div class="filters">
    <template v-for="f in schema.filters" :key="f.key">
      <div v-if="f.type === 'search'" class="search">
        <AppIcon name="search" :size="16" class="search-icon" />
        <input
          :id="`filter-${f.key}`"
          v-model="local[f.key]"
          class="input"
          type="search"
          :placeholder="f.label + '…'"
          :aria-label="f.label"
          @input="commit(true)"
        />
      </div>

      <select
        v-else-if="f.type === 'select'"
        :id="`filter-${f.key}`"
        v-model="local[f.key]"
        class="select"
        :aria-label="f.label"
        @change="commit()"
      >
        <option value="">{{ f.label }}: todos</option>
        <option v-for="o in f.options" :key="o" :value="o">{{ t(o) }}</option>
      </select>

      <input
        v-else-if="f.type === 'text'"
        :id="`filter-${f.key}`"
        v-model="local[f.key]"
        class="input text"
        :placeholder="f.label + (f.placeholder ? ` (${f.placeholder})` : '')"
        :aria-label="f.label"
        @input="commit(true)"
      />

      <div v-else-if="f.type === 'chips'" class="chips" role="group" :aria-label="f.label">
        <button
          v-for="o in f.options"
          :id="`filter-${f.key}-${o}`"
          :key="o"
          type="button"
          class="chip"
          :class="{ active: local[f.key] === o }"
          @click="toggleChip(f.key, o)"
        >
          Temporada {{ Number(o.slice(1)) }}
        </button>
      </div>
    </template>

    <Transition name="fade">
      <button v-if="active" id="filter-clear" class="btn btn-ghost clear" @click="clear">
        <AppIcon name="x" :size="15" /> Limpar ({{ active }})
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.search {
  position: relative;
  flex: 1 1 280px;
}
.search .input {
  padding-left: 40px;
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-mute);
  pointer-events: none;
}
.select {
  flex: 0 1 190px;
}
.text {
  flex: 0 1 220px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.clear {
  color: var(--text-dim);
}
</style>
