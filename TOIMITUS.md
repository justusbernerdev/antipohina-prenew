# Mitä tämä on ja miten sen ottaa käyttöön

Prenew challenge · tiimi antipöhinä · 27.9.2026

[In English](TOIMITUS.en.md)

---

## Yhdellä lauseella

**Tämä on engine, ei sovellus johon kirjaudutaan.** Moottori jossa on tieto-taito, ja te kytkette
sen siihen mitä teillä jo on.

Sanoitte ettette halua erillistä työkalua eikä uutta työnkulkua. Tämä ei ole kumpaakaan. Kolme
reittiä, ja valitsette itse:

```
                          ┌──▶ 1. MCP
                          │       teidän agenttiprosessinne kysyy kandidaatteja suoraan
                          │
   ENGINE ────────────────┼──▶ 2. Oma järjestelmä
   pisteytys + perustelu  │       CSV ja JSON ulos, ajastettuna. Ei mitään uutta opeteltavaa.
   57 kenttää per tekijä  │
                          └──▶ 3. Kytkettynä yhteydenottoon
                                  löydöt siirtyvät briiffi mukanaan, ja tulokset
                                  valuvat takaisin teidän järjestelmäänne
                                            │
                                            └──▶ takaisin engineen: rajat lasketaan uudelleen
```

Kolmas on **valinnainen eikä kuulu haasteeseen** — sanoitte että outreach on teidän omien
automaatioidenne asia, ja kaikki muu tässä dokumentissa toimii ilman sitä.

Mutta siitä seuraa yksi asia joka kannattaa sanoa ääneen:

> **"Emme saa kontaktoitua vaikuttajia" ei ole enää syy.** Ei ensi kuussa vaan tänään. Listalla on
> 260 tekijää joilla on sähköpostiosoite tiedossa, ja luovutus yhteydenottoon on yksi kutsu.

---

## Tulos, 27.9.2026

| | |
|---|---|
| Tekijöitä listalla | **1 269** |
| Alle 50 000 tilaajaa | **977** eli 77 % |
| Löytyi kommentoijareitistä | **955** — ei löydettävissä vaikuttaja-alustoilta |
| Sähköposti tiedossa | **260**, joista 96 business-osoitetta |
| Myös TikTokissa | 217 · Instagram 306 · Twitch 204 |
| Puhuu laitteistosta | 31 |
| Nousukiidossa | 59 · kiinnitä nyt 7 |
| Kiintiö | **6 378 / 10 000** yksikköä päivässä eli 64 % |
| Hinta | **0 €** |

Maittain: tuntematon 346, Tanska 204, Puola 168, Ranska 146, Unkari 100, Saksa 95, Suomi 49,
Alankomaat 49, **Viro 35**, Liettua 33, Ruotsi 23, Latvia 21.

**Validointi:** kone löysi **seitsemän teidän omaa kumppanianne** tuntematta niitä — MrRockis,
EstMagicz, Joosep Teeb Asju, Kakkuh, Tubu, Jyksedi ja Hunter. Ne on merkitty tiedostoon ja siirretty
pois kärjestä, koska ne eivät ole uusia liidejä. Ne ovat siellä siksi, että se on ainoa tapa
osoittaa mallin osuvan oikeaan tyyppiin.

---

## Käyttöönotto, kolme askelta

**1. Avain.** Google Cloud Console → uusi projekti → YouTube Data API v3 päälle → Credentials →
API key. Ilmainen, ei laskutustietoja.

**2. Aja.**

```
YT_API_KEY=<avain> node scripts/discover.mjs
```

Ei asennusta, ei `npm install`ia, ei riippuvuuksia. Pelkkä Node.

**3. Avaa `out/creators.csv` Excelissä.**

---

## Mitä sille voi syöttää

Kaikki rajaukset annetaan komennolla, eikä mikään niistä vaadi koodin koskemista.

| Rajaus | Esimerkki | Mitä se tekee |
|---|---|---|
| Markkinat | `--markets=DE,EE` | Mitkä maat. Oletus on teidän yksitoista. |
| Niche | `--niche=minecraft,fortnite` | Rajaa listan **ja ohjaa mistä laajennetaan** |
| Segmentti | `--segment=parents` | Kenelle myydään: `any`, `parents` tai `adults` |
| Koko | `--min-subs=1000 --max-subs=50000` | Kokohaarukka |
| **Ohut markkina** | `--search=4` | Paikalliskielinen haku sinne missä maalista ei tuota paikallisia. **Tämä ratkaisi Viron.** |
| Syvyys | `--seeds=20 --videos=8` | Siemeniä per markkina, videoita per siemen |
| Kiintiökatto | `--budget=3000 --daily-limit=10000` | Kova katto ajolle ja päivälle |
| Nichelista | `--niche=?` | Tulostaa kaikki 25 nicheä |

