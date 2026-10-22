const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function timeAgo(ts) {
  const diff = (ts - Date.now()) / 1000
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, sec] of units) {
    if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit)
  }
  return 'agora mesmo'
}

export function formatDate(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatNumber(n) {
  return new Intl.NumberFormat('pt-BR').format(n ?? 0)
}
