// server/api/test-post-cockpit.get.ts
import { defineEventHandler } from 'h3'
import { $fetch } from 'ofetch'
import { createDecipheriv } from 'crypto'

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

function extractAESParams(html: string) {
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

export default defineEventHandler(async () => {
  const base = 'https://arqui-cms.unaux.com/cockpit/:proyecto-7'
  const token = 'USR-2237d3c612d9c5c22fb787cd300de15ba175e787'
  const initUrl = `${base}/api/content/items/designers?token=${token}`
  
  try {
    // PASO 1: Obtener cookie
    console.log('📡 Obteniendo HTML anti-bot...')
    const htmlResponse = await $fetch<string>(initUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      }
    })
    
    const params = extractAESParams(htmlResponse)
    if (!params) {
      return { success: false, error: 'No se pudieron extraer parámetros AES' }
    }
    
    const cookieValue = decryptAESCookie(params.encrypted, params.key, params.iv)
    const cookie = `__test=${cookieValue}`
    
    console.log('✅ Cookie generada:', cookie.substring(0, 50) + '...')
    
    // PASO 2: Probar POST a models
    const postUrl = `${base}/api/content/items/models?token=${token}`
    const testBody = {
      filter: {},
      limit: 3,
      sort: { year: -1 },
      populate: 1
    }
    
    console.log('🚀 Probando POST con body:', testBody)
    
    const postResponse = await $fetch(postUrl, {
      method: 'POST',
      body: testBody,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      parseResponse: (txt) => {
        console.log('📥 Respuesta raw (primeros 300 chars):', txt.substring(0, 300))
        if (txt.trim().startsWith('<')) {
          return { isHtml: true, content: txt.substring(0, 500) }
        }
        try {
          return JSON.parse(txt)
        } catch {
          return txt
        }
      }
    })
    
    if (typeof postResponse === 'object' && 'isHtml' in postResponse) {
      return {
        success: false,
        error: 'POST devolvió HTML',
        cookie: cookie.substring(0, 50) + '...',
        htmlPreview: postResponse.content
      }
    }
    
    return {
      success: true,
      message: '✅ POST funciona!',
      cookie: cookie.substring(0, 50) + '...',
      responseType: typeof postResponse,
      itemCount: Array.isArray(postResponse) ? postResponse.length : 'N/A',
      sampleData: Array.isArray(postResponse) ? postResponse.slice(0, 2) : postResponse
    }
    
  } catch (error: any) {
    console.error('❌ Error completo:', error)
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      data: error.data ? String(error.data).substring(0, 500) : undefined
    }
  }
})