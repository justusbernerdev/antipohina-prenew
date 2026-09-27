import Link from 'next/link'
import { SignIn } from '@clerk/nextjs'
import { AuthShell } from '../../auth-shell'

export default function SignInPage() {
  return (
    <AuthShell
      title="Kirjaudu"
      lead="Sähköpostilla. Saat vahvistuskoodin sähköpostiisi."
      footer={
        <>
          Ei tunnusta?{' '}
          <Link href="/sign-up" className="font-semibold text-forest hover:underline">
            Luo tunnus
          </Link>
        </>
      }
    >
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
    </AuthShell>
  )
}
