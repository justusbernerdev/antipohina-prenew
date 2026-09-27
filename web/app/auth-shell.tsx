// The auth pages: one centred column, 380px wide, on the almost-white surface.
//
// Measurements come from the design handed over for this screen — 40px between blocks, 32px title
// at 1.15 line height and -0.02em tracking, 52px tall controls with a 12px radius, 17px body. The
// colours are Prenew's own variables rather than the mock's near-identical hex values, so there is
// one source of truth for the brand and the rest of the app cannot drift from it.
export function AuthShell({
  title,
  lead,
  children,
  footer,
}: {
  title: string
  lead: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-5 py-12">
      <div className="flex w-full max-w-[380px] flex-col gap-10">
        <div className="font-display text-[15px] font-bold text-ink">
          antipöhinä <span className="font-semibold text-ink-3">/ Prenew</span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[32px] leading-[1.15] font-bold tracking-[-0.02em]">
            {title}
          </h1>
          <p className="text-[17px] leading-snug text-ink-2">{lead}</p>
        </div>

        {children}

        <p className="text-[15px] text-ink-2">{footer}</p>
      </div>
    </main>
  )
}
