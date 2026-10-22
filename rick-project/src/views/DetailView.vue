<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import SourceBadge from '@/components/ui/SourceBadge.vue'
import StatusDot from '@/components/ui/StatusDot.vue'
import FavButton from '@/components/ui/FavButton.vue'
import SafeImage from '@/components/ui/SafeImage.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import EditableField from '@/components/EditableField.vue'
import CharacterRelations from '@/components/detail/CharacterRelations.vue'
import CastSection from '@/components/detail/CastSection.vue'
import { fetchCount, fetchOne } from '@/api/rickmorty'
import { RESOURCES, SEASON_COLORS, parseEpisodeCode, t } from '@/config/resources'
import { useEditsStore } from '@/stores/edits'
import { useToastStore } from '@/stores/toast'
import { formatDate, timeAgo } from '@/utils/format'

const props = defineProps({
  resource: { type: String, required: true },
  id: { type: Number, required: true },
})

const router = useRouter()
const edits = useEditsStore()
const toast = useToastStore()

const schema = computed(() => RESOURCES[props.resource])
const raw = ref(null)
const loading = ref(true)
const error = ref(null)
const total = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    raw.value = await fetchOne(props.resource, props.id)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
watch(() => [props.resource, props.id], load, { immediate: true })
fetchCount(props.resource).then((n) => (total.value = n)).catch(() => {})

/** What the user sees: remote data merged with local edits. */
const item = computed(() => edits.apply(props.resource, raw.value))
const record = computed(() => edits.get(props.resource, props.id))
const isLocal = computed(() => item.value?._source === 'local')
const edited = (key) => item.value?._edited?.includes(key)

const episodeCode = computed(() => parseEpisodeCode(item.value?.episode))
const seasonColor = computed(() => SEASON_COLORS[(episodeCode.value.season - 1 + 5) % 5] ?? SEASON_COLORS[0])

function undoAction(token) {
  return { label: 'Desfazer', run: () => edits.restore(token) }
}

function onSave(field, value) {
  const token = edits.update(props.resource, raw.value, { [field.key]: value })
  if (!token) return
  const isRevert = !(field.key in (edits.get(props.resource, props.id)?.fields ?? {}))
  toast.push({
    type: 'local',
    message: isRevert ? `“${field.label}” voltou ao valor remoto` : `“${field.label}” salvo localmente`,
    action: undoAction(token),
  })
}

function onRevert(field) {
  const token = edits.revertField(props.resource, props.id, field.key)
  if (token) toast.push({ type: 'success', message: `“${field.label}” restaurado da API`, action: undoAction(token) })
}

function revertAll() {
  const token = edits.revert(props.resource, props.id)
  if (token) toast.push({ type: 'success', message: 'Todas as edições descartadas', action: undoAction(token) })
}

const prevId = computed(() => (props.id > 1 ? props.id - 1 : null))
const nextId = computed(() => (total.value == null || props.id < total.value ? props.id + 1 : null))
const go = (id) => id && router.push(`/${schema.value.route}/${id}`)

function onKey(e) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return
  if (e.key === 'ArrowLeft') go(prevId.value)
  if (e.key === 'ArrowRight') go(nextId.value)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

const remoteMeta = computed(() => {
  if (!raw.value) return []
  const r = raw.value
  const rows = [
    { label: 'ID', value: `#${r.id}` },
    { label: 'Criado na API', value: formatDate(r.created) },
  ]
  if (props.resource === 'character') rows.push({ label: 'Episódios', value: r.episode.length })
  if (props.resource === 'location') rows.push({ label: 'Residentes', value: r.residents.length })
  if (props.resource === 'episode') rows.push({ label: 'Elenco', value: r.characters.length })
  return rows
})
</script>

