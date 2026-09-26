# Mitä tämä on ja miten sen ottaa käyttöön

Prenew challenge · tiimi antipöhinä

---

## Yhdellä lauseella

**Yksi komento joka tuottaa CSV-tiedoston vaikuttajakandidaateista, ja jokaisella rivillä on
perustelu miksi se on siellä.**

Ei sovellusta johon kirjaudutaan, ei uutta työnkulkua, ei palvelua jota joku muu ylläpitää.

---

## Mitä se ei ole

Tämä kohta ensin, koska se on se mitä tarkoitatte kun sanotte ettei erillistä workflowta haluta.

- **Ei ohjelmistoa jota pitää opetella.** Ajo on yksi komentorivi.
- **Ei tiliä eikä kuukausimaksua.** Käytössä on teidän oma ilmainen YouTube-avain.
- **Ei meidän ylläpitämä palvelu.** Koodi on teidän, ja te ajatte sen. Tämä ei ole vain siisti
  ratkaisu vaan myös ainoa ehtojen mukainen: YouTube rajoittaa API-datan säilytyksen 30 päivään,
  joten oikea muoto on ajo joka tuottaa tuoreen tilannekuvan, ei tietokanta joka vanhenee.
- **Ei outreachia.** Se jää teidän nykyisiin automaatioihinne, kuten sanoitte.
- **Ei lukkoa mihinkään formaattiin.** Ulostulo on CSV ja JSON. Excel avaa sen suoraan.

## Mitä se on

Skripti joka ajetaan kun haluatte uusia kandidaatteja. Se lukee YouTubesta, pisteyttää löydöt
teidän oman datanne perusteella ja kirjoittaa tiedoston. Siinä kaikki.

---

## Käyttöönotto, kolme askelta

**1. Avain.** Google Cloud Console, uusi projekti, YouTube Data API v3 päälle, Credentials →
API key. Ilmainen, ei laskutustietoja, kolme klikkausta.

**2. Aja.**

```
YT_API_KEY=<avain> node scripts/discover.mjs
```

Ei asennusta, ei `npm install`ia, ei riippuvuuksia. Pelkkä Node.

**3. Avaa `out/creators.csv` Excelissä.**

Rajaukset annetaan tarvittaessa suoraan komennolla:

```
node scripts/discover.mjs --markets=DE,EE --seeds=20
```

---

## Mitä CSV:ssä on

Akselin listaamat kentät, ja kolme jotka lisäsimme koska teidän oma aineistonne osoitti ne
tarpeellisiksi.

| Sarake | Sisältö |
|---|---|
| `pisteet` | Sopivuus teille, ei tekijän koko |
| `kanava`, `url` | Nimi ja suora linkki tarkistukseen |
| `maa`, `maan_varmuus`, `kieli` | Maa päätellään kolmesta signaalista, ja epävarma on merkitty epävarmaksi |
| `tilaajat` | |
| `katselut_per_video`, `katselu_ikkuna` | 30 päivää aktiivisille, 90 vähemmän aktiivisille |
| `katselut_per_tilaaja` | Onko yleisö elossa |
| `videoita_per_kk`, `pv_edellisesta` | Aktiivisuus ja tauot |
| `tiktok`, `yhteystieto` | Kun ne löytyvät kanavan kuvauksesta |
| **`puhuu_laitteistosta`** | Tekijä luettelee kokoonpanonsa, eli myy koneita jo nyt |
| **`nuori_yleiso`** | Viitteitä alle 13-vuotiaasta yleisöstä |
| **`perustelu`** | Miksi tämä rivi on listalla |
| `aiemmin_hylatty`, `jo_kumppani`, `kilpailija` | Mitä teidän omasta datastanne tiedetään |

`perustelu` on se sarake joka ratkaisee. Lista jonka jokainen rivi selittää itsensä on
tarkistettavissa yhdellä silmäyksellä, ja se on se ero niihin alustoihin jotka eivät toimineet.

---

## Miten se menee teidän prosessiinne

Kolme reittiä, valitkaa mikä istuu.

**Tiedostona.** Ajo kirjoittaa CSV:n. Avaatte sen, poimitte mitä haluatte, viette CRM:ään niin
kuin nyt teette. Ei mitään uutta opeteltavaa.

**Ajastettuna.** Sama komento cronissa tai GitHub Actionsissa kerran viikossa. Tiedosto ilmestyy
sovittuun paikkaan, ja koska ajo on ilmainen, tahti on teidän päätettävissänne.

**Rajapintana, jos haluatte.** Sama moottori käärittynä kutsuttavaksi työkaluksi, jos teidän omat
agenttiprosessinne haluavat pyytää kandidaatteja suoraan. Tämä on valinnainen lisäkerros, ei
edellytys, eikä sitä kannata rakentaa ennen kuin tiedämme mitä käytätte.

---

## Palautesilmukka, eli miksi tämä tarkentuu käytössä

Se yksi tiedosto jonka kaivoitte toteutumattomista yhteistöistä oli koko päivän arvokkain aineisto.
Se muutti pisteytyksen rajoja neljässä kohdassa:

