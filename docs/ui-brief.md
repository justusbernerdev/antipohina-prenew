# UI-brief: Prenew-vaikuttajalöytö

Tämä on suunnittelubrief, ei toteutusohje. Kopioitavissa suunnittelutyökaluun sellaisenaan.

---

## 1. Kuka asiakas on

**Prenew** myy kunnostettuja pelitietokoneita, kotipaikka Espoo, 27 maata. Nimi tulee sanoista
pre-owned ja new. Koneet ostetaan takaisin, kunnostetaan, testataan ja myydään 12 kuukauden
takuulla. Kierrätys on osa arvolupausta.

Tuotekategorioissa hintaportaat (Budget, Best Value, Best Performance), RGB-koneet ja
**Vanhempien valinta**, sekä sivu `gaming-pc-for-kids`. Ostaja on usein vanhempi, käyttäjä on lapsi.

Markkinointi nojaa pelivaikuttajiin: tekijä saa oman sivun ja alennuskoodin, ja myynti mitataan
kassalla koodista.

**Ongelma jonka he antoivat ratkaistavaksi:** valmiit vaikuttaja-alustat eivät löydä pieniä
tekijöitä pienistä markkinoista. Heidän sanoin: *"especially in smaller markets they missed a lot
of creators."*

**Tärkeä rajaus heiltä:** he eivät halua erillistä työkalua eikä uutta työnkulkua, vaan ratkaisun
jonka voi integroida nykyiseen. Käyttöliittymän tehtävä on siis **näyttää mitä kone tekee ja mitä
dataa syntyy**, ei olla se paikka jossa työ tehdään.

---

## 2. Brändi, poimittu heidän sivustoltaan

Arvot ovat suoraan `prenew.com/fi-FI`-sivuston CSS:stä 26.9.2026, eivät arvioita.

### Fontit

| Käyttö | Fontti |
|---|---|
| Otsikot ja display | **Sora** |
| Leipäteksti ja käyttöliittymä | **Titillium Web** |

Molemmat löytyvät Google Fontsista.

### Värit

```
--forest-green:        #256f50   pääväri, brändin tunnusväri
--forest-green-80:     #518c73
--forest-green-60:     #7ca996
--forest-green-40:     #a8c5b9

--electric-blue:       #0a74ff   toissijainen korostus, toiminnot
--electric-blue-80:    #3b90ff
--electric-blue-40:    #9dc7ff
--electric-blue-10:    #e6f1ff   vaalea pohja

--amber-yellow:        #fc0      huomio
--almost-gray:         #f8f8ff   sivun pohja
--ink-dark:            #1d1d35   tekstin tumma
--ink-muted:           #777786   toissijainen teksti
--critical:            #ff3b30   virhe
```

Huomio: heidän sivustonsa on **vaalea**, pohja `#f8f8ff` ja teksti `#1d1d35`. Metsänvihreä on
tunnusväri ja sähkönsininen toiminnot. Tämä on eri suunta kuin nykyinen tumma demonäkymä, ja
brändin mukainen on vaalea.

### Muodot

Pyöristykset `0.25rem`–`1.5rem`, maksukomponentissa `10px`. Eli **maltillisesti pyöristetty**, ei
teräväkulmainen eikä pillerimäinen.

---

## 3. Mitä dataa näytetään

Moottori tuottaa JSONin ja CSV:n. Yhden tekijän tiedot:

```
pisteet                 sopivuus, 0-140
kanava, url             nimi ja suora linkki YouTubeen
maa, maan_varmuus       maa päätellään kolmesta signaalista, "varma" tai "epävarma"
kieli                   fi, hu, sv, pl, da, fr, nl, de...
tilaajat                500 - 2 000 000
katselut_per_video      30 tai 90 päivän ikkunassa
katselut_per_tilaaja    0.15 - 2.0 on terve, yli 2.0 on varoitus
videoita_per_kk         julkaisutahti
pv_edellisesta          aktiivisuus
tiktok                  handle jos löytyi kuvauksesta
yhteystieto             sähköposti jos löytyi kuvauksesta
puhuu_laitteistosta     tekijä luettelee kokoonpanonsa
nuori_yleiso            viitteitä alle 13-vuotiaasta yleisöstä
jo_kumppani             heidän nykyinen kumppaninsa
aiemmin_hylatty         he ovat hylänneet tämän, syy mukana
kilpailija              mainitsee toisen konekaupan
loytyi                  "maalista" tai "kommentoija"
perustelu               vapaa teksti: miksi tämä rivi on listalla
```

