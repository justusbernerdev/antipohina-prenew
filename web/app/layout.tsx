import type { Metadata } from 'next'
import { Sora, Titillium_Web } from 'next/font/google'
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs'
import './globals.css'
import data from './data.json'

// Prenew's own two typefaces, read from their site's CSS: Sora for display, Titillium Web for
// body and UI. Both are on Google Fonts.
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['500', '600', '700', '800'],
})

const titillium = Titillium_Web({
  subsets: ['latin'],
  variable: '--font-titillium',
  weight: ['400', '600', '700'],
})

const d = data as { stats: { total: number }; quotaUnits: number | null }

export const metadata: Metadata = {
  title: 'Prenew · vaikuttajalöytö',
  description: `Pienten pelitekijöiden löytäminen isojen ympäriltä. ${d.stats.total} tekijää yhdeltätoista markkinalta, ${d.quotaUnits} kiintiöyksiköllä.`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body className={`${sora.variable} ${titillium.variable} antialiased`}>
        <ClerkProvider appearance={{ variables: { colorPrimary: '#256f50' } }}>
          <nav className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-8">
              <span className="font-display text-sm font-bold tracking-tight">
                antipöhinä <span className="font-normal text-ink-3">/ Prenew</span>
              </span>
              <div className="ml-auto flex items-center gap-3 text-xs">
                <Show when="signed-out">
                  <SignInButton>
                    <button className="cursor-pointer rounded-brand border border-line-strong px-3 py-1.5 font-semibold text-ink-2 transition-colors hover:border-ink-3 hover:text-ink">
                      Kirjaudu
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="cursor-pointer rounded-brand bg-forest px-3 py-1.5 font-semibold text-white transition-colors hover:bg-forest-80">
                      Luo tunnus
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </div>
          </nav>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
