import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// The view contains Prenew's own CRM data (who was rejected and why, agency share per market),
// so nothing here is public. Everything except the sign-in route requires an account.
const isPublic = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublic(req)) return
  // Without unauthenticatedUrl, protect() answers 404 instead of sending people to sign in.
  await auth.protect({
    unauthenticatedUrl: new URL('/sign-in', req.url).toString(),
    unauthorizedUrl: new URL('/sign-in', req.url).toString(),
  })
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
}
