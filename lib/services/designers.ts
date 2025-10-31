import { cockpitFetch } from "../cockpit";

const MODEL = "designers";

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
  models?: unknown[];
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

export const toAssetUrl = (
  asset?: string | { path?: string } | null
): string =>
  !asset ? "" : typeof asset === "string" ? asset : asset.path || "";

const normalize = (d: Designer): Designer => {
  const n = { ...d };
  if (n.photo && typeof n.photo === "object") n.photo = toAssetUrl(n.photo) || "";
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
  } = p;

  const nameFilter = search ? { name: { $regex: search, $options: "i" } } : {};
  const body = {
    filter: { ...filter, ...nameFilter },
    limit,
    skip,
    sort,
    populate,
  };

  const res = await cockpitFetch<CockpitListResponse<Designer>>(
    `content/items/${MODEL}`,
    { method: "POST", body }
  );

  // Ahora usamos res.data, no res.entries
  return (res.data ?? []).map(normalize);
}

export async function getDesignerBySlug(slug: string): Promise<Designer | null> {
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
