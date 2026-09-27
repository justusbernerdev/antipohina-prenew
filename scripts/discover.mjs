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
//   node --env-file=.env scripts/discover.mjs --markets=DE --niche=minecraft,fortnite
//   node --env-file=.env scripts/discover.mjs --markets=FI,EE --seeds=20 --budget=1500
//
// Options:
//   --markets=DE,FI      market codes, default is their eleven
//   --niche=minecraft    niche keys, comma separated, default is all gaming (list: --niche=?)
//   --segment=parents    who buys: any (default), parents, adults
//   --min-subs=4000      size window, defaults come from their own realised collaborations
//   --max-subs=250000
//   --seeds=12           expansion seeds per market
//   --videos=4           videos per seed to harvest commenters from
//   --budget=3000        hard quota ceiling for one run
//   --out=out            output directory
//
// Every response is cached under cache/, so re-runs cost no quota.

import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { bounds } from './bounds.mjs'

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

// Which niches to ask for. Empty means "all gaming". Named niches do three things: they steer
// which creators are used as expansion seeds, they boost the score, and they restrict the file.
// Akseli asked for niche as an output field; asking for it as an input is the same taxonomy.
const WANT = arg('niche', '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)

// Who the machine is being sold to. Prenew's own categories say the buyer and the user are often
// two different people: there is a Parents' Choice tier and a gaming-pc-for-kids page, so on those
// products the channel reaches the child and the wallet belongs to the parent.
//   any      score the creator, no audience lens        (default)
//   parents  favour channels where the buyer is watching too
//   adults   favour channels whose audience buys for itself
const SEGMENT = arg('segment', 'any').toLowerCase()
if (!['any', 'parents', 'adults'].includes(SEGMENT)) {
  console.error(`Tuntematon segmentti: ${SEGMENT}. Käytä any, parents tai adults.`)
  process.exit(1)
}

// Bounds are computed from their own outcome data, not written here. scripts/bounds.mjs reads
// their collaboration export, their not-realised export and anything recorded since, and derives
// the numbers. It reproduces the hand analysis exactly (taken zone 110k, realised median 75k),
// which is why it is safe to let it move on its own when they record the next outcome.
const B = bounds()
const MIN_SUBS = Number(arg('min-subs', 4000))
const MAX_SUBS = Number(arg('max-subs', 250_000))   // outer bound for reporting
const TAKEN_ZONE = B.takenZone    // above this: already with a competitor, or exclusive
const MIN_VIDEOS = 5

// The band Akseli named when asked whether to chase small growing creators or large expensive
// ones: "Painotus on kasvaviin pieniin ja keskikokoisiin kanaviin (noin 10-100 k tilaajaa), joilla
// on korkea sitoutuminen ja nouseva trendi... Hakukone saa siis järjestää kasvunopeuden ja
// sitoutumisen perusteella, ei pelkän koon."
//
// So size stops being the thing that scores and becomes a window. Growth and engagement carry the
// weight instead, and a large channel is not excluded but is no longer a prize: they use those
// "harkiten yksittäisiin brändihetkiin, kuten Black Fridayna".
const SWEET_MIN = 10_000
const SWEET_MAX = 100_000

// "Korkea sitoutuminen" has to mean high compared with something. A fixed number picked from one
// run's distribution stops being the top quarter as soon as the population changes — set at 0.23 %
// from a subset, it matched 41 % of the full list, which is not a signal. So the threshold is
// computed from each run's own eligible creators at scoring time and reported with the result.
let engagedCommentRate = 0.23

// Creators aimed at under-13s. Excluded by request; teenagers are explicitly wanted.
const EXCLUDE_KIDS = !process.argv.includes('--include-kids')

// Search queries per thin market. Off by default because search costs 100 quota units against a
// 10 000 daily budget, which is a hundred times an id-based call and the reason this pipeline
// avoids it everywhere else.
//
// It exists because for some markets the chart route is structurally broken, not merely weak.
// Estonia's gaming chart holds 27 videos and not one Estonian creator: fifteen are international
// (MrBeast, IShowSpeed, Grian) and twelve are Russian. Expanding from it reaches what Estonians
// watch, never what Estonians make. Measured: the chart route found one Estonian creator in 96 233
// fetched channels; four Estonian-language searches found eight, for 404 units.
//
// The searches only buy SEEDS. Expansion from them is the same cheap commenter route as everywhere
// else, so the expensive call is made once per market and the tail comes free.
const SEARCH_PER_MARKET = Number(arg('search', 0))
const MIN_LOCAL_SEEDS = Number(arg('min-local-seeds', 5))

// Videos read per channel to measure recent performance. playlistItems costs one unit for up to
// 50 ids and videos.list one unit for up to 50 ids, so 20 costs exactly what 10 costs. More
// videos means a usable trend (10 newer vs 10 older) and a far better niche reading.
const SAMPLE = 20

// ---------- quota-aware, cached API ----------

// A different cache directory is how a caller asks for a run that ignores previous responses.
const CACHE = process.env.CACHE_DIR || 'cache'
mkdirSync(CACHE, { recursive: true })
mkdirSync(OUT, { recursive: true })

let units = 0
let cacheHits = 0
let cacheExpired = 0

// Stage-by-stage bookkeeping, so the view can show what the engine did rather than only
// what it produced. Written to out/pipeline.json.
const stages = []
const stage = (name, count, note) => {
  stages.push({ name, count, note, unitsAfter: units })
  return count
}

// YouTube's API Services Terms cap how long API data may be kept at 30 days. Channel and video
// IDs are the exception and may be stored indefinitely, which is what data/seen.json relies on.
// So the cache expires on purpose: a stale entry is not a saving, it is a violation.
const CACHE_TTL_DAYS = 30

async function api(endpoint, params) {
  const key = createHash('sha1').update(endpoint + JSON.stringify(params)).digest('hex')
  const path = `${CACHE}/${endpoint}-${key}.json`
  if (existsSync(path)) {
    const ageDays = (Date.now() - statSync(path).mtimeMs) / 86_400_000
    if (ageDays <= CACHE_TTL_DAYS) {
      cacheHits++
      return JSON.parse(readFileSync(path, 'utf8'))
    }
    cacheExpired++
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
// channels.list costs one unit per call whatever parts are asked for, so brandingSettings
// (the creator's own keywords) and topicDetails (YouTube's own topic classification) are free
// niche signal and there is no reason not to take them.
async function channelsByIds(ids, part = 'snippet,statistics,contentDetails,brandingSettings,topicDetails,status') {
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

// Niche taxonomy. Akseli asked for "niche (tech review / gaming, what game)", so the niche is a
// named thing that goes in the file, not only a hidden weight.
//
// `weight` is how strongly the niche implies a PC purchase decision, anchored in Prenew's own
// realised collaborations: Minecraft 10 of 69, Tech 5, gaming news / tech 4, general games 4.
// Mobile-first titles run on a phone, so they weigh least. Order matters: a specific game is
// recognised before the generic category, and `kind` is the coarse answer, `label` the precise one.
const NICHES = [
  // hardware and buying decisions: the creator is already selling machines
  { key: 'tech',        kind: 'tech review', label: 'Tech / hardware review', w: 1.0, re: /\b(tech review|hardware|pc.?build|rig build|benchmark|unboxing|näytönohjain|prosessori|komponent|gaming gear|peripherals?)\b/i },
  // games where frame rate or load time is the reason to upgrade
  { key: 'minecraft',   kind: 'peli', label: 'Minecraft',              w: 1.0, re: /\bminecraft\b|\bmc\s?(survival|smp|hardcore)\b/i },
  { key: 'fortnite',    kind: 'peli', label: 'Fortnite',               w: 1.0, re: /\bfortnite\b|\bfn\s?(battle|zero)\b/i },
  { key: 'cs',          kind: 'peli', label: 'CS2 / Counter-Strike',   w: 0.9, re: /\bcs\s?2\b|\bcsgo\b|counter.?strike/i },
  { key: 'valorant',    kind: 'peli', label: 'Valorant',               w: 0.9, re: /\bvalorant\b/i },
  { key: 'gta',         kind: 'peli', label: 'GTA',                    w: 0.9, re: /\bgta\s?(v|vi|5|6|rp|online)?\b|grand theft auto/i },
  { key: 'ark',         kind: 'peli', label: 'ARK',                    w: 0.9, re: /\bark\b.{0,20}(survival|evolved|ascended)|\bark:?\s/i },
  { key: 'tarkov',      kind: 'peli', label: 'Escape from Tarkov',     w: 0.9, re: /\btarkov\b/i },
  { key: 'rust',        kind: 'peli', label: 'Rust',                   w: 0.9, re: /\brust\b.{0,20}(wipe|raid|base|solo)/i },
  { key: 'cities',      kind: 'peli', label: 'Cities: Skylines',       w: 0.9, re: /cities.?skylines/i },
  { key: 'simulator',   kind: 'peli', label: 'Simulaattorit',          w: 0.8, re: /\bsimulator\b|\bsim racing\b|\bets\s?2\b|farming simulator|flight sim/i },
  { key: 'palworld',    kind: 'peli', label: 'Palworld',               w: 0.8, re: /\bpalworld\b/i },
  { key: 'battlefield', kind: 'peli', label: 'Battlefield / CoD',      w: 0.8, re: /\bbattlefield\b|\bbf\s?(1|3|4|5|6|2042)\b|call of duty|\bcod\b.{0,12}(warzone|mw|bo\d)/i },
  { key: 'apex',        kind: 'peli', label: 'Apex Legends',           w: 0.8, re: /apex legends/i },
  { key: 'lol',         kind: 'peli', label: 'League of Legends',      w: 0.7, re: /league of legends|\blol\b.{0,15}(gameplay|ranked|patch)/i },
  { key: 'souls',       kind: 'peli', label: 'Souls / Elden Ring',     w: 0.8, re: /dark souls|elden ring|\bsekiro\b|\bnioh\b/i },
  { key: 'roblox',      kind: 'peli', label: 'Roblox',                 w: 0.6, re: /\broblox\b/i },
  { key: 'sims',        kind: 'peli', label: 'The Sims',               w: 0.6, re: /\bthe sims\b|\bsims\s?4\b/i },
  { key: 'terraria',    kind: 'peli', label: 'Terraria / Stardew',     w: 0.5, re: /\bterraria\b|stardew/i },
  // mobile-first: runs on a phone, so it argues against a PC purchase
  { key: 'mobile',      kind: 'peli', label: 'Mobiilipelit',           w: 0.2, re: /clash royale|clash of clans|brawl stars|geometry dash|among us|\bpubg mobile\b|\bmobile game/i },
  // adjacent content: an audience exists but the product fit has to be argued
  { key: 'esports',     kind: 'esports / news', label: 'Esports ja pelinews', w: 0.7, re: /\besports?\b|\be-?sports\b|gaming news|patch notes|\bturnaus\b|tournament/i },
  { key: 'lifestyle',   kind: 'lifestyle',      label: 'Lifestyle / vlog',    w: 0.3, re: /\bvlog\b|lifestyle|\bdaily life\b|\bstoryti(me|mes)\b/i },
  { key: 'comedy',      kind: 'comedy',         label: 'Komedia / sketsit',   w: 0.3, re: /\bcomedy\b|\bsketch\b|\bmeme\b|\bhumor\b|\bhuumori\b/i },
  { key: 'music',       kind: 'music',          label: 'Musiikki',            w: 0.2, re: /\bmusic video\b|\bofficial audio\b|\bbeat\b|\bremix\b|\bcover song\b/i },
  // generic fallback: it is gaming, we just cannot say which game
  { key: 'gaming',      kind: 'gaming',         label: 'Pelisisältö, ei eritelty', w: 0.5, re: /\bgam(e|es|ing|eplay)\b|\bpelit?\b|\blet.?s play\b|\bspiel\b|\bgra\b|\bjáték\b/i },
]

const NICHE_KEYS = new Set(NICHES.map((n) => n.key))

// Which audience a niche leans towards. YouTube exposes viewer demographics only to the channel's
// own owner, so this is a lean read off the content and never a measurement of who is watching.
// It matters because Prenew sells the same machine to two different people: the Parents' Choice
// tier is bought by an adult for a child, and the RGB tier is bought by the player.
const YOUNG_NICHES = new Set(['minecraft', 'roblox', 'fortnite', 'sims', 'terraria', 'mobile'])
const ADULT_NICHES = new Set(['cs', 'valorant', 'gta', 'ark', 'tarkov', 'rust', 'battlefield', 'apex', 'souls', 'tech', 'esports', 'cities'])

// The parent is present in the channel, not only the child. A creator who says "family friendly"
// is telling you the wallet is watching.
const FAMILY_SIGNAL = /family.?friendly|\bfamil(y|ie|ies)\b|\bfamili[ea]\b|\bfamille\b|koko perhe|perheen|lapsiperhe|hela familjen|ganze familie|hele familien|cała rodzina|az egész család/i

if (WANT.includes('?')) {
  console.log('Nichet joita voi pyytää --niche=<avain>,<avain>:\n')
  for (const n of NICHES) console.log(`  ${n.key.padEnd(12)} ${n.label.padEnd(30)} ${n.kind}`)
  process.exit(0)
}
const unknownNiche = WANT.filter((k) => !NICHE_KEYS.has(k))
if (unknownNiche.length) {
  console.error(`Tuntematon niche: ${unknownNiche.join(', ')}`)
  console.error(`Käytettävissä: ${[...NICHE_KEYS].join(', ')}`)
  console.error(`Koko lista selityksineen: --niche=?`)
  process.exit(1)
}

// Returns every niche the text supports, most specific first. The first hit is the primary one,
// because the list is ordered by how precisely it identifies the content.
function classifyNiche(text) {
  const hits = NICHES.filter((n) => n.re.test(text))
  if (!hits.length) return { primary: null, kind: 'tuntematon', games: [], w: 0.5, keys: [] }
  const games = hits.filter((n) => n.kind === 'peli').map((n) => n.label)
  return {
    primary: hits[0],
    kind: hits[0].kind,
    games,
    // The weight of the most product-relevant match, not of the first: a Minecraft channel that
    // also reviews hardware should not be penalised for mentioning a mobile game once.
    w: Math.max(...hits.map((n) => n.w)),
    keys: hits.map((n) => n.key),
  }
}

// Self-declared youth signals. Never a filter, always a flag: the decision stays with a human.
//
// Bare ages used to be in here and they were almost all false positives once the sample grew to
// twenty videos per channel: "Na 14 Afleveringen", "14.000 Robux", "Jour 14", "August 13". An age
// now only counts with a qualifier around it. Prenew sells a Parents' Choice category and a
// gaming-pc-for-kids page, so this flag has to be trustworthy rather than merely present.
const YOUTH_HINT = new RegExp(
  [
    // English
    String.raw`\bfor kids\b`, String.raw`\bkids?['’]?s? (channel|content|gaming|friendly)\b`,
    String.raw`\bfamily.?friendly\b`, String.raw`\bmade for kids\b`, String.raw`\bchild(ren)?['’]?s\b`,
    String.raw`\bkid.?friendly\b`, String.raw`\byoung (audience|viewers|fans)\b`,
    // An age, but only with a qualifier and only inside a plausible range. "Over 9000" and
    // "age 1" both slipped through a looser version of this.
    String.raw`\b(under|ages?|aged|age)\s?:?\s?(?:[3-9]|1[0-7])\b(?!\d)`,
    String.raw`\b(?:[3-9]|1[0-7])\s?\+\s?(vuot|year|jahr|ans|år|lat|év)`,
    String.raw`\b(alle|yli)\s(?:[3-9]|1[0-7])\s?(-?vuotia|v\.)`,
    // their markets
    String.raw`\blapsille\b`, String.raw`\bnuorille\b`, String.raw`\blapsiperhe`,   // fi
    String.raw`\bför barn\b`, String.raw`\bbarnvänlig`,                              // sv
    String.raw`\btil børn\b`,                                                        // da
    String.raw`\bfür kinder\b`, String.raw`\bkinderfreundlich`,                      // de
    String.raw`\bvoor kinderen\b`, String.raw`\bkindvriendelijk`,                    // nl
    String.raw`\bpour (les )?enfants\b`,                                             // fr
    String.raw`\bdla dzieci\b`,                                                      // pl
    String.raw`\bgyerekeknek\b`, String.raw`\bgyerek csatorna\b`,                    // hu
    String.raw`\blastele\b`,                                                         // et
    String.raw`\bbērniem\b`, String.raw`\bvaikams\b`,                                // lv, lt
  ].join('|'),
  'i',
)

// The strongest Prenew-specific signal, found by reading their own partners' channels:
// creators who list their rig in the channel description already sell PCs for free, because
// their audience asks about it. No influencer platform detects this.
const RIG_TALK = /(rtx\s?\d{4}|gtx\s?\d{3,4}|ryzen|core\s?i[3579]|radeon|geforce|näytönohjain|prosessori|prossu|specs?|speksit|kokoonpano|setup|rechner|dator|gépem|komputer)/i

// ---------- cross-platform handles, read out of the channel description ----------
//
// YouTube and TikTok are what they asked for; IG, FB and Twitch they called a plus. All of them
// are free here, because a creator who is on several platforms links them in their own description.
// The narrow /tiktok\.com\/@/ pattern this replaces found 13 creators out of 473: most creators
// write "TikTok: @name" rather than pasting a URL.

const HANDLE = String.raw`[\w][\w.]{1,29}`

const SOCIAL_PATTERNS = {
  tiktok: [
    new RegExp(String.raw`tiktok\.com/@(${HANDLE})`, 'i'),
    new RegExp(String.raw`tiktok\b[\s:\-–—>|]*@?(${HANDLE})`, 'i'),
  ],
  instagram: [
    new RegExp(String.raw`instagram\.com/(${HANDLE})`, 'i'),
    new RegExp(String.raw`\b(?:instagram|insta|ig)\b[\s:\-–—>|]*@(${HANDLE})`, 'i'),
  ],
  twitch: [
    new RegExp(String.raw`twitch\.tv/(${HANDLE})`, 'i'),
    new RegExp(String.raw`\btwitch\b[\s:\-–—>|]*@?(${HANDLE})`, 'i'),
  ],
  facebook: [new RegExp(String.raw`(?:facebook|fb)\.com/(${HANDLE})`, 'i')],
  twitter: [new RegExp(String.raw`(?:twitter|x)\.com/(${HANDLE})`, 'i')],
  discord: [new RegExp(String.raw`discord\.(?:gg|com/invite)/(\w{4,20})`, 'i')],
}

// Words that look like a handle but are not one: they show up when a description says
// "follow me on TikTok too" or links a share URL rather than a profile.
const NOT_A_HANDLE = /^(com|www|http|https|and|also|too|my|me|here|link|links|share|intent|home|profile|page|channel|user|video|myös|minun|tili|seuraa|folge|obserwuj|kövess|follow|subscribe|channels|watch|reel|reels|p|explore)$/i

function socials(desc) {
  const found = {}
  for (const [platform, patterns] of Object.entries(SOCIAL_PATTERNS)) {
    for (const re of patterns) {
      const h = re.exec(desc)?.[1]
      if (h && !NOT_A_HANDLE.test(h)) { found[platform] = h.replace(/[.]+$/, ''); break }
    }
  }
  // A short-link proves presence even when the handle is not readable from it.
  if (!found.tiktok && /vm\.tiktok\.com|tiktok\.com\/t\//i.test(desc)) found.tiktok = '(linkki)'
  return found
}

// All addresses, then the one that reads like a business contact. Creators who keep a separate
// business address are the ones who answer, and it is the address their agency reads.
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]{2,}/g
const BUSINESS_EMAIL = /(business|bookings?|contact|kontakt|info|yhteisty|sponsor|collab|media|mgmt|management|partner|zakelnicz|wspolprac|együttműködés|samarbete|reklam)/i

function emails(desc) {
  const all = [...new Set((desc.match(EMAIL_RE) || []).map((e) => e.replace(/[.,;]+$/, '')))]
  const business = all.find((e) => BUSINESS_EMAIL.test(e)) || null
  return { all, primary: business || all[0] || null, business }
}

// Their own existing partners, read from the collaboration data. The engine should find these
// (it does, which validates the model) but they must not be presented as new discoveries.
const norm = (s) => String(s || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim()

const isKnown = (title) => B.knownSet.has(norm(title))

// Creators they already approached and rejected, with the reason. Without this the engine
// happily promotes someone they turned down: Lewa scored 100 before this was added. The map
// includes anything recorded through record_outcome since the last run.
const rejectedAs = (title) => B.rejectedMap.get(norm(title)) || null

// Organisations and teams are not creators: "Big clan" was rejected as "not a creator".
const ORGANISATION = /\b(clan|esports?|e-sports?|team|org|organisation|organization|academy|gaming house)\b/i

// Competitor signals in the description. A creator who already promotes another PC shop is
// either exclusive or expensive: 5 of 26 rejections were "competitor / exclusivity", the
// single largest reason. These are the PC and refurb retailers in their markets.
// A competitor is someone who sells the same thing: a whole machine. Component and peripheral
// brands are a different case and used to be lumped in here, which flagged MrRockis — one of
// Prenew's own partners — as promoting a competitor. Corsair sells a keyboard, not a refurbished PC,
// so a creator who works with them is not unavailable. If anything they have already shown they do
// hardware deals and know how they work.
// Akseli named these when asked, and the three groups are his: valmiskoneiden myyjät, käytettyjen
// tai kunnostettujen markkinapaikat, ja kotimaiset myyjät. MIFCOM and Multitronic came from that
// answer and were missing here. He also confirmed the split made earlier: "Corsair ja HyperX ovat
// oheislaitebrändejä eivätkä varsinaisesti kilpaile kanssamme. Niiden sponsorointi ei ole este."
const COMPETITOR = /\b(mifcom|dubaro|memorypc|memory pc|one\.de|alternate|mindfactory|csl.?computer|caseking|notebooksbilliger|nbb|back ?market|refurbed|rebuy|swappie|verkkokauppa|jimm'?s|multitronic|gigantti|power\.fi|inet\.se|webhallen|komplett|proshop|elgiganten|megekko|azerty|coolblue|morele|x-?kom|komputronik|alza|ldlc|materiel\.net|topachat|cybertek|pccomponentes)\b/i

// Component and peripheral brands. Adjacent rather than competing, and reported separately so the
// distinction is visible instead of buried in one penalty.
const HARDWARE_SPONSOR = /\b(corsair|nzxt|hyperx|razer|logitech|steelseries|asus|rog\b|msi|gigabyte|be quiet|noctua|cooler master|thermaltake|kingston|crucial|seagate|western digital|\bwd\b|lian li|endgame gear|glorious|turtle beach)\b/i

// Local-language queries, because a market's own creators write in their own language. The terms
// are deliberately plain: the verb for "playing", the country adjective, and the two games that
// dominate Prenew's own collaborations.
const LOCAL_QUERIES = {
  EE: ['minecraft eesti', 'mängime', 'eesti gaming', 'fortnite eesti keeles'],
  LV: ['minecraft latviski', 'spēlējam', 'latviešu gaming', 'fortnite latviski'],
  LT: ['minecraft lietuviškai', 'žaidžiam', 'lietuviškas gaming', 'fortnite lietuviškai'],
  FI: ['minecraft suomeksi', 'pelataan', 'suomalainen pelikanava'],
  SE: ['minecraft på svenska', 'vi spelar', 'svensk gaming'],
  DK: ['minecraft på dansk', 'vi spiller', 'dansk gaming'],
  NL: ['minecraft nederlands', 'we spelen', 'nederlandse gaming'],
  HU: ['minecraft magyarul', 'játszunk', 'magyar gaming'],
  PL: ['minecraft po polsku', 'gramy', 'polski gaming'],
  DE: ['minecraft deutsch', 'wir spielen', 'deutscher gaming kanal'],
  FR: ['minecraft en français', 'on joue', 'chaîne gaming française'],
}

const MARKET_LANG = {
  EE: 'et', LV: 'lv', LT: 'lt', FI: 'fi', SE: 'sv', DK: 'da',
  NL: 'nl', HU: 'hu', PL: 'pl', DE: 'de', FR: 'fr',
}

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

console.log(`Markets: ${MARKETS.join(',')} | seeds/market: ${SEEDS_PER_MARKET} | budget: ${BUDGET} units`)
if (WANT.length) console.log(`Niche:   ${WANT.join(', ')}`)
if (SEGMENT !== 'any') console.log(`Segmentti: ${SEGMENT === 'parents' ? 'vanhemmat ostajana' : 'aikuinen ostaa itselleen'}`)
console.log(`Koodin tuotto: ${B.sales.basis}`)
console.log(`Rajat laskettu heidän datastaan (${B.counts.collaborations} yhteistyötä, ${B.counts.rejections} hylkäystä${B.counts.recorded ? `, ${B.counts.recorded} kirjattua lopputulosta` : ''}):`)
console.log(`  yläraja ${TAKEN_ZONE.toLocaleString('fi-FI')} — ${B.basis.takenZone}`)
console.log(`  osuma-alue mediaani ${B.realisedMedian?.toLocaleString('fi-FI')} — ${B.basis.realisedMedian}\n`)

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

stage('Maakohtaiset pelilistat', MARKETS.length, 'yksi kutsu per markkina')
stage('Kanavia listoilta', discovered.size, 'julkisesti löydettävissä')
console.log(`\nChart channels: ${discovered.size}`)

// ---------- 2. enrich chart channels, pick expansion seeds ----------

const chartChannels = await channelsByIds([...discovered.keys()])

const candidates = new Map() // channelId -> record

function record(c, via, meta) {
  const s = c.statistics
  const desc = (c.snippet.description || '').replace(/\s+/g, ' ').trim()
  const keywords = (c.brandingSettings?.channel?.keywords || '').replace(/"/g, ' ')
  // YouTube's own classification, e.g. .../wiki/Action_game. Structured, and free with the call.
  const topics = (c.topicDetails?.topicCategories || [])
    .map((u) => decodeURIComponent(u.split('/').pop() || '').replace(/_/g, ' '))
  const soc = socials(desc)
  const mail = emails(desc)
  const ageDays = c.snippet.publishedAt
    ? Math.round((Date.now() - Date.parse(c.snippet.publishedAt)) / 86_400_000)
    : null

  return {
    id: c.id,
    title: c.snippet.title,
    // The @handle is what a human recognises the creator by, and it is what their outreach
    // automation needs in order to find the same person on another platform.
    handle: c.snippet.customUrl || null,
    url: c.snippet.customUrl
      ? `https://www.youtube.com/${c.snippet.customUrl}`
      : `https://www.youtube.com/channel/${c.id}`,
    thumb: c.snippet.thumbnails?.medium?.url || c.snippet.thumbnails?.default?.url || null,
    via,
    subs: Number(s.subscriberCount || 0),
    videos: Number(s.videoCount || 0),
    totalViews: Number(s.viewCount || 0),
    channelCountry: c.snippet.country || null,
    channelLang: c.snippet.defaultLanguage || null,
    channelAgeDays: ageDays,
    markets: [...(meta?.markets || [])],
    langs: [...(meta?.langs || [])],
    desc,
    keywords,
    topics,
    uploads: c.contentDetails?.relatedPlaylists?.uploads || null,
    tiktok: soc.tiktok || null,
    instagram: soc.instagram || null,
    twitch: soc.twitch || null,
    facebook: soc.facebook || null,
    twitter: soc.twitter || null,
    discord: soc.discord || null,
    platforms: ['youtube', ...Object.keys(soc)],
    email: mail.primary,
    emailBusiness: mail.business,
    emailsAll: mail.all,
    sideChannel: isSideChannel(c.snippet.title, desc),
    // YouTube's own made-for-kids designation, which is the authoritative version of what the
    // description regex guesses at. Akseli: "made for kids -kanavat karsitaan lähtökohtaisesti
    // pois", so this is a filter and not a boost.
    madeForKids: c.status?.madeForKids === true,
    youthHint: YOUTH_HINT.test(desc),
    familySignal: FAMILY_SIGNAL.test(`${desc} ${keywords}`),
    rigTalk: RIG_TALK.test(`${desc} ${keywords}`),
    known: isKnown(c.snippet.title),
    rejected: rejectedAs(c.snippet.title),
    organisation: ORGANISATION.test(c.snippet.title),
    competitor: COMPETITOR.exec(`${desc} ${keywords}`)?.[0] || null,
    hardwareSponsor: HARDWARE_SPONSOR.exec(`${desc} ${keywords}`)?.[0] || null,
  }
}

for (const c of chartChannels) {
  candidates.set(c.id, record(c, 'chart', discovered.get(c.id)))
}

// Everything the engine knows about what a channel is about. Cheap fields first, then the video
// titles and tags that only exist after stage 5.
const nicheBasis = (r) =>
  `${r.title} ${r.desc} ${r.keywords || ''} ${(r.topics || []).join(' ')} ${r.nicheText || ''}`

const matchesWant = (r) =>
  !WANT.length || classifyNiche(nicheBasis(r)).keys.some((k) => WANT.includes(k))

// Expand from real creators in range, not from side channels.
//
// When a niche is requested, expand from creators who are in that niche: the commenters under a
// Minecraft video are Minecraft creators. This is where targeting actually happens, and it is why
// --niche is an input and not only a filter on the way out.
// A seed is a place to look, not a creator to partner with, so the size window does not apply to
// it. Mid-size local creators come first because their commenters are the most local, but a large
// channel in the requested niche is the richest commenter source there is and it is used as filler
// when the chart does not hold enough mid-size ones. Asking for one market and one niche used to
// leave four seeds; this is what makes narrow targeting actually reach the tail.
const seeds = []
let seedFallbacks = []
for (const market of MARKETS) {
  const pool = [...candidates.values()]
    .filter((r) => r.markets.includes(market) && !r.sideChannel && r.videos >= MIN_VIDEOS)
    .filter((r) => r.subs >= MIN_SUBS)
  const onNiche = pool.filter(matchesWant)
  // A small market may have nobody on the chart in the requested niche. Expanding from its other
  // gaming creators still finds local people, so the market is kept and the compromise is logged.
  const use = onNiche.length ? onNiche : pool
  if (WANT.length && !onNiche.length && pool.length) seedFallbacks.push(market)

  const midSize = use.filter((r) => r.subs <= MAX_SUBS).sort((a, b) => a.subs - b.subs)
  const large = use.filter((r) => r.subs > MAX_SUBS).sort((a, b) => b.subs - a.subs)
  seeds.push(...[...midSize, ...large].slice(0, SEEDS_PER_MARKET))
}
stage('Siemeniä laajennukseen', seeds.length,
  WANT.length ? `haarukassa ja pyydetyssä nichessä (${WANT.join(', ')}), pienimmät ensin`
              : 'oikeita tekijöitä haarukassa, pienimmät ensin')
console.log(`Expansion seeds: ${seeds.length}${WANT.length ? ` (niche: ${WANT.join(',')})` : ''}`)
if (seedFallbacks.length) {
  console.log(`  ei nichen mukaista siementä listalla: ${seedFallbacks.join(', ')} — laajennettu muista pelitekijöistä`)
}

// ---------- 2b. rescue a thin market with a local-language search ----------
//
// Only runs where the chart route genuinely failed to produce local seeds, and only when asked for
// with --search. Each query costs 100 units, so the spend is stated in the log rather than buried.
let searchUnits = 0
const rescued = []

if (SEARCH_PER_MARKET > 0) {
  for (const market of MARKETS) {
    // Appearing on a market's chart is not the same as being from it. Estonia's chart is made of
    // international and Russian channels, and counting those as local seeds is exactly why the
    // gap went unnoticed: the market looked served while every seed pointed somewhere else.
    const lang = MARKET_LANG[market] || 'zz'
    const local = seeds.filter(
      (r) =>
        r.markets.includes(market) &&
        (r.channelCountry === market || (r.channelLang || '').startsWith(lang) || (r.langs || []).some((l) => String(l).startsWith(lang))),
    ).length
    if (local >= MIN_LOCAL_SEEDS) continue
    console.log(`  ${market}: vain ${local} paikallista siementä listalta, haetaan lisää`)

    const queries = (LOCAL_QUERIES[market] || []).slice(0, SEARCH_PER_MARKET)
    if (!queries.length) continue

    const ids = new Set()
    for (const q of queries) {
      if (units >= BUDGET - 300) break
      try {
        const r = await api('search', {
          part: 'snippet', type: 'channel', q, regionCode: market,
          relevanceLanguage: MARKET_LANG[market] || '', maxResults: 50,
        })
        // search costs 100 units, not the 1 the counter assumed
        units += 99
        searchUnits += 100
        for (const it of r.items || []) {
          const id = it.snippet?.channelId || it.id?.channelId
          if (id && !discovered.has(id)) ids.add(id)
        }
      } catch (e) {
        console.log(`  haku "${q}" (${market}) epäonnistui: ${e.message}`)
      }
    }
    if (!ids.size) continue

    const fetched = await channelsByIds([...ids])
    let kept = 0
    for (const c of fetched) {
      // Only creators the market can actually claim. A search pinned to a region still returns
      // plenty of international channels, and adding those would undo the point of the market.
      const isLocal =
        c.snippet.country === market ||
        (c.snippet.defaultLanguage || '').startsWith(MARKET_LANG[market] || 'zz')
      if (!isLocal) continue
      const rec = record(c, 'chart', { markets: new Set([market]), langs: new Set([MARKET_LANG[market]]) })
      if (rec.sideChannel || rec.videos < MIN_VIDEOS || rec.subs < 500) continue
      note(c.id, 'chart', market, MARKET_LANG[market])
      candidates.set(c.id, rec)
      if (rec.subs >= MIN_SUBS) { seeds.push(rec); kept++ }
    }
    rescued.push({ market, queries: queries.length, seeds: kept, candidates: fetched.length })
  }

  if (rescued.length) {
    console.log(`\nPaikallishaku ohuille markkinoille (${searchUnits} yksikköä):`)
    for (const r of rescued) {
      console.log(`  ${r.market}: ${r.queries} hakua, ${r.candidates} kanavaa, ${r.seeds} uutta siementä`)
    }
    console.log('')
  }
}

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
stage('Kommentoijia', newIds.length, `sata kanavatunnusta per kiintiöyksikkö · ${commentsDisabled} videolla kommentit pois`)
console.log(`Commenter channels: ${newIds.length} (${commentsDisabled} videos had comments off)`)

// ---------- 4. enrich the commenters ----------

const commenterChannels = await channelsByIds(newIds)
for (const c of commenterChannels) {
  candidates.set(c.id, record(c, 'commenter', discovered.get(c.id)))
}

// ---------- 5. recent performance ----------

const DAY = 86_400_000
const now = Date.now()

const fmtInt = (n) => Number(n).toLocaleString('fi-FI')

const median = (xs) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

// ISO 8601 duration to seconds. Anything at or under three minutes is a Short by YouTube's
// current limit, and a Shorts-only channel is a different proposition from a long-form one.
const SHORT_MAX_SECONDS = 180
function durationSeconds(iso) {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '')
  if (!m) return null
  return (+(m[1] || 0)) * 86400 + (+(m[2] || 0)) * 3600 + (+(m[3] || 0)) * 60 + (+(m[4] || 0))
}

async function recentStats(r) {
  if (!r.uploads || units >= BUDGET - 20) return
  const pl = await api('playlistItems', { part: 'contentDetails', playlistId: r.uploads, maxResults: SAMPLE })
  const ids = (pl.items || []).map((i) => i.contentDetails.videoId)
  if (!ids.length) return
  const vd = await api('videos', { part: 'snippet,statistics,contentDetails', id: ids.join(',') })
  const vids = (vd.items || []).map((v) => ({
    at: Date.parse(v.snippet.publishedAt),
    views: Number(v.statistics.viewCount || 0),
    likes: Number(v.statistics.likeCount || 0),
    comments: Number(v.statistics.commentCount || 0),
    seconds: durationSeconds(v.contentDetails?.duration),
    lang: v.snippet.defaultAudioLanguage || v.snippet.defaultLanguage || null,
    title: v.snippet.title,
    desc: v.snippet.description || '',
    tags: v.snippet.tags || [],
  })).sort((a, b) => b.at - a.at)
  if (!vids.length) return

  const newest = vids[0].at
  const oldest = vids[vids.length - 1].at
  // Akseli's own definition: 30 days for active channels, 90 for less active ones.
  const window = now - newest > 30 * DAY ? 90 : 30
  const inWindow = vids.filter((v) => now - v.at <= window * DAY)
  const used = inWindow.length ? inWindow : vids.slice(0, 5)

  r.avgViews = Math.round(used.reduce((a, v) => a + v.views, 0) / used.length)
  // The median as well, because one video that broke out makes the mean say the wrong thing
  // about what a normal video on this channel does.
  r.medianViews = median(used.map((v) => v.views))
  r.viewWindow = `${window}d`
  r.sampleVideos = vids.length
  r.daysSinceUpload = Math.round((now - newest) / DAY)
  r.uploadsPerMonth = Number((vids.length / Math.max(1, (now - oldest) / DAY / 30)).toFixed(1))
  r.viewRatio = r.subs ? Number((r.avgViews / r.subs).toFixed(2)) : 0

  // Engagement. This is what influencer platforms charge for, and both numbers are already in
  // the response we paid for. likeCount is hidden on some channels, so it can be null.
  const sum = (k) => used.reduce((a, v) => a + v[k], 0)
  const totalViews = sum('views')
  r.likeRate = totalViews ? Number(((sum('likes') / totalViews) * 100).toFixed(2)) : null
  r.commentRate = totalViews ? Number(((sum('comments') / totalViews) * 100).toFixed(2)) : null

  // Format mix.
  const timed = vids.filter((v) => v.seconds != null)
  if (timed.length) {
    r.shortsShare = Math.round((timed.filter((v) => v.seconds <= SHORT_MAX_SECONDS).length / timed.length) * 100)
    r.medianSeconds = median(timed.map((v) => v.seconds))
  }

  // Trend: median views of the newer half against the older half of the same sample.
  //
  // This is deliberately conservative. Older videos have had longer to accumulate views, so a
  // flat ratio already means the channel is growing, and only a clear drop is called falling.
  if (vids.length >= 6) {
    const half = Math.floor(vids.length / 2)
    const newer = median(vids.slice(0, half).map((v) => v.views))
    const older = median(vids.slice(half).map((v) => v.views))
    if (older > 0) {
      r.trendPct = Math.round(((newer - older) / older) * 100)
      r.trend = r.trendPct >= 25 ? 'nouseva' : r.trendPct <= -30 ? 'laskeva' : 'vakaa'
      r.trendSpanDays = Math.round((newest - oldest) / DAY)
    }
  }

  for (const v of used) if (v.lang) r.langs.push(v.lang)

  // Socials again, this time from the video descriptions.
  //
  // YouTube's Links panel — the one showing TikTok, Instagram, Discord on the channel page — is
  // not returned by the Data API at all, and the address behind "show email" sits behind a bot
  // check that exists precisely to stop automated collection. Neither is scraped here.
  //
  // What creators do instead is repeat the same links in every video description, and those
  // descriptions arrived in the videos.list response we already paid for. So this costs nothing,
  // touches nothing outside the API, and finds the accounts the channel description omitted.
  const fromVideos = socials(vids.map((v) => v.desc).join(' \n '))
  for (const [k, v] of Object.entries(fromVideos)) {
    if (!r[k]) {
      r[k] = v
      if (!r.platforms.includes(k)) r.platforms.push(k)
      r.socialFromVideo = true
    }
  }
  if (!r.email) {
    const mail = emails(vids.map((v) => v.desc).join(' \n '))
    if (mail.primary) {
      r.email = mail.primary
      r.emailBusiness = mail.business
      r.emailFromVideo = true
    }
  }
  // Every sampled video, not only the ones in the window: the niche is a property of the channel
  // and more text means a more specific reading of it.
  r.nicheText = vids.map((v) => `${v.title} ${v.tags.join(' ')}`).join(' ').slice(0, 1500)
  r.topVideo = vids.reduce((a, v) => (v.views > a.views ? v : a), vids[0]).title
  if (YOUTH_HINT.test(r.nicheText)) r.youthHint = true
}

const forStats = [...candidates.values()]
  .filter((r) => !r.sideChannel && r.videos >= MIN_VIDEOS && r.subs >= 500)
  .sort((a, b) => b.subs - a.subs)

stage('Oikeita tekijöitä', forStats.length, 'vähintään 5 videota ja 500 tilaajaa, sivukanavat karsittu')
console.log(`Measuring recent performance for ${forStats.length} channels...`)
for (const r of forStats) {
  try { await recentStats(r) } catch (e) { if (e.message.includes('budget')) break }
}

// ---------- 5b. how long this creator stays buyable ----------
//
// Their own rejection data says that above the taken zone someone else already signed the creator.
// So for a growing creator the question is not "is the size right" but "how long does the size
// stay right". A 5k creator growing fast is a cheap deal with a deadline on it.
//
// The API gives no subscriber history, so the pace has to come from something it does give: the
// channel's age and its current size. Subscribers per month since the channel started is a
// measurement, not a guess, and the projection off it is linear.
//
// An earlier version compounded the view trend into a monthly growth rate. It claimed a 2 080
// subscriber channel would cross 110 000 in one month, because a +89 % view trend measured over
// five days becomes 4 000 % a month when you raise it to the power of six. Extrapolating a short
// window is not a forecast, it is amplified noise, and it is removed.
//
// What is left is deliberately conservative in a known direction: a lifetime average understates
// a channel that is accelerating. So the view trend is used as a qualifier rather than a rate —
// the warning only fires when the average pace is fast AND views are currently rising.
const MONTH = 30
const MIN_AGE_FOR_PACE = 180 // below six months old the average is not stable enough to use

function projectGrowth(r) {
  if (r.subs < 500 || !r.channelAgeDays || r.channelAgeDays < MIN_AGE_FOR_PACE) return

  const perMonth = Math.round((r.subs / r.channelAgeDays) * MONTH)
  r.subsPerMonth = perMonth
  if (perMonth < 50 || r.subs >= TAKEN_ZONE) return

  const months = Math.round((TAKEN_ZONE - r.subs) / perMonth)
  if (!Number.isFinite(months) || months <= 0) return
  r.monthsToBound = Math.min(120, months)
  // Both conditions have to hold: a pace that gets there within a year, and views that are
  // actually rising right now rather than a channel that grew years ago and stalled.
  r.signNow = r.monthsToBound <= 12 && r.trend === 'nouseva'
}

// The same "buy before it gets expensive" idea for a small channel, without any projection.
//
// Months-to-bound only ever fires for channels already near the bound, because a lifetime average
// pace will not carry a 5 000 subscriber channel to 110 000 inside a year. For the small tail the
// measurable version of the signal is different: the channel is already reaching more people than
// it has subscribers, and that reach is growing. No extrapolation, two measured quantities.
function markBreakout(r) {
  r.breakingOut =
    r.subs < 50_000 &&
    r.subs >= 500 &&
    r.trend === 'nouseva' &&
    r.viewRatio >= 0.8 &&
    r.viewRatio <= 3.0 && // above this it is borrowed content, not reach
    (r.daysSinceUpload ?? 999) <= 30
}

for (const r of candidates.values()) markBreakout(r)

for (const r of candidates.values()) projectGrowth(r)

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

// ---------- 6b. what counts as engaged, in this run ----------

{
  // The same population that ends up in the file, or the quartile describes a different set from
  // the one it is applied to: computed over subs >= 4000 it matched 37 % of a list whose small
  // creators comment far more.
  const rates = [...candidates.values()]
    .filter((r) => r.commentRate != null && !r.sideChannel && r.videos >= MIN_VIDEOS && r.subs >= 500)
    .map((r) => r.commentRate)
    .sort((a, b) => a - b)
  if (rates.length >= 40) {
    engagedCommentRate = Number(rates[Math.floor(rates.length * 0.75)].toFixed(2))
  }
}

// ---------- 7. scoring ----------

for (const r of candidates.values()) {
  // Each entry is [text, points]. Pushing the points alongside the words is what lets the view
  // answer "why 145" with a breakdown rather than with a number somebody has to trust.
  const parts = []
  let score = 0
  // Points are parked by add() and attach to the next reason pushed, so the breakdown cannot drift
  // from the total: every point that moves the score is spoken for by a sentence.
  let pending = 0
  const add = (n) => { score += n; pending += n }
  const take = () => { const p = pending; pending = 0; return p }
  const reasons = {
    push: (text) => parts.push({ text, points: take() }),
    unshift: (text) => parts.unshift({ text, points: take() }),
  }

  // Audience alive. Both bounds matter: a very high ratio usually means borrowed content.
  if (r.viewRatio >= 0.15 && r.viewRatio <= 2.0) {
    add(30)
    reasons.push(`katselut ${Math.round(r.viewRatio * 100)} % tilaajista`)
  } else if (r.viewRatio > 2.0) {
    add(-(10))
    reasons.push(`katselusuhde ${Math.round(r.viewRatio * 100)} % epäilyttävän korkea`)
  } else if (r.viewRatio > 0) {
    reasons.push(`katselut vain ${Math.round(r.viewRatio * 100)} % tilaajista`)
  }

  // Present on both platforms: the strongest repeat signal in Prenew's own data.
  if (r.tiktok) { add(25); reasons.push('myös TikTokissa') }

  // Already talks about hardware, so the product fits the channel without being forced.
  if (r.rigTalk) { add(20); reasons.push('puhuu laitteistosta') }

  // Their market, not just any market.
  if (r.inTargetMarket) {
    add(10)
    reasons.push(`${r.country} on heidän markkinansa`)
  } else if (r.country) {
    add(-20)
    reasons.push(`${r.country} ei ole heidän markkina`)
  }

  // Above the taken zone a creator is usually already with a competitor or priced as exclusive:
  // their rejections for "competitor / exclusivity" had a YouTube median of 479k.
  if (r.subs > TAKEN_ZONE) {
    add(-(30))
    reasons.push(`${Math.round(r.subs / 1000)}k tilaajaa, yli rajan ${Math.round(TAKEN_ZONE / 1000)}k: ${B.basis.takenZone}`)
  }
  if (r.subs > MAX_SUBS) { add(-(20)); reasons.push('selvästi yli heidän haarukkansa') }

  // Already promotes another PC retailer. Largest single rejection reason in their own data.
  if (r.competitor) { add(-(40)); reasons.push(`mainitsee kilpailijan (${r.competitor})`) }

  // A component or peripheral brand is not a competitor: they sell a keyboard, Prenew sells a
  // machine. It is a mild positive instead, because the creator has done a hardware deal before
  // and knows how one works. This distinction exists because lumping the two together flagged
  // one of Prenew's own partners as promoting a competitor.
  if (r.hardwareSponsor && !r.competitor) {
    add(5)
    reasons.push(`tehnyt laitteistoyhteistyön (${r.hardwareSponsor}), ei kilpailija`)
  }

  // An organisation has no persona to partner with.
  if (r.organisation) { add(-(40)); reasons.push('organisaatio, ei tekijä') }

  // They already approached this creator and said no.
  if (r.rejected) {
    const later = r.rejected.later === 'Did collab later'
    add(-(later ? 10 : 50))
    reasons.unshift(later
      ? `HYLÄTTIIN AIEMMIN (${r.rejected.reason}) mutta yhteistyö toteutui myöhemmin`
      : `TE HYLKÄSITTE TÄMÄN: ${r.rejected.reason}`)
  }

  // Niche. Kept on the record because Akseli asked for it as an output field, and used as a
  // weight because some niches imply a PC purchase and some argue against one.
  const n = classifyNiche(nicheBasis(r))
  r.niche = n.kind
  r.nicheLabel = n.primary?.label || 'Tuntematon'
  r.games = n.games
  r.nicheKeys = n.keys
  r.onRequestedNiche = !WANT.length || n.keys.some((k) => WANT.includes(k))
  add(Math.round(n.w * 20))
  if (n.w >= 0.9) reasons.push(`${r.nicheLabel}, niche vaatii koneen`)
  else if (n.w <= 0.3) reasons.push(`${r.nicheLabel}, niche ei vaadi konetta`)
  else if (n.primary) reasons.push(r.nicheLabel)

  // Growing now is worth more than having been big. Their own rejections show the opposite end:
  // by the time a creator is large, someone else already signed them.
  if (r.trend === 'nouseva') { add(20); reasons.push(`katselut nousussa ${r.trendPct} %`) }
  else if (r.trend === 'laskeva') { add(-(15)); reasons.push(`katselut laskussa ${r.trendPct} %`) }

  // The closing window. This is the one signal that says act rather than consider.
  if (r.signNow) {
    add(15)
    reasons.unshift(`KIINNITÄ NYT: kasvaa ${fmtInt(r.subsPerMonth)} tilaajaa/kk, arviolta ${r.monthsToBound} kk ${Math.round(TAKEN_ZONE / 1000)}k rajaan`)
  } else if (r.monthsToBound != null && r.monthsToBound <= 24 && r.trend !== 'laskeva') {
    add(5)
    reasons.push(`arviolta ${r.monthsToBound} kk rajaan nykytahdilla`)
  }

  if (r.breakingOut) {
    add(15)
    reasons.unshift(`NOUSUKIITO: tavoittaa ${Math.round(r.viewRatio * 100)} % tilaajamäärästään per video ja kasvaa, vielä ${fmtInt(r.subs)} tilaajaa`)
  }

  // Audience lean, and the segment being sold to. The lean is read off the niche and the creator's
  // own words, never measured, so it moves the score modestly and always says which way it read.
  const youngLean = n.keys.some((k) => YOUNG_NICHES.has(k)) || r.youthHint || r.familySignal
  const adultLean = n.keys.some((k) => ADULT_NICHES.has(k))
  r.audience = youngLean && !adultLean ? 'nuori' : adultLean && !youngLean ? 'aikuinen' : 'sekalainen'
  // The parent is reachable when the channel says so itself, which is stronger than the niche.
  r.parentsChoice = r.familySignal || (youngLean && r.youthHint)

  // Under-13 channels are out by request: "made for kids -kanavat karsitaan lähtökohtaisesti
  // pois". Teenagers are not the same thing and are explicitly wanted, so nothing here penalises
  // a young audience as such — only YouTube's own made-for-kids designation.
  if (r.madeForKids) {
    add(-(60))
    reasons.unshift('MADE FOR KIDS, karsitaan: yleisö on alle 13')
  }

  if (SEGMENT === 'parents') {
    if (r.parentsChoice) { add(20); reasons.push('vanhempi tavoitettavissa kanavan omin sanoin') }
    else if (youngLean) { add(8); reasons.push('nuori yleisö, ostaja on vanhempi') }
    if (adultLean && !youngLean) { add(-(15)); reasons.push('aikuisyleisö, ei Vanhempien valinta -tuotteelle') }
  } else if (SEGMENT === 'adults') {
    if (adultLean && !youngLean) { add(15); reasons.push('aikuisyleisö ostaa itselleen') }
    if (youngLean && !adultLean) { add(-(15)); reasons.push('nuori yleisö, ostopäätös on muualla') }
  }

  // What actually sold machines. Dormant until they record enough code results; the weight is
  // small even then, because it is their data and not ours that decides how much it is worth.
  if (B.sales.active && B.sales.bestBand) {
    const band = B.sales.byBand.find((b) => b.band === B.sales.bestBand)
    const [lo, hi] = { '0-10k': [0, 10_000], '10-50k': [10_000, 50_000], '50-110k': [50_000, 110_000], '110k+': [110_000, Infinity] }[B.sales.bestBand]
    if (r.subs >= lo && r.subs < hi) {
      add(15)
      reasons.push(`kokoluokka ${B.sales.bestBand} tuotti teillä ${band.ordersPerCreator} tilausta per tekijä`)
    }
  }

  // Reach on more than the two platforms they asked about. Small weight on purpose: their own
  // data measures YouTube and TikTok, so IG, Twitch and FB are reported more than they are scored.
  if (r.platforms.length >= 3) {
    add(5)
    reasons.push(`${r.platforms.length} alustaa (${r.platforms.slice(1).join(', ')})`)
  }

  // Size is a window now, not a prize. Akseli named 10-100k as the focus and said the engine
  // should rank on growth and engagement rather than on size alone, so this is worth less than
  // the trend and engagement signals below it.
  if (r.subs >= SWEET_MIN && r.subs <= SWEET_MAX) {
    add(10)
    reasons.push('10-100k, heidän painopisteensä')
  } else if (r.subs >= MIN_SUBS && r.subs <= MAX_SUBS) {
    add(4)
    reasons.push('haarukassa mutta painopisteen ulkopuolella')
  } else if (r.subs < MIN_SUBS) {
    reasons.push('alle heidän haarukkansa')
  }

  // Engagement, which they asked for by name. A comment costs a viewer more than a like, so the
  // comment rate is the one that separates an audience from a view count.
  if (r.commentRate != null && r.commentRate >= engagedCommentRate) {
    add(20)
    reasons.push(`sitoutunut yleisö, ${r.commentRate} % kommentoi`)
  }

  // Local rather than global, which is what small markets need.
  if (r.localOnly && r.via === 'chart') { add(10); reasons.push('vain yhden maan listalla') }
  if (r.via === 'commenter') { add(10); reasons.push(`löytyi kommentoijana${discovered.get(r.id)?.seed ? ` (${discovered.get(r.id).seed})` : ''}`) }

  // Active.
  if (r.daysSinceUpload != null) {
    if (r.daysSinceUpload <= 14) { add(10); reasons.push('julkaisee aktiivisesti') }
    else if (r.daysSinceUpload > 90) { add(-(15)); reasons.push(`${r.daysSinceUpload} pv edellisestä videosta`) }
  }

  // Contactable.
  if (r.email) { add(5); reasons.push('yhteystieto kuvauksessa') }

  if (r.countryConfidence === 'epävarma') reasons.push('maa epävarma')
  if (r.youthHint) reasons.push('viitteitä nuoresta yleisöstä')
  if (r.known) reasons.unshift('JO TEIDÄN KUMPPANINNE')

  r.score = score
  r.parts = parts
  r.reason = parts.map((p) => p.text).join('; ')
}

// ---------- 7b. who has been seen before ----------
//
// This answers the question a scheduled run actually asks: which of these are new since last time.
// Without it a weekly cron re-delivers the same thousand rows and the file stops being read.
//
// It stores a one-way hash of the channel id and two dates. Nothing else, and the hash rather than
// the id on purpose.
//
// YouTube's Developer Policies III.E.4.d allow non-authorized API data to be kept "not longer than
// 30 calendar days", and III.E.4.c requires that after 30 days the client "must either delete or
// refresh the stored data". The policies grant no exemption for resource ids, so storing channel
// ids indefinitely would be a claim we cannot support. A salted hash is not YouTube data: it can
// answer "have I seen this one before" and nothing else, because it cannot be turned back into an
// id or used to retrieve anything.
//
// This is also why the engine is a run and not a database, and why the right move is to act on a
// whole batch while it is fresh rather than to accumulate creators and drip-feed from the pile.
const SEEN_PATH = new URL('../data/seen.json', import.meta.url)
const today = new Date().toISOString().slice(0, 10)
const seenKey = (id) => createHash('sha1').update(`prenew-seen:${id}`).digest('hex').slice(0, 16)

let ledger = {}
try {
  if (existsSync(SEEN_PATH)) ledger = JSON.parse(readFileSync(SEEN_PATH, 'utf8'))
} catch { /* a corrupt ledger must not stop a run: the worst case is everything looks new */ }

for (const r of candidates.values()) {
  const prior = ledger[seenKey(r.id)]
  r.firstSeen = prior?.first || today
  r.isNew = !prior
}

// ---------- 8. output ----------

const eligible = [...candidates.values()]
  .filter((r) => !r.sideChannel)
  // "made for kids -kanavat karsitaan lähtökohtaisesti pois". YouTube's own designation, not a
  // guess from the description, and reversible with --include-kids.
  .filter((r) => !EXCLUDE_KIDS || !r.madeForKids)
  .filter((r) => r.videos >= MIN_VIDEOS && r.subs >= 500)
  .filter((r) => r.avgViews != null)
  // Keep their markets, and keep unknowns: an empty country field is common precisely among the
  // small local creators this is meant to find. Drop creators clearly outside their footprint.
  .filter((r) => r.inTargetMarket || !r.country)

// A requested niche restricts the file. Asking for Minecraft and getting a music channel back is
// the behaviour of the platforms that did not work for them.
const offNiche = eligible.filter((r) => !r.onRequestedNiche).length
const scored = eligible
  .filter((r) => r.onRequestedNiche)
  .sort((a, b) => b.score - a.score)

// Known partners and previously rejected creators stay in the file, because finding them proves
// the model works. They never sit at the top of the list, because they are not new leads.
const seen = (r) => r.known || r.rejected
const results = [...scored.filter((r) => !seen(r)), ...scored.filter(seen)]
const alreadyKnown = scored.filter((r) => r.known)
const alreadyRejected = scored.filter((r) => r.rejected)

// Column order is reading order in Excel: who, where, what about, how big, how healthy, how to
// reach, what we already know, why it is on the list, and finally the two empty ones they fill in.
const csvCols = [
  ['pisteet', (r) => r.score],
  ['kanava', (r) => r.title],
  ['tunnus', (r) => r.handle || ''],
  ['url', (r) => r.url],
  ['maa', (r) => r.country || ''],
  ['maan_varmuus', (r) => r.countryConfidence],
  ['kieli', (r) => r.langCode || ''],
  ['niche', (r) => r.niche],
  ['niche_tarkka', (r) => r.nicheLabel],
  ['pelit', (r) => (r.games || []).join(' | ')],
  ['tilaajat', (r) => r.subs],
  ['katselut_per_video', (r) => r.avgViews ?? ''],
  ['katselu_mediaani', (r) => r.medianViews ?? ''],
  ['katselu_ikkuna', (r) => r.viewWindow || ''],
  ['katselut_per_tilaaja', (r) => r.viewRatio ?? ''],
  ['trendi', (r) => r.trend || ''],
  ['trendi_pros', (r) => (r.trendPct != null ? r.trendPct : '')],
  ['tilaajaa_per_kk', (r) => (r.subsPerMonth != null ? r.subsPerMonth : '')],
  ['kk_rajaan_arvio', (r) => (r.monthsToBound != null ? r.monthsToBound : '')],
  ['kiinnita_nyt', (r) => (r.signNow ? 'kyllä' : '')],
  ['yleiso', (r) => r.audience || ''],
  ['vanhempien_valinta', (r) => (r.parentsChoice ? 'kyllä' : '')],
  ['videoita_per_kk', (r) => r.uploadsPerMonth ?? ''],
  ['pv_edellisesta', (r) => r.daysSinceUpload ?? ''],
  ['videoita_yhteensa', (r) => r.videos],
  ['lyhytvideo_osuus', (r) => (r.shortsShare != null ? `${r.shortsShare} %` : '')],
  ['tykkays_pros', (r) => (r.likeRate != null ? r.likeRate : '')],
  ['kommentti_pros', (r) => (r.commentRate != null ? r.commentRate : '')],
  ['kanavan_ika_pv', (r) => r.channelAgeDays ?? ''],
  ['tiktok', (r) => (r.tiktok ? (r.tiktok === '(linkki)' ? 'kyllä' : `@${r.tiktok}`) : '')],
  ['instagram', (r) => (r.instagram ? `@${r.instagram}` : '')],
  ['twitch', (r) => r.twitch || ''],
  ['facebook', (r) => r.facebook || ''],
  ['x', (r) => (r.twitter ? `@${r.twitter}` : '')],
  ['yhteystieto', (r) => r.email || ''],
  ['yhteystieto_business', (r) => r.emailBusiness || ''],
  ['puhuu_laitteistosta', (r) => (r.rigTalk ? 'kyllä' : '')],
  ['nuori_yleiso', (r) => (r.youthHint ? 'kyllä' : '')],
  ['made_for_kids', (r) => (r.madeForKids ? 'kyllä' : '')],
  ['jo_kumppani', (r) => (r.known ? 'kyllä' : '')],
  ['aiemmin_hylatty', (r) => (r.rejected ? r.rejected.reason : '')],
  ['kilpailija', (r) => r.competitor || ''],
  ['laitteistosponsori', (r) => r.hardwareSponsor || ''],
  ['uusi', (r) => (r.isNew ? 'kyllä' : '')],
  ['ensin_nahty', (r) => r.firstSeen || ''],
  ['loytyi', (r) => (r.via === 'chart' ? 'maalista' : 'kommentoija')],
  ['siemen', (r) => discovered.get(r.id)?.seed || ''],
  ['paras_video', (r) => r.topVideo || ''],
  // Fetched already and thrown away until now. A human scanning the file judges a channel from
  // its own words faster than from any score, and YouTube's topic classification is the one label
  // here that nobody on our side wrote.
  ['topic_luokat', (r) => (r.topics || []).join(' | ')],
  ['avainsanat', (r) => (r.keywords || '').slice(0, 200)],
  ['kuvaus', (r) => (r.desc || '').slice(0, 300)],
  ['perustelu', (r) => r.reason],
  // The feedback loop, and the only columns a human writes in. The next run reads them back, which
  // is how the scoring bounds get recalculated from their outcomes instead of our guesses.
  //
  // tilauksia and myynti_eur are the two that matter most: Prenew measures a collaboration at the
  // checkout from the discount code, so this is the only column here that records whether a machine
  // was actually sold rather than whether a message was answered.
  ['lopputulos', () => ''],
  ['hylkayssyy', () => ''],
  ['koodi', () => ''],
  ['tilauksia', () => ''],
  ['myynti_eur', () => ''],
]

const esc = (v) => {
  const s = String(v ?? '')
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csv = [
  csvCols.map(([h]) => h).join(','),
  ...results.map((r) => csvCols.map(([, f]) => esc(f(r))).join(',')),
].join('\n')

stage('Heidän markkinoillaan', eligible.length, 'muut maat pudotettu, tuntemattomat jätetty')

// Per-market counts for every stage. The view draws the pipeline market by market, and without
// these it would have to scale a global total by some share, which is a guess wearing the clothes
// of a measurement. A commenter is attributed to the market of the seed it was found near, which
// is the same attribution the country inference uses.
const perMarket = {}
for (const m of MARKETS) perMarket[m] = { chart: 0, seeds: 0, commenters: 0, real: 0, final: 0 }

for (const [id, d] of discovered) {
  const m = [...d.markets][0]
  if (!m || !perMarket[m]) continue
  if (d.via === 'chart') perMarket[m].chart++
  else perMarket[m].commenters++
}
for (const seed of seeds) {
  const m = seed.markets[0]
  if (m && perMarket[m]) perMarket[m].seeds++
}
for (const r of forStats) {
  const m = [...(discovered.get(r.id)?.markets || [])][0]
  if (m && perMarket[m]) perMarket[m].real++
}
for (const r of eligible) {
  if (r.country && perMarket[r.country]) perMarket[r.country].final++
}
if (WANT.length) {
  stage('Pyydetyssä nichessä', results.length, `${WANT.join(', ')} · ${offNiche} muuta nicheä pudotettu`)
}

writeFileSync(`${OUT}/creators.csv`, csv)
writeFileSync(`${OUT}/creators.json`, JSON.stringify(results, null, 1))

// ---------- the competitor's own roster, which is the same detection read the other way ----------
//
// A creator who names another PC shop in their description is Prenew's single largest rejection
// reason, so they get pushed down the list. Read in the other direction the same rows are a list
// of who the competitors are paying, which nobody sells them and which costs nothing to produce.
// Exclusivity ends, and when it does this is the queue.
const competitorPartners = eligible
  .filter((r) => r.competitor)
  .sort((a, b) => a.competitor.localeCompare(b.competitor) || b.subs - a.subs)

if (competitorPartners.length) {
  const cols = [
    ['kilpailija', (r) => r.competitor],
    ['kanava', (r) => r.title],
    ['url', (r) => r.url],
    ['maa', (r) => r.country || ''],
    ['tilaajat', (r) => r.subs],
    ['katselut_per_video', (r) => r.avgViews ?? ''],
    ['niche_tarkka', (r) => r.nicheLabel],
    ['trendi', (r) => r.trend || ''],
    ['yhteystieto', (r) => r.email || ''],
    ['puhuu_laitteistosta', (r) => (r.rigTalk ? 'kyllä' : '')],
    ['perustelu', (r) => r.reason],
  ]
  writeFileSync(
    `${OUT}/kilpailijoiden-kumppanit.csv`,
    [cols.map(([h]) => h).join(','), ...competitorPartners.map((r) => cols.map(([, f]) => esc(f(r))).join(','))].join('\n'),
  )
}
writeFileSync(`${OUT}/pipeline.json`, JSON.stringify({
  // What was asked for, so a run can be read back and compared to the next one.
  request: { markets: MARKETS, niches: WANT, segment: SEGMENT, minSubs: MIN_SUBS, maxSubs: MAX_SUBS, seedsPerMarket: SEEDS_PER_MARKET, videosPerSeed: VIDEOS_PER_SEED, sample: SAMPLE },
  // The bounds this run used and what each one rests on, so the file explains its own opinions.
  bounds: {
    takenZone: TAKEN_ZONE,
    priceyTiktok: B.priceyTiktok,
    realisedMedian: B.realisedMedian,
    basis: B.basis,
    counts: B.counts,
    reasonCounts: B.reasonCounts,
    sales: B.sales,
  },
  stages, perMarket, units, cacheHits, markets: MARKETS,
  // Every endpoint this pipeline touches costs exactly one quota unit, and search (100 units) is
  // never called. So the number of calls is the cost, and a cold run costs units + cacheHits
  // however much of this particular run came off the disk.
  coldUnits: units + cacheHits,
  dailyFreeUnits: 10_000,
}, null, 1))

// Update the ledger. Only creators that made it into a file are recorded, so a channel that was
// merely fetched and filtered out does not count as "seen" and can still surface later.
for (const r of results) {
  ledger[seenKey(r.id)] = { first: r.firstSeen, last: today }
}
try {
  writeFileSync(SEEN_PATH, JSON.stringify(ledger))
} catch (e) { console.log(`(kirjanpitoa ei voitu päivittää: ${e.message})`) }

const freshSinceLastRun = results.filter((r) => r.isNew)

const inRange = results.filter((r) => r.subs >= MIN_SUBS && r.subs <= MAX_SUBS)
const small = results.filter((r) => r.subs < 50_000)
const fromComments = results.filter((r) => r.via === 'commenter')

// Run journal. One line per run, appended, so list_runs can say what was asked for, what came
// back and which bounds were in force. Without it "what changed since last time" is unanswerable.
const journalEntry = {
  at: new Date().toISOString(),
  request: { markets: MARKETS, niches: WANT, minSubs: MIN_SUBS, maxSubs: MAX_SUBS, seeds: SEEDS_PER_MARKET, videos: VIDEOS_PER_SEED },
  out: OUT,
  results: results.length,
  inRange: inRange.length,
  underFifty: small.length,
  fromCommenters: fromComments.length,
  newSinceLastRun: freshSinceLastRun.length,
  withEmail: results.filter((r) => r.email).length,
  onTikTok: results.filter((r) => r.tiktok).length,
  rising: results.filter((r) => r.trend === 'nouseva').length,
  knownPartnersFound: results.filter((r) => r.known).map((r) => r.title),
  units,
  coldUnits: units + cacheHits,
  bounds: { takenZone: TAKEN_ZONE, realisedMedian: B.realisedMedian, recordedOutcomes: B.counts.recorded },
}
const JOURNAL = new URL('../data/runs.jsonl', import.meta.url)
try {
  const prev = existsSync(JOURNAL) ? readFileSync(JOURNAL, 'utf8') : ''
  writeFileSync(JOURNAL, prev + JSON.stringify(journalEntry) + '\n')
} catch (e) { console.log(`(ajohistoriaa ei voitu kirjoittaa: ${e.message})`) }

console.log(`\n=== TULOS ===`)
console.log(`Tekijöitä listalla:        ${results.length}`)
console.log(`  Prenewin haarukassa:     ${inRange.length}`)
console.log(`  alle 50k tilaajaa:       ${small.length}`)
console.log(`  löytyi kommentoijana:    ${fromComments.length}`)
console.log(`  UUSIA viime ajon jälkeen:${String(freshSinceLastRun.length).padStart(4)} (kirjanpidossa ${Object.keys(ledger).length} tunnusta)`)
console.log(`  puhuu laitteistosta:     ${results.filter((r) => r.rigTalk).length}`)
console.log(`  myös TikTokissa:         ${results.filter((r) => r.tiktok).length}`)
console.log(`  myös Instagramissa:      ${results.filter((r) => r.instagram).length}`)
console.log(`  myös Twitchissä:         ${results.filter((r) => r.twitch).length}`)
console.log(`  vähintään 3 alustalla:   ${results.filter((r) => r.platforms.length >= 3).length}`)
console.log(`  yhteystieto tiedossa:    ${results.filter((r) => r.email).length} (business-osoite ${results.filter((r) => r.emailBusiness).length})`)
console.log(`  katselut nousussa:       ${results.filter((r) => r.trend === 'nouseva').length}`)
console.log(`  katselut laskussa:       ${results.filter((r) => r.trend === 'laskeva').length}`)
console.log(`  KIINNITÄ NYT (alle 12kk):${String(results.filter((r) => r.signNow).length).padStart(4)}`)
console.log(`  vanhempien valinta:      ${results.filter((r) => r.parentsChoice).length}`)
console.log(`  yleisö nuori/aikuinen:   ${results.filter((r) => r.audience === 'nuori').length} / ${results.filter((r) => r.audience === 'aikuinen').length}`)
if (competitorPartners.length) {
  const byComp = {}
  for (const r of competitorPartners) byComp[r.competitor] = (byComp[r.competitor] || 0) + 1
  console.log(`  kilpailijoiden kumppaneita: ${competitorPartners.length} (${Object.entries(byComp).map(([k, v]) => `${k} ${v}`).join(', ')})`)
  console.log(`     → ${OUT}/kilpailijoiden-kumppanit.csv`)
}
console.log(`  merkitty nuori yleisö:   ${results.filter((r) => r.youthHint).length}`)
console.log(`  made for kids kanavia:   ${[...candidates.values()].filter((r) => r.madeForKids).length} koko haussa${EXCLUDE_KIDS ? ', karsittu tiedostosta' : ', mukana (--include-kids)'}`)
console.log(`  sitoutunut yleisö:       ${results.filter((r) => r.commentRate >= engagedCommentRate).length} (kynnys ${engagedCommentRate} %, laskettu tämän ajon ylimmästä neljänneksestä)`)
console.log(`  painopisteessä 10-100k:  ${results.filter((r) => r.subs >= SWEET_MIN && r.subs <= SWEET_MAX).length}`)
console.log(`  jo heidän kumppaneitaan: ${alreadyKnown.length}${alreadyKnown.length ? ` (${alreadyKnown.map((r) => r.title).join(', ')})` : ''}`)
console.log(`  aiemmin hylättyjä:       ${alreadyRejected.length}${alreadyRejected.length ? ` (${alreadyRejected.map((r) => `${r.title}: ${r.rejected.reason}`).join(', ')})` : ''}`)
console.log(`  mainitsee kilpailijan:   ${results.filter((r) => r.competitor).length}`)
console.log(`  laitteistosponsori:      ${results.filter((r) => r.hardwareSponsor && !r.competitor).length} (komponenttibrändi, ei kilpailija)`)
console.log(`  yli 110k (jo varattuja): ${results.filter((r) => r.subs > TAKEN_ZONE).length}`)
const byCountry = {}
for (const r of results) byCountry[r.country || 'tuntematon'] = (byCountry[r.country || 'tuntematon'] || 0) + 1
const spread = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' | ')
console.log(`Maittain: ${spread}`)
const missing = MARKETS.filter((m) => !byCountry[m])
if (missing.length) console.log(`EI YHTÄÄN näistä markkinoista: ${missing.join(', ')}`)

const byNiche = {}
for (const r of results) byNiche[r.nicheLabel] = (byNiche[r.nicheLabel] || 0) + 1
console.log(`Nichet: ${Object.entries(byNiche).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' | ')}`)
if (WANT.length) console.log(`Pyydetty niche: ${WANT.join(', ')} — ${offNiche} muuta tekijää pudotettu tiedostosta`)
console.log(`Kiintiö: ${units} yksikköä käytetty, ${cacheHits} osumaa välimuistista${cacheExpired ? `, ${cacheExpired} vanhentunutta (yli 30 pv, haettu uudelleen)` : ''}`)
console.log(`  koko ajo kylmänä: ${units + cacheHits} / 10 000 yksikköä päivässä (${Math.round(((units + cacheHits) / 10_000) * 100)} %), uusinta ${units}`)
console.log(`\nKirjoitettu: ${OUT}/creators.csv ja ${OUT}/creators.json`)

console.log(`\nKärki 15:`)
for (const r of results.slice(0, 15)) {
  console.log(`  ${String(r.score).padStart(3)}  ${String(r.subs).padStart(7)} ${(r.country || '??').padEnd(3)} ${r.title.slice(0, 26).padEnd(26)} ${r.reason.slice(0, 74)}`)
}
