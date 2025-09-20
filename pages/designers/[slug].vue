<template>
  <div class="designer-detail-container">
    <!-- Navigation -->
    <nav class="breadcrumb">
      <NuxtLink to="/designers" class="back-link">
        ← Volver a diseñadores
      </NuxtLink>
    </nav>

    <div v-if="designer" class="designer-detail">
      <!-- Header Section -->
      <header class="designer-header">
        <div class="designer-photo-container">
          <img 
            :src="designer.photo" 
            :alt="`Foto de ${designer.name}`" 
            class="designer-photo"
            loading="eager"
          />
          <div v-if="designer.awards?.length" class="awards-badge">
            🏆 {{ designer.awards.length }} {{ designer.awards.length === 1 ? 'Premio' : 'Premios' }}
          </div>
        </div>

        <div class="designer-info">
          <h1 class="designer-name">{{ designer.name }}</h1>

          <div class="designer-meta">
            <span v-if="designer.country" class="badge country-badge">
              {{ designer.country }}
            </span>
            <span v-if="designer.birth_year" class="badge age-badge">
              {{ currentYear - designer.birth_year }} años
            </span>
            <span v-if="designer.specialty" class="badge specialty-badge">
              {{ designer.specialty }}
            </span>
          </div>

          <p v-if="designer.bio" class="designer-bio">{{ designer.bio }}</p>

          <!-- Additional Info -->
          <div v-if="designer.education || designer.career_start" class="additional-info">
            <div v-if="designer.education" class="info-item">
              <span class="info-label">Educación:</span>
              <span class="info-value">{{ designer.education }}</span>
            </div>
            <div v-if="designer.career_start" class="info-item">
              <span class="info-label">Carrera desde:</span>
              <span class="info-value">{{ designer.career_start }}</span>
            </div>
            <div v-if="designer.current_position" class="info-item">
              <span class="info-label">Posición actual:</span>
              <span class="info-value">{{ designer.current_position }}</span>
            </div>
          </div>

          <!-- Awards Section -->
          <div v-if="designer.awards?.length" class="awards-section">
            <h4 class="awards-title">Reconocimientos</h4>
            <ul class="awards-list">
              <li v-for="award in designer.awards.slice(0, 3)" :key="award" class="award-item">
                {{ award }}
              </li>
            </ul>
          </div>
        </div>
      </header>

      <!-- Content Section -->
      <div v-if="designer.body" class="designer-content">
        <ContentRenderer :value="designer" />
      </div>

      <!-- Models Section -->
      <section class="models-section">
        <div class="section-header">
          <h3 class="section-title">Modelos diseñados por {{ designer.name }}</h3>
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
                  <span v-if="m.country" class="model-country">{{ m.country }}</span>
                  <span v-if="m.power_hp" class="model-power">{{ m.power_hp }} hp</span>
                </div>
                <p v-if="m.summary" class="model-summary">{{ m.summary }}</p>
              </div>
            </NuxtLink>
          </article>
        </div>

        <div v-else-if="modelsLoading" class="loading-models">
          <p class="opacity-60">Cargando modelos diseñados…</p>
        </div>

        <div v-else class="no-models">
          <div class="no-models-icon">✏️</div>
          <p class="no-models-text">Sin modelos vinculados a este diseñador.</p>
        </div>
      </section>

      <!-- Notable Projects Section -->
      <section v-if="designer.notable_projects?.length" class="projects-section">
        <h3 class="section-title">Otros proyectos destacados</h3>
        <div class="projects-grid">
          <div v-for="project in designer.notable_projects" :key="project" class="project-item">
            {{ project }}
          </div>
        </div>
      </section>
    </div>

    <div v-else-if="pending" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Cargando información del diseñador…</p>
    </div>

    <div v-else class="error-state">
      <div class="error-icon">❌</div>
      <h2>Diseñador no encontrado</h2>
      <p>No se pudo encontrar información sobre este diseñador.</p>
      <NuxtLink to="/designers" class="back-button">
        Volver a diseñadores
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

// Tipos
type BaseDoc = { _id: string; _path: string; slug: string; name: string }
type Designer = BaseDoc & {
  photo?: string
  country?: string
  bio?: string
  body?: any
  specialty?: string
  birth_year?: number
  awards?: string[]
  education?: string
  career_start?: number
  current_position?: string
  notable_projects?: string[]
  models?: string[] // Array de slugs de modelos diseñados
}
type Model = BaseDoc & { 
  year?: number
  image?: string
  summary?: string
  power_hp?: number
  country?: string
}

const route = useRoute()
const slug = route.params.slug as string
const currentYear = new Date().getFullYear()

// Diseñador desde content/designers/
const { data: designer, pending } = await useAsyncData<Designer | null>(
  `designer-${slug}`,
  () => queryContent<Designer>('designers')
    .where({ slug })
    .findOne()
)

// Modelos del diseñador - usando el array models del diseñador
const { data: models, pending: modelsLoading } = await useAsyncData<Model[]>(
  `designer-models-${slug}`,
  async () => {
    if (!designer.value?.models?.length) return []
    // Buscar modelos cuyos slugs estén en el array models del diseñador
    return await queryContent<Model>('models')
      .where({ slug: { $in: designer.value.models } })
      .only(['_id', '_path', 'slug', 'name', 'year', 'image', 'summary', 'power_hp', 'country'])
      .sort({ year: -1 })
      .find()
  },
  {
    watch: [designer] // Re-ejecutar cuando designer cambie
  }
)
</script>

<style scoped>
.designer-detail-container {
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

.designer-header {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.designer-photo-container {
  position: relative;
}

.designer-photo {
  width: 100%;
  height: 280px;
  object-fit: cover;
  border-radius: 16px;
  border: 3px solid white;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.awards-badge {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.designer-name {
  font-size: clamp(1.875rem, 2rem + 1vw, 2.5rem);
  font-weight: 800;
  margin: 0 0 1rem 0;
  line-height: 1.2;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.designer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.designer-bio {
  font-size: 1.125rem;
  line-height: 1.6;
  opacity: 0.8;
  margin-bottom: 1.5rem;
}

.additional-info {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #6b7280;
  min-width: 100px;
}

.info-value {
  font-weight: 500;
  color: #374151;
}

.awards-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.awards-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: #374151;
}

.awards-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.award-item {
  background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
  color: #92400e;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.designer-content {
  margin-bottom: 3rem;
  prose: true;
}

.models-section,
.projects-section {
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
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.model-year,
.model-country,
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

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.project-item {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  font-weight: 500;
  text-align: center;
  transition: all 0.3s ease;
}

.project-item:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
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

.age-badge {
  background: linear-gradient(135deg, #fecaca 0%, #ef4444 100%);
  border-color: #dc2626;
  color: #991b1b;
}

.specialty-badge {
  background: linear-gradient(135deg, #bbf7d0 0%, #10b981 100%);
  border-color: #059669;
  color: #065f46;
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
  .designer-header {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .designer-photo {
    max-width: 200px;
    height: 200px;
    margin: 0 auto;
  }
  
  .section-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .additional-info {
    padding: 1rem;
  }
}
</style>