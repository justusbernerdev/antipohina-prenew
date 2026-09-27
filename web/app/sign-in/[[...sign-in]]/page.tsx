import { SignIn } from '@clerk/nextjs'
import { AuthSplit } from '../../auth-split'

export default function SignInPage() {
  return (
    <AuthSplit title="Kirjaudu" lead="Sähköpostiosoitteella. Saat koodin sähköpostiin, ei salasanaa muistettavaksi.">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
    </AuthSplit>
  )
}
