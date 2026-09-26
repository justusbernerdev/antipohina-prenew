#!/usr/bin/env node
// Smoke test: does network expansion actually surface NEW creators?
//
// This is the one assumption the whole engine rests on. If featured channels are
// empty and commenters yield nothing, the plan needs rethinking before we build on it.
//
// Usage:  YT_API_KEY=xxx node scripts/smoke-test.mjs
// Cost:   ~5 search units + ~40 other units. Well inside the daily free quota.

import { readFileSync } from 'node:fs'

const KEY = process.env.YT_API_KEY
if (!KEY) {
  console.error('Missing YT_API_KEY.\n  YT_API_KEY=xxx node scripts/smoke-test.mjs')
  process.exit(1)
}

const SEEDS = 5          // how many of their creators to expand from
const VIDEOS_PER_SEED = 2 // videos to pull commenters from

let searchUnits = 0
let otherUnits = 0

async function api(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('key', KEY)

  const res = await fetch(url)
  if (endpoint === 'search') searchUnits++
  else otherUnits++

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${endpoint} ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json()
}

// Their own creators are the seed set. Pick ones with a YouTube presence.
const collabs = JSON.parse(
  readFileSync(new URL('../data/collaborations.json', import.meta.url), 'utf8'),
)
const seedNames = [
  ...new Set(
    collabs
      .filter((c) => c['YT subscribers'] && String(c.Platform || '').toLowerCase().includes('youtube'))
      .map((c) => c['Creator / channel']),
  ),
].slice(0, SEEDS)

console.log(`Seeds from their own data: ${seedNames.join(', ')}\n`)

const seedIds = new Set()
const found = new Map() // channelId -> how we found it

for (const name of seedNames) {
  const r = await api('search', { part: 'snippet', q: name, type: 'channel', maxResults: 1 })
  const hit = r.items?.[0]
  if (!hit) {
    console.log(`  ${name}: no channel found`)
    continue
  }
  const id = hit.snippet.channelId
  seedIds.add(id)
  console.log(`  ${name} -> ${id} (${hit.snippet.title})`)
}

console.log('\n--- Route A: featured channels (channelSections) ---')
for (const id of seedIds) {
  const r = await api('channelSections', { part: 'snippet,contentDetails', channelId: id })
  const featured = (r.items || [])
    .filter((s) => s.snippet?.type === 'multipleChannels')
    .flatMap((s) => s.contentDetails?.channels || [])
  console.log(`  ${id}: ${featured.length} featured`)
  for (const f of featured) if (!seedIds.has(f)) found.set(f, 'featured')
}

console.log('\n--- Route B: commenters (commentThreads) ---')
for (const id of seedIds) {
  // uploads playlist -> recent videos -> commenters
  const ch = await api('channels', { part: 'contentDetails', id })
  const uploads = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploads) continue

  const pl = await api('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: VIDEOS_PER_SEED })
  for (const item of pl.items || []) {
    const videoId = item.contentDetails.videoId
    try {
      const ct = await api('commentThreads', {
        part: 'snippet', videoId, maxResults: 100, order: 'relevance',
      })
      let n = 0
      for (const t of ct.items || []) {
        const author = t.snippet?.topLevelComment?.snippet?.authorChannelId?.value
        if (author && !seedIds.has(author) && !found.has(author)) {
          found.set(author, 'commenter')
          n++
        }
      }
      console.log(`  ${videoId}: +${n} commenter channels`)
    } catch (e) {
      console.log(`  ${videoId}: comments unavailable (${e.message.slice(0, 60)})`)
    }
  }
}

// Enrich everything found, 50 per unit. This is the cheap part.
console.log('\n--- Enriching candidates ---')
const ids = [...found.keys()]
const enriched = []
for (let i = 0; i < ids.length; i += 50) {
  const batch = ids.slice(i, i + 50)
  const r = await api('channels', { part: 'snippet,statistics', id: batch.join(',') })
  for (const c of r.items || []) {
    enriched.push({
      id: c.id,
      title: c.snippet.title,
      country: c.snippet.country || null,
      subs: Number(c.statistics.subscriberCount || 0),
      videos: Number(c.statistics.videoCount || 0),
      via: found.get(c.id),
      tiktok: /tiktok\.com\/@([\w.]+)/i.exec(c.snippet.description || '')?.[1] || null,
    })
  }
}

// A candidate only counts if it actually publishes. Pure viewers have no videos.
const creators = enriched.filter((c) => c.videos >= 5 && c.subs >= 500)
const small = creators.filter((c) => c.subs < 50000)

console.log(`\n=== RESULT ===`)
console.log(`Channels discovered:      ${enriched.length}`)
console.log(`  of which actual creators (>=5 videos, >=500 subs): ${creators.length}`)
console.log(`  of which SMALL (<50k subs):                        ${small.length}`)
console.log(`  with a TikTok handle in their description:         ${creators.filter((c) => c.tiktok).length}`)
console.log(`  via featured: ${creators.filter((c) => c.via === 'featured').length}   via comments: ${creators.filter((c) => c.via === 'commenter').length}`)
console.log(`\nQuota used: ${searchUnits} search calls, ${otherUnits} units`)

console.log('\nTop 15 small creators found:')
for (const c of small.sort((a, b) => b.subs - a.subs).slice(0, 15)) {
  console.log(`  ${String(c.subs).padStart(7)} subs  ${c.country || '??'}  ${c.title}${c.tiktok ? `  tiktok:@${c.tiktok}` : ''}  [${c.via}]`)
}

console.log(`\nVerdict: ${small.length >= 20 ? 'PROCEED. Expansion yields small creators.' : 'WEAK. Rethink expansion before building.'}`)
