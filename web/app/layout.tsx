import type { Metadata } from 'next'
import { Sora, Titillium_Web } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Nav } from './nav'
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
              // The shell around the form is ours, so Clerk's own card, header and footer are
              // removed rather than restyled: two frames around one form is one too many.
              rootBox: 'w-full',
              cardBox: 'w-full border-0 shadow-none bg-transparent',
              card: 'w-full p-0 border-0 shadow-none bg-transparent gap-3',
              header: 'hidden',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden',
              footer: 'hidden',
              footerAction: 'hidden',
              logoBox: 'hidden',
              form: 'gap-3',
              formFieldRow: 'gap-3',
              formFieldLabel: 'sr-only',
              formFieldInput:
                'h-[52px] px-4 text-[17px] rounded-[12px] border border-line bg-white text-ink placeholder:text-ink-3',
              // Mint with dark text, the way their own buttons are. White on mint does not hold.
              formButtonPrimary:
                'h-[52px] text-[17px] font-semibold normal-case tracking-normal rounded-[12px] bg-mint text-ink hover:bg-mint-80 shadow-none after:hidden',
              // Email only, by request. The divider goes with them, or it separates nothing.
              socialButtons: 'hidden',
              socialButtonsBlockButton: 'hidden',
              socialButtonsProviderIcon: 'hidden',
              dividerRow: 'hidden',
              dividerText: 'hidden',
              alternativeMethods: 'hidden',
              footerActionLink: 'text-forest font-semibold',
              identityPreview: 'rounded-[12px] border border-line bg-white',
              formResendCodeLink: 'text-forest font-semibold',
              otpCodeFieldInput: 'h-[52px] text-[17px] rounded-[12px] border-line',
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
          <Nav />
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
