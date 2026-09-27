import type { Creator } from '../types'
import { action, warnings } from './criteria'

// Every column the export can carry, and which ones are on by default.
//
// The engine writes 56 columns. Excel shows about twelve at a time, so the wide file is the one
// nobody reads: the decision happens on the first screen or it does not happen. The default set is
// those twelve, and everything else is there to be switched on when somebody actually wants to dig.

export type Col = {
  key: string
  label: string
  group: 'Päätös' | 'Koko ja tavoittavuus' | 'Kasvu' | 'Yleisö' | 'Tavoitettavuus' | 'Tausta' | 'Syöttö'
  get: (c: Creator) => string | number
  /** In the twelve-column decision set. */
  core?: boolean
}

const pct = (n: number | null) => (n == null ? '' : `${Math.round(n * 100)} %`)

export const COLUMNS: Col[] = [
  // ---- the decision set ----
  { key: 'toimenpide', label: 'Toimenpide', group: 'Päätös', core: true, get: action },
  { key: 'kanava', label: 'Kanava', group: 'Päätös', core: true, get: (c) => c.title },
  { key: 'url', label: 'URL', group: 'Päätös', core: true, get: (c) => c.url },
  { key: 'maa', label: 'Maa', group: 'Päätös', core: true, get: (c) => c.country || '' },
  { key: 'tilaajat', label: 'Tilaajat', group: 'Koko ja tavoittavuus', core: true, get: (c) => c.subs },
  {
    key: 'katselut_mediaani',
    label: 'Katselut / video, mediaani',
    group: 'Koko ja tavoittavuus',
    core: true,
    get: (c) => c.medianViews ?? '',
  },
  {
    key: 'katselut_per_tilaaja',
    label: 'Katselut / tilaaja',
    group: 'Koko ja tavoittavuus',
    core: true,
    get: (c) => pct(c.viewRatio),
  },
  { key: 'niche', label: 'Niche', group: 'Päätös', core: true, get: (c) => c.nicheLabel },
  { key: 'trendi', label: 'Trendi', group: 'Kasvu', core: true, get: (c) => c.trend || '' },
  { key: 'yhteystieto', label: 'Yhteystieto', group: 'Tavoitettavuus', core: true, get: (c) => c.email || '' },
  {
    key: 'varoitukset',
    label: 'Varoitukset',
    group: 'Päätös',
    core: true,
    get: (c) => warnings(c).join(' | '),
  },
  { key: 'perustelu', label: 'Perustelu', group: 'Päätös', core: true, get: (c) => c.reason },

  // ---- everything else ----
  { key: 'kanava_id', label: 'Kanavan tunnus', group: 'Tausta', get: (c) => c.id },
  { key: 'tunnus', label: '@tunnus', group: 'Tausta', get: (c) => c.handle || '' },
  { key: 'pisteet', label: 'Pisteet', group: 'Päätös', get: (c) => c.score },
  { key: 'maan_varmuus', label: 'Maan varmuus', group: 'Tausta', get: (c) => c.countryConfidence },
  { key: 'kieli', label: 'Kieli', group: 'Tausta', get: (c) => c.lang || '' },
  { key: 'pelit', label: 'Pelit', group: 'Päätös', get: (c) => c.games.join(' | ') },
  {
    key: 'katselut_keskiarvo',
    label: 'Katselut / video, keskiarvo',
    group: 'Koko ja tavoittavuus',
    get: (c) => c.avgViews ?? '',
  },
  { key: 'katselu_ikkuna', label: 'Katseluikkuna', group: 'Koko ja tavoittavuus', get: (c) => c.viewWindow || '' },
  { key: 'trendi_pros', label: 'Trendi %', group: 'Kasvu', get: (c) => c.trendPct ?? '' },
  { key: 'tilaajaa_per_kk', label: 'Tilaajaa / kk', group: 'Kasvu', get: (c) => c.subsPerMonth ?? '' },
  { key: 'kk_rajaan', label: 'Kk rajaan, arvio', group: 'Kasvu', get: (c) => c.monthsToBound ?? '' },
  { key: 'kiinnita_nyt', label: 'Kiinnitä nyt', group: 'Kasvu', get: (c) => (c.signNow ? 'kyllä' : '') },
  { key: 'nousukiito', label: 'Nousukiito', group: 'Kasvu', get: (c) => (c.breakingOut ? 'kyllä' : '') },
  { key: 'videoita_per_kk', label: 'Videoita / kk', group: 'Kasvu', get: (c) => c.uploadsPerMonth ?? '' },
  { key: 'pv_edellisesta', label: 'Pv edellisestä', group: 'Kasvu', get: (c) => c.daysSinceUpload ?? '' },
  { key: 'kommentti_pros', label: 'Kommentteja %', group: 'Yleisö', get: (c) => c.commentRate ?? '' },
  { key: 'tykkays_pros', label: 'Tykkäyksiä %', group: 'Yleisö', get: (c) => c.likeRate ?? '' },
  { key: 'lyhytvideot', label: 'Lyhytvideoita %', group: 'Yleisö', get: (c) => c.shortsShare ?? '' },
  { key: 'yleiso', label: 'Yleisö', group: 'Yleisö', get: (c) => c.audience || '' },
  { key: 'vanhempien_valinta', label: 'Vanhempien valinta', group: 'Yleisö', get: (c) => (c.parentsChoice ? 'kyllä' : '') },
  { key: 'yhteystieto_business', label: 'Business-osoite', group: 'Tavoitettavuus', get: (c) => c.emailBusiness || '' },
  { key: 'alustat', label: 'Alustat', group: 'Tavoitettavuus', get: (c) => c.platforms.join(' | ') },
  { key: 'tiktok', label: 'TikTok', group: 'Tavoitettavuus', get: (c) => (c.tiktok ? `@${c.tiktok}` : '') },
  { key: 'instagram', label: 'Instagram', group: 'Tavoitettavuus', get: (c) => (c.instagram ? `@${c.instagram}` : '') },
  { key: 'twitch', label: 'Twitch', group: 'Tavoitettavuus', get: (c) => c.twitch || '' },
  { key: 'puhuu_laitteistosta', label: 'Puhuu laitteistosta', group: 'Tausta', get: (c) => (c.rigTalk ? 'kyllä' : '') },
  { key: 'kilpailija', label: 'Kilpailija', group: 'Tausta', get: (c) => c.competitor || '' },
  { key: 'jo_kumppani', label: 'Jo kumppani', group: 'Tausta', get: (c) => (c.known ? 'kyllä' : '') },
  { key: 'aiemmin_hylatty', label: 'Aiemmin hylätty', group: 'Tausta', get: (c) => (c.rejected ? c.rejected.reason : '') },
  { key: 'loytyi', label: 'Reitti', group: 'Tausta', get: (c) => (c.via === 'chart' ? 'maalista' : 'kommentoija') },
  { key: 'kanavan_ika_pv', label: 'Kanavan ikä, pv', group: 'Tausta', get: (c) => c.channelAgeDays ?? '' },

  // ---- the columns they fill in, which is how the engine learns ----
  { key: 'lopputulos', label: 'Lopputulos', group: 'Syöttö', core: true, get: () => '' },
  { key: 'hylkayssyy', label: 'Hylkäyssyy', group: 'Syöttö', core: true, get: () => '' },
  { key: 'koodi', label: 'Alennuskoodi', group: 'Syöttö', get: () => '' },
  { key: 'tilauksia', label: 'Tilauksia', group: 'Syöttö', get: () => '' },
  { key: 'myynti_eur', label: 'Myynti €', group: 'Syöttö', get: () => '' },
]

export const GROUPS = ['Päätös', 'Koko ja tavoittavuus', 'Kasvu', 'Yleisö', 'Tavoitettavuus', 'Tausta', 'Syöttö'] as const

export const CORE_KEYS = COLUMNS.filter((c) => c.core).map((c) => c.key)
export const ALL_KEYS = COLUMNS.map((c) => c.key)

// BOM first, or Excel opens a Finnish file as mojibake.
export function toCsv(rows: Creator[], keys: string[], runDate: string): string {
  const cols = COLUMNS.filter((c) => keys.includes(c.key))
  const q = (v: string | number) => {
    const s = String(v ?? '')
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = cols.map((c) => c.key).concat('mitattu').join(',')
  const body = rows.map((r) => cols.map((c) => q(c.get(r))).concat(runDate).join(','))
  return '﻿' + [header, ...body].join('\n')
}
