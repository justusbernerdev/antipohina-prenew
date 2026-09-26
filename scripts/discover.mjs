#!/usr/bin/env node
// Prenew creator discovery pipeline.
//
//   per-country chart -> mid-size local creators -> their commenters -> the small tail
//   -> enrich -> infer country -> score -> CSV + JSON
//
// Route order comes from measurement, not guesswork: see docs/savutesti-tulokset.md.
// Featured channels (channelSections) are deliberately absent, they returned zero.
//
// Usage:
//   node --env-file=.env scripts/discover.mjs
//   node --env-file=.env scripts/discover.mjs --markets=FI,EE --seeds=20 --budget=1500
//
// Every response is cached under cache/, so re-runs cost no quota.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'

const KEY = process.env.YT_API_KEY
if (!KEY) { console.error('Missing YT_API_KEY. Put it in .env as YT_API_KEY=...'); process.exit(1) }

// ---------- options ----------

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=').slice(1).join('=') : fallback
}

const MARKETS = arg('markets', 'FI,SE,DE,EE,HU,LV,LT,PL,DK,NL,FR').split(',')
const SEEDS_PER_MARKET = Number(arg('seeds', 12))   // mid-size creators to expand from, per market
const VIDEOS_PER_SEED = Number(arg('videos', 4))    // videos to harvest commenters from
const BUDGET = Number(arg('budget', 3000))          // hard quota ceiling for one run
const OUT = arg('out', 'out')

// Prenew's own range: TikTok floor 4k (Akseli), YouTube collaborations up to ~250k.
const MIN_SUBS = 4000
const MAX_SUBS = 250_000
const MIN_VIDEOS = 5

// ---------- quota-aware, cached API ----------

mkdirSync('cache', { recursive: true })
mkdirSync(OUT, { recursive: true })

let units = 0
let cacheHits = 0

async function api(endpoint, params) {
  const key = createHash('sha1').update(endpoint + JSON.stringify(params)).digest('hex')
  const path = `cache/${endpoint}-${key}.json`
  if (existsSync(path)) {
    cacheHits++
    return JSON.parse(readFileSync(path, 'utf8'))
  }
  if (units >= BUDGET) throw new Error(`Quota budget ${BUDGET} exhausted`)

  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('key', KEY)

  const res = await fetch(url)
  units++
  if (!res.ok) {
    const body = await res.text()
    const reason = /"reason":\s*"(\w+)"/.exec(body)?.[1] || String(res.status)
    const err = new Error(`${endpoint}: ${reason}`)
    err.reason = reason
    throw err
  }
  const json = await res.json()
  writeFileSync(path, JSON.stringify(json))
  return json
}

// Batch id-based lookups 50 at a time: that is the whole reason this pipeline is cheap.
async function channelsByIds(ids, part = 'snippet,statistics,contentDetails') {
  const out = []
  for (let i = 0; i < ids.length; i += 50) {
    const r = await api('channels', { part, id: ids.slice(i, i + 50).join(',') })
    out.push(...(r.items || []))
  }
  return out
}

// ---------- filters learned from measurement ----------

// National charts are full of big creators' side channels and clip channels. They score well on
// views-per-subscriber but have no persona to partner with. Measured: 10 of 97 in-range hits.
const SIDE_CHANNEL = /(\s\+$|\bVOD(s)?\b|\bclips?\b|\bextra\b|\bPLUS\b|\barchive\b|\bhighlights?\b|\bbest of\b|\bmontage\b)/i
const FAN_CHANNEL = /(unofficial|nem hivatalos|rajongói|fan\s?(channel|page|edits?)|not affiliated)/i

const isSideChannel = (title, desc) => SIDE_CHANNEL.test(title) || FAN_CHANNEL.test(desc || '')

// Games that imply a PC purchase decision, weighted from Prenew's own successful collaborations.
const NICHE_WEIGHTS = [
  [/minecraft/i, 1.0], [/fortnite/i, 1.0], [/\bark\b/i, 0.9], [/\bgta\b/i, 0.9],
  [/\bcs2?\b|counter.?strike/i, 0.9], [/valorant/i, 0.9], [/roblox/i, 0.6],
  [/tech|review|hardware|pc.?build|gaming gear/i, 1.0], [/simulator/i, 0.7],
  [/clash royale|geometry dash|among us|mobile/i, 0.2],
]

const nicheScore = (text) => {
  for (const [re, w] of NICHE_WEIGHTS) if (re.test(text)) return w
  return 0.5 // unknown gaming content
}

