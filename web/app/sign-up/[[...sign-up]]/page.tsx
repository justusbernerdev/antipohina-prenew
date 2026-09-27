import { SignUp } from '@clerk/nextjs'
import { AuthSplit } from '../../auth-split'

export default function SignUpPage() {
  return (
    <AuthSplit title="Luo tunnus" lead="Sähköposti ja salasana, tai Google. Vie puoli minuuttia.">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />
    </AuthSplit>
  )
}
