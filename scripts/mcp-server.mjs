#!/usr/bin/env node
// MCP server over the discovery engine. Two directions, and the second one is the product.
//
//   out:  discover_creators     "give me candidates"
//   in:   record_outcome        "here is what happened"  -> bounds recalculate
//   out:  get_scoring_rules     "what do you believe, and why"
//   out:  list_competitor_partners  "who are the competitors paying"
//   out:  prepare_outreach_leads     "hand these over, briefing included"
//   out:  list_runs                  "what has been asked before, and what changed"
//
// record_outcome is the one nobody else offers. When their CRM marks a rejection, the same fact
// reaches the engine and the scoring bounds are recomputed from their data. The brains end up
// being theirs, not ours: two customers running this code diverge, because their outcomes differ.
//
// JSON-RPC 2.0 over stdio, hand-rolled. No dependencies, because the promise made to them is that
// the whole thing runs on plain Node with no install step.
//
//   claude mcp add prenew -- node --env-file=.env /path/to/scripts/mcp-server.mjs
//
// Nothing here sends a message to anyone. Discovery only.

import { spawn } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { bounds, appendOutcome, readOutcomes } from './bounds.mjs'
import { leadFor, handoverCandidates } from './analysis.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const DISCOVER = resolve(HERE, 'discover.mjs')

const PROTOCOL_VERSION = '2024-11-05'

// ---------- niche vocabulary, read from the engine so the two never drift ----------

