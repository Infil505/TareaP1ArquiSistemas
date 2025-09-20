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

    <!-- Featured Models Section -->
    <section class="featured-section">
      <div class="section-header">
        <h2 class="section-title">Modelos destacados</h2>
        <NuxtLink to="/models" class="view-all-link">
          Ver todos los modelos →
        </NuxtLink>
      </div>

      <div v-if="featuredModels?.length" class="featured-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ModelCard v-for="m in featuredModels" :key="m._id" :model="m" />
      </div>

      <div v-else-if="pending" class="loading-state">
        <p class="opacity-60">Cargando modelos destacados…</p>
      </div>

      <div v-else class="empty-state">
        <p class="opacity-60">No hay modelos disponibles</p>
      </div>
    </section>

    <!-- Quick Navigation -->
    <section class="navigation-section">
      <h3 class="navigation-title">Explorar por categoría</h3>
      <div class="navigation-grid">
        <NuxtLink to="/models" class="nav-card models-card">
          <div class="nav-icon">🏎️</div>
          <h4>Modelos</h4>
          <p>Explora nuestra colección completa de superdeportivos</p>
        </NuxtLink>
        
        <NuxtLink to="/manufacturers" class="nav-card manufacturers-card">
          <div class="nav-icon">🏭</div>
          <h4>Fabricantes</h4>
          <p>Conoce las marcas más prestigiosas del mundo</p>
        </NuxtLink>
        
        <NuxtLink to="/designers" class="nav-card designers-card">
          <div class="nav-icon">✏️</div>
          <h4>Diseñadores</h4>
          <p>Los visionarios detrás de estas máquinas</p>
        </NuxtLink>
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
  country?: string
  engine?: string
  drivetrain?: string
  power_hp?: number
  top_speed_kmh?: number
  manufacturer_slug?: string
  designer_slugs?: string[]
}

// Tipo para estadísticas básicas
type BasicEntity = {
  _id: string
  slug: string
  name: string
}

// Traer todos los modelos destacados (ordenados por año o potencia)
const { data: models, pending } = await useAsyncData<Model[]>(
  'home-models',
  () => queryContent<Model>('models')
    .only(['_id', '_path', 'slug', 'name', 'year', 'image', 'summary', 'country', 'engine', 'drivetrain', 'power_hp', 'top_speed_kmh'])
    .sort({ power_hp: -1, year: -1 }) // Ordenar por potencia y luego por año
    .limit(6) // Solo los primeros 6
    .find()
)

// Obtener conteos para estadísticas
const { data: allModels } = await useAsyncData<BasicEntity[]>(
  'models-count',
  () => queryContent<BasicEntity>('models')
    .only(['_id', 'slug', 'name'])
    .find()
)

const { data: manufacturers } = await useAsyncData<BasicEntity[]>(
  'manufacturers-count',
  () => queryContent<BasicEntity>('manufacturers')
    .only(['_id', 'slug', 'name'])
    .find()
)

const { data: designers } = await useAsyncData<BasicEntity[]>(
  'designers-count',
  () => queryContent<BasicEntity>('designers')
    .only(['_id', 'slug', 'name'])
    .find()
)

// Computeds para estadísticas y modelos destacados
const featuredModels = computed(() => models.value ?? [])
const totalModels = computed(() => allModels.value?.length ?? 0)
const totalManufacturers = computed(() => manufacturers.value?.length ?? 0)
const totalDesigners = computed(() => designers.value?.length ?? 0)
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* Hero Section */
.hero-section {
  text-align: center;
  padding: 3rem 0 4rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: -1rem -1rem 3rem -1rem;
  border-radius: 0 0 24px 24px;
  color: white;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.hero-title {
  font-size: clamp(2rem, 2.5rem + 2vw, 3.5rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
}

.hero-description {
  font-size: 1.125rem;
  opacity: 0.9;
  margin-bottom: 2.5rem;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 2rem;
  max-width: 400px;
  margin: 0 auto;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
  color: #fbbf24;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Featured Section */
.featured-section {
  margin-bottom: 4rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0;
}

.view-all-link {
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.3s ease;
}

.view-all-link:hover {
  color: #764ba2;
}

.featured-grid {
  margin-bottom: 2rem;
}

/* Navigation Section */
.navigation-section {
  margin-bottom: 3rem;
}

.navigation-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
}

.navigation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.nav-card {
  display: block;
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  text-decoration: none;
  color: inherit;
  text-align: center;
  transition: all 0.3s ease;
  background: white;
}

.nav-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.nav-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.nav-card h4 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.nav-card p {
  opacity: 0.7;
  margin: 0;
  line-height: 1.5;
}

.models-card:hover {
  background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
}

.manufacturers-card:hover {
  background: linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%);
}

.designers-card:hover {
  background: linear-gradient(135deg, #fce7f3 0%, #ec4899 100%);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.loading-state p,
.empty-state p {
  font-size: 1.125rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .hero-section {
    margin: -1rem -1rem 2rem -1rem;
    padding: 2rem 0 3rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
}
</style>