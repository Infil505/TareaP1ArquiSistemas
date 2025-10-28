<template>
  <div class="models-container theme-blue">
    <header class="models-header">
      <h1 class="models-title">Modelos</h1>
      <p class="models-subtitle">Explora nuestra colección de superdeportivos</p>
    </header>

    <div v-if="models?.length" class="models-grid">
      <article v-for="m in models" :key="m._id" class="model-card">
        <NuxtLink :to="`/models/${m.slug}`" class="card-link">
          <div class="card-image">
            <img
              :src="getImage(m)"
              :alt="m.name"
              loading="lazy"
              @error="onImgError"
            />
          </div>
          <div class="card-body">
            <h4 class="card-title">{{ m.name }}</h4>
            <div class="card-meta">
              <span v-if="m.year" class="chip">{{ m.year }}</span>
              <span v-if="m.power_hp" class="chip accent">{{ m.power_hp }} hp</span>
            </div>
            <p v-if="m.summary" class="card-summary">{{ m.summary }}</p>
          </div>
        </NuxtLink>
      </article>
    </div>

    <div v-else-if="pending" class="loading-state">
      <p>Cargando modelos…</p>
    </div>

    <div v-else class="empty-state">
      <p>No se encontraron modelos</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { listModels, toAssetUrl, type Model } from '~/lib/services/models'

// Normaliza imagen (URL directa o asset de Cockpit)
const getImage = (m: Model): string => {
  return toAssetUrl(m.image) || '/images/default-car.jpg'
}

const onImgError = (e: Event) => {
  (e.target as HTMLImageElement).src = '/images/default-car.jpg'
}

// ✅ listModels devuelve Model[] (no { entries })
const { data: models, pending } = await useAsyncData<Model[]>(
  'models',
  () => listModels({ limit: 99 })
)
</script>

<style scoped>
/* =======================
   THEME TOKENS BASE (garaje)
   ======================= */
:host,
:root {
  --bg-hero-1: #0f1013;
  --bg-hero-2: #0a0a0c;
  --bg-card: #111318;
  --bg-elev: #151821;
  --text-1: #f2f3f6;
  --text-2: #b3b6c3;
  --line: #232633;
  --fx-white: rgba(255, 255, 255, 0.12);

  /* Accents por defecto (Racing Blue) */
  --accent: #3b82f6;
  /* blue-500 */
  --accent-2: #06b6d4;
  /* cyan-500 */
}

/* =======================
   THEMES (cambia la clase en el contenedor)
   ======================= */
/* Racing Blue (default) */
.theme-blue {}

/* Rosso Corsa (rojo Ferrari + dorado cálido) */
.theme-rosso {
  --accent: #ff3131;
  /* rosso */
  --accent-2: #ffb703;
  /* dorado */
}

/* Electric Lime (verde neón + cian) */
.theme-lime {
  --accent: #a3e635;
  /* lime-400 */
  --accent-2: #22d3ee;
  /* cyan-400 */
}

/* GT Silver (plateado con azul hielo) */
.theme-silver {
  --bg-card: #14161a;
  --bg-elev: #1a1d23;
  --accent: #cbd5e1;
  /* slate-300 */
  --accent-2: #60a5fa;
  /* blue-400 */
}

/* =======================
   LAYOUT
   ======================= */
.models-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  color: var(--text-1);
  position: relative;
  isolation: isolate;
}

@media (min-width: 768px) {
  .models-container {
    padding: 2rem;
  }
}

/* =======================
   HEADER (fibra + halo del tema)
   ======================= */
.models-header {
  text-align: center;
  margin-bottom: 2.4rem;
  position: relative;
  border-radius: 20px;
  padding: 2rem 1rem 2.2rem;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  background:
    repeating-linear-gradient(45deg, #101216 0 2px, #0d0f12 2px 4px),
    linear-gradient(135deg, var(--bg-hero-1) 0%, var(--bg-hero-2) 55%, #07080a 100%);
}

.models-header::before {
  content: "";
  position: absolute;
  inset: -15% -25% auto -25%;
  height: 200px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .12), transparent);
  filter: blur(24px);
  opacity: .5;
  transform: translateY(-12px);
}

.models-title {
  font-size: clamp(2rem, 2rem + 2vw, 3rem);
  font-weight: 900;
  margin: 0 0 .6rem 0;
  letter-spacing: .3px;
  line-height: 1.05;
  color: var(--text-1);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
  position: relative;
}

.models-title::after {
  content: "";
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: -10px;
  width: 160px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  box-shadow: 0 0 22px color-mix(in srgb, var(--accent) 45%, transparent);
}

.models-subtitle {
  font-size: 1.05rem;
  color: var(--text-2);
  margin: 1.2rem auto 0;
  max-width: 720px;
  line-height: 1.6;
}

/* =======================
   GRID
   ======================= */
.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (min-width: 1024px) {
  .models-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

/* =======================
   CARD DE MODELO (usa --accent del tema)
   ======================= */
.model-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--bg-elev), var(--bg-card));
  overflow: hidden;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.model-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent);
  box-shadow: 0 16px 32px color-mix(in srgb, var(--accent) 26%, rgba(0, 0, 0, 0.35));
}

.card-link {
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
  height: 100%;
}

.card-image {
  height: 180px;
  background: #0a0b0d;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .35s ease;
}

.model-card:hover .card-image img {
  transform: scale(1.08);
}

.card-body {
  padding: 1rem 1.1rem 1.3rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 .5rem 0;
}

.card-meta {
  display: flex;
  gap: .5rem;
  margin-bottom: .75rem;
  flex-wrap: wrap;
}

.chip {
  font-size: .75rem;
  font-weight: 600;
  background: #1f2024;
  color: #d1d5db;
  padding: .2rem .6rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.chip.accent {
  background: var(--accent);
  color: #0b0b0d;
  border-color: color-mix(in srgb, var(--accent) 68%, #000);
}

/* =======================
   EMPTY / LOADING
   ======================= */
.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
  border: 1px dashed var(--line);
  border-radius: 16px;
  color: var(--text-2);
}

.loading-state p,
.empty-state p {
  font-size: 1.075rem;
}

/* =======================
   REDUCED MOTION
   ======================= */
@media (prefers-reduced-motion: reduce) {

  .model-card,
  .models-title::after {
    transition: none !important;
  }
}
</style>