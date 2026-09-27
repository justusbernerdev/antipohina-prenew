import data from './data.json'
import { Explorer } from './explorer'
import type { Data } from './types'

const d = data as unknown as Data
const fmt = (n: number) => n.toLocaleString('fi-FI')
const pct = (n: number, of: number) => Math.round((n / of) * 100)

export default function Page() {
  const { stats, ownData, platform, bounds, pipeline, targeted, runs } = d
  const rejections = Object.entries(d.rejections).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxCollabs = Math.max(...ownData.map((m) => m.collabs))
  const maxStage = Math.max(...pipeline.map((s) => s.count))
  const quota = d.quotaUnits ?? 0

  return (
    <main>
      {/* ---------- hero: a deep green block, the way their own site opens ---------- */}
      <header className="deep rise px-5 py-14 sm:px-8 sm:py-20">
       <div className="mx-auto max-w-6xl">
        <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold tracking-wider text-mint uppercase">
          <span>Prenew challenge</span>
          <span className="text-white/35">/</span>
          <span>tiimi antipöhinä</span>
          <span className="text-white/35">/</span>
          <span>{d.runDate}</span>
        </p>

        <h1 className="font-display text-4xl leading-[1.02] font-extrabold tracking-tight sm:text-6xl">
          Pienet tekijät löytyvät
          <br />
          <span className="text-mint">isojen vierestä</span>, eivät hakemalla.
        </h1>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/75">
          Haku on YouTuben kiintiössä sata kertaa kalliimpaa kuin tunnisteella tehty erähaku. Siksi
          tämä ei etsi hakusanoilla vaan laajentaa verkostosta: kansallinen pelilista antaa
          keskikokoiset paikalliset tekijät, ja heidän videoidensa kommentoijat antavat sen hännän
          jota vaikuttaja-alustat eivät näe.
        </p>

        {/* The one thing that has to be clear before anything else: this is an engine, and there
            are three ways to take it. Sanoitte ettette halua erillistä työkalua — tämä ei ole. */}
        <div className="mt-8 rounded-brand-lg border border-white/20 bg-white/8 p-5 backdrop-blur-sm">
          <p className="font-display text-base font-bold">
            Tämä on <span className="text-mint">engine</span>, ei sovellus johon kirjaudutaan.
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
            Sanoitte ettette halua erillistä työkalua eikä uutta työnkulkua. Tämä ei ole
            kumpaakaan. Se on moottori jossa on tieto-taito, ja te kytkette sen siihen mitä teillä
            jo on — kolmella tavalla, ja valitsette itse.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Route
              n="1"
              title="MCP"
              body="Teidän agenttiprosessinne kysyy kandidaatteja suoraan. Viisi työkalua, ei asennusta."
            />
            <Route
              n="2"
              title="Oma järjestelmä"
              body="CSV ja JSON ulos, ajastettuna cronissa. Menee sinne minne muukin datanne menee."
            />
            <Route
              n="3"
              title="Kytkettynä lähetykseen"
              body="Löydöt siirtyvät yhteydenottoon briiffi mukanaan, ja tulokset valuvat takaisin teidän järjestelmäänne."
              accent
            />
          </div>
          <p className="mt-4 border-t border-white/20 pt-3 text-sm leading-relaxed text-white/85">
            Kolmas on valinnainen eikä kuulu haasteeseen. Mutta siitä seuraa yksi asia joka
            kannattaa sanoa ääneen:{' '}
            <strong className="font-semibold">
              &rdquo;emme saa kontaktoitua vaikuttajia&rdquo; ei ole enää syy.
            </strong>{' '}
            Ei ensi kuussa vaan tänään, ja tässä on {fmt(stats.withEmail)} tekijää joilla on
            sähköpostiosoite tiedossa.
          </p>
        </div>

        <dl className="nums mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-brand-lg border border-white/15 bg-white/15 sm:grid-cols-4">
          <Tile k="tekijää" v={fmt(stats.fresh)} note="uusia löytöjä" />
          <Tile k="alle 50k tilaajaa" v={fmt(stats.small)} note={`${pct(stats.small, stats.fresh)} % listasta`} accent />
          <Tile
            k="kommentoijareitistä"
            v={fmt(stats.viaCommenter)}
            note="ei löydettävissä alustoilta"
            accent
          />
          <Tile k="yhteystieto tiedossa" v={fmt(stats.withEmail)} note={`${stats.withBusinessEmail} business-osoitetta`} />
        </dl>
       </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">

      {/* ---------- A. what the engine did ---------- */}
      <Section
        title="Mitä kone teki"
        lead="Ei asetuksia eikä lomakkeita. Tämä on se näkymä joka kertoo mistä lista syntyi, ja jokainen luku on mitattu tästä ajosta."
      >
        <ol className="space-y-1.5">
          {pipeline.map((s, i) => {
            const prev = pipeline[i - 1]
            const dropped = prev && prev.count > s.count ? prev.count - s.count : null
            return (
              <li key={s.name} className="rounded-brand border border-line bg-surface-2 p-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="nums w-8 text-xs font-semibold text-ink-3">{i + 1}.</span>
                  <span className="font-display text-sm font-bold">{s.name}</span>
                  <span className="nums ml-auto font-display text-lg font-extrabold">{fmt(s.count)}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 pl-11">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-brand bg-surface-3">
                    <div
                      className="h-full rounded-brand bg-forest-60"
                      style={{ width: `${Math.max(0.4, (s.count / maxStage) * 100)}%` }}
                    />
                  </div>
                  {dropped && (
                    <span className="nums shrink-0 text-[11px] font-semibold text-ink-3">
                      −{fmt(dropped)} karsiutui
                    </span>
                  )}
                </div>
                {s.note && <p className="mt-1 pl-11 text-[11px] text-ink-3">{s.note}</p>}
              </li>
            )
          })}
        </ol>

        {/* quota */}
        <div className="mt-4 rounded-brand-lg border border-line bg-surface-2 p-4">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="font-display text-sm font-bold">Kiintiö</span>
            <span className="nums font-display text-xl font-extrabold">
              {fmt(quota)} <span className="text-sm font-semibold text-ink-3">/ {fmt(d.dailyQuota)}</span>
            </span>
            <span className="text-xs text-ink-2">yksikköä päivän ilmaisbudjetista</span>
            <span className="nums ml-auto text-xs font-semibold text-forest">
              {pct(quota, d.dailyQuota)} %
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-brand bg-surface-3">
            <div className="h-full rounded-brand bg-forest" style={{ width: `${pct(quota, d.dailyQuota)}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink-2">
            Ajo on ilmainen. Uusinta-ajo kuluttaa {fmt(d.quotaUnitsCached ?? 0)} yksikköä, koska
            jokainen vastaus on levyllä välimuistissa. Hakua ei kutsuta kertaakaan siemenvaiheen
            jälkeen, ja se on syy siihen että tämä mahtuu ilmaiskiintiöön.
          </p>
        </div>
      </Section>

      {/* ---------- targeted run: the brief's own example ---------- */}
      {targeted && targeted.request && (
        <Section
          title="Kohdennettu ajo"
          lead="Sama moottori, yksi markkina ja yksi niche. Tämä on se mitä briefi pyysi näytettäväksi oikealla esimerkillä."
        >
          <div className="rounded-brand-lg border border-line bg-surface-2 p-4">
            <code className="block overflow-x-auto rounded-brand bg-surface-3 px-3 py-2 font-mono text-[11px] text-ink-2">
              node scripts/discover.mjs --markets={targeted.request.markets.join(',')} --niche=
              {targeted.request.niches.join(',')}
            </code>
            <dl className="nums mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniTile k="tekijää" v={fmt(targeted.total)} />
              <MiniTile k="alle 50k" v={fmt(targeted.small)} accent />
              <MiniTile k="kommentoijareitistä" v={fmt(targeted.viaCommenter)} accent />
              <MiniTile k="yhteystieto" v={fmt(targeted.withEmail)} />
            </dl>
          </div>

          <ul className="mt-3 space-y-1.5">
            {targeted.top.slice(0, 8).map((t) => (
              <li
                key={t.url}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-brand border border-line bg-surface-2 px-3 py-2 text-xs"
              >
                <a
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-display text-sm font-bold underline decoration-line-strong underline-offset-2 hover:decoration-forest"
                >
                  {t.title}
                </a>
                <span className="nums text-ink-2">{fmt(t.subs)} tilaajaa</span>
                <span className="rounded-brand bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-ink-2">
                  {t.nicheLabel}
                </span>
                {t.email && (
                  <span className="rounded-brand bg-blue-10 px-1.5 py-0.5 text-[11px] font-semibold text-blue">
                    sähköposti
                  </span>
                )}
                {t.trend === 'nouseva' && (
                  <span className="rounded-brand bg-forest-10 px-1.5 py-0.5 text-[11px] font-semibold text-forest">
                    nousussa
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ---------- B. the list ---------- */}
      <Section
        title="Lista"
        lead="Jokainen rivi selittää itsensä. Se on se ero niihin alustoihin jotka eivät teille toimineet, ja se on myös ainoa tapa jolla lista on tarkistettavissa yhdellä silmäyksellä."
      >
        {bounds && <Explorer creators={d.creators} bounds={bounds} />}
      </Section>

      {/* ---------- bounds and their basis ---------- */}
      {bounds && (
        <Section
          title="Rajat, ja mihin ne perustuvat"
          lead="Yhtään näistä ei ole kirjoitettu koodiin. Ne lasketaan teidän omasta aineistostanne joka ajolla, joten ne liikkuvat kun kirjaatte lopputuloksia."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <BoundCard
              k="Yläraja"
              v={fmt(bounds.takenZone)}
              unit="tilaajaa"
              basis={bounds.basis.takenZone}
              effect="−30 pistettä tämän yli"
            />
            <BoundCard
              k="Osuma-alueen mediaani"
              v={bounds.realisedMedian ? fmt(bounds.realisedMedian) : '–'}
              unit="tilaajaa"
              basis={bounds.basis.realisedMedian}
              effect="kuvaa haarukkaa, ei suoraan pisteytä"
            />
            <BoundCard
              k="TikTok-hintaraja"
              v={fmt(bounds.priceyTiktok)}
              unit="seuraajaa"
              basis={bounds.basis.priceyTiktok}
              effect="laskettu mutta lepäävä"
              dormant
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-2">
            TikTok-raja lepää siksi, että löydetyille tekijöille ei saa seuraajalukua ilman
            maksullista datalähdettä. Raja on laskettu teidän datastanne ja odottaa sitä lähdettä,
            eikä ole piilotettu.
          </p>
        </Section>
      )}

      {/* ---------- C. beside their own data ---------- */}
      <Section
        title="Teidän oma aineistonne"
        lead={`${bounds?.counts.collaborations ?? 69} toteutunutta yhteistyötä, ${bounds?.counts.creators ?? 51} tekijää, ${bounds?.counts.repeated ?? 10} toistui. Toisto on ainoa laatumittari joka aineistosta näkyy, ja siksi pisteytys rakentuu sen varaan.`}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-brand-lg border border-line bg-surface-2 p-4">
            <h3 className="font-display text-sm font-bold">Markkinat</h3>
            <p className="mt-1 text-xs text-ink-3">
              Palkki on yhteistöiden määrä. Agentuuriosuus ja toistuvat kumppanuudet oikealla.
            </p>
            <ul className="nums mt-3 space-y-1.5">
              {ownData.map((m) => (
                <li key={m.country} className="flex items-center gap-2 text-xs">
                  <span className="w-24 shrink-0 truncate text-ink-2">{m.country}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-brand bg-surface-3">
                    <div
                      className="h-full rounded-brand bg-forest-60"
                      style={{ width: `${(m.collabs / maxCollabs) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right font-semibold">{m.collabs}</span>
                  <span
                    className={`w-16 shrink-0 text-right text-[11px] font-semibold ${
                      m.agencyPct >= 60 ? 'text-critical' : 'text-ink-3'
                    }`}
                  >
                    {m.agencyPct} % ag.
                  </span>
                  <span
                    className={`w-12 shrink-0 text-right text-[11px] font-semibold ${
                      m.repeaters === 0 ? 'text-critical' : 'text-forest'
                    }`}
                  >
                    {m.repeaters} toist.
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-2">
              Saksassa kymmenen yhteistyötä, kahdeksan agentuurin kautta ja{' '}
              <strong className="font-semibold text-critical">nolla toistoa</strong>, vaikka Saksa on
              kasvumarkkina ja sinne avattiin varasto 2026. Suomessa suhde on päinvastoin. Se on syy
              siihen että kohdennettu ajo yllä osoittaa Saksaan.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-brand-lg border border-line bg-surface-2 p-4">
              <h3 className="font-display text-sm font-bold">Mitä hylkäykset opettivat</h3>
              <p className="mt-1 text-xs text-ink-3">
                {bounds?.counts.rejections ?? 26} toteutumatonta yhteistyötä syineen. Tämä yksi
                tiedosto muutti pisteytyksen rajoja neljässä kohdassa.
              </p>
              <ul className="nums mt-3 space-y-1">
                {rejections.map(([reason, n]) => (
                  <li key={reason} className="flex items-center gap-2 text-xs">
                    <span className="w-44 shrink-0 truncate text-ink-2">{reason}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-brand bg-surface-3">
                      <div
                        className="h-full rounded-brand bg-critical/60"
                        style={{ width: `${(n / rejections[0][1]) * 100}%` }}
                      />
                    </div>
                    <span className="w-4 shrink-0 text-right font-semibold">{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-brand-lg border border-line bg-surface-2 p-4">
              <h3 className="font-display text-sm font-bold">Alustat</h3>
              <p className="mt-1 text-xs text-ink-3">Missä yhteistyöt tehtiin.</p>
              <dl className="nums mt-3 space-y-2">
                <PlatformRow label="TikTok" n={platform.tiktok} total={platform.total} />
                <PlatformRow label="YouTube" n={platform.youtube} total={platform.total} />
              </dl>
              <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-2">
                TikTok tuo volyymin, YouTube tuo suhteen: toistuneista tekijöistä 60 % on
                YouTubessa, kertaluonteisista 27 %. Siksi läsnäolo molemmilla on pisteytyksen toiseksi
                vahvin signaali.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- D. validation ---------- */}
      <Section
        title="Todiste että pisteytys osuu"
        lead="Kone ajettiin tuntematta teidän kumppaneitanne."
      >
        <div className="rounded-brand-lg border border-forest bg-forest-10 p-5">
          <p className="text-sm leading-relaxed">
            Se nosti <strong className="font-semibold">{stats.knownFound.join(', ')}</strong>{' '}
            {fmt(stats.total)} tekijän joukosta, eli löysi {stats.knownFound.length} teidän omaa
            kumppaniannne ilman että niitä syötettiin sisään. Lisäksi se tunnisti{' '}
            {stats.rejectedFound.length} joita olitte jo lähestyneet ja hylänneet
            {stats.rejectedFound.length > 0 && (
              <> ({stats.rejectedFound.map((r) => `${r.title}: ${r.reason}`).join(', ')})</>
            )}
            .
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-2">
            Ne on merkitty tiedostoon ja siirretty pois kärjestä, koska ne eivät ole uusia liidejä.
            Ne ovat siellä siksi, että se on ainoa tapa osoittaa mallin osuvan oikeaan tyyppiin.
          </p>
        </div>
      </Section>

      {/* ---------- run history ---------- */}
      {runs.length > 0 && (
        <Section
          title="Ajohistoria"
          lead="Mitä pyydettiin, mitä tuli, mitkä rajat olivat voimassa. Ilman tätä kysymys mikä muuttui edelliseen verrattuna on vastaamaton."
        >
          <div className="overflow-x-auto rounded-brand-lg border border-line bg-surface-2">
            <table className="nums w-full text-xs">
              <thead>
                <tr className="border-b border-line text-left text-[11px] tracking-wide text-ink-3 uppercase">
                  <th className="px-3 py-2 font-semibold">Aika</th>
                  <th className="px-3 py-2 font-semibold">Markkinat</th>
                  <th className="px-3 py-2 font-semibold">Niche</th>
                  <th className="px-3 py-2 text-right font-semibold">Tekijöitä</th>
                  <th className="px-3 py-2 text-right font-semibold">Alle 50k</th>
                  <th className="px-3 py-2 text-right font-semibold">Yläraja</th>
                  <th className="px-3 py-2 text-right font-semibold">Kiintiö</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(0, 8).map((r, i) => (
                  <tr key={`${r.at}-${i}`} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 text-ink-2">
                      {new Date(r.at).toLocaleString('fi-FI', {
                        day: 'numeric',
                        month: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2 text-ink-2">
                      {r.request.markets.length > 3
                        ? `${r.request.markets.length} markkinaa`
                        : r.request.markets.join(', ')}
                    </td>
                    <td className="px-3 py-2 text-ink-2">
                      {r.request.niches.length ? r.request.niches.join(', ') : 'kaikki'}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{fmt(r.results)}</td>
                    <td className="px-3 py-2 text-right text-ink-2">{fmt(r.underFifty)}</td>
                    <td className="px-3 py-2 text-right text-ink-2">{fmt(r.bounds.takenZone)}</td>
                    <td className="px-3 py-2 text-right text-ink-2">{fmt(r.coldUnits ?? r.units)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}


      {/* ---------- urgency: their own inventory logic, applied to creator data ---------- */}
      <Section
        title="Miksi tämä on tuoretavaraa"
        lead="Akseli sanoi että kone on varastossa keskimäärin viikon. Sama periaate pätee tähän listaan, eikä se ole vertauskuva vaan sääntö."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-brand-lg border border-line bg-surface-2 p-5">
            <h3 className="font-display text-sm font-bold">Ehdot pakottavat kierron</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-2">
              YouTuben Developer Policies III.E.4.d: muuta kuin valtuutettua API-dataa saa säilyttää{' '}
              <em>&rdquo;not longer than 30 calendar days&rdquo;</em>, ja III.E.4.c: 30 päivän jälkeen data on
              joko poistettava tai haettava uudelleen. Pysyvä tekijätietokanta ei siis ole
              vaihtoehto, eikä se ole tämän ratkaisun puute vaan sen muoto.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-2">
              Siksi moottori säilyttää pysyvästi vain kaksi asiaa: <strong className="font-semibold">yksisuuntaisen
              tiivisteen</strong> siitä kuka on jo nähty, ja <strong className="font-semibold">teidän oman
              tulosdatanne</strong>. Tiiviste ei ole YouTube-dataa eikä sitä voi palauttaa
              tunnukseksi — se osaa vastata vain kysymykseen onko tämä nähty aiemmin. Kaikki
              mittarit haetaan uudelleen joka ajossa, ja välimuisti vanhenee 30 päivässä itsestään.
            </p>
          </div>

          <div className="rounded-brand-lg border border-line bg-surface-2 p-5">
            <h3 className="font-display text-sm font-bold">Ja siksi kiire on mitattavissa</h3>
            <p className="mt-2 text-xs leading-relaxed text-ink-2">
              Teidän oma hylkäysdatanne sanoo että yli {fmt(bounds?.takenZone ?? 110000)} tilaajan kohdalla
              joku ehti jo ensin. Se tekee koosta kellon: kysymys ei ole onko tekijä oikean kokoinen
              nyt, vaan kuinka kauan hän pysyy sellaisena.
            </p>
            <dl className="nums mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-[10px] tracking-wide text-ink-3 uppercase">nousukiidossa</dt>
                <dd className="font-display text-3xl font-extrabold text-forest">{fmt(stats.breakingOut)}</dd>
                <dd className="mt-1 text-[11px] leading-snug text-ink-3">
                  Tavoittaa jo enemmän ihmisiä kuin sillä on tilaajia, ja kasvaa. Mitattu, ei ennustettu.
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-wide text-ink-3 uppercase">kiinnitä nyt</dt>
                <dd className="font-display text-3xl font-extrabold text-amber">{fmt(stats.signNow)}</dd>
                <dd className="mt-1 text-[11px] leading-snug text-ink-3">
                  Nykytahdilla ylittää rajan alle vuodessa. Arvio kanavan omasta kasvuvauhdista, ei
                  katselupiikistä.
                </dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-2">
              Tämä kääntää koko asetelman. Listan kärki ei ole enää &rdquo;kuka on isoin jonka saa&rdquo;
              vaan <strong className="font-semibold">kuka on halvin nyt ja kallis kuuden kuukauden päästä.</strong>
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- the competitor roster: the same detection, read backwards ---------- */}
      {d.competitorPartners.length > 0 && (
        <Section
          title="Keitä kilpailijat maksavat"
          lead="Kilpailijan mainitseminen kanavan kuvauksessa on suurin yksittäinen hylkäyssyynne, joten nämä putoavat kärjestä. Toisin päin luettuna samat rivit ovat lista kilpailijoiden omista kumppaneista, ja se syntyy ilmaiseksi sivutuotteena."
        >
          <ul className="space-y-1.5">
            {d.competitorPartners.map((p) => (
              <li
                key={p.url}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-brand border border-line bg-surface-2 px-3 py-2 text-xs"
              >
                <span className="rounded-brand bg-critical-10 px-1.5 py-0.5 text-[11px] font-semibold text-critical">
                  {p.competitor}
                </span>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-display text-sm font-bold underline decoration-line-strong underline-offset-2 hover:decoration-forest"
                >
                  {p.title}
                </a>
                <span className="nums text-ink-2">{fmt(p.subs)} tilaajaa</span>
                <span className="text-ink-3">{p.country || '??'}</span>
                <span className="rounded-brand bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-ink-2">
                  {p.nicheLabel}
                </span>
                {p.rigTalk && (
                  <span className="rounded-brand bg-forest-10 px-1.5 py-0.5 text-[11px] font-semibold text-forest">
                    puhuu laitteistosta
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-ink-2">
            Nämä eivät ole liidejä tänään, koska kilpailija maksaa heille nyt. Ne ovat kaksi muuta
            asiaa: kuva siitä keitä kilpailijat sponsoroivat, ja jono siltä varalta että
            eksklusiivisuus päättyy. Kumpaakaan ei tarvinnut erikseen rakentaa.
          </p>
        </Section>
      )}

      {/* ---------- the handover, explicitly optional ---------- */}
      <Section
        title="Mitä löydön jälkeen tapahtuu"
        lead="Tämä ei kuulu haasteeseen. Sanoitte että outreach on teidän omien automaatioidenne asia, ja se kanta otetaan tässä todesta: kaikki yllä oleva toimii ilman mitään tästä osiosta."
      >
        <div className="rounded-brand-lg border border-dashed border-line-strong bg-surface-3 p-5">
          <p className="text-sm leading-relaxed">
            Kysymys tulee kuitenkin joka tapauksessa: kun listalla on {fmt(stats.fresh)} tekijää joista{' '}
            {fmt(stats.withEmail)}:llä on sähköposti, mitä niille tehdään. Vastaus on se että{' '}
            <strong className="font-semibold">luovutus ei maksa mitään</strong>, koska moottori tuottaa jo
            sen yhden asian jota lähetysmoottori ei osaa itse tuottaa: perustelun.
          </p>
          <div className="nums mt-4 grid gap-3 sm:grid-cols-4">
            <Step n="1" k="signaali" v="markkina, niche, koko" note="heidän järjestelmästään, MCP tai API" />
            <Step n="2" k="moottori" v="pisteytetyt rivit" note="perustelu joka rivillä" />
            <Step n="3" k="ihminen" v="valitsee listalta" note="ei automatisoida" />
            <Step n="4" k="lähetys" v="luonnos odottaa" note="ei lähetä itse" />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-2">
            Listassa yllä on valintaruudut ja <strong className="font-semibold">Luo kampanja</strong> -painike.
            Se rakentaa luovutuksen valituista riveistä ja näyttää tarkalleen mitä siirtyy. Ratkaiseva
            kenttä on <code className="rounded-brand bg-surface-2 px-1 py-0.5 font-mono text-[11px]">analysis</code>:
            moottorin perustelu <em>on</em> se tutkimus josta avausviesti kirjoitetaan, joten viesti osaa
            nimetä miksi juuri tämä tekijä eikä kuulosta mallipohjalta.
          </p>
          <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-2">
            Ja tässä on se syy miksi tämä kannattaa tehdä samantien eikä myöhemmin, ja miksi se on
            teidän etu eikä meidän: <strong className="font-semibold">data vanhenee 30 päivässä ehtojen
            mukaan</strong> ja tekijä kasvaa rajan yli omalla tahdillaan. Kone joka on viikon varastossa
            on liikkuvaa vaihto-omaisuutta; kone joka on kuusi kuukautta varastossa on tappio. Löydetty
            tekijä käyttäytyy täsmälleen samoin. Jos haluatte laadukkaan kontaktin ensimmäisestä
            päivästä, koko setti kontaktoidaan tuoreena — ei poimita pikkuhiljaa vanhenevasta kasasta.
          </p>
        </div>
      </Section>

      {/* ---------- the honest gap ---------- */}
      <Section
        title="Yksi puute, ja te kerroitte itse sen syyn"
        lead="Tämä on tiedossa oleva ja hinnoiteltu aukko, ei yllätys."
      >
        <div className="rounded-brand-lg border border-amber bg-amber-10 p-5">
          <p className="text-sm leading-relaxed">
            <strong className="font-semibold">Viro tuotti yhden tekijän</strong>, vaikka teillä on
            sieltä kuusi yhteistyötä. Latvia ja Liettua jäivät myös ohuiksi. Syy selvisi kun
            kertoitte miten löysitte virolaiset: <strong className="font-semibold">selasitte TikTokia Virossa.</strong>{' '}
            Tämä versio lukee YouTubea, joten se etsii väärästä paikasta juuri siinä markkinassa
            jossa teidän oma menetelmänne toimii.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-2">
            Se on johdonmukaista kaiken muun kanssa: TikTok on mukana {platform.tiktok}{' '}
            yhteistyössänne {platform.total}:stä, ja Viron YouTube-trendilistalla on vain 27 videota,
            eli pienessä markkinassa YouTube-puoli loppuu kesken. TikTokin virallinen
            tutkimusrajapinta on rajattu akateemisiin toimijoihin, joten sama löytö tehdään
            kaupallisen datapalvelun kautta maakohtaisella haulla. Kustannus on muutamia euroja
            kertaluontoisesti, ei tilausta, ja se on koko ratkaisun ainoa kohta joka ei ole ilmainen.
          </p>
        </div>
      </Section>

      <footer className="mt-16 border-t border-line pt-6 text-xs text-ink-3">
        <p>
          Kaikki luvut tällä sivulla on mitattu {d.runDate} ajetusta putkesta. Ei näytedataa, ei
          pyöristettyjä arvioita. {fmt(stats.unknownCountry)} tekijän maa jäi tuntemattomaksi ja ne
          ovat listalla merkittynä, koska tyhjä maakenttä on tavallisinta juuri niillä pienillä
          paikallisilla tekijöillä joita tämä on tarkoitettu löytämään.
        </p>
      </footer>
      </div>
    </main>
  )
}

/* ---------- pieces ---------- */

function Section({
  title,
  lead,
  children,
}: {
  title: string
  lead: string
  children: React.ReactNode
}) {
  return (
    <section className="rise mt-16">
      <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      <p className="mt-2 mb-5 max-w-3xl text-sm leading-relaxed text-ink-2">{lead}</p>
      {children}
    </section>
  )
}

function Tile({
  k,
  v,
  note,
  accent,
}: {
  k: string
  v: string
  note: string
  accent?: boolean
}) {
  return (
    <div className="deep p-4">
      <dt className="text-[11px] tracking-wide text-white/55 uppercase">{k}</dt>
      <dd
        className={`mt-1 font-display text-3xl font-extrabold tracking-tight ${
          accent ? 'text-mint' : 'text-white'
        }`}
      >
        {v}
      </dd>
      <dd className="mt-0.5 text-[11px] text-white/60">{note}</dd>
    </div>
  )
}

function MiniTile({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] tracking-wide text-ink-3 uppercase">{k}</dt>
      <dd className={`font-display text-xl font-extrabold ${accent ? 'text-forest' : 'text-ink'}`}>
        {v}
      </dd>
    </div>
  )
}

function BoundCard({
  k,
  v,
  unit,
  basis,
  effect,
  dormant,
}: {
  k: string
  v: string
  unit: string
  basis: string
  effect: string
  dormant?: boolean
}) {
  return (
    <div
      className={`rounded-brand-lg border p-4 ${
        dormant ? 'border-dashed border-line-strong bg-surface-3' : 'border-line bg-surface-2'
      }`}
    >
      <p className="text-[11px] tracking-wide text-ink-3 uppercase">{k}</p>
      <p className="nums mt-1 font-display text-2xl font-extrabold tracking-tight">
        {v} <span className="text-xs font-semibold text-ink-3">{unit}</span>
      </p>
      <p className="mt-2 text-xs leading-relaxed text-ink-2">{basis}</p>
      <p className="mt-2 border-t border-line pt-2 text-[11px] font-semibold text-ink-3">{effect}</p>
    </div>
  )
}

function Route({
  n,
  title,
  body,
  accent,
}: {
  n: string
  title: string
  body: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-brand-md border bg-white/8 p-3 ${accent ? 'border-mint/50' : 'border-white/20'}`}>
      <p className="font-display text-xs font-extrabold text-mint">{n}</p>
      <p className="font-display text-sm font-bold text-white">{title}</p>
      <p className="mt-1 text-xs leading-snug text-white/70">{body}</p>
    </div>
  )
}

function Step({ n, k, v, note }: { n: string; k: string; v: string; note: string }) {
  return (
    <div className="rounded-brand border border-line bg-surface-2 p-3">
      <p className="font-display text-xs font-extrabold text-forest">{n}</p>
      <p className="mt-0.5 text-[10px] tracking-wide text-ink-3 uppercase">{k}</p>
      <p className="font-display text-sm font-bold">{v}</p>
      <p className="mt-1 text-[10px] leading-snug text-ink-3">{note}</p>
    </div>
  )
}

function PlatformRow({ label, n, total }: { label: string; n: number; total: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <dt className="w-16 shrink-0 text-ink-2">{label}</dt>
      <div className="h-3 flex-1 overflow-hidden rounded-brand bg-surface-3">
        <div
          className="h-full rounded-brand bg-forest-60"
          style={{ width: `${(n / total) * 100}%` }}
        />
      </div>
      <dd className="w-20 shrink-0 text-right font-semibold">
        {n}/{total} · {Math.round((n / total) * 100)} %
      </dd>
    </div>
  )
}
