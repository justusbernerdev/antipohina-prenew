// Market codes written out. A list that says "DE" asks the reader to translate; a list that says
// "Saksa" does not, and the reader is the point.
export const COUNTRY: Record<string, string> = {
  FI: 'Suomi',
  SE: 'Ruotsi',
  DE: 'Saksa',
  EE: 'Viro',
  HU: 'Unkari',
  LV: 'Latvia',
  LT: 'Liettua',
  PL: 'Puola',
  DK: 'Tanska',
  NL: 'Alankomaat',
  FR: 'Ranska',
  NO: 'Norja',
  AT: 'Itävalta',
  CH: 'Sveitsi',
  BE: 'Belgia',
  ES: 'Espanja',
  IT: 'Italia',
  GB: 'Britannia',
  US: 'Yhdysvallat',
}

export const countryName = (code: string | null | undefined) =>
  code ? COUNTRY[code] || code : 'Maa tuntematon'

// Written-out language names for the same reason.
export const LANGUAGE: Record<string, string> = {
  fi: 'suomi',
  sv: 'ruotsi',
  de: 'saksa',
  et: 'viro',
  hu: 'unkari',
  lv: 'latvia',
  lt: 'liettua',
  pl: 'puola',
  da: 'tanska',
  nl: 'hollanti',
  fr: 'ranska',
  en: 'englanti',
  es: 'espanja',
  it: 'italia',
  pt: 'portugali',
  no: 'norja',
  cs: 'tšekki',
  ru: 'venäjä',
  tr: 'turkki',
}

export const languageName = (code: string | null | undefined) =>
  code ? LANGUAGE[code.slice(0, 2).toLowerCase()] || code : null
