const BASE_URL = 'https://rickandmortyapi.com/api'
const cache = new Map()
const allCache = new Map()
const entityCache = {
  character: new Map(),
  location: new Map(),
  episode: new Map(),
}

function storeEntities(resource, data) {
  const map = entityCache[resource]
  if (!map || !data) return
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data.results)
      ? data.results
      : data.id
        ? [data]
        : []
  for (const item of list) {
    if (item && typeof item === 'object' && item.id) {
      map.set(Number(item.id), item)
    }
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchWithRetry(url, options = {}, retries = 2, timeoutMs = 10000) {
  let lastError
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetchWithTimeout(url, options, timeoutMs)
      if (res.status === 429 && i < retries) {
        const retryAfter = Number(res.headers.get('retry-after')) || 1
        await new Promise((r) => setTimeout(r, retryAfter * 1000 + 250 * (i + 1)))
        continue
      }
      return res
    } catch (err) {
      lastError = err
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, 350 * (i + 1)))
      }
    }
  }
  throw lastError
}

async function request(path) {
  if (cache.has(path)) return cache.get(path)

  const promise = (async () => {
    const isLocation = path.startsWith('/location')
    const proxyPath = isLocation ? path.replace(/^\/location/, '/places') : path

    // Usa a REST API (https://rickandmortyapi.com/api) diretamente e via proxy local de fallback
    const candidateUrls = [
      `${BASE_URL}${path}`,
      `/rm-api${proxyPath}`,
    ]

    let lastError = null

    for (const url of candidateUrls) {
      try {
        const res = await fetchWithRetry(url, {}, 2, 10000)
        const contentType = res.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')

        // 404 na REST API do Rick and Morty significa nenhum resultado encontrado
        if (res.status === 404 && isJson) return null

        if (res.ok && isJson) {
          try {
            const json = await res.json()
            const resource = path.split('?')[0].split('/').filter(Boolean)[0]
            storeEntities(resource, json)
            return json
          } catch (jsonErr) {
            lastError = jsonErr
            continue
          }
        } else {
          lastError = new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
      } catch (err) {
        lastError = err
      }
    }

    cache.delete(path)
    throw lastError || new Error('Falha na API')
  })()

  cache.set(path, promise)
  return promise
}

const EMPTY_PAGE = { info: { count: 0, pages: 0, next: null, prev: null }, results: [] }

export async function fetchPage(resource, page = 1, filters = {}) {
  const params = new URLSearchParams({ page: String(page) })
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  }
  try {
    const data = await request(`/${resource}?${params}`)
    return data ?? EMPTY_PAGE
  } catch (err) {
    console.warn(`fetchPage(${resource}, ${page}) falhou:`, err)
    return EMPTY_PAGE
  }
}

export async function fetchOne(resource, id) {
  const numId = Number(id)
  if (!Number.isFinite(numId) || numId <= 0) return null
  const cached = entityCache[resource]?.get(numId)
  if (cached) return cached
  const data = await request(`/${resource}/${numId}`)
  if (!data || data.error) return null
  return data
}

export async function fetchMany(resource, ids) {
  if (!Array.isArray(ids)) return []
  const unique = [...new Set(ids.map(Number).filter((n) => Number.isFinite(n) && n > 0))]
  if (!unique.length) return []

  const map = entityCache[resource]
  const missing = map ? unique.filter((id) => !map.has(id)) : unique

  if (missing.length) {
    try {
      const data = await request(`/${resource}/${missing.join(',')}`)
      if (data && !data.error) {
        const list = Array.isArray(data) ? data : [data]
        storeEntities(resource, list)
      }
    } catch (err) {
      console.warn(`fetchMany(${resource}) falhou:`, err)
    }
  }

  return unique.map((id) => map?.get(id)).filter((item) => item && typeof item === 'object' && item.id)
}

export async function fetchAll(resource, filters = {}) {
  const cacheKey = `${resource}:${JSON.stringify(filters)}`
  if (allCache.has(cacheKey)) return allCache.get(cacheKey)

  const promise = (async () => {
    try {
      const first = await fetchPage(resource, 1, filters)
      const totalPages = Math.max(0, Number(first?.info?.pages) || 0)
      if (totalPages <= 1) return first.results ?? []

      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          fetchPage(resource, i + 2, filters),
        ),
      )
      return [first, ...rest].flatMap((p) => p.results ?? [])
    } catch (err) {
      allCache.delete(cacheKey)
      throw err
    }
  })()

  allCache.set(cacheKey, promise)
  return promise
}

export async function fetchCount(resource) {
  try {
    const { info } = await fetchPage(resource, 1)
    return info?.count ?? 0
  } catch {
    return 0
  }
}

export function idFromUrl(url) {
  if (!url) return null
  const id = Number(String(url).split('/').pop())
  return Number.isFinite(id) ? id : null
}

export function characterAvatar(id) {
  return `${BASE_URL}/character/avatar/${id}.jpeg`
}
