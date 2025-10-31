import { defineEventHandler, readBody, createError } from 'h3'
import { $fetch } from 'ofetch'
import { createDecipheriv } from 'crypto'

const cookieStore = new Map<string, string>()

/**
 * Desencripta el valor AES para generar la cookie anti-bot
 */
function decryptAESCookie(encryptedHex: string, keyHex: string, ivHex: string): string {
  const key = Buffer.from(keyHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  
  const decipher = createDecipheriv('aes-128-cbc', key, iv)
  decipher.setAutoPadding(false)
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])
  
  return decrypted.toString('hex')
}

/**
 * Extrae los parámetros AES del HTML anti-bot
 */
function extractAESParams(html: string): { key: string; iv: string; encrypted: string } | null {
  const keyMatch = html.match(/toNumbers\("([a-f0-9]+)"\)/)
  const ivMatch = html.match(/toNumbers\("([a-f0-9]+)"\),b=toNumbers\("([a-f0-9]+)"\)/)
  const encryptedMatch = html.match(/c=toNumbers\("([a-f0-9]+)"\)/)
  
  if (keyMatch && ivMatch && encryptedMatch) {
    return {
      key: keyMatch[1],
      iv: ivMatch[2],
      encrypted: encryptedMatch[1]
    }
  }
  return null
}

/**
 * Obtiene cookie anti-bot (con caché de 5 minutos)
 */
async function getAntiBotCookie(base: string, token: string): Promise<string | null> {
  const cacheKey = `${base}:session`
  
  // Verificar caché (5 minutos)
  const cached = cookieStore.get(cacheKey)
  if (cached) {
    const [cookie, timestamp] = cached.split('|||')
    const age = Date.now() - parseInt(timestamp)
    if (age < 5 * 60 * 1000) {
      console.log('✅ Usando cookie en caché')
      return cookie
    }
    console.log('⏰ Cookie expirada, generando nueva...')
  }
  
  // Obtener nueva cookie
  console.log('📡 Obteniendo HTML anti-bot...')
  const initUrl = `${base}/api/content/items/designers?token=${token}`
  
  try {
    const htmlResponse = await $fetch<string>(initUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      }
    })
    
    console.log('🔓 Extrayendo parámetros AES...')
    const params = extractAESParams(htmlResponse)
    
    if (!params) {
      console.error('❌ No se pudieron extraer parámetros AES')
      return null
    }
    
    const cookieValue = decryptAESCookie(params.encrypted, params.key, params.iv)
    const cookie = `__test=${cookieValue}`
    
    // Guardar en caché con timestamp
    cookieStore.set(cacheKey, `${cookie}|||${Date.now()}`)
    
    console.log('✅ Cookie generada:', cookie.substring(0, 50) + '...')
    return cookie
    
  } catch (error) {
    console.error('❌ Error obteniendo cookie:', error)
    return null
  }
}

export default defineEventHandler(async (event) => {
  const pathParam = event.context.params?.path
  let method = event.node.req.method || 'GET'

  const base = import.meta.env.VITE_COCKPIT_BASE_URL?.replace(/\/$/, '') || ''
  const token = import.meta.env.VITE_COCKPIT_TOKEN
  
  if (!base || !token) {
    throw createError({ statusCode: 500, statusMessage: 'Missing Cockpit config' })
  }

  let normalizedPath: string = Array.isArray(pathParam)
    ? pathParam.join('/')
    : pathParam || ''

  normalizedPath = normalizedPath
    .replace(/^api\//, '')
    .replace(/^collections\/get\//, 'content/items/')

  if (!normalizedPath.startsWith('content/items/') && !normalizedPath.startsWith('content/item/')) {
    normalizedPath = `content/items/${normalizedPath}`
  }

  // IMPORTANTE: Convertir POST a /content/items a GET con query params
  let body = ['POST', 'PUT', 'PATCH'].includes(method)
    ? await readBody(event)
    : undefined
  
  // Si es POST a /content/items/{model}, convertir a GET con query string
  if (method === 'POST' && normalizedPath.match(/^content\/items\/\w+$/)) {
    console.log('🔄 Convirtiendo POST /content/items a GET con query params')
    method = 'GET'
    // El body se enviará como query params más abajo
  }

  let url = `${base}/api/${normalizedPath}?token=${token}`
  
  // Si convertimos POST a GET, agregar body como query params
  if (method === 'GET' && body && typeof body === 'object') {
    const queryParams = new URLSearchParams()
    
    // Convertir el body a query params (Cockpit acepta filter, sort, limit, etc.)
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      }
    }
    
    url += '&' + queryParams.toString()
    body = undefined // No enviar body en GET
  }

  console.log(`📤 [${method}] ${normalizedPath}`)

  // Obtener cookie anti-bot
  const cookie = await getAntiBotCookie(base, token)
  
  if (!cookie) {
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'No se pudo obtener cookie anti-bot' 
    })
  }

  // Hacer petición con la cookie (exactamente como en el test)
  console.log('🚀 Haciendo petición con cookie...')
  
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Cookie': cookie
  }
  
  // Agregar Content-Type para POST/PUT/PATCH con body
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  
  try {
    const response = await $fetch(url, {
      method,
      body,
      headers,
      parseResponse: (txt) => {
        if (txt.trim().startsWith('<')) {
          return { isHtml: true, content: txt.substring(0, 200) }
        }
        try {
          return JSON.parse(txt)
        } catch {
          return txt
        }
      }
    })
    
    // Verificar si recibimos HTML (sesión inválida)
    if (typeof response === 'object' && 'isHtml' in response) {
      console.warn('⚠️ Recibido HTML, regenerando cookie...')
      
      // Limpiar caché y reintentar UNA vez
      cookieStore.delete(`${base}:session`)
      const newCookie = await getAntiBotCookie(base, token)
      
      if (!newCookie) {
        throw createError({ 
          statusCode: 500, 
          statusMessage: 'No se pudo regenerar cookie' 
        })
      }
      
      const retryResponse = await $fetch(url, {
        method,
        body,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Content-Type': body !== undefined ? 'application/json' : undefined,
          'Cookie': newCookie
        } as Record<string, string>,
        parseResponse: (txt) => {
          if (txt.trim().startsWith('<')) {
            throw new Error('Aún recibiendo HTML después de regenerar cookie')
          }
          try {
            return JSON.parse(txt)
          } catch {
            return txt
          }
        }
      })
      
      console.log('✅ Reintento exitoso')
      return retryResponse
    }
    
    console.log('✅ Respuesta exitosa')
    return response
    
  } catch (error: any) {
    console.error('❌ Error en petición:', {
      url,
      method,
      error: error.message,
      statusCode: error?.statusCode
    })
    
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: `Cockpit request failed: ${error?.message || 'Unknown error'}`,
    })
  }
})