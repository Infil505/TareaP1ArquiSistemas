import { cockpitFetch } from '../cockpit'

const MODEL = 'models'

// 🔹 GIF por defecto (solo se usa si no llega ninguna imagen)
const DEFAULT_GIF =
  'https://i.pinimg.com/originals/a8/28/88/a828888852e708d9afaaad06c7f9513f.gif'

export interface Model {
  _id?: string
  _created?: number
  _modified?: number
  slug: string
  name: string
  year?: number
  image?: string | { path?: string } | null
  img?: string | { path?: string } | null
  summary?: string
  power_hp?: number
  manufacturer?: unknown
  designer?: unknown
  displayImage?: string
}

type ListParams = {
  search?: string
  limit?: number
  skip?: number
  sort?: Record<string, 1 | -1>
  filter?: Record<string, any>
  populate?: 0 | 1
  /** Activa logs y expone datos en window */
  debug?: boolean
}

/** Respuesta real de Cockpit v2 para /api/content/items */
interface CockpitListResponse<T> {
  data: T[]
  meta: { total: number }
}

/** Convierte rutas de assets de Cockpit */
export const toAssetUrl = (asset?: string | { path?: string } | null): string =>
  !asset ? '' : typeof asset === 'string' ? asset : (asset.path || '')

/** Pretty stringify seguro */
const j = (v: any) => {
  try { return JSON.stringify(v, null, 2) } catch { return String(v) }
}

/**
 * Normaliza el modelo para asegurar que siempre tenga algo que mostrar.
 * Si no trae imagen ni img, usa un GIF predeterminado.
 */
const normalizeModel = (m: Model): Model => {
  const n = { ...m }

  const imageUrl =
    toAssetUrl(n.image) ||
    toAssetUrl(n.img) ||
    ''

  n.displayImage = imageUrl !== '' ? imageUrl : DEFAULT_GIF
  return n
}

/** LISTAR (POST /content/items/{model}) */
/** LISTAR (POST /content/items/{model}) */
export async function listModels(p: ListParams = {}): Promise<Model[]> {
  const {
    search = '',
    limit = 20,
    skip = 0,
    sort = { year: -1 },
    filter = {},
    populate = 1,
  } = p

  const nameFilter = search ? { name: { $regex: search, $options: 'i' } } : {}
  const body = { filter: { ...filter, ...nameFilter }, limit, skip, sort, populate }

  console.log('📤 [listModels] Enviando petición a Cockpit:', {
    endpoint: `content/items/${MODEL}`,
    method: 'POST',
    body,
  })

  try {
    const res = await cockpitFetch<CockpitListResponse<Model>>(
      `content/items/${MODEL}`,
      { method: 'POST', body }
    )

    console.log('📥 [listModels] Respuesta completa desde Cockpit:', res)

    console.log(`📦 [listModels] Total meta.total: ${res.meta?.total ?? 'N/A'} | data.length: ${res.data?.length ?? 0}`)

    if (res.data?.length) {
      console.group('🧩 [listModels] Modelos recibidos:')
      res.data.forEach((m, i) => {
        console.log(`${i + 1}. ${m.name ?? '(sin nombre)'} | slug: ${m.slug}`)
      })
      console.groupEnd()
    } else {
      console.warn('⚠️ [listModels] No se recibieron modelos en la respuesta')
    }

    const items = (res.data ?? []).map(normalizeModel)

    // 🔹 Mostrar los modelos normalizados (ya con displayImage listo)
    console.group('✨ [listModels] Modelos normalizados:')
    console.table(
      items.map(m => ({
        name: m.name,
        slug: m.slug,
        displayImage: m.displayImage,
        power_hp: m.power_hp ?? '—',
        year: m.year ?? '—',
      }))
    )
    console.groupEnd()

    console.log(`✅ [listModels] Total de modelos listos: ${items.length}`)
    return items
  } catch (error) {
    console.error('❌ [listModels] Error al obtener modelos:', error)
    return []
  }
}

/** OBTENER POR SLUG (con opción debug) */
export async function getModelBySlug(
  slug: string,
  opts: { debug?: boolean } = {}
): Promise<Model | null> {
  const { debug = false } = opts

  console.groupCollapsed('📤 [getModelBySlug] Request → Cockpit')
  console.log('slug:', slug)
  console.log('endpoint:', `content/items/${MODEL}`)
  console.log('method:', 'POST')
  console.log('body:', { filter: { slug }, limit: 1, populate: 1 })
  console.groupEnd()

  const res = await cockpitFetch<CockpitListResponse<Model>>(
    `content/items/${MODEL}`,
    { method: 'POST', body: { filter: { slug }, limit: 1, populate: 1 } }
  )

  const raw = res.data?.[0]
  const normalized = raw ? normalizeModel(raw) : null

  console.groupCollapsed('📥 [getModelBySlug] Response ← Cockpit')
  console.log('meta.total:', res.meta?.total, 'data.length:', res.data?.length)
  console.log('raw item:', raw)
  console.log('normalized:', normalized)
  if (debug) {
    console.log('RAW response (pretty):\n', j(res))
    if (typeof window !== 'undefined') {
      ;(window as any).__lastModelGet = { res, raw, normalized }
    }
    if (raw) {
      console.table(Object.keys(raw).map(k => ({ field: k })))
    }
  }
  console.groupEnd()

  return normalized
}

/** CREAR / ACTUALIZAR / ELIMINAR */
export async function saveModel(data: Partial<Model>) {
  console.log('📤 [saveModel] Guardando modelo:', data)
  const res = await cockpitFetch<any>(`content/item/${MODEL}`, {
    method: 'POST',
    body: { data },
  })
  console.log('📥 [saveModel] Respuesta:', res)
  return res
}

export async function deleteModel(id: string) {
  console.log('🗑️ [deleteModel] Eliminando modelo con ID:', id)
  const res = await cockpitFetch<any>(`content/item/${MODEL}/${id}`, {
    method: 'DELETE',
  })
  console.log('📥 [deleteModel] Respuesta:', res)
  return res
}

/** TOTAL */
export async function getTotalModels(
  p: Omit<ListParams, 'limit' | 'skip' | 'sort'> = {}
): Promise<number> {
  const { search = '', filter = {}, populate = 0 } = p
  const nameFilter = search ? { name: { $regex: search, $options: 'i' } } : {}
  const body = {
    filter: { ...filter, ...nameFilter },
    limit: 1,
    skip: 0,
    sort: { _created: -1 },
    populate,
  }

  console.groupCollapsed('📤 [getTotalModels] Request → Cockpit')
  console.log('endpoint:', `content/items/${MODEL}`)
  console.log('method:', 'POST')
  console.log('body:', body)
  console.groupEnd()

  const res = await cockpitFetch<CockpitListResponse<Model>>(
    `content/items/${MODEL}`,
    { method: 'POST', body }
  )

  console.groupCollapsed('📥 [getTotalModels] Response ← Cockpit')
  console.log('meta.total:', res.meta?.total, 'data.length:', res.data?.length)
  console.groupEnd()

  return res.meta?.total ?? (res.data?.length ?? 0)
}
