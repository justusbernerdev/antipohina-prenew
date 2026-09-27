'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSignIn, useSignUp } from '@clerk/nextjs'

// Our own form on Clerk's headless hooks, not Clerk's rendered component.
//
// One email field. Submitting it tries to sign in; if the address is not known yet it creates the
// account instead, in the same step. The person does not have to know in advance whether they have
// an account, which is the difference between two screens and one.
//
// This Clerk version returns errors as values rather than throwing: every call resolves to
// `{ error }`, so the flow reads as a sequence of checks instead of a stack of try/catch.
//
// Measurements come from the handed-over design: 52px controls, 12px radius, 17px text, 12px gap.

type Step = 'email' | 'code' | 'password'
type Mode = 'signIn' | 'signUp'
type ClerkErr = { code: string; message: string; longMessage?: string } | null

const CONTROL = 'h-[52px] w-full rounded-[12px] px-4 text-[17px] outline-none transition-colors'

const INPUT = `${CONTROL} border border-line bg-white text-ink placeholder:text-ink-3 focus:border-forest focus:ring-3 focus:ring-forest/15`

const BUTTON = `${CONTROL} cursor-pointer border-0 bg-mint font-semibold text-ink transition-colors hover:bg-mint-80 disabled:cursor-not-allowed disabled:opacity-55`

// Clerk's machine-stable codes, in words a person can act on.
function message(err: ClerkErr): string {
  switch (err?.code) {
    case 'form_identifier_not_found':
      return 'Tuntematon sähköpostiosoite.'
    case 'form_identifier_exists':
      return 'Tunnus on jo olemassa. Kirjaudu sisään.'
    case 'form_code_incorrect':
    case 'verification_failed':
      return 'Koodi ei täsmää. Tarkista numerot tai pyydä uusi.'
    case 'verification_expired':
      return 'Koodi vanheni. Pyydä uusi.'
    case 'form_param_format_invalid':
      return 'Tarkista sähköpostiosoitteen muoto.'
    case 'too_many_requests':
      return 'Liian monta yritystä. Odota hetki ja kokeile uudestaan.'
    default:
      return err?.longMessage || err?.message || 'Jokin meni pieleen. Yritä uudelleen.'
  }
}