function nicheVocabulary() {
  const src = readFileSync(DISCOVER, 'utf8')
  const keys = [...src.matchAll(/\{ key: '([\w]+)',\s*kind: '([^']+)',\s*label: '([^']+)'/g)]
  return keys.map(([, key, kind, label]) => ({ key, kind, label }))
}

// ---------- tools ----------

const NICHES = nicheVocabulary()
const NICHE_KEYS = NICHES.map((n) => n.key)

const TOOLS = [
  {
    name: 'discover_creators',
    description:
      'Find gaming creator candidates on YouTube for given markets and niches, scored against ' +
      'Prenew\'s own realised and rejected collaborations. Every row carries a reason for why it ' +
      'is on the list. Returns candidates only; it never contacts anyone.',
    inputSchema: {
      type: 'object',
      properties: {
        markets: {
          type: 'array', items: { type: 'string' },
          description: 'ISO country codes, e.g. ["DE","FI"]. Defaults to their eleven markets.',
        },
        niches: {
          type: 'array', items: { type: 'string', enum: NICHE_KEYS },
          description: `Restrict to these niches. Available: ${NICHE_KEYS.join(', ')}. Empty means all gaming.`,
        },
        segment: {
          type: 'string', enum: ['any', 'parents', 'adults'],
          description:
            'Who is buying the machine. "parents" favours channels where the buying adult is in the ' +
            'audience, which is what the Parents\' Choice tier and the gaming-pc-for-kids page need. ' +
            '"adults" favours channels whose audience buys for itself. Default "any".',
        },
        minSubs: { type: 'number', description: 'Smallest subscriber count to include. Default 4000.' },
        maxSubs: { type: 'number', description: 'Largest subscriber count to include. Default 250000.' },
        limit: { type: 'number', description: 'How many rows to return, highest score first. Default 25.' },
        seedsPerMarket: { type: 'number', description: 'Expansion seeds per market. More seeds reach deeper into the tail. Default 12.' },
        videosPerSeed: { type: 'number', description: 'Videos per seed to harvest commenters from. Default 4.' },
        budget: { type: 'number', description: 'Hard YouTube quota ceiling for this run, of 10000 free units per day. Default 3000.' },
        fresh: { type: 'boolean', description: 'Ignore the response cache. Costs real quota. Default false.' },
      },
    },
  },
  {
    name: 'record_outcome',
    description:
      'Record what happened with a creator: the collaboration was realised, they were rejected ' +
      'for a reason, or they never answered. This is what makes the engine learn. The scoring ' +
      'bounds are recomputed from the recorded outcomes, and the next discover_creators run uses ' +
      'the new bounds. Returns what moved.\n\n' +
      'Call this continuously, as outcomes happen, and do not skip the failures. A rejection with ' +
      'a reason is worth more to the engine than a success: successes only teach it to find more ' +
      'of the same, failures teach it what to skip, and skipping is where the time goes. The ' +
      '`reason` field is the single most valuable argument here.',
    inputSchema: {
      type: 'object',
      required: ['channel', 'outcome'],
      properties: {
        channel: { type: 'string', description: 'Channel name as it appears in the candidate list.' },
        outcome: {
          type: 'string', enum: ['realised', 'rejected', 'no_reply'],
          description: 'realised = collaboration happened. rejected = they or we said no. no_reply = never answered.',
        },
        reason: {
          type: 'string',
          description:
            'Why, when rejected. Free text, but reusing their CRM categories makes the bounds ' +
            'move: "Competitor / exclusivity", "Price", "Too small", "Content fit", "Silence", ' +
            '"Timing", "Language", "Inactive", "Not a creator".',
        },
        subs: { type: 'number', description: 'YouTube subscribers at the time. Needed for the size bounds to learn.' },
        tiktokFollowers: { type: 'number', description: 'TikTok followers at the time, if known.' },
        market: { type: 'string', description: 'ISO country code.' },
        channelId: { type: 'string', description: 'YouTube channel id, if known. Survives a rename.' },
        niche: { type: 'string', description: 'Niche key, so the engine can learn which niches sell rather than only which sizes.' },
        code: { type: 'string', description: 'The discount code this creator was given.' },
        orders: {
          type: 'number',
          description:
            'Orders attributed to the code. THE most valuable field here: Prenew measures a ' +
            'collaboration at the checkout, so this is the only number that says a machine was sold ' +
            'rather than that a message was answered. The engine learns which size band actually ' +
            'sold and stops aiming at the band that merely replied.',
        },
        revenue: { type: 'number', description: 'Revenue attributed to the code, in euros.' },
        note: { type: 'string', description: 'Anything a human would want to read later.' },
      },
    },
  },
  {
    name: 'get_scoring_rules',
    description:
      'The bounds and weights currently in force, each with the data it rests on. Use this to ' +
      'answer "why is this creator scored this way" without reading the code.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_competitor_partners',
    description:
      'Creators from the last run who name a competing PC or refurb retailer in their own channel ' +
      'description. The engine pushes these down the candidate list, because promoting a competitor ' +
      'is Prenew\'s single largest rejection reason. Read the other way round, the same rows are a ' +
      'list of who the competitors are paying: free competitive intelligence, and a queue for when ' +
      'an exclusivity ends.',
    inputSchema: {
      type: 'object',
      properties: {
        competitor: { type: 'string', description: 'Filter to one competitor name.' },
        from: { type: 'string', description: 'Output directory of a run. Default "out".' },
      },
    },
  },
  {
    name: 'prepare_outreach_leads',
    description:
      'Take creators from a run and return them already shaped as outreach leads, so the handover ' +
      'is one step with no transformation in between. The result\'s `leads` array can be passed ' +
      'straight to an outreach engine that accepts a leads list — Selda\'s selda_add_leads takes ' +
      'exactly this shape.\n\n' +
      'The field that matters is `analysis`: a measured briefing on that specific creator (size, ' +
      'reach, niche, whether they already talk about hardware, whether they are growing, which ' +
      'platforms). An outreach engine composes the opening message from it instead of crawling the ' +
      'channel again, which is why the message can name why this creator and not sound templated.\n\n' +
      'Existing partners, previously rejected creators and anyone promoting a competing PC shop are ' +
      'excluded automatically. This returns data only: it contacts nobody and sends nothing.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Output directory of a run. Default "out". Use "out/de-minecraft" for the targeted run.' },
        limit: { type: 'number', description: 'How many leads, highest score first. Default 25.' },
        requireEmail: { type: 'boolean', description: 'Only creators with an email in their channel description. Default false.' },
        channels: {
          type: 'array', items: { type: 'string' },
          description: 'Specific channel names to hand over, instead of the top by score. Use this after a human has picked from the list.',
        },
        onlyUrgent: { type: 'boolean', description: 'Only creators flagged breakingOut or signNow, i.e. the ones whose window is closing.' },
        onlyParents: { type: 'boolean', description: 'Only creators whose channel is self-declared family friendly.' },
      },
    },
  },
  {
    name: 'list_runs',
    description:
      'Run history: what was asked for, what came back, which bounds were in force, and what ' +
      'changed compared with the previous run.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'How many of the most recent runs. Default 10.' } },
    },
  },
]

