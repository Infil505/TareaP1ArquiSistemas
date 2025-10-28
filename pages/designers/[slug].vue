<!-- pages/designers/[slug].vue -->
<template>
  <div class="designer-container">
    <!-- Loading -->
    <div v-if="pending" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="opacity-60">Cargando perfil…</p>
    </div>

    <!-- Not found -->
    <div v-else-if="!designer">
      <h1>Diseñador no encontrado</h1>
      <NuxtLink to="/designers" class="home-button inline-block">← Volver a Diseñadores</NuxtLink>
    </div>

    <!-- Content -->
    <div v-else class="designer-wrapper">
      <!-- HERO: Imagen del diseñador absolutamente protagonista -->
      <header class="designer-hero" :style="heroStyle">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="hero-left">
            <h1 class="hero-name">{{ designer.name }}</h1>
            <div class="hero-meta">
              <span v-if="designer.country" class="pill">{{ designer.country }}</span>
              <span v-if="designer.birth_year" class="pill">{{ age }} años</span>
            </div>
            <p v-if="designer.bio" class="hero-bio">{{ designer.bio }}</p>
            <NuxtLink to="/designers" class="btn-ghost">← Volver</NuxtLink>
          </div>
          <!-- Retrato visible en móviles o si el fondo no funciona bien -->
          <div class="hero-portrait" v-if="designer.photo">
            <img :src="photoUrl" :alt="`Foto de ${designer.name}`" @error="onImgError" />
          </div>
        </div>
        <div class="hero-stripe" aria-hidden="true"></div>
      </header>

      <!-- Trayectoria (Markdown) -->
      <section v-if="designer.body" class="section">
        <h2 class="section-title">Trayectoria</h2>
        <ContentRenderer :value="designer" class="prose" />
      </section>

      <!-- MODELOS — ÚNICA SECCIÓN ENFOCADA (sin duplicar) -->
      <section v-if="models?.length" class="models-section section">
        <div class="models-head">
          <h2 class="section-title">Modelos diseñados</h2>
          <span class="models-badge">{{ models.length }} {{ models.length === 1 ? 'modelo' : 'modelos' }}</span>
        </div>

        <div class="models-grid">
          <NuxtLink v-for="(m, idx) in models" :key="m._id" :to="m._path" class="mcard" :class="{ hero: idx === 0 }">
            <div class="m-media">
              <img :src="m.imageUrl || '/images/default-car.jpg'" :alt="m.name" @error="onImgErrorModel" />
              <div class="m-gradient"></div>
              <div class="m-caption">
                <h3>{{ m.name }}</h3>
                <p class="m-meta">
                  <span v-if="m.year">{{ m.year }}</span>
                  <span v-if="m.country"> • {{ m.country }}</span>
                </p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createError, useAsyncData } from 'nuxt/app'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '#imports'
import { getDesignerBySlug } from '~/lib/services/designers'
import { listModels } from '~/lib/services/models'

const BASE = import.meta.env.VITE_COCKPIT_BASE_URL?.replace(/\/$/, '') || ''

const toAssetUrl = (v: unknown): string => {
  if (!v) return ''
  if (typeof v === 'string') return v
  const obj = v as { path?: string }
  return obj?.path ? (obj.path.startsWith('/') ? `${BASE}${obj.path}` : `${BASE}/${obj.path}`) : ''
}

type Designer = {
  _id: string; slug: string; name: string;
  country?: string; photo?: string | { path?: string };
  bio?: string; birth_year?: number; models?: string[]; body?: any
}

type Model = {
  _id: string; slug: string; name: string;
  year?: number; image?: string | { path?: string };
  summary?: string; country?: string;
  _path?: string; imageUrl?: string
}

const route = useRoute()
const slug = route.params.slug as string
const currentYear = new Date().getFullYear()

const { data: designer, pending, error } = await useAsyncData<Designer | null>(
  `designer-${slug}`,
  async () => await getDesignerBySlug(slug)
)

if (error.value) throw createError({ statusCode: 500, statusMessage: 'Error al cargar el diseñador' })

// ✅ foto normalizada a string para usar en :src y background
const photoUrl = computed<string>(() => toAssetUrl(designer.value?.photo))

// Modelos del diseñador, con imageUrl string + _path
const { data: models } = await useAsyncData<Model[]>(
  `designer-models-${slug}`,
  async () => {
    const order = designer.value?.models || []
    if (!order.length) return []

    const res = await listModels({ limit: 999 }) as { entries: Model[] }
    const all = (res.entries || []).map(m => ({
      ...m,
      imageUrl: toAssetUrl(m.image),
      _path: `/models/${m.slug}`
    }))

    const index = new Map(order.map((s, i) => [s, i]))
    return all
      .filter(m => index.has(m.slug))
      .sort((a, b) => {
        const ai = index.get(a.slug) ?? 9999
        const bi = index.get(b.slug) ?? 9999
        if (ai !== bi) return ai - bi
        return (b.year || 0) - (a.year || 0)
      })
  }
)

