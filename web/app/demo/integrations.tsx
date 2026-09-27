'use client'

import { useState } from 'react'
import type { Creator } from '../types'
import { asRequest, type Criteria } from './criteria'
import { countryName } from './countries'

const f = (n: number) => n.toLocaleString('fi-FI')

const PRE = 'overflow-x-auto rounded-brand-lg bg-surface p-4 font-mono text-[13px] leading-[1.6] whitespace-pre sm:p-6 sm:text-[15px]'
const LABEL = 'text-sm tracking-[0.14em] text-ink-3'

const BASE = 'https://prenew.justusberner.com'

export function ApiTab({ cr, rows, quota, nicheKeys }: { cr: Criteria; rows: Creator[]; quota: number; nicheKeys: Record<string, string> }) {
  const body = asRequest(cr, nicheKeys)

  // The first two rows of the real result, not an invented example: the response on screen is the
  // response those criteria produce.
  const top = rows.slice(0, 2).map((c) => ({
    channel: c.title,
    url: c.url,
    country: c.country,
    niche: c.nicheLabel,
    subscribers: c.subs,
    median_views: c.medianViews,
    views_per_subscriber: c.viewRatio,
    trend: c.trend,
    email: c.email,
    platforms: c.platforms,
    score: c.score,
    reason: c.reason,
  }))

  return (
    <section className="flex max-w-[980px] flex-col gap-8 sm:gap-10">
      <h1 className="font-display text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-[34px] sm:leading-[1.25] lg:text-[40px]">
        Sama pyyntö ilman käyttöliittymää.
      </h1>
      <p className="max-w-[720px] text-[17px] leading-[1.5] text-ink-2 sm:text-[19px]">
        Yksi kutsu. Kriteerit ovat ne jotka valitsit Dataflow-näkymässä.{' '}
        <code className="font-mono text-[17px]">Accept: text/csv</code> palauttaa saman listan CSV:nä.
      </p>

      <div className="flex flex-col gap-2.5">
        <span className={LABEL}>PYYNTÖ</span>
        <pre className={PRE}>{`curl -X POST ${BASE}/v1/discover \\
  -H "Authorization: Bearer $PRENEW_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')}'`}</pre>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className={LABEL}>VASTAUS</span>
        <pre className={PRE}>
          {JSON.stringify(
            { count: rows.length, quota_units: quota, daily_free_units: 10000, creators: top },
            null,
            2,
          )}
        </pre>
      </div>
    </section>
  )
}

const TOOLS = [
  { name: 'discover_creators', desc: 'Ajaa haun kriteereillä ja palauttaa pisteytetyt tekijät.' },
  { name: 'record_outcome', desc: 'Kirjaa lopputuloksen: toteutui, hylättiin syystä X, ei vastannut. Myös koodin tuoton.' },
  { name: 'get_scoring_rules', desc: 'Nykyiset rajat ja painot, kukin perusteluineen.' },
  { name: 'list_competitor_partners', desc: 'Keitä kilpailijat maksavat.' },
  { name: 'prepare_outreach_leads', desc: 'Liidit valmiissa muodossa, briiffi mukana.' },
  { name: 'list_runs', desc: 'Aiemmat ajot, kriteerit ja muutos edelliseen.' },
]

