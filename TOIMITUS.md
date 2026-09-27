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

---

## Mitä sille voi syöttää

Tämä on se kohta jossa "kohdennettu data" tapahtuu. Kaikki rajaukset annetaan suoraan komennolla,
eikä mikään niistä vaadi koodin koskemista.

| Rajaus | Esimerkki | Mitä se tekee |
|---|---|---|
| Markkinat | `--markets=DE,FI` | Mitkä maat. Oletus on teidän yksitoista. |
| **Niche** | `--niche=minecraft,fortnite` | Rajaa listan, **ja ohjaa mistä laajennetaan.** Ks. alla. |
| Koko | `--min-subs=1000 --max-subs=50000` | Kokohaarukka. Oletus tulee teidän toteutuneista. |
| Syvyys | `--seeds=20 --videos=8` | Montako siementä per markkina ja montako videota per siemen. |
| Kiintiökatto | `--budget=3000` | Kova katto yhden ajon kiintiökulutukselle. |
| Nichelista | `--niche=?` | Tulostaa kaikki 25 nicheä joita voi pyytää. |

Nichejä on 25: `minecraft`, `fortnite`, `roblox`, `cs`, `valorant`, `gta`, `ark`, `tarkov`,
`rust`, `cities`, `simulator`, `palworld`, `battlefield`, `apex`, `lol`, `souls`, `sims`,
`terraria`, `mobile`, `tech`, `esports`, `lifestyle`, `comedy`, `music`, `gaming`.

**Niche ei ole vain suodatin ulostulossa.** Kun pyydätte Minecraftia, kone laajentaa
Minecraft-tekijöiden kommentoijista, koska Minecraft-videon alla olevat tekijät tekevät
Minecraftia. Mitattu ero: Saksa + Minecraft ilman tätä tuotti 25 tekijää, tämän kanssa **109**,
joista 92 kommentoijareitistä ja 83 alle 50 000 tilaajan.

Esimerkki, sama joka on demossa:

```
node scripts/discover.mjs --markets=DE --niche=minecraft,fortnite --seeds=20 --videos=8
```

---

## Mitä CSV:ssä on

42 saraketta. Akselin listaamat kentät, ja ne jotka lisäsimme koska teidän oma aineistonne
osoitti ne tarpeellisiksi.

### Akselin vähimmäisvaatimukset

| Sarake | Sisältö |
|---|---|
| `maa`, `maan_varmuus`, `kieli` | Maa päätellään kolmesta signaalista, ja epävarma on merkitty epävarmaksi |
| `tilaajat` | |
| `katselut_per_video`, `katselu_ikkuna` | 30 päivää aktiivisille, 90 vähemmän aktiivisille, kuten sanoitte |
| `niche`, `niche_tarkka`, `pelit` | Karkea luokka, tarkka luokka ja mitkä pelit |
| `yhteystieto`, `yhteystieto_business` | Sähköposti kuvauksesta, ja erikseen se joka näyttää yhteistyöosoitteelta |

### Riskit ja trendi, jotka olivat "nice to have"

| Sarake | Sisältö |
|---|---|
| `trendi`, `trendi_pros` | Nouseva, vakaa vai laskeva. 20 videon otos, uudempi puoli vanhempaa vastaan |
| `katselut_per_tilaaja` | Onko yleisö elossa. Yli 200 % tarkoittaa yleensä lainattua sisältöä |
| `kilpailija` | Mainitsee toisen konekaupan kuvauksessa. Suurin yksittäinen hylkäyssyynne |
| `nuori_yleiso` | Tekijä kertoo itse kanavan olevan lapsiystävällinen, kymmenellä kielellä |
| `aiemmin_hylatty`, `jo_kumppani` | Mitä teidän omasta datastanne tiedetään |

### Alustat, joista TikTok ja YouTube olivat tärkeimmät ja muut plussaa

| Sarake | Sisältö |
|---|---|
| `tiktok`, `instagram`, `twitch`, `facebook`, `x` | Tunnukset kanavan kuvauksesta |

### Loput

`pisteet`, `kanava`, `tunnus`, `url`, `katselu_mediaani`, `videoita_per_kk`, `pv_edellisesta`,
`videoita_yhteensa`, `lyhytvideo_osuus`, `tykkays_pros`, `kommentti_pros`, `kanavan_ika_pv`,
`puhuu_laitteistosta`, `loytyi`, `siemen`, `paras_video`, `perustelu`, `lopputulos`, `hylkayssyy`.