// Self-declared youth signals. Never a filter, always a flag: the decision stays with a human.
const YOUTH_HINT = /\b(young|kid|kids|child|minor|13|14|15)\b|nuori|lapsi/i

// The strongest Prenew-specific signal, found by reading their own partners' channels:
// creators who list their rig in the channel description already sell PCs for free, because
// their audience asks about it. No influencer platform detects this.
const RIG_TALK = /(rtx\s?\d{4}|gtx\s?\d{3,4}|ryzen|core\s?i[3579]|radeon|geforce|näytönohjain|prosessori|prossu|specs?|speksit|kokoonpano|setup|rechner|dator|gépem|komputer)/i

// Their own existing partners, read from the collaboration data. The engine should find these
// (it does, which validates the model) but they must not be presented as new discoveries.
const KNOWN = new Set()
try {
  const collabs = JSON.parse(readFileSync(new URL('../data/collaborations.json', import.meta.url), 'utf8'))
  for (const c of collabs) {
    for (const field of ['Creator key', 'Creator / channel']) {
      const v = c[field]
      if (v) KNOWN.add(String(v).toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim())
    }
  }
} catch { /* data file optional */ }

const isKnown = (title) => KNOWN.has(String(title).toLowerCase().trim())

// ---------- 1. seeds: per-country gaming charts ----------

async function gamingCategoryId(region) {
  const r = await api('videoCategories', { part: 'snippet', regionCode: region })
  return (r.items || []).find((c) => /gaming/i.test(c.snippet.title))?.id || '20'
}

const discovered = new Map() // channelId -> {via, markets:Set, langs:Set}

function note(id, via, market, lang) {
  if (!discovered.has(id)) discovered.set(id, { via, markets: new Set(), langs: new Set() })
  const d = discovered.get(id)
  if (market) d.markets.add(market)
  if (lang) d.langs.add(lang)
  return d
}

console.log(`Markets: ${MARKETS.join(',')} | seeds/market: ${SEEDS_PER_MARKET} | budget: ${BUDGET} units\n`)

for (const market of MARKETS) {
  try {
    const cat = await gamingCategoryId(market)
    const r = await api('videos', {
      part: 'snippet', chart: 'mostPopular', regionCode: market,
      videoCategoryId: cat, maxResults: 50,
    })
    for (const v of r.items || []) {
      note(v.snippet.channelId, 'chart', market, v.snippet.defaultAudioLanguage || v.snippet.defaultLanguage)
    }
    console.log(`  ${market}: ${(r.items || []).length} videos`)
  } catch (e) {
    console.log(`  ${market}: failed (${e.message})`)
  }
}

console.log(`\nChart channels: ${discovered.size}`)

// ---------- 2. enrich chart channels, pick expansion seeds ----------

const chartChannels = await channelsByIds([...discovered.keys()])

const candidates = new Map() // channelId -> record

function record(c, via, meta) {
  const s = c.statistics
  const desc = (c.snippet.description || '').replace(/\s+/g, ' ').trim()
  return {
    id: c.id,
    title: c.snippet.title,
    url: `https://www.youtube.com/channel/${c.id}`,
    via,
    subs: Number(s.subscriberCount || 0),
    videos: Number(s.videoCount || 0),
    totalViews: Number(s.viewCount || 0),
    channelCountry: c.snippet.country || null,
    markets: [...(meta?.markets || [])],
    langs: [...(meta?.langs || [])],
    desc,
    uploads: c.contentDetails?.relatedPlaylists?.uploads || null,
    tiktok: /tiktok\.com\/@([\w.]+)/i.exec(desc)?.[1] || null,
    email: /[\w.+-]+@[\w-]+\.[\w.]{2,}/.exec(desc)?.[0] || null,
    sideChannel: isSideChannel(c.snippet.title, desc),
    youthHint: YOUTH_HINT.test(desc),
    rigTalk: RIG_TALK.test(desc),
    known: isKnown(c.snippet.title),
  }
}

for (const c of chartChannels) {
  candidates.set(c.id, record(c, 'chart', discovered.get(c.id)))
}

// Expand from real creators in range, not from side channels.
const seeds = []
for (const market of MARKETS) {
  const inMarket = [...candidates.values()]
    .filter((r) => r.markets.includes(market) && !r.sideChannel && r.videos >= MIN_VIDEOS)
    .filter((r) => r.subs >= MIN_SUBS && r.subs <= MAX_SUBS)
    .sort((a, b) => a.subs - b.subs) // smallest first: their commenters are the most local
    .slice(0, SEEDS_PER_MARKET)
  seeds.push(...inMarket)
}
console.log(`Expansion seeds: ${seeds.length}`)

