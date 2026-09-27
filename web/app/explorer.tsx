'use client'

import { useMemo, useState } from 'react'
import type { Bounds, Creator } from './types'
import { apply, EMPTY, PRESETS, SORTS, type FilterState, type SortKey } from './filters'
import { analysisFor, leadFor } from './lead'
import { Platforms } from './platforms'

const fmt = (n: number) => n.toLocaleString('fi-FI')

type Outcome = 'realised' | 'rejected' | 'no_reply'

const OUTCOME_LABEL: Record<Outcome, string> = {
  realised: 'Toteutui',
  rejected: 'Hylättiin',
  no_reply: 'Ei vastannut',
}

// The rejection categories from their own CRM. Reusing their words is what lets a recorded
// outcome move a bound instead of only being filed.
const REASONS = [
  'Competitor / exclusivity',
  'Price',
  'Too small',
  'Content fit',
  'Inconsistent views',
  'Timing',
  'Language',
  'Inactive',
  'Not a creator',
]

type Recorded = { channel: string; outcome: Outcome; reason: string | null; subs: number }

// The same arithmetic as scripts/bounds.mjs: the taken-zone bound is the smallest creator that
// was actually lost to a competitor, because everyone at or above that size was lost too.
function takenZoneFrom(bounds: Bounds, recorded: Recorded[]) {
  const subs = [
    ...bounds.rejections
      .filter((r) => r.reason && /competitor|exclusiv/i.test(r.reason) && r.subs)
      .map((r) => r.subs as number),
    ...recorded
      .filter((r) => r.outcome === 'rejected' && r.reason && /competitor|exclusiv/i.test(r.reason) && r.subs)
      .map((r) => r.subs),
  ]
  return subs.length ? Math.min(...subs) : 110_000
}

// The columns a human gets when they export a selection. Akseli said a CSV is all they need, so
// the selection has to leave as one, not only as the JSON an outreach engine wants.
const CSV_COLS: [string, (c: Creator) => string | number][] = [
  ['pisteet', (c) => c.score],
  ['kanava', (c) => c.title],
  ['url', (c) => c.url],
  ['maa', (c) => c.country || ''],
  ['maan_varmuus', (c) => c.countryConfidence],
  ['kieli', (c) => c.lang || ''],
  ['niche', (c) => c.nicheLabel],
  ['pelit', (c) => c.games.join(' | ')],
  ['tilaajat', (c) => c.subs],
  ['katselut_per_video', (c) => c.avgViews ?? ''],
  ['katselut_per_tilaaja', (c) => c.viewRatio ?? ''],
  ['trendi', (c) => c.trend || ''],
  ['trendi_pros', (c) => c.trendPct ?? ''],
  ['tilaajaa_per_kk', (c) => c.subsPerMonth ?? ''],
  ['videoita_per_kk', (c) => c.uploadsPerMonth ?? ''],
  ['pv_edellisesta', (c) => c.daysSinceUpload ?? ''],
  ['lyhytvideo_osuus', (c) => (c.shortsShare != null ? `${c.shortsShare} %` : '')],
  ['kommentti_pros', (c) => c.commentRate ?? ''],
  ['alustat', (c) => c.platforms.join(' | ')],
  ['yhteystieto', (c) => c.email || ''],
  ['yhteystieto_business', (c) => c.emailBusiness || ''],
  ['puhuu_laitteistosta', (c) => (c.rigTalk ? 'kyllä' : '')],
  ['vanhempien_valinta', (c) => (c.parentsChoice ? 'kyllä' : '')],
  ['nousukiito', (c) => (c.breakingOut ? 'kyllä' : '')],
  ['kiinnita_nyt', (c) => (c.signNow ? 'kyllä' : '')],
  ['loytyi', (c) => (c.via === 'chart' ? 'maalista' : 'kommentoija')],
  ['perustelu', (c) => c.reason],
  ['lopputulos', () => ''],
  ['hylkayssyy', () => ''],
  ['tilauksia', () => ''],
]