Kaksi näistä kannattaa nostaa esiin:

**`perustelu`** on se sarake joka ratkaisee. Lista jonka jokainen rivi selittää itsensä on
tarkistettavissa yhdellä silmäyksellä, ja se on se ero niihin alustoihin jotka eivät toimineet.

**`puhuu_laitteistosta`** tarkoittaa että tekijä luettelee kokoonpanonsa kanavan kuvauksessa tai
avainsanoissa, eli myy koneita jo nyt koska yleisö kysyy. Yksikään vaikuttaja-alusta ei havaitse
tätä. Se löytyi lukemalla teidän omien kumppanienne kanavat.

---

## Palautesilmukka, eli miksi tämä tarkentuu käytössä

Se yksi tiedosto jonka kaivoitte toteutumattomista yhteistöistä oli koko päivän arvokkain aineisto.
Se muutti pisteytyksen rajoja neljässä kohdassa:

- Yli 110 000 tilaajaa tarkoittaa käytännössä että joku ehti ensin. Kaikki viisi kilpailijan tai
  eksklusiivisuuden takia hylättyä olivat 110k–629k. Toteutuneiden mediaani on 75 000.
- Iso TikTok pienellä YouTubella tarkoittaa kallista. Hintasyyllä hylätyt olivat YouTubessa
  33k–48k mutta TikTokissa 79k–340k.
- Kilpailijan mainitseminen kanavan kuvauksessa on suurin yksittäinen hylkäyssyy, ja se on
  havaittavissa ilmaiseksi.
- Aiemmin hylätyt pitää tunnistaa. Yksi tekijä oli listan kärjessä ennen kuin tämä data saatiin,
  ja te olitte jo hylänneet hänet.

**Nämä rajat eivät enää ole koodissa.** Ne lasketaan teidän aineistostanne joka ajolla.
`scripts/bounds.mjs` lukee toteutuneet, toteutumattomat ja kaiken mitä olette sen jälkeen
kirjanneet, ja johtaa luvut niistä. Laskenta toistaa käsin tehdyn analyysin tarkalleen: yläraja
110 000, hintaraja 79 000, toteutuneiden mediaani 75 000. Juuri siksi sen voi antaa liikkua itse.

Jatko ei vaadi teiltä uutta järjestelmää. **CSV:ssä on kaksi tyhjää saraketta,
`lopputulos` ja `hylkayssyy`.** Merkitsette ne normaalin työn ohessa. Vaihtoehtoisesti sama tieto
menee sisään rajapinnasta, ks. seuraava kohta.

Konkreettinen esimerkki siitä mitä yksi kirjaus tekee: kun merkitsette 62 000 tilaajan tekijän
hylätyksi syystä *Competitor / exclusivity*, yläraja putoaa 110 000:sta 62 000:een ja kone kertoo
miksi — kuusi hylkäystä samasta syystä, pienin niistä 62 000. Kaikki sitä isommat menetettiin myös,
joten ne putoavat kärjestä seuraavassa ajossa. Kukaan ei koskenut koodiin.

---

## Rajapinta, jos haluatte

Sama moottori on käärittynä MCP-palvelimeksi, eli teidän omat agenttiprosessinne voivat kutsua
sitä suoraan. Tämä on valinnainen lisäkerros eikä edellytys — CSV riittää, kuten sanoitte.

```
claude mcp add prenew -- node --env-file=.env scripts/mcp-server.mjs
```

Neljä työkalua, ja ratkaiseva asia on että tieto kulkee **molempiin suuntiin**:

| Työkalu | Suunta | Tehtävä |
|---|---|---|
| `discover_creators` | ulos | Markkinat, nichet ja kokorajat sisään, pisteytetyt kandidaatit ulos |
| `record_outcome` | **sisään** | Yksi tekijä ja lopputulos: toteutui, hylättiin syystä X, ei vastannut |
| `get_scoring_rules` | ulos | Nykyiset rajat ja painot, kukin perusteluineen |
| `list_runs` | ulos | Ajohistoria ja mikä muuttui edelliseen verrattuna |

