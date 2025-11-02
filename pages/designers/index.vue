<template>
  <div class="designers-container theme-blue">
    <header class="designers-header">
      <h1 class="designers-title">Diseñadores</h1>
      <p class="designers-subtitle">
        Los visionarios que dan forma al futuro del automóvil
      </p>
    </header>

    <!-- Usamos designersById para asegurar que todos tienen _id -->
    <div v-if="designersById.length" class="designers-grid">
      <article
        v-for="d in designersById"
        :key="d._id"
        class="designer-card"
      >
        <NuxtLink
          :to="`/designers/${d._id}`"
          class="designer-link"
        >
          <div class="designer-image-container">
            <img
              :src="getPhoto(d)"
              :alt="`Foto de ${d.name}`"
              class="designer-photo"
              loading="lazy"
              decoding="async"
              @error="handleImageError"
            />
          </div>

          <div class="designer-content">
            <h3 class="designer-name">{{ d.name }}</h3>
            <div class="designer-meta">
              <span v-if="d.country" class="badge">{{ d.country }}</span>
            </div>
            <p v-if="d.bio" class="designer-bio">
              {{ cleanText(d.bio) }}
            </p>
          </div>
        </NuxtLink>
      </article>
    </div>

    <div v-else-if="pending" class="loading-state">
      <p class="opacity-60">Cargando diseñadores…</p>
    </div>

    <div v-else class="empty-state">
      <p class="opacity-60">No hay diseñadores disponibles.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { computed } from 'vue'
import { listDesigners, toAssetUrl, type Designer as ServiceDesigner } from '~/lib/services/designers'

/* ---------- Tipo extendido (igual patrón) ---------- */
type Designer = ServiceDesigner & {
  _id?: string
  displayPhoto?: string
  bio?: string
  country?: string
}

/* ---------- Imagen con fallback ---------- */
const DEFAULT_PHOTO = 'https://i.pinimg.com/736x/58/ad/74/58ad7495a514a5fc9e052e4a38ff6141.jpg'
const getPhoto = (d: Designer): string =>
  d.displayPhoto || toAssetUrl(d.photo as any) || DEFAULT_PHOTO

const handleImageError = (e: Event) => {
  (e.target as HTMLImageElement).src = DEFAULT_PHOTO
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
const { data: designers, pending } = await useAsyncData<Designer[]>(
  'designers',
  () => listDesigners({ limit: 99 }) as unknown as Promise<Designer[]>
)

/* ---------- Solo con _id (para navegar por id) ---------- */
const designersById = computed(() => (designers?.value ?? []).filter(d => !!d._id))
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
  --accent: #3b82f6;
  --accent-2: #06b6d4;
}

/* THEMES */
.theme-blue {}
.theme-rosso { --accent:#ff3131; --accent-2:#ffb703; }
.theme-lime  { --accent:#a3e635; --accent-2:#22d3ee; }
.theme-silver{ --bg-card:#14161a; --bg-elev:#1a1d23; --accent:#cbd5e1; --accent-2:#60a5fa; }

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
   HEADER
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
   GRID
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
   CARD
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

/* Área de imagen */
.designer-image-container {
  height: 140px;
  background: linear-gradient(180deg, #0c0d10, #0f1013);
  display: grid;
  place-items: center;
  overflow: hidden;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.designer-card:hover .designer-image-container {
  background:
    radial-gradient(260px 120px at 50% 20%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 60%),
    linear-gradient(180deg, #0c0d10, #0f1013);
}

.designer-photo {
  max-width: 100%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.35));
  transition: transform .35s ease;
}
.designer-card:hover .designer-photo { transform: scale(1.05); }

/* Contenido */
.designer-content {
  padding: 1rem 1.1rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: .5rem;
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

.designer-bio {
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
   REDUCED MOTION
   ======================= */
@media (prefers-reduced-motion: reduce) {
  .designer-card,
  .designers-title::after { transition: none !important; }
}
</style>
