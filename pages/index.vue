<template>
  <div class="home-container">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Catálogo de automóviles superdeportivos</h1>
        <p class="hero-description">
          Explora modelos (entidad principal) y navega hacia sus fabricantes y diseñadores (entidades secundarias).
          Las entidades están enlazadas mediante referencias.
        </p>
        
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
        <NuxtLink to="/models/models" class="nav-card models-card">
          <div class="nav-icon">🏎</div>
          <h4>Modelos</h4>
          <p>Explora nuestra colección completa de Superdeportivos</p>
        </NuxtLink>
        
        <NuxtLink to="/manufacturers/manufacturers" class="nav-card manufacturers-card">
          <div class="nav-icon">🏭</div>
          <h4>Fabricantes</h4>
          <p>Conoce las marcas más prestigiosas del mundo</p>
        </NuxtLink>
        
        <NuxtLink to="/designers/designer" class="nav-card designers-card">
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
        <NuxtLink to="/models" class="view-all-link">
          Ver todos los modelos →
        </NuxtLink>
      </div>

      <div v-if="featuredModels?.length" class="featured-grid">
        <article
          v-for="m in featuredModels"
          :key="m._id"
          class="model-card"
        >
          <NuxtLink :to="m._path" class="card-link">
            <div class="card-image">
              <img :src="m.image" :alt="m.name" loading="lazy" />
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
        <p class="opacity-60">Cargando modelos destacados…</p>
      </div>

      <div v-else class="empty-state">
        <p class="opacity-60">No hay modelos disponibles</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Tipo mínimo para los modelos
type Model = {
  _id: string
  _path: string
  slug: string
  name: string
  year?: number
  image?: string
  summary?: string
  power_hp?: number
}

// Tipo para estadísticas básicas
type BasicEntity = {
  _id: string
  slug: string
  name: string
}

// Traer modelos destacados
const { data: models, pending } = await useAsyncData<Model[]>(
  'home-models',
  () => queryContent<Model>('models')
    .only(['_id','_path','slug','name','year','image','summary','power_hp'])
    .sort({ power_hp: -1, year: -1 })
    .limit(6)
    .find()
)

// Conteos para estadísticas
const { data: allModels } = await useAsyncData<BasicEntity[]>('models-count', () =>
  queryContent<BasicEntity>('models').only(['_id','slug','name']).find()
)

const { data: manufacturers } = await useAsyncData<BasicEntity[]>('manufacturers-count', () =>
  queryContent<BasicEntity>('manufacturers').only(['_id','slug','name']).find()
)

const { data: designers } = await useAsyncData<BasicEntity[]>('designers-count', () =>
  queryContent<BasicEntity>('designers').only(['_id','slug','name']).find()
)

const featuredModels = computed(() => models.value ?? [])
const totalModels = computed(() => allModels.value?.length ?? 0)
const totalManufacturers = computed(() => manufacturers.value?.length ?? 0)
const totalDesigners = computed(() => designers.value?.length ?? 0)

/* ===========================
   Efecto spotlight opcional (sigue el mouse)
   =========================== */
if (typeof window !== 'undefined') {
  const onMove = (e: MouseEvent) => {
    const cards = document.querySelectorAll<HTMLElement>('.navigation-grid .nav-card')
    cards.forEach(card => {
      const r = card.getBoundingClientRect()
      const mx = ((e.clientX - r.left) / r.width) * 100
      const my = ((e.clientY - r.top) / r.height) * 100
      card.style.setProperty('--mx', `${mx}%`)
      card.style.setProperty('--my', `${my}%`)
    })
  }

  window.addEventListener('mousemove', onMove)
}
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
  --accent: #f5b301;   /* ámbar deportivo */
  --accent-2: #ff3b3b; /* rojo pinza de freno */
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
   HERO (fibra + pista + corte diagonal)
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
    /* fibra de carbono */
    repeating-linear-gradient(45deg, #101216 0 2px, #0d0f12 2px 4px),
    linear-gradient(135deg, var(--bg-hero-1) 0%, var(--bg-hero-2) 55%, #07080a 100%);
}

/* “destello de pista” */
.hero-section::before{
  content:"";
  position:absolute; inset: -20% -30% auto -30%;
  height: 260px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
  filter: blur(28px);
  opacity:.5;
  transform: translateY(-18px);
}

/* separador diagonal inferior tipo splitter */
.hero-section::after{
  content:"";
  position:absolute; left:0; right:0; bottom:-1px; height: 42px;
  background:
    linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(250, 190, 40, .07) 70%, rgba(250, 190, 40, .2) 100%),
    linear-gradient(  6deg, transparent 0 50%, rgba(255,255,255,0.03) 50% 100%);
}

