import data from './data.json'
import { Explorer } from './explorer'
import type { Data } from './types'

const d = data as unknown as Data
const fmt = (n: number) => n.toLocaleString('fi-FI')

export default function Page() {
  const { stats, ownData, platform } = d
  const rejections = Object.entries(d.rejections)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxCollabs = Math.max(...ownData.map((m) => m.collabs))

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      {/* ---------- hero: the headline number is the answer, so it is not a chart ---------- */}
      <header className="rise">
        <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tracking-wider text-ink-3 uppercase">
          <span>Prenew challenge</span>
          <span className="text-line-bright">/</span>
          <span>tiimi antipöhinä</span>
          <span className="text-line-bright">/</span>
          <span>{d.runDate}</span>
        </p>

        <h1 className="font-display text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl">
          Pienet tekijät löytyvät
          <br />
          <span className="text-route-comment">isojen vierestä</span>, eivät hakemalla.
        </h1>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-2">
          Haku on YouTuben kiintiössä sata kertaa kalliimpaa kuin tunnisteella tehty erähaku. Siksi tämä ei etsi
          hakusanoilla vaan laajentaa verkostosta: kansallinen pelilista antaa keskikokoiset paikalliset tekijät, ja
          heidän videoidensa kommentoijat antavat sen hännän jota vaikuttaja-alustat eivät näe.
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-4">
          <Tile k="tekijää" v={fmt(stats.fresh)} note="uusia löytöjä" />
          <Tile k="alle 50k tilaajaa" v={fmt(stats.small)} note="ei näy alustoilla" accent="var(--color-route-comment)" />
          <Tile k="yhteystieto" v={fmt(stats.withEmail)} note="suoraan kuvauksesta" />
          <Tile
            k="kiintiötä"
            v={`${fmt(d.quotaUnits)}`}
            note={`/ ${fmt(d.dailyQuota)} päivässä · 0 €`}
          />
        </dl>
      </header>

      {/* ---------- validation ---------- */}
      <section className="rise mt-14 border border-route-comment/35 bg-surface-2 p-5" style={{ animationDelay: '120ms' }}>
        <h2 className="font-display text-lg font-bold tracking-tight">
          Kone löysi neljä teidän omaa kumppanianne tuntematta niitä
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          {stats.knownFound.join(', ')} nousivat {fmt(stats.total)} tekijän joukosta ilman että niitä syötettiin sisään.
          Lisäksi kone tunnisti {stats.rejectedFound.length} tekijää joita olette jo lähestyneet ja hylänneet
          ({stats.rejectedFound.map((r) => `${r.title}: ${r.reason.toLowerCase()}`).join('; ')}). Ne on siirretty pois
          kärjestä, mutta ne ovat listalla, koska se on ainoa tapa osoittaa että pisteytys tunnistaa oikean tyypin.
        </p>
      </section>

      {/* ---------- what the engine did, stage by stage ---------- */}
      <section className="rise mt-14" style={{ animationDelay: '160ms' }}>
        <h2 className="font-display text-xl font-bold tracking-tight">Mitä kone teki</h2>
        <p className="mt-2 mb-6 max-w-2xl text-sm leading-relaxed text-ink-2">
          Jokainen vaihe on ajon oma kirjanpito, ei arvio. Huomaa mihin määrä kasvaa ja missä se
          karsiutuu: kommentoijia tulee tuhansia, ja niistä jää murto-osa oikeita tekijöitä.
        </p>

        <ol className="grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-3">
          {d.pipeline.map((s, i) => {
            const prev = i > 0 ? d.pipeline[i - 1].count : null
            const drop = prev != null && s.count < prev
            return (
              <li key={s.name} className="bg-surface-2 px-4 py-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-ink-3 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-display text-2xl font-extrabold tabular-nums">{fmt(s.count)}</span>
                  {drop && (
                    <span className="text-xs text-ink-3">
                      / {fmt(prev!)} · {Math.round((s.count / prev!) * 100)} %
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-ink">{s.name}</p>
                {s.note && <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{s.note}</p>}
              </li>
            )
          })}
        </ol>
      </section>

      {/* ---------- their own data, side by side ---------- */}
      <div className="mt-14 grid gap-10 lg:grid-cols-2">
        <section className="rise" style={{ animationDelay: '200ms' }}>
          <h2 className="font-display text-xl font-bold tracking-tight">Mitä agentuuri kustantaa teille</h2>
          <p className="mt-2 mb-5 text-sm leading-relaxed text-ink-2">
            Teidän 69 yhteistyötänne markkinoittain. Mitä enemmän välikättä, sitä vähemmän toistuvia kumppanuuksia.
            Virossa nolla agentuuria ja yksi toistuva, Saksassa kahdeksan kymmenestä agentuurin kautta ja nolla
            toistuvaa.
          </p>

          <table className="w-full text-xs tabular-nums">
            <caption className="sr-only">Yhteistyöt, agentuuriosuus ja toistuvat kumppanit markkinoittain</caption>
            <thead>
              <tr className="border-b border-line text-left text-ink-3">
                <th scope="col" className="py-1.5 font-normal">
                  maa
                </th>
                <th scope="col" className="py-1.5 pl-2 font-normal">
                  yhteistöitä
                </th>
                <th scope="col" className="py-1.5 pl-2 text-right font-normal">
                  agentuuri
                </th>
                <th scope="col" className="py-1.5 pl-2 text-right font-normal">
                  toistuvia
                </th>
              </tr>
            </thead>
            <tbody>
              {ownData.map((m) => (
                <tr key={m.country} className="border-b border-line/60">
                  <th scope="row" className="py-2 pr-2 text-left font-normal text-ink">
                    {m.country}
                  </th>
                  <td className="py-2 pl-2">
                    <div className="flex items-center gap-2">
                      {/* magnitude: one hue, data-end rounded, anchored to baseline */}
                      <span
                        className="h-2 rounded-r-[4px] bg-route-chart"
                        style={{ width: `${(m.collabs / maxCollabs) * 100}%`, minWidth: 3 }}
                      />
                      <span className="text-ink-2">{m.collabs}</span>
                    </div>
                  </td>
                  <td
                    className="py-2 pl-2 text-right"
                    style={{ color: m.agencyPct >= 70 ? 'var(--color-serious)' : undefined }}
                  >
                    {m.agency}/{m.collabs}
                    <span className="text-ink-3"> ({m.agencyPct} %)</span>
                  </td>
                  <td
                    className="py-2 pl-2 text-right"
                    style={{ color: m.repeaters === 0 ? 'var(--color-ink-3)' : 'var(--color-route-comment)' }}
                  >
                    {m.repeaters}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rise" style={{ animationDelay: '280ms' }}>
          <h2 className="font-display text-xl font-bold tracking-tight">Mitä hylkäyksenne opettivat</h2>
          <p className="mt-2 mb-5 text-sm leading-relaxed text-ink-2">
            26 toteutumatonta yhteistyötä syineen. Näistä laskettiin pisteytyksen rajat, eikä niitä arvattu.
            Suurin yksittäinen syy ei ole hinta vaan se että joku ehti ensin.
          </p>

          <ul className="space-y-2 text-xs">
            {rejections.map(([reason, n]) => (
              <li key={reason} className="flex items-center gap-3">
                <span className="w-44 shrink-0 text-ink-2">{reason}</span>
                <span
                  className="h-2 rounded-r-[4px] bg-serious"
                  style={{ width: `${(n / 5) * 100}px`, minWidth: 3 }}
                />
                <span className="text-ink-3 tabular-nums">{n}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-3 border-t border-line pt-5 text-sm leading-relaxed">
            <p className="text-ink-2">
              <span className="text-ink">Yläraja on 110 000, ei 250 000.</span> Kaikki viisi kilpailijan tai
              eksklusiivisuuden takia hylättyä olivat 110k–629k tilaajan kanavia, mediaani 479 000. Toteutuneiden
              mediaani on 75 000. Listalla on {fmt(stats.takenZone)} tekijää tuon rajan yli, ja ne pudotetaan kärjestä.
            </p>
            <p className="text-ink-2">
              <span className="text-ink">Iso TikTok on hintariski, ei etu.</span> Hintasyyllä hylätyt näyttivät
              YouTubessa pieniltä (33k–48k) mutta heillä oli TikTokissa 79 000–340 000 seuraajaa.
            </p>
          </div>
        </section>
      </div>

      {/* ---------- the two routes ---------- */}
      <section className="rise mt-14 grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2" style={{ animationDelay: '360ms' }}>
        <Route
          color="var(--color-route-chart)"
          n={stats.viaChart}
          title="Maalistalta"
          body="Kansallinen pelilista, yksi kiintiöyksikkö per maa. Nämä ovat julkisesti löydettävissä, eli Prenew voisi koostaa listan itse. Siksi tämä ei yksin vastaa haasteeseen."
        />
        <Route
          color="var(--color-route-comment)"
          n={stats.viaCommenter}
          title="Kommentoijista"
          body="Sata kommentoijan kanavatunnusta yhdellä kiintiöyksiköllä. Nämä ovat tyypillisesti 500–10 000 tilaajan paikallisia tekijöitä, eivätkä ne näy yhdelläkään vaikuttaja-alustalla. Tämä on vastaus siihen mitä Akseli kuvasi."
        />
      </section>

      <div className="mt-14">
        <Explorer creators={d.creators} />
      </div>

      <footer className="mt-16 border-t border-line pt-6 text-xs leading-relaxed text-ink-3">
        <p>
          TikTok on mukana {platform.tiktok}/{platform.total} toteutuneessa yhteistyössä ja YouTube{' '}
          {platform.youtube}/{platform.total}. Tämä näkymä kattaa YouTube-puolen. TikTokin virallinen tutkimusrajapinta
          on kaupallisilta suljettu, joten se osa vaatii maksullisen lähteen ja on vielä kesken.
        </p>
        <p className="mt-2">
          Data haetaan YouTube Data API v3:sta ajohetkellä. Kaikki luvut ovat mitattuja. {stats.youthFlagged} tekijää on
          merkitty viitteestä nuoresta yleisöstä; rivejä ei poisteta, päätös jää ihmiselle.
        </p>
      </footer>
    </main>
  )
}

function Tile({ k, v, note, accent }: { k: string; v: string; note: string; accent?: string }) {
  return (
    <div className="bg-surface-2 px-4 py-4">
      <dt className="text-xs tracking-wide text-ink-3 uppercase">{k}</dt>
      <dd>
        <span className="font-display text-3xl font-extrabold tabular-nums" style={accent ? { color: accent } : undefined}>
          {v}
        </span>
        <span className="mt-0.5 block text-xs text-ink-3">{note}</span>
      </dd>
    </div>
  )
}

function Route({ color, n, title, body }: { color: string; n: number; title: string; body: string }) {
  return (
    <div className="bg-surface-2 p-5">
      <div className="flex items-baseline gap-2.5">
        <span className="size-2.5 rounded-full ring-2 ring-surface-2" style={{ background: color }} />
        <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
        <span className="ml-auto font-display text-2xl font-extrabold tabular-nums" style={{ color }}>
          {n}
        </span>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-ink-2">{body}</p>
    </div>
  )
}
