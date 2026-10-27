export const LABELS = {
  Alive: 'Vivo',
  Dead: 'Morto',
  unknown: 'Desconhecido',
  Unknown: 'Desconhecido',

  Female: 'Feminino',
  Male: 'Masculino',
  Genderless: 'Sem gênero',

  Human: 'Humano',
  Alien: 'Alienígena',
  Humanoid: 'Humanoide',
  Poopybutthole: 'Poopybutthole',
  'Mythological Creature': 'Criatura Mitológica',
  Animal: 'Animal',
  Robot: 'Robô',
  Cronenberg: 'Cronenberg',
  Disease: 'Doença',

  Planet: 'Planeta',
  'Space station': 'Estação Espacial',
  Microverse: 'Microverso',
  Miniverse: 'Miniverso',
  Teenyverse: 'Teenyverso',
  Dimension: 'Dimensão',
  Cluster: 'Aglomerado',
  TV: 'Televisão',
  Resort: 'Resort',
  Dream: 'Sonho',
  Fantasy: 'Fantasia',
  'Fantasy town': 'Cidade Fantástica',
  Spacecraft: 'Nave Espacial',
  Game: 'Jogo',
  Menagerie: 'Zoológico Espacial',
  Prison: 'Prisão',
  Base: 'Base',
  Hospital: 'Hospital',
  Asteroid: 'Asteroide',
  Customs: 'Alfândega',
  Diegesis: 'Diegese',
  Nightmare: 'Pesadelo',
  Woods: 'Floresta',
  Convention: 'Convenção',
  Space: 'Espaço',
  Arcade: 'Fliperama',
  Quadrant: 'Quadrante',
  Mount: 'Montanha',
  Liquid: 'Líquido',
  Consciousness: 'Consciência',
  Memory: 'Memória',

  'Replacement Dimension': 'Dimensão de Substituição',
  'Cronenberg Dimension': 'Dimensão Cronenberg',
  'Fantasy Dimension': 'Dimensão Fantástica',
  'Post-Apocalyptic Dimension': 'Dimensão Pós-Apocalíptica',
  'Eric Stoltz Mask Dimension': 'Dimensão Máscara Eric Stoltz',
  'Testicle Monster Dimension': 'Dimensão Monstro Testicular',
  'Cromulon Dimension': 'Dimensão Cromulon',
  'Unknown dimension': 'Dimensão Desconhecida',
  'Giant Telepathic Spiders Dimension': 'Dimensão das Aranhas Telepáticas Gigantes',
  'Pizza Dimension': 'Dimensão Pizza',
  'Phone Dimension': 'Dimensão Telefone',
  'Chair Dimension': 'Dimensão Cadeira',
  'Fascist Dimension': 'Dimensão Fascista',
  'Fascist Shrimp Dimension': 'Dimensão Camarão Fascista',
  'Fascist Teddy Bear Dimension': 'Dimensão Ursinho Fascista',
  'Wasp Dimension': 'Dimensão Vespa',
  'Magic Dimension': 'Dimensão Mágica',
}

export const t = (value) => {
  if (value === null || value === undefined) return value
  const str = String(value)
  if (LABELS[str]) return LABELS[str]
  if (str.toLowerCase() === 'unknown') return 'Desconhecido'
  if (str.startsWith('Dimension ')) {
    return str.replace(/^Dimension\s+/i, 'Dimensão ')
  }
  return value
}

const STATUS = ['Alive', 'Dead', 'unknown']
const GENDER = ['Female', 'Male', 'Genderless', 'unknown']
const SEASONS = ['S01', 'S02', 'S03', 'S04', 'S05']

export const RESOURCES = {
  character: {
    key: 'character',
    route: 'characters',
    label: 'Personagens',
    singular: 'Personagem',
    icon: 'users',
    tagline: 'Cada Rick, cada Morty, cada criatura bizarra catalogada no multiverso.',
    editable: true,
    fields: [
      { key: 'name', label: 'Nome', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS },
      { key: 'species', label: 'Espécie', type: 'text' },
      { key: 'type', label: 'Subtipo', type: 'text', placeholder: 'Ex.: Parasita, Robô…' },
      { key: 'gender', label: 'Gênero', type: 'select', options: GENDER },
      { key: 'image', label: 'Imagem (URL)', type: 'url' },
      { key: 'notes', label: 'Anotações', type: 'textarea', localOnly: true, placeholder: 'Suas notas de campo…' },
    ],
    filters: [
      { key: 'name', label: 'Buscar por nome', type: 'search' },
      { key: 'status', label: 'Status', type: 'select', options: STATUS },
      { key: 'gender', label: 'Gênero', type: 'select', options: GENDER },
      { key: 'species', label: 'Espécie', type: 'text', placeholder: 'Humano, Alienígena…' },
      { key: 'type', label: 'Subtipo', type: 'text', placeholder: 'Parasita, Robô…' },
    ],
  },
  location: {
    key: 'location',
    route: 'locations',
    label: 'Locais',
    singular: 'Local',
    icon: 'globe',
    tagline: 'Planetas, microversos, estações espaciais e dimensões inteiras.',
    editable: false,
    fields: [],
    filters: [
      { key: 'name', label: 'Buscar por nome', type: 'search' },
      { key: 'type', label: 'Tipo', type: 'text', placeholder: 'Planeta, Aglomerado…' },
      { key: 'dimension', label: 'Dimensão', type: 'text', placeholder: 'C-137…' },
    ],
  },
  episode: {
    key: 'episode',
    route: 'episodes',
    label: 'Episódios',
    singular: 'Episódio',
    icon: 'tv',
    tagline: 'Todas as aventuras, temporada por temporada.',
    editable: false,
    fields: [],
    filters: [
      { key: 'name', label: 'Buscar por título', type: 'search' },
      { key: 'episode', label: 'Temporada', type: 'chips', options: SEASONS },
    ],
  },
}

export const RESOURCE_BY_ROUTE = Object.fromEntries(
  Object.values(RESOURCES).map((r) => [r.route, r.key]),
)

export const LOCATION_ICONS = {
  Planet: '🪐',
  'Space station': '🛰️',
  Microverse: '🔬',
  Miniverse: '🔬',
  Teenyverse: '🔬',
  Dimension: '🌀',
  Cluster: '✨',
  TV: '📺',
  Resort: '🏖️',
  Dream: '💭',
  Fantasy: '🐉',
  Spacecraft: '🚀',
  Game: '🎮',
  Menagerie: '🦒',
  Prison: '⛓️',
  Base: '🏚️',
  Hospital: '🏥',
  Asteroid: '☄️',
  Customs: '🛂',
}

export const locationIcon = (type) => LOCATION_ICONS[type] ?? '📍'

export const SEASON_COLORS = ['#97ce4c', '#3ee0f0', '#ffc857', '#ff6fb5', '#b18cff']

export function parseEpisodeCode(code = '') {
  const m = /S(\d+)E(\d+)/i.exec(code)
  return m ? { season: Number(m[1]), number: Number(m[2]) } : { season: 0, number: 0 }
}

export function artFor(seed, hueShift = 0) {
  const h = (Number(seed) * 47 + hueShift) % 360
  return `radial-gradient(circle at 30% 20%, hsl(${h} 90% 60% / .55), transparent 55%),
    radial-gradient(circle at 80% 90%, hsl(${(h + 120) % 360} 85% 55% / .45), transparent 60%),
    linear-gradient(135deg, hsl(${h} 45% 14%), hsl(${(h + 60) % 360} 50% 8%))`
}
