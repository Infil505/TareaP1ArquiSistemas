<template>
  <div class="manufacturers-container">
    <header class="manufacturers-header">
      <h1 class="manufacturers-title">Fabricantes</h1>
      <p class="manufacturers-subtitle">Conoce las marcas más prestigiosas del mundo automotriz</p>
    </header>

    <div v-if="makers?.length" class="manufacturers-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <article v-for="m in makers" :key="m._id" class="manufacturer-card">
        <NuxtLink :to="m._path" class="manufacturer-link">
          <div class="manufacturer-image-container">
            <img 
              :src="m.logo" 
              :alt="`Logo de ${m.name}`" 
              class="manufacturer-logo"
              loading="lazy"
            />
          </div>
          
          <div class="manufacturer-content">
            <h3 class="manufacturer-name">{{ m.name }}</h3>
            
            <div class="manufacturer-meta">
              <span v-if="m.country" class="badge">{{ m.country }}</span>
              <span v-if="m.founded" class="badge">Fundado: {{ m.founded }}</span>
            </div>

            <p v-if="m.bio" class="manufacturer-bio">{{ m.bio }}</p>
          </div>
        </NuxtLink>
      </article>
    </div>

    <div v-else-if="pending" class="loading-state">
      <p class="opacity-60">Cargando fabricantes…</p>
    </div>

    <div v-else class="empty-state">
      <p class="opacity-60">No hay fabricantes disponibles.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Tipo de fabricante
type Manufacturer = {
  _id: string
  _path: string
  slug: string
  name: string
  logo?: string
  country?: string
  founded?: number | string
  bio?: string
}

// Cargar fabricantes desde content/manufacturers/
const { data: makers, pending } = await useAsyncData<Manufacturer[]>(
  'manufacturers',
  () => queryContent<Manufacturer>('manufacturers')
    .only(['_id', '_path', 'slug', 'name', 'logo', 'country', 'founded', 'bio'])
    .sort({ name: 1 }) // Ordenar alfabéticamente por nombre
    .find()
)
</script>

<style scoped>
.manufacturers-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.manufacturers-header {
  text-align: center;
  margin-bottom: 3rem;
}

.manufacturers-title {
  font-size: clamp(2rem, 2rem + 2vw, 3rem);
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.manufacturers-subtitle {
  font-size: 1.125rem;
  opacity: 0.7;
  margin-bottom: 0;
}

.manufacturers-grid {
  margin-bottom: 2rem;
}

.manufacturer-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.manufacturer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border-color: #d1d5db;
}

.manufacturer-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.manufacturer-image-container {
  width: 100%;
  height: 8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  padding: 1rem;
}

.manufacturer-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.manufacturer-content {
  padding: 1rem;
}

.manufacturer-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
}

.manufacturer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.manufacturer-bio {
  opacity: 0.8;
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid #d1d5db;
  font-size: 0.75rem;
  background: #f8fafc;
  color: #374151;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 1rem;
}

.loading-state p,
.empty-state p {
  font-size: 1.125rem;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .manufacturers-container {
    padding: 2rem;
  }
  
  .manufacturer-image-container {
    height: 9rem;
  }
}

@media (min-width: 1024px) {
  .manufacturers-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
  
  .manufacturer-image-container {
    height: 10rem;
  }
}
</style>