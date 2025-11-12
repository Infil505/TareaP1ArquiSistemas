<template>
  <div class="manufacturers-container theme-blue">
    <header class="manufacturers-header">
      <h1 class="manufacturers-title">Fabricantes</h1>
      <p class="manufacturers-subtitle">
        Conoce las marcas más prestigiosas del mundo automotriz
      </p>
    </header>

    <div v-if="manufacturers?.length" class="manufacturers-grid">
      <article
        v-for="m in manufacturers"
        :key="m._id || safeSlugFrom(m)"
        class="manufacturer-card"
      >
        <NuxtLink
          :to="`/manufacturers/${m._id || safeSlugFrom(m)}`"
          class="manufacturer-link"
        >
          <div class="manufacturer-image-container">
            <img
              :src="getLogo(m)"
              :alt="`Logo de ${m.name}`"
              class="manufacturer-logo"
              loading="lazy"
              @error="handleImageError"
            />
          </div>

          <div class="manufacturer-content">
            <h3 class="manufacturer-name">{{ m.name }}</h3>
            <div class="manufacturer-meta">
              <span v-if="m.country" class="badge">{{ m.country }}</span>
              <span v-if="m.founded" class="badge">Fundado: {{ m.founded }}</span>
            </div>
            <p v-if="m.bio" class="manufacturer-bio">
              {{ cleanText(m.bio) }}
            </p>
          </div>
        </NuxtLink>
      </article>
    </div>

    <div v-else-if="pending" class="loading-state">
      <p class="opacity-60">Cargando fabricantes…</p>
    </div>

    <div v-else class="empty-state">
      <p class="opacity-60">No hay fabricantes disponibles.</p>
    </div>

    <!-- SECCIÓN DE COMENTARIOS -->
    <section class="comments-section">
      <div class="comments-header">
        <h2 class="comments-title">💬 Comentarios</h2>
        <p class="comments-subtitle">
          Comparte tu opinión sobre los fabricantes automotrices
        </p>
      </div>
      
      <Utterances 
        repo="Infil505/TareaP1ArquiSistemas"
        theme="photon-dark"
        issue-term="pathname"
        label="fabricantes"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { listManufacturers, toAssetUrl, type Manufacturer as ServiceManufacturer } from '~/lib/services/manufacturers'

/* ---------- Helpers de slug ---------- */
const slugify = (s: string) =>
  (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const safeSlugFrom = (m: { slug?: string; name: string }) =>
  slugify(m?.slug && m.slug.trim().length ? m.slug : m.name)

/* ---------- Tipo extendido ---------- */
type Manufacturer = ServiceManufacturer & {
  _id?: string
  displayLogo?: string
  bio?: string
  founded?: number
  country?: string
}

/* ---------- Imagen con fallback ---------- */
const DEFAULT_GIF = 'https://i.pinimg.com/originals/a8/28/88/a828888852e708d9afaaad06c7f9513f.gif'

const getLogo = (m: Manufacturer): string => {
  return (
    m.displayLogo ||
    toAssetUrl(m.logo) ||
    DEFAULT_GIF
  )
}

const handleImageError = (e: Event) => {
  (e.target as HTMLImageElement).src = DEFAULT_GIF
}

/* ---------- Limpieza del texto ---------- */
const cleanText = (s?: string) => {
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
const { data: manufacturers, pending } = await useAsyncData<Manufacturer[]>(
  'manufacturers',
  () => listManufacturers({ limit: 99 }) as unknown as Promise<Manufacturer[]>
)
</script>


<style scoped>
/* =======================
   THEME TOKENS BASE
   ======================= */
:host, :root {
  --bg-hero-1: #0f1013;
  --bg-hero-2: #0a0a0c;
  --bg-card: #111318;
  --bg-elev: #151821;
  --text-1: #f2f3f6;
  --text-2: #b3b6c3;
  --line: #232633;
  --fx-white: rgba(255,255,255,0.12);

  /* Accents por defecto (Racing Blue) */
  --accent: #3b82f6;   /* blue-500 */
  --accent-2: #06b6d4; /* cyan-500 */
}

/* THEMES */
/* Blue (default) */ .theme-blue {}
/* Rosso Corsa */ .theme-rosso { --accent:#ff3131; --accent-2:#ffb703; }
/* Electric Lime */ .theme-lime { --accent:#a3e635; --accent-2:#22d3ee; }
/* GT Silver */ .theme-silver { --bg-card:#14161a; --bg-elev:#1a1d23; --accent:#cbd5e1; --accent-2:#60a5fa; }

/* =======================
   LAYOUT
   ======================= */
.manufacturers-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  color: var(--text-1);
  position: relative;
  isolation: isolate;
}
@media (min-width: 768px) { .manufacturers-container { padding: 2rem; } }

/* =======================
   HEADER (fibra + halo del tema)
   ======================= */
.manufacturers-header {
  text-align: center;
  margin-bottom: 2.4rem;
  position: relative;
  border-radius: 20px;
  padding: 2rem 1rem 2.2rem;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0,0,0,0.35);
  background:
    repeating-linear-gradient(45deg, #101216 0 2px, #0d0f12 2px 4px),
    linear-gradient(135deg, var(--bg-hero-1) 0%, var(--bg-hero-2) 55%, #07080a 100%);
}
.manufacturers-header::before{
  content:"";
  position:absolute; inset: -15% -25% auto -25%;
  height: 200px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
  filter: blur(24px);
  opacity:.5;
  transform: translateY(-12px);
}

.manufacturers-title {
  font-size: clamp(2rem, 2rem + 2vw, 3rem);
  font-weight: 900;
  margin: 0 0 .6rem 0;
  letter-spacing: .3px;
  line-height: 1.05;
  color: var(--text-1);
  text-shadow: 0 2px 12px rgba(0,0,0,0.45);
  position: relative;
}
.manufacturers-title::after{
  content:"";
  position:absolute; left:50%; transform:translateX(-50%);
  bottom:-10px; width: 170px; height: 3px; border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  box-shadow: 0 0 22px color-mix(in srgb, var(--accent) 45%, transparent);
}

.manufacturers-subtitle {
  font-size: 1.05rem;
  color: var(--text-2);
  margin: 1.2rem auto 0;
  max-width: 760px;
  line-height: 1.6;
}

/* =======================
   GRID (fallback por si no hay Tailwind)
   ======================= */
.manufacturers-grid { margin-bottom: 2rem; }
@media (min-width:1024px){
  .manufacturers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
    gap: 1.5rem !important;
  }
}

/* =======================
   MANUFACTURER CARD
   ======================= */
.manufacturer-card {
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--bg-elev), var(--bg-card));
  overflow: hidden;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease, background .25s ease;
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
}
.manufacturer-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent);
  box-shadow: 0 16px 32px color-mix(in srgb, var(--accent) 26%, rgba(0,0,0,0.35));
}

