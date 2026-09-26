import type { Metadata } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Mono } from 'next/font/google'
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs'
import './globals.css'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  weight: ['500', '700', '800'],
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Prenew · vaikuttajalöytö',
  description:
    'Pienten pelitekijöiden löytäminen isojen ympäriltä. 474 tekijää yhdeltätoista markkinalta, 1 345 kiintiöyksiköllä.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body className={`${bricolage.variable} ${plexMono.variable} antialiased`}>
        <ClerkProvider appearance={{ variables: { colorPrimary: '#5ca83c' } }}>
          <nav className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-2.5 sm:px-8">
              <span className="font-display text-sm font-bold tracking-tight">
                antipöhinä <span className="text-ink-3">/ Prenew</span>
              </span>
              <div className="ml-auto flex items-center gap-3 text-xs">
                <Show when="signed-out">
                  <SignInButton>
                    <button className="cursor-pointer rounded-sm border border-line px-2.5 py-1 text-ink-2 transition-colors hover:text-ink">
                      Kirjaudu
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="cursor-pointer rounded-sm border border-route-comment/50 px-2.5 py-1 text-route-comment transition-colors hover:bg-route-comment/10">
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
