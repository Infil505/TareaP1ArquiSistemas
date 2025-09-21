<!-- pages/designers/[slug].vue -->
<template>
  <div class="designer-container">
    <div v-if="pending" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="opacity-60">Cargando perfil…</p>
    </div>

    <div v-else-if="!designer">
      <h1>Diseñador no encontrado</h1>
      <NuxtLink to="designer" class="home-button inline-block">← Volver a Diseñadores</NuxtLink>
    </div>

    <div v-else class="designer-wrapper">
      <!-- Header -->
      <header class="designer-header">
        <img :src="designer.photo || '/images/default-designer.jpg'" :alt="`Foto de ${designer.name}`"
          class="hero-photo" @error="onImgError" />
        <div class="head-info">
          <h1 class="title">{{ designer.name }}</h1>
          <div class="meta">
            <span v-if="designer.country" class="badge">{{ designer.country }}</span>
            <span v-if="designer.birth_year" class="badge age">{{ age }} años</span>
          </div>
          <p v-if="designer.bio" class="bio">{{ designer.bio }}</p>
          <NuxtLink to="designer" class="btn ghost">← Volver</NuxtLink>
        </div>
      </header>

      <!-- Render del Markdown ("Trayectoria", etc.) -->
      <section v-if="designer.body" class="section">
        <h2 class="section-title">Trayectoria</h2>
        <ContentRenderer :value="designer" class="prose" />
      </section>

      <!-- Modelos relacionados por slug -->
      <section v-if="models?.length" class="section">
        <div class="section-head">
          <h2 class="section-title">Modelos diseñados</h2>
          <span class="models-badge">
            {{ models.length }} {{ models.length === 1 ? 'modelo' : 'modelos' }}
          </span>
        </div>

        <div class="grid">
          <NuxtLink v-for="m in models" :key="m._id" :to="m._path" class="card">
            <div class="card-media">
              <img :src="m.image || '/images/default-car.jpg'" :alt="m.name" @error="onImgErrorModel" />
              <div class="media-overlay">Ver modelo</div>
            </div>
            <div class="card-body">
              <h3 class="card-title">{{ m.name }}</h3>
              <p class="card-sub">
                <span v-if="m.year">Año {{ m.year }}</span>
                <span v-if="m.country"> • {{ m.country }}</span>
              </p>
              <p v-if="m.summary" class="card-text">{{ m.summary }}</p>
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

type Designer = {
  _id: string
  _path?: string
  slug: string
  name: string
  country?: string
  photo?: string
  bio?: string
  birth_year?: number
  models?: string[]
  body?: any
}

type Model = {
  _id: string
  _path: string
  slug: string
  name: string
  year?: number
  image?: string
  summary?: string
  country?: string
}

const route = useRoute()
const slug = route.params.slug as string
const currentYear = new Date().getFullYear()

const { data: designer, pending, error } = await useAsyncData<Designer | null>(
  `designer-${slug}`,
  async () => {
    let d = await queryContent<Designer>('designers')
      .only(['_id', '_path', 'slug', 'name', 'country', 'photo', 'bio', 'birth_year', 'models', 'body'])
      .where({ slug })
      .findOne()
    if (!d) {
      d = await queryContent<Designer>()
        .only(['_id', '_path', 'slug', 'name', 'country', 'photo', 'bio', 'birth_year', 'models', 'body'])
        .where({ _path: `/designers/${slug}` })
        .findOne()
    }

    return d
  }
)

if (error.value) {
  throw createError({ statusCode: 500, statusMessage: 'Error al cargar el diseñador' })
}

const { data: models } = await useAsyncData<Model[]>(
  `designer-models-${slug}`,
  async () => {
    if (!designer.value?.models?.length) return []
    const all = await queryContent<Model>('models')
      .only(['_id', '_path', 'slug', 'name', 'year', 'image', 'summary', 'country'])
      .find()
    const set = new Set(designer.value.models)
    return all.filter(m => set.has(m.slug))
  }
)

const age = computed(() =>
  designer.value?.birth_year ? currentYear - (designer.value.birth_year as number) : undefined
)

const onImgError = (e: Event) => { (e.target as HTMLImageElement).src = '/images/default-designer.jpg' }
const onImgErrorModel = (e: Event) => { (e.target as HTMLImageElement).src = '/images/default-car.jpg' }

useHead({
  title: designer.value ? `${designer.value.name} - Diseñador` : 'Diseñador',
  meta: [{ name: 'description', content: designer.value?.bio || 'Perfil de diseñador automotriz' }]
})
</script>

<style scoped>
.designer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width:768px) {
  .designer-container {
    padding: 2rem;
  }
}

.loading-state {
  text-align: center;
  padding: 4rem 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg)
  }
}

.designer-header {
  display: grid;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}

@media (min-width:1024px) {
  .designer-header {
    grid-template-columns: 420px 1fr;
    gap: 2rem;
  }
}

.hero-photo {
  width: 100%;
  height: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .1);
}

.head-info {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: clamp(2rem, 1.2rem + 2vw, 3rem);
  font-weight: 800;
  margin: 0 0 .5rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  margin-bottom: 1rem;
}

.badge {
  display: inline-block;
  padding: .25rem .75rem;
  border-radius: 9999px;
  border: 1px solid #d1d5db;
  font-size: .75rem;
  background: #f8fafc;
  color: #374151;
  font-weight: 500;
}

.badge.age {
  background: linear-gradient(135deg, #fecaca, #ef4444);
  border-color: #dc2626;
  color: #991b1b;
}

.bio {
  opacity: .85;
  line-height: 1.6;
}

.btn.ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: .65rem 1rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  border: 1px solid #d1d5db;
  background: #fff;
}


.section {
  margin-top: 2rem;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .5rem;
}

.section-title {
  font-weight: 800;
  font-size: 1.25rem;
}

.models-badge {
  display: inline-block;
  padding: .25rem .75rem;
  background: linear-gradient(135deg, #dbeafe, #3b82f6);
  color: #1e40af;
  border-radius: 9999px;
  font-size: .75rem;
  font-weight: 600;
}

.prose :deep(ul) {
  list-style: disc;
  margin-left: 1.25rem;
}

.prose :deep(h2) {
  font-weight: 800;
}

.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, .06);
}

.card:hover {
  transform: translateY(-4px);
  border-color: #cbd5e1;
  box-shadow: 0 18px 40px rgba(0, 0, 0, .12);
}

.card-media {
  position: relative;
  height: 160px;
  background: #0b1220;
  overflow: hidden;
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .35s ease;
}

.card:hover .card-media img {
  transform: scale(1.05);
}

.media-overlay {
  position: absolute;
  inset: auto 0 0 0;
  padding: .5rem .75rem;
  text-align: center;
  background: linear-gradient(to top, rgba(0, 0, 0, .6), transparent);
  color: #fff;
  font-weight: 700;
  letter-spacing: .04em;
}

.card-body {
  padding: 1rem;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 800;
}

.card-sub {
  font-size: .85rem;
  opacity: .8;
}

.card-text {
  font-size: .9rem;
  opacity: .85;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
