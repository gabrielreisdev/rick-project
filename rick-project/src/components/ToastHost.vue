<script setup>
import AppIcon from './AppIcon.vue'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
const ICON = { success: 'check', local: 'database', info: 'sparkles', error: 'x' }

function run(t) {
  t.action?.run()
  toast.dismiss(t.id)
}
</script>

<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toast.toasts" :key="t.id" class="toast" :class="t.type">
        <span class="ico"><AppIcon :name="ICON[t.type] ?? 'sparkles'" :size="15" :stroke="2.4" /></span>
        <span class="msg">{{ t.message }}</span>
        <button v-if="t.action" class="act" @click="run(t)">{{ t.action.label }}</button>
        <button class="close" aria-label="Fechar" @click="toast.dismiss(t.id)">
          <AppIcon name="x" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 280px;
  max-width: 420px;
  padding: 10px 10px 10px 12px;
  border-radius: 14px;
  background: rgba(14, 22, 32, 0.92);
  border: 1px solid var(--border-2);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow);
  font-size: 14px;
}
.ico {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  flex-shrink: 0;
  background: rgba(151, 206, 76, 0.15);
  color: var(--portal);
}
.local .ico {
  background: var(--local-bg);
  color: var(--local);
}
.local {
  border-color: var(--local-border);
}
.error .ico {
  background: rgba(255, 93, 115, 0.15);
  color: var(--dead);
}
.msg {
  flex: 1;
}
.act {
  border: 0;
  background: rgba(255, 255, 255, 0.06);
  color: var(--portal-glow);
  font-weight: 600;
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.act:hover {
  background: rgba(151, 206, 76, 0.15);
}
.close {
  border: 0;
  background: none;
  color: var(--text-mute);
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 4px;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.35s var(--ease);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
@media (max-width: 900px) {
  .toasts {
    bottom: 80px;
    right: 12px;
    left: 12px;
    align-items: stretch;
  }
  .toast {
    max-width: none;
  }
}
</style>