/* contenido hero */
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

/* subrayado de potencia */
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
   STATS (odómetro/cluster)
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

@keyframes odometer {
  from { transform: translateY(6%); opacity: .85;}
  to   { transform: translateY(0);   opacity: 1;}
}

.stat-number {
  font-variant-numeric: tabular-nums;
  font-size: 2.4rem;
  font-weight: 900;
  margin-bottom: 0.2rem;
  color: var(--accent);
  text-shadow: 0 1px 0 rgba(0,0,0,0.4);
  animation: odometer .45s ease-out both;
}

.stat-label {
  font-size: .72rem;
  color: var(--text-2);
  letter-spacing: .12em;
  text-transform: uppercase;
}

/* =======================
   FEATURED + CARDS
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
  display: inline-flex; align-items: center; gap:.25rem;
  border-bottom: 1px dashed transparent;
  transition: color .18s ease, border-color .18s ease, transform .18s ease;
}
.view-all-link:hover { color:#ffc940; border-color:#ffc940; transform: translateX(2px); }

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Card de modelo */
.model-card {
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  background: linear-gradient(180deg, #15161a, #0f1013);
  overflow: hidden;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
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
  color: #d1d5db;
}

.card-summary {
  font-size: .875rem;
  color: #a1a1aa;
  line-height: 1.45;
  margin: 0;
  flex-grow: 1;
}

/* =======================
   NAVIGATION CARDS (neón + spotlight + micro-tilt)
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
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
  overflow: hidden;
  transform-style: preserve-3d;
}

/* borde neón dinámico */
.nav-card::before{
  content:"";
  position:absolute; inset:0; border-radius:inherit; padding:1px;
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

/* spotlight */
.nav-card::after{
  content:"";
  position:absolute; inset:-10% -10%;
  background: radial-gradient(200px 120px at var(--mx,50%) var(--my,50%), rgba(255,255,255,.08), transparent 60%);
  opacity: 0;
  transition: opacity .2s ease;
  pointer-events:none;
}

.nav-card:hover {
  transform: translateY(-4px) rotateX(0.6deg);
  box-shadow: 0 20px 44px rgba(0,0,0,0.28);
  border-color: rgba(245,179,1,0.55);
}
.nav-card:hover::before{ opacity:.6; }
.nav-card:hover::after{ opacity:.9; }

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

/* halos por tarjeta */
.models-card:hover { box-shadow: 0 24px 56px rgba(245,179,1,.28); }
.manufacturers-card:hover { box-shadow: 0 24px 56px rgba(139,92,246,.28); }
.designers-card:hover { box-shadow: 0 24px 56px rgba(236,72,153,.28); }

/* =======================
   EMPTY / LOADING
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
}

/* =======================
   INTERACCIÓN / ACCESIBILIDAD
   ======================= */
.view-all-link:focus-visible,
.nav-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 18px;
}

/* Spotlight con posición del mouse (para desktop) */
@media (pointer:fine) {
  .navigation-grid .nav-card {
    --mx: 50%; --my: 50%;
  }
  .navigation-grid .nav-card:hover {
    cursor: pointer;
  }
}

/* =======================
   RESPONSIVE
   ======================= */
@media (max-width: 768px) {
  .section-header { flex-direction: column; gap: .9rem; text-align: center; }
  .hero-section { margin: -1rem -1rem 2rem; padding: 2.4rem 0 3.2rem; }
  .stats-grid { gap: .85rem; }
  .stat-number { font-size: 2.05rem; }
}

/* =======================
   REDUCED MOTION
   ======================= */
@media (prefers-reduced-motion: reduce) {
  .stat-item,
  .nav-card,
  .view-all-link { transition: none !important; }
  .nav-card:hover { transform: none; }
}
</style>