import { cockpitFetch } from "../cockpit";

const MODEL = "manufacturers";

export interface Manufacturer {
  _id?: string;
  _created?: number;
  _modified?: number;

  /* claves principales */
  slug: string;
  name: string;

  /* media / texto */
  logo?: string | { path?: string } | null;
  bio?: string;
  body?: any;                 // ← para ContentRenderer cuando venga contenido enriquecido

  /* metadatos opcionales */
  country?: string;
  founded?: number | string;
  headquarters?: string;
  website?: string;
  employees?: number;

  /* relaciones opcionales (como en tu vista) */
  models?: string[];
  featured_model?: string;

  /** campo calculado en normalize() */
  displayLogo?: string;
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
};

/* ---------------------------
 * Utils
 * --------------------------*/
export const toAssetUrl = (
  asset?: string | { path?: string } | null
): string => {
  if (!asset) return "";
  return typeof asset === "string" ? asset : asset.path || "";
};

const normalize = (m: Manufacturer): Manufacturer => {
  const n: Manufacturer = { ...m };

  // Asegura logo como string plano y displayLogo calculado
  const raw =
    typeof n.logo === "object" && n.logo
      ? (n.logo as { path?: string }).path
      : (n.logo as string | undefined);

  const logoUrl = raw ? String(raw) : "";
  n.displayLogo = logoUrl;
  if (n.logo && typeof n.logo === "object") n.logo = logoUrl;

  return n;
};

/* ---------------------------
 * Listado / conteo
 * --------------------------*/
export async function listManufacturers(
  p: ListParams = {}
): Promise<Manufacturer[]> {
  const {
    search = "",
    limit = 20,
    skip = 0,
    sort = { _created: -1 },
    filter = {},
    populate = 1,
  } = p;

  const nameFilter = search ? { name: { $regex: search, $options: "i" } } : {};
  const body = { filter: { ...filter, ...nameFilter }, limit, skip, sort, populate };

  const res = await cockpitFetch<CockpitListResponse<Manufacturer>>(
    `content/items/${MODEL}`,
    { method: "POST", body }
  );

  return (res.data ?? []).map(normalize);
}

export async function getTotalManufacturers(
  p: Omit<ListParams, "limit" | "skip" | "sort"> = {}
): Promise<number> {
  const { search = "", filter = {}, populate = 0 } = p;
  const nameFilter = search ? { name: { $regex: search, $options: "i" } } : {};

  const res = await cockpitFetch<CockpitListResponse<Manufacturer>>(
    `content/items/${MODEL}`,
    {
      method: "POST",
      body: {
        filter: { ...filter, ...nameFilter },
        limit: 1,
        skip: 0,
        sort: { _created: -1 },
        populate,
      },
    }
  );

  return res.meta?.total ?? (res.data?.length ?? 0);
}

/* ---------------------------
 * Lecturas por slug / id
 * --------------------------*/
export async function getManufacturerBySlug(
  slug: string
): Promise<Manufacturer | null> {
  const res = await cockpitFetch<CockpitListResponse<Manufacturer>>(
    `content/items/${MODEL}`,
    { method: "POST", body: { filter: { slug }, limit: 1, populate: 1 } }
  );
  const m = res.data?.[0];
  return m ? normalize(m) : null;
}

/** ✅ Lectura directa por _id usando GET /content/item/{model}/{id} */
export async function getManufacturerById(id: string): Promise<Manufacturer | null> {
  try {
    const m = await cockpitFetch<Manufacturer>(`content/item/${MODEL}/${id}`, {
      method: "GET",
    });
    return m ? normalize(m) : null;
  } catch (e) {
    console.warn("[getManufacturerById] No encontrado o error:", e);
    return null;
  }
}

/**
 * 🔎 Helper universal: intenta primero por _id (si parece ObjectId 24-hex),
 * si no, busca por slug.
 */
export async function getManufacturerBySlugOrId(param: string): Promise<Manufacturer | null> {
  const looksLikeId = /^[a-f0-9]{24}$/i.test(param);
  if (looksLikeId) {
    const byId = await getManufacturerById(param);
    if (byId) return byId;
  }
  return await getManufacturerBySlug(param);
}

/* ---------------------------
 * Batch helpers (opcionales)
 * --------------------------*/
export async function getManufacturersByIds(ids: string[]): Promise<Manufacturer[]> {
  if (!ids?.length) return [];
  const res = await cockpitFetch<CockpitListResponse<Manufacturer>>(
    `content/items/${MODEL}`,
    {
      method: "POST",
      body: {
        filter: { _id: { $in: ids } },
        limit: ids.length,
        populate: 1,
      },
    }
  );
  return (res.data ?? []).map(normalize);
}

export async function getManufacturersBySlugs(slugs: string[]): Promise<Manufacturer[]> {
  if (!slugs?.length) return [];
  const res = await cockpitFetch<CockpitListResponse<Manufacturer>>(
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

/* ---------------------------
 * Crear / actualizar / eliminar
 * --------------------------*/
export async function createManufacturer(data: Partial<Manufacturer>) {
  return await cockpitFetch<any>(`content/item/${MODEL}`, {
    method: "POST",
    body: { data },
  });
}

export async function updateManufacturer(
  id: string,
  data: Partial<Manufacturer>
) {
  return await cockpitFetch<any>(`content/item/${MODEL}`, {
    method: "POST",
    body: { data: { ...data, _id: id } },
  });
}

export async function deleteManufacturer(id: string) {
  return await cockpitFetch<any>(`content/item/${MODEL}/${id}`, {
    method: "DELETE",
  });
}
