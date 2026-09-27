import type { Creator } from './types'

// The browser's copy of scripts/analysis.mjs. The engine writes this text into files and returns it
// over MCP; the view has to show the same sentences, or the screen would promise one briefing and
// the export would deliver another.
//
// Two copies of the same prose is a real risk of drift. It is accepted here because the alternative
// is making the Node module importable from a client component, and every sentence is short enough
// that a difference would be visible in the demo immediately.

const fmt = (n: number) => n.toLocaleString('fi-FI')

const NATIONALITY: Record<string, string> = {
  FI: 'suomalainen',
  SE: 'ruotsalainen',
  DE: 'saksalainen',
  EE: 'virolainen',
  HU: 'unkarilainen',
  LV: 'latvialainen',
  LT: 'liettualainen',
  PL: 'puolalainen',
  DK: 'tanskalainen',
  NL: 'hollantilainen',
  FR: 'ranskalainen',
}

export function analysisFor(r: Creator) {
  const s: string[] = []

  const who = r.country
    ? `${NATIONALITY[r.country] || `${r.country}-maalainen`} YouTube-tekijä`
    : 'YouTube-tekijä, maa ei varmistunut'
  s.push(
    `${r.title} on ${who}, ${fmt(r.subs)} tilaajaa ja ${
      r.avgViews != null ? `${fmt(r.avgViews)} katselua per video` : 'katselutieto puuttuu'
    }${r.viewWindow ? ` (${r.viewWindow} ikkuna)` : ''}.`,
  )

  if (r.nicheLabel && r.nicheLabel !== 'Tuntematon') {
    const extra = r.games.slice(1, 3)
    s.push(`Sisältö: ${r.nicheLabel}${extra.length ? ` (myös ${extra.join(' ja ')})` : ''}.`)
  }

  if (r.viewRatio) {
    s.push(
      `Yleisö on aktiivinen: video tavoittaa ${Math.round(r.viewRatio * 100)} % tilaajamäärästä, ja kanava julkaisee ${
        r.uploadsPerMonth ?? '?'
      } videota kuussa${r.daysSinceUpload != null ? `, edellisestä ${r.daysSinceUpload} päivää` : ''}.`,
    )
  }

  if (r.breakingOut) {
    s.push(
      `Tämä on nousukiidossa: tavoittaa enemmän ihmisiä kuin sillä on tilaajia ja katselut kasvavat ${r.trendPct} %. Nyt se on vielä ${fmt(
        r.subs,
      )} tilaajan kokoinen.`,
    )
  } else if (r.signNow && r.subsPerMonth != null) {
    s.push(
      `Kasvaa noin ${fmt(r.subsPerMonth)} tilaajaa kuussa, eli arviolta ${r.monthsToBound} kuukautta siihen kokoon jossa Prenewin oman datan mukaan tekijät ovat yleensä jo varattuja.`,
    )
  } else if (r.trend) {
    s.push(`Katselutrendi: ${r.trend}${r.trendPct != null ? ` (${r.trendPct > 0 ? '+' : ''}${r.trendPct} %)` : ''}.`)
  }

  if (r.rigTalk) {
    s.push(
      'Tekijä luettelee oman kokoonpanonsa kanavan tiedoissa, eli puhuu laitteistosta jo nyt omasta aloitteestaan. Kone ei ole hänen kanavallaan väkinäinen aihe.',
    )
  }

  if (r.hardwareSponsor && !r.competitor) {
    s.push(
      `On tehnyt laitteistoyhteistyön aiemmin (${r.hardwareSponsor}), eli tuntee tämän muotoisen diilin. Kyseessä on komponenttibrändi eikä kilpaileva konekauppa.`,
    )
  }

  if (r.parentsChoice) {
    s.push(
      'Kanava on merkitty lapsiystävälliseksi tekijän omin sanoin, eli vanhempi on yleisössä. Tämä osuu Prenewin Vanhempien valinta -kategoriaan, jossa ostaja on aikuinen ja käyttäjä lapsi.',
    )
  } else if (r.audience === 'nuori') {
    s.push('Yleisö painottuu nuoriin, eli ostopäätöksen tekee vanhempi.')
  }

  const others = r.platforms.filter((p) => p !== 'youtube')
  if (others.length) {
    s.push(
      `Myös muilla alustoilla: ${others.join(', ')}${
        r.tiktok && r.tiktok !== '(linkki)' ? ` (TikTok @${r.tiktok})` : ''
      }. Prenewin omassa datassa toistuvat kumppanit ovat tyypillisesti sekä YouTubessa että TikTokissa.`,
    )
  }

  s.push(
    `Löytyi ${
      r.via === 'commenter'
        ? 'kommentoijareitistä, eli ei ole vaikuttaja-alustoilla löydettävissä'
        : 'maakohtaiselta pelilistalta'
    }.`,
  )
  s.push(`Pisteytys ${r.score}. Perustelu koneelta: ${r.reason}`)

  return s.join(' ')
}

// The exact shape an outreach engine's add-leads call takes, so the handover needs no translation.
export function leadFor(r: Creator) {
  return {
    firstName: r.title,
    lastName: '',
    company: r.title,
    ...(r.email ? { email: r.email } : {}),
    jobTitle: `YouTube-sisällöntuottaja${r.nicheLabel && r.nicheLabel !== 'Tuntematon' ? ` · ${r.nicheLabel}` : ''}`,
    analysis: analysisFor(r),
    mediaLinkUrl: r.url,
  }
}