// ---------- 3. expansion: commenters ----------

let commentsDisabled = 0

for (const seed of seeds) {
  if (!seed.uploads) continue
  if (units >= BUDGET - 200) { console.log('  (stopping expansion, reserving budget for enrichment)'); break }
  try {
    const pl = await api('playlistItems', {
      part: 'contentDetails', playlistId: seed.uploads, maxResults: VIDEOS_PER_SEED,
    })
    for (const item of pl.items || []) {
      try {
        const ct = await api('commentThreads', {
          part: 'snippet', videoId: item.contentDetails.videoId, maxResults: 100, order: 'relevance',
        })
        for (const t of ct.items || []) {
          const author = t.snippet?.topLevelComment?.snippet?.authorChannelId?.value
          if (author && !discovered.has(author)) {
            // Commenters inherit the market and language of the seed they were found near:
            // that is the country signal for creators whose own country field is empty.
            const d = note(author, 'commenter', seed.markets[0], seed.langs[0])
            d.seed = seed.title
          }
        }
      } catch (e) {
        // Made-for-kids videos have comments disabled by law. Expected, not an error.
        if (e.reason === 'commentsDisabled') commentsDisabled++
        else throw e
      }
    }
  } catch (e) {
    if (e.message.includes('budget')) break
    console.log(`  ${seed.title}: ${e.message}`)
  }
}

const newIds = [...discovered.keys()].filter((id) => !candidates.has(id))
console.log(`Commenter channels: ${newIds.length} (${commentsDisabled} videos had comments off)`)

// ---------- 4. enrich the commenters ----------

const commenterChannels = await channelsByIds(newIds)
for (const c of commenterChannels) {
  candidates.set(c.id, record(c, 'commenter', discovered.get(c.id)))
}

// ---------- 5. recent performance ----------

const DAY = 86_400_000
const now = Date.now()

async function recentStats(r) {
  if (!r.uploads || units >= BUDGET - 20) return
  const pl = await api('playlistItems', { part: 'contentDetails', playlistId: r.uploads, maxResults: 10 })
  const ids = (pl.items || []).map((i) => i.contentDetails.videoId)
  if (!ids.length) return
  const vd = await api('videos', { part: 'snippet,statistics', id: ids.join(',') })
  const vids = (vd.items || []).map((v) => ({
    at: Date.parse(v.snippet.publishedAt),
    views: Number(v.statistics.viewCount || 0),
    lang: v.snippet.defaultAudioLanguage || v.snippet.defaultLanguage || null,
    title: v.snippet.title,
    tags: v.snippet.tags || [],
  }))
  if (!vids.length) return

  const newest = Math.max(...vids.map((v) => v.at))
  const window = now - newest > 30 * DAY ? 90 : 30
  const inWindow = vids.filter((v) => now - v.at <= window * DAY)
  const used = inWindow.length ? inWindow : vids.slice(0, 5)

  r.avgViews = Math.round(used.reduce((a, v) => a + v.views, 0) / used.length)
  r.viewWindow = `${window}d`
  r.daysSinceUpload = Math.round((now - newest) / DAY)
  r.uploadsPerMonth = Number((vids.length / Math.max(1, (now - Math.min(...vids.map((v) => v.at))) / DAY / 30)).toFixed(1))
  r.viewRatio = r.subs ? Number((r.avgViews / r.subs).toFixed(2)) : 0
  for (const v of used) if (v.lang) r.langs.push(v.lang)
  r.nicheText = used.map((v) => `${v.title} ${v.tags.join(' ')}`).join(' ').slice(0, 500)
  if (YOUTH_HINT.test(r.nicheText)) r.youthHint = true
}

const forStats = [...candidates.values()]
  .filter((r) => !r.sideChannel && r.videos >= MIN_VIDEOS && r.subs >= 500)
  .sort((a, b) => b.subs - a.subs)

console.log(`Measuring recent performance for ${forStats.length} channels...`)
for (const r of forStats) {
  try { await recentStats(r) } catch (e) { if (e.message.includes('budget')) break }
}

// ---------- 6. country inference ----------

const LANG_COUNTRY = {
  fi: 'FI', sv: 'SE', de: 'DE', et: 'EE', hu: 'HU', lv: 'LV', lt: 'LT',
  pl: 'PL', da: 'DK', nl: 'NL', fr: 'FR',
}

