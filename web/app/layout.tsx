import type { Metadata } from 'next'
import { Sora, Titillium_Web } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
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

// ClerkProvider carries no appearance or localization: the sign-in form is ours and Clerk renders
// nothing on screen. Only the session and the headless hooks come from it. Those overrides existed
// while Clerk's own component was on the page, and leaving them behind would be configuration nobody reads.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body className={`${sora.variable} ${titillium.variable} antialiased`}>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