// ---------- discover_creators ----------

function runDiscover(args) {
  const out = `out/mcp`
  const argv = [DISCOVER, `--out=${out}`]
  if (args.markets?.length) argv.push(`--markets=${args.markets.join(',')}`)
  if (args.niches?.length) argv.push(`--niche=${args.niches.join(',')}`)
  if (args.segment) argv.push(`--segment=${args.segment}`)
  if (args.minSubs != null) argv.push(`--min-subs=${args.minSubs}`)
  if (args.maxSubs != null) argv.push(`--max-subs=${args.maxSubs}`)
  if (args.seedsPerMarket != null) argv.push(`--seeds=${args.seedsPerMarket}`)
  if (args.videosPerSeed != null) argv.push(`--videos=${args.videosPerSeed}`)
  if (args.budget != null) argv.push(`--budget=${args.budget}`)

  return new Promise((done, fail) => {
    const child = spawn(process.execPath, argv, {
      cwd: ROOT,
      // A fresh run means "ignore the cache", which the engine expresses as a cache directory
      // it has never seen before.
      env: { ...process.env, ...(args.fresh ? { CACHE_DIR: `cache-fresh-${Date.now()}` } : {}) },
    })
    let log = ''
    child.stdout.on('data', (d) => { log += d })
    child.stderr.on('data', (d) => { log += d })
    child.on('error', fail)
    child.on('close', (code) => {
      if (code !== 0) return fail(new Error(`discover.mjs exited ${code}:\n${log.slice(-2000)}`))
      done({ log, out })
    })
  })
}

