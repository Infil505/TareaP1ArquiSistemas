<template>
  <!-- Cambia theme-blue por theme-rosso / theme-lime / theme-silver si quieres -->
  <div class="designers-container theme-blue">
    <header class="designers-header">
      <h1 class="designers-title">Diseñadores</h1>
      <p class="designers-subtitle">Los visionarios que dan forma al futuro del automóvil</p>
    </header>

    <div v-if="designers?.length" class="designers-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <article v-for="designer in designers" :key="designer._id" class="designer-card">
        <!-- Navegación robusta: por nombre (pages/designers/[slug].vue). Fallback a _path -->
        <NuxtLink :to="designerTo(designer)" class="designer-link" prefetch>
          <div class="designer-image-container">
            <img
              :src="designer.photo || '/images/default-designer.jpg'"
              :alt="`Foto de ${designer.name}`"
              class="designer-photo"
              loading="lazy"
              @error="handleImageError"
            />
            <div class="designer-overlay">
              <span class="view-profile">Ver perfil</span>
            </div>
          </div>

          <div class="designer-content">
            <h3 class="designer-name">{{ designer.name }}</h3>

            <div class="designer-meta">
              <span v-if="designer.country" class="badge">{{ designer.country }}</span>
              <span v-if="designer.specialty" class="badge specialty">{{ designer.specialty }}</span>
              <span v-if="designer.birth_year" class="badge age">
                {{ currentYear - designer.birth_year }} años
              </span>
            </div>

            <p v-if="designer.bio" class="designer-bio">{{ designer.bio }}</p>

            <div v-if="designer.notable_projects?.length" class="designer-projects">
              <span class="projects-label">Proyectos destacados:</span>
              <div class="projects-list">
                <span
                  v-for="(project, index) in designer.notable_projects.slice(0, 2)"
                  :key="index"
                  class="project-name"
                >
                  {{ project }}
                </span>
                <span v-if="designer.notable_projects.length > 2" class="project-more">
                  +{{ designer.notable_projects.length - 2 }} más
                </span>
              </div>
            </div>

            <div v-if="designer.models?.length" class="models-count">
              <span class="models-badge">
                {{ designer.models.length }} {{ designer.models.length === 1 ? 'modelo' : 'modelos' }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </article>
    </div>

    <div v-else-if="pending" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="opacity-60">Cargando diseñadores…</p>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">✏️</div>
      <p class="opacity-60">No hay diseñadores disponibles.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

// Meta
useHead({
  title: 'Diseñadores - Los Visionarios del Automóvil',
  meta: [
    { name: 'description', content: 'Descubre a los diseñadores más influyentes de la industria automotriz y sus creaciones más icónicas.' }
  ]
})

type Designer = {
  _id: string
  _path?: string
  slug: string
  name: string
  country?: string
  photo?: string
  bio?: string
  specialty?: string
  notable_projects?: string[]
  birth_year?: number
  awards?: string[]
  models?: string[]
}

const currentYear = new Date().getFullYear()

const { data: designers, pending, error } = await useAsyncData<Designer[]>(
  'designers',
  () => queryContent<Designer>('designers')
    .only(['_id', '_path', 'slug', 'name', 'country', 'photo', 'bio', 'specialty', 'notable_projects', 'birth_year', 'awards', 'models'])
    .sort({ name: 1 })
    .find()
)

// Routing helper
const designerTo = (d: Designer) => {
  if (d.slug) return { name: 'designers-slug', params: { slug: d.slug } }
  if (d._path) return d._path
  return '/designers'
}

// Fallback de imagen
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/images/default-designer.jpg'
}

// Overlay reactivo al mouse (—mx / —my)
let bound = false
const onMove = (e: MouseEvent) => {
  const cards = document.querySelectorAll<HTMLElement>('.designers-container .designer-card')
  cards.forEach(card => {
    const r = card.getBoundingClientRect()
    const mx = ((e.clientX - r.left) / r.width) * 100
    const my = ((e.clientY - r.top) / r.height) * 100
    card.style.setProperty('--mx', `${mx}%`)
    card.style.setProperty('--my', `${my}%`)
  })
}

onMounted(() => {
  if (typeof window !== 'undefined' && !bound) {
    window.addEventListener('mousemove', onMove, { passive: true })
    bound = true
  }
})

onBeforeUnmount(() => {
  if (bound) {
    window.removeEventListener('mousemove', onMove as EventListener)
    bound = false
  }
})

if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Error al cargar los diseñadores'
  })
}
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
.designers-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  color: var(--text-1);
  position: relative;
  isolation: isolate;
}
@media (min-width: 768px) { .designers-container { padding: 2rem; } }

/* =======================
   HEADER (fibra + halo del tema)
   ======================= */
