'use client'

import { useMemo, useState } from 'react'
import type { Data } from '../types'
import { EMPTY_CRITERIA, selected, type Criteria } from './criteria'
import { Flow } from './flow'
import { List } from './list'
import { ApiTab, McpTab, SeldaTab } from './integrations'
import { UserButton } from '@clerk/nextjs'

type Tab = 'flow' | 'mcp' | 'api' | 'selda'

const TABS: [Tab, string][] = [
  ['flow', 'Dataflow'],
  ['mcp', 'MCP'],
  ['api', 'API'],
  ['selda', 'Selda'],
]

export function Demo({ d }: { d: Data }) {
  const [tab, setTab] = useState<Tab>('flow')
  const [cr, setCr] = useState<Criteria>(EMPTY_CRITERIA)

  const set = (patch: Partial<Criteria>) => setCr((p) => ({ ...p, ...patch }))

  // One filtered list, shared by every tab. The API and MCP views describe the request that is on
  // screen rather than a fixed example, which is the whole point of putting them behind tabs on
  // the same state.
  const rows = useMemo(() => selected(d.creators, cr), [d.creators, cr])

  // Niche label back to the engine's own key, so the API body shows what the engine accepts.
  const nicheKeys = useMemo(() => {
    const map: Record<string, string> = {}
    for (const label of Object.keys(d.nicheCounts)) {
      map[label] = label.toLowerCase().split(/[\s/]/)[0].replace(/[^a-zä-ö0-9]/gi, '')
    }
    return map
  }, [d.nicheCounts])

  const markets = Object.keys(d.perMarket ?? {})
  const quota = Math.round(
    ((d.quotaUnits ?? 0) * (cr.markets.length || markets.length)) / Math.max(1, markets.length),
  )

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-16 px-5 pt-10 pb-24 sm:px-12">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3 font-display text-[15px] font-bold tracking-[0.14em]">
          <span>ANTIPÖHINÄ</span>
          <span className="font-normal text-ink-3">×</span>
          <span className="text-forest">PRENEW</span>
        </div>
        <nav className="flex items-center gap-8">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`cursor-pointer border-b-2 py-1.5 font-display text-base font-semibold transition-colors ${
                tab === k ? 'border-forest text-ink' : 'border-transparent text-ink-3 hover:text-ink-2'
              }`}
            >
              {label}
            </button>
          ))}
          <UserButton />
        </nav>
      </header>

      {tab === 'flow' && (
        <>
          <Flow d={d} cr={cr} set={set} count={rows.length} />
          <List rows={rows} runDate={d.runDate ?? ''} />
        </>
      )}

      {tab === 'mcp' && <McpTab cr={cr} rows={rows} nicheKeys={nicheKeys} />}
      {tab === 'api' && <ApiTab cr={cr} rows={rows} quota={quota} nicheKeys={nicheKeys} />}
      {tab === 'selda' && <SeldaTab rows={rows} />}
    </div>
  )
}