const age = computed(() =>
  designer.value?.birth_year ? currentYear - (designer.value.birth_year as number) : undefined
)

const onImgError = (e: Event) => { (e.target as HTMLImageElement).src = '/images/default-designer.jpg' }
const onImgErrorModel = (e: Event) => { (e.target as HTMLImageElement).src = '/images/default-car.jpg' }

// HERO background con la foto del diseñador (string garantizado)
const heroStyle = computed(() => ({
  backgroundImage: `url(${photoUrl.value || '/images/default-designer.jpg'})`
}))

useHead(() => ({
  title: designer.value ? `${designer.value.name} - Diseñador` : 'Diseñador',
  meta: [{ name: 'description', content: designer.value?.bio || 'Perfil de diseñador automotriz' }]
}))
</script>


<style scoped>
/* Container */
.designer-container{max-width:1200px;margin:0 auto;padding:0 1rem}
@media (min-width:768px){.designer-container{padding:0 2rem}}

/* Loading */
.loading-state{text-align:center;padding:4rem 1rem}
.loading-spinner{width:40px;height:40px;border:3px solid #f3f4f6;border-top:3px solid #667eea;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1rem}
@keyframes spin{to{transform:rotate(360deg)}}

/* HERO protagonista (imagen gigante) */
.designer-hero{position:relative;min-height:58vh;border-radius:16px;overflow:hidden;display:grid;align-items:end;background-size:cover;background-position:center;isolation:isolate}
.hero-overlay{position:absolute;inset:0;background:radial-gradient(120% 90% at 20% 30%, rgba(0,0,0,.45), rgba(0,0,0,.72));}
.hero-content{position:relative;display:grid;grid-template-columns:1.1fr .9fr;gap:1rem;align-items:end;padding:1.2rem}
.hero-left{backdrop-filter:blur(2px)}
.hero-name{margin:0 0 .25rem 0;font-size:clamp(2.2rem,2vw + 2rem,3.6rem);line-height:1.05;font-weight:900;color:#fff;text-shadow:0 8px 22px rgba(0,0,0,.55)}
.hero-meta{display:flex;flex-wrap:wrap;gap:.45rem;margin:.2rem 0 .6rem}
.pill{border:1px solid rgba(255,255,255,.3);color:#fff;background:rgba(255,255,255,.12);padding:.32rem .6rem;border-radius:999px;font-weight:800;font-size:.82rem;backdrop-filter:blur(2px)}
.hero-bio{max-width:70ch;color:#eef2ff;opacity:.95}
.btn-ghost{display:inline-flex;margin-top:.6rem;padding:.55rem .9rem;border-radius:.6rem;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.18);color:#fff;text-decoration:none;font-weight:800}
.btn-ghost:hover{background:rgba(0,0,0,.45)}

/* Retrato (apoya el foco en persona, útil en móvil) */
.hero-portrait{justify-self:end;align-self:end;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(4px);border-radius:14px;padding:.6rem;display:none}
.hero-portrait img{display:block;width:min(320px,40vw);max-height:46vh;object-fit:cover;border-radius:10px}

.hero-stripe{position:absolute;left:0;right:0;bottom:0;height:12px;background:repeating-linear-gradient(135deg, rgba(255,255,255,.18) 0 16px, transparent 16px 32px);mix-blend-mode:overlay}

@media (max-width: 900px){
  .hero-content{grid-template-columns:1fr}
  .hero-portrait{display:block;justify-self:start;margin-top:.6rem}
}

/* Secciones */
.section{margin-top:2rem}
.section-title{font-weight:900;font-size:1.25rem}
.prose :deep(ul){list-style:disc;margin-left:1.25rem}
.prose :deep(h2){font-weight:800}

/* MODELOS — grid con tarjeta hero */
.models-section .models-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:.8rem}
.models-badge{display:inline-block;padding:.25rem .75rem;background:linear-gradient(135deg,#dbeafe,#3b82f6);color:#1e40af;border-radius:9999px;font-size:.75rem;font-weight:800}
.models-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:.8rem}
.mcard{position:relative;display:block;border-radius:14px;overflow:hidden;text-decoration:none;color:#fff;background:#0b1220}
.mcard.hero{grid-column:span 12;min-height:360px}
.mcard:not(.hero){grid-column:span 6;min-height:220px}
@media (max-width:900px){.mcard.hero{grid-column:span 12;min-height:280px}.mcard:not(.hero){grid-column:span 12}}
.m-media{position:relative;width:100%;height:100%}
.m-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.02);transition:transform .5s ease}
.mcard:hover .m-media img{transform:scale(1.06)}
.m-gradient{position:absolute;inset:0;background:linear-gradient(0deg, rgba(0,0,0,.65), rgba(0,0,0,.15));opacity:.95}
.m-caption{position:absolute;left:.9rem;right:.9rem;bottom:.9rem}
.m-caption h3{margin:0 0 .2rem 0;font-weight:900;letter-spacing:.01em;color:#fff;font-size:clamp(1.1rem,1rem+1vw,1.6rem)}
.m-meta{margin:0;opacity:.9}
</style>
