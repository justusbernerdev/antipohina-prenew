'use client'

import { usePathname } from 'next/navigation'
import { SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs'

// The auth pages carry their own wordmark inside the centred column, so the global bar would be a
// second one on the same screen. It is hidden there rather than duplicated.
const HIDDEN_ON = /^\/(sign-in|sign-up)/

export function Nav() {
  const pathname = usePathname()
  if (HIDDEN_ON.test(pathname || '')) return null

  return (
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
  )
}