Lisäksi ajon omat luvut: 474 tekijää, 11 markkinaa, 1 345 kiintiöyksikköä 10 000:sta, ja
vaiheittainen kirjanpito (11 markkinaa → 335 kanavaa → 65 siementä → 7 633 kommentoijaa →
633 tekijää → 474 heidän markkinoillaan).

Ja heidän oma aineistonsa: 69 toteutunutta yhteistyötä markkinoittain agentuuriosuuksineen, sekä
26 toteutumatonta hylkäyssyineen.

---

## 4. Näkymät

### A. Ajonäkymä, tärkein

Tämä on se mitä he tarkoittavat kun sanovat ettei erillistä työkalua haluta: **näkymä joka kertoo
mitä kone teki.** Ei lomakkeita, ei asetuksia, ei tallennuspainikkeita.

Sisältö: putki vaiheittain oikeilla luvuilla, ja jokaisen vaiheen kohdalla kuinka moni karsiutui.
Kommentoijia tulee tuhansia ja niistä jää murto-osa, ja juuri se karsinta on se mistä arvo syntyy.

Tähän kuuluu myös kiintiömittari: 1 345 / 10 000 päivässä, eli ajo on ilmainen.

### B. Lista

Suodattimet yhdellä rivillä: reitti (maalista / kommentoija), koko, maa, onko yhteystieto.
Lajittelu pisteiden mukaan.

Jokainen rivi: nimi linkkinä, maa ja kieli, mittarit, merkinnät (jo kumppani, aiemmin hylätty,
kilpailija, puhuu laitteistosta, nuori yleisö), ja **perustelu kokonaisena lauseena**.

Perustelu on tärkein yksittäinen elementti. Lista jonka jokainen rivi selittää itsensä on
tarkistettavissa, ja se on ero niihin alustoihin jotka eivät heille toimineet.

### C. Vertailu heidän omaan dataansa

Kaksi asiaa rinnakkain. Vasemmalla heidän yhteistyönsä markkinoittain: agentuuriosuus ja
toistuvien kumppanuuksien määrä. Virossa nolla agentuuria ja yksi toistuva, Saksassa kahdeksan
kymmenestä agentuurin kautta ja nolla toistuvaa.

Oikealla mitä hylkäykset opettivat: yli 110 000 tilaajaa tarkoittaa että joku ehti ensin, ja iso
TikTok pienellä YouTubella tarkoittaa kallista.

### D. Validointi

Yksi nosto: kone löysi neljä heidän omaa kumppaniaan (Kakkuh, MrRockis, Jyksedi, Hunter) 474:n
joukosta tuntematta niitä, ja tunnisti kaksi joita he ovat jo hylänneet.

Tämä on todiste eikä lupaus, ja se ansaitsee oman tilansa.

---

## 5. MCP-kerros: kaksisuuntainen, ja tämä on koko tuoteajatus

Moottori ei ole sovellus jota käytetään. Se on **engine jossa on tieto-taito**, ja asiakas kytkee
sen omaan prosessiinsa. Käyttöliittymä on ikkuna siihen, ei työpöytä.

Ratkaiseva osa on että MCP kulkee **molempiin suuntiin**. Ulos menevät kandidaatit, ja sisään
tulevat lopputulokset. Juuri se tekee moottorista oppivan sen sijaan että se olisi lista.

```
      heidän prosessinsa                      engine
  ┌──────────────────────────┐        ┌────────────────────────┐
  │  CRM, agentit, työnkulku │ ──────▶│  discover_creators     │  "anna kandidaatteja"
  │                          │ ◀──────│  → pisteytetyt rivit   │
  │                          │        │                        │
  │  toteutui / ei toteutui  │ ──────▶│  record_outcome        │  "näin kävi"
  │                          │        │  → rajat lasketaan     │
  └──────────────────────────┘        │    uudelleen           │
                                      └────────────────────────┘
```

