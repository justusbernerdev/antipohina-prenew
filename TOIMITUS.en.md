# What this is and how to start using it

Prenew challenge · team antipöhinä · 27 September 2026

[Suomeksi](TOIMITUS.md)

---

## In one sentence

**This is an engine, not an application you log into.** A machine that carries the know-how, and
you connect it to what you already have.

You said you did not want a separate tool or a new workflow. This is neither. Three routes, and
you pick:

```
                          ┌──▶ 1. MCP
                          │       your own agent asks for candidates directly
                          │
   ENGINE ────────────────┼──▶ 2. Your own systems
   scoring + reasoning    │       CSV and JSON out, on a schedule. Nothing new to learn.
   57 fields per creator  │
                          └──▶ 3. Wired to outreach
                                  findings move on with their briefing, and the
                                  outcomes flow back into your systems
                                            │
                                            └──▶ back to the engine: bounds recalculate
```

The third is **optional and not part of the challenge** — you said outreach belongs to your own
automations, and everything else here works without it.

But one thing follows from it that is worth saying out loud:

> **"We can't get influencers contacted" is no longer a reason.** Not next month, today. The list
> holds 260 creators with a known email address, and the handover is a single call.

---

## Result, 27 September 2026

| | |
|---|---|
| Creators on the list | **1,269** |
| Under 50,000 subscribers | **977**, or 77 % |
| Found via the commenter route | **955** — not discoverable on influencer platforms |
| Email address known | **260**, of which 96 are business addresses |
| Also on TikTok | 217 · Instagram 306 · Twitch 204 |
| Talks about hardware | 31 |
| Breaking out | 59 · sign now 7 |
| Quota | **6,378 / 10,000** units per day, or 64 % |
| Cost | **€0** |

By market: unknown 346, Denmark 204, Poland 168, France 146, Hungary 100, Germany 95, Finland 49,
Netherlands 49, **Estonia 35**, Lithuania 33, Sweden 23, Latvia 21.

**Validation:** the engine found **seven of your own existing partners** without being told about
them — MrRockis, EstMagicz, Joosep Teeb Asju, Kakkuh, Tubu, Jyksedi and Hunter. They are marked in
the file and moved away from the top, because they are not new leads. They are there because it is
the only way to show the model recognises the right type of creator.

---

## Getting started, three steps

**1. A key.** Google Cloud Console → new project → enable YouTube Data API v3 → Credentials →
API key. Free, no billing details.

**2. Run it.**

```
YT_API_KEY=<key> node scripts/discover.mjs
```

No install, no `npm install`, no dependencies. Plain Node.

**3. Open `out/creators.csv` in Excel.**

---

## What you can ask it for

Every constraint is a command-line option. None of them requires touching the code.

| Constraint | Example | What it does |
|---|---|---|
| Markets | `--markets=DE,EE` | Which countries. Defaults to your eleven. |
| Niche | `--niche=minecraft,fortnite` | Restricts the list **and steers where expansion starts** |
| Segment | `--segment=parents` | Who is buying: `any`, `parents` or `adults` |
| Size | `--min-subs=1000 --max-subs=50000` | The subscriber window |
| **Thin market** | `--search=4` | Local-language search where the national chart holds no local creators. **This is what fixed Estonia.** |
| Depth | `--seeds=20 --videos=8` | Seeds per market, videos per seed |
| Quota ceiling | `--budget=3000 --daily-limit=10000` | A hard cap for the run and for the day |
| Niche list | `--niche=?` | Prints all 25 niches |

There are 25 niches: `minecraft`, `fortnite`, `roblox`, `cs`, `valorant`, `gta`, `ark`, `tarkov`,
`rust`, `cities`, `simulator`, `palworld`, `battlefield`, `apex`, `lol`, `souls`, `sims`,
`terraria`, `mobile`, `tech`, `esports`, `lifestyle`, `comedy`, `music`, `gaming`.

**A niche is not only a filter.** Ask for Minecraft and the engine expands from the commenters
under Minecraft creators' videos. Measured: Germany + Minecraft produced 25 creators without this
and **108** with it.

---

## How Estonia was solved

