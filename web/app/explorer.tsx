'use client'

import { useMemo, useState } from 'react'
import type { Bounds, Creator } from './types'

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

const NATIONALITY: Record<string, string> = {
  FI: 'suomalainen', SE: 'ruotsalainen', DE: 'saksalainen', EE: 'virolainen', HU: 'unkarilainen',
  LV: 'latvialainen', LT: 'liettualainen', PL: 'puolalainen', DK: 'tanskalainen',
  NL: 'hollantilainen', FR: 'ranskalainen',
}

// The same analysis text scripts/to-selda.mjs writes, so what the screen promises is what the file
// delivers. Selda composes the opening message from this field rather than crawling the channel.
function analysisFor(r: Creator) {
  const s: string[] = []
  const who = r.country
    ? `${NATIONALITY[r.country] || `${r.country}-maalainen`} YouTube-tekijä`
    : 'YouTube-tekijä, maa ei varmistunut'
  s.push(
    `${r.title} on ${who}, ${fmt(r.subs)} tilaajaa ja ${r.avgViews != null ? `${fmt(r.avgViews)} katselua per video` : 'katselutieto puuttuu'}${r.viewWindow ? ` (${r.viewWindow} ikkuna)` : ''}.`,
  )
  if (r.nicheLabel && r.nicheLabel !== 'Tuntematon') {
    const extra = r.games.slice(1, 3)
    s.push(`Sisältö: ${r.nicheLabel}${extra.length ? ` (myös ${extra.join(' ja ')})` : ''}.`)
  }
  if (r.viewRatio) {
    s.push(
      `Yleisö on aktiivinen: video tavoittaa ${Math.round(r.viewRatio * 100)} % tilaajamäärästä, ja kanava julkaisee ${r.uploadsPerMonth ?? '?'} videota kuussa${r.daysSinceUpload != null ? `, edellisestä ${r.daysSinceUpload} päivää` : ''}.`,
    )
  }
  if (r.breakingOut) {
    s.push(
      `Tämä on nousukiidossa: tavoittaa enemmän ihmisiä kuin sillä on tilaajia ja katselut kasvavat ${r.trendPct} %. Nyt se on vielä ${fmt(r.subs)} tilaajan kokoinen.`,
    )
  } else if (r.signNow && r.subsPerMonth != null) {
    s.push(
      `Kasvaa noin ${fmt(r.subsPerMonth)} tilaajaa kuussa, eli arviolta ${r.monthsToBound} kuukautta siihen kokoon jossa Prenewin oman datan mukaan tekijät ovat yleensä jo varattuja.`,
    )
  }
  if (r.rigTalk) {
    s.push(
      'Tekijä luettelee oman kokoonpanonsa kanavan tiedoissa, eli puhuu laitteistosta jo nyt omasta aloitteestaan. Kone ei ole hänen kanavallaan väkinäinen aihe.',
    )
  }
  if (r.parentsChoice) {
    s.push(
      'Kanava on merkitty lapsiystävälliseksi tekijän omin sanoin, eli vanhempi on yleisössä. Tämä osuu Prenewin Vanhempien valinta -kategoriaan.',
    )
  }
  const others = r.platforms.filter((p) => p !== 'youtube')
  if (others.length) s.push(`Myös muilla alustoilla: ${others.join(', ')}.`)
  s.push(`Löytyi ${r.via === 'commenter' ? 'kommentoijareitistä, eli ei ole vaikuttaja-alustoilla löydettävissä' : 'maakohtaiselta pelilistalta'}.`)
  s.push(`Pisteytys ${r.score}. Perustelu koneelta: ${r.reason}`)
  return s.join(' ')
}

