#!/usr/bin/env node
// Build the view's dataset: the discovery results trimmed to what the UI shows, the bounds the
// run used and what each rests on, the run history, and the summary of Prenew's own data that
// the view puts beside it.
//
// Every number here is measured. Nothing in the view is a placeholder, which is why this script
// reads the engine's own output files rather than taking any figure as an argument.
//
// Usage: node scripts/build-web-data.mjs [out/creators.json]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { bounds as computeBounds } from './bounds.mjs'

const src = process.argv[2] || 'out/creators.json'
const creators = JSON.parse(readFileSync(src, 'utf8'))
const collabs = JSON.parse(readFileSync('data/collaborations.json', 'utf8'))

const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback)

// ---- their own data, summarised per market ----

const repeats = {}
for (const c of collabs) repeats[c['Creator key']] = (repeats[c['Creator key']] || 0) + 1

const markets = {}
for (const c of collabs) {
  const m = c.Country
  markets[m] ||= { country: m, collabs: 0, creators: new Set(), agency: 0, repeaters: new Set() }
  const e = markets[m]
  e.collabs++
  e.creators.add(c['Creator key'])
  if (c.Agency === 'Yes') e.agency++
  if (repeats[c['Creator key']] > 1) e.repeaters.add(c['Creator key'])
}

const ownData = Object.values(markets)
  .map((e) => ({
    country: e.country,
    collabs: e.collabs,
    creators: e.creators.size,
    agency: e.agency,
    agencyPct: Math.round((e.agency / e.collabs) * 100),
    repeaters: e.repeaters.size,
  }))
  .sort((a, b) => b.collabs - a.collabs)

// ---- platform split, the number that decides where the engine must reach ----

const has = (c, re) => re.test(String(c.Platform || ''))
const platform = {
  tiktok: collabs.filter((c) => has(c, /tiktok/i)).length,
  youtube: collabs.filter((c) => has(c, /youtube|shorts/i)).length,
  total: collabs.length,
}

// ---- discovery results, trimmed ----

const trim = (r) => ({
  id: r.id,
  title: r.title,
  handle: r.handle || null,
  url: r.url,
  score: r.score,
  country: r.country,
  countryConfidence: r.countryConfidence,
  lang: r.langCode,
  niche: r.niche,
  nicheLabel: r.nicheLabel,
  games: r.games || [],
  subs: r.subs,
  avgViews: r.avgViews,
  medianViews: r.medianViews ?? null,
  viewWindow: r.viewWindow,
  viewRatio: r.viewRatio,
  trend: r.trend || null,
  trendPct: r.trendPct ?? null,
  breakingOut: r.breakingOut || false,
  signNow: r.signNow || false,
  subsPerMonth: r.subsPerMonth ?? null,
  monthsToBound: r.monthsToBound ?? null,
  audience: r.audience || null,
  parentsChoice: r.parentsChoice || false,
  isNew: r.isNew || false,
  uploadsPerMonth: r.uploadsPerMonth,
  daysSinceUpload: r.daysSinceUpload,
  shortsShare: r.shortsShare ?? null,
  likeRate: r.likeRate ?? null,
  commentRate: r.commentRate ?? null,
  channelAgeDays: r.channelAgeDays ?? null,
  platforms: r.platforms || ['youtube'],
  tiktok: r.tiktok,
  instagram: r.instagram || null,
  twitch: r.twitch || null,
  email: r.email,
  emailBusiness: r.emailBusiness || null,
  rigTalk: r.rigTalk,
  youthHint: r.youthHint,
  known: r.known,
  rejected: r.rejected || null,
  competitor: r.competitor || null,
  hardwareSponsor: r.hardwareSponsor || null,
  via: r.via,
  reason: r.reason,
})

const trimmed = creators.map(trim)

// ---- the engine's own bookkeeping ----

const pipelineFile = readJson('out/pipeline.json', {})
const pipeline = pipelineFile.stages || []
const request = pipelineFile.request || null

// The bounds, plus the individual rejections they rest on. The view needs the rows and not only
// the totals, because recording an outcome has to recompute the bound in the browser rather than
// animate a number: the arithmetic is the point being demonstrated.
const b = computeBounds()
const bounds = {
  takenZone: b.takenZone,
  priceyTiktok: b.priceyTiktok,
  realisedMedian: b.realisedMedian,
  basis: b.basis,
  counts: b.counts,
  reasonCounts: b.reasonCounts,
  rejections: b.rejections.map((r) => ({
    channel: r.channel, reason: r.reason, subs: r.subs, tiktok: r.tiktok, source: r.source,
  })),
}

// Run history, newest first.
const runs = existsSync('data/runs.jsonl')
  ? readFileSync('data/runs.jsonl', 'utf8').trim().split('\n').filter(Boolean)
      .map((l) => { try { return JSON.parse(l) } catch { return null } })
      .filter(Boolean).reverse()
  : []

