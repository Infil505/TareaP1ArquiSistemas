<template>
  <div class="models-container">
    <header class="models-header">
      <h1 class="models-title">Modelos</h1>
      <p class="models-subtitle">Explora nuestra colección de superdeportivos</p>
    </header>

    <div v-if="models?.length" class="models-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ModelCard v-for="m in models" :key="m._id" :model="m" />
    </div>

    <div v-else-if="pending" class="loading-state">
      <p class="opacity-60">Cargando modelos…</p>
    </div>

    <div v-else class="empty-state">
      <p class="opacity-60">No se encontraron modelos</p>
    </div>
  </div>
</template>

<script setup lang="ts">
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

// Obtener todos los modelos de la carpeta content/models/
const { data: models, pending } = await useAsyncData<Model[]>(
  'models',
  () => queryContent<Model>('models')
    .only(['_id', '_path', 'slug', 'name', 'year', 'image', 'summary', 'country', 'engine', 'drivetrain', 'power_hp', 'top_speed_kmh'])
    .sort({ year: -1 }) // Ordenar por año descendente (más nuevos primero)
    .find()
)
</script>

<style scoped>
.models-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.models-header {
  text-align: center;
  margin-bottom: 3rem;
}

.models-title {
  font-size: clamp(2rem, 2rem + 2vw, 3rem);
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.models-subtitle {
  font-size: 1.125rem;
  opacity: 0.7;
  margin-bottom: 0;
}

.models-grid {
  margin-bottom: 2rem;
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
  .models-container {
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  .models-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}
</style>