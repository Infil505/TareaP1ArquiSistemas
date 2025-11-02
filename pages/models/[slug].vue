<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getModelBySlug, getModelById, listModels } from '~/lib/services/models'
import type { Model as ServiceModel } from '~/lib/services/models'

/** Utils slug */
const slugify = (s: string) =>
  (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const safeSlugFrom = (m: { slug?: string; name: string }) =>
  slugify(m?.slug && m.slug.trim().length ? m.slug : m.name)

/** Fix de typos comunes */
const fixCommonSlugIssues = (s: string) => {
  if (s.startsWith('amborghini-')) return 'l' + s
  return s
}

/** ¿Parece _id de Cockpit? (24 hex) */
const looksLikeId = (v: string) => /^[a-f0-9]{24}$/i.test(v)

/** Tipos de la vista */
type ViewModel = ServiceModel & {
  _path?: string
  date?: string
  displayImage?: string
  engine?: string
  drivetrain?: string
  power_hp?: number
  top_speed_kmh?: number
  country?: string
  year?: number
  summary?: string
  body?: any
  manufacturer_slug?: string
  designer_slugs?: string[]
}

/** Parámetro de ruta: puede ser id o slug */
const route = useRoute()
const rawParam = Array.isArray(route.params.slug) ? route.params.slug[0] : (route.params.slug as string)
const normalizedSlug = fixCommonSlugIssues(slugify(decodeURIComponent(rawParam || '')))

/** Fallback de imagen */
const DEFAULT_GIF = 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif'

/** Carga por id → fallback a slug normalizado */
const { data: model, pending } = await useAsyncData<ViewModel | null>(
  `model-${rawParam}`,
  async () => {
    let m: ServiceModel | null = null
    if (looksLikeId(rawParam)) {
      m = await getModelById(rawParam)
      if (m) return m as ViewModel
    }
    m = await getModelBySlug(normalizedSlug)
    return m ? (m as ViewModel) : null
  }
)

/** Lista para navegación con slugs seguros */
type ModelForNav = Pick<ViewModel, '_path' | 'name' | 'slug' | 'year' | 'date'>
const { data: list } = await useAsyncData<ModelForNav[]>(
  'models-for-nav',
  async (): Promise<ModelForNav[]> => {
    const arr = await listModels({ limit: 99 })
    return arr.map(m => ({
      _path: (m as any)._path,
      name: m.name,
      slug: safeSlugFrom(m),
      year: m.year,
      date: (m as any).date
    }))
  }
)

const plainSummary = (raw?: string) => {
  if (!raw) return ''
  return raw
    .replace(/<\/?pre[^>]*>/g, '')
    .replace(/<\/?code[^>]*>/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<\/?[^>]+>/g, '') // elimina cualquier otra etiqueta HTML
    .trim()
}


/** Prev/Next: si entré por id, comparo contra el slug normalizado */
const keyForCompare = computed(() => (looksLikeId(rawParam) ? normalizedSlug : normalizedSlug))
const prev = computed(() => {
  const arr = list.value ?? []
  const i = arr.findIndex(d => d.slug === keyForCompare.value)
  return i > 0 ? arr[i - 1] : null
})
const next = computed(() => {
  const arr = list.value ?? []
  const i = arr.findIndex(d => d.slug === keyForCompare.value)
  return (i >= 0 && i < arr.length - 1) ? arr[i + 1] : null
})

/** Imagen */
const getImage = (m: ViewModel | null): string => {
  if (!m) return DEFAULT_GIF
  return (m as any).displayImage || DEFAULT_GIF
}
const onImgError = (e: Event) => { (e.target as HTMLImageElement).src = DEFAULT_GIF }

/** Parallax */
const stageEl = ref<HTMLElement | null>(null)
const onMove = (e: MouseEvent) => {
  const stage = stageEl.value; if (!stage) return
  const r = stage.getBoundingClientRect()
  const dx = (e.clientX - (r.left + r.width / 2)) / r.width
  const dy = (e.clientY - (r.top + r.height / 2)) / r.height
  stage.style.setProperty('--parx', String(dx))
  stage.style.setProperty('--pary', String(dy))
}
onMounted(() => window.addEventListener('mousemove', onMove))
onBeforeUnmount(() => window.removeEventListener('mousemove', onMove))

/** Debug */
console.log('[detail] rawParam:', rawParam, 'normalizedSlug:', normalizedSlug)
</script>



<template>
  <div class="detail-page">
    <header class="topbar">
      <NuxtLink to="/models" class="tb-back">⟵ Modelos</NuxtLink>
      <NuxtLink to="/" class="tb-home">🏠</NuxtLink>
    </header>

    <!-- LOADING -->
    <section v-if="pending" class="hero" aria-busy="true">
      <div class="hero-stage">
        <div class="glow"></div>
        <div class="car" style="width:80%;height:50vh;background:#111;border-radius:12px;"></div>
        <div class="shine"></div>
      </div>
      <div class="hero-overlay">
        <h1 class="title">Cargando…</h1>
        <p class="slogan">Preparando detalles del modelo</p>
      </div>
    </section>

    <!-- DATA -->
    <section v-else-if="model" class="hero">
      <div ref="stageEl" class="hero-stage">
        <div class="glow"></div>
        <img
          :src="getImage(model)"
          :alt="model?.name || 'Modelo'"
          class="car"
          loading="eager"
          decoding="async"
          @error="onImgError"
        />
        <div class="shine"></div>
      </div>

      <div class="hero-overlay">
        <h1 class="title">{{ model?.name }}</h1>
        <p class="slogan">La máquina que estabas esperando</p>
      </div>
    </section>

    <!-- EMPTY -->
    <section v-else class="hero">
      <div class="hero-stage">
        <div class="glow"></div>
        <div class="shine"></div>
      </div>
      <div class="hero-overlay">
        <h1 class="title">Modelo no encontrado</h1>
        <p class="slogan">Intenta volver al listado de modelos.</p>
      </div>
    </section>

    <!-- CONTENT -->
    <section class="content" v-if="model">
      <article>
        <p class="lead">{{ plainSummary(model?.summary) || 'Un superdeportivo que conquista miradas y corazones.' }}</p>
        <!-- Pasar el body al ContentRenderer -->
        <ContentRenderer v-if="model?.body" :value="model.body" class="cms" />
      </article>

      <aside class="specs">
        <h3>Especificaciones</h3>
        <ul>
          <li v-if="model?.engine">Motor: <strong>{{ model.engine }}</strong></li>
          <li v-if="model?.power_hp">Potencia: <strong>{{ model.power_hp }} HP</strong></li>
          <li v-if="model?.top_speed_kmh">Vel. Máxima: <strong>{{ model.top_speed_kmh }} km/h</strong></li>
          <li v-if="model?.drivetrain">Tracción: <strong>{{ model.drivetrain }}</strong></li>
          <li v-if="model?.country">Origen: <strong>{{ model.country }}</strong></li>
          <li v-if="model?.year">Año: <strong>{{ model.year }}</strong></li>
        </ul>

        <NuxtLink v-if="model?.manufacturer_slug" :to="`/manufacturers/${model.manufacturer_slug}`" class="buy-btn">
          Información del fabricante
        </NuxtLink>
        <NuxtLink v-if="model?.designer_slugs?.length" :to="`/designers/${model.designer_slugs[0]}`" class="buy-btn">
          Información del diseñador
        </NuxtLink>
      </aside>
    </section>

    <footer class="foot">
      <NuxtLink to="/" class="home">Volver al inicio</NuxtLink>
    </footer>
  </div>
</template>


<style scoped>
.detail-page {
  background: #0a0a0c;
  color: #f8f9fa;
  font-family: Montserrat, sans-serif;
  line-height: 1.6
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #222
}

.tb-back,
.tb-home {
  color: #ccc;
  text-decoration: none;
  font-weight: 700;
  transition: .3s
}

.tb-back:hover,
.tb-home:hover {
  color: #e83d4a
}

.tb-brand {
  font-weight: 900;
  letter-spacing: -1px;
  color: #fff
}

.tb-brand span {
  color: #e83d4a
}

.hero {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 90vh;
  overflow: hidden;
  background: linear-gradient(135deg, #111, #000)
}

.hero-stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  --parx: 0;
  --pary: 0
}

.hero-stage .car {
  max-width: 95%;
  height: auto;
  transform: translate3d(calc(var(--parx)*20px), calc(var(--pary)*20px), 0) scale(1.08);
  transition: transform 0.2s ease;
  filter: drop-shadow(0 40px 40px rgba(0, 0, 0, 0.7))
}

.hero-stage .glow {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 50%;
  background: radial-gradient(circle at center, rgba(232, 61, 74, 0.4), transparent);
  filter: blur(60px)
}

.hero-stage .shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, 0.12) 50%, transparent 70%);
  mix-blend-mode: overlay;
  animation: shine 6s infinite linear
}