async function discoverCreators(args) {
  const limit = args.limit ?? 25
  const { log, out } = await runDiscover(args)

  const creatorsPath = resolve(ROOT, out, 'creators.json')
  const pipelinePath = resolve(ROOT, out, 'pipeline.json')
  if (!existsSync(creatorsPath)) throw new Error(`Run produced no output.\n${log.slice(-1500)}`)

  const all = JSON.parse(readFileSync(creatorsPath, 'utf8'))
  const pipeline = existsSync(pipelinePath) ? JSON.parse(readFileSync(pipelinePath, 'utf8')) : {}

  // Only the fields another system would act on. The full record stays in the file.
  const rows = all.slice(0, limit).map((r) => ({
    score: r.score,
    channel: r.title,
    handle: r.handle,
    url: r.url,
    country: r.country,
    countryConfidence: r.countryConfidence,
    language: r.langCode,
    niche: r.niche,
    nicheDetail: r.nicheLabel,
    games: r.games,
    subscribers: r.subs,
    avgViews: r.avgViews,
    medianViews: r.medianViews,
    viewWindow: r.viewWindow,
    viewsPerSubscriber: r.viewRatio,
    trend: r.trend,
    trendPct: r.trendPct,
    // The two "act now rather than consider" signals. breakingOut is measured; monthsToBound is a
    // linear projection off the channel's lifetime pace and is labelled an estimate.
    breakingOut: r.breakingOut || false,
    signNow: r.signNow || false,
    subsPerMonth: r.subsPerMonth ?? null,
    monthsToBoundEstimate: r.monthsToBound ?? null,
    audienceLean: r.audience || null,
    parentsChoice: r.parentsChoice || false,
    uploadsPerMonth: r.uploadsPerMonth,
    daysSinceUpload: r.daysSinceUpload,
    shortsSharePct: r.shortsShare,
    likeRatePct: r.likeRate,
    commentRatePct: r.commentRate,
    platforms: r.platforms,
    tiktok: r.tiktok,
    instagram: r.instagram,
    twitch: r.twitch,
    email: r.email,
    businessEmail: r.emailBusiness,
    talksAboutHardware: r.rigTalk || false,
    youngAudienceHint: r.youthHint || false,
    existingPartner: r.known || false,
    previouslyRejected: r.rejected ? r.rejected.reason : null,
    mentionsCompetitor: r.competitor,
    foundVia: r.via === 'chart' ? 'country chart' : 'commenter',
    reason: r.reason,
  }))

  return {
    request: pipeline.request,
    boundsUsed: pipeline.bounds,
    totals: {
      returned: rows.length,
      found: all.length,
      underFiftyThousand: all.filter((r) => r.subs < 50_000).length,
      fromCommenters: all.filter((r) => r.via === 'commenter').length,
      withEmail: all.filter((r) => r.email).length,
      onTikTok: all.filter((r) => r.tiktok).length,
      rising: all.filter((r) => r.trend === 'nouseva').length,
      breakingOut: all.filter((r) => r.breakingOut).length,
      signNow: all.filter((r) => r.signNow).length,
      parentsChoice: all.filter((r) => r.parentsChoice).length,
      mentionsCompetitor: all.filter((r) => r.competitor).length,
      existingPartnersFound: all.filter((r) => r.known).map((r) => r.title),
    },
    quota: { unitsUsed: pipeline.units, dailyFreeUnits: 10_000, cacheHits: pipeline.cacheHits },
    stages: pipeline.stages,
    creators: rows,
    csv: resolve(ROOT, out, 'creators.csv'),
    note: 'Candidates only. Nothing was contacted. Mark the result of each with record_outcome and the bounds recalculate.',
  }
}

// ---------- record_outcome ----------

