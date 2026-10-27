<script setup>
import { computed, ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import SourceBadge from '@/components/SourceBadge.vue'
import SafeImage from '@/components/SafeImage.vue'
import { RESOURCES, artFor, locationIcon } from '@/config/resources'
import { useEditsStore } from '@/stores/edits'
import { useToastStore } from '@/stores/toast'
import { timeAgo } from '@/utils/format'

const edits = useEditsStore()
const toast = useToastStore()

const currentFilter = ref('all')
const fileInput = ref(null)

const filteredList = computed(() => {
  if (currentFilter.value === 'all') return edits.list
  return edits.list.filter((item) => item.resource === currentFilter.value)
})

function revertField(item, field) {
  const token = edits.revertField(item.resource, item.id, field)
  if (token) {
    toast.push({
      type: 'success',
      message: `Campo "${field}" restaurado para o original`,
      action: {
        label: 'Desfazer',
        run: () => edits.restore(token),
      },
    })
  }
}

function revertItem(item) {
  const token = edits.revert(item.resource, item.id)
  if (token) {
    toast.push({
      type: 'success',
      message: `Edições de "${item.fields.name || item.base.name}" descartadas`,
      action: {
        label: 'Desfazer',
        run: () => edits.restore(token),
      },
    })
  }
}

function clearAll() {
  if (!confirm('Deseja realmente apagar todas as edições locais?')) return
  const prev = edits.clearAll()
  toast.push({
    type: 'success',
    message: 'Todas as edições locais foram removidas',
    action: {
      label: 'Restaurar',
      run: () => edits.restoreAll(prev),
    },
  })
}

function triggerExport() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(edits.exportJSON())
  const anchor = document.createElement('a')
  anchor.setAttribute('href', dataStr)
  anchor.setAttribute('download', `rick-morty-edits-${Date.now()}.json`)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  toast.push({ type: 'success', message: 'Backup JSON exportado com sucesso!' })
}

function triggerImport() {
  fileInput.value?.click()
}

function handleFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const count = edits.importJSON(event.target.result)
      toast.push({ type: 'local', message: `${count} edição(ões) importada(s) com sucesso!` })
    } catch {
      toast.push({ type: 'error', message: 'Erro ao importar arquivo JSON inválido.' })
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}
</script>

