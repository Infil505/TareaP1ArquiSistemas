<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

const PUBLIC_API_KEY = 'OWZhODUwOGQtZWNkZC00YmVkLTg4N2YtZDJmNTQ2YmY4YjVhNjM4OTkxMDk1MzYyNzYxMTc4'
const INTERACTION_EVENTS = ['focus', 'mouseover', 'touchmove', 'scroll', 'keydown']

let snipcartInitialized = false

const handleInteraction = () => {
  loadSnipcart()
}

const loadSnipcart = () => {
  if (snipcartInitialized) return
  snipcartInitialized = true
  console.log('🔁 Cargando Snipcart tras interacción del usuario...')

  if (typeof window === 'undefined') return

  const head = document.head || document.getElementsByTagName('head')[0]

  // 1) Asegurar que exista el contenedor #snipcart
  let snipcartDiv = document.getElementById('snipcart')
  if (!snipcartDiv) {
    snipcartDiv = document.createElement('div')
    snipcartDiv.id = 'snipcart'
    snipcartDiv.setAttribute('hidden', 'true') // igual que en el snippet del proveedor
    document.body.appendChild(snipcartDiv)
    console.log('✅ Div #snipcart creado')
  }

  // Dataset por compatibilidad, aunque Snipcart usa SnipcartSettings
  snipcartDiv.dataset.apiKey = PUBLIC_API_KEY
  snipcartDiv.dataset.configModalStyle = 'side'
  // ❌ ya no seteamos currency aquí, lo maneja SnipcartSettings con 'usd'
  // snipcartDiv.dataset.currency = 'crc'

  const version = window.SnipcartSettings?.version || '3.7.1'
  const protocol = window.SnipcartSettings?.protocol || 'https'
  const domain = window.SnipcartSettings?.domain || 'cdn.snipcart.com'

  // 2) CSS de Snipcart
  if (
    !document.querySelector(
      `link[href^="${protocol}://${domain}"][href$="snipcart.css"]`
    )
  ) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = `${protocol}://${domain}/themes/v${version}/default/snipcart.css`
    head.prepend(link)
    console.log('🎨 CSS de Snipcart inyectado')
  }

  // 3) JS de Snipcart
  if (
    !document.querySelector(
      `script[src^="${protocol}://${domain}"][src$="snipcart.js"]`
    )
  ) {
    const script = document.createElement('script')
    script.src = `${protocol}://${domain}/themes/v${version}/default/snipcart.js`
    script.async = true

    script.onload = () => {
      console.log('✅ Snipcart cargado exitosamente')

      if (window.Snipcart) {
        console.log('✅ Objeto Snipcart disponible')

        document.addEventListener('snipcart.ready', () => {
          console.log('🎉 Snipcart está listo')
        })

        document.addEventListener('snipcart.cart.opened', () => {
          console.log('🛒 Carrito abierto')
        })

        document.addEventListener('snipcart.cart.closed', () => {
          console.log('🛒 Carrito cerrado')
        })

        document.addEventListener('snipcart.item.added', (event) => {
          console.log('➕ Item agregado:', event.detail)
        })
      }
    }

    script.onerror = () => {
      console.error('❌ Error al cargar Snipcart')
    }

    head.appendChild(script)
  }

  // 4) Quitar listeners de interacción (ya cargamos)
  INTERACTION_EVENTS.forEach((ev) =>
    document.removeEventListener(ev, handleInteraction)
  )
}

onMounted(() => {
  if (typeof window === 'undefined') return

  // Config global como en el snippet del proveedor
  const settings = (window.SnipcartSettings = window.SnipcartSettings || {})

  settings.publicApiKey = PUBLIC_API_KEY
  settings.loadStrategy = 'on-user-interaction'
  settings.version = settings.version || '3.7.1'
  settings.timeoutDuration = settings.timeoutDuration || 2750
  settings.domain = settings.domain || 'cdn.snipcart.com'
  settings.protocol = 'https'
  // ✅ usamos usd para evitar errores 500 del backend
  settings.currency = 'usd'
  settings.modalStyle = 'side'

  console.log('⚙️ SnipcartSettings configurado:', window.SnipcartSettings)

  // Si ya está cargado, no hacemos nada
  if (window.Snipcart && window.Snipcart.api) {
    console.log('Snipcart ya estaba cargado, no se vuelve a inicializar')
    snipcartInitialized = true
    return
  }

  // Estrategia de carga: on-user-interaction
  INTERACTION_EVENTS.forEach((ev) =>
    document.addEventListener(ev, handleInteraction)
  )

  // Fallback: timeout si no hay interacción
  setTimeout(() => {
    if (!snipcartInitialized) {
      console.log('⏱ No hubo interacción, cargando Snipcart por timeout...')
      loadSnipcart()
    }
  }, settings.timeoutDuration)
})

onBeforeUnmount(() => {
  INTERACTION_EVENTS.forEach((ev) =>
    document.removeEventListener(ev, handleInteraction)
  )
  console.log('Componente SnipcartLoader desmontado (carrito persiste)')
})
</script>

<template>
  <!-- Solo actúa como loader; no muestra nada -->
  <div style="display: none;" data-snipcart-loader></div>
</template>

<style>
/* Estilos globales que afectan el carrito Snipcart */

/* Asegurar que el modal quede encima de todo */
#snipcart {
  z-index: 9999 !important;
}

/* Colores del carrito */
:root {
  --snipcart-primary: #f5b301;
  --snipcart-primary-hover: #ffc940;
}

/* Fondo del loading */
.snipcart-loading {
  background: rgba(10, 11, 13, 0.95) !important;
}

/* Modo oscuro del modal */
.snipcart-modal {
  background: #111318 !important;
  color: #f2f3f6 !important;
}

.snipcart-modal__header {
  background: #0f1013 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Botón de checkout dentro del modal */
.snipcart__actions--link {
  background: var(--snipcart-primary) !important;
  color: #0a0b0d !important;
}

.snipcart__actions--link:hover {
  background: var(--snipcart-primary-hover) !important;
}
</style>