Nichejä on 25: `minecraft`, `fortnite`, `roblox`, `cs`, `valorant`, `gta`, `ark`, `tarkov`,
`rust`, `cities`, `simulator`, `palworld`, `battlefield`, `apex`, `lol`, `souls`, `sims`,
`terraria`, `mobile`, `tech`, `esports`, `lifestyle`, `comedy`, `music`, `gaming`.

**Niche ei ole vain suodatin.** Kun pyydätte Minecraftia, kone laajentaa Minecraft-tekijöiden
kommentoijista. Mitattu ero: Saksa + Minecraft ilman tätä tuotti 25 tekijää, tämän kanssa **108**.

---

## Miten Viro ratkesi

Viro tuotti aluksi **yhden** tekijän. Syy selvisi mittaamalla, ei arvaamalla.

**Viron pelilistalla on 27 videota eikä yhtäkään virolaista tekijää.** Viisitoista kansainvälistä
(MrBeast, IShowSpeed, Grian) ja kaksitoista venäjänkielistä. Laajennus lähti siis siitä mitä
virolaiset *katsovat*, ei siitä mitä virolaiset *tekevät*. 96 233 haetusta kanavasta kahdellatoista
oli maaksi EE ja yhdellä yli 500 tilaajaa.

Kolme reittiä testattiin oikealla kiintiöllä:

| Reitti | Hinta | Tulos | |
|---|---|---|---|
| Vironkielinen haku | 404 yks. | **8 oikeaa tekijää** | toimii |
| Venäjänkielinen haku | 202 yks. | 1 relevantti | heikko, jätetty pois |
| Wikidata SPARQL | ilmainen | 113 nimeä, 2 kanavaa | kattaa vain merkittävät henkilöt |

Haku maksaa 100 yksikköä eli sata kertaa erähaun, ja siksi sitä ei käytetä muualla. Tässä se ostaa
vain **siemenet**: laajennus niistä on sama ilmainen kommentoijareitti kuin kaikkialla muualla.

Laukeaa automaattisesti vain kun maalista ei tuottanut paikallisia siemeniä.

| Maa | Ennen | Jälkeen |
|---|---|---|
| **Viro** | 1 | **35** |
| Liettua | 6 | **33** |
| Latvia | 3 | **21** |
| Tanska | 16 | **204** |

Ja paras todiste: korjaus löysi **kaksi lisää teidän omaa kumppanianne**, EstMagiczin ja Joosep
Teeb Asjun, molemmat virolaisia.

---

## Mitä CSV:ssä on

57 saraketta, ja **sarakkeet valitaan itse ennen latausta.** Oletuksena kaksitoista, eli ne joista
päätös syntyy — Excel näyttää kerralla suunnilleen saman verran, joten leveä tiedosto on se jota
kukaan ei lue.

### Päätössarakkeet

`toimenpide` · `kanava` · `url` · `maa` · `tilaajat` · `katselut_mediaani` ·
`katselut_per_tilaaja` · `niche` · `trendi` · `yhteystieto` · `varoitukset` · `perustelu`

**`toimenpide`** on yksi sana: *kontaktoi*, *odota* tai *ohita*. Pisteluku vaatii tulkintaa, tämä ei.

**`varoitukset`** kokoaa yhteen kaiken mikä saa epäröimään: kilpailija, aiempi hylkäys, nykyinen
kumppanuus, made for kids, yli rajan, epäilyttävä katselusuhde, epävarma maa, hiljentynyt kanava.

**`perustelu`** on se sarake joka ratkaisee, ja pisteytys on eriteltävissä riviltä riville.

### Akselin vähimmäisvaatimukset, kaikki mukana

