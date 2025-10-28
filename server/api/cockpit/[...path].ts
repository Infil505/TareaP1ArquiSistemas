import { defineEventHandler, readBody, createError } from 'h3'
import { $fetch } from 'ofetch'

// Store para cookies (simple cache en memoria)
const cookieStore = new Map<string, string>()

export default defineEventHandler(async (event) => {
  const pathParam = event.context.params?.path
  const method = event.node.req.method || 'GET'

  const base = import.meta.env.VITE_COCKPIT_BASE_URL?.replace(/\/$/, '') || ''
  const token = import.meta.env.VITE_COCKPIT_TOKEN
  if (!base || !token) {
    throw createError({ statusCode: 500, statusMessage: 'Missing Cockpit config' })
  }

  // 🧩 Normaliza la ruta para el formato moderno
  let normalizedPath: string = Array.isArray(pathParam)
    ? pathParam.join('/')
    : pathParam || ''

  normalizedPath = normalizedPath
    .replace(/^api\//, '')
    .replace(/^collections\/get\//, 'content/items/')

  if (!normalizedPath.startsWith('content/items/')) {
    normalizedPath = `content/items/${normalizedPath}`
  }

  const url = `${base}/api/${normalizedPath}?token=${token}`

  const body = ['POST', 'PUT', 'PATCH'].includes(method)
    ? await readBody(event)
    : undefined

  // Headers para simular un navegador real
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Referer': base,
    'Origin': base
  }

  // Agregar cookies almacenadas si existen
  const storedCookie = cookieStore.get(base)
  if (storedCookie) {
    headers['Cookie'] = storedCookie
  }

  try {
    const response = await $fetch(url, {
      method,
      body,
      headers,
      // Seguir redirecciones
      redirect: 'follow',
      // Capturar cookies de respuesta
      onResponse({ response }) {
        const setCookie = response.headers.get('set-cookie')
        if (setCookie) {
          // Guardar cookies para futuras peticiones
          cookieStore.set(base, setCookie)
        }
      },
      // Retry en caso de error temporal
      retry: 2,
      retryDelay: 500
    })

    // Detectar si la respuesta es HTML (anti-bot)
    if (typeof response === 'string' && response.includes('<html>')) {
      console.warn('⚠️ Anti-bot HTML detectado, intentando bypass...')
      
      // Intentar una segunda vez con las cookies obtenidas
      const retryResponse = await $fetch(url, {
        method,
        body,
        headers: {
          ...headers,
          'Cookie': cookieStore.get(base) || ''
        }
      })
      
      return retryResponse
    }

    return response
  } catch (error: any) {
    console.error('❌ Error en proxy Cockpit:', {
      url,
      error: error.message,
      data: error.data
    })
    
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: `Cockpit proxy failed: ${error?.message || 'Unknown error'}`,
    })
  }
})