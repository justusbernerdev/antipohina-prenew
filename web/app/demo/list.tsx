'use client'

import { useState } from 'react'
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

function save(name: string, body: string, type: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([body], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function List({ rows, runDate }: { rows: Creator[]; runDate: string }) {
  const [limit, setLimit] = useState(12)
  const [picker, setPicker] = useState(false)
  const [keys, setKeys] = useState<string[]>(CORE_KEYS)

  const toggleKey = (k: string) =>
    setKeys((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))

  const download = () =>
    save(
      `prenew-tekijat-${rows.length}.csv`,
      // Column order follows the picker's own order, not the click order, so two exports with the
      // same columns are identical files.
      toCsv(rows, ALL_KEYS.filter((k) => keys.includes(k)), runDate),
      'text/csv;charset=utf-8',
    )

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-display text-[26px] font-bold">Lista</h2>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-base text-ink-3">
            Näytetään {Math.min(limit, rows.length)} / {f(rows.length)}
          </span>
          <button
            onClick={() => setPicker(!picker)}
            className="h-10 cursor-pointer rounded-brand-md border border-line bg-white px-4 font-display text-sm font-semibold transition-colors hover:border-forest"
          >
            Sarakkeet ({keys.length})
          </button>
          <button
            onClick={download}
            disabled={!rows.length || !keys.length}
            className="h-10 cursor-pointer rounded-brand-md bg-forest px-4 font-display text-sm font-semibold text-white transition-colors hover:bg-[#1b5a3d] disabled:opacity-40"
          >
            Lataa CSV
          </button>
        </div>
      </div>

      {/* ---------- which columns leave with the file ---------- */}
      {picker && (
        <div className="rounded-brand-lg border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-base text-ink-2">
              Oletuksena kaksitoista saraketta, eli ne joista päätös syntyy. Excel näyttää kerralla
              noin saman verran, joten leveä tiedosto on se jota kukaan ei lue.
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
              const cols = COLUMNS.filter((c) => c.group === g)
              if (!cols.length) return null
              return (
                <div key={g}>
                  <p className="mb-2 text-[13px] tracking-[0.14em] text-ink-3 uppercase">{g}</p>
                  <div className="flex flex-col gap-1.5">
                    {cols.map((c) => (
                      <label key={c.key} className="flex cursor-pointer items-center gap-2 text-[15px] text-ink-2">
                        <input
                          type="checkbox"
                          checked={keys.includes(c.key)}
                          onChange={() => toggleKey(c.key)}
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

      {/* ---------- the rows ---------- */}
      <div className="overflow-x-auto">
        <div className="flex min-w-[880px] flex-col gap-1">
          <div className="grid grid-cols-[110px_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)] gap-4 px-4 pb-2 text-[13px] tracking-[0.08em] text-ink-3">
            <span>TOIMENPIDE</span>
            <span>KANAVA</span>
            <span>TILAAJAT</span>
            <span>YHTEYSTIETO</span>
            <span>VAROITUKSET</span>
          </div>

          {rows.slice(0, limit).map((c) => {
            const act = action(c)
            const warn = warnings(c)
            const lang = languageName(c.lang)
            return (
              <div
                key={c.id}
                className="grid grid-cols-[110px_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)] items-center gap-4 rounded-brand-md bg-surface px-4 py-3 text-base"
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

                <span className="nums flex flex-col">
                  <span>{f(c.subs)}</span>
                  <span className="text-sm text-ink-3">
                    {c.medianViews != null ? `${f(c.medianViews)} katselua` : ''}
                  </span>
                </span>

                <span className="min-w-0 truncate">
                  {c.email ? (
                    <a href={`mailto:${c.email}`} className="text-forest hover:underline">
                      {c.email}
                    </a>
                  ) : (
                    <span className="text-ink-3">ei tiedossa</span>
                  )}
                </span>

                <span className="text-sm text-ink-3">{warn.length ? warn.join(' · ') : 'ei varoituksia'}</span>
              </div>
            )
          })}

          {!rows.length && (
            <div className="px-4 py-6 text-base text-ink-3">Näillä ehdoilla ei tekijöitä. Löysennä rajoja.</div>
          )}
        </div>
      </div>

      {limit < rows.length && (
        <button
          onClick={() => setLimit((l) => l + 40)}
          className="h-11 cursor-pointer rounded-brand-md border border-line bg-white font-display text-sm font-semibold transition-colors hover:border-forest hover:text-forest"
        >
          Näytä lisää — {f(rows.length - limit)} jäljellä
        </button>
      )}
    </section>
  )
}