<template>
  <div class="container">
    <div class="topnav">
      <RouterLink :to="`/${schema.route}`" class="btn btn-ghost btn-sm back">
        <AppIcon name="arrow-left" :size="15" /> {{ schema.label }}
      </RouterLink>
      <div class="stepper">
        <button class="btn btn-sm btn-icon" :disabled="!prevId" title="Anterior (←)" @click="go(prevId)">
          <AppIcon name="chevron-left" :size="16" />
        </button>
        <span class="mono text-mute">#{{ id }}<template v-if="total"> / {{ total }}</template></span>
        <button class="btn btn-sm btn-icon" :disabled="!nextId" title="Próximo (→)" @click="go(nextId)">
          <AppIcon name="chevron-right" :size="16" />
        </button>
      </div>
    </div>

    <div v-if="loading" class="hero-sk">
      <div class="skeleton sk-media" />
      <div class="sk-lines">
        <div class="skeleton" style="height: 14px; width: 30%" />
        <div class="skeleton" style="height: 44px; width: 70%" />
        <div class="skeleton" style="height: 18px; width: 50%" />
      </div>
    </div>

    <EmptyState v-else-if="error" icon="⚠️" title="O portal falhou" :message="error">
      <button class="btn btn-primary" @click="load">Tentar novamente</button>
    </EmptyState>

    <EmptyState
      v-else-if="!raw"
      icon="🕳️"
      :title="`${schema.singular} não encontrado`"
      message="Esse ID não existe em nenhuma dimensão conhecida."
    >
      <RouterLink :to="`/${schema.route}`" class="btn">Voltar à lista</RouterLink>
    </EmptyState>

    <template v-else>
      <!-- HERO -->
      <header class="hero" :class="[resource, { 'is-local': isLocal }]" :style="{ '--season': seasonColor }">
        <div class="hero-media">
          <template v-if="resource === 'character'">
            <div class="portal-ring" />
            <div class="avatar">
              <SafeImage :src="item.image" :alt="item.name" :seed="item.id" />
            </div>
          </template>
          <div v-else-if="resource === 'location'" class="location-portal-hero">
            <span class="portal-vortex-ring vr-1" />
            <span class="portal-vortex-ring vr-2" />
            <span class="portal-vortex-swirl" />
            <div class="portal-vortex-core">
              <AppIcon name="orbit" :size="48" class="core-icon" />
              <span class="core-type mono">{{ t(item.type) || 'Local' }}</span>
            </div>
          </div>
          <div v-else class="ep-art">
            <span class="ep-s mono">Temporada {{ episodeCode.season }}</span>
            <span class="ep-n">{{ String(episodeCode.number).padStart(2, '0') }}</span>
          </div>
        </div>

        <div class="hero-info">
          <div class="badges">
            <span class="eyebrow">{{ schema.singular }} · #{{ item.id }}</span>
            <SourceBadge :source="item._source" :updated-at="item._updatedAt" />
          </div>
          <h1 :class="{ 'field-local': edited('name') }">{{ item.name }}</h1>

          <div class="quick">
            <template v-if="resource === 'character'">
              <span class="tag big"><StatusDot :status="item.status" label /></span>
              <span class="tag big" :class="{ 'field-local': edited('species') }">{{ t(item.species) }}</span>
              <span class="tag big" :class="{ 'field-local': edited('gender') }">{{ t(item.gender) }}</span>
              <span v-if="item.type" class="tag big" :class="{ 'field-local': edited('type') }">{{ t(item.type) }}</span>
            </template>
            <template v-else-if="resource === 'location'">
              <span class="tag big" :class="{ 'field-local': edited('type') }">{{ t(item.type) || '—' }}</span>
              <span class="tag big" :class="{ 'field-local': edited('dimension') }">
                <AppIcon name="orbit" :size="13" /> {{ t(item.dimension) || '—' }}
              </span>
            </template>
            <template v-else>
              <span class="tag big mono" :class="{ 'field-local': edited('episode') }">{{ item.episode }}</span>
              <span class="tag big" :class="{ 'field-local': edited('air_date') }">
                <AppIcon name="calendar" :size="13" /> {{ formatDate(item.air_date) }}
              </span>
            </template>
          </div>

          <div class="hero-actions">
            <FavButton :resource="resource" :id="item.id" :name="item.name" size="lg" />
            <button v-if="isLocal" id="revert-all" class="btn btn-local" @click="revertAll">
              <AppIcon name="undo" :size="15" /> Descartar edições ({{ item._edited.length }})
            </button>
            <span v-if="record" class="updated text-mute">
              <AppIcon name="clock" :size="13" /> editado {{ timeAgo(record.updatedAt) }}
            </span>
          </div>
        </div>
      </header>

      <!-- EDIT + META -->
      <div class="content">
        <section class="panel edit-panel">
          <div class="panel-head">
            <div>
              <h2><AppIcon name="pencil" :size="18" /> Dados editáveis</h2>
              <p class="text-dim">Clique em qualquer campo para editar. As alterações ficam salvas neste navegador.</p>
            </div>
          </div>
          <div class="fields">
            <EditableField
              v-for="f in schema.fields"
              :key="f.key"
              :field="f"
              :value="item[f.key] ?? ''"
              :original="record?.base?.[f.key] ?? raw[f.key] ?? ''"
              :edited="edited(f.key)"
              @save="(v) => onSave(f, v)"
              @revert="onRevert(f)"
            />
          </div>
        </section>

        <aside class="panel meta-panel">
          <h2><AppIcon name="cloud" :size="18" /> Informações da API</h2>
          <dl>
            <div v-for="m in remoteMeta" :key="m.label">
              <dt>{{ m.label }}</dt>
              <dd class="mono">{{ m.value }}</dd>
            </div>
          </dl>
          <a :href="raw.url" target="_blank" rel="noopener" class="btn btn-sm api-link">
            <AppIcon name="external" :size="14" /> Ver JSON na API
          </a>
          <div v-if="isLocal" class="source-explainer local">
            <SourceBadge source="local" />
            <p>
              {{ item._edited.length }} campo(s) editado(s) neste navegador.
            </p>
          </div>
        </aside>
      </div>

      <!-- RELATIONS -->
      <CharacterRelations v-if="resource === 'character'" :character="raw" />
      <CastSection
        v-else-if="resource === 'location'"
        :urls="raw.residents"
        title="Residentes"
        empty-message="Nenhum residente conhecido neste local."
      />
      <CastSection v-else :urls="raw.characters" title="Elenco do episódio" />
    </template>
  </div>
