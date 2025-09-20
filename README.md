
# Proyecto 1 – Catálogo de automóviles superdeportivos (Nuxt 3 + @nuxt/content)

## Requisitos
- Node 18+
- No subir `node_modules` al entregable

## Instrucciones
1. Instalar dependencias: `npm i`
2. Desarrollo local: `npm run dev`
3. Generar estático para Netlify: `npm run generate`
4. En Netlify:
   - Build command: `npm run generate`
   - Publish directory: `.output/public`

## Estructura de datos
- Entidad principal: **models** (≥6 campos)
- Secundarias: **manufacturers**, **designers** (≥4 campos)
- Registros mínimos:
  - models: 12
  - manufacturers: 6+
  - designers: 6+
- Relaciones:
  - `models[].manufacturer_slug` ↔ `manufacturers[].models`
  - `models[].designer_slugs[]` ↔ `designers[].models[]`

## Navegación
- `/models` → listado
- `/models/[slug]` → detalle con enlaces a fabricante y diseñadores
- `/manufacturers` / `/manufacturers/[slug]`
- `/designers` / `/designers/[slug]`