export function AuthForm({ start = 'signIn' }: { start?: Mode }) {
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()

  const [step, setStep] = useState<Step>('email')
  const [mode, setMode] = useState<Mode>(start)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resent, setResent] = useState(false)
  const [password, setPassword] = useState('')

  // Ask Clerk to email a code. Tries signing in first and falls back to creating the account,
  // because "I do not have an account yet" is not something the person should have to declare.
  async function sendCode(address: string): Promise<ClerkErr> {
    const attempt = await signIn.emailCode.sendCode({ emailAddress: address })
    if (!attempt.error) {
      setMode('signIn')
      return null
    }

    // Any failure here may simply mean "no account yet". The code naming this differs between
    // Clerk versions — an earlier build checked only for form_identifier_not_found and this
    // instance answers something else, which left a first-time visitor staring at "Couldn't find
    // your account" with no way forward.
    //
    // So a sign-up is attempted regardless. If that comes back saying the account already exists,
    // the original sign-in error was the real one and it is the one reported.
    const created = await signUp.create({ emailAddress: address })
    if (created.error) {
      const exists = /exists|taken|duplicate/i.test(created.error.code || '')
      return (exists ? attempt.error : created.error) as ClerkErr
    }
    const sent = await signUp.verifications.sendEmailCode()
    if (sent.error) return sent.error as ClerkErr
    setMode('signUp')
    return null
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault()
    if (busy || !email.trim()) return
    setBusy(true)
    setError(null)
    const err = await sendCode(email.trim())
    setBusy(false)
    if (err) setError(message(err))
    else setStep('code')
  }

  async function onCode(e: React.FormEvent) {
    e.preventDefault()
    if (busy || code.length < 6) return
    setBusy(true)
    setError(null)

    const verified =
      mode === 'signIn'
        ? await signIn.emailCode.verifyCode({ code })
        : await signUp.verifications.verifyEmailCode({ code })

    if (verified.error) {
      setBusy(false)
      setError(message(verified.error as ClerkErr))
      return
    }

    // A Clerk instance can require a password even when the code is the first factor. Rather than
    // asking for one up front and adding friction to every sign-up, it is asked for only when the
    // instance actually says it is missing.
    if (mode === 'signUp' && signUp.status === 'missing_requirements') {
      setBusy(false)
      if (signUp.missingFields?.includes('password')) {
        setStep('password')
        return
      }
      setError('Tunnuksen luonti vaatii lisätietoja joita tämä lomake ei kysy.')
      return
    }

    // finalize is what makes the new session the active one.
    const done = mode === 'signIn' ? await signIn.finalize() : await signUp.finalize()
    setBusy(false)
    if (done.error) {
      setError(message(done.error as ClerkErr))
      return
    }
    router.push('/')
  }

  async function onPassword(e: React.FormEvent) {
    e.preventDefault()
    if (busy || password.length < 8) return
    setBusy(true)
    setError(null)
    const set = await signUp.password({ password })
    if (set.error) {
      setBusy(false)
      setError(message(set.error as ClerkErr))
      return
    }
    const done = await signUp.finalize()
    setBusy(false)
    if (done.error) {
      setError(message(done.error as ClerkErr))
      return
    }
    router.push('/')
  }

  async function resend() {
    if (busy) return
    setBusy(true)
    setError(null)
    // A sign-in already exists at this point, so no address is passed: Clerk reuses it.
    const again =
      mode === 'signIn' ? await signIn.emailCode.sendCode() : await signUp.verifications.sendEmailCode()
    setBusy(false)
    if (again.error) setError(message(again.error as ClerkErr))
    else setResent(true)
  }

  if (step === 'password') {
    return (
      <form onSubmit={onPassword} className="flex flex-col gap-3">
        <p className="text-[15px] leading-snug text-ink-2">
          Sähköposti on vahvistettu. Aseta vielä salasana, niin tunnus on valmis.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(null)
          }}
          autoComplete="new-password"
          autoFocus
          minLength={8}
          placeholder="Salasana, vähintään 8 merkkiä"
          aria-label="Salasana"
          className={INPUT}
        />
        <button type="submit" disabled={busy || password.length < 8} className={BUTTON}>
          {busy ? 'Luodaan…' : 'Valmis'}
        </button>
        {error && <p className="text-[15px] text-critical">{error}</p>}
      </form>
    )
  }

  if (step === 'code') {
    return (
      <form onSubmit={onCode} className="flex flex-col gap-3">
        <p className="text-[15px] leading-snug text-ink-2">
          Lähetimme koodin osoitteeseen <strong className="font-semibold text-ink">{email}</strong>.
        </p>

        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            setError(null)
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="6-numeroinen koodi"
          aria-label="Vahvistuskoodi"
          className={`${INPUT} tracking-[0.3em]`}
        />

        <button type="submit" disabled={busy || code.length < 6} className={BUTTON}>
          {busy ? 'Tarkistetaan…' : mode === 'signUp' ? 'Luo tunnus' : 'Kirjaudu'}
        </button>

        {error && <p className="text-[15px] text-critical">{error}</p>}

        <div className="flex items-center gap-4 text-[15px]">
          <button
            type="button"
            onClick={() => {
              setStep('email')
              setCode('')
              setError(null)
              setResent(false)
            }}
            className="cursor-pointer text-ink-2 hover:underline"
          >
            Vaihda osoite
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={busy}
            className="cursor-pointer font-semibold text-forest hover:underline disabled:opacity-50"
          >
            {resent ? 'Uusi koodi lähetetty' : 'Lähetä uusi koodi'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={onEmail} className="flex flex-col gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          setError(null)
        }}
        autoComplete="email"
        autoFocus
        required
        placeholder="Sähköposti"
        aria-label="Sähköpostiosoite"
        className={INPUT}
      />

      <button type="submit" disabled={busy || !email.trim()} className={BUTTON}>
        {busy ? 'Lähetetään…' : 'Jatka'}
      </button>

      {error && <p className="text-[15px] text-critical">{error}</p>}

      {/* Clerk runs its bot check into this element. Invisible, and required for sign-up to
          succeed on a development instance. */}
      <div id="clerk-captcha" />
    </form>
  )
}
