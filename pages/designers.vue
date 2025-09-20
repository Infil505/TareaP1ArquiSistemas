<template>
  <div class="designers-container">
    <header class="designers-header">
      <h1 class="designers-title">Diseñadores</h1>
      <p class="designers-subtitle">Los visionarios que dan forma al futuro del automóvil</p>
    </header>

    <div v-if="designers?.length" class="designers-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <article 
        v-for="d in designers"
        :key="d._id"
        class="designer-card"
      >
        <NuxtLink :to="d._path" class="designer-link">
          <div class="designer-image-container">
            <img
              :src="d.photo"
              :alt="`Foto de ${d.name}`"
              class="designer-photo"
              loading="lazy"
            />
            <div class="designer-overlay">
              <span class="view-profile">Ver perfil</span>
            </div>
          </div>
          
          <div class="designer-content">
            <h3 class="designer-name">{{ d.name }}</h3>
            
            <div v-if="d.country" class="designer-meta">
              <span class="badge">{{ d.country }}</span>
              <span v-if="d.specialty" class="badge specialty">{{ d.specialty }}</span>
            </div>

            <p v-if="d.bio" class="designer-bio">{{ d.bio }}</p>
            
            <!-- Mostrar algunos proyectos si están disponibles -->
            <div v-if="d.notable_projects?.length" class="designer-projects">
              <span class="projects-label">Proyectos destacados:</span>
              <div class="projects-list">
                <span 
                  v-for="(project, index) in d.notable_projects.slice(0, 2)" 
                  :key="index"
                  class="project-name"
                >
                  {{ project }}
                </span>
              </div>
            </div>
          </div>
        </NuxtLink>
      </article>
    </div>

    <div v-else-if="pending" class="loading-state">
      <div class="loading-spinner"></div>
      <p class="opacity-60">Cargando diseñadores…</p>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">✏️</div>
      <p class="opacity-60">No hay diseñadores disponibles.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
type Designer = {
  _id: string
  _path: string
  slug: string
  name: string
  country?: string
  photo?: string
  bio?: string
  specialty?: string
  notable_projects?: string[]
  birth_year?: number
  awards?: string[]
}

// Cargar todos los diseñadores desde content/designers/
const { data: designers, pending } = await useAsyncData<Designer[]>(
  'designers',
  () => queryContent<Designer>('designers')
    .only(['_id', '_path', 'slug', 'name', 'country', 'photo', 'bio', 'specialty', 'notable_projects', 'birth_year'])
    .sort({ name: 1 }) // Ordenar alfabéticamente
    .find()
)
</script>

<style scoped>
.designers-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.designers-header {
  text-align: center;
  margin-bottom: 3rem;
}

.designers-title {
  font-size: clamp(2rem, 2rem + 2vw, 3rem);
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.designers-subtitle {
  font-size: 1.125rem;
  opacity: 0.7;
  margin-bottom: 0;
}

.designers-grid {
  margin-bottom: 2rem;
}

.designer-card {
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.designer-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border-color: #d1d5db;
}

.designer-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.designer-image-container {
  position: relative;
  width: 100%;
  height: 10rem;
  overflow: hidden;
  background: #f3f4f6;
}

.designer-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.designer-card:hover .designer-photo {
  transform: scale(1.05);
}

.designer-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.designer-card:hover .designer-overlay {
  opacity: 1;
}

.view-profile {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.designer-content {
  padding: 1.5rem;
}

.designer-name {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
}

.designer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.designer-bio {
  opacity: 0.8;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.designer-projects {
  border-top: 1px solid #f3f4f6;
  padding-top: 1rem;
}

.projects-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
  display: block;
  margin-bottom: 0.5rem;
}

.projects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.project-name {
  font-size: 0.75rem;
  background: #f8fafc;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid #d1d5db;
  font-size: 0.75rem;
  background: #f8fafc;
  color: #374151;
  font-weight: 500;
}

.badge.specialty {
  background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
  border-color: #f59e0b;
  color: #92400e;
}

.loading-state,
.empty-state {
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
  margin: 0 auto 1rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.loading-state p,
.empty-state p {
  font-size: 1.125rem;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .designers-container {
    padding: 2rem;
  }
  
  .designer-image-container {
    height: 11rem;
  }
}

@media (min-width: 1024px) {
  .designers-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  
  .designer-image-container {
    height: 12rem;
  }
}
</style>