`record_outcome` on niistä tärkein ja se on se jota kukaan muu ei tarjoa. Kun teidän CRM kirjaa
hylkäyksen, sama tieto valuu moottoriin ja rajat lasketaan uudelleen aineistosta. Se palauttaa
suoraan mikä raja liikkui ja mihin uusi raja perustuu.

Tämä tarkoittaa että **aivot ovat teidän omat eikä meidän.** Kaksi eri asiakasta samalla
moottorilla saa ajan myötä eri rajat, koska heidän onnistumisensa ovat erilaisia. Ja koska
mainitsitte ettette oikeastaan dokumentoi huonoja diilejä, tämä on se mekanismi joka tekee
dokumentoinnista sivutuotteen eikä erillistä työtä.

Palvelin ei lähetä mitään kenellekään. Se etsii.

---

## Mitä se maksaa

Nolla.

Täysi ajo yhdellätoista markkinalla kuluttaa **3 864 yksikköä YouTuben 10 000 yksikön päivittäisestä
ilmaiskiintiöstä, eli 39 %.** Uusinta-ajo maksaa käytännössä nolla, koska vastaukset ovat
välimuistissa. Haku on kiintiössä noin sata kertaa kalliimpaa kuin tunnisteella tehty erähaku, ja
siksi tämä ei etsi hakusanoilla lainkaan siemenvaiheen jälkeen.

Kohdennettu ajo on halvempi: Saksa + Minecraft kuluttaa 849 yksikköä eli 8 %.

TikTok on ainoa osa joka maksaisi, koska sen virallinen tutkimusrajapinta on kaupallisilta suljettu.
Sen osuus olisi muutamia euroja kertaluontoisesti, ei tilausta.

---

## Todiste että pisteytys osuu

Ajoimme koneen tuntematta teidän kumppaneitanne. Se nosti **Kakkuhin, Tubun, MrRockisin, Jyksedin
ja Hunterin** 1 000 tekijän joukosta, eli löysi viisi teidän omaa kumppaniannne ilman että niitä
syötettiin sisään. Lisäksi se tunnisti kaksi joita olitte jo lähestyneet ja hylänneet.

Ne on merkitty tiedostoon ja siirretty pois kärjestä, koska ne eivät ole uusia liidejä. Ne ovat
siellä siksi, että se on ainoa tapa osoittaa mallin osuvan oikeaan tyyppiin.

---

## Mitä listalla oikeasti on

Putki vaiheittain, mitattu:

```
11 markkinaa → 335 kanavaa listoilta → 132 siementä → 20 109 kommentoijaa
→ 1 386 oikeaa tekijää → 1 000 heidän markkinoillaan
```

Kaksi eri joukkoa, ja ero kannattaa tietää.

**Maakohtaisilta listoilta** tulleet 220 ovat julkisesti löydettävissä. Voisitte periaatteessa
koostaa ne itse, joten ne eivät yksin ole vastaus.

**Kommentoijareitistä** tulleet **775 tekijää** eivät näy yhdelläkään vaikuttaja-alustalla. Ne ovat
tyypillisesti 500–10 000 tilaajan paikallisia tekijöitä, ja tämä on se osa joka vastaa siihen mitä
sanoitte: *pienemmissä markkinoissa valmiit työkalut jättivät paljon tekijöitä löytymättä.*

Alle 50 000 tilaajan tekijöitä on **752 eli 76 % listasta.** Sähköposti on tiedossa 130:llä, ja
48:lla se on erikseen yhteistyöosoitteelta näyttävä.

Yksi asia on rehellistä sanoa: **347 tekijän maa jäi tuntemattomaksi.** Ne ovat listalla merkittynä
eikä pudotettuna, koska tyhjä maakenttä on tavallisinta juuri niillä pienillä paikallisilla
tekijöillä joita tämän on tarkoitus löytää. Suodatin listassa erottaa varmat epävarmoista.

---

## Yksi puute, ja te kerroitte itse sen syyn

**Viro tuotti yhden tekijän**, vaikka teillä on sieltä kuusi yhteistyötä. Latvia (3) ja Liettua (6)
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

Tämä on siis tiedossa oleva ja hinnoiteltu aukko, ei yllätys. Tunnukset kuvauksista löytyvät jo
nyt: 28 tekijällä on TikTok, 27:llä Instagram ja 31:llä Twitch, mutta seuraajalukuja niihin ei saa
ilman sitä datalähdettä.