function recordOutcome(args) {
  const before = bounds()

  appendOutcome({
    channel: args.channel,
    channelId: args.channelId || null,
    outcome: args.outcome,
    reason: args.reason || null,
    note: args.note || null,
    subs: args.subs ?? null,
    tiktokFollowers: args.tiktokFollowers ?? null,
    market: args.market || null,
    niche: args.niche || null,
    code: args.code || null,
    orders: args.orders ?? null,
    revenue: args.revenue ?? null,
    at: new Date().toISOString(),
  })

  const after = bounds()

  const moved = []
  if (after.takenZone !== before.takenZone) {
    moved.push({
      bound: 'takenZone',
      from: before.takenZone,
      to: after.takenZone,
      meaning: 'Yläraja jonka yli tekijä on yleensä jo varattu. Tämän yli menevät menettävät pisteitä.',
      basis: after.basis.takenZone,
    })
  }
  if (after.priceyTiktok !== before.priceyTiktok) {
    moved.push({
      bound: 'priceyTiktok',
      from: before.priceyTiktok,
      to: after.priceyTiktok,
      meaning: 'TikTok-koko jonka yläpuolella tekijä on hinnoitellut itsensä ulos. Raportoidaan, ei vielä pisteytetä.',
      basis: after.basis.priceyTiktok,
    })
  }
  if (after.realisedMedian !== before.realisedMedian) {
    moved.push({
      bound: 'realisedMedian',
      from: before.realisedMedian,
      to: after.realisedMedian,
      meaning: 'Onnistuneiden yhteistöiden kokomediaani, eli mihin osuma-alue keskittyy.',
      basis: after.basis.realisedMedian,
    })
  }

  // The code result is reported separately, because it is the signal that eventually replaces the
  // proxy ones and it deserves to be visible while it is still accumulating.
  if (after.sales.creatorsWithResult !== before.sales.creatorsWithResult || after.sales.bestBand !== before.sales.bestBand) {
    moved.push({
      bound: 'salesLearning',
      from: before.sales.bestBand ? `paras kokoluokka ${before.sales.bestBand}` : before.sales.confidence,
      to: after.sales.bestBand ? `paras kokoluokka ${after.sales.bestBand}` : after.sales.confidence,
      meaning:
        'Mikä kokoluokka oikeasti myy koneita, mitattuna alennuskoodin tuotosta. Tämä on parempi ' +
        'mittari kuin toisto, koska se mittaa myytyjä koneita eikä vastattuja viestejä.',
      basis: after.sales.basis,
      confidence: after.sales.confidence,
      scoringActive: after.sales.active,
    })
  }

  // A rejection reason crossing the evidence threshold is itself a change worth reporting: it is
  // the moment a one-off becomes a rule.
  for (const l of after.failures.lessons) {
    const was = before.failures.lessons.find((x) => x.reason === l.reason)
    if (l.actsOnScoring && !was?.actsOnScoring) {
      moved.push({
        bound: 'failurePattern',
        from: `${was?.count ?? 0} tapausta, yksittäistapaus`,
        to: `${l.count} tapausta, ${l.confidence}`,
        meaning: `Hylkäyssyy "${l.reason}" ylitti juuri kynnyksen ja alkaa vaikuttaa pisteytykseen.`,
        basis: l.subsRange
          ? `Kokohaarukka ${l.subsRange.min}-${l.subsRange.max}, mediaani ${l.subsRange.median}${l.markets.length ? `, markkinat ${l.markets.join(', ')}` : ''}`
          : `${l.count} tapausta`,
      })
    }
  }

  const listed = after.rejectedMap.has(String(args.channel).toLowerCase().trim())

  return {
    recorded: { channel: args.channel, outcome: args.outcome, reason: args.reason || null },
    totalRecorded: readOutcomes().length,
    boundsChanged: moved,
    effect: moved.length
      ? 'Rajat siirtyivät. Seuraava discover_creators-ajo pisteyttää uusilla rajoilla.'
      : args.outcome === 'realised'
        ? 'Tekijä on nyt tunnettu kumppani eikä esiinny enää uutena liidinä. Rajat eivät liikkuneet tästä yhdestä rivistä.'
        : listed
          ? 'Tekijä karsiutuu jatkossa kärjestä. Rajat eivät liikkuneet tästä yhdestä rivistä, mutta syy on nyt kirjattu ja se painaa kun samasta syystä tulee lisää.'
          : 'Kirjattu.',
    reasonCounts: after.reasonCounts,
  }
}

// ---------- get_scoring_rules ----------