// A targeted run kept beside the broad one, because "find German Minecraft creators" is the
// request their brief actually describes and one list cannot demonstrate both.
const targeted = existsSync('out/de-minecraft/creators.json')
  ? (() => {
      const t = JSON.parse(readFileSync('out/de-minecraft/creators.json', 'utf8'))
      const p = readJson('out/de-minecraft/pipeline.json', {})
      return {
        request: p.request || null,
        units: p.units ?? null,
        total: t.length,
        small: t.filter((r) => r.subs < 50_000).length,
        viaCommenter: t.filter((r) => r.via === 'commenter').length,
        withEmail: t.filter((r) => r.email).length,
        top: t.slice(0, 12).map((r) => ({
          title: r.title, url: r.url, subs: r.subs, country: r.country,
          nicheLabel: r.nicheLabel, avgViews: r.avgViews, viewRatio: r.viewRatio,
          trend: r.trend || null, email: r.email, reason: r.reason,
        })),
        // The full list too: the view lets you switch between the broad run and this one, and a
        // summary cannot be filtered.
        creators: t.map(trim),
      }
    })()
  : null

// The competitor's own roster: the same detection that pushes these down the candidate list,
// read the other way round.
const competitorPartners = trimmed
  .filter((r) => r.competitor)
  .sort((a, b) => b.subs - a.subs)
  .map((r) => ({
    competitor: r.competitor, title: r.title, url: r.url, country: r.country,
    subs: r.subs, avgViews: r.avgViews, nicheLabel: r.nicheLabel, trend: r.trend,
    email: r.email, rigTalk: r.rigTalk,
  }))

const fresh = trimmed.filter((r) => !r.known)
const nicheCounts = {}
for (const r of trimmed) nicheCounts[r.nicheLabel] = (nicheCounts[r.nicheLabel] || 0) + 1

const out = {
  runDate: new Date().toISOString().slice(0, 10),
  // The honest headline is what a full run costs from cold, not what a cached re-run costs.
  quotaUnits: pipelineFile.coldUnits ?? pipelineFile.units ?? null,
  quotaUnitsCached: pipelineFile.units ?? null,
  dailyQuota: pipelineFile.dailyFreeUnits ?? 10000,
  request,
  bounds,
  pipeline,
  runs,
  targeted,
  creators: trimmed,
  competitorPartners,
  ownData,
  platform,
  nicheCounts,
  stats: {
    total: trimmed.length,
    fresh: fresh.length,
    inRange: fresh.filter((r) => r.subs >= 4000 && r.subs <= 250_000).length,
    small: fresh.filter((r) => r.subs < 50_000).length,
    viaCommenter: fresh.filter((r) => r.via === 'commenter').length,
    viaChart: fresh.filter((r) => r.via === 'chart').length,
    withEmail: fresh.filter((r) => r.email).length,
    withBusinessEmail: fresh.filter((r) => r.emailBusiness).length,
    withTiktok: fresh.filter((r) => r.tiktok).length,
    multiPlatform: fresh.filter((r) => r.platforms.length >= 3).length,
    rising: fresh.filter((r) => r.trend === 'nouseva').length,
    falling: fresh.filter((r) => r.trend === 'laskeva').length,
    breakingOut: fresh.filter((r) => r.breakingOut).length,
    signNow: fresh.filter((r) => r.signNow).length,
    parentsChoice: fresh.filter((r) => r.parentsChoice).length,
    newSinceLastRun: fresh.filter((r) => r.isNew).length,
    rigTalk: fresh.filter((r) => r.rigTalk).length,
    youthFlagged: trimmed.filter((r) => r.youthHint).length,
    knownFound: trimmed.filter((r) => r.known).map((r) => r.title),
    rejectedFound: trimmed.filter((r) => r.rejected).map((r) => ({ title: r.title, reason: r.rejected.reason })),
    takenZone: trimmed.filter((r) => r.subs > (bounds?.takenZone ?? 110_000)).length,
    withCompetitor: trimmed.filter((r) => r.competitor).length,
    unknownCountry: trimmed.filter((r) => !r.country).length,
  },
  rejections: readJson('data/not-realised.json', []).reduce((acc, r) => {
    const k = String(r['Reason category'])
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {}),
}

mkdirSync('web/app', { recursive: true })
writeFileSync('web/app/data.json', JSON.stringify(out))

const kb = Math.round(JSON.stringify(out).length / 1024)
console.log(`web/app/data.json: ${trimmed.length} tekijää, ${ownData.length} markkinaa, ${kb} kt`)
console.log(`Kiintiö: ${out.quotaUnits} / ${out.dailyQuota}`)
console.log(`Rajat: yläraja ${bounds?.takenZone}, mediaani ${bounds?.realisedMedian}`)
console.log(`Ajohistoria: ${runs.length} ajoa`)
console.log(`Kilpailijoiden kumppaneita: ${competitorPartners.length}`)
console.log(`Nousukiito ${out.stats.breakingOut} · kiinnitä nyt ${out.stats.signNow} · vanhempien valinta ${out.stats.parentsChoice}`)
console.log(`Kohdennettu ajo: ${targeted ? `${targeted.total} tekijää, ${targeted.request?.niches?.join('+')} / ${targeted.request?.markets?.join(',')}` : 'ei rakennettu'}`)
console.log(`Löydetyt omat kumppanit: ${out.stats.knownFound.join(', ')}`)
