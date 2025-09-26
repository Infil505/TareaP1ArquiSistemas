
# Proyecto 1 – Catálogo de automóviles superdeportivos (Nuxt 3 + @nuxt/content)

## Requisitos
- Node 18+
- No subir `node_modules` al entregable

## Instrucciones
1. Instalar dependencias: `npm i`
2. Desarrollo local: `npm run dev`

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

## creadores de contenido

- Darwin Javier Silva Gadea
- Joseph Alvarez Ruiz

## link del proyecto en netlify
- https://stellular-speculoos-5125d7.netlify.app/