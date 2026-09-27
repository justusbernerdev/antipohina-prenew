import { SignIn } from '@clerk/nextjs'
import { AuthSplit } from '../../auth-split'

export default function SignInPage() {
  return (
    <AuthSplit title="Kirjaudu" lead="Sähköpostilla tai Googlella. Ei muuta.">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
    </AuthSplit>
  )
}