.badge-sell {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: #e83d4a;
  padding: .6rem 1rem;
  border-radius: .5rem;
  font-weight: 700;
  animation: pulse 2s infinite;
  color: #fff
}

.hero-overlay {
  position: absolute;
  bottom: 12%;
  left: 8%;
  max-width: 40%
}

.title {
  font-size: clamp(2.8rem, 6vw, 5rem);
  font-weight: 900;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 4px 14px rgba(0, 0, 0, .8)
}

.slogan {
  font-size: 1.4rem;
  font-weight: 500;
  color: #eee;
  text-shadow: 0 2px 6px rgba(0, 0, 0, .6)
}

@keyframes shine {
  0% {
    transform: translateX(-100%)
  }

  100% {
    transform: translateX(100%)
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1
  }

  50% {
    opacity: .7
  }
}

.content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  padding: 3rem;
  max-width: 1300px;
  margin: auto
}

.lead {
  font-size: 1.3rem;
  color: #f1f1f1
}

.specs {
  background: #141418;
  padding: 1.8rem;
  border-radius: 1rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, .6)
}

.specs h3 {
  margin-bottom: 1rem;
  color: #e83d4a;
  font-size: 1.3rem;
  border-bottom: 2px solid #333;
  padding-bottom: .5rem
}

.specs ul {
  list-style: none;
  padding: 0;
  margin: 0
}

