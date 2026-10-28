const REMOTE_BASE = 'https://rickandmortyapi.com/api'
const GQL_ENDPOINTS = ['/rm-gql', 'https://rickandmortyapi.com/graphql']
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

const GQL_FIELDS = {
  character: `id name status species type gender image created origin { id name } location { id name } episode { id }`,
  location: `id name type dimension created residents { id }`,
  episode: `id name air_date episode created characters { id }`,
}

function normalizeGqlEntity(resource, item) {
  if (!item || !item.id) return null
  const id = Number(item.id)
  if (resource === 'character') {
    return {
      id,
      name: item.name ?? '',
      status: item.status ?? 'unknown',
      species: item.species ?? '',
      type: item.type ?? '',
      gender: item.gender ?? 'unknown',
      origin: {
        name: item.origin?.name ?? 'unknown',
        url: item.origin?.id ? `${REMOTE_BASE}/location/${item.origin.id}` : '',
      },
      location: {
        name: item.location?.name ?? 'unknown',
        url: item.location?.id ? `${REMOTE_BASE}/location/${item.location.id}` : '',
      },
      image: item.image || `${REMOTE_BASE}/character/avatar/${id}.jpeg`,
      episode: Array.isArray(item.episode)
        ? item.episode.map((e) => (typeof e === 'string' ? e : `${REMOTE_BASE}/episode/${e.id}`))
        : [],
      url: `${REMOTE_BASE}/character/${id}`,
      created: item.created ?? '',
    }
  }
  if (resource === 'location') {
    return {
      id,
      name: item.name ?? '',
      type: item.type ?? '',
      dimension: item.dimension ?? '',
      residents: Array.isArray(item.residents)
        ? item.residents.map((c) => (typeof c === 'string' ? c : `${REMOTE_BASE}/character/${c.id}`))
        : [],
      url: `${REMOTE_BASE}/location/${id}`,
      created: item.created ?? '',
    }
  }
  if (resource === 'episode') {
    return {
      id,
      name: item.name ?? '',
      air_date: item.air_date ?? '',
      episode: item.episode ?? '',
      characters: Array.isArray(item.characters)
        ? item.characters.map((c) => (typeof c === 'string' ? c : `${REMOTE_BASE}/character/${c.id}`))
        : [],
      url: `${REMOTE_BASE}/episode/${id}`,
      created: item.created ?? '',
    }
  }
  return null
}

async function queryGraphQL(query, variables = {}) {
  let lastErr
  for (const endpoint of GQL_ENDPOINTS) {
    try {
      const res = await fetchWithRetry(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ query, variables }),
        },
        1,
        10000,
      )
      const contentType = res.headers.get('content-type') || ''
      if (!res.ok || !contentType.includes('application/json')) continue
      const json = await res.json()
      if (json?.data) return json.data
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr || new Error('GraphQL fallback failed')
}

async function fallbackGraphQL(path) {
  const [pathname, search = ''] = path.split('?')
  const parts = pathname.split('/').filter(Boolean)
  const resource = parts[0]
  const idPart = parts[1]
  const fields = GQL_FIELDS[resource]
  if (!fields) throw new Error(`Recurso desconhecido: ${resource}`)

  if (!idPart) {
    const params = new URLSearchParams(search)
    const page = Number(params.get('page')) || 1
    const filter = {}
    for (const [k, v] of params.entries()) {
      if (k !== 'page' && v) filter[k] = v
    }
    const plural = `${resource}s`
    const query = `query ($page: Int, $filter: Filter${resource[0].toUpperCase() + resource.slice(1)}) {
      ${plural}(page: $page, filter: $filter) {
        info { count pages next prev }
        results { ${fields} }
      }
    }`
    const data = await queryGraphQL(query, { page, filter })
    const res = data?.[plural]
    if (!res || !res.info || res.info.count == null) return null
    const results = (res.results || []).map((item) => normalizeGqlEntity(resource, item)).filter(Boolean)
    storeEntities(resource, results)
    return {
      info: {
        count: res.info.count,
        pages: res.info.pages,
        next: res.info.next ? `${REMOTE_BASE}/${resource}?page=${res.info.next}` : null,
        prev: res.info.prev ? `${REMOTE_BASE}/${resource}?page=${res.info.prev}` : null,
      },
      results,
    }
  }

  if (idPart.includes(',')) {
    const ids = idPart.split(',').map((x) => x.trim()).filter(Boolean)
    const queryName = `${resource}sByIds`
    const query = `query ($ids: [ID!]!) {
      ${queryName}(ids: $ids) { ${fields} }
    }`
    const data = await queryGraphQL(query, { ids })
    const list = (data?.[queryName] || []).map((item) => normalizeGqlEntity(resource, item)).filter(Boolean)
    storeEntities(resource, list)
    return list
  }

  const query = `query ($id: ID!) {
    ${resource}(id: $id) { ${fields} }
  }`
  const data = await queryGraphQL(query, { id: idPart })
  if (!data?.[resource]) return null
  const normalized = normalizeGqlEntity(resource, data[resource])
  storeEntities(resource, normalized)
  return normalized
}

async function request(path) {
  if (cache.has(path)) return cache.get(path)

  const promise = (async () => {
    const isLocation = path.startsWith('/location')
    const proxyPath = isLocation ? path.replace(/^\/location/, '/places') : path

    // Try proxy first (bypasses ad-blockers for /location) then direct remote API
    const candidateUrls = [
      `/rm-api${proxyPath}`,
      `${REMOTE_BASE}${path}`,
    ]

    let lastError = null

    for (const url of candidateUrls) {
      try {
        const res = await fetchWithRetry(url, {}, 2, 10000)
        const contentType = res.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')

        // 404 from Rick and Morty API means no matches/not found
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

    // Fallback to GraphQL endpoint if REST endpoints failed (e.g. ad-blocker or rate-limit)
    try {
      return await fallbackGraphQL(path)
    } catch (gqlErr) {
      lastError = lastError || gqlErr
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
  return `${REMOTE_BASE}/character/avatar/${id}.jpeg`
}
