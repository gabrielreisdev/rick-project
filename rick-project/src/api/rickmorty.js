const REMOTE_BASE = 'https://rickandmortyapi.com/api'
const cache = new Map()

async function fetchWithRetry(url, options = {}, retries = 2) {
  let lastError
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options)
      return res
    } catch (err) {
      lastError = err
      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (i + 1)))
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
    const candidateUrls = [
      `/rm-api${proxyPath}`,
      `${REMOTE_BASE}${path}`,
    ]

    let lastError = null

    for (const url of candidateUrls) {
      try {
        const res = await fetchWithRetry(url, {}, 1)
        const contentType = res.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')
        if (res.status === 404 && isJson) return null
        if (res.ok) {
          try {
            return await res.json()
          } catch {
            continue
          }
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
  const data = await request(`/${resource}?${params}`)
  return data ?? EMPTY_PAGE
}

export function fetchOne(resource, id) {
  return request(`/${resource}/${id}`)
}

export async function fetchMany(resource, ids) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return []
  const data = await request(`/${resource}/${unique.join(',')}`)
  if (!data) return []
  return Array.isArray(data) ? data : [data]
}

export async function fetchAll(resource, filters = {}) {
  const first = await fetchPage(resource, 1, filters)
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.info.pages - 1) }, (_, i) =>
      fetchPage(resource, i + 2, filters),
    ),
  )
  return [first, ...rest].flatMap((p) => p.results)
}

export async function fetchCount(resource) {
  const { info } = await fetchPage(resource, 1)
  return info.count
}

export function idFromUrl(url) {
  if (!url) return null
  const id = Number(String(url).split('/').pop())
  return Number.isFinite(id) ? id : null
}

export function characterAvatar(id) {
  return `${REMOTE_BASE}/character/avatar/${id}.jpeg`
}
