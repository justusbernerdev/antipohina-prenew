import { AuthForm } from '../auth-form'
import { AuthShell } from '../auth-shell'

export default function SignInPage() {
  return (
    <AuthShell
      title="Kirjaudu"
      lead="Sähköpostilla. Saat koodin postiisi, ei salasanaa muistettavaksi."
      // One field does both, so there is nothing to choose between and no second page to send
      // anybody to.
      footer="Ei tunnusta? Syötä sähköpostisi, niin tunnus syntyy samalla."
    >
      <AuthForm start="signIn" />
    </AuthShell>
  )
}
