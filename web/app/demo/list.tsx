'use client'

import { useMemo, useState } from 'react'
import type { Creator } from '../types'
import { Platforms } from '../platforms'
import { action, warnings } from './criteria'
import { ALL_KEYS, COLUMNS, CORE_KEYS, GROUPS, toCsv } from './columns'
import { countryName, languageName } from './countries'

const f = (n: number) => n.toLocaleString('fi-FI')

const ACTION_STYLE: Record<string, string> = {
  kontaktoi: 'bg-mint text-ink',
  odota: 'bg-mint-20 text-ink',
  ohita: 'bg-surface-3 text-ink-3',
}

const SORTS: { key: string; label: string; cmp: (a: Creator, b: Creator) => number }[] = [
  { key: 'score', label: 'Pisteet', cmp: (a, b) => b.score - a.score },
  { key: 'subs-desc', label: 'Tilaajat, suurin ensin', cmp: (a, b) => b.subs - a.subs },
  { key: 'subs-asc', label: 'Tilaajat, pienin ensin', cmp: (a, b) => a.subs - b.subs },
  { key: 'views', label: 'Katselut per video', cmp: (a, b) => (b.medianViews ?? 0) - (a.medianViews ?? 0) },
  { key: 'ratio', label: 'Katselut per tilaaja', cmp: (a, b) => (b.viewRatio ?? 0) - (a.viewRatio ?? 0) },
  { key: 'trend', label: 'Trendi', cmp: (a, b) => (b.trendPct ?? -9999) - (a.trendPct ?? -9999) },
  { key: 'growth', label: 'Kasvu per kuukausi', cmp: (a, b) => (b.subsPerMonth ?? 0) - (a.subsPerMonth ?? 0) },
  { key: 'active', label: 'Aktiivisin ensin', cmp: (a, b) => (a.daysSinceUpload ?? 9e9) - (b.daysSinceUpload ?? 9e9) },
  { key: 'engagement', label: 'Sitoutuminen', cmp: (a, b) => (b.commentRate ?? 0) - (a.commentRate ?? 0) },
]

