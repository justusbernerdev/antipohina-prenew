import Link from 'next/link'
import { AuthForm } from '../auth-form'
import { AuthShell } from '../auth-shell'

export default function SignUpPage() {
  return (
    <AuthShell
      title="Luo tunnus"
      lead="Riittää sähköpostiosoite. Saat koodin postiisi."
      footer={
        <>
          Onko sinulla jo tunnus?{' '}
          <Link href="/sign-in" className="font-semibold text-forest hover:underline">
            Kirjaudu
          </Link>
        </>
      }
    >
      <AuthForm start="signUp" />
    </AuthShell>
  )
}