const esc = (v: string | number) => {
  const s = String(v ?? '')
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function download(name: string, body: string, type: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([body], { type }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export function Explorer({
  creators,
  bounds,
  targeted,
}: {
  creators: Creator[]
  bounds: Bounds
  targeted?: { label: string; creators: Creator[] } | null
}) {
  const [run, setRun] = useState<'broad' | 'targeted'>('broad')
  const [f, setF] = useState<FilterState>(EMPTY)
  const [sort, setSort] = useState<SortKey>('score')
  const [more, setMore] = useState(false)
  const [limit, setLimit] = useState(40)
  const [recorded, setRecorded] = useState<Recorded[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [why, setWhy] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [campaign, setCampaign] = useState(false)

  const source = run === 'targeted' && targeted ? targeted.creators : creators

  const set = (patch: Partial<FilterState>) => setF((prev) => ({ ...prev, ...patch }))

  const countries = useMemo(
    () => [...new Set(source.map((c) => c.country).filter(Boolean))].sort() as string[],
    [source],
  )
  const langs = useMemo(
    () => [...new Set(source.map((c) => c.lang).filter(Boolean))].sort() as string[],
    [source],
  )
  const niches = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of source) counts.set(c.nicheLabel, (counts.get(c.nicheLabel) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [source])

  const filtered = useMemo(() => apply(source, f, sort), [source, f, sort])

  const activeCount = useMemo(() => {
    let n = 0
    for (const [k, v] of Object.entries(f)) {
      const base = EMPTY[k as keyof FilterState]
      if (v !== base) n++
    }
    return n
  }, [f])

  const currentZone = takenZoneFrom(bounds, recorded)
  const zoneMoved = currentZone !== bounds.takenZone

  const selectedCreators = useMemo(() => source.filter((c) => selected.has(c.id)), [source, selected])
  const withEmail = selectedCreators.filter((c) => c.email).length

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function record(c: Creator, outcome: Outcome, reason: string | null) {
    setRecorded((prev) => [
      ...prev.filter((r) => r.channel !== c.title),
      { channel: c.title, outcome, reason, subs: c.subs },
    ])
    setOpen(null)
  }

  const recordedFor = (title: string) => recorded.find((r) => r.channel === title) || null

  const payload = { leads: selectedCreators.map(leadFor) }

  return (
    <section>
      {/* ---------- which run ---------- */}
      {targeted && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-ink-3">Ajo:</span>
          <Seg
            value={run}
            onChange={(v) => {
              setRun(v)
              setSelected(new Set())
              setLimit(40)
            }}
            options={[
              ['broad', `Laaja (${fmt(creators.length)})`],
              ['targeted', `${targeted.label} (${fmt(targeted.creators.length)})`],
            ]}
          />
        </div>
      )}

      {/* ---------- presets: the questions people actually ask ---------- */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            title={p.hint}
            onClick={() => {
              setF({ ...EMPTY, ...p.patch })
              if (p.sort) setSort(p.sort)
              setLimit(40)
            }}
            className="cursor-pointer rounded-brand-md border border-line-strong bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-ink-2 transition-colors hover:border-forest hover:bg-forest-10 hover:text-forest"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ---------- search, sort, filters ---------- */}
      <div className="sticky top-[49px] z-10 -mx-5 mb-5 border-y border-line bg-surface/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <input
            value={f.q}
            onChange={(e) => {
              set({ q: e.target.value })
              setLimit(40)
            }}
            placeholder="Hae nimestä, nichestä, pelistä tai perustelusta…"
            className="h-9 min-w-[240px] flex-1 rounded-brand-md border border-line-strong bg-surface-2 px-3 text-xs text-ink placeholder:text-ink-3"
          />

          <Select value={sort} onChange={(v) => setSort(v as SortKey)} label="Järjestys">
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>

          <button
            onClick={() => setMore(!more)}
            className="cursor-pointer rounded-brand-md border border-line-strong bg-surface-2 px-2.5 py-1.5 font-semibold text-ink-2 transition-colors hover:text-ink"
          >
            Suodattimet {activeCount > 0 && <span className="text-forest">({activeCount})</span>}
          </button>

          {activeCount > 0 && (
            <button
              onClick={() => {
                setF(EMPTY)
                setLimit(40)
              }}
              className="cursor-pointer text-ink-3 underline hover:text-ink"
            >
              Tyhjennä
            </button>
          )}

          <span className="nums ml-auto font-semibold text-ink-2">{fmt(filtered.length)} tekijää</span>
        </div>

        {more && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs">
            <Seg
              value={f.route}
              onChange={(v) => set({ route: v })}
              options={[
                ['all', 'Kaikki'],
                ['commenter', 'Kommentoija'],
                ['chart', 'Maalista'],
              ]}
            />

            <Select value={f.country} onChange={(v) => set({ country: v })} label="Maa">
              <option value="all">Maa: kaikki</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Select value={f.lang} onChange={(v) => set({ lang: v })} label="Kieli">
              <option value="all">Kieli: kaikki</option>
              {langs.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>

            <Select value={f.niche} onChange={(v) => set({ niche: v })} label="Niche">
              <option value="all">Niche: kaikki</option>
              {niches.map(([n, count]) => (
                <option key={n} value={n}>
                  {n} ({count})
                </option>
              ))}
            </Select>

            <Select value={f.size} onChange={(v) => set({ size: v as FilterState['size'] })} label="Koko">
              <option value="all">Koko: kaikki</option>
              <option value="under5">alle 5k</option>
              <option value="under10">alle 10k</option>
              <option value="under50">alle 50k</option>
              <option value="range">4k–250k</option>
              <option value="over110">yli 110k</option>
            </Select>

            <Select value={f.views} onChange={(v) => set({ views: v as FilterState['views'] })} label="Katselut">
              <option value="all">Katselut: kaikki</option>
              <option value="v5">yli 5 000</option>
              <option value="v20">20 000 – 100 000</option>
              <option value="v100">yli 100 000</option>
            </Select>

            <Select value={f.ratio} onChange={(v) => set({ ratio: v as FilterState['ratio'] })} label="Katselut per tilaaja">
              <option value="all">Katselut/tilaaja: kaikki</option>
              <option value="healthy">terve 15–200 %</option>
              <option value="low">alle 15 %, kuollut</option>
              <option value="suspect">yli 200 %, epäilyttävä</option>
            </Select>

            <Select
              value={f.activity}
              onChange={(v) => set({ activity: v as FilterState['activity'] })}
              label="Aktiivisuus"
            >
              <option value="all">Aktiivisuus: kaikki</option>
              <option value="d14">alle 14 pv edellisestä</option>
              <option value="d30">alle 30 pv</option>
              <option value="stale">yli 90 pv, hiljentynyt</option>
            </Select>

            <Select value={f.format} onChange={(v) => set({ format: v as FilterState['format'] })} label="Muoto">
              <option value="all">Muoto: kaikki</option>
              <option value="shorts">pääosin lyhytvideoita</option>
              <option value="long">pääosin pitkiä</option>
            </Select>

            <label className="flex items-center gap-1.5 text-ink-2">
              <span>Min. pisteet</span>
              <input
                type="range"
                min={0}
                max={140}
                step={5}
                value={f.minScore}
                onChange={(e) => set({ minScore: Number(e.target.value) })}
                className="w-24 accent-[var(--color-forest)]"
              />
              <span className="nums w-7 font-semibold">{f.minScore}</span>
            </label>

            <Toggle on={f.contact} onClick={() => set({ contact: !f.contact })}>
              Yhteystieto
            </Toggle>
            <Toggle on={f.businessContact} onClick={() => set({ businessContact: !f.businessContact })}>
              Business-osoite
            </Toggle>
            <Toggle on={f.certainCountry} onClick={() => set({ certainCountry: !f.certainCountry })}>
              Maa varma
            </Toggle>
            <Toggle on={f.multiPlatform} onClick={() => set({ multiPlatform: !f.multiPlatform })}>
              3+ alustaa
            </Toggle>
            <Toggle on={f.rising} onClick={() => set({ rising: !f.rising })}>
              Nousussa
            </Toggle>
            <Toggle on={f.urgent} onClick={() => set({ urgent: !f.urgent })}>
              Kiire
            </Toggle>
            <Toggle on={f.rigTalk} onClick={() => set({ rigTalk: !f.rigTalk })}>
              Puhuu laitteistosta
            </Toggle>
            <Toggle on={f.parents} onClick={() => set({ parents: !f.parents })}>
              Vanhempien valinta
            </Toggle>
            <Toggle on={f.hideSeen} onClick={() => set({ hideSeen: !f.hideSeen })}>
              Piilota jo tunnetut
            </Toggle>
          </div>
        )}
      </div>

      {/* ---------- the bound, and what it currently rests on ---------- */}
      <div
        className={`mb-5 rounded-brand-lg border p-4 transition-colors ${
          zoneMoved ? 'border-forest bg-forest-10' : 'border-line bg-surface-2'
        }`}
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-sm font-bold">Yläraja</span>
          <span className="nums font-display text-xl font-extrabold">
            {fmt(currentZone)}
            {zoneMoved && (
              <span className="ml-2 text-sm font-semibold text-ink-3 line-through">{fmt(bounds.takenZone)}</span>
            )}
          </span>
          <span className="text-xs text-ink-2">tilaajaa</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
          {zoneMoved ? (
            <>
              <strong className="font-semibold text-forest">Raja siirtyi juuri kirjaamastasi rivistä.</strong> Sama
              laskenta kuin moottorissa: pienin tekijä joka menetettiin kilpailijalle. Kaikki tätä isommat
              menetettiin myös, joten ne putoavat kärjestä seuraavassa ajossa.
            </>
          ) : (
            bounds.basis.takenZone
          )}
        </p>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
        <button
          onClick={() =>
            setSelected((prev) => {
              const next = new Set(prev)
              for (const c of filtered.slice(0, limit)) next.add(c.id)
              return next
            })
          }
          className="cursor-pointer font-semibold text-blue underline"
        >
          Valitse näkyvät ({Math.min(limit, filtered.length)})
        </button>
        {selected.size > 0 && (
          <button
            onClick={() => {
              setSelected(new Set())
              setCampaign(false)
            }}
            className="cursor-pointer text-ink-3 underline hover:text-ink"
          >
            Tyhjennä valinta
          </button>
        )}
        <button
          onClick={() =>
            download(
              `prenew-${filtered.length}-tekijaa.csv`,
              [CSV_COLS.map(([h]) => h).join(','), ...filtered.map((c) => CSV_COLS.map(([, g]) => esc(g(c))).join(','))].join('\n'),
              'text/csv;charset=utf-8',
            )
          }
          className="ml-auto cursor-pointer font-semibold text-forest underline"
        >
          Lataa nämä {fmt(filtered.length)} CSV:nä
        </button>
      </div>

      {/* ---------- the list ---------- */}
      <ul className="space-y-2">
        {filtered.slice(0, limit).map((c) => {
          const mark = recordedFor(c.title)
          const isSel = selected.has(c.id)
          return (
            <li
              key={c.id}
              className={`rounded-brand-lg border bg-surface-2 p-4 transition-colors ${
                isSel ? 'border-blue bg-blue-10/40' : mark ? 'border-forest-60' : 'border-line hover:border-line-strong'
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggle(c.id)}
                  aria-label={`Valitse ${c.title}`}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--color-blue)]"
                />
                <span
                  className="nums shrink-0 rounded-brand px-1.5 py-0.5 font-display text-sm font-extrabold"
                  style={{
                    background: c.via === 'commenter' ? 'var(--color-forest-10)' : 'var(--color-blue-10)',
                    color: c.via === 'commenter' ? 'var(--color-forest)' : 'var(--color-blue)',
                  }}
                >
                  {c.score}
                </span>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-display text-base font-bold tracking-tight underline decoration-line-strong decoration-1 underline-offset-2 hover:decoration-forest"
                >
                  {c.title}
                </a>
                <span className="text-xs text-ink-3">
                  {c.country || '??'}
                  {c.countryConfidence === 'epävarma' && '?'}
                  {c.lang ? ` · ${c.lang}` : ''}
                </span>
                <span className="rounded-brand bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-ink-2">
                  {c.nicheLabel}
                </span>
                <Platforms c={c} />
                <span className="ml-auto text-[11px] text-ink-3">
                  {c.via === 'commenter' ? 'kommentoijareitistä' : 'maakohtaiselta listalta'}
                </span>
              </div>

              <dl className="nums mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                <Metric k="tilaajat" v={fmt(c.subs)} why="Prenewin painopiste on 10 000 – 100 000 tilaajaa." />
                <Metric
                  k={`katselut / video (${c.viewWindow || '?'})`}
                  v={c.avgViews != null ? fmt(c.avgViews) : '–'}
                  why="Keskiarvo 30 päivän ikkunassa aktiivisille, 90 vähemmän aktiivisille. Akselin oma määritelmä."
                />
                <Metric
                  k="katselut / tilaaja"
                  v={c.viewRatio != null ? `${Math.round(c.viewRatio * 100)} %` : '–'}
                  why="Onko yleisö elossa. Alle 15 % on kuollut lista, yli 200 % tarkoittaa yleensä lainattua sisältöä."
                />
                {c.trend && (
                  <Metric
                    k="trendi"
                    v={`${c.trend} ${c.trendPct != null ? `${c.trendPct > 0 ? '+' : ''}${c.trendPct} %` : ''}`}
                    tone={c.trend === 'nouseva' ? 'good' : c.trend === 'laskeva' ? 'bad' : undefined}
                  />
                )}
                {c.subsPerMonth != null && (
                  <Metric
                    k="tilaajaa / kk"
                    v={fmt(c.subsPerMonth)}
                    why="Keskimääräinen kasvu kanavan koko elinkaarella. Mitattu koosta ja iästä, ei ennuste."
                  />
                )}
                {c.commentRate != null && (
                  <Metric
                    k="kommentteja"
                    v={`${c.commentRate} %`}
                    why="Osuus katsojista jotka kommentoivat. Akseli pyysi painottamaan sitoutumista, ja kommentti maksaa katsojalle enemmän kuin tykkäys."
                  />
                )}
                <Metric
                  k="videoita / kk"
                  v={c.uploadsPerMonth != null ? String(c.uploadsPerMonth) : '–'}
                  why="Julkaisutahti 20 viimeisen videon otoksesta."
                />
                <Metric
                  k="edellisestä"
                  v={c.daysSinceUpload != null ? `${c.daysSinceUpload} pv` : '–'}
                  why="Päiviä viimeisimmästä videosta. Yli 90 päivää tarkoittaa hiljentynyttä kanavaa."
                />
                {c.shortsShare != null && (
                  <Metric
                    k="lyhytvideoita"
                    v={`${c.shortsShare} %`}
                    why="Osuus alle 3 minuutin videoita. Shorts-kanava on eri tuote kuin pitkän videon kanava."
                  />
                )}
              </dl>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {c.breakingOut && <Tag tone="forest">nousukiito</Tag>}
                {c.signNow && <Tag tone="amber">kiinnitä nyt · arvio {c.monthsToBound} kk</Tag>}
                {c.parentsChoice && <Tag tone="forest">vanhempien valinta</Tag>}
                {c.email && <Tag tone="blue">{c.emailBusiness ? 'business-sähköposti' : 'sähköposti'}</Tag>}
                {c.platforms
                  .filter((p) => p !== 'youtube')
                  .map((p) => (
                    <Tag key={p}>{p}</Tag>
                  ))}
                {c.rigTalk && <Tag tone="forest">puhuu laitteistosta</Tag>}
                {c.youthHint && <Tag tone="amber">nuori yleisö</Tag>}
                {c.known && <Tag tone="forest">jo teidän kumppaninne</Tag>}
                {c.rejected && <Tag tone="critical">hylkäsitte: {c.rejected.reason}</Tag>}
                {c.competitor && <Tag tone="critical">kilpailija: {c.competitor}</Tag>}
                {c.hardwareSponsor && !c.competitor && <Tag tone="blue">laitteistodiili: {c.hardwareSponsor}</Tag>}
              </div>

              {/* Why this row is here. The sentence is the summary; the breakdown underneath it
                  accounts for every point, so the score is checkable rather than something to
                  take on trust. */}
              <div className="mt-2.5 border-t border-line pt-2.5">
                <p className="text-xs leading-relaxed text-ink-2">{c.reason}</p>
                <button
                  onClick={() => setWhy(why === c.id ? null : c.id)}
                  className="mt-1.5 cursor-pointer text-[11px] font-semibold text-forest hover:underline"
                >
                  {why === c.id ? 'Piilota erittely' : `Miksi ${c.score} pistettä?`}
                </button>

                {why === c.id && (
                  <ul className="nums mt-2 space-y-1 rounded-brand-md bg-surface-3 p-3">
                    {c.parts.map((p, i) => (
                      <li key={i} className="flex items-start gap-3 text-[11px]">
                        <span
                          className={`w-8 shrink-0 text-right font-display font-extrabold ${
                            p.points > 0 ? 'text-forest' : p.points < 0 ? 'text-critical' : 'text-ink-3'
                          }`}
                        >
                          {p.points > 0 ? `+${p.points}` : p.points || '·'}
                        </span>
                        <span className="leading-snug text-ink-2">{p.text}</span>
                      </li>
                    ))}
                    <li className="flex items-start gap-3 border-t border-line-strong pt-1.5 text-[11px]">
                      <span className="w-8 shrink-0 text-right font-display font-extrabold">{c.score}</span>
                      <span className="leading-snug font-semibold text-ink">yhteensä</span>
                    </li>
                  </ul>
                )}
              </div>

              {/* The only input in the whole interface. */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {mark ? (
                  <>
                    <span className="rounded-brand bg-forest px-2 py-1 text-[11px] font-semibold text-white">
                      {OUTCOME_LABEL[mark.outcome]}
                      {mark.reason ? `: ${mark.reason}` : ''}
                    </span>
                    <button
                      onClick={() => setRecorded((p) => p.filter((r) => r.channel !== c.title))}
                      className="cursor-pointer text-[11px] text-ink-3 underline hover:text-ink"
                    >
                      peru
                    </button>
                  </>
                ) : open === c.id ? (
                  <>
                    <span className="text-[11px] font-semibold text-ink-2">Hylkäyssyy:</span>
                    {REASONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => record(c, 'rejected', r)}
                        className="cursor-pointer rounded-brand border border-line-strong px-2 py-1 text-[11px] text-ink-2 transition-colors hover:border-critical hover:text-critical"
                      >
                        {r}
                      </button>
                    ))}
                    <button onClick={() => setOpen(null)} className="cursor-pointer text-[11px] text-ink-3 underline hover:text-ink">
                      peruuta
                    </button>
                  </>
                ) : (
                  <>
                    <span className="mr-1 text-[11px] text-ink-3">Kirjaa lopputulos:</span>
                    <OutcomeButton onClick={() => record(c, 'realised', null)}>Toteutui</OutcomeButton>
                    <OutcomeButton onClick={() => setOpen(c.id)}>Hylättiin</OutcomeButton>
                    <OutcomeButton onClick={() => record(c, 'no_reply', 'Silence')}>Ei vastannut</OutcomeButton>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {limit < filtered.length && (
        <button
          onClick={() => setLimit((l) => l + 60)}
          className="mt-5 w-full cursor-pointer rounded-brand-lg border border-line-strong bg-surface-2 py-3 font-display text-sm font-bold transition-colors hover:border-forest hover:text-forest"
        >
          Näytä lisää — {fmt(filtered.length - limit)} jäljellä
        </button>
      )}
      {filtered.length === 0 && (
        <p className="rounded-brand-lg border border-line bg-surface-2 p-6 text-center text-sm text-ink-2">
          Ei osumia näillä rajauksilla.
        </p>
      )}

      {/* ---------- selection bar and the handover ---------- */}
      {selected.size > 0 && (
        <div className="sticky bottom-0 z-10 -mx-5 mt-5 border-t border-line-strong bg-surface-2 px-5 py-3 sm:-mx-8 sm:px-8">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="nums font-display text-sm font-bold">
              {selected.size} valittu
              <span className="ml-2 font-body text-xs font-normal text-ink-3">
                {withEmail} sähköpostilla, {selected.size - withEmail} ilman
              </span>
            </span>
            <button
              onClick={() => setCampaign(!campaign)}
              className="ml-auto cursor-pointer rounded-brand-md bg-mint px-3 py-1.5 font-semibold text-ink transition-colors hover:bg-mint-80"
            >
              {campaign ? 'Sulje' : 'Luo kampanja'}
            </button>
            <button
              onClick={() =>
                download(
                  `prenew-valitut-${selectedCreators.length}.csv`,
                  [
                    CSV_COLS.map(([h]) => h).join(','),
                    ...selectedCreators.map((c) => CSV_COLS.map(([, g]) => esc(g(c))).join(',')),
                  ].join('\n'),
                  'text/csv;charset=utf-8',
                )
              }
              className="cursor-pointer rounded-brand-md border border-line-strong px-3 py-1.5 font-semibold text-ink-2 transition-colors hover:border-forest hover:text-forest"
            >
              CSV
            </button>
            <button
              onClick={() =>
                download(
                  `prenew-kampanja-${selectedCreators.length}.json`,
                  JSON.stringify(payload, null, 1),
                  'application/json',
                )
              }
              className="cursor-pointer rounded-brand-md border border-line-strong px-3 py-1.5 font-semibold text-ink-2 transition-colors hover:border-blue hover:text-blue"
            >
              JSON
            </button>
          </div>

          {campaign && (
            <div className="mt-3 max-h-[46vh] overflow-y-auto rounded-brand-lg border border-line bg-surface p-4">
              <p className="font-display text-sm font-bold">Kampanja {selected.size} tekijästä</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">
                Tästä eteenpäin yhteydenotto on erillinen vaihe eikä osa tätä haastetta. Lista menee yhdellä
                kutsulla lähetysmoottoriin, ja ratkaiseva kenttä on{' '}
                <code className="rounded-brand bg-surface-3 px-1 py-0.5 font-mono text-[11px]">analysis</code> —
                moottorin perustelu <em>on</em> se tutkimus josta avausviesti kirjoitetaan. Mikään ei lähde
                itse: luonnos jää odottamaan ihmisen hyväksyntää.
              </p>

              <pre className="mt-3 overflow-x-auto rounded-brand bg-surface-3 p-3 font-mono text-[10px] leading-relaxed text-ink-2">
{`selda_add_leads({ projectId: "<prenew>", leads: [ ${selected.size} riviä ] })`}
              </pre>

              <p className="mt-3 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">
                Esimerkki yhden rivin briiffistä
              </p>
              <p className="mt-1 rounded-brand border border-line bg-surface-2 p-3 text-xs leading-relaxed text-ink-2">
                {selectedCreators[0] ? analysisFor(selectedCreators[0]) : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/* ---------- small pieces ---------- */

function Metric({ k, v, tone, why }: { k: string; v: string; tone?: 'good' | 'bad'; why?: string }) {
  return (
    <div title={why}>
      <dt className={`text-[10px] tracking-wide text-ink-3 uppercase ${why ? 'cursor-help decoration-dotted underline-offset-2 hover:underline' : ''}`}>
        {k}
      </dt>
      <dd className={`font-semibold ${tone === 'good' ? 'text-forest' : tone === 'bad' ? 'text-critical' : 'text-ink'}`}>
        {v}
      </dd>
    </div>
  )
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: 'forest' | 'blue' | 'amber' | 'critical' }) {
  const styles = {
    forest: 'bg-forest-10 text-forest',
    blue: 'bg-blue-10 text-blue',
    amber: 'bg-amber-10 text-amber',
    critical: 'bg-critical-10 text-critical',
  }
  return (
    <span className={`rounded-brand px-1.5 py-0.5 text-[11px] font-semibold ${tone ? styles[tone] : 'bg-surface-3 text-ink-2'}`}>
      {children}
    </span>
  )
}

function OutcomeButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer rounded-brand border border-line-strong px-2 py-1 text-[11px] font-semibold text-ink-2 transition-colors hover:border-forest hover:bg-forest-10 hover:text-forest"
    >
      {children}
    </button>
  )
}

function Seg<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: [T, string][]
}) {
  return (
    <div className="flex overflow-hidden rounded-brand-md border border-line-strong">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`cursor-pointer px-2.5 py-1.5 font-semibold transition-colors ${
            value === v ? 'bg-forest text-white' : 'bg-surface-2 text-ink-2 hover:text-ink'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Select({
  value,
  onChange,
  label,
  children,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="contents">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-brand-md border border-line-strong bg-surface-2 px-2 py-1.5 font-semibold text-ink-2 transition-colors hover:text-ink"
      >
        {children}
      </select>
    </label>
  )
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`cursor-pointer rounded-brand-md border px-2.5 py-1.5 font-semibold transition-colors ${
        on ? 'border-forest bg-forest text-white' : 'border-line-strong bg-surface-2 text-ink-2 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
