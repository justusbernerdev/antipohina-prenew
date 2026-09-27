'use client'

import { useState } from 'react'
import type { Data } from '../types'
import { conditionCount, FLAGS, SIZES, type Criteria } from './criteria'

const f = (n: number) => n.toLocaleString('fi-FI')

const CHIP = 'h-10 rounded-brand-md px-3 font-display text-sm font-semibold transition-colors cursor-pointer border'
const on = 'bg-forest text-white border-forest'
const off = 'bg-white text-ink-3 border-line hover:border-line-strong hover:text-ink-2'

export function Flow({
  d,
  cr,
  set,
  count,
}: {
  d: Data
  cr: Criteria
  set: (patch: Partial<Criteria>) => void
  count: number
}) {
  // Which stage the explanation below the diagram is describing.
  const [focus, setFocus] = useState(1)

  const markets = Object.keys(d.perMarket ?? {})
  const niches = Object.entries(d.nicheCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const sel = cr.markets.length ? cr.markets.filter((m) => markets.includes(m)) : markets
  const pm = d.perMarket ?? {}
  const sum = (k: 'chart' | 'seeds' | 'commenters' | 'real' | 'final') =>
    sel.reduce((a, m) => a + (pm[m]?.[k] ?? 0), 0)

  const toggle = (key: 'markets' | 'niches', v: string) =>
    set({ [key]: cr[key].includes(v) ? cr[key].filter((x) => x !== v) : [...cr[key], v] })

  // Four rows at most, or eleven markets make the diagram unreadable. The remainder is summed
  // into one row rather than hidden, so nothing disappears from the totals.
  const rows = sel.map((m) => ({ label: m, ...pm[m] }))
  const shown =
    rows.length > 4
      ? rows.slice(0, 3).concat([
          {
            label: `+${rows.length - 3} maata`,
            chart: rows.slice(3).reduce((a, r) => a + r.chart, 0),
            seeds: rows.slice(3).reduce((a, r) => a + r.seeds, 0),
            commenters: rows.slice(3).reduce((a, r) => a + r.commenters, 0),
            real: rows.slice(3).reduce((a, r) => a + r.real, 0),
            final: rows.slice(3).reduce((a, r) => a + r.final, 0),
          },
        ])
      : rows

  const quota = Math.round(((d.quotaUnits ?? 0) * sel.length) / Math.max(1, markets.length))

  const DETAIL: Record<number, { n: string; title: string; desc: string; items: string[] }> = {
    1: {
      n: '00',
      title: 'Kriteerit',
      desc: 'Pyyntö selaimesta, API:sta tai MCP:stä määrää mitä kone etsii. Jokainen ehto muuttuu säännöksi jossakin vaiheessa.',
      items: [
        `Maat: ${sel.join(', ') || 'kaikki'}`,
        ...(cr.niches.length ? [`Niche: ${cr.niches.join(', ')}`] : []),
        ...(cr.size !== 'all' ? [`Tilaajia ${SIZES.find((s) => s.key === cr.size)!.label}`] : []),
        ...FLAGS.filter((x) => cr.flags[x.key]).map((x) => x.label),
        'Vähintään 5 videota ja 500 tilaajaa',
      ],
    },
    2: {
      n: '01',
      title: 'Pelilista',
      desc: 'Yksi kutsu per markkina. Kansallinen pelilista antaa keskikokoiset paikalliset tekijät, joista laajennus alkaa.',
      items: [
        `${sel.length} maata, ${sel.length} kutsua`,
        `${f(sum('chart'))} kanavaa listoilta`,
        `${f(sum('seeds'))} niistä kelpasi siemeneksi`,
        'Hakua ei käytetä: se on kiintiössä sata kertaa kalliimpaa kuin erähaku',
      ],
    },
    3: {
      n: '02',
      title: 'Kommentoijat',
      desc: 'Siemenien videoiden kommentoijat. Täältä löytyy se häntä jota vaikuttaja-alustat eivät näe.',
      items: [
        `${f(sum('commenters'))} kommentoijaa`,
        'Sata kanavatunnusta per kiintiöyksikkö',
        'Videot joilla kommentit ovat pois päältä ohitetaan',
      ],
    },
    4: {
      n: '03',
      title: 'Oikeat tekijät',
      desc: 'Kommentoijista jäävät ne jotka oikeasti tekevät sisältöä.',
      items: [
        `${f(sum('real'))} tekijää, −${f(sum('commenters') - sum('real'))} karsiutui`,
        'Vähintään 5 videota ja 500 tilaajaa',
        'Sivukanavat ja fanitilit karsittu',
      ],
    },
    5: {
      n: '04',
      title: 'Markkinalla',
      desc: 'Tekijä pidetään vain jos hän kuuluu valittuihin maihin. Maa päätellään kolmesta signaalista.',
      items: [
        `${f(sum('final'))} tekijää valituissa maissa`,
        'Muut maat pudotettu',
        `${f(d.stats.unknownCountry)} tekijän maa jäi tuntemattomaksi koko ajossa`,
      ],
    },
    6: {
      n: '05',
      title: 'Pisteytys',
      desc: 'Rajoja ei ole kirjoitettu koodiin. Ne lasketaan Prenewin omasta aineistosta joka ajolla.',
      items: [
        d.bounds ? d.bounds.basis.takenZone : '',
        d.bounds ? d.bounds.basis.realisedMedian : '',
        `Toisto on laatumittari: ${d.bounds?.counts.collaborations} yhteistyötä, ${d.bounds?.counts.creators} tekijää, ${d.bounds?.counts.repeated} toistui`,
        `${f(count)} tekijää täyttää valitut ehdot`,
      ].filter(Boolean),
    },
    7: {
      n: '06',
      title: 'Lista',
      desc: 'Jokainen rivi selittää itsensä. Päätös syntyy ensimmäisellä ruudulla ilman vierittämistä.',
      items: [
        'Toimenpide yhdellä sanalla: kontaktoi, odota tai ohita',
        'Sarakkeet valitaan itse ennen latausta',
        'Perustelu kertoo mistä pisteet tulivat',
      ],
    },
  }

  const detail = DETAIL[focus]
  const node = (i: number) =>
    `cursor-pointer rounded-brand-md border p-2 text-center transition-colors ${
      focus === i ? 'border-forest bg-forest-10' : 'border-line bg-white hover:border-line-strong'
    }`

  return (
    <section className="flex flex-col gap-10 sm:gap-14">
      <div className="flex flex-col gap-4 sm:gap-5">
        <h1 className="max-w-[880px] font-display text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-[34px] sm:leading-[1.25] lg:text-[40px] text-pretty">
          Kerro mitä etsit. Kone käy läpi valittujen maiden pelilistat ja niiden kommentoijat, ja
          palauttaa tekijät perusteluineen.
        </h1>
        <p className="max-w-[760px] text-[17px] leading-[1.5] text-ink-2 sm:text-[19px] text-pretty">
          Ei asennusta eikä uutta työkalua. Sama moottori toimii tästä selaimesta, omasta
          järjestelmästänne API:n kautta ja agentista MCP:n kautta. Valitse kriteerit ja lataa lista.
          Käyttöön voi ottaa tänään.
        </p>
      </div>

      {/* ---------- criteria ---------- */}
      <div className="flex flex-col gap-4">
        <Row label="MAAT">
          {markets.map((m) => (
            <button key={m} onClick={() => toggle('markets', m)} className={`${CHIP} min-w-[52px] ${cr.markets.includes(m) ? on : off}`}>
              {m}
            </button>
          ))}
        </Row>

        <Row label="NICHE">
          {niches.map(([n, c]) => (
            <button key={n} onClick={() => toggle('niches', n)} className={`${CHIP} ${cr.niches.includes(n) ? on : off}`}>
              {n} <span className="font-normal opacity-60">{c}</span>
            </button>
          ))}
        </Row>

        <Row label="KOKO">
          {SIZES.map((s) => (
            <button key={s.key} onClick={() => set({ size: s.key })} className={`${CHIP} ${cr.size === s.key ? on : off}`}>
              {s.label}
            </button>
          ))}
        </Row>

        <Row label="RAJAT">
          {FLAGS.map((x) => (
            <button
              key={x.key}
              onClick={() => set({ flags: { ...cr.flags, [x.key]: !cr.flags[x.key] } })}
              className={`${CHIP} ${cr.flags[x.key] ? on : off}`}
            >
              {x.label}
            </button>
          ))}
        </Row>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 sm:pl-[100px]">
          <span className="text-[17px] text-ink-2">
            {sel.length} maata · {f(quota)} kiintiöyksikköä · 0 €
          </span>
          <span className="nums font-display text-[17px] font-bold text-forest">{f(count)} tekijää</span>
        </div>
      </div>

      {/* ---------- the pipeline, in real per-market numbers ---------- */}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-ink-3 lg:hidden">Vieritä sivusuunnassa nähdäksesi koko putken →</span>
      <div className="-mx-4 overflow-x-auto px-4 py-2 pb-6 sm:mx-0 sm:px-0">
        <div className="flex min-w-[1160px] items-center">
          <div className="flex flex-col items-center gap-5">
            <span className="text-[15px] text-ink-3">Sisään</span>
            <div className="w-[120px] rounded-brand-md border border-line p-2.5 text-center">
              <div className="font-display text-lg font-bold text-forest">API</div>
              <div className="text-sm text-ink-2">JSON, CSV</div>
            </div>
            <div className="w-[120px] rounded-brand-md border border-line p-2.5 text-center">
              <div className="font-display text-lg font-bold text-forest">MCP</div>
              <div className="text-sm text-ink-2">agentti</div>
            </div>
          </div>

          <Dots />

          <div className="flex flex-col items-center gap-2">
            <span className="text-[15px] text-ink-3">00</span>
            <div onClick={() => setFocus(1)} className={`${node(1)} w-[150px] border-2 border-forest px-2.5 py-3.5`}>
              <div className="text-[15px] text-ink-2">Kriteerit</div>
              <div className="font-display text-[26px] font-bold text-forest">{conditionCount(cr)} ehtoa</div>
            </div>
          </div>

          <Dots />

          <div className="flex flex-col gap-7">
            <div className="flex gap-7">
              {['01 Pelilista', '02 Kommentoijat', '03 Oikeat tekijät', '04 Markkinalla'].map((h) => (
                <span key={h} className="w-[140px] text-center text-[15px] text-ink-3">
                  {h}
                </span>
              ))}
            </div>
            {shown.map((r) => (
              <div key={r.label} className="flex items-center">
                <Cell i={2} focus={focus} go={setFocus} label={`${r.label} · kanavia`} value={f(r.chart)} />
                <Dots />
                <Cell i={3} focus={focus} go={setFocus} label={r.label} value={f(r.commenters)} />
                <Dots />
                <Cell i={4} focus={focus} go={setFocus} label={r.label} value={f(r.real)} drop={r.commenters - r.real} />
                <Dots />
                <Cell i={5} focus={focus} go={setFocus} label={r.label} value={f(r.final)} drop={r.real - r.final} />
              </div>
            ))}
          </div>

          <Dots />

          <div className="flex flex-col items-center gap-2">
            <span className="text-[15px] text-ink-3">05</span>
            <div onClick={() => setFocus(6)} className={`${node(6)} relative w-[140px] px-2.5 py-3.5`}>
              <div className="text-[15px] text-ink-2">Pisteytys</div>
              <div className="font-display text-[26px] font-bold">{f(count)}</div>
              <div className="absolute inset-x-0 top-full pt-1 text-[13px] text-ink-3">
                −{f(Math.max(0, sum('final') - count))}
              </div>
            </div>
          </div>

          <Dots />

          <div className="flex flex-col items-center gap-2">
            <span className="text-[15px] text-ink-3">06</span>
            <div onClick={() => setFocus(7)} className={`${node(7)} w-[150px] border-2 border-forest px-2.5 py-3.5`}>
              <div className="text-[15px] text-ink-2">Lista</div>
              <div className="font-display text-[26px] font-bold text-forest">{f(count)}</div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ---------- what the focused stage does ---------- */}
      <div className="-mt-2 grid gap-6 sm:-mt-4 sm:gap-12 sm:[grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
        <div className="flex flex-col gap-2">
          <span className="text-sm tracking-[0.14em] text-ink-3">{detail.n}</span>
          <h2 className="font-display text-[26px] font-bold">{detail.title}</h2>
          <p className="max-w-[480px] text-[16px] leading-[1.5] text-ink-2 text-pretty sm:text-[18px]">{detail.desc}</p>
        </div>
        <div className="flex flex-col gap-3 sm:pt-7">
          {detail.items.map((k) => (
            <div key={k} className="flex gap-3.5 text-[17px] leading-[1.4] sm:text-[19px]">
              <span className="font-semibold text-forest">✓</span>
              <span>{k}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="w-full shrink-0 text-[13px] tracking-[0.14em] text-ink-3 sm:w-[84px]">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function Dots() {
  return <div className="w-7 flex-none border-t-2 border-dotted border-forest" />
}

function Cell({
  i,
  focus,
  go,
  label,
  value,
  drop,
}: {
  i: number
  focus: number
  go: (n: number) => void
  label: string
  value: string
  drop?: number
}) {
  return (
    <div
      onClick={() => go(i)}
      className={`relative w-[140px] cursor-pointer rounded-brand-md border p-2 text-center transition-colors ${
        focus === i ? 'border-forest bg-forest-10' : 'border-line bg-white hover:border-line-strong'
      }`}
    >
      <div className="truncate text-[13px] text-ink-2">{label}</div>
      <div className="font-display text-[22px] font-bold">{value}</div>
      {drop != null && drop > 0 && (
        <div className="absolute inset-x-0 top-full pt-1 text-[13px] text-ink-3">
          −{drop.toLocaleString('fi-FI')}
        </div>
      )}
    </div>
  )
}
