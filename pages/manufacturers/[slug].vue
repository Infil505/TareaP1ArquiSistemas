<template>
  <div class="manufacturer-detail-container">
    <!-- Navigation -->
    <nav class="breadcrumb">
      <NuxtLink to="manufacturers" class="home-button inline-block">← Volver a Fabricantes</NuxtLink>
    </nav>

    <div v-if="maker" class="manufacturer-detail">
      <!-- Header Section -->
      <header class="manufacturer-header">
        <div class="manufacturer-logo-container">
          <img 
            :src="maker.logo" 
            :alt="`Logo de ${maker.name}`" 
            class="manufacturer-logo"
            loading="eager"
          />
        </div>

        <div class="manufacturer-info">
          <h1 class="manufacturer-name">{{ maker.name }}</h1>

          <div class="manufacturer-meta">
            <span v-if="maker.country" class="badge country-badge">
              {{ maker.country }}
            </span>
            <span v-if="maker.founded" class="badge founded-badge">
              Fundado: {{ maker.founded }}
            </span>
            <span v-if="maker.headquarters" class="badge">
              {{ maker.headquarters }}
            </span>
          </div>

          <p v-if="maker.bio" class="manufacturer-bio">{{ maker.bio }}</p>

          <!-- Additional Info -->
          <div v-if="maker.website || maker.employees" class="additional-info">
            <div v-if="maker.website" class="info-item">
              <span class="info-label">Sitio web:</span>
              <a :href="maker.website" target="_blank" rel="noopener" class="info-link">
                {{ maker.website.replace('https://', '').replace('http://', '') }}
              </a>
            </div>
            <div v-if="maker.employees" class="info-item">
              <span class="info-label">Empleados:</span>
              <span class="info-value">{{ maker.employees.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Content Section -->
      <div v-if="maker.body" class="manufacturer-content">
        <ContentRenderer :value="maker" />
      </div>

      <!-- Models Section -->
      <section class="models-section">
        <div class="section-header">
          <h3 class="section-title">Modelos de {{ maker.name }}</h3>
          <span v-if="models?.length" class="models-count">
            {{ models.length }} {{ models.length === 1 ? 'modelo' : 'modelos' }}
          </span>
        </div>

        <div v-if="models?.length" class="models-grid">
          <article v-for="m in models" :key="m._id" class="model-card">
            <NuxtLink :to="m._path" class="model-link">
              <div v-if="m.image" class="model-image">
                <img :src="m.image" :alt="m.name" loading="lazy" />
              </div>
              <div class="model-info">
                <h4 class="model-name">{{ m.name }}</h4>
                <div class="model-meta">
                  <span v-if="m.year" class="model-year">{{ m.year }}</span>
                  <span v-if="m.power_hp" class="model-power">{{ m.power_hp }} hp</span>
                </div>
                <p v-if="m.summary" class="model-summary">{{ m.summary }}</p>
              </div>
            </NuxtLink>
          </article>
        </div>

        <div v-else-if="modelsLoading" class="loading-models">
          <p class="opacity-60">Cargando modelos…</p>
        </div>

        <div v-else class="no-models">
          <div class="no-models-icon">🏎️</div>
          <p class="no-models-text">Sin modelos vinculados a este fabricante.</p>
        </div>
      </section>
    </div>

    <div v-else-if="pending" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando información del fabricante…</p>
    </div>

    <div v-else class="error-state">
      <div class="error-icon">❌</div>
      <h2>Fabricante no encontrado</h2>
      <p>No se pudo encontrar información sobre este fabricante.</p>
      <NuxtLink to="/manufacturers" class="back-button">
        Volver a fabricantes
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

// Tipos
type BaseDoc = { _id: string; _path: string; slug: string; name: string }
type Manufacturer = BaseDoc & {
  logo?: string
  country?: string
  founded?: number | string
  bio?: string
  body?: any
  headquarters?: string
  website?: string
  employees?: number
  models?: string[] // Array de slugs de modelos
}
type Model = BaseDoc & { 
  year?: number
  image?: string
  summary?: string
  power_hp?: number
  manufacturer_slug?: string
}

const route = useRoute()
const slug = route.params.slug as string

// Fabricante desde content/manufacturers/
const { data: maker, pending } = await useAsyncData<Manufacturer | null>(
  `manufacturer-${slug}`,
  () => queryContent<Manufacturer>('manufacturers')
    .where({ slug })
    .findOne()
)

// Modelos del fabricante - usando el array models del fabricante
const { data: models, pending: modelsLoading } = await useAsyncData<Model[]>(
  `manufacturer-models-${slug}`,
  async () => {
    if (!maker.value?.models?.length) return []
    // Buscar modelos cuyos slugs estén en el array models del fabricante
    return await queryContent<Model>('models')
      .where({ slug: { $in: maker.value.models } })
      .only(['_id', '_path', 'slug', 'name', 'year', 'image', 'summary', 'power_hp'])
      .sort({ year: -1 })
      .find()
  },
  {
    watch: [maker] // Re-ejecutar cuando maker cambie
  }
)
</script>

<style scoped>
.manufacturer-detail-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
}

.breadcrumb {
  margin-bottom: 2rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: #764ba2;
}

.manufacturer-header {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.manufacturer-logo-container {
  display: flex;
  align-items: flex-start;
}

.manufacturer-logo {
  width: 100%;
  height: auto;
  max-height: 160px;
  object-fit: contain;
  border-radius: 12px;
  background: white;
  padding: 1rem;
  border: 1px solid #e5e7eb;
}

.manufacturer-name {
  font-size: clamp(1.875rem, 2rem + 1vw, 2.5rem);
  font-weight: 800;
  margin: 0 0 1rem 0;
  line-height: 1.2;
}

.manufacturer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.manufacturer-bio {
  font-size: 1.125rem;
  line-height: 1.6;
  opacity: 0.8;
  margin-bottom: 1.5rem;
}

.additional-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.info-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.info-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #6b7280;
  min-width: 80px;
}

.info-link {
  color: #667eea;
  text-decoration: none;
  transition: color 0.3s ease;
}

.info-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

.info-value {
  font-weight: 500;
}

.manufacturer-content {
  margin-bottom: 3rem;
  prose: true;
}

.models-section {
  margin-top: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.models-count {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.model-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.model-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.model-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.model-image {
  height: 160px;
  overflow: hidden;
  background: #f9fafb;
}

.model-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.model-card:hover .model-image img {
  transform: scale(1.05);
}

.model-info {
  padding: 1rem;
}

.model-name {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.model-meta {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.model-year,
.model-power {
  font-size: 0.75rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.model-summary {
  font-size: 0.875rem;
  opacity: 0.7;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid #d1d5db;
  font-size: 0.75rem;
  font-weight: 500;
  background: #f8fafc;
}

.country-badge {
  background: linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%);
  border-color: #7c3aed;
  color: #5b21b6;
}

.founded-badge {
  background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
  border-color: #f59e0b;
  color: #92400e;
}

.loading-models,
.no-models,
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
}

.no-models-icon,
.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.no-models-text {
  opacity: 0.6;
  font-size: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.back-button {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.back-button:hover {
  background: #764ba2;
}

/* Responsive */
@media (max-width: 768px) {
  .manufacturer-header {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .manufacturer-logo-container {
    justify-content: center;
  }
  
  .manufacturer-logo {
    max-width: 200px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>