<template>
  <div class="container">
    <header class="lab-header">
      <div>
        <p class="eyebrow">Laboratório de Realidades</p>
        <h1>
          <AppIcon name="flask" :size="32" class="lab-icon" />
          Modificações Locais
        </h1>
        <p class="tagline">
          Central de controle de todas as suas alterações locais. Exporte seus dados, compare com os originais e restaure o que quiser.
        </p>
      </div>

      <div class="header-actions">
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="handleFile"
        />
        <button class="btn btn-sm" @click="triggerImport">
          <AppIcon name="upload" :size="15" /> Importar JSON
        </button>
        <button class="btn btn-sm" :disabled="!edits.count" @click="triggerExport">
          <AppIcon name="download" :size="15" /> Exportar JSON
        </button>
        <button
          v-if="edits.count"
          class="btn btn-sm btn-danger"
          @click="clearAll"
        >
          <AppIcon name="trash" :size="15" /> Limpar Tudo
        </button>
      </div>
    </header>

    <div class="filters-row">
      <div v-if="edits.count" class="chips">
        <button
          class="chip"
          :class="{ active: currentFilter === 'all' }"
          @click="currentFilter = 'all'"
        >
          Personagens ({{ edits.countBy.character }})
        </button>
      </div>
    </div>

    <EmptyState
      v-if="!filteredList.length"
      icon="🧪"
      title="Nenhuma alteração local encontrada"
      message="Você ainda não editou nenhum registro nesta categoria. Abra qualquer personagem, local ou episódio e edite os campos para testar a persistência local!"
    >
      <RouterLink to="/characters" class="btn btn-primary">
        <AppIcon name="search" :size="16" /> Explorar Multiverso
      </RouterLink>
    </EmptyState>

    <div v-else class="overrides-list">
      <article
        v-for="item in filteredList"
        :key="`${item.resource}:${item.id}`"
        class="override-card panel"
      >
        <div class="card-head">
          <div class="entity-info">
            <div class="entity-thumb">
              <SafeImage
                v-if="item.resource === 'character'"
                :src="item.fields.image || item.image"
                :alt="item.fields.name || item.base.name"
                :seed="item.id"
              />
              <span
                v-else
                class="thumb-art"
                :style="{ background: artFor(item.id) }"
              >
                {{ item.resource === 'location' ? locationIcon(item.fields.type || item.base.type) : '🎬' }}
              </span>
            </div>
            <div>
              <div class="tag-row">
                <span class="tag mono">#{{ item.id }}</span>
                <span class="tag">{{ RESOURCES[item.resource]?.singular }}</span>
                <SourceBadge source="local" :updated-at="item.updatedAt" />
              </div>
              <h3 class="entity-title">
                {{ item.fields.name || item.base.name }}
              </h3>
              <p class="text-mute text-xs">
                Modificado {{ timeAgo(item.updatedAt) }}
              </p>
            </div>
          </div>

          <div class="card-actions">
            <RouterLink
              :to="`/${RESOURCES[item.resource]?.route}/${item.id}`"
              class="btn btn-sm btn-ghost"
            >
              Ver página <AppIcon name="external" :size="14" />
            </RouterLink>
            <button
              class="btn btn-sm btn-ghost btn-danger"
              title="Descartar todas as edições deste item"
              @click="revertItem(item)"
            >
              <AppIcon name="undo" :size="14" /> Descartar Item
            </button>
          </div>
        </div>

        <div class="diff-table">
          <div class="diff-header">
            <span>Campo</span>
            <span>Original (API Remota)</span>
            <span>Editado (Local)</span>
            <span>Ação</span>
          </div>

          <div
            v-for="(val, fieldKey) in item.fields"
            :key="fieldKey"
            class="diff-row"
          >
            <span class="diff-field mono">{{ fieldKey }}</span>
            <span class="diff-original">
              <s class="text-mute">{{ item.base[fieldKey] || '(vazio)' }}</s>
            </span>
            <span class="diff-local">
              <strong>{{ val || '(vazio)' }}</strong>
            </span>
            <span class="diff-action">
              <button
                class="btn btn-sm btn-ghost"
                title="Restaurar este campo para o valor remoto"
                @click="revertField(item, fieldKey)"
              >
                <AppIcon name="undo" :size="13" /> Restaurar
              </button>
            </span>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.lab-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
h1 {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: clamp(32px, 5vw, 44px);
  font-weight: 700;
  margin: 8px 0;
}
.lab-icon {
  color: var(--local);
  filter: drop-shadow(0 0 16px rgba(215, 123, 255, 0.6));
}
.tagline {
  color: var(--text-dim);
  max-width: 600px;
}

.header-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filters-row {
  margin-bottom: 24px;
}
.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.overrides-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.override-card {
  padding: 20px;
  border-radius: var(--radius);
  border: 1px solid var(--local-border);
  background: var(--surface);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-2);
}

.entity-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.entity-thumb {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-2);
  flex-shrink: 0;
}

.thumb-art {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 24px;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.entity-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.text-xs {
  font-size: 12px;
  margin-top: 2px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diff-table {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 12px;
  border: 1px solid var(--border-2);
  overflow-x: auto;
}

.diff-header,
.diff-row {
  display: grid;
  grid-template-columns: 140px 1fr 1fr 120px;
  align-items: center;
  padding: 10px 16px;
  gap: 16px;
  font-size: 13.5px;
}

.diff-header {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-mute);
  border-bottom: 1px solid var(--border-2);
  background: rgba(255, 255, 255, 0.02);
}

.diff-row:not(:last-child) {
  border-bottom: 1px dashed var(--border-2);
}

.diff-field {
  color: var(--portal);
}

.diff-original s {
  color: var(--remote);
}

.diff-local strong {
  color: var(--local);
  font-weight: 600;
}

.diff-action {
  text-align: right;
}

@media (max-width: 768px) {
  .diff-header {
    display: none;
  }
  .diff-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .diff-action {
    text-align: left;
  }
}
</style>