for (const r of candidates.values()) {
  const langs = [...new Set(r.langs.map((l) => String(l).slice(0, 2).toLowerCase()))]
  const fromLang = langs.map((l) => LANG_COUNTRY[l]).filter(Boolean)

  // The channel's own country field is weak but it is first-hand, so it outweighs an inherited
  // market. Commenters inherit the seed's market, and that was placing Britons in Finland.
  const signals = [
    ...(r.channelCountry ? [r.channelCountry, r.channelCountry] : []),
    ...fromLang,
    // An inherited market only counts when the channel itself was on that country's chart.
    ...(r.via === 'chart' && r.markets.length === 1 ? r.markets : []),
  ].filter(Boolean)

  const counts = {}
  for (const s of signals) counts[s] = (counts[s] || 0) + 1
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1])

  r.country = ranked[0]?.[0] || null
  r.countryConfidence = ranked[0] ? (ranked[0][1] >= 2 ? 'varma' : 'epävarma') : 'tuntematon'
  // Does the creator actually belong to one of their markets?
  r.inTargetMarket = r.country ? MARKETS.includes(r.country) : false
  r.langCode = langs[0] || null
  // Single-market presence means a local creator rather than a global one.
  r.localOnly = r.markets.length === 1
}

// ---------- 7. scoring ----------

for (const r of candidates.values()) {
  const reasons = []
  let score = 0

  // Audience alive. Both bounds matter: a very high ratio usually means borrowed content.
  if (r.viewRatio >= 0.15 && r.viewRatio <= 2.0) {
    score += 30
    reasons.push(`katselut ${Math.round(r.viewRatio * 100)} % tilaajista`)
  } else if (r.viewRatio > 2.0) {
    score -= 10
    reasons.push(`katselusuhde ${Math.round(r.viewRatio * 100)} % epäilyttävän korkea`)
  } else if (r.viewRatio > 0) {
    reasons.push(`katselut vain ${Math.round(r.viewRatio * 100)} % tilaajista`)
  }

  // Present on both platforms: the strongest repeat signal in Prenew's own data.
  if (r.tiktok) { score += 25; reasons.push('myös TikTokissa') }

  // Already talks about hardware, so the product fits the channel without being forced.
  if (r.rigTalk) { score += 20; reasons.push('puhuu laitteistosta') }

  // Their market, not just any market.
  if (r.inTargetMarket) { score += 10 } else if (r.country) { score -= 20; reasons.push(`${r.country} ei ole heidän markkina`) }

  // Too big is a real cost, not just a missing bonus.
  if (r.subs > MAX_SUBS) { score -= 25; reasons.push('yli heidän haarukkansa') }

  // Niche that implies a PC purchase.
  const nw = nicheScore(`${r.title} ${r.desc} ${r.nicheText || ''}`)
  score += Math.round(nw * 20)
  if (nw >= 0.9) reasons.push('niche vaatii koneen')
  else if (nw <= 0.3) reasons.push('niche ei vaadi konetta')

  // In their proven size range.
  if (r.subs >= MIN_SUBS && r.subs <= MAX_SUBS) { score += 15; reasons.push('kokoluokka osuu') }
  else if (r.subs < MIN_SUBS) reasons.push('alle heidän haarukkansa')

  // Local rather than global, which is what small markets need.
  if (r.localOnly && r.via === 'chart') { score += 10; reasons.push('vain yhden maan listalla') }
  if (r.via === 'commenter') { score += 10; reasons.push(`löytyi kommentoijana${discovered.get(r.id)?.seed ? ` (${discovered.get(r.id).seed})` : ''}`) }

  // Active.
  if (r.daysSinceUpload != null) {
    if (r.daysSinceUpload <= 14) { score += 10; reasons.push('julkaisee aktiivisesti') }
    else if (r.daysSinceUpload > 90) { score -= 15; reasons.push(`${r.daysSinceUpload} pv edellisestä videosta`) }
  }

  // Contactable.
  if (r.email) { score += 5; reasons.push('yhteystieto kuvauksessa') }

  if (r.countryConfidence === 'epävarma') reasons.push('maa epävarma')
  if (r.youthHint) reasons.push('viitteitä nuoresta yleisöstä')
  if (r.known) reasons.unshift('JO TEIDÄN KUMPPANINNE')

  r.score = score
  r.reason = reasons.join('; ')
}

// ---------- 8. output ----------