### Työkalut

| Työkalu | Suunta | Tehtävä |
|---|---|---|
| `discover_creators` | ulos | Markkinat, nichet ja määrä sisään, pisteytetyt kandidaatit ulos |
| `record_outcome` | **sisään** | Yksi tekijä ja lopputulos: toteutui, hylättiin syystä X, ei vastannut |
| `get_scoring_rules` | ulos | Nykyiset rajat ja painot, luettavassa muodossa |
| `list_runs` | ulos | Ajohistoria ja mikä muuttui edelliseen verrattuna |

`record_outcome` on niistä tärkein ja se on se jota kukaan muu ei tarjoa. Kun heidän CRM kirjaa
hylkäyksen, sama tieto valuu moottoriin, ja pisteytyksen rajat lasketaan uudelleen aineistosta.

### Miksi juuri tämä

Tämä ei ole arvaus vaan se mitä tapahtui käsin yhden päivän aikana. Kun saimme heidän 26
toteutumatonta yhteistyötään, rajat muuttuivat neljässä kohdassa:

- Yläraja tarkentui 250 000:sta 110 000:een, koska sen yli kaikki viisi hylättiin kilpailijan tai
  eksklusiivisuuden takia.
- Iso TikTok muuttui plussasta hintariskiksi.
- Kilpailijamaininta kanavan kuvauksessa nousi suurimmaksi yksittäiseksi hylkäyssyyksi.
- Aiemmin hylätyt alkoivat karsiutua kärjestä, mikä ennen tätä epäonnistui kokonaan.

Sama laskenta ajettuna automaattisesti joka kerta kun he kirjaavat lopputuloksen tarkoittaa, että
**aivot ovat asiakkaan omat eikä meidän.** Kaksi eri asiakasta samalla moottorilla saa ajan myötä
eri rajat, koska heidän onnistumisensa ovat erilaisia.

Ja he mainitsivat itse, etteivät oikeastaan dokumentoi huonoja diilejä. Tämä on se mekanismi joka
tekee dokumentoinnista sivutuotteen eikä erillistä työtä.

### Mitä tämä tarkoittaa käyttöliittymälle

- **Ajohistoria** on pakollinen näkymä: mitä ajettiin, milloin, mitkä luvut, mikä muuttui.
- **Rajat näkyvillä ja perusteltuina.** Ei "pisteet 112" vaan mistä se koostuu ja mihin dataan
  raja perustuu.
- **Lopputuloksen kirjaaminen yhdellä klikkauksella** jokaisella rivillä: toteutui, hylättiin,
  ei vastannut. Se on ainoa syöttökenttä koko käyttöliittymässä, ja se on myös ainoa syy
  koskettaa sitä.
- **Näkyvä muutos:** kun lopputulos kirjataan, UI kertoo mitä se teki rajoihin. Se on se hetki
  jossa käyttäjä näkee koneen oppivan.

---

## 6. Mitä ei tehdä

- **Ei tummaa teemaa.** Heidän brändi on vaalea, pohja `#f8f8ff`.
- **Ei dummy-dataa missään.** Jokainen luku näkymässä on mitattu.
- **Ei vikalistaa eikä "mikä teillä on rikki" -osiota.**
- **Ei asetuspaneeleita eikä lomakkeita.** He eivät halua työkalua jota opetellaan.
- **Ei outreach-toimintoja.** Viestintä jää heidän nykyisiin automaatioihinsa, he sanoivat sen itse.
- **Ei mitään joka lähettää mitään itse.**

---

## 7. Seldan rooli, vasta myöhemmin

Tätä ei mainita demossa eikä UI:ssa. Se on jatkokeskustelu.

Jos he haluavat viedä löydöt yhteydenottoon, erityisesti LinkedInissä, siihen on olemassa valmis
kone (Selda). Se on eri tuote ja eri keskustelu, ja se otetaan esiin vain jos he itse kysyvät
mitä löytöjen jälkeen tapahtuu.

Perustelu tälle järjestykselle: he sanoivat suoraan ettei outreach kuulu haasteeseen ja että
heillä on siihen omat automaationsa. Oman tuotteen esittely demossa näyttäisi siltä että tultiin
myymään eikä ratkaisemaan.
