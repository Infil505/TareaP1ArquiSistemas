// lib/services/designers.ts
import { cockpitFetch } from '../cockpit'

const MODEL = 'designers'

export interface Designer {
  _id?: string
  _created?: number
  _modified?: number
  slug: string
  name: string
  country?: string
  photo?: string | { path?: string } | null
  bio?: string
  specialty?: string
  notable_projects?: string[]
  birth_year?: number
  awards?: string[]
  models?: unknown[]
}

interface CockpitListResponse<T> {
  entries: T[]
  total?: number
}

type ListParams = {
  search?: string
  limit?: number
  skip?: number
  sort?: Record<string, 1 | -1>
  filter?: Record<string, any>
  populate?: 0 | 1
}

/** Convierte asset a URL (string) */
export const toAssetUrl = (asset?: string | { path?: string } | null): string =>
  !asset ? '' : (typeof asset === 'string' ? asset : (asset.path || ''))

/** Normaliza un diseñador (convierte photo a URL) */
const normalize = (d: Designer): Designer => {
  const n = { ...d }
  if (n.photo && typeof n.photo === 'object') n.photo = toAssetUrl(n.photo) || ''
  return n
}

/** Lista de diseñadores – Content API */
export async function listDesigners(p: ListParams = {}): Promise<Designer[]> {
  const {
    search = '',
    limit = 20,
    skip = 0,
    sort = { _created: -1 },
    filter = {},
    populate = 1
  } = p

  const nameFilter = search ? { name: { $regex: search, $options: 'i' } } : {}
  const body = { filter: { ...filter, ...nameFilter }, limit, skip, sort, populate }

  const data = await cockpitFetch<CockpitListResponse<Designer>>(
    `content/items/${MODEL}`,
    { method: 'POST', body }
  )

  return (data.entries ?? []).map(normalize)
}

/** Diseñador por slug – Content API */
export async function getDesignerBySlug(slug: string): Promise<Designer | null> {
  const data = await cockpitFetch<CockpitListResponse<Designer>>(
    `content/items/${MODEL}`,
    { method: 'POST', body: { filter: { slug }, limit: 1, populate: 1 } }
  )
  const d = data.entries?.[0]
  return d ? normalize(d) : null
}

/** Diseñador por _id – Content API */
export async function getDesignerById(id: string): Promise<Designer | null> {
  const data = await cockpitFetch<CockpitListResponse<Designer>>(
    `content/items/${MODEL}`,
    { method: 'POST', body: { filter: { _id: id }, limit: 1, populate: 1 } }
  )
  const d = data.entries?.[0]
  return d ? normalize(d) : null
}

/** Crear diseñador – Content API */
export async function createDesigner(data: Partial<Designer>) {
  // POST /content/item/{model}
  return await cockpitFetch<any>(`content/item/${MODEL}`, {
    method: 'POST',
    body: { data }
  })
}

/** Actualizar diseñador por _id – Content API */
export async function updateDesigner(id: string, data: Partial<Designer>) {
  return await cockpitFetch<any>(`content/item/${MODEL}`, {
    method: 'POST',
    body: { data: { ...data, _id: id } }
  })
}

/** Eliminar diseñador por _id – Content API */
export async function deleteDesigner(id: string) {
  // DELETE /content/item/{model}/{id}
  return await cockpitFetch<any>(`content/item/${MODEL}/${id}`, {
    method: 'DELETE'
  })
}
