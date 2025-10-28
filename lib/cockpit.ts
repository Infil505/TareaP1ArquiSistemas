// lib/cockpit.ts
export type CockpitMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export async function cockpitFetch<T = any>(
  path: string,
  opts: { method?: CockpitMethod; body?: any } = {}
): Promise<T> {
  const method = opts.method ?? 'GET'
  const body = opts.body
  return await $fetch<T>(`/api/cockpit/${path}`, { method, body })
}

