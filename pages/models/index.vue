<template>
  <div class="models-container theme-blue">
    <header class="models-header">
      <h1 class="models-title">Modelos</h1>
      <p class="models-subtitle">Explora nuestra colección de superdeportivos</p>
    </header>

    <div v-if="models?.length" class="models-grid">
      <article
        v-for="m in models"
        :key="m._id || safeSlugFrom(m)"
        class="model-card"
      >
        <!-- 👉 navega por ID si existe; si no, slug seguro -->
        <NuxtLink
          :to="`/models/${m._id || safeSlugFrom(m)}`"
          class="card-link"
        >
          <div class="card-image">
            <img
              :src="getImage(m)"
              :alt="m.name"
              loading="lazy"
              decoding="async"
              @error="onImgError"
            />
          </div>
          <div class="card-body">
            <h4 class="card-title">{{ m.name }}</h4>
            <div class="card-meta">
              <span v-if="m.year" class="chip">{{ m.year }}</span>
              <span v-if="m.power_hp" class="chip accent">{{ m.power_hp }} hp</span>
            </div>
            <p v-if="m.summary" class="card-summary">
              {{ summarize(m.summary) }}
            </p>
          </div>
        </NuxtLink>

        <!-- 👉 Zona de precio + botón agregar al carrito (igual que en Home) -->
        <div class="card-actions">
          <span v-if="m.price" class="price-chip">
            ₡{{ formatPrice(m.price) }}
          </span>
          <span v-else class="price-chip price-unavailable">
            Consultar precio
          </span>

          <button
            v-if="m.price && m.price > 0"
            class="snipcart-add-item add-to-cart-btn"
            :data-item-id="m._id || safeSlugFrom(m)"
            :data-item-name="m.name"
            :data-item-price="m.price"
            :data-item-url="`/models/${m._id || safeSlugFrom(m)}`"
            :data-item-image="getImage(m)"
            :data-item-description="summarize(m.summary) || 'Superdeportivo exclusivo'"
          >
            🛒 Agregar
          </button>
          <button
            v-else
            class="add-to-cart-btn disabled"
            disabled
            title="Precio no disponible"
          >
            No disponible
          </button>
        </div>
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
import { useAsyncData } from 'nuxt/app'
import { listModels, toAssetUrl, type Model as ServiceModel } from '~/lib/services/models'

/* ---------- Helpers de slug (coherentes con Home) ---------- */
const slugify = (s: string) =>
  (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const safeSlugFrom = (m: { slug?: string; name: string }) =>
  slugify(m?.slug && m.slug.trim().length ? m.slug : m.name)

/* ---------- Tipo de vista ---------- */
type Model = ServiceModel & {
  _id?: string
  displayImage?: string
  year?: number
  power_hp?: number
  summary?: string
  price?: number
}

/* ---------- Formatear precio (igual que en Home) ---------- */
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
}

/* ---------- Imagen con fallback ---------- */
type AssetLike = string | { path?: string } | null | undefined
const DEFAULT_GIF = 'https://i.pinimg.com/originals/a8/28/88/a828888852e708d9afaaad06c7f9513f.gif'

const getImage = (m: Model): string => {
  return (m.displayImage && m.displayImage.length)
    ? m.displayImage
    : (toAssetUrl(m.image as AssetLike) || toAssetUrl(m.img as AssetLike) || DEFAULT_GIF)
}

const onImgError = (e: Event) => {
  (e.target as HTMLImageElement).src = DEFAULT_GIF
}

/* ---------- Limpiar summaries con HTML/markdown ---------- */
const summarize = (s?: string) => {
  if (!s) return ''
  return s
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<\/?pre[^>]*>/g, '')
    .replace(/<\/?code[^>]*>/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<\/?[^>]+>/g, '')
    .trim()
}

/* ---------- Datos ---------- */
const { data: models, pending } = await useAsyncData<Model[]>(
  'models',
  () => listModels({ limit: 99 }) as unknown as Promise<Model[]>
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
  --accent: #3b82f6;
  --accent-2: #06b6d4;
}

.theme-blue {}

.theme-rosso {
  --accent: #ff3131;
  --accent-2: #ffb703;
}

.theme-lime {
  --accent: #a3e635;
  --accent-2: #22d3ee;
}

.theme-silver {
  --bg-card: #14161a;
  --bg-elev: #1a1d23;
  --accent: #cbd5e1;
  --accent-2: #60a5fa;
}

.models-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  color: var(--text-1);
  position: relative;
  isolation: isolate;
}

@media (min-width:768px) {
  .models-container {
    padding: 2rem;
  }
}

.models-header {
  text-align: center;
  margin-bottom: 2.4rem;
  position: relative;
  border-radius: 20px;
  padding: 2rem 1rem 2.2rem;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, .35);
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
  margin: 0 0 .6rem;
  letter-spacing: .3px;
  line-height: 1.05;
  color: var(--text-1);
  text-shadow: 0 2px 12px rgba(0, 0, 0, .45);
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

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

@media (min-width:1024px) {
  .models-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

.model-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--bg-elev), var(--bg-card));
  overflow: hidden;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, .25);
  display: flex;
  flex-direction: column;
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
  flex: 1;
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
  margin: 0 0 .5rem;
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

/* ---------- Acciones de la tarjeta (precio + botón carrito) ---------- */
.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.1rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, transparent, rgba(245, 179, 1, 0.03));
  gap: 0.5rem;
}

.price-chip {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f5b301; /* mantengo mismo feeling dorado del home */
  white-space: nowrap;
}

.price-unavailable {
  font-size: 0.8rem;
  color: var(--text-2);
  font-weight: 600;
}

.add-to-cart-btn {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: none;
  background: #f5b301;
  color: #0a0b0d;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  box-shadow: 0 4px 12px rgba(245, 179, 1, 0.3);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.add-to-cart-btn:hover:not(.disabled) {
  background: #ffc940;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 179, 1, 0.4);
}

.add-to-cart-btn:active:not(.disabled) {
  transform: translateY(0);
}

.add-to-cart-btn.disabled {
  background: #2a2b30;
  color: #6b6c72;
  cursor: not-allowed;
  box-shadow: none;
}

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

/* Responsive: botón ocupa todo el ancho en móvil */
@media (max-width: 768px) {
  .card-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .add-to-cart-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (prefers-reduced-motion: reduce) {

  .model-card,
  .models-title::after {
    transition: none !important;
  }
}
</style>
