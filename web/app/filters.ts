import type { Creator } from './types'

// Everything the list can be narrowed by, and how it is sorted. Kept out of the component so the
// rules are readable on their own: what a filter means is a product decision, and it should not be
// buried inside JSX.

export type SortKey =
  | 'score'
  | 'subs-desc'
  | 'subs-asc'
  | 'views-desc'
  | 'ratio-desc'
  | 'trend-desc'
  | 'growth-desc'
  | 'active-asc'
  | 'engagement-desc'

export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Pisteet' },
  { key: 'subs-desc', label: 'Tilaajat, suurin ensin' },
  { key: 'subs-asc', label: 'Tilaajat, pienin ensin' },
  { key: 'views-desc', label: 'Katselut per video' },
  { key: 'ratio-desc', label: 'Katselut per tilaaja' },
  { key: 'trend-desc', label: 'Trendi, nousevin ensin' },
  { key: 'growth-desc', label: 'Kasvu, tilaajaa per kk' },
  { key: 'active-asc', label: 'Aktiivisin ensin' },
  { key: 'engagement-desc', label: 'Kommentteja per katselu' },
]

const num = (v: number | null | undefined, fallback = -1) => (v == null ? fallback : v)

export const sorters: Record<SortKey, (a: Creator, b: Creator) => number> = {
  score: (a, b) => b.score - a.score,
  'subs-desc': (a, b) => b.subs - a.subs,
  'subs-asc': (a, b) => a.subs - b.subs,
  'views-desc': (a, b) => num(b.avgViews) - num(a.avgViews),
  'ratio-desc': (a, b) => num(b.viewRatio) - num(a.viewRatio),
  'trend-desc': (a, b) => num(b.trendPct, -9999) - num(a.trendPct, -9999),
  'growth-desc': (a, b) => num(b.subsPerMonth) - num(a.subsPerMonth),
  // Fewer days since the last upload is more active, and a channel with no reading sorts last.
  'active-asc': (a, b) => num(a.daysSinceUpload, 99999) - num(b.daysSinceUpload, 99999),
  'engagement-desc': (a, b) => num(b.commentRate) - num(a.commentRate),
}

export type Size = 'all' | 'under5' | 'under10' | 'under50' | 'range' | 'over110'
export type Activity = 'all' | 'd14' | 'd30' | 'stale'
export type Views = 'all' | 'v5' | 'v20' | 'v100'
export type Ratio = 'all' | 'healthy' | 'low' | 'suspect'
export type Format = 'all' | 'shorts' | 'long'

export type FilterState = {
  q: string
  route: 'all' | 'commenter' | 'chart'
  country: string
  certainCountry: boolean
  lang: string
  niche: string
  size: Size
  views: Views
  ratio: Ratio
  activity: Activity
  format: Format
  contact: boolean
  businessContact: boolean
  multiPlatform: boolean
  rising: boolean
  urgent: boolean
  parents: boolean
  rigTalk: boolean
  hideSeen: boolean
  minScore: number
}

export const EMPTY: FilterState = {
  q: '',
  route: 'all',
  country: 'all',
  certainCountry: false,
  lang: 'all',
  niche: 'all',
  size: 'all',
  views: 'all',
  ratio: 'all',
  activity: 'all',
  format: 'all',
  contact: false,
  businessContact: false,
  multiPlatform: false,
  rising: false,
  urgent: false,
  parents: false,
  rigTalk: false,
  hideSeen: false,
  minScore: 0,
}

// Free text over the fields a person would actually type into: the name, the niche, the games and
// the reason sentence. The reason is included on purpose — it is where "puhuu laitteistosta" and
// "löytyi kommentoijana (iCrimax)" live, so searching a seed's name finds everyone found near them.
const haystack = (c: Creator) =>
  `${c.title} ${c.handle || ''} ${c.nicheLabel} ${c.games.join(' ')} ${c.country || ''} ${c.lang || ''} ${c.reason}`.toLowerCase()