Estonia produced **one** creator at first. The reason came from measurement, not from a guess.

**Estonia's gaming chart holds 27 videos and not one Estonian creator.** Fifteen are international
(MrBeast, IShowSpeed, Grian) and twelve are Russian-language. Expansion therefore started from what
Estonians *watch*, never from what Estonians *make*. Of 96,233 channels fetched, twelve had EE as
their country and one had more than 500 subscribers.

Three routes were tested against real quota:

| Route | Cost | Result | |
|---|---|---|---|
| Estonian-language search | 404 units | **8 genuine creators** | works |
| Russian-language search | 202 units | 1 relevant | weak, dropped |
| Wikidata SPARQL | free | 113 names, 2 channels | covers notable people only |

Search costs 100 units, a hundred times a batch lookup, which is why it is used nowhere else. Here
it buys only the **seeds**: expansion from them is the same free commenter route as everywhere else.

It fires only where the chart produced no local seeds.

| Market | Before | After |
|---|---|---|
| **Estonia** | 1 | **35** |
| Lithuania | 6 | **33** |
| Latvia | 3 | **21** |
| Denmark | 16 | **204** |

And the best evidence: the fix surfaced **two more of your own partners**, EstMagicz and Joosep
Teeb Asju, both Estonian.

---

## What is in the CSV

57 columns, and **you choose the columns before downloading.** Twelve by default — the ones a
decision is made from. Excel shows roughly that many at once, so the wide file is the one nobody
reads.

### The decision columns

`action` · `channel` · `url` · `country` · `subscribers` · `median_views` ·
`views_per_subscriber` · `niche` · `trend` · `contact` · `warnings` · `reasoning`

**`action`** is one word: *contact*, *wait* or *skip*. A score needs interpreting; this does not.

**`warnings`** gathers everything that should make a human hesitate: competitor, previous
rejection, existing partnership, made-for-kids, above the bound, suspicious view ratio, uncertain
country, dormant channel.

**`reasoning`** is the column that decides it, and the score breaks down line by line.

### Akseli's minimum requirements, all present

| Asked for | Column |
|---|---|
| country | `country`, `country_confidence` |
| subscriber amount | `subscribers` |
| avg views (30 days active, 90 less active) | `views_per_video`, `view_window` |
| niche (tech review / gaming, which game) | `niche`, `niche_detail`, `games` |
| contact detail | `contact`, `business_contact` |
| nice to have: risks | `warnings`, `competitor`, `young_audience`, `made_for_kids` |
| nice to have: trend | `trend`, `trend_pct`, `subs_per_month` |

### Platforms

`tiktok` · `instagram` · `twitch` · `facebook` · `x` — handles from the channel description **and
from video descriptions**. YouTube's Links panel is not returned by the API at all, but creators
repeat the same links in their video descriptions, and those descriptions already arrived in a
response we had paid for. The difference: TikTok 28 → **217**, Instagram 27 → **306**, at zero
additional quota.

### The columns you fill in

`outcome` · `rejection_reason` · `code` · `orders` · `revenue` — you write these, and the next run
reads them back.

---

## Why this is fresh produce

You said a machine sits in the warehouse for about a week on average. The same holds for this list,
and it is a rule rather than a metaphor.

**YouTube Developer Policies III.E.4.d:** non-authorized API data may be kept *"not longer than 30
calendar days"*. **III.E.4.c:** after that it must be deleted or refreshed. A permanent creator
database is therefore not an option, and that is the shape of this solution rather than a gap in it.

The engine keeps only two things permanently:

- **A one-way hash** of which creators have been seen. A hash is not YouTube data and cannot be
  turned back into an id — it can answer only whether this one has been seen before.
- **Your own outcome data.** That is yours, not YouTube's.

Every metric is refetched on each run, and the cache expires after 30 days by itself.

Two practical consequences. **Scheduling works:** the ledger knows who has been seen, so a monthly
run delivers only the new creators. **And urgency is measurable:** above 110,000 subscribers
somebody else already got there, which turns size into a clock.

