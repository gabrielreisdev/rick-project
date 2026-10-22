<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'
</script>

<template>
  <div class="container not-found">
    <div class="portal-glitch">
      <span class="code mono">404</span>
      <div class="portal-hole" />
    </div>

    <h1>Dimensão Perdida</h1>
    <p class="desc">
      Morty, você configurou as coordenadas erradas da arma de portais! Essa página ou recurso não existe em nenhuma dimensão catalogada da Curva Central Finita.
    </p>

    <div class="actions">
      <RouterLink to="/" class="btn btn-primary">
        <AppIcon name="home" :size="16" /> Voltar ao Início
      </RouterLink>
      <RouterLink to="/characters" class="btn">
        <AppIcon name="users" :size="16" /> Ver Personagens
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
}

.portal-glitch {
  position: relative;
  width: 220px;
  height: 220px;
  display: grid;
  place-items: center;
  margin-bottom: 24px;
}

.portal-hole {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg, var(--portal-glow), var(--dead), var(--local), var(--portal));
  filter: blur(16px);
  animation: glitch-spin 4s linear infinite alternate;
  opacity: 0.8;
}

.code {
  position: relative;
  font-family: var(--display);
  font-size: 80px;
  color: #fff;
  text-shadow: 0 0 30px rgba(0, 0, 0, 0.9), 0 0 20px var(--portal);
  z-index: 2;
}

h1 {
  font-size: clamp(32px, 5vw, 44px);
  margin-bottom: 12px;
}

.desc {
  max-width: 480px;
  color: var(--text-dim);
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 28px;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

@keyframes glitch-spin {
  0% {
    transform: rotate(0deg) scale(0.95);
  }
  50% {
    transform: rotate(180deg) scale(1.05);
  }
  100% {
    transform: rotate(360deg) scale(0.95);
  }
}
</style>
