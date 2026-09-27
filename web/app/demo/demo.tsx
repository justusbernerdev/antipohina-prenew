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
    <div className="mx-auto flex max-w-[1320px] flex-col gap-10 px-4 pt-6 pb-16 sm:gap-16 sm:px-12 sm:pt-10 sm:pb-24">
      <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6">
        <div className="flex items-center gap-3 font-display text-[15px] font-bold tracking-[0.14em]">
          <span>ANTIPÖHINÄ</span>
          <span className="font-normal text-ink-3">×</span>
          <span className="text-forest">PRENEW</span>
        </div>
        <nav className="-mx-4 flex items-center gap-6 overflow-x-auto px-4 sm:mx-0 sm:gap-8 sm:overflow-visible sm:px-0">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`shrink-0 cursor-pointer border-b-2 py-1.5 font-display text-base font-semibold transition-colors ${
                tab === k ? 'border-forest text-ink' : 'border-transparent text-ink-3 hover:text-ink-2'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto shrink-0 sm:ml-0"><UserButton /></span>
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