| Signal | Count | What it means |
|---|---|---|
| **Breaking out** | 59 | Already reaching more people than it has subscribers, and growing. Measured. |
| **Sign now** | 7 | Crosses the bound inside a year at its current pace. An estimate from the channel's own growth. |

---

## The part that learns

The bounds are not in the code. `scripts/bounds.mjs` reads the realised collaborations, the
unrealised ones, and everything recorded since, and derives the numbers from them. The computation
reproduces the hand analysis exactly: bound 110,000, price bound 79,000, realised median 75,000.

Your answers changed the scoring in three places:

**Growth and engagement ahead of size.** *"The focus is on growing small and mid-size channels
(roughly 10–100k) with high engagement and a rising trend."*

```
size            +15 → +10 in focus, +4 elsewhere
rising trend    +10 → +20
engagement       not scored → +20
```

**Child-friendliness became a filter.** *"Made-for-kids channels are excluded by default. Teenagers
(13–17) belong to our natural audience."* The flag now rests on YouTube's own `madeForKids`
designation. 71 such channels across the whole search.

**Competitor list corrected.** MIFCOM and Multitronic added. Corsair and HyperX removed — they are
peripheral brands. That correction was found when MrRockis and Kakkuh, your own partners, turned
out to be flagged for mentioning a competitor.

### Discount code results

22 codes recorded, **39 orders in total, and 11 of the 22 produced none.** That 50 % is a number
that appears nowhere else.

The breakdown by size band **cannot be computed**, because the codes cannot be matched to
subscriber counts. The engine says so rather than guessing. **This is the one thing missing before
the scoring's centre of gravity can be set from data instead of judgement:** which channels are
behind those 22 codes.

### A fragile bound

The engine says so itself when a single row is doing all the work. In testing, one recorded
rejection at 13,600 subscribers moved the bound from 110,000 to 13,600. The number is not smoothed
— quietly smoothing a customer's data is worse than a fragile number — but it is stated:

> *"The bound rests on a single observation: the next lowest is 110,000, eight times larger."*

---

## The interface

```
claude mcp add prenew -- node --env-file=.env scripts/mcp-server.mjs
```

| Tool | Direction | Purpose |
|---|---|---|
| `discover_creators` | out | Markets, niches, segment and size bounds in |
| `record_outcome` | **in** | Realised, rejected for reason X, no reply. Also code results |
| `get_scoring_rules` | out | Current bounds and weights, each with its basis |
| `list_competitor_partners` | out | Who the competitors are paying |
| `prepare_outreach_leads` | out | Leads in the shape an outreach engine takes, briefing included |
| `list_runs` | out | Run history and what changed |

The loop has been run end to end against the real engine: `discover_creators` returned 188 Estonian
creators, `record_outcome` rejected one, `get_scoring_rules` showed the moved bound with its basis,
and a fresh run dropped that creator off the list. The fourth step reads from disk, so it would
expose any step that was a façade.

**The server sends nothing to anybody.**

---

## What it costs

Zero. The YouTube Data API has no billing at all — it is a hard ceiling of 10,000 units per day.

| | |
|---|---|
| Full run across eleven markets | 6,378 / 10,000 = **64 %** |
| Re-run | ~30 units, because responses are cached |
| Targeted run (Germany + Minecraft) | 849 units = 8 % |

Two full runs fit in a day, three do not. The quota resets at midnight Pacific. The engine keeps a
ledger and refuses to cross the line.

**TikTok is the only part that would cost anything.** Its official research API is limited to
academic and non-profit use, so it is closed commercially. Follower counts would need a commercial
data source, a few euros one-off. The handles are already there for 217 creators, for free.

---

## Honestly: what is not finished

- **The `/v1/discover` endpoint is not live.** The demo's API tab shows the real criteria and real
  response data, but the HTTP endpoint is unbuilt. The MCP server works, locally.
- **TikTok-first discovery is missing.** Handles yes, follower counts no.
- **346 creators have an unknown country.** They are marked rather than dropped, because an empty
  country field is most common exactly among the small local creators this is meant to find.
- **The code-to-size-band breakdown is waiting on you.**

---

## Address

**https://prenew.justusberner.com** — sign in with an email address, code to your inbox.
