import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center gap-8 px-5 py-16">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Prenew · vaikuttajalöytö</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          Näkymä sisältää Prenewin omaa CRM-aineistoa, joten se ei ole julkinen.
        </p>
      </div>
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </main>
  )
}