| Pyydetty | Sarake |
|---|---|
| country | `maa`, `maan_varmuus` |
| subscriber amount | `tilaajat` |
| avg views (30 pv aktiivisille, 90 vähemmän) | `katselut_per_video`, `katselu_ikkuna` |
| niche (tech review / gaming, mikä peli) | `niche`, `niche_tarkka`, `pelit` |
| contact detail | `yhteystieto`, `yhteystieto_business` |
| nice to have: risks | `varoitukset`, `kilpailija`, `nuori_yleiso`, `made_for_kids` |
| nice to have: trend | `trendi`, `trendi_pros`, `tilaajaa_per_kk` |

### Alustat

`tiktok` · `instagram` · `twitch` · `facebook` · `x` — tunnukset kanavan **ja videoiden**
kuvauksista. YouTuben Linkit-paneeli ei tule API:sta lainkaan, mutta tekijät toistavat samat linkit
videokuvauksissaan, ja ne kuvaukset tulivat jo maksetussa vastauksessa. Ero: TikTok 28 → **217**,
Instagram 27 → **306**, nolla lisäkiintiöllä.

### Syöttösarakkeet

`lopputulos` · `hylkayssyy` · `koodi` · `tilauksia` · `myynti_eur` — nämä te täytätte, ja seuraava
ajo lukee ne takaisin.

---

## Miksi tämä on tuoretavaraa

Sanoitte että kone on varastossa keskimäärin viikon. Sama pätee tähän listaan, eikä se ole
vertauskuva vaan sääntö.

**YouTuben Developer Policies III.E.4.d:** muuta kuin valtuutettua API-dataa saa säilyttää
*"not longer than 30 calendar days"*. **III.E.4.c:** sen jälkeen data on joko poistettava tai
haettava uudelleen. Pysyvä tekijätietokanta ei siis ole vaihtoehto, eikä se ole tämän ratkaisun
puute vaan sen muoto.

Moottori säilyttää pysyvästi vain kaksi asiaa:

- **Yksisuuntaisen tiivisteen** siitä kuka on jo nähty. Tiiviste ei ole YouTube-dataa eikä palaudu
  tunnukseksi — se osaa vastata vain kysymykseen onko tämä nähty aiemmin.
- **Teidän oman tulosdatanne.** Se on teidän, ei YouTuben.

Kaikki mittarit haetaan uudelleen joka ajossa, ja välimuisti vanhenee 30 päivässä itsestään.

Tästä seuraa kaksi käytännön asiaa. **Ajastus toimii:** kirjanpito tietää kuka on jo nähty, joten
kuukausittainen ajo tuottaa vain uudet tekijät. **Ja kiire on mitattavissa:** yli 110 000 tilaajan
kohdalla joku ehti jo ensin, mikä tekee koosta kellon.

| Signaali | Määrä | Mitä se tarkoittaa |
|---|---|---|
| **Nousukiito** | 59 | Tavoittaa jo enemmän ihmisiä kuin sillä on tilaajia, ja kasvaa. Mitattu. |
| **Kiinnitä nyt** | 7 | Nykytahdilla ylittää rajan alle vuodessa. Arvio kanavan omasta kasvuvauhdista. |

---

## Oppiva osa

Rajat eivät ole koodissa. `scripts/bounds.mjs` lukee toteutuneet, toteutumattomat ja kaiken mitä
olette sen jälkeen kirjanneet, ja johtaa luvut niistä. Laskenta toistaa käsin tehdyn analyysin
tarkalleen: yläraja 110 000, hintaraja 79 000, toteutuneiden mediaani 75 000.

Vastauksenne muuttivat pisteytystä kolmessa kohdassa:

**Kasvu ja sitoutuminen koon edelle.** *"Painotus on kasvaviin pieniin ja keskikokoisiin kanaviin
(noin 10–100 k), joilla on korkea sitoutuminen ja nouseva trendi."*

```
koko            +15 → +10 painopisteessä, +4 muualla
nouseva trendi  +10 → +20
sitoutuminen     ei pisteytetty → +20
```

**Lapsiystävällisyys suodattimeksi.** *"Made for kids -kanavat karsitaan lähtökohtaisesti pois.
Teini-ikäiset (13–17) kuuluvat luonnolliseen yleisöömme."* Merkintä nojaa nyt YouTuben omaan
`madeForKids`-lippuun. Koko haussa 71 tällaista kanavaa.

**Kilpailijalista tarkennettu.** MIFCOM ja Multitronic lisätty. Corsair ja HyperX poistettu — ne
ovat oheislaitebrändejä. Se korjaus löytyi kun huomattiin että MrRockis ja Kakkuh, teidän omat
kumppaninne, oli merkitty kilpailijamaininnasta.

