# Ajon tulos 27.9.2026

Tiedostot tässä hakemistossa ovat ajon todellinen ulostulo, ei näyte eikä käsin siistitty versio.

Kaksi ajoa: laaja yhdellätoista markkinalla, ja kohdennettu yhdellä markkinalla ja yhdellä nichellä.

## Laaja ajo

```
node --env-file=.env scripts/discover.mjs --seeds=12 --videos=4
```

| | |
|---|---|
| Tekijöitä listalla | **1 000** |
| Uusia löytöjä | 995 |
| Alle 50 000 tilaajaa | **752** (76 %) |
| Löytyi kommentoijareitistä | **775** |
| Löytyi maakohtaiselta listalta | 220 |
| Prenewin haarukassa (4k–250k) | 206 |
| Sähköposti tiedossa | **130**, joista 48 business-osoitetta |
| Katselut nousussa | 273 |
| Myös TikTokissa | 28 · Instagram 27 · Twitch 31 · vähintään 3 alustaa 30 |
| Puhuu laitteistosta | 24 |
| Merkitty lapsiystävälliseksi | 11 |
| Mainitsee kilpailijan | 6 |
| Kiintiö | **3 864 / 10 000** yksikköä eli 39 % päivän ilmaisbudjetista |

Putki vaiheittain: 11 markkinaa → 335 kanavaa listoilta → 132 siementä → 20 109 kommentoijaa →
1 386 oikeaa tekijää → 1 000 heidän markkinoillaan.

Maittain: tuntematon 347, PL 167, FR 145, HU 99, DE 95, FI 50, NL 49, SE 22, DK 16, LT 6, LV 3, EE 1.

Nichet: Minecraft 221, pelisisältö ei eritelty 187, Roblox 165, tuntematon 79, lifestyle 77,
Fortnite 59, GTA 46, mobiilipelit 35, musiikki 25, simulaattorit 23, komedia 23, tech 17, CS2 13.

## Kohdennettu ajo, `de-minecraft/`

```
node --env-file=.env scripts/discover.mjs --markets=DE --niche=minecraft,fortnite --seeds=20 --videos=8
```

| | |
|---|---|
| Tekijöitä | **109** (Minecraft 92, Fortnite 16, tech 1) |
| Alle 50 000 tilaajaa | 83 |
| Kommentoijareitistä | 92 |
| Sähköposti tiedossa | 23, joista 11 business |
| Muita nichejä pudotettu | 134 |
| Kiintiö | 849 yksikköä eli 8 % |

Kärki on 784–33 200 tilaajan saksalaisia Minecraft-tekijöitä, eli täsmälleen se joukko jonka
puuttumisesta Akseli kertoi.

## Validointi

Kone löysi viisi Prenewin omaa kumppania **tuntematta niitä**: Kakkuh, Tubu, MrRockis, Jyksedi ja
Hunter. Ne ovat tiedostossa merkittynä (`jo_kumppani = kyllä`) ja siirrettynä pois kärjestä. Lisäksi
se tunnisti kaksi joita he olivat jo lähestyneet ja hylänneet (Jyksedi: Silence, Lewa: Content fit).

Tämä on ainoa tapa osoittaa että pisteytys tunnistaa oikean tyypin: se löysi samat tekijät jotka
he ovat itse valinneet, ilman että niitä syötettiin sisään.

## Mikä muuttui 26.9. ajosta

| | 26.9. | 27.9. |
|---|---|---|
| Tekijöitä | 473 | **1 000** |
| Alle 50k | 246 | **752** |
| Kommentoijareitistä | 249 | **775** |
| Sähköposti | 108 | 130 (+48 business erikseen) |
| Myös TikTokissa | 13 | 28 |
| Niche sarakkeena | ei | **kyllä, 25 luokkaa** |
| Trendi | ei | **kyllä** |
| Nichen syöttäminen | ei | **kyllä** |
| Kiintiö kylmänä | 1 345 | 3 864 |

Syyt kasvuun: siemeneksi hyväksytään nyt myös haarukkaa isompi kanava, koska siemen on paikka josta
katsotaan eikä kumppani jonka kanssa tehdään kauppaa. Videonäyte kasvoi 10:stä 20:een samalla
kiintiöhinnalla. Kanavakutsu hakee nyt myös tekijän omat avainsanat ja YouTuben topic-luokittelun,
mikä on ilmaista samassa kutsussa.

Lapsiystävällisyysmerkintä laski 33:sta 11:een, ja se on parannus: aiemmin paljaat numerot 13, 14 ja
15 osuivat videotitleihin kuten "Na 14 Afleveringen" ja "August 13". Nyt merkintä vaatii että tekijä
sanoo sen itse, kymmenellä kielellä.
