#!/usr/bin/env node
// Turn discovery output into leads an outreach engine can act on, as a file.
//
// This is the file route. The MCP route is the same thing without the file: the
// prepare_outreach_leads tool returns the identical rows over the wire, so two MCP servers in one
// client hand over directly with nothing in between. Both use scripts/analysis.mjs, so what the
// file contains is exactly what the tool returns.
//
// Outreach is not part of the challenge and Prenew said they have their own automations. What this
// shows is that the handover costs nothing, because the engine already produced the one thing an
// outreach engine cannot produce for itself: a measured reason for this specific creator.
//
// Nothing here sends anything. It writes a file.
//
// Usage:
//   node scripts/to-selda.mjs                              # out/creators.json -> out/selda-leads.json
//   node scripts/to-selda.mjs out/de-minecraft/creators.json --limit=25
//   node scripts/to-selda.mjs --require-email               # only creators reachable today
//   node scripts/to-selda.mjs --urgent                      # only those whose window is closing

import { readFileSync, writeFileSync } from 'node:fs'

import { leadFor, handoverCandidates } from './analysis.mjs'

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=').slice(1).join('=') : fallback
}
const flag = (name) => process.argv.includes(`--${name}`)

const src = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'out/creators.json'
const LIMIT = Number(arg('limit', 50))
const REQUIRE_EMAIL = flag('require-email')
const URGENT = flag('urgent')
const PARENTS = flag('parents')
const OUT = arg('out', 'out/selda-leads.json')

const creators = JSON.parse(readFileSync(src, 'utf8'))

let candidates = handoverCandidates(creators, { requireEmail: REQUIRE_EMAIL })
if (URGENT) candidates = candidates.filter((r) => r.breakingOut || r.signNow)
if (PARENTS) candidates = candidates.filter((r) => r.parentsChoice)
candidates = candidates.slice(0, LIMIT)

const leads = candidates.map(leadFor)
const withEmail = leads.filter((l) => l.email).length

writeFileSync(
  OUT,
  JSON.stringify(
    {
      source: src,
      generated: new Date().toISOString(),
      note:
        'Syötettävissä sellaisenaan lähetysmoottorille, esim. selda_add_leads({ projectId, leads }). ' +
        'Sähköpostiton rivi menee läpi, mutta yhteystieto pitää silloin etsiä siellä. ' +
        'Mikään tässä ei lähetä mitään.',
      counts: { leads: leads.length, withEmail, withoutEmail: leads.length - withEmail },
      excludedByDesign: {
        existingPartners: creators.filter((r) => r.known).length,
        previouslyRejected: creators.filter((r) => r.rejected).length,
        promotingCompetitor: creators.filter((r) => r.competitor).length,
      },
      leads,
    },
    null,
    1,
  ),
)

console.log(`${OUT}: ${leads.length} liidiä (${withEmail} sähköpostilla, ${leads.length - withEmail} ilman)`)
console.log(`Lähde: ${src}`)
console.log(`\nEsimerkki analysis-kentästä:\n`)
console.log(leads[0] ? `  ${leads[0].firstName}\n  ${leads[0].analysis.replace(/(.{100}\s)/g, '$1\n  ')}` : '  (ei liidejä)')