function getScoringRules() {
  const b = bounds()
  return {
    dataBehindTheRules: b.counts,
    bounds: {
      takenZone: { value: b.takenZone, basis: b.basis.takenZone, effect: '-30 pistettä tämän yli' },
      realisedMedian: { value: b.realisedMedian, basis: b.basis.realisedMedian, effect: 'kuvaa osuma-aluetta, ei suoraan pisteytä' },
      priceyTiktok: {
        value: b.priceyTiktok,
        basis: b.basis.priceyTiktok,
        effect: 'ei käytössä pisteytyksessä',
        why: 'TikTokin seuraajamäärää ei saa löydetyille tekijöille ilman maksullista datalähdettä, joten raja on laskettu mutta lepäävä.',
      },
    },
    // Failures, cut several ways. The most valuable data in the system and the part they said they
    // do not really keep: a success teaches the engine to find more of the same, a failure teaches
    // it what to skip, and skipping is where their time goes.
    failureLearning: {
      basis: b.failures.basis,
      total: b.failures.total,
      recordedSinceExport: b.failures.recordedSince,
      recoveredLater: b.failures.recoveredLater,
      byReason: b.failures.byReason,
      bySizeBand: b.failures.bySizeBand,
      byMarket: b.failures.byMarket,
      lessons: b.failures.lessons,
      why:
        'Kirjaa epäonnistumiset record_outcome-kutsulla heti kun ne tapahtuvat, syy mukana. Syy on ' +
        'tärkeämpi kuin itse hylkäys: se kertoo mitä karsia, ja karsinta on se mihin aika menee.',
      threshold: 'Syy alkaa vaikuttaa pisteytykseen kolmesta tapauksesta ylöspäin.',
    },
    // The signal that is meant to outrank all of the above once it has data.
    salesLearning: {
      confidence: b.sales.confidence,
      scoringActive: b.sales.active,
      basis: b.sales.basis,
      creatorsWithResult: b.sales.creatorsWithResult,
      totalOrders: b.sales.totalOrders,
      totalRevenue: b.sales.totalRevenue,
      bestBand: b.sales.bestBand,
      byBand: b.sales.byBand,
      byNiche: b.sales.byNiche,
      why:
        'Prenew mittaa yhteistyön kassalla alennuskoodista. Se on paras olemassa oleva ' +
        'onnistumismittari, parempi kuin toisto, koska se mittaa myytyjä koneita eikä vastattuja ' +
        'viestejä. Syötä se record_outcome-kutsun orders- ja revenue-kentillä.',
      threshold: 'Vaikuttaa pisteytykseen kun vähintään 4 tekijällä on mitattu tuotto, ja täydellä painolla 12:sta ylöspäin.',
    },
    weights: [
      { signal: 'katselut 15-200 % tilaajista', points: 30, basis: 'elossa oleva yleisö; yli 200 % tarkoittaa yleensä lainattua sisältöä' },
      { signal: 'myös TikTokissa', points: 25, basis: 'heidän omassa datassaan toistuvat tekijät ovat tyypillisesti molemmilla alustoilla' },
      { signal: 'puhuu laitteistosta kuvauksessa', points: 20, basis: 'myy koneita jo nyt; löydetty lukemalla heidän omien kumppaniensa kanavat' },
      { signal: 'niche vaatii koneen', points: '0-20', basis: 'painot heidän toteutuneista yhteistöistään, Minecraft 10/69' },
      { signal: 'kokoluokka osuu', points: 15, basis: `${b.realisedMedian?.toLocaleString('fi-FI')} on toteutuneiden mediaani` },
      { signal: 'katselut nousussa', points: 10, basis: 'kasvava on halvempi nyt kuin sitten kun joku muu ehti' },
      { signal: 'löytyi kommentoijana', points: 10, basis: 'ei löydettävissä vaikuttaja-alustoilta, mikä on koko haasteen premissi' },
      { signal: 'vain yhden maan listalla', points: 10, basis: 'paikallinen eikä globaali' },
      { signal: 'julkaisee aktiivisesti', points: 10, basis: 'alle 14 pv edellisestä videosta' },
      { signal: 'vähintään 3 alustaa', points: 5, basis: 'pieni paino, koska heidän datansa mittaa vain YouTubea ja TikTokia' },
      { signal: 'yhteystieto kuvauksessa', points: 5, basis: 'tavoitettavissa ilman välikättä' },
      { signal: 'mainitsee kilpailijan', points: -40, basis: 'suurin yksittäinen hylkäyssyy heidän omassa datassaan' },
      { signal: 'organisaatio, ei tekijä', points: -40, basis: '"Big clan" hylättiin syyllä "not a creator"' },
      { signal: 'te hylkäsitte tämän', points: -50, basis: 'kirjattu hylkäys; -10 jos yhteistyö toteutui myöhemmin' },
      { signal: 'yli ylärajan', points: -30, basis: b.basis.takenZone },
      { signal: 'katselut laskussa', points: -10, basis: 'sama mittaus kuin nousu, käänteisesti' },
      { signal: 'ei heidän markkina', points: -20, basis: 'maa päätelty, ei pyydetty' },
    ],
    niches: NICHES,
    rejectionReasonsSeen: b.reasonCounts,
    howToChangeThese: 'Älä muokkaa koodia. Kirjaa lopputulos record_outcome-työkalulla, niin rajat lasketaan uudelleen datasta.',
  }
}