export function apply(creators: Creator[], f: FilterState, sort: SortKey) {
  const q = f.q.trim().toLowerCase()
  const terms = q ? q.split(/\s+/) : []

  const out = creators.filter((c) => {
    if (terms.length) {
      const h = haystack(c)
      // Every word has to appear somewhere: two words narrow, they do not widen.
      if (!terms.every((t) => h.includes(t))) return false
    }
    if (f.route !== 'all' && c.via !== f.route) return false
    if (f.country !== 'all' && c.country !== f.country) return false
    if (f.certainCountry && c.countryConfidence !== 'varma') return false
    if (f.lang !== 'all' && c.lang !== f.lang) return false
    if (f.niche !== 'all' && c.nicheLabel !== f.niche) return false
    if (f.contact && !c.email) return false
    if (f.businessContact && !c.emailBusiness) return false
    if (f.multiPlatform && c.platforms.length < 3) return false
    if (f.rising && c.trend !== 'nouseva') return false
    if (f.urgent && !c.breakingOut && !c.signNow) return false
    if (f.parents && !c.parentsChoice) return false
    if (f.rigTalk && !c.rigTalk) return false
    if (f.hideSeen && (c.known || c.rejected)) return false
    if (c.score < f.minScore) return false

    if (f.size === 'under5' && c.subs >= 5_000) return false
    if (f.size === 'under10' && c.subs >= 10_000) return false
    if (f.size === 'under50' && c.subs >= 50_000) return false
    if (f.size === 'range' && (c.subs < 4000 || c.subs > 250_000)) return false
    if (f.size === 'over110' && c.subs <= 110_000) return false

    const v = c.avgViews ?? 0
    if (f.views === 'v5' && v < 5_000) return false
    if (f.views === 'v20' && (v < 20_000 || v > 100_000)) return false
    if (f.views === 'v100' && v < 100_000) return false

    const r = c.viewRatio ?? 0
    if (f.ratio === 'healthy' && (r < 0.15 || r > 2)) return false
    if (f.ratio === 'low' && r >= 0.15) return false
    if (f.ratio === 'suspect' && r <= 2) return false

    const d = c.daysSinceUpload
    if (f.activity === 'd14' && (d == null || d > 14)) return false
    if (f.activity === 'd30' && (d == null || d > 30)) return false
    if (f.activity === 'stale' && (d == null || d <= 90)) return false

    const sh = c.shortsShare
    if (f.format === 'shorts' && (sh == null || sh < 70)) return false
    if (f.format === 'long' && (sh == null || sh > 30)) return false

    return true
  })

  return out.sort(sorters[sort])
}

// One-click starting points. Each is a question somebody actually asks, not a combination of
// switches they have to discover for themselves.
export const PRESETS: { label: string; hint: string; patch: Partial<FilterState>; sort?: SortKey }[] = [
  {
    label: 'Tavoitettavissa tänään',
    hint: 'Yhteystieto tiedossa, aktiivinen, maa varma',
    patch: { contact: true, activity: 'd30', certainCountry: true, hideSeen: true },
    sort: 'score',
  },
  {
    label: 'Pieni ja kasvava',
    hint: 'Alle 10 000 tilaajaa, katselut nousussa',
    patch: { size: 'under10', rising: true, hideSeen: true },
    sort: 'growth-desc',
  },
  {
    label: 'Ikkuna sulkeutumassa',
    hint: 'Nousukiito tai arvio alle vuoden rajaan',
    patch: { urgent: true, hideSeen: true },
    sort: 'growth-desc',
  },
  {
    label: 'Akselin haarukka',
    hint: '20 000 – 100 000 katselua per video',
    patch: { views: 'v20', hideSeen: true },
    sort: 'ratio-desc',
  },
  {
    label: 'Myy koneita jo nyt',
    hint: 'Luettelee kokoonpanonsa kanavan tiedoissa',
    patch: { rigTalk: true, hideSeen: true },
    sort: 'score',
  },
  {
    label: 'Vanhempien valinta',
    hint: 'Kanava on itse merkinnyt olevansa lapsiystävällinen',
    patch: { parents: true, hideSeen: true },
    sort: 'score',
  },
  {
    label: 'Molemmilla alustoilla',
    hint: 'Vähintään kolme alustaa, vahvin toiston merkki',
    patch: { multiPlatform: true, hideSeen: true },
    sort: 'score',
  },
]