.manufacturer-link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

/* Área de logo */
.manufacturer-image-container {
  height: 140px;
  background: linear-gradient(180deg, #0c0d10, #0f1013);
  display: grid;
  place-items: center;
  overflow: hidden;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.manufacturer-card:hover .manufacturer-image-container {
  background:
    radial-gradient(260px 120px at 50% 20%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 60%),
    linear-gradient(180deg, #0c0d10, #0f1013);
}

.manufacturer-logo {
  max-width: 70%;
  max-height: 90px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.35));
  transition: transform .35s ease;
}
.manufacturer-card:hover .manufacturer-logo { transform: scale(1.05); }

/* Contenido */
.manufacturer-content {
  padding: 1rem 1.1rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: .5rem;
  flex: 1;
}

.manufacturer-name {
  font-size: 1.15rem;
  font-weight: 850;
  margin: 0;
  letter-spacing: .2px;
}

.manufacturer-meta {
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-block;
  font-size: .75rem;
  font-weight: 650;
  padding: .22rem .55rem;
  border-radius: 999px;
  color: #0b0b0d;
  background: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 70%, #000);
}
.badge + .badge {
  background: var(--accent-2);
  border-color: color-mix(in srgb, var(--accent-2) 70%, #000);
  color: #071317;
}

.manufacturer-bio {
  font-size: .9rem;
  color: var(--text-2);
  margin: .25rem 0 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* =======================
   EMPTY / LOADING
   ======================= */
.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  border: 1px dashed var(--line);
  border-radius: 16px;
  color: var(--text-2);
}
.loading-state p,
.empty-state p { font-size: 1.075rem; }

/* =======================
   SECCIÓN DE COMENTARIOS
   ======================= */
.comments-section {
  margin-top: 4rem;
  padding: 2rem 1.5rem;
  border-radius: 20px;
  background: linear-gradient(180deg, var(--bg-elev), var(--bg-card));
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 24px rgba(0,0,0,0.25);
}

.comments-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.comments-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.5rem 0;
  color: var(--text-1);
  letter-spacing: 0.3px;
}

.comments-subtitle {
  font-size: 0.95rem;
  color: var(--text-2);
  margin: 0;
  line-height: 1.5;
}

/* =======================
   REDUCED MOTION
   ======================= */
@media (prefers-reduced-motion: reduce) {
  .manufacturer-card,
  .manufacturers-title::after { transition: none !important; }
}
</style>