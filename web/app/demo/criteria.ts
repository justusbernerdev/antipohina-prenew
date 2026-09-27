import type { Creator } from '../types'

// The criteria the demo exposes, and what each one means against the real rows.
//
// The mock drove these off invented multipliers. Here every chip filters the actual list, so the
// count under the pipeline is the number of creators the run really produced under those criteria
// rather than a percentage of a total.

export type SizeKey = 'all' | 'u110' | 'u50' | 'u10'

export const SIZES: { key: SizeKey; label: string; max: number }[] = [
  { key: 'all', label: 'Kaikki', max: Infinity },
  { key: 'u110', label: 'alle 110k', max: 110_000 },
  { key: 'u50', label: 'alle 50k', max: 50_000 },
  { key: 'u10', label: 'alle 10k', max: 10_000 },
]

export type FlagKey = 'contact' | 'rising' | 'urgent' | 'parents' | 'rig'

export const FLAGS: { key: FlagKey; label: string; test: (c: Creator) => boolean; asCriteria: string }[] = [
  { key: 'contact', label: 'Yhteystieto', test: (c) => Boolean(c.email), asCriteria: 'has_contact' },
  { key: 'rising', label: 'Nousussa', test: (c) => c.trend === 'nouseva', asCriteria: 'trend' },
  { key: 'urgent', label: 'Kiire', test: (c) => c.breakingOut || c.signNow, asCriteria: 'urgent' },
  { key: 'parents', label: 'Vanhempien valinta', test: (c) => c.parentsChoice, asCriteria: 'parents_choice' },
  { key: 'rig', label: 'Puhuu laitteistosta', test: (c) => c.rigTalk, asCriteria: 'talks_hardware' },
]

export type Criteria = {
  markets: string[]
  niches: string[]
  size: SizeKey
  flags: Record<string, boolean>
}

export const EMPTY_CRITERIA: Criteria = {
  markets: ['FI', 'SE', 'DE'],
  niches: [],
  size: 'u110',
  flags: {},
}

export function matches(c: Creator, cr: Criteria): boolean {
  // An unknown country is kept when no market is selected, and dropped once markets are named:
  // "give me Germany" cannot honestly answer with a creator whose country never resolved.
  if (cr.markets.length && (!c.country || !cr.markets.includes(c.country))) return false
  if (cr.niches.length && !cr.niches.includes(c.nicheLabel)) return false

  const size = SIZES.find((s) => s.key === cr.size)!
  if (c.subs >= size.max) return false

  for (const f of FLAGS) if (cr.flags[f.key] && !f.test(c)) return false
  return true
}

export function selected(creators: Creator[], cr: Criteria): Creator[] {
  return creators.filter((c) => matches(c, cr)).sort((a, b) => b.score - a.score)
}

// How many conditions the request carries. Shown on the first node of the pipeline, because the
// criteria are the first stage: every one of them becomes a rule somewhere downstream.
export function conditionCount(cr: Criteria): number {
  return (
    (cr.markets.length ? 1 : 0) +
    (cr.niches.length ? 1 : 0) +
    (cr.size === 'all' ? 0 : 1) +
    FLAGS.filter((f) => cr.flags[f.key]).length
  )
}

// The same criteria as an API body, so the API and MCP tabs describe the request that is actually
// on screen instead of a fixed example.
export function asRequest(cr: Criteria, nicheKeys: Record<string, string>) {
  const out: Record<string, unknown> = {}
  if (cr.markets.length) out.markets = cr.markets
  if (cr.niches.length) out.niches = cr.niches.map((n) => nicheKeys[n] || n.toLowerCase())
  const size = SIZES.find((s) => s.key === cr.size)!
  if (Number.isFinite(size.max)) out.max_subscribers = size.max
  for (const f of FLAGS) if (cr.flags[f.key]) out[f.asCriteria] = f.key === 'rising' ? 'rising' : true
  return out
}

// The one-word recommendation. A score needs interpreting; this does not.
export function action(c: Creator): 'kontaktoi' | 'odota' | 'ohita' {
  if (warnings(c).length) return 'ohita'
  return c.email ? 'kontaktoi' : 'odota'
}

// Everything that should make a human hesitate, in one place. Spread across four columns these
// are easy to miss, and "no warnings" is not something you can filter on.
export function warnings(c: Creator): string[] {
  const w: string[] = []
  if (c.competitor) w.push(`kilpailija: ${c.competitor}`)
  if (c.rejected) w.push(`hylkäsitte: ${c.rejected.reason}`)
  if (c.known) w.push('jo kumppaninne')
  if (c.madeForKids) w.push('made for kids')
  if (c.subs > 110_000) w.push('yli rajan 110k')
  if (c.viewRatio != null && c.viewRatio > 2) w.push('epäilyttävä katselusuhde')
  if (c.countryConfidence !== 'varma') w.push('maa epävarma')
  if (c.daysSinceUpload != null && c.daysSinceUpload > 90) w.push(`${c.daysSinceUpload} pv edellisestä`)
  return w
}
