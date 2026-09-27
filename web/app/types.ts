export type Creator = {
  id: string
  title: string
  handle: string | null
  url: string
  score: number
  country: string | null
  countryConfidence: string
  lang: string | null
  niche: string
  nicheLabel: string
  games: string[]
  subs: number
  avgViews: number | null
  medianViews: number | null
  viewWindow: string | null
  viewRatio: number | null
  trend: 'nouseva' | 'vakaa' | 'laskeva' | null
  trendPct: number | null
  breakingOut: boolean
  signNow: boolean
  subsPerMonth: number | null
  monthsToBound: number | null
  audience: 'nuori' | 'aikuinen' | 'sekalainen' | null
  parentsChoice: boolean
  isNew: boolean
  uploadsPerMonth: number | null
  daysSinceUpload: number | null
  shortsShare: number | null
  likeRate: number | null
  commentRate: number | null
  channelAgeDays: number | null
  platforms: string[]
  tiktok: string | null
  instagram: string | null
  twitch: string | null
  email: string | null
  emailBusiness: string | null
  rigTalk: boolean
  youthHint: boolean
  known: boolean
  rejected: { reason: string; note: string | null; later: string | null } | null
  competitor: string | null
  hardwareSponsor: string | null
  via: 'chart' | 'commenter'
  reason: string
  /** Every point that moved the score, with the sentence that earned it. Sums to `score`. */
  parts: { text: string; points: number }[]
  madeForKids: boolean
  socialFromVideo: boolean
  emailFromVideo: boolean
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

export type Bounds = {
  takenZone: number
  priceyTiktok: number
  realisedMedian: number | null
  basis: { takenZone: string; priceyTiktok: string; realisedMedian: string }
  counts: {
    collaborations: number
    creators: number
    repeated: number
    rejections: number
    recorded: number
  }
  reasonCounts: Record<string, number>
  rejections: {
    channel: string
    reason: string | null
    subs: number | null
    tiktok: number | null
    source: string
  }[]
}

export type RunRequest = {
  markets: string[]
  niches: string[]
  segment?: string
  minSubs: number
  maxSubs: number
  seeds?: number
  videos?: number
  seedsPerMarket?: number
  videosPerSeed?: number
  sample?: number
}

export type Run = {
  at: string
  request: RunRequest
  out: string
  results: number
  inRange: number
  underFifty: number
  fromCommenters: number
  withEmail: number
  onTikTok: number
  rising: number
  knownPartnersFound: string[]
  units: number
  coldUnits?: number
  bounds: { takenZone: number; realisedMedian: number | null; recordedOutcomes: number }
}

export type Targeted = {
  request: RunRequest | null
  units: number | null
  total: number
  small: number
  viaCommenter: number
  withEmail: number
  top: {
    title: string
    url: string
    subs: number
    country: string | null
    nicheLabel: string
    avgViews: number | null
    viewRatio: number | null
    trend: string | null
    email: string | null
    reason: string
  }[]
  creators: Creator[]
}

export type Data = {
  runDate: string | null
  quotaUnits: number | null
  quotaUnitsCached: number | null
  dailyQuota: number
  request: RunRequest | null
  bounds: Bounds | null
  pipeline: Stage[]
  /** Per-market counts for every stage, so the view can draw the pipeline without scaling a total. */
  perMarket: Record<string, { chart: number; seeds: number; commenters: number; real: number; final: number }>
  runs: Run[]
  targeted: Targeted | null
  creators: Creator[]
  competitorPartners: {
    competitor: string
    title: string
    url: string
    country: string | null
    subs: number
    avgViews: number | null
    nicheLabel: string
    trend: string | null
    email: string | null
    rigTalk: boolean
  }[]
  ownData: MarketRow[]
  platform: { tiktok: number; youtube: number; total: number }
  nicheCounts: Record<string, number>
  stats: {
    total: number
    fresh: number
    inRange: number
    small: number
    viaCommenter: number
    viaChart: number
    withEmail: number
    withBusinessEmail: number
    withTiktok: number
    multiPlatform: number
    rising: number
    falling: number
    breakingOut: number
    signNow: number
    parentsChoice: number
    newSinceLastRun: number
    rigTalk: number
    youthFlagged: number
    knownFound: string[]
    rejectedFound: { title: string; reason: string }[]
    takenZone: number
    withCompetitor: number
    unknownCountry: number
  }
  rejections: Record<string, number>
}