// ---------- list_competitor_partners ----------

function listCompetitorPartners(args) {
  const dir = args?.from || 'out'
  const path = resolve(ROOT, dir, 'creators.json')
  if (!existsSync(path)) return { partners: [], note: `Ei ajoa hakemistossa ${dir}.` }

  const all = JSON.parse(readFileSync(path, 'utf8'))
  let rows = all.filter((r) => r.competitor)
  if (args?.competitor) {
    const needle = String(args.competitor).toLowerCase()
    rows = rows.filter((r) => String(r.competitor).toLowerCase().includes(needle))
  }

  const byCompetitor = {}
  for (const r of rows) {
    // Their own casing varies in the descriptions, so group case-insensitively.
    const k = String(r.competitor).toLowerCase()
    byCompetitor[k] ||= { competitor: r.competitor, creators: 0, totalSubs: 0 }
    byCompetitor[k].creators++
    byCompetitor[k].totalSubs += r.subs
  }

  return {
    totalPartners: rows.length,
    byCompetitor: Object.values(byCompetitor).sort((a, b) => b.creators - a.creators),
    partners: rows
      .sort((a, b) => b.subs - a.subs)
      .map((r) => ({
        competitor: r.competitor,
        channel: r.title,
        url: r.url,
        country: r.country,
        subscribers: r.subs,
        avgViews: r.avgViews,
        nicheDetail: r.nicheLabel,
        trend: r.trend,
        email: r.email,
        talksAboutHardware: r.rigTalk || false,
      })),
    howToUse:
      'Nämä eivät ole liidejä tänään, koska kilpailija maksaa heille nyt. Ne ovat kaksi asiaa: ' +
      'kuva siitä keitä kilpailijat sponsoroivat, ja jono siltä varalta että eksklusiivisuus päättyy.',
  }
}

// ---------- prepare_outreach_leads ----------

function prepareOutreachLeads(args) {
  const dir = args?.from || 'out'
  const path = resolve(ROOT, dir, 'creators.json')
  if (!existsSync(path)) throw new Error(`Ei ajoa hakemistossa ${dir}. Aja discover_creators ensin.`)

  const all = JSON.parse(readFileSync(path, 'utf8'))
  let rows = handoverCandidates(all, { requireEmail: Boolean(args?.requireEmail) })

  if (args?.channels?.length) {
    // A human already picked these, so the selection wins over the score order. Names are matched
    // loosely because they get copied out of a list by hand.
    const wanted = new Set(args.channels.map((c) => String(c).toLowerCase().trim()))
    rows = rows.filter((r) => wanted.has(String(r.title).toLowerCase().trim()))
  } else {
    if (args?.onlyUrgent) rows = rows.filter((r) => r.breakingOut || r.signNow)
    if (args?.onlyParents) rows = rows.filter((r) => r.parentsChoice)
    rows = rows.slice(0, args?.limit ?? 25)
  }

  const leads = rows.map(leadFor)
  const withEmail = leads.filter((l) => l.email).length

  const missing = args?.channels?.length
    ? args.channels.filter((c) => !rows.some((r) => String(r.title).toLowerCase().trim() === String(c).toLowerCase().trim()))
    : []

  return {
    leads,
    counts: { leads: leads.length, withEmail, withoutEmail: leads.length - withEmail },
    notFound: missing.length ? missing : undefined,
    excludedByDesign: {
      existingPartners: all.filter((r) => r.known).length,
      previouslyRejected: all.filter((r) => r.rejected).length,
      promotingCompetitor: all.filter((r) => r.competitor).length,
    },
    handover:
      'Vie tämä lähetysmoottoriin sellaisenaan, esim. selda_add_leads({ projectId, leads }). ' +
      'Sähköpostiton rivi menee läpi, mutta yhteystieto pitää silloin etsiä siellä.',
    note:
      'Mikään tässä ei lähetä mitään. Lähetysmoottori jättää luonnoksen ihmisen hyväksyttäväksi, ja ' +
      'kun yhteistyö päättyy johonkin, kirjaa tulos record_outcome-kutsulla — erityisesti jos se ei ' +
      'onnistunut, syy mukana.',
  }
}

