'use client'

import { useMemo, useState } from 'react'
import type { Creator } from './types'

const fmt = (n: number) => n.toLocaleString('fi-FI')

type Route = 'all' | 'commenter' | 'chart'
type Size = 'all' | 'small' | 'range' | 'taken'

export function Explorer({ creators }: { creators: Creator[] }) {
  const [route, setRoute] = useState<Route>('all')
  const [size, setSize] = useState<Size>('all')
  const [market, setMarket] = useState('all')
  const [onlyContact, setOnlyContact] = useState(false)

  const markets = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of creators) {
      if (!c.country) continue
      counts.set(c.country, (counts.get(c.country) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [creators])

  const shown = useMemo(
    () =>
      creators.filter((c) => {
        if (route !== 'all' && c.via !== route) return false
        if (market !== 'all' && c.country !== market) return false
        if (onlyContact && !c.email) return false
        if (size === 'small' && c.subs >= 50_000) return false
        if (size === 'range' && (c.subs < 4000 || c.subs > 110_000)) return false
        if (size === 'taken' && c.subs <= 110_000) return false
        return true
      }),
    [creators, route, size, market, onlyContact],
  )

  return (
    <section className="rise" style={{ animationDelay: '420ms' }}>
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
        <h2 className="font-display text-xl font-bold tracking-tight">Löydöt</h2>
        <p className="text-xs text-ink-3">
          {fmt(shown.length)} / {fmt(creators.length)} tekijää
        </p>
      </header>

      {/* filters, one row above the list */}
      <div className="mb-5 flex flex-wrap gap-x-6 gap-y-3 text-xs">
        <Group label="reitti">
          <Chip on={route === 'all'} onClick={() => setRoute('all')}>
            kaikki
          </Chip>
          <Chip on={route === 'commenter'} onClick={() => setRoute('commenter')} dot="var(--color-route-comment)">
            kommentoija
          </Chip>
          <Chip on={route === 'chart'} onClick={() => setRoute('chart')} dot="var(--color-route-chart)">
            maalista
          </Chip>
        </Group>

        <Group label="koko">
          <Chip on={size === 'all'} onClick={() => setSize('all')}>
            kaikki
          </Chip>
          <Chip on={size === 'small'} onClick={() => setSize('small')}>
            alle 50k
          </Chip>
          <Chip on={size === 'range'} onClick={() => setSize('range')}>
            4k–110k
          </Chip>
          <Chip on={size === 'taken'} onClick={() => setSize('taken')}>
            yli 110k
          </Chip>
        </Group>

        <Group label="maa">
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="cursor-pointer rounded-sm border border-line bg-surface-2 px-2 py-1 text-ink outline-none focus-visible:border-line-bright"
          >
            <option value="all">kaikki</option>
            {markets.map(([m, n]) => (
              <option key={m} value={m}>
                {m} ({n})
              </option>
            ))}
          </select>
        </Group>

        <Group label="suodata">
          <Chip on={onlyContact} onClick={() => setOnlyContact(!onlyContact)}>
            vain yhteystieto
          </Chip>
        </Group>
      </div>

      <ol className="thin-scroll max-h-[70vh] space-y-2 overflow-y-auto pr-2">
        {shown.map((c, i) => (
          <Row key={c.id} c={c} rank={i + 1} />
        ))}
        {shown.length === 0 && (
          <li className="border border-dashed border-line px-4 py-8 text-center text-sm text-ink-3">
            Ei osumia näillä rajauksilla.
          </li>
        )}
      </ol>
    </section>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-3 uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

function Chip({
  on,
  onClick,
  children,
  dot,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
  dot?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`flex items-center gap-1.5 rounded-sm border px-2 py-1 transition-colors ${
        on ? 'border-line-bright bg-surface-3 text-ink' : 'border-line text-ink-2 hover:text-ink'
      }`}
    >
      {dot && <span className="size-2 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  )
}

function Row({ c, rank }: { c: Creator; rank: number }) {
  const routeColor = c.via === 'commenter' ? 'var(--color-route-comment)' : 'var(--color-route-chart)'
  const flagged = c.rejected || c.competitor
  const ratio = c.viewRatio ?? 0

  return (
    <li
      className={`group border border-line bg-surface-2 transition-colors hover:border-line-bright ${
        flagged ? 'opacity-70' : ''
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 pt-2.5">
        <span className="w-8 shrink-0 text-right text-xs text-ink-3">{rank}</span>

        {/* 2px surface gap between the route mark and the fill next to it */}
        <span
          className="mt-1.5 size-2 shrink-0 rounded-full ring-2 ring-surface-2"
          style={{ background: routeColor }}
          title={c.via === 'commenter' ? 'löytyi kommentoijana' : 'löytyi maalistalta'}
        />

        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display text-base font-bold tracking-tight underline-offset-4 hover:underline"
        >
          {c.title}
        </a>

        <span className="text-xs text-ink-2">
          {c.country ?? '??'}
          {c.countryConfidence === 'epävarma' && <span className="text-ink-3"> (epävarma)</span>}
          {c.lang && <span className="text-ink-3"> · {c.lang}</span>}
        </span>

        <span className="ml-auto font-display text-lg font-bold tabular-nums" style={{ color: routeColor }}>
          {c.score}
        </span>
      </div>

      <dl className="flex flex-wrap gap-x-5 gap-y-1 px-3 pt-2 pl-[4.25rem] text-xs tabular-nums">
        <Stat k="tilaajat" v={fmt(c.subs)} />
        <Stat k={`katselut/video ${c.viewWindow ?? ''}`} v={c.avgViews ? fmt(c.avgViews) : '–'} />
        <Stat k="per tilaaja" v={`${Math.round(ratio * 100)} %`} />
        <Stat k="videoita/kk" v={c.uploadsPerMonth != null ? String(c.uploadsPerMonth) : '–'} />
        <Stat k="edellisestä" v={c.daysSinceUpload != null ? `${c.daysSinceUpload} pv` : '–'} />
        {c.email && <Stat k="yhteys" v={c.email} />}
        {c.tiktok && <Stat k="tiktok" v={`@${c.tiktok}`} />}
      </dl>

      <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2.5 pb-1 pl-[4.25rem]">
        {c.known && <Tag tone="info">jo kumppaninne</Tag>}
        {c.rejected && <Tag tone="serious">hylkäsitte: {c.rejected.reason}</Tag>}
        {c.competitor && <Tag tone="serious">kilpailija: {c.competitor}</Tag>}
        {c.rigTalk && <Tag tone="good">puhuu laitteistosta</Tag>}
        {c.youthHint && <Tag tone="warn">nuori yleisö</Tag>}
        {c.subs > 110_000 && <Tag tone="warn">yli 110k</Tag>}
      </div>

      <p className="px-3 pt-1 pb-3 pl-[4.25rem] text-xs leading-relaxed text-ink-2">{c.reason}</p>
    </li>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-ink-3">{k}</dt>
      <dd className="text-ink">{v}</dd>
    </div>
  )
}

function Tag({ tone, children }: { tone: 'good' | 'warn' | 'serious' | 'info'; children: React.ReactNode }) {
  // status colours ship with a label, never colour alone
  const styles = {
    good: 'border-route-comment/45 text-route-comment',
    warn: 'border-warn/45 text-warn',
    serious: 'border-serious/45 text-serious',
    info: 'border-route-chart/45 text-route-chart',
  }[tone]
  return <span className={`rounded-sm border px-1.5 py-0.5 text-[11px] ${styles}`}>{children}</span>
}
