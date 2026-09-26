export type Creator = {
  id: string
  title: string
  url: string
  score: number
  country: string | null
  countryConfidence: string
  lang: string | null
  subs: number
  avgViews: number | null
  viewWindow: string | null
  viewRatio: number | null
  uploadsPerMonth: number | null
  daysSinceUpload: number | null
  tiktok: string | null
  email: string | null
  rigTalk: boolean
  youthHint: boolean
  known: boolean
  rejected: { reason: string; note: string; later: string | null } | null
  competitor: string | null
  via: 'chart' | 'commenter'
  reason: string
}

export type MarketRow = {
  country: string
  collabs: number
  creators: number
  agency: number
  agencyPct: number
  repeaters: number
}

export type Stage = {
  name: string
  count: number
  note?: string
  unitsAfter: number
}

export type Data = {
  runDate: string | null
  quotaUnits: number
  dailyQuota: number
  pipeline: Stage[]
  creators: Creator[]
  ownData: MarketRow[]
  platform: { tiktok: number; youtube: number; total: number }
  stats: {
    total: number
    fresh: number
    inRange: number
    small: number
    viaCommenter: number
    viaChart: number
    withEmail: number
    withTiktok: number
    rigTalk: number
    youthFlagged: number
    knownFound: string[]
    rejectedFound: { title: string; reason: string }[]
    takenZone: number
    withCompetitor: number
  }
  rejections: Record<string, number>
}