// ---------- list_runs ----------

function listRuns(args) {
  const path = resolve(ROOT, 'data/runs.jsonl')
  if (!existsSync(path)) return { runs: [], note: 'Ei vielä yhtään ajoa.' }
  const all = readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map((l) => {
    try { return JSON.parse(l) } catch { return null }
  }).filter(Boolean)

  const limit = args?.limit ?? 10
  const recent = all.slice(-limit).reverse()

  // What changed against the run before it, which is the question a history is actually asked.
  const withDelta = recent.map((run, i) => {
    const prev = recent[i + 1]
    return {
      ...run,
      changedSincePrevious: prev
        ? {
            results: run.results - prev.results,
            fromCommenters: run.fromCommenters - prev.fromCommenters,
            takenZone: run.bounds.takenZone - prev.bounds.takenZone,
            recordedOutcomes: run.bounds.recordedOutcomes - prev.bounds.recordedOutcomes,
          }
        : null,
    }
  })

  return { totalRuns: all.length, runs: withDelta }
}

// ---------- JSON-RPC over stdio ----------

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n')

const ok = (id, result) => send({ jsonrpc: '2.0', id, result })
const fail = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } })

const asContent = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 1) }] })

async function callTool(name, args) {
  switch (name) {
    case 'discover_creators': return await discoverCreators(args || {})
    case 'record_outcome': return recordOutcome(args || {})
    case 'get_scoring_rules': return getScoringRules()
    case 'list_competitor_partners': return listCompetitorPartners(args || {})
    case 'prepare_outreach_leads': return prepareOutreachLeads(args || {})
    case 'list_runs': return listRuns(args || {})
    default: throw new Error(`Unknown tool: ${name}`)
  }
}

async function handle(msg) {
  const { id, method, params } = msg

  if (method === 'initialize') {
    return ok(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: 'prenew-discovery', version: '1.0.0' },
    })
  }
  // Notifications carry no id and expect no response.
  if (method === 'notifications/initialized' || id == null) return
  if (method === 'tools/list') return ok(id, { tools: TOOLS })
  if (method === 'ping') return ok(id, {})

  if (method === 'tools/call') {
    try {
      return ok(id, asContent(await callTool(params?.name, params?.arguments)))
    } catch (e) {
      // A tool error belongs in the result, not in the transport: the model should see it and
      // be able to react, rather than the connection looking broken.
      return ok(id, { ...asContent({ error: e.message }), isError: true })
    }
  }

  fail(id, -32601, `Method not found: ${method}`)
}

// A discovery run takes minutes, so the number of calls still in flight decides when it is safe
// to exit. Quitting the moment stdin closes would kill a run that is still fetching.
let inFlight = 0
let stdinClosed = false

const maybeExit = () => {
  if (stdinClosed && inFlight === 0) process.exit(0)
}

let buffer = ''
process.stdin.on('data', (chunk) => {
  buffer += chunk
  const lines = buffer.split('\n')
  buffer = lines.pop() || ''
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let msg
    try { msg = JSON.parse(trimmed) } catch { continue }
    inFlight++
    handle(msg)
      .catch((e) => fail(msg?.id ?? null, -32603, e.message))
      .finally(() => { inFlight--; maybeExit() })
  }
})

process.stdin.on('end', () => { stdinClosed = true; maybeExit() })
