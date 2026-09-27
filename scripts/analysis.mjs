// The briefing text that travels with a creator when they are handed to an outreach engine.
//
// One source of truth on purpose. scripts/to-selda.mjs writes it to a file, the MCP server returns
// it over the wire, and the view previews it in the browser — if those three drifted, the demo would
// promise one thing and the file would deliver another.
//
// Every sentence is measured. This field is what an outreach engine composes the opening message
// from, so an invented claim here becomes an invented claim in something a person receives.

const fmt = (n) => Number(n).toLocaleString('fi-FI')

// Selda writes the message from this text, so it should read like Finnish rather than like a code.
const NATIONALITY = {
  FI: 'suomalainen', SE: 'ruotsalainen', DE: 'saksalainen', EE: 'virolainen', HU: 'unkarilainen',
  LV: 'latvialainen', LT: 'liettualainen', PL: 'puolalainen', DK: 'tanskalainen',
  NL: 'hollantilainen', FR: 'ranskalainen',
}

export function analysisFor(r) {
  const s = []

  const who = r.country
    ? `${NATIONALITY[r.country] || `${r.country}-maalainen`} YouTube-tekijä`
    : 'YouTube-tekijä, maa ei varmistunut'
  s.push(
    `${r.title} on ${who}, ${fmt(r.subs)} tilaajaa ja ` +
      `${r.avgViews != null ? `${fmt(r.avgViews)} katselua per video` : 'katselutieto puuttuu'}` +
      `${r.viewWindow ? ` (${r.viewWindow} ikkuna)` : ''}.`,
  )

  if (r.nicheLabel && r.nicheLabel !== 'Tuntematon') {
    // At most two extra games: a channel that matches five is a generic gaming channel, and
    // listing all five would make the opening message sound like it was written from a spreadsheet.
    const extra = (r.games || []).slice(1, 3)
    s.push(`Sisältö: ${r.nicheLabel}${extra.length ? ` (myös ${extra.join(' ja ')})` : ''}.`)
  }

  if (r.viewRatio) {
    s.push(
      `Yleisö on aktiivinen: video tavoittaa ${Math.round(r.viewRatio * 100)} % tilaajamäärästä, ` +
        `ja kanava julkaisee ${r.uploadsPerMonth ?? '?'} videota kuussa` +
        `${r.daysSinceUpload != null ? `, edellisestä ${r.daysSinceUpload} päivää` : ''}.`,
    )
  }

  if (r.breakingOut) {
    s.push(
      `Tämä on nousukiidossa: tavoittaa enemmän ihmisiä kuin sillä on tilaajia ja katselut kasvavat ` +
        `${r.trendPct} %. Nyt se on vielä ${fmt(r.subs)} tilaajan kokoinen.`,
    )
  } else if (r.signNow && r.subsPerMonth != null) {
    s.push(
      `Kasvaa noin ${fmt(r.subsPerMonth)} tilaajaa kuussa, eli arviolta ${r.monthsToBound} kuukautta ` +
        `siihen kokoon jossa Prenewin oman datan mukaan tekijät ovat yleensä jo varattuja.`,
    )
  } else if (r.trend) {
    s.push(`Katselutrendi: ${r.trend}${r.trendPct != null ? ` (${r.trendPct > 0 ? '+' : ''}${r.trendPct} %)` : ''}.`)
  }

  if (r.rigTalk) {
    s.push(
      'Tekijä luettelee oman kokoonpanonsa kanavan tiedoissa, eli puhuu laitteistosta jo nyt ' +
        'omasta aloitteestaan. Kone ei ole hänen kanavallaan väkinäinen aihe.',
    )
  }

  if (r.hardwareSponsor && !r.competitor) {
    s.push(
      `On tehnyt laitteistoyhteistyön aiemmin (${r.hardwareSponsor}), eli tuntee tämän muotoisen ` +
        'diilin. Kyseessä on komponenttibrändi eikä kilpaileva konekauppa.',
    )
  }

  if (r.parentsChoice) {
    s.push(
      'Kanava on merkitty lapsiystävälliseksi tekijän omin sanoin, eli vanhempi on yleisössä. ' +
        'Tämä osuu Prenewin Vanhempien valinta -kategoriaan, jossa ostaja on aikuinen ja käyttäjä lapsi.',
    )
  } else if (r.audience === 'nuori') {
    s.push('Yleisö painottuu nuoriin, eli ostopäätöksen tekee vanhempi.')
  }

  const others = (r.platforms || []).filter((p) => p !== 'youtube')
  if (others.length) {
    s.push(
      `Myös muilla alustoilla: ${others.join(', ')}` +
        `${r.tiktok && r.tiktok !== '(linkki)' ? ` (TikTok @${r.tiktok})` : ''}. ` +
        'Prenewin omassa datassa toistuvat kumppanit ovat tyypillisesti sekä YouTubessa että TikTokissa.',
    )
  }

  s.push(
    `Löytyi ${r.via === 'commenter' ? 'kommentoijareitistä, eli ei ole vaikuttaja-alustoilla löydettävissä' : 'maakohtaiselta pelilistalta'}.`,
  )
  s.push(`Pisteytys ${r.score}. Perustelu koneelta: ${r.reason}`)

  return s.join(' ')
}

// One creator as an outreach-engine lead. This is the exact shape Selda's selda_add_leads takes,
// which is what makes the handover a single call with no transformation in between.
export function leadFor(r) {
  return {
    // A creator is a one-person company, so the channel is both the name and the company.
    firstName: r.title,
    lastName: '',
    company: r.title,
    ...(r.email ? { email: r.email } : {}),
    jobTitle: `YouTube-sisällöntuottaja${r.nicheLabel && r.nicheLabel !== 'Tuntematon' ? ` · ${r.nicheLabel}` : ''}`,
    analysis: analysisFor(r),
    // Where a human verifies the claim in one click.
    mediaLinkUrl: r.url,
  }
}

// Who is worth handing over. The engine's own marks do the filtering: an existing partner is not a
// lead, someone they already rejected is not a lead, and a creator who promotes a competing shop is
// a different conversation that belongs in the competitor roster instead.
export function handoverCandidates(creators, { requireEmail = false } = {}) {
  return creators
    .filter((r) => !r.known && !r.rejected && !r.competitor)
    .filter((r) => (requireEmail ? Boolean(r.email) : true))
}