export function McpTab({ cr, rows, nicheKeys }: { cr: Criteria; rows: Creator[]; nicheKeys: Record<string, string> }) {
  const [key, setKey] = useState('')
  const [copied, setCopied] = useState(false)

  const cmd = `claude mcp add --transport http prenew \\\n  ${BASE}/mcp \\\n  --header "Authorization: Bearer ${key || '<avain>'}"`

  const prompt = `Etsi ${cr.markets.map(countryName).join(', ') || 'kaikista maista'}${
    cr.niches.length ? ' ' + cr.niches.join(' tai ') : ''
  } -tekijöitä${cr.flags.contact ? ', joilla on yhteystieto' : ''}.`

  return (
    <section className="flex max-w-[980px] flex-col gap-8 sm:gap-10">
      <h1 className="font-display text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-[34px] sm:leading-[1.25] lg:text-[40px]">
        Teidän agenttinne kysyy suoraan. Kuusi työkalua, ei asennusta.
      </h1>

      <div className="flex flex-col gap-4 rounded-brand-lg border-2 border-forest p-5 sm:p-7">
        <span className={LABEL}>KYTKE CLAUDE CODEEN</span>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() =>
              setKey(
                'pk_live_' +
                  Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) =>
                    b.toString(16).padStart(2, '0'),
                  ).join(''),
              )
            }
            className="h-11 cursor-pointer rounded-brand-md bg-forest px-5 font-display text-sm font-semibold text-white transition-colors hover:bg-[#1b5a3d]"
          >
            {key ? 'Luo uusi avain' : 'Luo API-avain'}
          </button>
          <span className="font-mono text-[15px] text-ink-2">{key}</span>
        </div>

        {key && (
          <div className="flex flex-col gap-2.5">
            <span className="text-base text-ink-2">Aja terminaalissa, sitten kysy Claudelta.</span>
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
              <pre className="min-w-0 flex-1 overflow-x-auto rounded-brand-md bg-surface p-5 font-mono text-sm leading-[1.6] whitespace-pre">
                {cmd}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(cmd.replace(/\\\n\s+/g, ' '))
                  setCopied(true)
                }}
                className="h-10 flex-none cursor-pointer rounded-brand-md border border-line bg-white px-4 font-display text-sm font-semibold transition-colors hover:border-forest"
              >
                {copied ? 'Kopioitu' : 'Kopioi'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {TOOLS.map((t) => (
          <div key={t.name} className="grid gap-1 rounded-brand-md bg-surface px-4 py-3 sm:gap-6 sm:px-5 sm:py-4 sm:[grid-template-columns:minmax(0,1fr)_minmax(0,1.6fr)]">
            <span className="font-mono text-base font-semibold text-forest">{t.name}</span>
            <span className="text-[15px] text-ink-2 sm:text-[17px]">{t.desc}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <span className={LABEL}>ESIMERKKI</span>
        <div className="flex flex-col gap-4 rounded-brand-lg bg-surface p-4 sm:p-6">
          <div className="text-[16px] sm:text-[18px]">
            <span className="text-ink-3">Käyttäjä </span>
            {prompt}
          </div>
          <pre className="overflow-x-auto font-mono text-[15px] leading-[1.6] whitespace-pre">
            {`discover_creators(${JSON.stringify(asRequest(cr, nicheKeys))})`}
          </pre>
          <div className="text-[16px] sm:text-[18px]">
            <span className="text-ink-3">Agentti </span>
            Löytyi {f(rows.length)} tekijää. Kärjessä{' '}
            {rows.slice(0, 3).map((r) => r.title).join(', ') || 'ei osumia'}. Haluatko CSV:n?
          </div>
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  { n: '1', title: 'Signaali', desc: 'Markkina, niche ja koko teidän järjestelmästänne.' },
  { n: '2', title: 'Moottori', desc: 'Pisteytetyt rivit, perustelu joka rivillä.' },
  { n: '3', title: 'Ihminen', desc: 'Valitsee listalta. Tätä ei automatisoida.' },
  { n: '4', title: 'Selda', desc: 'Luonnos odottaa hyväksyntää. Ei lähetä itse.' },
]

export function SeldaTab({ rows }: { rows: Creator[] }) {
  const handover = rows.filter((c) => !c.known && !c.rejected && !c.competitor)
  const withEmail = handover.filter((c) => c.email).length

  return (
    <section className="flex max-w-[1100px] flex-col gap-8 sm:gap-12">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-[28px] leading-[1.2] font-semibold tracking-[-0.02em] sm:text-[34px] sm:leading-[1.25] lg:text-[40px]">
          Selda on oma juttunsa.
        </h1>
        <p className="max-w-[720px] text-[17px] leading-[1.5] text-ink-2 sm:text-[19px] text-pretty">
          Löytö toimii ilman tätä. Jos haluatte, valitut rivit siirtyvät Seldaan perusteluineen, ja
          avausviesti kirjoitetaan siitä miksi juuri tämä tekijä on listalla. Luonnos odottaa
          ihmistä, mitään ei lähetetä itsestään.
        </p>
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {STEPS.map((s) => (
          <div key={s.n} className="flex flex-col gap-1.5 rounded-brand-lg bg-surface p-5">
            <span className="font-display text-[15px] font-bold text-forest">{s.n}</span>
            <span className="font-display text-xl font-bold">{s.title}</span>
            <span className="text-base text-ink-2">{s.desc}</span>
          </div>
        ))}
      </div>

      <div className="rounded-brand-lg border border-line p-6">
        <p className="text-[17px] text-ink-2">
          Nykyisillä kriteereillä siirtyisi <strong className="font-semibold text-ink">{f(handover.length)} tekijää</strong>,
          joista {f(withEmail)}:llä on sähköpostiosoite tiedossa. Rajattu pois: nykyiset kumppanit,
          aiemmin hylätyt ja kilpailijaa mainostavat.
        </p>
        <p className="mt-3 text-base text-ink-3">
          Siirto on yksi kutsu, ja ratkaiseva kenttä on <code className="font-mono">analysis</code> —
          moottorin perustelu on se tutkimus josta avausviesti kirjoitetaan.
        </p>
      </div>
    </section>
  )
}
