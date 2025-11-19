<template>
  <div class="home-container">
    <!-- Componente Snipcart (se carga una sola vez, solo en el cliente) -->
    <ClientOnly>
      <SnipcartLoader />
    </ClientOnly>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Catálogo de automóviles superdeportivos</h1>
        <p class="hero-description">
          Explora modelos (entidad principal) y navega hacia sus fabricantes y diseñadores (entidades secundarias).
          Las entidades están enlazadas mediante referencias.
        </p>

        <!-- Botón para abrir el carrito de Snipcart -->
        <div class="hero-actions">
          <button class="snipcart-checkout cart-btn">
            🛒 Ver carrito (<span class="snipcart-items-count">0</span>)
          </button>
        </div>

        <!-- Quick Stats -->
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">{{ totalModels }}</span>
            <span class="stat-label">Modelos</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ totalManufacturers }}</span>
            <span class="stat-label">Fabricantes</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ totalDesigners }}</span>
            <span class="stat-label">Diseñadores</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Navigation -->
    <section class="navigation-section">
      <h3 class="navigation-title">Explorar por categoría</h3>
      <div class="navigation-grid">
        <NuxtLink to="/models" class="nav-card models-card">
          <div class="nav-icon">🏎</div>
          <h4>Modelos</h4>
          <p>Explora nuestra colección completa de Superdeportivos</p>
        </NuxtLink>

        <NuxtLink to="/manufacturers" class="nav-card manufacturers-card">
          <div class="nav-icon">🏭</div>
          <h4>Fabricantes</h4>
          <p>Conoce las marcas más prestigiosas del mundo</p>
        </NuxtLink>

        <NuxtLink to="/designers" class="nav-card designers-card">
          <div class="nav-icon">✏</div>
          <h4>Diseñadores</h4>
          <p>Los visionarios detrás de estas máquinas</p>
        </NuxtLink>
      </div>
    </section>

    <!-- Featured Models Section -->
    <section class="featured-section">
      <div class="section-header">
        <h2 class="section-title">Modelos destacados</h2>
        <NuxtLink to="/models" class="view-all-link">Ver todos los modelos →</NuxtLink>
      </div>

      <div v-if="featuredModels?.length" class="featured-grid">
        <article
          v-for="m in featuredModels"
          :key="m._id || m.slug || m.name"
          class="model-card"
        >
          <NuxtLink :to="`/models/${m._id || safeSlugFrom(m)}`" class="card-link">
            <div class="card-image">
              <img
                :src="getImage(m)"
                :alt="m.name"
                loading="lazy"
                decoding="async"
                sizes="(min-width:1024px) 33vw, 100vw"
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

          <!-- Zona de precio + botón agregar al carrito -->
          <div class="card-actions">
            <span v-if="m.price" class="price-chip">
              {{ formatPrice(m.price) }}
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

      <div v-else-if="pendingFeatured" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Cargando modelos destacados…</p>
      </div>

      <div v-else class="empty-state">
        <p>No hay modelos disponibles en este momento</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { computed } from 'vue'
import SnipcartLoader from '~/components/SnipcartProvider.vue'
import { listModels, toAssetUrl } from '~/lib/services/models'
import type { Model as ServiceModel } from '~/lib/services/models'

// ── Helpers de slug ─────────────────────────────────────────────
const slugify = (s: string) =>
  (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const safeSlugFrom = (m: { slug?: string; name: string }) =>
  slugify(m?.slug && m.slug.trim().length ? m.slug : m.name)

// ── Tipos de vista ──────────────────────────────────────────────
type Model = ServiceModel & {
  _id?: string
  displayImage?: string
  year?: number
  power_hp?: number
  summary?: string
  price?: number
}

// ── Formatear precio ────────────────────────────────────────────
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
}

// ── Imagen con fallback ─────────────────────────────────────────
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

// ── Limpiar summaries con HTML/markdown ─────────────────────────
const summarize = (s?: string) => {
  if (!s) return ''
  const cleaned = s
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<\/?pre[^>]*>/g, '')
    .replace(/<\/?code[^>]*>/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<\/?[^>]+>/g, '')
    .trim()

  return cleaned.slice(0, 120) + (cleaned.length > 120 ? '...' : '')
}

// ── Datos: destacados y conteos ─────────────────────────────────
const { data: featuredModels, pending: pendingFeatured } = await useAsyncData<Model[]>(
  'home-featured-models',
  () => listModels({ sort: { power_hp: -1, year: -1 }, limit: 6 }) as unknown as Promise<Model[]>
)

const { data: allModels } = await useAsyncData<Model[]>(
  'home-models-count',
  () => listModels({ limit: 1000 }) as unknown as Promise<Model[]>
)

