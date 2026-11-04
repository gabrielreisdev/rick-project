<script setup>
import { computed, nextTick, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import { t } from '@/config/resources'

const props = defineProps({
  field: { type: Object, required: true },
  value: { type: [String, Number], default: '' },
  original: { type: [String, Number], default: '' },
  edited: { type: Boolean, default: false },
})
const emit = defineEmits(['save', 'revert'])

const editing = ref(false)
const draft = ref('')
const inputEl = ref(null)

const display = computed(() => {
  const v = props.value
  if (v === '' || v == null) return null
  return props.field.type === 'url' ? v : t(v)
})
const originalDisplay = computed(() => {
  const v = props.original
  if (v === '' || v == null) return '(vazio)'
  return props.field.type === 'url' ? v : t(v)
})

async function start() {
  draft.value = props.value ?? ''
  editing.value = true
  await nextTick()
  inputEl.value?.focus()
  inputEl.value?.select?.()
}

function cancel() {
  editing.value = false
}

function save() {
  emit('save', draft.value)
  editing.value = false
}

function onKey(e) {
  if (e.key === 'Escape') cancel()
  if (e.key === 'Enter' && (props.field.type !== 'textarea' || e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    save()
  }
}
</script>

<template>
  <div class="efield" :class="{ edited, editing, wide: field.type === 'textarea' }">
    <div class="label-row">
      <span class="label">{{ field.label }}</span>
      <span v-if="edited" class="state local" title="Valor editado">● editado</span>
      <span v-else-if="field.localOnly" class="state only" title="Campo de anotações">anotações</span>
    </div>

    <form v-if="editing" class="editor" @submit.prevent="save">
      <select
        v-if="field.type === 'select'"
        :id="`edit-${field.key}`"
        ref="inputEl"
        v-model="draft"
        class="select"
        @keydown="onKey"
      >
        <option v-for="o in field.options" :key="o" :value="o">{{ t(o) }}</option>
      </select>
      <textarea
        v-else-if="field.type === 'textarea'"
        :id="`edit-${field.key}`"
        ref="inputEl"
        v-model="draft"
        class="textarea"
        :placeholder="field.placeholder"
        @keydown="onKey"
      />
      <input
        v-else
        :id="`edit-${field.key}`"
        ref="inputEl"
        v-model="draft"
        class="input"
        :type="field.type === 'url' ? 'url' : 'text'"
        :placeholder="field.placeholder"
        @keydown="onKey"
      />
      <div class="editor-actions">
        <span class="hint text-mute">
          <kbd>{{ field.type === 'textarea' ? 'Ctrl+Enter' : 'Enter' }}</kbd> salvar · <kbd>Esc</kbd> cancelar
        </span>
        <button type="button" class="btn btn-sm btn-ghost" @click="cancel">Cancelar</button>
        <button :id="`save-${field.key}`" type="submit" class="btn btn-sm btn-primary">
          <AppIcon name="check" :size="14" /> Salvar
        </button>
      </div>
    </form>

    <div v-else class="viewer">
      <button :id="`field-${field.key}`" type="button" class="value" title="Clique para editar" @click="start">
        <span v-if="display" class="text" :class="{ mono: field.type === 'url' }">{{ display }}</span>
        <span v-else class="empty">{{ field.placeholder || 'Vazio — clique para preencher' }}</span>
        <AppIcon name="pencil" :size="14" class="pen" />
      </button>
      <div v-if="edited" class="diff">
        <span class="was">
          <AppIcon name="cloud" :size="12" /> Original: <s>{{ originalDisplay }}</s>
        </span>
        <button type="button" class="revert" title="Restaurar valor remoto" @click="emit('revert')">
          <AppIcon name="undo" :size="12" /> restaurar
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.efield {
  position: relative;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid var(--border-2);
  background: rgba(255, 255, 255, 0.02);
  transition:
    border-color 0.25s,
    background 0.25s;
}
.efield.wide {
  grid-column: 1 / -1;
}
.efield:hover {
  border-color: rgba(255, 255, 255, 0.12);
}
.efield.edited {
  border-color: var(--local-border);
  background: linear-gradient(135deg, rgba(215, 123, 255, 0.08), transparent 70%);
}
.efield.editing {
  border-color: var(--portal);
  box-shadow: 0 0 0 4px rgba(151, 206, 76, 0.1);
}
.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.label {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-mute);
  font-weight: 600;
}
.state {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.state.local {
  color: var(--local);
}
.state.remote {
  color: color-mix(in srgb, var(--remote) 70%, transparent);
}
.state.only {
  color: var(--amber);
}
.value {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: text;
  font-size: 16px;
  font-weight: 500;
}
.text {
  word-break: break-word;
  white-space: pre-wrap;
}
.text.mono {
  font-size: 12.5px;
  color: var(--text-dim);
}
.edited .text {
  color: var(--local);
}
.empty {
  color: var(--text-mute);
  font-style: italic;
  font-size: 14px;
}
.pen {
  opacity: 0;
  color: var(--portal);
  transition: opacity 0.2s;
}
.efield:hover .pen,
.value:focus-visible .pen {
  opacity: 1;
}
.diff {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(215, 123, 255, 0.25);
  font-size: 12px;
}
.was {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-mute);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.was s {
  color: var(--remote);
  opacity: 0.8;
}
.revert {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: none;
  color: var(--local);
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
}
.revert:hover {
  text-decoration: underline;
}
.editor {
  display: grid;
  gap: 10px;
}
.editor-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
.hint {
  margin-right: auto;
  font-size: 12px;
}
</style>
