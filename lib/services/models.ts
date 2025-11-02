import { cockpitFetch } from "../cockpit";

const MODEL = "models";

// 🔹 GIF por defecto (solo se usa si no llega ninguna imagen)
const DEFAULT_GIF =
  "https://i.pinimg.com/originals/a8/28/88/a828888852e708d9afaaad06c7f9513f.gif";

export interface Model {
  _id?: string;
  _created?: number;
  _modified?: number;
  slug: string;
  name: string;
  year?: number;
  image?: string | { path?: string } | null;
  img?: string | { path?: string } | null;
  summary?: string;
  power_hp?: number;
  manufacturer?: unknown;
  designer?: unknown;
  displayImage?: string;
}

type ListParams = {
  search?: string;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  filter?: Record<string, any>;
  populate?: 0 | 1;
  /** Activa logs y expone datos en window */
  debug?: boolean;
};

/** Respuesta real de Cockpit v2 para /api/content/items */
interface CockpitListResponse<T> {
  data: T[];
  meta: { total: number };
}

/** Convierte rutas de assets de Cockpit */
export const toAssetUrl = (
  asset?: string | { path?: string } | null
): string =>
  !asset ? "" : typeof asset === "string" ? asset : asset.path || "";

/** Pretty stringify seguro */
const j = (v: any) => {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

/**
 * Normaliza el modelo para asegurar que siempre tenga algo que mostrar.
 * Si no trae imagen ni img, usa un GIF predeterminado.
 */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // quita signos raros
    .replace(/\s+/g, "-"); // espacios → guiones

const normalizeModel = (m: Model): Model => {
  const n = { ...m };

  // 🔹 Slug seguro (si no hay, lo generamos con name)
  n.slug = n.slug ? slugify(n.slug) : n.name ? slugify(n.name) : "";

  // 🔹 Imagen con fallback
  const imageUrl = toAssetUrl(n.image) || toAssetUrl(n.img) || "";
  n.displayImage = imageUrl !== "" ? imageUrl : DEFAULT_GIF;

  return n;
};

/** LISTAR (POST /content/items/{model}) */
/** LISTAR (POST /content/items/{model}) */
export async function listModels(p: ListParams = {}): Promise<Model[]> {
  const {
    search = "",
    limit = 20,
    skip = 0,
    sort = { year: -1 },
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

  console.log("📤 [listModels] Enviando petición a Cockpit:", {
    endpoint: `content/items/${MODEL}`,
    method: "POST",
    body,
  });

  try {
    const res = await cockpitFetch<CockpitListResponse<Model>>(
      `content/items/${MODEL}`,
      { method: "POST", body }
    );

    console.log("📥 [listModels] Respuesta completa desde Cockpit:", res);

    console.log(
      `📦 [listModels] Total meta.total: ${res.meta?.total ?? "N/A"} | data.length: ${res.data?.length ?? 0}`
    );

    if (res.data?.length) {
      console.group("🧩 [listModels] Modelos recibidos:");
      res.data.forEach((m, i) => {
        console.log(`${i + 1}. ${m.name ?? "(sin nombre)"} | slug: ${m.slug}`);
      });
      console.groupEnd();
    } else {
      console.warn("⚠️ [listModels] No se recibieron modelos en la respuesta");
    }

    const items = (res.data ?? []).map(normalizeModel);

    // 🔹 Mostrar los modelos normalizados (ya con displayImage listo)
    console.group("✨ [listModels] Modelos normalizados:");
    console.table(
      items.map((m) => ({
        name: m.name,
        slug: m.slug,
        displayImage: m.displayImage,
        power_hp: m.power_hp ?? "—",
        year: m.year ?? "—",
      }))
    );
    console.groupEnd();

    console.log(`✅ [listModels] Total de modelos listos: ${items.length}`);
    return items;
  } catch (error) {
    console.error("❌ [listModels] Error al obtener modelos:", error);
    return [];
  }
}

// Utilidad para regex seguro en filtros
const escapeRegExp = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** OBTENER POR ID (GET /content/item/{MODEL}/{id}) */
export async function getModelById(id: string): Promise<Model | null> {
  console.log('📤 [getModelById] Enviando petición a Cockpit:', {
    endpoint: `content/item/${MODEL}/${id}`,
    method: 'GET'
  })

  try {
    // Cockpit suele devolver el documento "plano" (no envuelto en {data})
    const res = await cockpitFetch<any>(`content/item/${MODEL}/${id}`, {
      method: 'GET'
    })

    console.log('📥 [getModelById] Respuesta completa desde Cockpit:', res)

    if (!res || typeof res !== 'object' || (!res._id && !res.slug && !res.name)) {
      console.warn('⚠️ [getModelById] Documento no encontrado o respuesta vacía')
      return null
    }

    const item = normalizeModel(res as Model)

    console.group('✨ [getModelById] Modelo normalizado:')
    console.table([{
      _id: item._id,
      name: item.name,
      slug: item.slug,
      displayImage: item.displayImage,
      power_hp: item.power_hp ?? '—',
      year: item.year ?? '—'
    }])
    console.groupEnd()

    console.log('✅ [getModelById] OK')
    return item
  } catch (error) {
    console.error('❌ [getModelById] Error al obtener modelo por ID:', error)
    return null
  }
}

/** OBTENER POR SLUG/NAME (POST /content/items/{MODEL} con filtro) */
export async function getModelBySlug(raw: string): Promise<Model | null> {
  const exact = raw?.trim() ?? ''
  const exactCi = `^${escapeRegExp(exact)}$` // coincidencia exacta, case-insensitive

  // Permitimos: slug exacto, slug CI, name CI (por si el slug no está bien guardado)
  const body = {
    filter: {
      $or: [
        { slug: exact },
        { slug: { $regex: exactCi, $options: 'i' } },
        { name: { $regex: exactCi, $options: 'i' } }
      ]
    },
    limit: 1,
    populate: 1
  }

  console.log('📤 [getModelBySlug] Enviando petición a Cockpit:', {
    endpoint: `content/items/${MODEL}`,
    method: 'POST',
    body
  })

  try {
    const res = await cockpitFetch<CockpitListResponse<Model>>(
      `content/items/${MODEL}`,
      { method: 'POST', body }
    )

    console.log('📥 [getModelBySlug] Respuesta completa desde Cockpit:', res)
    console.log(`📦 [getModelBySlug] meta.total: ${res.meta?.total ?? 'N/A'} | data.length: ${res.data?.length ?? 0}`)

    const m = res.data?.[0]
    if (!m) {
      console.warn('⚠️ [getModelBySlug] No se encontró modelo con ese slug/name')
      return null
    }

    const item = normalizeModel(m)

    console.group('✨ [getModelBySlug] Modelo normalizado:')
    console.table([{
      _id: item._id,
      name: item.name,
      slug: item.slug,
      displayImage: item.displayImage,
      power_hp: item.power_hp ?? '—',
      year: item.year ?? '—'
    }])
    console.groupEnd()

    console.log('✅ [getModelBySlug] OK')
    return item
  } catch (error) {
    console.error('❌ [getModelBySlug] Error al obtener modelo por slug:', error)
    return null
  }
}


/** CREAR / ACTUALIZAR / ELIMINAR */
export async function saveModel(data: Partial<Model>) {
  console.log("📤 [saveModel] Guardando modelo:", data);
  const res = await cockpitFetch<any>(`content/item/${MODEL}`, {
    method: "POST",
    body: { data },
  });
  console.log("📥 [saveModel] Respuesta:", res);
  return res;
}

export async function deleteModel(id: string) {
  console.log("🗑️ [deleteModel] Eliminando modelo con ID:", id);
  const res = await cockpitFetch<any>(`content/item/${MODEL}/${id}`, {
    method: "DELETE",
  });
  console.log("📥 [deleteModel] Respuesta:", res);
  return res;
}

/** TOTAL */
export async function getTotalModels(
  p: Omit<ListParams, "limit" | "skip" | "sort"> = {}
): Promise<number> {
  const { search = "", filter = {}, populate = 0 } = p;
  const nameFilter = search ? { name: { $regex: search, $options: "i" } } : {};
  const body = {
    filter: { ...filter, ...nameFilter },
    limit: 1,
    skip: 0,
    sort: { _created: -1 },
    populate,
  };

  console.groupCollapsed("📤 [getTotalModels] Request → Cockpit");
  console.log("endpoint:", `content/items/${MODEL}`);
  console.log("method:", "POST");
  console.log("body:", body);
  console.groupEnd();

  const res = await cockpitFetch<CockpitListResponse<Model>>(
    `content/items/${MODEL}`,
    { method: "POST", body }
  );

  console.groupCollapsed("📥 [getTotalModels] Response ← Cockpit");
  console.log("meta.total:", res.meta?.total, "data.length:", res.data?.length);
  console.groupEnd();

  return res.meta?.total ?? res.data?.length ?? 0;
}
