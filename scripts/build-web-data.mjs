#!/usr/bin/env node
// Build the demo view's dataset: the discovery results, trimmed to what the UI shows,
// plus the summary of Prenew's own collaboration data that the view puts beside it.
//
// Usage: node scripts/build-web-data.mjs [results/2026-09-26/creators.json]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const src = process.argv[2] || 'results/2026-09-26/creators.json'
const creators = JSON.parse(readFileSync(src, 'utf8'))
const collabs = JSON.parse(readFileSync('data/collaborations.json', 'utf8'))

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

const trimmed = creators.map((r) => ({
  id: r.id,
  title: r.title,
  url: r.url,
  score: r.score,
  country: r.country,
  countryConfidence: r.countryConfidence,
  lang: r.langCode,
  subs: r.subs,
  avgViews: r.avgViews,
  viewWindow: r.viewWindow,
  viewRatio: r.viewRatio,
  uploadsPerMonth: r.uploadsPerMonth,
  daysSinceUpload: r.daysSinceUpload,
  tiktok: r.tiktok,
  email: r.email,
  rigTalk: r.rigTalk,
  youthHint: r.youthHint,
  known: r.known,
  via: r.via,
  reason: r.reason,
}))

const out = {
  runDate: src.match(/\d{4}-\d{2}-\d{2}/)?.[0] || null,
  quotaUnits: 1345,
  dailyQuota: 10000,
  creators: trimmed,
  ownData,
  platform,
  stats: {
    total: trimmed.length,
    fresh: trimmed.filter((r) => !r.known).length,
    inRange: trimmed.filter((r) => !r.known && r.subs >= 4000 && r.subs <= 250000).length,
    small: trimmed.filter((r) => !r.known && r.subs < 50000).length,
    viaCommenter: trimmed.filter((r) => !r.known && r.via === 'commenter').length,
    viaChart: trimmed.filter((r) => !r.known && r.via === 'chart').length,
    withEmail: trimmed.filter((r) => !r.known && r.email).length,
    withTiktok: trimmed.filter((r) => !r.known && r.tiktok).length,
    rigTalk: trimmed.filter((r) => !r.known && r.rigTalk).length,
    youthFlagged: trimmed.filter((r) => r.youthHint).length,
    knownFound: trimmed.filter((r) => r.known).map((r) => r.title),
  },
}

mkdirSync('web/app', { recursive: true })
writeFileSync('web/app/data.json', JSON.stringify(out))

const kb = Math.round(JSON.stringify(out).length / 1024)
console.log(`web/app/data.json: ${trimmed.length} tekijää, ${ownData.length} markkinaa, ${kb} kt`)
console.log(`TikTok mukana ${platform.tiktok}/${platform.total}, YouTube ${platform.youtube}/${platform.total}`)
console.log(`Löydetyt omat kumppanit: ${out.stats.knownFound.join(', ')}`)
