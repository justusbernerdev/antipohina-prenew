import data from './data.json'

const d = data as unknown as {
  stats: { fresh: number; small: number; viaCommenter: number; withEmail: number }
  quotaUnits: number | null
  dailyQuota: number
}

const fmt = (n: number) => n.toLocaleString('fi-FI')

// Both auth pages are the same layout: what this is on one side, the form on the other.
//
// On a narrow screen the form comes first. Somebody opening this on a phone wants to sign in, not
// read a pitch, and the pitch is still there underneath it.
export function AuthSplit({
  title,
  lead,
  children,
}: {
  title: string
  lead: string
  children: React.ReactNode
}) {
  const { stats } = d

  return (
    <div className="grid min-h-[calc(100dvh-53px)] lg:grid-cols-2">
      {/* ---------- the form ---------- */}
      <div className="order-1 flex flex-col items-center justify-center bg-surface px-5 py-12 lg:order-2 sm:px-8">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{lead}</p>
          <div className="mt-6 flex justify-center">{children}</div>
        </div>
      </div>

      {/* ---------- what is behind it ---------- */}
      <aside className="deep order-2 flex flex-col justify-center px-5 py-12 lg:order-1 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          <p className="text-xs font-semibold tracking-wider text-mint uppercase">
            Prenew challenge · tiimi antipöhinä
          </p>

          <h2 className="mt-4 font-display text-3xl leading-[1.05] font-extrabold tracking-tight">
            Pienet tekijät löytyvät{' '}
            <span className="text-mint">isojen vierestä</span>, eivät hakemalla.
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-white/75">
            Engine joka etsii pelitekijöitä sieltä mistä vaikuttaja-alustat eivät niitä löydä:
            kansallisen pelilistan tekijöiden kommentoijista. Jokaisella rivillä on perustelu miksi
            se on siellä.
          </p>

          <dl className="nums mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
            <Stat k="tekijää" v={fmt(stats.fresh)} note="yhdeltätoista markkinalta" />
            <Stat k="alle 50k tilaajaa" v={fmt(stats.small)} note="pieni häntä, eli se vaikea osa" />
            <Stat
              k="kommentoijareitistä"
              v={fmt(stats.viaCommenter)}
              note="ei löydettävissä alustoilta"
            />
            <Stat
              k="kiintiö"
              v={`${Math.round(((d.quotaUnits ?? 0) / d.dailyQuota) * 100)} %`}
              note="päivän ilmaisbudjetista, eli ajo on ilmainen"
            />
          </dl>

          <p className="mt-8 border-t border-white/20 pt-4 text-xs leading-relaxed text-white/65">
            Näkymässä on Prenewin omaa CRM-aineistoa — kuka hylättiin ja miksi, agentuuriosuus
            markkinoittain — joten se ei ole julkinen. Siksi tunnus.
          </p>
        </div>
      </aside>
    </div>
  )
}

function Stat({ k, v, note }: { k: string; v: string; note: string }) {
  return (
    <div>
      <dt className="text-[10px] tracking-wide text-white/55 uppercase">{k}</dt>
      <dd className="font-display text-3xl font-extrabold tracking-tight text-mint">{v}</dd>
      <dd className="mt-0.5 text-[11px] leading-snug text-white/60">{note}</dd>
    </div>
  )
}