.designers-header {
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
.designers-header::before{
  content:"";
  position:absolute; inset: -15% -25% auto -25%;
  height: 200px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
  filter: blur(24px);
  opacity:.5;
  transform: translateY(-12px);
}

.designers-title {
  font-size: clamp(2rem, 2rem + 2vw, 3rem);
  font-weight: 900;
  margin: 0 0 .6rem 0;
  letter-spacing: .3px;
  line-height: 1.05;
  color: var(--text-1);
  text-shadow: 0 2px 12px rgba(0,0,0,0.45);
  position: relative;
}
.designers-title::after{
  content:"";
  position:absolute; left:50%; transform:translateX(-50%);
  bottom:-10px; width: 180px; height: 3px; border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  box-shadow: 0 0 22px color-mix(in srgb, var(--accent) 45%, transparent);
}

.designers-subtitle {
  font-size: 1.05rem;
  color: var(--text-2);
  margin: 1.2rem auto 0;
  max-width: 760px;
  line-height: 1.6;
}

/* =======================
   GRID (fallback por si no hay Tailwind)
   ======================= */
.designers-grid { margin-bottom: 2rem; }
@media (min-width:1024px){
  .designers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
    gap: 1.5rem !important;
  }
}

/* =======================
   DESIGNER CARD
   ======================= */
.designer-card {
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--bg-elev), var(--bg-card));
  overflow: hidden;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease, background .25s ease;
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
}
.designer-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent);
  box-shadow: 0 16px 32px color-mix(in srgb, var(--accent) 26%, rgba(0,0,0,0.35));
}

.designer-link {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

/* Foto + overlay */
.designer-image-container {
  position: relative;
  height: 220px;
  background: #0a0b0d;
  overflow: hidden;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.designer-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: center;
  transition: transform .45s ease, filter .25s ease;
  filter: saturate(0.95);
}
.designer-card:hover .designer-photo {
  transform: scale(1.06);
  filter: saturate(1.05) contrast(1.02);
}

.designer-overlay {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  background:
    radial-gradient(240px 140px at var(--mx,50%) var(--my,75%), color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%),
    linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.35));
  opacity: 0;
  transition: opacity .25s ease;
  pointer-events: none;
}
.designer-card:hover .designer-overlay { opacity: 1; }

.view-profile {
  display: inline-block;
  font-size: .8rem;
  font-weight: 700;
  letter-spacing: .02em;
  padding: .4rem .7rem;
  border-radius: 999px;
  color: #0b0b0d;
  background: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 70%, #000);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--accent) 28%, rgba(0,0,0,0.35));
  transform: translateY(6px);
  transition: transform .25s ease, box-shadow .25s ease, background .25s ease;
}
.designer-card:hover .view-profile { transform: translateY(0); }

/* Contenido */
.designer-content {
  padding: 1rem 1.1rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: .55rem;
  flex: 1;
}

.designer-name {
  font-size: 1.15rem;
  font-weight: 850;
  margin: 0;
  letter-spacing: .2px;
}

.designer-meta {
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
.badge.specialty {
  background: var(--accent-2);
  color: #061218;
  border-color: color-mix(in srgb, var(--accent-2) 70%, #000);
}

.designer-bio {
  font-size: .9rem;
  color: var(--text-2);
  margin: .15rem 0 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;  /* 3 líneas */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Proyectos */
.designer-projects { margin-top: .4rem; }
.projects-label {
  display: inline-block;
  font-size: .72rem;
  color: var(--text-2);
  margin-right: .35rem;
}
.projects-list {
  display: inline-flex;
  gap: .4rem;
  flex-wrap: wrap;
}
.project-name {
  display: inline-block;
  font-size: .72rem;
  font-weight: 650;
  padding: .2rem .5rem;
  border-radius: 999px;
  color: var(--text-1);
  background: #1c1f26;
  border: 1px solid rgba(255,255,255,0.08);
}

/* Contador de modelos (tuya) */
.models-count { margin-top: .35rem; }
.models-badge {
  display: inline-block;
  font-size: .72rem;
  font-weight: 650;
  padding: .2rem .6rem;
  border-radius: 999px;
  color: var(--text-1);
  background: #1c1f26;
  border: 1px solid rgba(255,255,255,0.08);
}

/* =======================
   EMPTY / LOADING
   ======================= */
.loading-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-2);
}
.loading-spinner {
  width: 40px; height: 40px;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: var(--accent);
  border-radius: 50%;
  margin: 0 auto .75rem;
  animation: spin .9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-2);
  border: 1px dashed var(--line);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
}
.empty-icon {
  font-size: 2rem;
  opacity: .6;
  margin-bottom: .5rem;
}

/* =======================
   INTERACCIÓN
   ======================= */
.designer-link:focus-visible,
.view-profile:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 12px;
}

/* =======================
   REDUCED MOTION
   ======================= */
@media (prefers-reduced-motion: reduce) {
  .designer-card,
  .designer-photo,
  .designer-overlay,
  .view-profile { transition: none !important; }
}
</style>
