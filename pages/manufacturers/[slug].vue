<template>
  <div class="manufacturer-detail-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <NuxtLink to="manufacturers" class="home-button">← Volver a Fabricantes</NuxtLink>
    </nav>

    <!-- BRAND HERO llamativo -->
    <section v-if="featuredModel && featuredModel.image" class="brand-hero">
      <div class="bh-bg" :style="{ backgroundImage: `url(${featuredModel.image})` }"></div>
      <div class="bh-overlay"></div>
      <div class="bh-content">
        <div class="bh-left">
          <div class="bh-logo" v-if="maker?.logo">
            <img :src="maker.logo" :alt="`Logo de ${maker.name}`" />
          </div>
          <h1 class="bh-title">{{ maker?.name }}</h1>
          <p v-if="maker?.bio" class="bh-tag">{{ maker.bio }}</p>
          <div class="bh-meta">
            <span v-if="maker?.country" class="pill">{{ maker.country }}</span>
            <span v-if="maker?.founded" class="pill">Desde {{ maker.founded }}</span>
            <span v-if="maker?.headquarters" class="pill">{{ maker.headquarters }}</span>
          </div>
        </div>
        <NuxtLink :to="featuredModel._path" class="bh-right">
          <div class="bh-badge">Modelo destacado</div>
          <h2 class="bh-model">{{ featuredModel.name }}</h2>
          <div class="bh-specs">
            <span v-if="featuredModel.year">Año {{ featuredModel.year }}</span>
            <span v-if="featuredModel.power_hp">{{ featuredModel.power_hp }} HP</span>
          </div>
        </NuxtLink>
      </div>
      <div class="bh-stripe" aria-hidden="true"></div>
    </section>

    <div v-if="maker" class="manufacturer-detail">
      <!-- Header -->
      <header class="manufacturer-header">
        <div class="manufacturer-logo-container">
          <img :src="maker.logo" :alt="`Logo de ${maker.name}`" class="manufacturer-logo" loading="eager" />
        </div>
        <div class="manufacturer-info">
          <h1 class="manufacturer-name">{{ maker.name }}</h1>
          <div class="manufacturer-meta">
            <span v-if="maker.country" class="badge country-badge">{{ maker.country }}</span>
            <span v-if="maker.founded" class="badge founded-badge">Fundado: {{ maker.founded }}</span>
            <span v-if="maker.headquarters" class="badge">{{ maker.headquarters }}</span>
          </div>
          <p v-if="maker.bio" class="manufacturer-bio">{{ maker.bio }}</p>
          <div v-if="maker.website || maker.employees" class="additional-info">
            <div v-if="maker.website" class="info-item">
              <span class="info-label">Sitio web:</span>
              <a :href="maker.website" target="_blank" rel="noopener" class="info-link">{{ cleanUrl(maker.website) }}</a>
            </div>
            <div v-if="maker.employees" class="info-item">
              <span class="info-label">Empleados:</span>
              <span class="info-value">{{ maker.employees.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- FEATURED MODEL / HERO DESTACADO -->
      <section v-if="featuredModel" class="featured-model">
        <div class="fm-hero">
          <img :src="featuredModel.image" :alt="featuredModel.name" class="fm-hero-img" />
          <div class="fm-overlay">
            <h2 class="fm-kicker">Modelo destacado</h2>
            <NuxtLink :to="featuredModel._path" class="fm-name">{{ featuredModel.name }}</NuxtLink>
            <div class="fm-meta">
              <span v-if="featuredModel.year" class="pill">Año {{ featuredModel.year }}</span>
              <span v-if="featuredModel.power_hp" class="pill">{{ featuredModel.power_hp }} HP</span>
            </div>
            <p v-if="featuredModel.summary" class="fm-summary">{{ featuredModel.summary }}</p>
            <NuxtLink :to="featuredModel._path" class="fm-cta">Explorar modelo</NuxtLink>
          </div>
        </div>
      </section>

      <!-- Cuerpo del fabricante -->
      <!-- FEATURED MODEL / TARJETA (fallback sin imagen para hero) -->
      <section v-if="featuredModel && !featuredModel.image" class="featured-model">
        <div class="fm-media">
          <img :src="featuredModel.image" :alt="featuredModel.name" />
        </div>
        <div class="fm-info">
          <h2 class="fm-title">Modelo destacado</h2>
          <NuxtLink :to="featuredModel._path" class="fm-name">{{ featuredModel.name }}</NuxtLink>
          <div class="fm-meta">
            <span v-if="featuredModel.year" class="pill">Año {{ featuredModel.year }}</span>
            <span v-if="featuredModel.power_hp" class="pill">{{ featuredModel.power_hp }} HP</span>
          </div>
          <p v-if="featuredModel.summary" class="fm-summary">{{ featuredModel.summary }}</p>
          <NuxtLink :to="featuredModel._path" class="fm-cta">Ver modelo</NuxtLink>
        </div>
      </section>


      <div v-if="maker.body" class="manufacturer-content">
        <ContentRenderer :value="maker" />
      </div>

    </div>

    <div v-else-if="pending" class="loading-state"><div class="loading-spinner"></div><p>Cargando información del fabricante…</p></div>
    <div v-else class="error-state"><div class="error-icon">❌</div><h2>Fabricante no encontrado</h2><p>No se pudo encontrar información sobre este fabricante.</p><NuxtLink to="/manufacturers" class="back-button">Volver a fabricantes</NuxtLink></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from 'nuxt/app'
import { getManufacturerBySlug, type Manufacturer } from '~/lib/services/manufacturers'
import { listModels, type Model } from '~/lib/services/models'

// 👇 Extiende el tipo base para incluir los campos usados en esta vista
type ManufacturerExt = Manufacturer & {
  models?: string[]
  featured_model?: string
}

const slug = useRoute().params.slug as string

// Detalle del fabricante (usa el tipo extendido)
const { data: maker, pending } = await useAsyncData<ManufacturerExt | null>(
  `manufacturer-${slug}`,
  () => getManufacturerBySlug(slug) as Promise<ManufacturerExt | null>
)

// Modelos del fabricante (filtra por slugs que vengan del manufacturer)
const { data: models } = await useAsyncData<Model[]>(
  `manufacturer-models-${slug}`,
  async () => {
    const slugs = maker.value?.models ?? []
    if (!slugs.length) return []
    const all = await listModels({ limit: 1000 }) // listModels -> Model[]
    return all
      .filter(m => slugs.includes(m.slug))
      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
  },
  { watch: [maker] }
)

// Modelo destacado
const featuredModel = computed<Model | null>(() => {
  const list = models.value ?? []
  if (!list.length) return null

  // usa featured_model si existe
  const byFeatured = maker.value?.featured_model
    ? list.find(m => m.slug === maker.value!.featured_model) ?? null
    : null
  if (byFeatured) return byFeatured

  // sino, el más nuevo con imagen; si no, el primero
  const newestWithImg = list
    .filter(m => !!m.image)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0]

  return newestWithImg ?? list[0] ?? null
})

const cleanUrl = (u?: string) => (u ? u.replace(/^https?:\/\//, '') : '')
</script>


<style scoped>
.manufacturer-detail-container{max-width:1200px;margin:0 auto;padding:1rem}
.breadcrumb{margin-bottom:1.25rem}
.home-button{color:#8aa4ff;text-decoration:none;font-weight:700}
.home-button:hover{color:#b3c2ff}

.manufacturer-header{display:grid;grid-template-columns:220px 1fr;gap:2rem;margin-bottom:2rem}
.manufacturer-logo{width:100%;max-height:160px;object-fit:contain;border-radius:12px;background:#fff;padding:1rem;border:1px solid #e5e7eb}
.manufacturer-name{font-size:clamp(2rem,2.2rem+1vw,2.8rem);font-weight:900;margin:0 0 .75rem}
.manufacturer-meta{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem}
.manufacturer-bio{font-size:1.1rem;line-height:1.7;opacity:.9}

/* Hero destacado */
.featured-model{margin:2rem 0;position:relative}
.fm-hero{position:relative;overflow:hidden;border-radius:16px;box-shadow:0 15px 40px rgba(0,0,0,.35)}
.fm-hero-img{width:100%;height:500px;object-fit:cover;display:block;transition:transform .6s ease}
.fm-hero:hover .fm-hero-img{transform:scale(1.05)}
.fm-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.65),rgba(0,0,0,.1));display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:2rem;color:#fff}
.fm-kicker{text-transform:uppercase;font-size:.9rem;letter-spacing:.15em;color:#ff9aa2;margin-bottom:.5rem}
.fm-name{font-size:clamp(1.8rem,1.5rem+2vw,3rem);font-weight:900;text-decoration:none;color:#fff;margin-bottom:.5rem;text-shadow:0 4px 16px rgba(0,0,0,.6)}
.fm-name:hover{color:#ffd0d6}
.fm-meta{display:flex;gap:.5rem;margin-bottom:.75rem}
.pill{background:rgba(255,255,255,.15);padding:.4rem .8rem;border-radius:999px;font-weight:700;font-size:.85rem;backdrop-filter:blur(4px)}
.fm-summary{max-width:600px;font-size:1.05rem;line-height:1.6;margin-bottom:1rem;text-shadow:0 2px 8px rgba(0,0,0,.55)}
.fm-cta{background:#e83d4a;color:#fff;text-decoration:none;padding:.75rem 1.5rem;border-radius:.6rem;font-weight:800;box-shadow:0 10px 20px rgba(232,61,74,.45);transition:background .3s}
.fm-cta:hover{background:#ff5566}

.manufacturer-content{margin:2rem 0}

/* Grid modelos */
.models-section{margin-top:2rem}
.section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem}
.section-title{font-size:1.5rem;font-weight:900}
.models-count{background:#eef2ff;color:#4956a6;padding:.25rem .7rem;border-radius:999px;font-weight:700;font-size:.9rem}
.models-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem}
.model-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;transition:transform .25s, box-shadow .25s}
.model-card:hover{transform:translateY(-4px);box-shadow:0 14px 28px rgba(0,0,0,.15)}
.model-image{height:160px;background:#f9fafb;overflow:hidden}
.model-image img{width:100%;height:100%;object-fit:cover;transition:transform .4s ease}
.model-card:hover .model-image img{transform:scale(1.08)}
.model-info{padding:1rem}
.model-name{font-size:1.2rem;font-weight:800;margin:0 0 .5rem}
.model-meta{display:flex;gap:.6rem;margin-bottom:.5rem}
.model-year,.model-power{background:#eef2ff;color:#374151;padding:.3rem .6rem;border-radius:4px;font-size:.75rem;font-weight:700}
.model-summary{font-size:.9rem;opacity:.8;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

/* Badges */
.badge{padding:.25rem .7rem;border-radius:9999px;border:1px solid #d1d5db;font-size:.75rem;font-weight:700;background:#f8fafc}
.country-badge{background:linear-gradient(135deg,#ddd6fe,#8b5cf6);color:#fff;border:0}
.founded-badge{background:linear-gradient(135deg,#fef3c7,#fbbf24);color:#92400e;border:0}

/* States */
.loading-models,.no-models,.loading-state,.error-state{text-align:center;padding:3rem 1rem}
.no-models-icon,.error-icon{font-size:3rem;margin-bottom:1rem;opacity:.3}
.no-models-text{opacity:.6}
.loading-spinner{width:40px;height:40px;border:3px solid #f3f4f6;border-top:3px solid #667eea;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 1rem}
@keyframes spin{to{transform:rotate(360deg)}}
.back-button{display:inline-block;margin-top:1rem;padding:.75rem 1.2rem;background:#667eea;color:#fff;text-decoration:none;border-radius:8px}
.back-button:hover{background:#5566dd}

/* Responsive */
@media (max-width: 900px){
  .manufacturer-header{grid-template-columns:1fr;text-align:center}
  .manufacturer-logo{max-width:200px;margin:0 auto}
  .featured-model .fm-hero-img{height:300px}
  .fm-overlay{align-items:center;text-align:center}
}
/* ===== BRAND HERO llamativo ===== */
.brand-hero{position:relative;border-radius:14px;overflow:hidden;margin-bottom:1.5rem;isolation:isolate}
.bh-bg{position:absolute;inset:0;background-size:cover;background-position:center;transform:scale(1.06);filter:brightness(.8) saturate(1.1);animation:bh-zoom 10s ease-in-out infinite alternate}
@keyframes bh-zoom{from{transform:scale(1.06)}to{transform:scale(1.12)}}
.bh-overlay{position:absolute;inset:0;background:radial-gradient(120% 90% at 20% 40%, rgba(0,0,0,.55), rgba(0,0,0,.72));}
.bh-content{position:relative;display:grid;grid-template-columns:1.1fr .9fr;gap:1rem;align-items:end;padding:1.2rem}
.bh-logo img{height:48px;width:auto;object-fit:contain;filter:drop-shadow(0 8px 12px rgba(0,0,0,.6))}
.bh-title{margin:.4rem 0;font-weight:900;font-size:clamp(2rem,2vw+2rem,3.2rem);color:#fff;text-shadow:0 10px 24px rgba(0,0,0,.6)}
.bh-tag{color:#e8ecff;opacity:.95;max-width:60ch}
.bh-meta{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.6rem}
.bh-meta .pill{border:1px solid rgba(255,255,255,.25);color:#fff;background:rgba(255,255,255,.12);padding:.35rem .6rem;border-radius:999px;font-weight:800;font-size:.82rem}
.bh-right{justify-self:end;text-decoration:none;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(4px);border-radius:12px;padding:.8rem 1rem;color:#fff;transition:transform .25s ease, background .25s ease}
.bh-right:hover{transform:translateY(-2px);background:rgba(0,0,0,.45)}
.bh-badge{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;opacity:.85}
.bh-model{margin:.2rem 0 .4rem;font-size:clamp(1.4rem,1.1rem+1vw,2rem);font-weight:900;color:#fff}
.bh-specs span{margin-right:.5rem;color:#dfe6f8}
.bh-stripe{position:absolute;bottom:0;left:0;right:0;height:12px;background:repeating-linear-gradient(135deg, rgba(255,255,255,.18) 0 16px, transparent 16px 32px);mix-blend-mode:overlay}

/* ===== Horizontal models strip ===== */
.models-strip{position:relative;margin:1rem 0}
.ms-track{display:grid;grid-auto-flow:column;gap:.8rem;overflow:auto;padding-bottom:.4rem;scroll-snap-type:x mandatory}
.ms-card{scroll-snap-align:start;min-width:260px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;overflow:hidden;text-decoration:none;color:inherit;transition:transform .25s, box-shadow .25s}
.ms-card:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(0,0,0,.12)}
.ms-img{height:140px;background:#f9fafb;overflow:hidden}
.ms-img img{width:100%;height:100%;object-fit:cover;transition:transform .35s}
.ms-card:hover .ms-img img{transform:scale(1.06)}
.ms-txt{padding:.7rem}
.ms-txt h4{margin:.1rem 0 .2rem;font-weight:900}
.ms-meta{opacity:.7}

@media (max-width: 900px){
  .bh-content{grid-template-columns:1fr;align-items:end}
  .bh-right{justify-self:start;margin-top:.6rem}
}
</style>