// lazy imports para evitar cargar servicios si no hacen falta
const { data: allManufacturers } = await useAsyncData<any[]>(
  'home-manufacturers-count',
  () => import('~/lib/services/manufacturers').then(m => m.listManufacturers({ limit: 1000 }))
)

const { data: allDesigners } = await useAsyncData<any[]>(
  'home-designers-count',
  () => import('~/lib/services/designers').then(d => d.listDesigners({ limit: 1000 }))
)

const totalModels = computed(() => allModels.value?.length ?? 0)
const totalManufacturers = computed(() => allManufacturers.value?.length ?? 0)
const totalDesigners = computed(() => allDesigners.value?.length ?? 0)
</script>

<style scoped>
/* =======================
   THEME TOKENS (Auto garage)
   ======================= */
:root,
:host {
  --bg-page: #0a0b0d;
  --bg-hero-1: #0f1013;
  --bg-hero-2: #0a0a0c;
  --bg-card: #111318;
  --bg-elev: #151821;
  --text-1: #f2f3f6;
  --text-2: #b3b6c3;
  --line: #232633;
  --accent: #f5b301;
  --accent-2: #ff3b3b;
  --fx-white: rgba(255,255,255,0.12);
}

/* Página */
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  color: var(--text-1);
  background: transparent;
  position: relative;
  isolation: isolate;
}

/* =======================
   HERO
   ======================= */
.hero-section {
  position: relative;
  text-align: center;
  padding: 3.5rem 0 5rem;
  margin: -1rem -1rem 3rem -1rem;
  color: var(--text-1);
  border-radius:28px;
  overflow: hidden;
  box-shadow: 0 18px 50px rgba(0,0,0,0.45);
  background:
    repeating-linear-gradient(45deg, #101216 0 2px, #0d0f12 2px 4px),
    linear-gradient(135deg, var(--bg-hero-1) 0%, var(--bg-hero-2) 55%, #07080a 100%);
}

.hero-section::before{
  content:"";
  position:absolute; inset: -20% -30% auto -30%;
  height: 260px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
  filter: blur(28px);
  opacity:.5;
  transform: translateY(-18px);
}

.hero-section::after{
  content:"";
  position:absolute; left:0; right:0; bottom:-1px; height: 42px;
  background:
    linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(250, 190, 40, .07) 70%, rgba(250, 190, 40, .2) 100%),
    linear-gradient(6deg, transparent 0 50%, rgba(255,255,255,0.03) 50% 100%);
}

.hero-content {
  max-width: 820px;
  margin: 0 auto;
  padding: 0 1rem;
}

.hero-title {
  font-size: clamp(2.1rem, 2.3rem + 2.2vw, 3.6rem);
  font-weight: 900;
  letter-spacing: 0.3px;
  line-height: 1.04;
  margin: 0 0 1.1rem 0;
  text-shadow: 0 2px 12px rgba(0,0,0,0.45);
  position: relative;
}

.hero-title::after{
  content:"";
  position:absolute; left:50%; transform:translateX(-50%);
  bottom:-10px; width: 180px; height: 3px; border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  box-shadow: 0 0 22px rgba(245,179,1,.35);
}

.hero-description {
  font-size: 1.075rem;
  color: var(--text-2);
  margin: 1.75rem auto 2.4rem;
  line-height: 1.7;
}

/* =======================
   CART BUTTON
   ======================= */
.hero-actions {
  margin: 0 auto 1.6rem;
  display: flex;
  justify-content: center;
}

.cart-btn {
  padding: 0.65rem 1.5rem;
  border-radius: 999px;
  border: 2px solid var(--accent);
  background: rgba(245, 179, 1, 0.15);
  color: var(--accent);
  font-weight: 700;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(245, 179, 1, 0.2);
}

.cart-btn:hover {
  background: var(--accent);
  color: #0a0b0d;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(245, 179, 1, 0.4);
}

.cart-btn:active {
  transform: translateY(0);
}

/* =======================
   STATS
   ======================= */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(90px, 1fr));
  gap: 1.1rem;
  max-width: 460px;
  margin: 0 auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
    linear-gradient(180deg, var(--bg-card), var(--bg-elev));
  border: 1px solid var(--fx-white);
  backdrop-filter: blur(6px);
  padding: .95rem .75rem;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03), 0 10px 28px rgba(0,0,0,0.22);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  position: relative;
  overflow: hidden;
}

.stat-item::after{
  content:"";
  position:absolute; inset: 0;
  background: radial-gradient(120px 40px at 50% -10px, rgba(255,255,255,.18), transparent 70%);
  opacity:.4;
  pointer-events:none;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(0,0,0,0.28);
  border-color: rgba(255,255,255,0.18);
}

