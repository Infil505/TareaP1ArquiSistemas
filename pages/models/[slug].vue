<script setup lang="ts">
import { useRoute } from 'vue-router';

type BaseDoc = { _id: string; _path: string; slug: string; name: string }
type Author = string | { name: string }
type Model = BaseDoc & {
  image?: string
  img?: string         
  summary?: string
  body?: any          
  year?: number
  date?: string        
  country?: string
  engine?: string
  drivetrain?: string
  power_hp?: number
  top_speed_kmh?: number
  author?: Author
  manufacturer_slug?: string
  designer_slugs?: string[]
}

const route = useRoute()
const slug = route.params.slug as string

const { data: model } = await useAsyncData<Model | null>(
  `model-${slug}`,
  () => queryContent<Model>('models').where({ slug }).findOne()
)

const { data: list } = await useAsyncData<Pick<Model, '_path' | 'name' | 'slug' | 'year' | 'date'>[]>(
  'models-for-nav',
  () => queryContent<Model>('models')
    .only(['_path', 'name', 'slug', 'year', 'date'])
    .sort({ year: -1 })
    .find()
)

const prev = computed(() => {
  const arr = list.value ?? []
  const i = arr.findIndex(d => d.slug === slug)
  if (i > 0) return arr[i - 1]
  return null
})

const next = computed(() => {
  const arr = list.value ?? []
  const i = arr.findIndex(d => d.slug === slug)
  if (i >= 0 && i < arr.length - 1) return arr[i + 1]
  return null
})
</script>

<template>
  <main class="article-container space-y-4">
    <NuxtLink to="models" class="home-button inline-block">← Volver a modelos</NuxtLink>

    <article v-if="model" class="article-content">
      <header class="article-header">
        <h1 class="article-title">{{ model.name }}</h1>
        <div class="article-meta opacity-70">
          <span v-if="model.year">Año: {{ model.year }}</span>
          <span v-if="model.country && model.year" class="separator">—</span>
          <span v-if="model.country">{{ model.country }}</span>
        </div>
      </header>

      <div class="article-image" v-if="model.image || model.img">
        <img :src="model.image || model.img" :alt="model.name" />
      </div>

      <div v-if="model.body" class="article-body">
        <ContentRenderer :value="model" />
      </div>

      <div class="article-body">
        <p class="opacity-80 mb-4" v-if="model.summary">{{ model.summary }}</p>
        
        <div class="specs-grid grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div v-if="model.engine" class="spec-item">
            <span class="spec-label">Motor:</span>
            <span class="spec-value">{{ model.engine }}</span>
          </div>
          <div v-if="model.power_hp" class="spec-item">
            <span class="spec-label">Potencia:</span>
            <span class="spec-value">{{ model.power_hp }} hp</span>
          </div>
          <div v-if="model.top_speed_kmh" class="spec-item">
            <span class="spec-label">Velocidad máxima:</span>
            <span class="spec-value">{{ model.top_speed_kmh }} km/h</span>
          </div>
          <div v-if="model.drivetrain" class="spec-item">
            <span class="spec-label">Tracción:</span>
            <span class="spec-value">{{ model.drivetrain }}</span>
          </div>
          <div v-if="model.country" class="spec-item">
            <span class="spec-label">País:</span>
            <span class="spec-value">{{ model.country }}</span>
          </div>
          <div v-if="model.year" class="spec-item">
            <span class="spec-label">Año:</span>
            <span class="spec-value">{{ model.year }}</span>
          </div>
        </div>

        <div class="specs opacity-80 text-sm space-x-2">
          <span v-if="model.country" class="badge">{{ model.country }}</span>
          <span v-if="model.engine" class="badge">{{ model.engine }}</span>
          <span v-if="model.power_hp" class="badge">{{ model.power_hp }} hp</span>
          <span v-if="model.drivetrain" class="badge">{{ model.drivetrain }}</span>
        </div>
      </div>


      <PrevNext :prev="prev" :next="next" class="article-navigation mt-8" />

      <div class="back-home mt-6">
        <NuxtLink to="/" class="home-button">
          <span class="home-icon">🏠</span>
          Volver al inicio
        </NuxtLink>
      </div>
    </article>

    <div v-else>Cargando…</div>
  </main>
</template>

<style scoped>
.article-container { max-width: 880px; margin: 0 auto; padding: 1rem; }
.article-title { font-size: clamp(1.6rem, 1.4rem + 1vw, 2.2rem); line-height: 1.2; margin: .25rem 0 .5rem; }
.article-meta { display: flex; gap: .5rem; align-items: baseline; }
.article-image img { width: 100%; height: auto; border-radius: 12px; object-fit: cover; margin: .5rem 0 1rem; }
.badge { display:inline-block; padding:2px 8px; border:1px solid #d1d5db; border-radius:999px; font-size:.75rem; }
.home-button { display:inline-flex; gap:.5rem; align-items:center; padding:.4rem .7rem; border:1px solid #e5e7eb; border-radius:10px; }
.home-button:hover { background:#f8fafc; }
.spec-item { display: flex; flex-direction: column; }
.spec-label { font-size: 0.75rem; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.05em; }
.spec-value { font-weight: 600; margin-top: 0.25rem; }
</style>