export function Explorer({ creators, bounds }: { creators: Creator[]; bounds: Bounds }) {
  const [route, setRoute] = useState<'all' | 'commenter' | 'chart'>('all')
  const [country, setCountry] = useState('all')
  const [niche, setNiche] = useState('all')
  const [size, setSize] = useState<'all' | 'under10' | 'under50' | 'range'>('all')
  const [contact, setContact] = useState(false)
  const [rising, setRising] = useState(false)
  const [urgent, setUrgent] = useState(false)
  const [parents, setParents] = useState(false)
  const [limit, setLimit] = useState(40)
  const [recorded, setRecorded] = useState<Recorded[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [campaign, setCampaign] = useState(false)

  const countries = useMemo(
    () => [...new Set(creators.map((c) => c.country).filter(Boolean))].sort() as string[],
    [creators],
  )
  const niches = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of creators) counts.set(c.nicheLabel, (counts.get(c.nicheLabel) || 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [creators])

  const filtered = useMemo(
    () =>
      creators.filter((c) => {
        if (route !== 'all' && c.via !== route) return false
        if (country !== 'all' && c.country !== country) return false
        if (niche !== 'all' && c.nicheLabel !== niche) return false
        if (contact && !c.email) return false
        if (rising && c.trend !== 'nouseva') return false
        if (urgent && !c.breakingOut && !c.signNow) return false
        if (parents && !c.parentsChoice) return false
        if (size === 'under10' && c.subs >= 10_000) return false
        if (size === 'under50' && c.subs >= 50_000) return false
        if (size === 'range' && (c.subs < 4000 || c.subs > 250_000)) return false
        return true
      }),
    [creators, route, country, niche, size, contact, rising, urgent, parents],
  )

  const currentZone = takenZoneFrom(bounds, recorded)
  const zoneMoved = currentZone !== bounds.takenZone

  const selectedCreators = useMemo(
    () => creators.filter((c) => selected.has(c.id)),
    [creators, selected],
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const c of filtered.slice(0, limit)) next.add(c.id)
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

  // The exact payload Selda's selda_add_leads takes. Built in the browser from the rows on screen,
  // so what is downloaded is what was selected.
  const payload = {
    leads: selectedCreators.map((c) => ({
      firstName: c.title,
      lastName: '',
      company: c.title,
      ...(c.email ? { email: c.email } : {}),
      jobTitle: `YouTube-sisällöntuottaja${c.nicheLabel !== 'Tuntematon' ? ` · ${c.nicheLabel}` : ''}`,
      analysis: analysisFor(c),
      mediaLinkUrl: c.url,
    })),
  }

  function download() {
    const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `prenew-kampanja-${selectedCreators.length}-tekijaa.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const withEmail = selectedCreators.filter((c) => c.email).length

  return (
    <section>
      {/* ---------- filters: one row, no settings panel ---------- */}
      <div className="sticky top-[49px] z-10 -mx-5 mb-5 border-y border-line bg-surface/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Seg
            value={route}
            onChange={setRoute}
            options={[
              ['all', 'Kaikki'],
              ['commenter', 'Kommentoija'],
              ['chart', 'Maalista'],
            ]}
          />

          <Select value={country} onChange={setCountry} label="Maa">
            <option value="all">Maa: kaikki</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          <Select value={niche} onChange={setNiche} label="Niche">
            <option value="all">Niche: kaikki</option>
            {niches.map(([n, count]) => (
              <option key={n} value={n}>
                {n} ({count})
              </option>
            ))}
          </Select>

          <Select value={size} onChange={(v) => setSize(v as typeof size)} label="Koko">
            <option value="all">Koko: kaikki</option>
            <option value="under10">alle 10k</option>
            <option value="under50">alle 50k</option>
            <option value="range">4k–250k</option>
          </Select>

          <Toggle on={contact} onClick={() => setContact(!contact)}>
            Yhteystieto
          </Toggle>
          <Toggle on={rising} onClick={() => setRising(!rising)}>
            Nousussa
          </Toggle>
          <Toggle on={urgent} onClick={() => setUrgent(!urgent)}>
            Kiire
          </Toggle>
          <Toggle on={parents} onClick={() => setParents(!parents)}>
            Vanhempien valinta
          </Toggle>

          <span className="nums ml-auto font-semibold text-ink-2">{fmt(filtered.length)} tekijää</span>
        </div>
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
        {recorded.length > 0 && (
          <p className="mt-2 border-t border-line pt-2 text-xs text-ink-3">
            Kirjattu tässä istunnossa: {recorded.length}. Pysyväksi tämä menee moottorin{' '}
            <code className="rounded-brand bg-surface-3 px-1 py-0.5 font-mono text-[11px]">record_outcome</code>{' '}
            -kutsulla, joka laskee samat rajat uudelleen tiedostoon.
          </p>
        )}
      </div>

      {/* ---------- the list ---------- */}
      <div className="mb-2 flex items-center gap-3 text-xs">
        <button onClick={selectAllVisible} className="cursor-pointer font-semibold text-blue underline">
          Valitse näkyvät ({Math.min(limit, filtered.length)})
        </button>
        {selected.size > 0 && (
          <button
            onClick={() => { setSelected(new Set()); setCampaign(false) }}
            className="cursor-pointer text-ink-3 underline hover:text-ink"
          >
            Tyhjennä valinta
          </button>
        )}
      </div>

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
                <span className="ml-auto text-[11px] text-ink-3">
                  {c.via === 'commenter' ? 'kommentoijareitistä' : 'maakohtaiselta listalta'}
                </span>
              </div>

              <dl className="nums mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                <Metric k="tilaajat" v={fmt(c.subs)} />
                <Metric k={`katselut / video (${c.viewWindow || '?'})`} v={c.avgViews != null ? fmt(c.avgViews) : '–'} />
                <Metric k="katselut / tilaaja" v={c.viewRatio != null ? `${Math.round(c.viewRatio * 100)} %` : '–'} />
                {c.trend && (
                  <Metric
                    k="trendi"
                    v={`${c.trend} ${c.trendPct != null ? `${c.trendPct > 0 ? '+' : ''}${c.trendPct} %` : ''}`}
                    tone={c.trend === 'nouseva' ? 'good' : c.trend === 'laskeva' ? 'bad' : undefined}
                  />
                )}
                {c.subsPerMonth != null && <Metric k="tilaajaa / kk" v={fmt(c.subsPerMonth)} />}
                <Metric k="videoita / kk" v={c.uploadsPerMonth != null ? String(c.uploadsPerMonth) : '–'} />
                <Metric k="edellisestä" v={c.daysSinceUpload != null ? `${c.daysSinceUpload} pv` : '–'} />
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

              {/* The reason as a whole sentence. This is the column that makes the list checkable,
                  and it is the difference from the platforms that did not work for them. */}
              <p className="mt-2.5 border-t border-line pt-2.5 text-xs leading-relaxed text-ink-2">{c.reason}</p>

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
              className="ml-auto cursor-pointer rounded-brand bg-forest px-3 py-1.5 font-semibold text-white transition-colors hover:bg-forest-80"
            >
              {campaign ? 'Sulje' : 'Luo kampanja'}
            </button>
            <button
              onClick={download}
              className="cursor-pointer rounded-brand border border-line-strong px-3 py-1.5 font-semibold text-ink-2 transition-colors hover:border-blue hover:text-blue"
            >
              Lataa JSON
            </button>
          </div>

          {campaign && (
            <div className="mt-3 max-h-[46vh] overflow-y-auto rounded-brand-lg border border-line bg-surface p-4">
              <p className="font-display text-sm font-bold">Kampanja {selected.size} tekijästä</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-2">
                Tästä eteenpäin yhteydenotto on erillinen vaihe eikä osa tätä haastetta. Näin se kytkeytyy:
                lista menee yhdellä kutsulla lähetysmoottoriin, ja ratkaiseva kenttä on{' '}
                <code className="rounded-brand bg-surface-3 px-1 py-0.5 font-mono text-[11px]">analysis</code> —
                moottorin perustelu <em>on</em> se tutkimus josta avausviesti kirjoitetaan, joten viesti osaa
                nimetä miksi juuri tämä tekijä. Mikään ei lähde itse: luonnos jää odottamaan ihmisen hyväksyntää.
              </p>

              <pre className="mt-3 overflow-x-auto rounded-brand bg-surface-3 p-3 font-mono text-[10px] leading-relaxed text-ink-2">
{`selda_add_leads({
  projectId: "<prenew>",
  leads: [ ${selected.size} riviä ]
})`}
              </pre>

              <p className="mt-3 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">
                Esimerkki yhdestä rivistä
              </p>
              <pre className="mt-1 max-h-56 overflow-auto rounded-brand border border-line bg-surface-2 p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-ink-2">
                {JSON.stringify(payload.leads[0], null, 1)}
              </pre>

              {selected.size - withEmail > 0 && (
                <p className="mt-3 text-xs text-ink-2">
                  {selected.size - withEmail} valitulla ei ole sähköpostia kanavan kuvauksessa. Ne menevät läpi,
                  mutta yhteystieto pitää silloin etsiä lähetysmoottorin puolella.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/* ---------- small pieces ---------- */

function Metric({ k, v, tone }: { k: string; v: string; tone?: 'good' | 'bad' }) {
  return (
    <div>
      <dt className="text-[10px] tracking-wide text-ink-3 uppercase">{k}</dt>
      <dd className={`font-semibold ${tone === 'good' ? 'text-forest' : tone === 'bad' ? 'text-critical' : 'text-ink'}`}>
        {v}
      </dd>
    </div>
  )
}

function Tag({
  children,
  tone,
}: {
  children: React.ReactNode
  tone?: 'forest' | 'blue' | 'amber' | 'critical'
}) {
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
    <div className="flex overflow-hidden rounded-brand border border-line-strong">
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
        className="cursor-pointer rounded-brand border border-line-strong bg-surface-2 px-2 py-1.5 font-semibold text-ink-2 transition-colors hover:text-ink"
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
      className={`cursor-pointer rounded-brand border px-2.5 py-1.5 font-semibold transition-colors ${
        on ? 'border-forest bg-forest text-white' : 'border-line-strong bg-surface-2 text-ink-2 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
