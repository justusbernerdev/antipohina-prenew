import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'
import { AuthShell } from '../../auth-shell'

export default function SignUpPage() {
  return (
    <AuthShell
      title="Luo tunnus"
      lead="Riittää sähköpostiosoite. Saat vahvistuskoodin sähköpostiisi."
      footer={
        <>
          Onko sinulla jo tunnus?{' '}
          <Link href="/sign-in" className="font-semibold text-forest hover:underline">
            Kirjaudu
          </Link>
        </>
      }
    >
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />
    </AuthShell>
  )
}
