<template>
  <div class="min-h-screen">
    <NuxtLoadingIndicator />
    
    <!-- Link de salto para accesibilidad -->
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-black text-white px-3 py-2 rounded">
      Saltar al contenido
    </a>
    
    <header class="p-4 border-b">
      <nav class="max-w-5xl mx-auto flex flex-wrap items-center gap-4">
        <NuxtLink to="/" class="navlink" exact-active-class="is-active">Inicio</NuxtLink>
        <NuxtLink to="/models" class="navlink" active-class="is-active">Modelos</NuxtLink>
        <NuxtLink to="/manufacturers" class="navlink" active-class="is-active">Fabricantes</NuxtLink>
        <NuxtLink to="/designers" class="navlink" active-class="is-active">Diseñadores</NuxtLink>
      </nav>
    </header>
    
    <main id="main" class="max-w-5xl mx-auto p-4">
      <slot />
    </main>
    
    <footer class="border-t p-4 text-sm text-center opacity-70">
      Proyecto 1 – Manejo de datos en Nuxt.js
      <NuxtRouteAnnouncer />
    </footer>
  </div>
</template>

<style>
:root{
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, "Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji";
}
a { text-decoration: none; }

.navlink { padding: 6px 10px; border-radius: 10px; }
.navlink:hover, .navlink:focus-visible { background: #f3f4f6; outline: none; }
.is-active { font-weight: 700; background: #eef2ff; }

.card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; display: grid; gap: 6px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
img { max-width: 100%; height: auto; border-radius: 10px; }
.badge { display:inline-block; padding:2px 8px; border:1px solid #d1d5db; border-radius:999px; font-size:.75rem; }

/* Utilidad para el link de salto */
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
</style>