</template>

<style scoped>
.topnav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.back {
  color: var(--text-dim);
}
.stepper {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

/* hero */
.hero {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 40px;
  align-items: center;
  padding: 32px;
  border-radius: 28px;
  border: 1px solid var(--border-2);
  background:
    radial-gradient(600px 300px at 0% 0%, rgba(151, 206, 76, 0.12), transparent 70%),
    var(--surface);
  backdrop-filter: blur(16px);
  overflow: hidden;
}
.hero.is-local {
  border-color: var(--local-border);
  background:
    radial-gradient(600px 300px at 0% 0%, rgba(215, 123, 255, 0.14), transparent 70%),
    var(--surface);
}
.hero-media {
  position: relative;
  width: 240px;
  height: 240px;
  display: grid;
  place-items: center;
}
.portal-ring {
  position: absolute;
  inset: -14px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--portal-glow), var(--portal-deep), var(--portal), #e3ffb8, var(--portal-deep), var(--portal-glow));
  filter: blur(10px);
  animation: spin 6s linear infinite;
  opacity: 0.85;
}
.is-local .portal-ring {
  background: conic-gradient(from 0deg, var(--local), #5b1e7a, var(--portal), var(--local), #5b1e7a, var(--local));
}
.avatar {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--bg);
}
.location-portal-hero {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 50% 50%, #0c1a10 0%, #05080c 70%);
  border: 2px solid rgba(151, 206, 76, 0.4);
  box-shadow: 0 0 50px rgba(151, 206, 76, 0.4), inset 0 0 40px rgba(0, 0, 0, 0.8);
}
.portal-vortex-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px dashed rgba(151, 206, 76, 0.4);
}
.portal-vortex-ring.vr-1 {
  inset: 12px;
  animation: spin 10s linear infinite;
}
.portal-vortex-ring.vr-2 {
  inset: 26px;
  border-color: rgba(184, 255, 92, 0.6);
  border-style: dotted;
  animation: spin-rev 6s linear infinite;
}
.portal-vortex-swirl {
  position: absolute;
  inset: 38px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #d8ff9e, var(--portal-deep), var(--portal), #f2ffd9, var(--portal-deep), var(--portal-glow), #d8ff9e);
  filter: blur(8px);
  animation: spin 3s linear infinite;
  opacity: 0.85;
}
.portal-vortex-core {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(5, 12, 8, 0.9);
  border: 2px solid var(--portal);
  box-shadow: 0 0 24px rgba(151, 206, 76, 0.6);
}
.core-icon {
  color: var(--portal-glow);
  filter: drop-shadow(0 0 10px var(--portal));
}
.core-type {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-top: 2px;
}
@keyframes spin-rev {
  to {
    transform: rotate(-360deg);
  }
}
.ep-art {
  width: 100%;
  height: 100%;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--season) 40%, transparent);
  background: radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--season) 25%, transparent), transparent 70%);
}
.ep-s {
  font-size: 13px;
  color: var(--season);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.ep-n {
  font-family: var(--display);
  font-size: 130px;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 2px var(--season);
  text-shadow: 0 0 40px color-mix(in srgb, var(--season) 40%, transparent);
}
.hero-info {
  min-width: 0;
}
.badges {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
h1 {
  font-size: clamp(34px, 5vw, 58px);
  font-weight: 700;
  margin: 12px 0 18px;
  word-break: break-word;
}
.quick {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag.big {
  height: 32px;
  padding: 0 12px;
  font-size: 13.5px;
  color: var(--text);
}
.tag.field-local {
  border-color: var(--local-border);
  background: var(--local-bg);
}
.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}
.updated {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

/* content */
.content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  margin-top: 20px;
  align-items: start;
}
.panel h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
}
.panel-head {
  margin-bottom: 18px;
}
.panel-head p {
  font-size: 13.5px;
  margin-top: 4px;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.meta-panel {
  position: sticky;
  top: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.meta-panel dl {
  margin: 0;
  display: grid;
  gap: 10px;
}
.meta-panel dl div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--border-2);
}
.meta-panel dt {
  color: var(--text-mute);
  font-size: 13px;
}
.meta-panel dd {
  margin: 0;
  font-size: 13px;
  color: var(--remote);
}
.api-link {
  align-self: flex-start;
}
.source-explainer {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 14px;
  background: var(--remote-bg);
  border: 1px solid var(--remote-border);
  font-size: 13px;
  color: var(--text-dim);
}
.source-explainer.local {
  background: var(--local-bg);
  border-color: var(--local-border);
}
.source-explainer :deep(.source-badge) {
  justify-self: start;
}

.hero-sk {
  display: flex;
  gap: 40px;
  align-items: center;
  padding: 32px;
  border-radius: 28px;
  border: 1px solid var(--border-2);
}
.sk-media {
  width: 240px;
  height: 240px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sk-lines {
  flex: 1;
  display: grid;
  gap: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes float {
  50% {
    transform: translateY(-10px) rotate(4deg);
  }
}

@media (max-width: 1100px) {
  .content {
    grid-template-columns: 1fr;
  }
  .meta-panel {
    position: static;
  }
}
@media (max-width: 760px) {
  .hero {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
    padding: 24px;
    gap: 24px;
  }
  .hero-media {
    width: 180px;
    height: 180px;
  }
  .badges,
  .quick,
  .hero-actions {
    justify-content: center;
  }
  .fields {
    grid-template-columns: 1fr;
  }
  .hero-sk {
    flex-direction: column;
  }
  .sk-media {
    width: 180px;
    height: 180px;
  }
}
</style>