.specs li {
  margin: .6rem 0;
  color: #ddd;
  font-size: 1rem
}

.buy-btn {
  display: inline-block;
  margin-top: 1.2rem;
  padding: .9rem 1.4rem;
  background: #e83d4a;
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  border-radius: .3rem;
  transition: .3s
}

.buy-btn:hover {
  background: #c42d39
}

.foot {
  text-align: center;
  padding: 1rem;
  border-top: 1px solid #222;
  background: #0f1116
}

.home {
  color: #aaa;
  text-decoration: none;
  font-weight: 700;
  transition: .3s
}

.home:hover {
  color: #e83d4a
}

.detail-page {
  color: #eef2fb
}

/* Mejora de contraste tipográfico */
.title {
  color: #ffffff;
  text-shadow: 0 8px 24px rgba(0, 0, 0, .6), 0 2px 6px rgba(0, 0, 0, .45)
}

.slogan {
  color: #f1f4ff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, .55)
}

.hero-overlay {
  background: linear-gradient(90deg, rgba(12, 13, 16, .65), rgba(12, 13, 16, .25));
  backdrop-filter: blur(4px) saturate(130%);
  padding: .6rem 1rem;
  border-radius: .6rem;
  box-shadow: 0 6px 24px rgba(0, 0, 0, .35)
}

/* Texto del artículo más legible en dark */
.lead {
  color: #e6eaf6
}

.content {
  --ink: #e9edf7
}

.content article,
.content .specs {
  color: var(--ink)
}

.cms :deep(p) {
  color: #e9edf7;
  line-height: 1.78;
  font-size: 1.06rem
}

.cms :deep(h1),
.cms :deep(h2),
.cms :deep(h3) {
  color: #ffffff
}

.cms :deep(h2),
.cms :deep(h3) {
  border-bottom: 1px solid rgba(255, 255, 255, .12)
}

.cms :deep(li) {
  color: #dfe6f8
}

.cms :deep(strong) {
  color: #ffffff
}

.cms :deep(em) {
  color: #f0f3ff
}

/* Enlaces visibles y elegantes */
.cms :deep(a) {
  color: #ff8592;
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 133, 146, .45);
  transition: color .2s, border-color .2s
}

.cms :deep(a:hover) {
  color: #ffc2c8;
  border-color: rgba(255, 194, 200, .8)
}

/* Panel de especificaciones con más contraste */
.specs {
  background: linear-gradient(180deg, #141823, #0f121a);
  box-shadow: 0 10px 30px rgba(0, 0, 0, .35)
}

.specs h3 {
  color: #ffd8dc
}

.specs li {
  color: #e7ebf7
}

.specs strong {
  color: #ffffff
}

/* Barra superior y botones más visibles */
.tb-back,
.tb-home {
  color: #cdd3e6
}

.tb-back:hover,
.tb-home:hover {
  color: #ffd0d6
}

.btn.primary {
  box-shadow: 0 10px 24px rgba(232, 61, 74, .35)
}

.btn.ghost {
  color: #e7ebf7;
  border-color: rgba(255, 255, 255, .18)
}

/* Mini ajustes de imagen para protagonismo */
.hero-stage .car {
  filter: drop-shadow(0 36px 36px rgba(0, 0, 0, .65));
}

.hero-stage .glow {
  background: radial-gradient(circle at 50% 60%, rgba(255, 99, 115, .35), transparent 60%)
}

/* Nav inferior */
.foot {
  color: #d6dbef
}

.home {
  color: #e7ebf7
}

.home:hover {
  color: #ffd0d6
}

/* Accesibilidad: foco visible */
:focus-visible {
  outline: 2px solid #ff8592;
  outline-offset: 2px;
  border-radius: .25rem
}
</style>
