// lib/services/manufacturers.ts
import { cockpitFetch } from '../cockpit'

const MODEL = 'manufacturers'

export interface Manufacturer {
  _id?: string
  _created?: number
  _modified?: number
  slug: string
  name: string
  logo?: string | { path?: string } | null
  country?: string
  founded?: number | string
  bio?: string
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

/** Normaliza URL de asset */
export const toAssetUrl = (asset?: string | { path?: string } | null): string => {
  if (!asset) return ''
  return typeof asset === 'string' ? asset : (asset.path || '')
}

/** Normaliza un fabricante (convierte logo a URL) */
const normalize = (m: Manufacturer): Manufacturer => {
  const n = { ...m }
  if (n.logo && typeof n.logo === 'object') n.logo = toAssetUrl(n.logo) || ''
  return n
}

/** Lista de fabricantes – usa Content API y devuelve array directo */
export async function listManufacturers(p: ListParams = {}): Promise<Manufacturer[]> {
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

  const data = await cockpitFetch<CockpitListResponse<Manufacturer>>(
    `content/items/${MODEL}`,
    { method: 'POST', body }
  )

  return (data.entries ?? []).map(normalize)
}

/** Obtiene un fabricante por slug – null si no existe (Content API) */
export async function getManufacturerBySlug(slug: string): Promise<Manufacturer | null> {
  const data = await cockpitFetch<CockpitListResponse<Manufacturer>>(
    `content/items/${MODEL}`,
    { method: 'POST', body: { filter: { slug }, limit: 1, populate: 1 } }
  )
  const m = data.entries?.[0]
  return m ? normalize(m) : null
}

/** Crea un fabricante (Content API) */
export async function createManufacturer(data: Partial<Manufacturer>) {
  // POST /content/item/{model}  -> crea (y también actualiza si envías _id)
  return await cockpitFetch<any>(`content/item/${MODEL}`, {
    method: 'POST',
    body: { data }
  })
}

/** Actualiza un fabricante por _id (Content API) */
export async function updateManufacturer(id: string, data: Partial<Manufacturer>) {
  return await cockpitFetch<any>(`content/item/${MODEL}`, {
    method: 'POST',
    body: { data: { ...data, _id: id } }
  })
}

/** Elimina un fabricante por _id (Content API) */
export async function deleteManufacturer(id: string) {
  // DELETE /content/item/{model}/{id}
  return await cockpitFetch<any>(`content/item/${MODEL}/${id}`, {
    method: 'DELETE'
  })
}

/** Total de fabricantes (Content API) */
export async function getTotalManufacturers(
  p: Omit<ListParams, 'limit' | 'skip' | 'sort'> = {}
): Promise<number> {
  const { search = '', filter = {}, populate = 0 } = p
  const nameFilter = search ? { name: { $regex: search, $options: 'i' } } : {}

  const data = await cockpitFetch<CockpitListResponse<Manufacturer>>(
    `content/items/${MODEL}`,
    {
      method: 'POST',
      body: {
        filter: { ...filter, ...nameFilter },
        limit: 1,
        skip: 0,
        sort: { _created: -1 },
        populate
      }
    }
  )

  return data.total ?? (data.entries?.length ?? 0)
}