function save(name: string, body: string, type: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([body], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

// Free text over the fields a person would type: the name, the niche, the games, the country, and
// the reason sentence. The reason is included on purpose — it is where "löytyi kommentoijana
// (iCrimax)" lives, so a seed's name finds everyone discovered near them.
const haystack = (c: Creator) =>
  `${c.title} ${c.handle || ''} ${c.nicheLabel} ${c.games.join(' ')} ${countryName(c.country)} ${c.email || ''} ${c.reason}`.toLowerCase()

export function List({ rows, runDate }: { rows: Creator[]; runDate: string }) {
  const [limit, setLimit] = useState(12)
  const [picker, setPicker] = useState(false)
  const [keys, setKeys] = useState<string[]>(CORE_KEYS)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('score')
  const [view, setView] = useState<'kortit' | 'taulukko'>('kortit')
  const [onlyClean, setOnlyClean] = useState(false)

  const shown = useMemo(() => {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const cmp = SORTS.find((s) => s.key === sort)!.cmp
    return rows
      .filter((c) => {
        if (onlyClean && warnings(c).length) return false
        if (!terms.length) return true
        const h = haystack(c)
        return terms.every((t) => h.includes(t))
      })
      .sort(cmp)
  }, [rows, q, sort, onlyClean])

  const cols = useMemo(() => COLUMNS.filter((c) => keys.includes(c.key)), [keys])

  const download = () =>
    save(
      `prenew-tekijat-${shown.length}.csv`,
      // The file contains what is on screen: the same rows, the same columns, the same order.
      toCsv(shown, ALL_KEYS.filter((k) => keys.includes(k)), runDate),
      'text/csv;charset=utf-8',
    )

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-display text-[22px] font-bold sm:text-[26px]">Lista</h2>
        <span className="text-base text-ink-3">
          {f(shown.length)} tekijää{shown.length !== rows.length && ` / ${f(rows.length)}`}
        </span>
      </div>

      {/* ---------- filtering the list itself ---------- */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setLimit(12)
          }}
          placeholder="Hae nimestä, maasta, nichestä tai perustelusta…"
          className="h-10 min-w-[220px] flex-1 rounded-brand-md border border-line bg-white px-3 text-[15px] placeholder:text-ink-3"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 cursor-pointer rounded-brand-md border border-line bg-white px-3 font-display text-sm font-semibold text-ink-2"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setOnlyClean(!onlyClean)}
          className={`h-10 cursor-pointer rounded-brand-md border px-3 font-display text-sm font-semibold transition-colors ${
            onlyClean ? 'border-forest bg-forest text-white' : 'border-line bg-white text-ink-2 hover:border-line-strong'
          }`}
        >
          Ei varoituksia
        </button>

        <div className="flex overflow-hidden rounded-brand-md border border-line">
          {(['kortit', 'taulukko'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`cursor-pointer px-3 py-2 font-display text-sm font-semibold transition-colors ${
                view === v ? 'bg-forest text-white' : 'bg-white text-ink-2 hover:text-ink'
              }`}
            >
              {v === 'kortit' ? 'Kortit' : 'Taulukko'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPicker(!picker)}
          className="h-10 cursor-pointer rounded-brand-md border border-line bg-white px-3 font-display text-sm font-semibold transition-colors hover:border-forest"
        >
          Sarakkeet ({keys.length})
        </button>

        <button
          onClick={download}
          disabled={!shown.length || !keys.length}
          className="h-10 cursor-pointer rounded-brand-md bg-forest px-4 font-display text-sm font-semibold text-white transition-colors hover:bg-[#1b5a3d] disabled:opacity-40"
        >
          Lataa CSV
        </button>
      </div>

      {/* ---------- one picker drives both the table and the file ---------- */}
      {picker && (
        <div className="rounded-brand-lg border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-base text-ink-2">
              Samat sarakkeet näkyvät taulukossa ja lähtevät CSV:hen. Oletuksena kaksitoista, eli ne
              joista päätös syntyy — Excel näyttää kerralla suunnilleen saman verran.
            </p>
            <div className="ml-auto flex gap-3 text-sm">
              <button onClick={() => setKeys(CORE_KEYS)} className="cursor-pointer font-semibold text-forest hover:underline">
                Päätössarakkeet
              </button>
              <button onClick={() => setKeys(ALL_KEYS)} className="cursor-pointer font-semibold text-forest hover:underline">
                Kaikki {ALL_KEYS.length}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            {GROUPS.map((g) => {
              const group = COLUMNS.filter((c) => c.group === g)
              if (!group.length) return null
              return (
                <div key={g}>
                  <p className="mb-2 text-[13px] tracking-[0.14em] text-ink-3 uppercase">{g}</p>
                  <div className="flex flex-col gap-1.5">
                    {group.map((c) => (
                      <label key={c.key} className="flex cursor-pointer items-center gap-2 text-[15px] text-ink-2">
                        <input
                          type="checkbox"
                          checked={keys.includes(c.key)}
                          onChange={() =>
                            setKeys((p) => (p.includes(c.key) ? p.filter((x) => x !== c.key) : [...p, c.key]))
                          }
                          className="h-4 w-4 accent-[var(--color-forest)]"
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ---------- table: exactly the chosen columns ---------- */}
      {view === 'taulukko' ? (
        <div className="overflow-x-auto rounded-brand-md border border-line">
          <table className="w-full border-collapse text-[15px] whitespace-nowrap">
            <thead>
              <tr className="bg-surface">
                {cols.map((c) => (
                  <th key={c.key} className="border-b border-line px-3 py-2 text-left text-[13px] font-semibold tracking-[0.06em] text-ink-3 uppercase">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, limit).map((c) => (
                <tr key={c.id} className="odd:bg-white even:bg-surface/60">
                  {cols.map((col) => {
                    const v = col.get(c)
                    return (
                      <td key={col.key} className="max-w-[420px] truncate border-b border-line px-3 py-2">
                        {col.key === 'kanava' ? (
                          <a href={c.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-forest">
                            {String(v)}
                          </a>
                        ) : col.key === 'maa' ? (
                          countryName(c.country)
                        ) : col.key === 'toimenpide' ? (
                          <span className={`rounded-brand px-2 py-0.5 font-display text-[12px] font-bold ${ACTION_STYLE[String(v)]}`}>
                            {String(v)}
                          </span>
                        ) : (
                          String(v)
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length && <p className="px-4 py-6 text-base text-ink-3">Ei osumia. Löysennä rajoja.</p>}
        </div>
      ) : (
        /* ---------- cards: the readable version ---------- */
        <div className="flex flex-col gap-1">
          {shown.slice(0, limit).map((c) => {
            const act = action(c)
            const warn = warnings(c)
            const lang = languageName(c.lang)
            return (
              <div
                key={c.id}
                className="flex flex-col gap-2 rounded-brand-md bg-surface px-4 py-3 text-base lg:grid lg:grid-cols-[110px_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)] lg:items-center lg:gap-4"
              >
                <span className={`w-fit rounded-brand px-2 py-1 font-display text-[13px] font-bold ${ACTION_STYLE[act]}`}>
                  {act}
                </span>

                <span className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-ink underline decoration-line-strong underline-offset-2 hover:decoration-forest"
                    >
                      {c.title}
                    </a>
                    <Platforms c={c} size={15} />
                  </span>
                  <span className="text-sm text-ink-3">
                    {countryName(c.country)}
                    {lang ? ` · ${lang}` : ''} · {c.nicheLabel}
                  </span>
                </span>

                <span className="nums flex items-baseline gap-2 lg:flex-col lg:items-start lg:gap-0">
                  <span className="w-28 shrink-0 text-sm text-ink-3 lg:hidden">Tilaajat</span>
                  <span>{f(c.subs)}</span>
                  <span className="text-sm text-ink-3">
                    {c.medianViews != null ? `${f(c.medianViews)} katselua` : ''}
                  </span>
                </span>

                <span className="flex min-w-0 items-baseline gap-2 lg:block lg:truncate">
                  <span className="w-28 shrink-0 text-sm text-ink-3 lg:hidden">Yhteystieto</span>
                  {c.email ? (
                    <a href={`mailto:${c.email}`} className="min-w-0 truncate text-forest hover:underline">
                      {c.email}
                    </a>
                  ) : (
                    <span className="text-ink-3">ei tiedossa</span>
                  )}
                </span>

                <span className="flex items-baseline gap-2 text-sm text-ink-3 lg:block">
                  <span className="w-28 shrink-0 lg:hidden">Varoitukset</span>
                  <span>{warn.length ? warn.join(' · ') : 'ei varoituksia'}</span>
                </span>
              </div>
            )
          })}
          {!shown.length && (
            <div className="px-4 py-6 text-base text-ink-3">Ei osumia. Löysennä rajoja tai tyhjennä haku.</div>
          )}
        </div>
      )}

      {limit < shown.length && (
        <button
          onClick={() => setLimit((l) => l + 40)}
          className="h-11 cursor-pointer rounded-brand-md border border-line bg-white font-display text-sm font-semibold transition-colors hover:border-forest hover:text-forest"
        >
          Näytä lisää — {f(shown.length - limit)} jäljellä
        </button>
      )}
    </section>
  )
}
