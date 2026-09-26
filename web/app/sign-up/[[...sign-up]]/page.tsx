import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center gap-8 px-5 py-16">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Luo tunnus</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">
          Tunnus tarvitaan koska näkymässä on Prenewin omaa CRM-aineistoa.
        </p>
      </div>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </main>
  )
}
