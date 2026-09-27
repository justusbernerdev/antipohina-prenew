// Finnish and English for everything the demo puts on screen.
//
// Two flat objects rather than a library: the string set is small, it changes with the product
// rather than with a translator's schedule, and a missing key should be a type error at build time
// instead of a silent fallback in front of a customer.

export type Lang = 'fi' | 'en'

const fi = {
    tabs: { flow: 'Dataflow', mcp: 'MCP', api: 'API', selda: 'Selda' },

    flowTitle:
      'Kerro mitä etsit. Kone käy läpi valittujen maiden pelilistat ja niiden kommentoijat, ja palauttaa tekijät perusteluineen.',
    flowLead:
      'Ei asennusta eikä uutta työkalua. Sama moottori toimii tästä selaimesta, omasta järjestelmästänne API:n kautta ja agentista MCP:n kautta. Valitse kriteerit ja lataa lista. Käyttöön voi ottaa tänään.',

    markets: 'MAAT',
    niche: 'NICHE',
    size: 'KOKO',
    limits: 'RAJAT',
    creators: 'tekijää',
    countries: 'maata',
    quotaUnits: 'kiintiöyksikköä',
    scrollHint: 'Vieritä sivusuunnassa nähdäksesi koko putken →',
    incoming: 'Sisään',
    agent: 'agentti',
    channels: 'kanavia',

    sizes: { all: 'Kaikki', u110: 'alle 110k', u50: 'alle 50k', u10: 'alle 10k' },
    flags: {
      contact: 'Yhteystieto',
      rising: 'Nousussa',
      urgent: 'Kiire',
      parents: 'Vanhempien valinta',
      rig: 'Puhuu laitteistosta',
    },

    list: 'Lista',
    search: 'Hae nimestä, maasta, nichestä tai perustelusta…',
    noWarnings: 'Ei varoituksia',
    cards: 'Kortit',
    table: 'Taulukko',
    columns: 'Sarakkeet',
    downloadCsv: 'Lataa CSV',
    showMore: 'Näytä lisää',
    remaining: 'jäljellä',
    noHits: 'Ei osumia. Löysennä rajoja tai tyhjennä haku.',
    colHead: {
      action: 'TOIMENPIDE',
      channel: 'KANAVA',
      subs: 'TILAAJAT',
      contact: 'YHTEYSTIETO',
      warnings: 'VAROITUKSET',
    },
    subsLabel: 'Tilaajat',
    contactLabel: 'Yhteystieto',
    warningsLabel: 'Varoitukset',
    noContact: 'ei tiedossa',
    noWarn: 'ei varoituksia',
    views: 'katselua',
    pickerLead:
      'Samat sarakkeet näkyvät taulukossa ja lähtevät CSV:hen. Oletuksena kaksitoista, eli ne joista päätös syntyy — Excel näyttää kerralla suunnilleen saman verran.',
    coreCols: 'Päätössarakkeet',
    allCols: 'Kaikki',

    sorts: {
      score: 'Pisteet',
      subsDesc: 'Tilaajat, suurin ensin',
      subsAsc: 'Tilaajat, pienin ensin',
      views: 'Katselut per video',
      ratio: 'Katselut per tilaaja',
      trend: 'Trendi',
      growth: 'Kasvu per kuukausi',
      active: 'Aktiivisin ensin',
      engagement: 'Sitoutuminen',
    },

    apiTitle: 'Sama pyyntö ilman käyttöliittymää.',
    apiLead: 'Yksi kutsu. Kriteerit ovat ne jotka valitsit Dataflow-näkymässä.',
    apiCsvNote: 'palauttaa saman listan CSV:nä.',
    request: 'PYYNTÖ',
    response: 'VASTAUS',

    mcpTitle: 'Teidän agenttinne kysyy suoraan. Kuusi työkalua, ei asennusta.',
    connectClaude: 'KYTKE CLAUDE CODEEN',
    makeKey: 'Luo API-avain',
    newKey: 'Luo uusi avain',
    runInTerminal: 'Aja terminaalissa, sitten kysy Claudelta.',
    copy: 'Kopioi',
    copied: 'Kopioitu',
    example: 'ESIMERKKI',
    user: 'Käyttäjä',
    agentSays: 'Agentti',

    seldaTitle: 'Selda on oma juttunsa.',
    seldaLead:
      'Löytö toimii ilman tätä. Jos haluatte, valitut rivit siirtyvät Seldaan perusteluineen, ja avausviesti kirjoitetaan siitä miksi juuri tämä tekijä on listalla. Luonnos odottaa ihmistä, mitään ei lähetetä itsestään.',
    toTransfer: 'Siirrettävät',
    eligible: 'kelpaa siirtoon · nykyiset kumppanit, aiemmin hylätyt ja kilpailijaa mainostavat rajattu pois',
    transfer: 'Siirrä',
    toSelda: 'Seldaan',
    transferring: 'Siirretään ja kirjoitetaan luonnokset…',
    transferNote: 'Luo kampanjan, hakee yhteystiedot ja kirjoittaa luonnoksen. Ei lähetä mitään.',
    draftsBack: 'Luonnokset takaisin',
    awaiting: 'odottaa hyväksyntää',
    noEmail: 'ei sähköpostia',
    subscribers: 'tilaajaa',
    draftsNote:
      'Jokainen näistä on kirjoitettu siitä mitä moottori mittasi juuri kyseisestä kanavasta, ei mallipohjasta. Sama teksti odottaa hyväksyntää Seldan puolella, ja lähetys on ihmisen painallus.',
}

