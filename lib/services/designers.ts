import { cockpitFetch } from "../cockpit";

const MODEL = "designers";

const BASE =
  import.meta.env.VITE_COCKPIT_BASE_URL?.replace(/\/$/, "") || "";

export interface Designer {
  _id?: string;
  _created?: number;
  _modified?: number;
  slug: string;
  name: string;
  country?: string;
  photo?: string | { path?: string } | null;
  bio?: string;
  specialty?: string;
  notable_projects?: string[];
  birth_year?: number;
  awards?: string[];
  /** Lista de slugs de modelos relacionados */
  models?: string[]; // normalizada a string[] en normalize
  /** Modelo destacado por slug (opcional) */
  featured_model?: string;
  /** Contenido markdown/html renderizable por ContentRenderer */
  body?: any;
}

/** Respuesta real de Cockpit v2 para content/items */
interface CockpitListResponse<T> {
  data: T[];
  meta: { total: number };
}

type ListParams = {
  search?: string;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  filter?: Record<string, any>;
  populate?: 0 | 1;
  /** Campos a devolver (optimización opcional) */
  fields?: string[];
};

/** Convierte asset de Cockpit a URL absoluta usable en <img> o CSS bg */
export const toAssetUrl = (
  asset?: string | { path?: string } | null
): string => {
  if (!asset) return "";
  const raw = typeof asset === "string" ? asset : asset.path || "";
  if (!raw) return "";
  // Si ya es absoluta, dejarla tal cual
  if (/^https?:\/\//i.test(raw)) return raw;
  // Si inicia con slash, anteponer BASE
  if (raw.startsWith("/")) return `${BASE}${raw}`;
  // Caso contrario, unir con BASE
  return `${BASE}/${raw}`;
};

/** Normaliza un diseñador:
 * - photo a string absoluta
 * - models a string[] (slugs)
 */
const normalize = (d: Designer): Designer => {
  const n: Designer = { ...d };

  // photo -> string absoluta
  n.photo = toAssetUrl(d.photo);

  // models -> string[]
  const rawModels = (d.models as unknown) as unknown[] | undefined;
  if (Array.isArray(rawModels)) {
    n.models = rawModels
      .map((m) => {
        // si ya es string (slug)
        if (typeof m === "string") return m;
        // si viene como objeto { slug } desde relación
        if (m && typeof m === "object" && "slug" in (m as any)) {
          return (m as any).slug as string;
        }
        // si viene como objeto con _id/relación, ignorar (no tenemos slug)
        return null;
      })
      .filter((s): s is string => !!s && s.trim().length > 0);
  } else {
    n.models = [];
  }

  return n;
};

export async function listDesigners(p: ListParams = {}): Promise<Designer[]> {
  const {
    search = "",
    limit = 20,
    skip = 0,
    sort = { _created: -1 },
    filter = {},
    populate = 1,
    fields,
  } = p;

  const nameFilter = search
    ? { name: { $regex: search, $options: "i" } }
    : {};

  const body: Record<string, any> = {
    filter: { ...filter, ...nameFilter },
    limit,
    skip,
    sort,
    populate,
  };

  if (Array.isArray(fields) && fields.length) {
    body.fields = fields;
  }

  const res = await cockpitFetch<CockpitListResponse<Designer>>(
    `content/items/${MODEL}`,
    { method: "POST", body }
  );

  return (res.data ?? []).map(normalize);
}

export async function getDesignerBySlug(
  slug: string
): Promise<Designer | null> {
  const res = await cockpitFetch<CockpitListResponse<Designer>>(
    `content/items/${MODEL}`,
    { method: "POST", body: { filter: { slug }, limit: 1, populate: 1 } }
  );
  const d = res.data?.[0];
  return d ? normalize(d) : null;
}

export async function getDesignerById(id: string): Promise<Designer | null> {
  const res = await cockpitFetch<CockpitListResponse<Designer>>(
    `content/items/${MODEL}`,
    { method: "POST", body: { filter: { _id: id }, limit: 1, populate: 1 } }
  );
  const d = res.data?.[0];
  return d ? normalize(d) : null;
}

/** Resolver por _id (24 hex) o slug normalizado (útil para rutas dinámicas) */
export async function getDesignerByIdOrSlug(
  param: string
): Promise<Designer | null> {
  const isId = /^[a-f0-9]{24}$/i.test(param);
  if (isId) {
    const byId = await getDesignerById(param);
    if (byId) return byId;
  }
  return await getDesignerBySlug(param);
}

/** Batch por slugs (útil si querés precargar varios para una grilla) */
export async function getDesignersBySlugs(
  slugs: string[]
): Promise<Designer[]> {
  if (!slugs?.length) return [];
  const res = await cockpitFetch<CockpitListResponse<Designer>>(
    `content/items/${MODEL}`,
    {
      method: "POST",
      body: {
        filter: { slug: { $in: slugs } },
        limit: slugs.length,
        populate: 1,
      },
    }
  );
  return (res.data ?? []).map(normalize);
}

export async function createDesigner(data: Partial<Designer>) {
  return await cockpitFetch<any>(`content/item/${MODEL}`, {
    method: "POST",
    body: { data },
  });
}

export async function updateDesigner(id: string, data: Partial<Designer>) {
  return await cockpitFetch<any>(`content/item/${MODEL}`, {
    method: "POST",
    body: { data: { ...data, _id: id } },
  });
}

export async function deleteDesigner(id: string) {
  return await cockpitFetch<any>(`content/item/${MODEL}/${id}`, {
    method: "DELETE",
  });
}
