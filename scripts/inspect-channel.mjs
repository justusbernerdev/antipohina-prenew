#!/usr/bin/env node
// Inspect one or more channels the pipeline found: what the engine actually knows about them.
//
// Usage: node --env-file=.env scripts/inspect-channel.mjs UCxxx UCyyy

const KEY = process.env.YT_API_KEY
if (!KEY) { console.error('Missing YT_API_KEY'); process.exit(1) }

const ids = process.argv.slice(2)
if (!ids.length) { console.error('Give at least one channel id'); process.exit(1) }

async function api(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('key', KEY)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${endpoint} ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

const ch = await api('channels', { part: 'snippet,statistics,contentDetails', id: ids.join(',') })

for (const c of ch.items || []) {
  const s = c.statistics
  console.log(`\n=== ${c.snippet.title} ===`)
  console.log(`https://www.youtube.com/channel/${c.id}`)
  console.log(`maa: ${c.snippet.country || '(ei asetettu)'} | tilaajat: ${s.subscriberCount} | videoita: ${s.videoCount} | katseluita yhteensä: ${s.viewCount}`)
  console.log(`kanava luotu: ${c.snippet.publishedAt.slice(0, 10)}`)

  const desc = (c.snippet.description || '').replace(/\s+/g, ' ').trim()
  console.log(`kuvaus: ${desc ? desc.slice(0, 240) : '(tyhjä)'}`)

  const tiktok = /tiktok\.com\/@([\w.]+)/i.exec(c.snippet.description || '')?.[1]
  const email = /[\w.+-]+@[\w-]+\.[\w.]+/.exec(c.snippet.description || '')?.[0]
  if (tiktok) console.log(`TikTok: @${tiktok}`)
  if (email) console.log(`yhteystieto: ${email}`)

  const uploads = c.contentDetails.relatedPlaylists.uploads
  const pl = await api('playlistItems', { part: 'contentDetails', playlistId: uploads, maxResults: 6 })
  const vids = (pl.items || []).map((i) => i.contentDetails.videoId)
  if (!vids.length) { console.log('ei videoita'); continue }

  const vd = await api('videos', { part: 'snippet,statistics', id: vids.join(',') })
  const views = (vd.items || []).map((v) => Number(v.statistics.viewCount || 0))
  const avg = views.length ? Math.round(views.reduce((a, b) => a + b, 0) / views.length) : 0
  const ratio = Number(s.subscriberCount) ? (avg / Number(s.subscriberCount)) : 0

  console.log(`keskimäärin ${avg.toLocaleString('fi')} katselua per video, eli ${(ratio * 100).toFixed(0)} % tilaajamäärästä`)
  console.log('viimeisimmät videot:')
  for (const v of vd.items) {
    const lang = v.snippet.defaultAudioLanguage || v.snippet.defaultLanguage || '?'
    console.log(`   ${v.snippet.publishedAt.slice(0, 10)}  ${String(v.statistics.viewCount || 0).padStart(8)} katselua  [${lang}]  ${v.snippet.title.slice(0, 58)}`)
  }
}