export type Dict = typeof fi

const en: Dict = {
    tabs: { flow: 'Dataflow', mcp: 'MCP', api: 'API', selda: 'Selda' },

    flowTitle:
      'Tell it what you are looking for. The engine works through the chosen markets’ gaming charts and their commenters, and returns creators with the reasoning attached.',
    flowLead:
      'No install and no new tool. The same engine runs from this browser, from your own systems over the API, and from an agent over MCP. Pick the criteria and download the list. You can start today.',

    markets: 'MARKETS',
    niche: 'NICHE',
    size: 'SIZE',
    limits: 'LIMITS',
    creators: 'creators',
    countries: 'markets',
    quotaUnits: 'quota units',
    scrollHint: 'Scroll sideways to see the whole pipeline →',
    incoming: 'In',
    agent: 'agent',
    channels: 'channels',

    sizes: { all: 'All', u110: 'under 110k', u50: 'under 50k', u10: 'under 10k' },
    flags: {
      contact: 'Has contact',
      rising: 'Rising',
      urgent: 'Urgent',
      parents: "Parents' Choice",
      rig: 'Talks hardware',
    },

    list: 'List',
    search: 'Search name, country, niche or reasoning…',
    noWarnings: 'No warnings',
    cards: 'Cards',
    table: 'Table',
    columns: 'Columns',
    downloadCsv: 'Download CSV',
    showMore: 'Show more',
    remaining: 'remaining',
    noHits: 'No matches. Loosen the criteria or clear the search.',
    colHead: {
      action: 'ACTION',
      channel: 'CHANNEL',
      subs: 'SUBSCRIBERS',
      contact: 'CONTACT',
      warnings: 'WARNINGS',
    },
    subsLabel: 'Subscribers',
    contactLabel: 'Contact',
    warningsLabel: 'Warnings',
    noContact: 'not known',
    noWarn: 'no warnings',
    views: 'views',
    pickerLead:
      'The same columns appear in the table and leave with the CSV. Twelve by default — the ones a decision is made from, which is roughly what Excel shows at once.',
    coreCols: 'Decision columns',
    allCols: 'All',

    sorts: {
      score: 'Score',
      subsDesc: 'Subscribers, largest first',
      subsAsc: 'Subscribers, smallest first',
      views: 'Views per video',
      ratio: 'Views per subscriber',
      trend: 'Trend',
      growth: 'Growth per month',
      active: 'Most active first',
      engagement: 'Engagement',
    },

    apiTitle: 'The same request without a user interface.',
    apiLead: 'One call. The criteria are the ones you picked in the Dataflow view.',
    apiCsvNote: 'returns the same list as CSV.',
    request: 'REQUEST',
    response: 'RESPONSE',

    mcpTitle: 'Your agent asks directly. Six tools, no install.',
    connectClaude: 'CONNECT TO CLAUDE CODE',
    makeKey: 'Create API key',
    newKey: 'Create a new key',
    runInTerminal: 'Run this in a terminal, then ask Claude.',
    copy: 'Copy',
    copied: 'Copied',
    example: 'EXAMPLE',
    user: 'User',
    agentSays: 'Agent',

    seldaTitle: 'Selda is its own thing.',
    seldaLead:
      'Discovery works without it. If you want, the selected rows move to Selda with their reasoning, and the opening message is written from why this particular creator is on the list. The draft waits for a human; nothing is sent by itself.',
    toTransfer: 'To hand over',
    eligible: 'eligible · existing partners, previously rejected and competitor-sponsored are excluded',
    transfer: 'Hand over',
    toSelda: 'to Selda',
    transferring: 'Handing over and writing drafts…',
    transferNote: 'Creates the campaign, collects contact details and writes a draft. Sends nothing.',
    draftsBack: 'Drafts back',
    awaiting: 'awaiting approval',
    noEmail: 'no email',
    subscribers: 'subscribers',
    draftsNote:
      'Each of these was written from what the engine measured about that specific channel, not from a template. The same text waits for approval on the Selda side, and sending is a human keystroke.',
}

export const T: Record<Lang, Dict> = { fi, en }
