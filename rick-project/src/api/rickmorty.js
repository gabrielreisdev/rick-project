const REMOTE_BASE = 'https://rickandmortyapi.com/api'
const cache = new Map()
const allCache = new Map()

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchWithRetry(url, options = {}, retries = 1, timeoutMs = 8000) {
  let lastError
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchWithTimeout(url, options, timeoutMs)
    } catch (err) {
      lastError = err
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (i + 1)))
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

    // In browser, try proxy first (to bypass ad-blockers for location) then direct remote
    const candidateUrls = [
      `/rm-api${proxyPath}`,
      `${REMOTE_BASE}${path}`,
    ]

    let lastError = null

    for (const url of candidateUrls) {
      try {
        const res = await fetchWithRetry(url, {}, 1, 8000)
        const contentType = res.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')

        // 404 from Rick and Morty API means no matches/not found
        if (res.status === 404 && isJson) return null

        if (res.ok) {
          try {
            return await res.json()
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
  const data = await request(`/${resource}/${numId}`)
  if (!data || data.error) return null
  return data
}

export async function fetchMany(resource, ids) {
  if (!Array.isArray(ids)) return []
  const unique = [...new Set(ids.map(Number).filter((n) => Number.isFinite(n) && n > 0))]
  if (!unique.length) return []
  try {
    const data = await request(`/${resource}/${unique.join(',')}`)
    if (!data || data.error) return []
    const list = Array.isArray(data) ? data : [data]
    return list.filter((item) => item && typeof item === 'object' && item.id)
  } catch (err) {
    console.warn(`fetchMany(${resource}) falhou:`, err)
    return []
  }
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
  return `${REMOTE_BASE}/character/avatar/${id}.jpeg`
}