### Koodien tuotto

22 koodia kirjattu, **39 tilausta yhteensä, ja 11 koodia 22:sta tuotti nolla.** Se 50 %:n osuus on
luku jota ei näy missään muualla.

Kokoluokkakohtaista jakoa **ei voi laskea**, koska koodeja ei saa yhdistettyä tilaajalukuihin.
Kone sanoo sen ääneen eikä arvaa. **Tämä on ainoa asia joka puuttuu ennen kuin pisteytyksen
painopiste voidaan asettaa datalla eikä arviolla:** mitkä kanavat noiden 22 koodin takana ovat.

### Hauras raja

Kone kertoo itse kun yksi rivi tekee kaiken työn. Testissä yksi kirjattu hylkäys 13 600 tilaajan
kohdalla siirsi ylärajan 110 000:sta 13 600:aan. Lukua ei tasoiteta — asiakkaan datan silottelu
sanomatta on pahempi kuin hauras luku — mutta se sanotaan:

> *"Raja lepää yhden havainnon varassa: seuraavaksi pienin on 110 000, eli 8 kertaa suurempi."*

---

## Rajapinta

```
claude mcp add prenew -- node --env-file=.env scripts/mcp-server.mjs
```

| Työkalu | Suunta | Tehtävä |
|---|---|---|
| `discover_creators` | ulos | Markkinat, nichet, segmentti ja kokorajat sisään |
| `record_outcome` | **sisään** | Toteutui, hylättiin syystä X, ei vastannut. Myös koodin tuotto |
| `get_scoring_rules` | ulos | Nykyiset rajat ja painot perusteluineen |
| `list_competitor_partners` | ulos | Keitä kilpailijat maksavat |
| `prepare_outreach_leads` | ulos | Liidit valmiissa muodossa, briiffi mukana |
| `list_runs` | ulos | Ajohistoria ja mikä muuttui |

Silmukka on ajettu läpi oikeaa moottoria vasten: `discover_creators` antoi 188 virolaista,
`record_outcome` hylkäsi yhden, `get_scoring_rules` näytti siirtyneen rajan, ja uusi ajo pudotti
saman tekijän listalta. Neljäs vaihe lukee levyltä, joten se paljastaisi kulissin.

**Palvelin ei lähetä mitään kenellekään.**

---

## Mitä se maksaa

Nolla euroa. YouTube Data API:ssa ei ole laskutusta lainkaan — se on kova 10 000 yksikön päiväkatto.

| | |
|---|---|
| Täysi ajo yhdellätoista markkinalla | 6 378 / 10 000 = **64 %** |
| Uusinta-ajo | ~30 yksikköä, koska vastaukset ovat välimuistissa |
| Kohdennettu ajo (Saksa + Minecraft) | 849 yksikköä = 8 % |

Kaksi täyttä ajoa mahtuu päivään, kolme ei. Kiintiö nollautuu keskiyöllä Tyynenmeren aikaa eli noin
klo 10 Suomen aikaa. Moottori pitää kirjaa kulutuksesta ja kieltäytyy ylittämästä rajaa.

**TikTok on ainoa osa joka maksaisi.** Sen virallinen tutkimusrajapinta on rajattu akateemisiin
toimijoihin, eli kaupallisesti suljettu. Seuraajaluvut vaatisivat kaupallisen datalähteen, muutamia
euroja kertaluontoisesti. Tunnukset löytyvät jo nyt ilmaiseksi 217 tekijältä.

---

## Rehellisesti: mikä ei ole valmista

- **`/v1/discover`-rajapinta ei ole pystyssä.** Demon API-välilehti näyttää oikeat kriteerit ja
  oikean vastausdatan, mutta HTTP-päätepiste on rakentamatta. MCP-palvelin toimii, mutta paikallisesti.
- **TikTok-lähtöinen haku puuttuu.** Tunnukset löytyvät, seuraajaluvut eivät.
- **346 tekijän maa on tuntematon.** Ne ovat listalla merkittynä eikä pudotettuna, koska tyhjä
  maakenttä on tavallisinta juuri pienillä paikallisilla tekijöillä. Suodatin erottaa varmat.
- **Koodien kokoluokkajako odottaa teitä.**

---

## Osoite

**https://prenew.justusberner.com** — kirjautuminen sähköpostilla, koodi postiin.