- Yli 110 000 tilaajaa tarkoittaa käytännössä että joku ehti ensin. Kaikki viisi kilpailijan tai
  eksklusiivisuuden takia hylättyä olivat 110k–629k, mediaani 479 000. Toteutuneiden mediaani on
  75 000.
- Iso TikTok pienellä YouTubella tarkoittaa kallista. Hintasyyllä hylätyt olivat YouTubessa
  33k–48k mutta TikTokissa 79k–340k.
- Kilpailijan mainitseminen kanavan kuvauksessa on suurin yksittäinen hylkäyssyy, ja se on
  havaittavissa ilmaiseksi.
- Aiemmin hylätyt pitää tunnistaa. Yksi tekijä oli listan kärjessä ennen kuin tämä data saatiin,
  ja te olitte jo hylänneet hänet.

Tästä syntyy jatko joka ei vaadi teiltä uutta järjestelmää: **CSV:ssä on tyhjä sarake hylkäyssyylle.**
Merkitsette sen normaalin työn ohessa, ja seuraava ajo lukee saman tiedoston takaisin sisään. Kone
tarkentuu ilman että kukaan rakentaa mitään erillistä.

---

## Mitä se maksaa

Nolla.

Ensimmäinen täysi ajo yhdellätoista markkinalla kulutti 1 345 yksikköä YouTuben 10 000 yksikön
päivittäisestä ilmaiskiintiöstä, eli 13 %. Uusinta-ajo maksaa käytännössä nolla, koska vastaukset
ovat välimuistissa. Haku on kiintiössä noin sata kertaa kalliimpaa kuin tunnisteella tehty erähaku,
ja siksi tämä ei etsi hakusanoilla lainkaan siemenvaiheen jälkeen.

TikTok on ainoa osa joka maksaisi, koska sen virallinen tutkimusrajapinta on kaupallisilta suljettu.
Sen osuus olisi muutamia euroja kertaluontoisesti, ei tilausta.

---

## Todiste että pisteytys osuu

Ajoimme koneen tuntematta teidän kumppaneitanne. Se nosti **Kakkuhin, MrRockisin, Jyksedin ja
Hunterin** 474 tekijän joukosta, eli löysi neljä teidän omaa kumppaniannne ilman että niitä
syötettiin sisään. Lisäksi se tunnisti kaksi joita olitte jo lähestyneet ja hylänneet.

Ne on merkitty tiedostoon ja siirretty pois kärjestä, koska ne eivät ole uusia liidejä. Ne ovat
siellä siksi, että se on ainoa tapa osoittaa mallin osuvan oikeaan tyyppiin.

---

## Mitä listalla oikeasti on

Kaksi eri joukkoa, ja ero kannattaa tietää.

**Maakohtaisilta listoilta** tulleet ovat julkisesti löydettävissä. Voisitte periaatteessa koostaa
ne itse, joten ne eivät yksin ole vastaus.

**Kommentoijareitistä** tulleet 250 tekijää eivät näy yhdelläkään vaikuttaja-alustalla. Ne ovat
tyypillisesti 500–10 000 tilaajan paikallisia tekijöitä, ja tämä on se osa joka vastaa siihen mitä
sanoitte: *pienemmissä markkinoissa valmiit työkalut jättivät paljon tekijöitä löytymättä.*

Näistä 108:lla on sähköpostiosoite tiedossa suoraan kanavan kuvauksesta.

---

## Yksi puute, ja te kerroitte itse sen syyn

**Viro ei tuottanut yhtään tekijää**, vaikka teillä on sieltä kuusi yhteistyötä. Latvia ja Liettua
jäivät myös ohuiksi.

Syy selvisi kun kertoitte miten löysitte virolaiset: **selasitte TikTokia Virossa.** Tämä versio
lukee YouTubea, joten se etsii väärästä paikasta juuri siinä markkinassa jossa teidän oma
menetelmänne toimii.

Se on johdonmukaista kaiken muun kanssa mitä aineistosta näkyy. TikTok on mukana 44
yhteistyössänne 69:stä eli 64 %:ssa, YouTube 22:ssa. Viron YouTube-trendilistalla on vain 27
videota, eli pienessä markkinassa YouTube-puoli yksinkertaisesti loppuu kesken.

**Mitä se vaatii.** TikTokin virallinen tutkimusrajapinta on rajattu akateemisiin ja
voittoa tavoittelemattomiin toimijoihin, eli se ei ole kaupallisesti käytettävissä. Sama löytö
tehdään kaupallisen datapalvelun kautta maakohtaisella haulla, mikä on käytännössä sama asia kuin
TikTokin selaaminen Viron asetuksella, paitsi että kone tekee sen kerralla ja kirjaa tulokset.

Kustannus on muutamia euroja kertaluontoisesti, ei tilausta. Se on ainoa kohta koko ratkaisussa
joka ei ole ilmainen, ja se on samalla se joka ratkaisee pienimmät markkinat.

Tämä on siis tiedossa oleva ja hinnoiteltu aukko, ei yllätys.
