// Scoring bounds, computed from Prenew's own outcomes rather than written down by us.
//
// Three files feed this, and all three are optional:
//   data/collaborations.json   what worked          (their export)
//   data/not-realised.json     what did not, why    (their export)
//   data/outcomes.json         what happened since  (written by record_outcome)
//
// The point of computing rather than hardcoding is that the numbers keep moving. When they mark a
// creator as rejected for a competitor, the taken-zone bound recalculates from that row too, and
// the engine's opinion changes without anyone editing the engine. Two customers running the same
// code end up with different bounds, because their outcomes are different.

import { readFileSync, existsSync, writeFileSync } from 'node:fs'

const read = (url) => {
  try { return JSON.parse(readFileSync(new URL(url, import.meta.url), 'utf8')) } catch { return [] }
}

// "171k" -> 171000, "2.5k" -> 2500, "1.2M" -> 1200000, 6000 -> 6000
export function count(v) {
  if (v == null || v === '') return null
  if (typeof v === 'number') return v
  const m = /^([\d.,]+)\s*([kKmM])?/.exec(String(v).trim())
  if (!m) return null
  const n = Number(m[1].replace(/,/g, '.'))
  if (!Number.isFinite(n)) return null
  const mult = m[2] ? (/[kK]/.test(m[2]) ? 1e3 : 1e6) : 1
  return Math.round(n * mult)
}

const median = (xs) => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

