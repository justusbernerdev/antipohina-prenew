import { auth } from '@clerk/nextjs/server'

// The handover, server side.
//
// Selected creators go to Selda as leads carrying the engine's own reasoning in `analysis`, a
// campaign is started so they land on a review screen, and a draft is written for each one. The
// drafts come straight back here, so the whole loop is visible in one screen rather than described.
//
// Nothing is sent to anybody. Selda leaves every draft for a human to approve, and there is no
// parameter anywhere in its API that changes that.
//
// The token lives only here. It is never in a client bundle and never in the repository.

export const runtime = 'nodejs'
export const maxDuration = 60

const URL_ = process.env.SELDA_MCP_URL || 'https://mcp.selda.ai/api/mcp'
const TOKEN = process.env.SELDA_TOKEN
const PROJECT = process.env.SELDA_PROJECT_ID

let rpcId = 1

async function selda(name: string, args: unknown) {
  const res = await fetch(URL_, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: rpcId++, method: 'tools/call', params: { name, arguments: args } }),
  })
  const raw = await res.text()
  // The endpoint may answer as an SSE stream, so the JSON is picked out rather than assumed to be
  // the whole body.
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) throw new Error(`Selda vastasi odottamattomasti: ${raw.slice(0, 200)}`)
  const parsed = JSON.parse(m[0])
  if (parsed.error) throw new Error(parsed.error.message || 'Selda palautti virheen')
  const text = parsed?.result?.content?.[0]?.text
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

type Lead = {
  firstName: string
  company: string
  email?: string
  jobTitle?: string
  analysis: string
  mediaImageUrl?: string
  mediaLinkUrl?: string
}

export async function POST(req: Request) {
  // The list is behind a login because it carries Prenew's own CRM data; the handover has to be
  // behind the same door.
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Kirjaudu ensin.' }, { status: 401 })

  if (!TOKEN || !PROJECT) {
    return Response.json(
      { error: 'Seldan tunnuksia ei ole asetettu. SELDA_TOKEN ja SELDA_PROJECT_ID puuttuvat.' },
      { status: 503 },
    )
  }

  let leads: Lead[]
  try {
    const body = await req.json()
    leads = (body.leads || []).slice(0, 10) // a demo handover, not a bulk import
  } catch {
    return Response.json({ error: 'Virheellinen pyyntö.' }, { status: 400 })
  }
  if (!leads.length) return Response.json({ error: 'Ei valittuja tekijöitä.' }, { status: 400 })

  try {
    const source = `prenew-engine-${new Date().toISOString().slice(0, 10)}`

    // 1. the leads, with the engine's reasoning attached
    const added = await selda('selda_add_leads', {
      projectId: PROJECT,
      leads: leads.map((l) => ({ ...l, source })),
    })

    const ids: string[] = (Array.isArray(added) ? added : []).map((a: { leadId: string }) => a.leadId).filter(Boolean)
    if (!ids.length) throw new Error('Selda ei palauttanut yhtään liidiä')

    // 2. a campaign, so the drafts land on a review screen in the Selda app rather than nowhere
    let runId: string | null = null
    try {
      const run = await selda('selda_start_campaign_from_leads', {
        projectId: PROJECT,
        source,
        campaignBrief:
          'Pelivaikuttajien kumppanuus. Tekijä saa oman sivun ja alennuskoodin. Avausviesti ' +
          'kirjoitetaan analysis-kentän mitatuista faktoista, ei mallipohjasta. Ei hintaa eikä ' +
          'palkkiota ensimmäisessä viestissä.',
      })
      runId = run?.runId || run?.id || null
    } catch {
      // A campaign is nice to have; the drafts are the point and they work without one.
    }

    // 3. a draft each. Sequential on purpose: ten parallel generations is a spike in somebody
    //    else's rate limit for no gain at this size.
    const drafts = []
    for (const leadId of ids) {
      try {
        const d = await selda('selda_generate_message', { leadId, channel: 'email' })
        drafts.push({
          leadId,
          company: d?.prospectFacts?.company?.name || '',
          email: d?.prospectFacts?.contact?.email || null,
          subject: d?.subject || '',
          body: d?.body || '',
          status: d?.status || 'draft',
        })
      } catch (e) {
        drafts.push({ leadId, error: e instanceof Error ? e.message : 'luonnos epäonnistui' })
      }
    }

    return Response.json({
      ok: true,
      source,
      runId,
      leads: ids.length,
      drafts,
      note: 'Luonnokset odottavat hyväksyntää Seldassa. Mitään ei lähetetty.',
    })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Siirto epäonnistui' }, { status: 502 })
  }
}
