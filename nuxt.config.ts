export default defineNuxtConfig({
  modules: [
    '@nuxt/content'
  ],
  content: {
    // Nuxt Content buscará automáticamente en la carpeta content/
    highlight: {
      theme: 'github-light'
    }
  }
})