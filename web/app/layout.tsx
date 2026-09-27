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
        {/* Prenew's own values, so the form reads as part of the page rather than bolted onto it.
            Radii stay in their 0.25rem–1.5rem range. */}
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: '#256f50',
              colorPrimaryForeground: '#ffffff',
              colorBackground: '#ffffff',
              colorForeground: '#1d1d35',
              colorMutedForeground: '#565668',
              colorInput: '#ffffff',
              colorInputForeground: '#1d1d35',
              colorBorder: '#e2e2ee',
              colorRing: '#0a74ff',
              colorDanger: '#d32f26',
              borderRadius: '0.25rem',
              fontFamily: 'var(--font-titillium), ui-sans-serif, system-ui, sans-serif',
            },
            elements: {
              card: 'shadow-none border border-line',
              rootBox: 'w-full',
              cardBox: 'w-full shadow-none border border-line',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              // Mint with dark text is what their own buttons are. White on mint does not hold.
              formButtonPrimary:
                'bg-mint text-ink hover:bg-mint-80 font-semibold normal-case tracking-normal shadow-none',
              footerActionLink: 'text-forest font-semibold',
            },
          }}
          // The rest of the page is Finnish, so an English form reads as someone else's component
          // bolted on. Only the strings that actually appear are translated: adding
          // @clerk/localizations for full coverage is a dependency, and this is not.
          localization={{
            formFieldLabel__emailAddress: 'Sähköpostiosoite',
            formFieldInputPlaceholder__emailAddress: 'nimi@yritys.fi',
            formFieldLabel__password: 'Salasana',
            formFieldInputPlaceholder__password: 'Salasanasi',
            formFieldLabel__firstName: 'Etunimi',
            formFieldLabel__lastName: 'Sukunimi',
            formFieldLabel__emailAddress_username: 'Sähköposti tai käyttäjätunnus',
            formButtonPrimary: 'Jatka',
            dividerText: 'tai',
            socialButtonsBlockButton: 'Jatka: {{provider}}',
            backButton: 'Takaisin',
            footerActionLink__useAnotherMethod: 'Käytä toista tapaa',
            signIn: {
              start: {
                title: 'Kirjaudu',
                subtitle: '',
                actionText: 'Eikö sinulla ole tunnusta?',
                actionLink: 'Luo tunnus',
              },
              password: { title: 'Syötä salasana', subtitle: '', actionLink: 'Käytä toista tapaa' },
              emailCode: {
                title: 'Tarkista sähköpostisi',
                subtitle: 'Lähetimme koodin osoitteeseen {{identifier}}',
                formTitle: 'Vahvistuskoodi',
                resendButton: 'Lähetä uusi koodi',
              },
            },
            signUp: {
              start: {
                title: 'Luo tunnus',
                subtitle: '',
                actionText: 'Onko sinulla jo tunnus?',
                actionLink: 'Kirjaudu',
              },
              emailCode: {
                title: 'Vahvista sähköpostisi',
                subtitle: 'Lähetimme koodin osoitteeseen {{identifier}}',
                formTitle: 'Vahvistuskoodi',
                resendButton: 'Lähetä uusi koodi',
              },
            },
          }}
        >
          <nav className="deep sticky top-0 z-20">
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-8">
              <span className="font-display text-sm font-bold tracking-tight text-mint">
                antipöhinä <span className="font-normal text-white/60">/ Prenew</span>
              </span>
              <div className="ml-auto flex items-center gap-3 text-xs">
                <Show when="signed-out">
                  <SignInButton>
                    <button className="cursor-pointer rounded-brand-md border border-white/30 px-3 py-1.5 font-semibold text-white/85 transition-colors hover:border-white/60 hover:text-white">
                      Kirjaudu
                    </button>
                  </SignInButton>
                  <SignUpButton>
                    <button className="cursor-pointer rounded-brand-md bg-mint px-3 py-1.5 font-semibold text-ink transition-colors hover:bg-mint-80">
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
