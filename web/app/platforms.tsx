import type { Creator } from './types'

// Platform marks drawn inline. No network request, no icon package: a strict offline page and a
// twelve-icon dependency are both avoided by four paths.
//
// Each one links to the profile when a handle is known, because the point of showing the mark is
// that somebody can check the claim in one click.

const ICONS: Record<string, { label: string; path: string; href: (h: string) => string }> = {
  youtube: {
    label: 'YouTube',
    path: 'M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.3 5 12 5 12 5s-7.3 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.7 19 12 19 12 19s7.3 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12ZM9.8 15V9l5.2 3-5.2 3Z',
    href: (h) => (h.startsWith('@') ? `https://www.youtube.com/${h}` : h),
  },
  tiktok: {
    label: 'TikTok',
    path: 'M16.6 5.8a4.8 4.8 0 0 1-1-2.8h-3v12.2a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12V9.6a5.7 5.7 0 0 0-.78-.06 5.7 5.7 0 1 0 5.7 5.7V9.1a7.8 7.8 0 0 0 4.5 1.44V7.4a4.8 4.8 0 0 1-3.6-1.6Z',
    href: (h) => `https://www.tiktok.com/@${h.replace(/^@/, '')}`,
  },
  instagram: {
    label: 'Instagram',
    path: 'M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.25.07 1.62.07 4.81s0 3.56-.07 4.81c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.25.06-1.62.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.2 15.56 2.2 15.19 2.2 12s0-3.56.07-4.81c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.44 2.2 8.8 2.2 12 2.2Zm0 3.15a6.65 6.65 0 1 0 0 13.3 6.65 6.65 0 0 0 0-13.3Zm0 10.97a4.32 4.32 0 1 1 0-8.64 4.32 4.32 0 0 1 0 8.64Zm6.91-11.23a1.55 1.55 0 1 1-3.1 0 1.55 1.55 0 0 1 3.1 0Z',
    href: (h) => `https://instagram.com/${h.replace(/^@/, '')}`,
  },
  twitch: {
    label: 'Twitch',
    path: 'M4.3 2 2.5 6.4v14.1h4.9V23h2.7l2.5-2.5h4L21.5 15V2H4.3Zm15.4 12.2-2.8 2.8h-4.4l-2.5 2.4V17H6.2V3.8h13.5v10.4ZM15.9 7.1v5.2h-1.8V7.1h1.8Zm-4.9 0v5.2H9.2V7.1H11Z',
    href: (h) => `https://twitch.tv/${h}`,
  },
  facebook: {
    label: 'Facebook',
    path: 'M22 12a10 10 0 1 0-11.6 9.9v-7h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.45 2.9h-2.35v7A10 10 0 0 0 22 12Z',
    href: (h) => `https://facebook.com/${h}`,
  },
  twitter: {
    label: 'X',
    path: 'M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.04l12.04 15.64Z',
    href: (h) => `https://x.com/${h.replace(/^@/, '')}`,
  },
}

const ORDER = ['youtube', 'tiktok', 'instagram', 'twitch', 'facebook', 'twitter']

export function Platforms({ c, size = 16 }: { c: Creator; size?: number }) {
  const handles: Record<string, string | null> = {
    youtube: c.handle || c.url,
    tiktok: c.tiktok && c.tiktok !== '(linkki)' ? c.tiktok : null,
    instagram: c.instagram,
    twitch: c.twitch,
    facebook: null,
    twitter: null,
  }

  const present = ORDER.filter((p) => c.platforms.includes(p))

  return (
    <span className="inline-flex items-center gap-1.5">
      {present.map((p) => {
        const icon = ICONS[p]
        const h = handles[p]
        const on = p === 'youtube' ? 'text-ink' : 'text-forest'
        const mark = (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d={icon.path} />
          </svg>
        )
        // A mark without a link is still information: it says the creator is there, which is what
        // the score used. It just cannot be clicked.
        return h ? (
          <a
            key={p}
            href={icon.href(h)}
            target="_blank"
            rel="noreferrer"
            title={`${icon.label}${h.startsWith('http') ? '' : ` · ${h}`}`}
            className={`${on} transition-opacity hover:opacity-60`}
          >
            {mark}
          </a>
        ) : (
          <span key={p} title={icon.label} className="text-ink-4">
            {mark}
          </span>
        )
      })}
    </span>
  )
}
