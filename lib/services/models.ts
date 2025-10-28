// lib/services/models.ts
import { cockpitFetch } from '../cockpit'

const MODEL = 'models'

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
}

type ListParams = {
  search?: string
  limit?: number
  skip?: number
  sort?: Record<string, 1 | -1>
  filter?: Record<string, any>
  populate?: 0 | 1
}

export const toAssetUrl = (asset?: string | { path?: string } | null): string =>
  !asset ? '' : typeof asset === 'string' ? asset : (asset.path || '')

const normalizeModel = (m: Model): Model => {
  const n = { ...m }
  if (n.image && typeof n.image === 'object') n.image = toAssetUrl(n.image) || ''
  if (n.img && typeof n.img === 'object') n.img = toAssetUrl(n.img) || ''
  return n
}

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

  const res = await cockpitFetch<any>(`content/items/${MODEL}`, {
    method: 'POST',
    body,
  })

  console.log('📥 [listModels] Respuesta recibida desde Cockpit:', res)

  const items: Model[] = Array.isArray(res) ? res : (res?.entries ?? [])
  console.log(`✅ [listModels] Total de modelos recibidos: ${items.length}`)
  return items.map(normalizeModel)
}

/** OBTENER POR SLUG */
export async function getModelBySlug(slug: string): Promise<Model | null> {
  console.log('📤 [getModelBySlug] Consultando modelo con slug:', slug)
  const res = await cockpitFetch<any>(`content/items/${MODEL}`, {
    method: 'POST',
    body: { filter: { slug }, limit: 1, populate: 1 },
  })
  console.log('📥 [getModelBySlug] Respuesta:', res)
  const arr: Model[] = Array.isArray(res) ? res : (res?.entries ?? [])
  return arr[0] ? normalizeModel(arr[0]) : null
}

/** CREAR / ACTUALIZAR */
export async function saveModel(data: Partial<Model>) {
  console.log('📤 [saveModel] Guardando modelo:', data)
  const res = await cockpitFetch<any>(`content/item/${MODEL}`, {
    method: 'POST',
    body: { data },
  })
  console.log('📥 [saveModel] Respuesta:', res)
  return res
}

/** ELIMINAR */
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
  const body = { filter: { ...filter, ...nameFilter }, limit: 1000, skip: 0, sort: { _created: -1 }, populate }

  console.log('📤 [getTotalModels] Consultando total de modelos...')
  const res = await cockpitFetch<any>(`content/items/${MODEL}`, {
    method: 'POST',
    body,
  })
  console.log('📥 [getTotalModels] Respuesta:', res)

  const items: Model[] = Array.isArray(res) ? res : (res?.entries ?? [])
  console.log(`✅ [getTotalModels] Total encontrados: ${items.length}`)
  return items.length
}