const norm = (s) => String(s || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim()

const OUTCOMES_PATH = new URL('../data/outcomes.json', import.meta.url)

export function readOutcomes() {
  return existsSync(OUTCOMES_PATH) ? JSON.parse(readFileSync(OUTCOMES_PATH, 'utf8')) : []
}

export function appendOutcome(entry) {
  const all = readOutcomes()
  // One row per creator per outcome: recording the same rejection twice must not move a bound.
  const i = all.findIndex((o) => norm(o.channel) === norm(entry.channel))
  if (i >= 0) all[i] = { ...all[i], ...entry }
  else all.push(entry)
  writeFileSync(OUTCOMES_PATH, JSON.stringify(all, null, 1))
  return all.length
}

export function bounds() {
  const collabs = read('../data/collaborations.json')
  const notRealised = read('../data/not-realised.json')
  const recorded = readOutcomes()

  // ---- what worked ----
  // Per creator, not per collaboration row: repeat partners appear several times and they are the
  // smaller ones, so counting rows would drag the median down and describe the wrong creator.
  const realisedByCreator = new Map()
  for (const c of collabs) {
    const k = norm(c['Creator key'] || c['Creator / channel'])
    const n = count(c['YT subscribers'])
    if (k && n) realisedByCreator.set(k, n)
  }
  const realisedFromRecorded = recorded.filter((o) => o.outcome === 'realised')
  for (const o of realisedFromRecorded) if (o.subs && o.channel) realisedByCreator.set(norm(o.channel), o.subs)
  const realisedSubs = [...realisedByCreator.values()]

  // Repeat collaboration is the only quality signal visible in the export, so it is the one the
  // scoring is anchored to. Ten of fifty-one creators repeated and produced 41 % of all collabs.
  const perCreator = {}
  for (const c of collabs) {
    const k = norm(c['Creator key'] || c['Creator / channel'])
    if (k) perCreator[k] = (perCreator[k] || 0) + 1
  }
  const repeated = Object.values(perCreator).filter((n) => n > 1).length

  // ---- what did not work ----
  // Their export and anything recorded since, in one shape.
  const rejections = [
    ...notRealised.map((r) => ({
      channel: r.Creator,
      reason: r['Reason category'],
      note: r['Reason (CRM notes)'],
      later: r['Later outcome'],
      market: r.Market || null,
      subs: count(r['YT subscribers']),
      tiktok: count(r['TikTok followers']),
      source: 'their export',
    })),
    ...recorded
      .filter((o) => o.outcome === 'rejected' || o.outcome === 'no_reply')
      .map((o) => ({
        channel: o.channel,
        reason: o.reason || (o.outcome === 'no_reply' ? 'Silence' : 'Rejected'),
        note: o.note || null,
        later: null,
        market: o.market || null,
        subs: o.subs ?? null,
        tiktok: o.tiktokFollowers ?? null,
        source: 'kirjattu',
      })),
  ].filter((r) => r.channel)

  const reasonCounts = {}
  for (const r of rejections) reasonCounts[r.reason || 'tuntematon'] = (reasonCounts[r.reason || 'tuntematon'] || 0) + 1

  // ---- the taken zone ----
  // Above this size a creator is usually already signed or priced as exclusive. The bound is the
  // smallest creator that was actually lost for that reason: everyone at or above it was lost too.
  const takenGroup = rejections.filter((r) => /competitor|exclusiv/i.test(r.reason || '') && r.subs)
  const takenSubs = takenGroup.map((r) => r.subs).sort((a, b) => a - b)
  const takenZone = takenSubs.length ? takenSubs[0] : 110_000

  // The rule is defensible — everyone at or above this size was lost for this reason — but it rests
  // on a single smallest observation, so one outlier can collapse it. Measured while testing: a
  // single recorded rejection at 13 600 moved the bound from 110 000 to 13 600 and took a fifth of
  // the list with it.
  //
  // The number is not smoothed, because smoothing their data without saying so is worse than a
  // fragile number. Instead the engine reports when one row is doing all the work.
  const takenGap = takenSubs.length > 1 ? takenSubs[1] / takenSubs[0] : 1
  const takenFragile = takenSubs.length > 1 && takenGap >= 3
  const takenNote = takenFragile
    ? `Raja lepää yhden havainnon varassa: seuraavaksi pienin on ${takenSubs[1].toLocaleString('fi-FI')}, ` +
      `eli ${Math.round(takenGap)} kertaa suurempi. Yksi lisähavainto tältä väliltä vakauttaisi sen.`
    : null

  // ---- the price bound ----
  // A big TikTok next to a modest YouTube priced them out. Computable from their data, but dormant
  // in scoring because TikTok follower counts are not available for discovered creators without a
  // paid data source. Reported so the gap is visible rather than silent.
  // "Price" only. "Silence after price" is a different failure: they saw the proposal and stopped
  // answering, which says nothing about their TikTok size.
  const priceGroup = rejections.filter((r) => /^(price|too expensive)$/i.test(r.reason || '') && r.tiktok)
  const priceyTiktok = priceGroup.length ? Math.min(...priceGroup.map((r) => r.tiktok)) : 80_000

  // ---- what actually sold machines ----
  //
  // Prenew measures a collaboration at the checkout: the creator gets a page and a discount code,
  // and the code is what counts. That is a far better success signal than "the collaboration
  // happened", and until now it was not connected to anything. record_outcome takes orders and
  // revenue, and this is where they turn into an opinion.
  //
  // Everything here is empty until they record the first code result, and the engine says so
  // rather than pretending. Once there is data, the size band that sold replaces the size band
  // that merely replied as the thing scoring aims at.
  // Two different populations, and collapsing them hides the most useful number in the file.
  // `measured` is every collaboration whose code result was recorded at all, zero included.
  // `sold` is the subset that produced something. The gap between them is the failure rate of a
  // collaboration that actually happened, which is not visible anywhere else: of the 22 codes
  // Prenew reported, 11 produced no orders at all.
  const measured = recorded.filter((o) => o.orders != null || o.revenue != null)
  const sold = measured.filter((o) => (o.orders ?? 0) > 0 || (o.revenue ?? 0) > 0)
  const duds = measured.length - sold.length

  const BANDS = [
    { key: '0-10k', min: 0, max: 10_000 },
    { key: '10-50k', min: 10_000, max: 50_000 },
    { key: '50-110k', min: 50_000, max: 110_000 },
    { key: '110k+', min: 110_000, max: Infinity },
  ]

  const byBand = BANDS.map((b) => {
    const inBand = sold.filter((o) => o.subs != null && o.subs >= b.min && o.subs < b.max)
    const orders = inBand.reduce((a, o) => a + (o.orders || 0), 0)
    const revenue = inBand.reduce((a, o) => a + (o.revenue || 0), 0)
    return {
      band: b.key,
      creators: inBand.length,
      orders,
      revenue,
      ordersPerCreator: inBand.length ? Number((orders / inBand.length).toFixed(1)) : null,
    }
  })

  const byNiche = {}
  for (const o of sold) {
    const k = o.niche || 'tuntematon'
    byNiche[k] ||= { creators: 0, orders: 0, revenue: 0 }
    byNiche[k].creators++
    byNiche[k].orders += o.orders || 0
    byNiche[k].revenue += o.revenue || 0
  }

  // The band that sells best, by orders per creator rather than total orders: total orders just
  // rediscovers whoever they happened to work with most.
  const ranked = byBand.filter((b) => b.creators > 0 && b.ordersPerCreator != null)
    .sort((a, b) => (b.ordersPerCreator ?? 0) - (a.ordersPerCreator ?? 0))
  const bestBand = ranked[0] || null

  const sellerSubs = sold.map((o) => o.subs).filter((n) => typeof n === 'number')
  const sellerMedian = median(sellerSubs)

  const sales = {
    collaborationsMeasured: measured.length,
    producedNothing: duds,
    dudRate: measured.length ? Math.round((duds / measured.length) * 100) : null,
    creatorsWithResult: sold.length,
    totalOrders: sold.reduce((a, o) => a + (o.orders || 0), 0),
    totalRevenue: sold.reduce((a, o) => a + (o.revenue || 0), 0),
    byBand,
    byNiche,
    bestBand: bestBand ? bestBand.band : null,
    sellerMedian,
    // How much of the scoring this is allowed to influence. One recorded sale must not overturn
    // the bounds; the weight grows with the number of creators that have a measured result.
    confidence: sold.length >= 12 ? 'riittää pisteytykseen'
      : sold.length >= 4 ? 'suuntaa antava'
      : sold.length > 0 ? 'liian vähän dataa'
      : 'ei dataa',
    active: sold.length >= 4,
    basis: measured.length
      ? `${measured.length} yhteistyötä joilla koodin tuotto on mitattu, yhteensä ${measured.reduce((a, o) => a + (o.orders || 0), 0)} tilausta. ` +
        `${duds} niistä tuotti nolla tilausta (${Math.round((duds / measured.length) * 100)} %).` +
        (bestBand ? ` Paras kokoluokka ${bestBand.band}, ${bestBand.ordersPerCreator} tilausta per tekijä.` : ' Kokoluokkakohtaista jakoa ei voi laskea, koska tekijöiden tilaajaluvut puuttuvat.')
      : 'Ei yhtään kirjattua koodin tuottoa. Tämä on se mittari joka korvaisi toiston, koska se mittaa myytyjä koneita eikä vastattuja viestejä.',
  }

  // ---- what failed, broken down ----
  //
  // This is the most valuable data in the whole system and it is the part they said they do not
  // really keep. A success only teaches the engine to look for more of the same; a failure teaches
  // it what to skip, and skipping is where their time actually goes.
  //
  // So the failures are cut several ways rather than collapsed into one bound. With 26 rows most
  // cells are too thin to score on, which is why every lesson carries its own count and a lesson
  // only becomes a scoring rule once there is enough behind it. The engine says how sure it is
  // instead of pretending.
  const LESSON_THRESHOLD = 3

  const cut = (keyOf) => {
    const out = {}
    for (const r of rejections) {
      const k = keyOf(r)
      if (!k) continue
      out[k] ||= { total: 0, reasons: {} }
      out[k].total++
      const reason = r.reason || 'tuntematon'
      out[k].reasons[reason] = (out[k].reasons[reason] || 0) + 1
    }
    return out
  }

  const bandOf = (subs) =>
    subs == null ? null
      : subs < 10_000 ? '0-10k'
      : subs < 50_000 ? '10-50k'
      : subs < 110_000 ? '50-110k'
      : '110k+'

  const failures = {
    total: rejections.length,
    recordedSince: rejections.filter((r) => r.source === 'kirjattu').length,
    byReason: reasonCounts,
    bySizeBand: cut((r) => bandOf(r.subs)),
    byMarket: cut((r) => r.market || null),
    // Rejections where the creator came back later: evidence that a "no" is sometimes a "not yet",
    // which is why a recorded rejection costs 10 points rather than 50 when that happened.
    recoveredLater: rejections.filter((r) => r.later === 'Did collab later').length,
  }

  // Statements the engine is willing to make, each with the rows behind it. Ordered by weight of
  // evidence, because that is the order in which they should be believed.
  failures.lessons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, n]) => {
      const rows = rejections.filter((r) => (r.reason || 'tuntematon') === reason)
      const withSubs = rows.map((r) => r.subs).filter((x) => typeof x === 'number')
      return {
        reason,
        count: n,
        share: Math.round((n / Math.max(1, rejections.length)) * 100),
        subsRange: withSubs.length ? { min: Math.min(...withSubs), max: Math.max(...withSubs), median: median(withSubs) } : null,
        markets: [...new Set(rows.map((r) => r.market).filter(Boolean))],
        // Whether this pattern is allowed to influence scoring yet.
        actsOnScoring: n >= LESSON_THRESHOLD,
        confidence: n >= 8 ? 'vahva' : n >= LESSON_THRESHOLD ? 'riittävä' : 'yksittäistapaus',
      }
    })

  failures.basis =
    `${rejections.length} hylkäystä, joista ${failures.recordedSince} kirjattu ajon jälkeen. ` +
    `Suurin syy: ${failures.lessons[0]?.reason || '–'} (${failures.lessons[0]?.count || 0}). ` +
    `Kynnys jolla syy alkaa vaikuttaa pisteytykseen on ${LESSON_THRESHOLD} tapausta.`

  const rejectedMap = new Map()
  for (const r of rejections) {
    if (norm(r.channel)) rejectedMap.set(norm(r.channel), { reason: r.reason, note: r.note, later: r.later })
  }

  const knownSet = new Set()
  for (const c of collabs) {
    for (const f of ['Creator key', 'Creator / channel']) if (c[f]) knownSet.add(norm(c[f]))
  }
  for (const o of realisedFromRecorded) if (o.channel) knownSet.add(norm(o.channel))

  return {
    takenZone,
    takenZoneFragile: takenFragile,
    takenZoneNote: takenNote,
    takenZoneObservations: takenSubs,
    priceyTiktok,
    realisedMedian: median(realisedSubs),
    sales,
    failures,
    rejectedMap,
    knownSet,
    reasonCounts,
    counts: {
      collaborations: collabs.length,
      creators: Object.keys(perCreator).length,
      repeated,
      rejections: rejections.length,
      recorded: recorded.length,
    },
    // Why each bound is where it is, in the words the UI and the MCP tool both show.
    basis: {
      takenZone:
        (takenGroup.length
          ? `${takenGroup.length} hylkäystä syystä kilpailija tai eksklusiivisuus, pienin niistä ${takenZone.toLocaleString('fi-FI')} tilaajaa`
          : 'ei hylkäysdataa, oletus 110 000') + (takenNote ? ` — ${takenNote}` : ''),
      priceyTiktok: priceGroup.length
        ? `${priceGroup.length} hylkäystä hintasyystä, pienin TikTok-seuraajamäärä ${priceyTiktok.toLocaleString('fi-FI')}`
        : 'ei hintadataa, oletus 80 000',
      realisedMedian: realisedSubs.length
        ? `${realisedSubs.length} tekijää joilla on tilaajaluku ja toteutunut yhteistyö, mediaani ${median(realisedSubs).toLocaleString('fi-FI')}`
        : 'ei toteutumadataa',
      sales: sales.basis,
      failures: failures.basis,
    },
    rejections,
  }
}