const scored = [...candidates.values()]
  .filter((r) => !r.sideChannel)
  .filter((r) => r.videos >= MIN_VIDEOS && r.subs >= 500)
  .filter((r) => r.avgViews != null)
  // Keep their markets, and keep unknowns: an empty country field is common precisely among the
  // small local creators this is meant to find. Drop creators clearly outside their footprint.
  .filter((r) => r.inTargetMarket || !r.country)
  .sort((a, b) => b.score - a.score)

// Known partners stay in the file as proof the model works, but never at the top of the list.
const results = [...scored.filter((r) => !r.known), ...scored.filter((r) => r.known)]
const alreadyKnown = scored.filter((r) => r.known)

const csvCols = [
  ['pisteet', (r) => r.score],
  ['kanava', (r) => r.title],
  ['url', (r) => r.url],
  ['maa', (r) => r.country || ''],
  ['maan_varmuus', (r) => r.countryConfidence],
  ['kieli', (r) => r.langCode || ''],
  ['tilaajat', (r) => r.subs],
  ['katselut_per_video', (r) => r.avgViews ?? ''],
  ['katselu_ikkuna', (r) => r.viewWindow || ''],
  ['katselut_per_tilaaja', (r) => r.viewRatio ?? ''],
  ['videoita_per_kk', (r) => r.uploadsPerMonth ?? ''],
  ['pv_edellisesta', (r) => r.daysSinceUpload ?? ''],
  ['tiktok', (r) => (r.tiktok ? `@${r.tiktok}` : '')],
  ['yhteystieto', (r) => r.email || ''],
  ['puhuu_laitteistosta', (r) => (r.rigTalk ? 'kyllä' : '')],
  ['nuori_yleiso', (r) => (r.youthHint ? 'kyllä' : '')],
  ['jo_kumppani', (r) => (r.known ? 'kyllä' : '')],
  ['loytyi', (r) => (r.via === 'chart' ? 'maalista' : 'kommentoija')],
  ['perustelu', (r) => r.reason],
]

const esc = (v) => {
  const s = String(v ?? '')
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csv = [
  csvCols.map(([h]) => h).join(','),
  ...results.map((r) => csvCols.map(([, f]) => esc(f(r))).join(',')),
].join('\n')

writeFileSync(`${OUT}/creators.csv`, csv)
writeFileSync(`${OUT}/creators.json`, JSON.stringify(results, null, 1))

const inRange = results.filter((r) => r.subs >= MIN_SUBS && r.subs <= MAX_SUBS)
const small = results.filter((r) => r.subs < 50_000)
const fromComments = results.filter((r) => r.via === 'commenter')

console.log(`\n=== TULOS ===`)
console.log(`Tekijöitä listalla:        ${results.length}`)
console.log(`  Prenewin haarukassa:     ${inRange.length}`)
console.log(`  alle 50k tilaajaa:       ${small.length}`)
console.log(`  löytyi kommentoijana:    ${fromComments.length}`)
console.log(`  puhuu laitteistosta:     ${results.filter((r) => r.rigTalk).length}`)
console.log(`  molemmilla alustoilla:   ${results.filter((r) => r.tiktok).length}`)
console.log(`  yhteystieto tiedossa:    ${results.filter((r) => r.email).length}`)
console.log(`  merkitty nuori yleisö:   ${results.filter((r) => r.youthHint).length}`)
console.log(`  jo heidän kumppaneitaan: ${alreadyKnown.length}${alreadyKnown.length ? ` (${alreadyKnown.map((r) => r.title).join(', ')})` : ''}`)
const byCountry = {}
for (const r of results) byCountry[r.country || 'tuntematon'] = (byCountry[r.country || 'tuntematon'] || 0) + 1
const spread = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' | ')
console.log(`Maittain: ${spread}`)
const missing = MARKETS.filter((m) => !byCountry[m])
if (missing.length) console.log(`EI YHTÄÄN näistä markkinoista: ${missing.join(', ')}`)
console.log(`Kiintiö: ${units} yksikköä käytetty, ${cacheHits} osumaa välimuistista`)
console.log(`\nKirjoitettu: ${OUT}/creators.csv ja ${OUT}/creators.json`)

console.log(`\nKärki 15:`)
for (const r of results.slice(0, 15)) {
  console.log(`  ${String(r.score).padStart(3)}  ${String(r.subs).padStart(7)} ${(r.country || '??').padEnd(3)} ${r.title.slice(0, 26).padEnd(26)} ${r.reason.slice(0, 74)}`)
}