.stat-number {
  font-variant-numeric: tabular-nums;
  font-size: 2.4rem;
  font-weight: 900;
  margin-bottom: 0.2rem;
  color: var(--accent);
  text-shadow: 0 1px 0 rgba(0,0,0,0.4);
}

.stat-label {
  font-size: .72rem;
  color: var(--text-2);
  letter-spacing: .12em;
  text-transform: uppercase;
}

/* =======================
   FEATURED SECTION
   ======================= */
.featured-section { margin-bottom: 4rem; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .75rem;
  margin-bottom: 1.7rem;
}

.section-title {
  font-size: 1.9rem;
  font-weight: 850;
  letter-spacing: .2px;
  margin: 0;
}

.view-all-link {
  color: var(--accent);
  font-weight: 750;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap:.25rem;
  border-bottom: 1px dashed transparent;
  transition: all .18s ease;
}

.view-all-link:hover {
  color:#ffc940;
  border-color:#ffc940;
  transform: translateX(2px);
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* =======================
   MODEL CARDS
   ======================= */
.model-card {
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  background: linear-gradient(180deg, #15161a, #0f1013);
  overflow: hidden;
  transition: all .25s ease;
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
}

.model-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent);
  box-shadow: 0 16px 32px rgba(0,0,0,0.35);
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
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 800;
  margin: 0 0 .5rem 0;
  color: #d1d5db;
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
  border: 1px solid rgba(255,255,255,0.1);
}

.chip.accent {
  background: var(--accent);
  color: #0b0b0d;
  border-color: #d19b00;
}

.card-summary {
  font-size: .875rem;
  color: #a1a1aa;
  line-height: 1.45;
  margin: 0;
  flex: 1;
}

/* =======================
   CARD ACTIONS
   ======================= */
.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.1rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.41);
  background: linear-gradient(180deg, transparent, rgba(230, 228, 224, 0.658));
  gap: 0.5rem;
}

.price-chip {
  font-size: 0.95rem;
  font-weight: 700;
  color: #f5b301;
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
  background: var(--accent);
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

/* =======================
   NAVIGATION
   ======================= */
.navigation-section { margin-bottom: 3rem; }

.navigation-title {
  font-size: 1.45rem;
  font-weight: 850;
  text-align: center;
  margin-bottom: 1.4rem;
}

.navigation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(264px, 1fr));
  gap: 1.25rem;
}

.nav-card {
  position: relative;
  display: block;
  padding: 2rem;
  border-radius: 18px;
  color: var(--text-1);
  text-decoration: none;
  text-align: center;
  background: linear-gradient(180deg, var(--bg-card), var(--bg-elev));
  border: 1px solid var(--line);
  box-shadow: 0 12px 28px rgba(0,0,0,0.18);
  transition: all 180ms ease;
  overflow: hidden;
}

.nav-card::before{
  content:"";
  position:absolute;
  inset:0;
  border-radius:inherit;
  padding:1px;
  background: conic-gradient(from 180deg at 50% 50%, rgba(245,179,1,.55), rgba(255,59,59,.4), rgba(245,179,1,.55));
  -webkit-mask: 
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask: 
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events:none;
  opacity:.28;
  transition: opacity .18s ease;
}

.nav-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 44px rgba(0,0,0,0.28);
  border-color: rgba(245,179,1,0.55);
}

.nav-card:hover::before {
  opacity:.6;
}

.nav-icon {
  font-size: 2.7rem;
  margin-bottom: .65rem;
  filter: drop-shadow(0 6px 14px rgba(0,0,0,.25));
}

.nav-card h4 {
  font-size: 1.22rem;
  font-weight: 850;
  margin: 0 0 .45rem 0;
  letter-spacing: .2px;
}

.nav-card p {
  color: var(--text-2);
  margin: 0;
  line-height: 1.55;
}

/* =======================
   LOADING & EMPTY STATES
   ======================= */
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.loading-state p,
.empty-state p {
  font-size: 1.075rem;
  color: var(--text-2);
  margin: 0.5rem 0 0 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 3px solid rgba(245, 179, 1, 0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =======================
   RESPONSIVE
   ======================= */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: .9rem;
    text-align: center;
  }
  
  .hero-section {
    margin: -1rem -1rem 2rem;
    padding: 2.4rem 0 3.2rem;
  }
  
  .stats-grid {
    gap: .85rem;
  }
  
  .stat-number {
    font-size: 2.05rem;
  }

  .card-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .add-to-cart-btn {
    width: 100%;
    justify-content: center;
  }
}

/* =======================
   REDUCED MOTION
   ======================= */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
