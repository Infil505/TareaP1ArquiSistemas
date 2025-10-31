import { cockpitFetch } from "../cockpit";

const MODEL = "manufacturers";

export interface Manufacturer {
  _id?: string;
  _created?: number;
  _modified?: number;
  slug: string;
  name: string;
  logo?: string | { path?: string } | null;
  country?: string;
  founded?: number | string;
  bio?: string;
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
): string => {
  if (!asset) return "";
  return typeof asset === "string" ? asset : asset.path || "";
};

const normalize = (m: Manufacturer): Manufacturer => {
  const n = { ...m };
  if (n.logo && typeof n.logo === "object") n.logo = toAssetUrl(n.logo) || "";
  return n;
};

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
  const body = {
    filter: { ...filter, ...nameFilter },
    limit,
    skip,
    sort,
    populate,
  };

  const res = await cockpitFetch<CockpitListResponse<Manufacturer>>(
    `content/items/${MODEL}`,
    { method: "POST", body }
  );

  return (res.data ?? []).map(normalize);
}

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
        limit: 1, // basta 1, el total real viene en meta.total
        skip: 0,
        sort: { _created: -1 },
        populate,
      },
    }
  );

  return res.meta?.total ?? (res.data?.length ?? 0);
}
