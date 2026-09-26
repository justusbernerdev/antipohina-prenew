#!/usr/bin/env node
// Smoke test 2: do per-country "most popular gaming" charts surface creators
// in the size range Prenew actually collaborates with (YouTube median 75k)?
//
// Hypothesis: in small markets the national gaming chart IS the small-creator list,
// because the market is small. In Germany it should return large channels instead.
//
// Usage: node --env-file=.env scripts/smoke-test-regions.mjs

const KEY = process.env.YT_API_KEY
if (!KEY) { console.error('Missing YT_API_KEY'); process.exit(1) }

const MARKETS = ['FI', 'SE', 'DE', 'EE', 'HU', 'LV', 'LT', 'PL', 'DK', 'NL', 'FR']

let units = 0
async function api(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('key', KEY)
  const res = await fetch(url)
  units++
  if (!res.ok) throw new Error(`${endpoint} ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

// Gaming category id varies by region, so resolve it per market instead of hardcoding 20.
async function gamingCategory(region) {
  const r = await api('videoCategories', { part: 'snippet', regionCode: region })
  const hit = (r.items || []).find((c) => /gaming/i.test(c.snippet.title))
  return hit?.id || '20'
}

const all = new Map() // channelId -> {markets:Set, titles:Set}

for (const region of MARKETS) {
  try {
    const cat = await gamingCategory(region)
    const r = await api('videos', {
      part: 'snippet', chart: 'mostPopular', regionCode: region,
      videoCategoryId: cat, maxResults: 50,
    })
    const items = r.items || []
    for (const v of items) {
      const id = v.snippet.channelId
      if (!all.has(id)) all.set(id, { markets: new Set(), lang: new Set() })
      all.get(id).markets.add(region)
      if (v.snippet.defaultAudioLanguage) all.get(id).lang.add(v.snippet.defaultAudioLanguage)
    }
    console.log(`${region}: category ${cat}, ${items.length} videos, ${new Set(items.map((v) => v.snippet.channelId)).size} channels`)
  } catch (e) {
    console.log(`${region}: FAILED ${e.message.slice(0, 80)}`)
  }
}

// Enrich, 50 per unit
const ids = [...all.keys()]
const rows = []
for (let i = 0; i < ids.length; i += 50) {
  const r = await api('channels', { part: 'snippet,statistics', id: ids.slice(i, i + 50).join(',') })
  for (const c of r.items || []) {
    const meta = all.get(c.id)
    rows.push({
      title: c.snippet.title,
      country: c.snippet.country || null,
      subs: Number(c.statistics.subscriberCount || 0),
      markets: [...meta.markets].join(','),
      lang: [...meta.lang].join(','),
      tiktok: /tiktok\.com\/@([\w.]+)/i.exec(c.snippet.description || '')?.[1] || null,
    })
  }
}

const inRange = rows.filter((r) => r.subs >= 4000 && r.subs <= 250000)
const small = rows.filter((r) => r.subs < 50000)

console.log(`\n=== RESULT ===`)
console.log(`Unique channels:                 ${rows.length}`)
console.log(`In Prenew's range (4k-250k):     ${inRange.length}`)
console.log(`Under 50k subs:                  ${small.length}`)
console.log(`With TikTok in description:      ${rows.filter((r) => r.tiktok).length}`)
console.log(`Single-market only (local):      ${rows.filter((r) => !r.markets.includes(',')).length}`)
console.log(`Quota used: ${units} units\n`)

console.log('In range, smallest first:')
for (const r of inRange.sort((a, b) => a.subs - b.subs).slice(0, 30)) {
  console.log(`  ${String(r.subs).padStart(7)}  ${(r.country || '??').padEnd(3)} ${r.markets.padEnd(12)} ${r.lang.padEnd(6)} ${r.title}${r.tiktok ? `  tt:@${r.tiktok}` : ''}`)
}
