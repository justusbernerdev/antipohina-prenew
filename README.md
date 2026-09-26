# Prenew: influencer discovery

Prompt Marketing Hackathon 2026 · Prenew challenge · team **antipöhinä**

Toissijainen kohde. Mergero on lukittu pääkohteeksi; tämä rakennetaan vain jos moottori on valmis
ajoissa. Tiedosto on tehty siksi, että jos aika riittää, työ alkaa tästä eikä tyhjästä.

---

## 1. Mitä he pyysivät

> *"Build a tool or workflow that automates the discovery of relevant influencers with a particular
> focus on smaller creators who are hard to find through existing tools."*

Viisi arvosteluperustetta briiffistä:

1. Vähentää merkittävästi käsityötä
2. Toimii **pienille ja niche-tekijöille**, ei vain isoille jotka löytyvät muutenkin
3. Toimii isoilla ja pienillä markkinoilla
4. Liitettävissä oikeaan markkinointityönkulkuun
5. Mieluiten **näytetty oikealla esimerkillä**: yksi niche, markkina tai vertikaali

Akselin tarkennukset Discordissa:

| Kysymys | Vastaus |
|---|---|
| Mitä dataa | Vähintään: maa, tilaajamäärä, keskimääräiset katselut per video (30 pv aktiivisille, 90 pv vähemmän aktiivisille), niche (tech review / gaming, mikä peli), mieluiten yhteystieto. Plussaa: riskit, trendi |
| Alustat | **YouTube ja TikTok tärkeimmät.** IG, FB, Twitch plussaa |
| Koko | Pitäisi löytää kokoon katsomatta. Eniten yhteistöitä YT 50k–250k tilaajaa (20k–100k katselua), TikTok 4 000+ |
| Outreach | **Ei kuulu haasteeseen.** Heillä on automaatiot siihen |
| Integraatio | **CSV tai Excel riittää.** API vapaaehtoinen |
| Miksi ei valmista softaa | *"Most of them haven't worked too well for us; especially in smaller markets they missed a lot of creators"* |

Tuo viimeinen on koko haasteen ydin. **Ongelma ei ole työkalun puute vaan kattavuus pienissä
markkinoissa.** Ratkaisu mitataan sillä löytääkö se virolaisen Minecraft-tubettajan, ei sillä
kuinka hieno käyttöliittymä on.

---

## 2. Mitä heidän oma datansa kertoo

69 yhteistyötä, 51 uniikkia tekijää, 11 maata. Tämä on heidän toimitettu esimerkkiaineistonsa,
jäsennettynä tiedostoon `data/collaborations.json`.

### Markkinat

| Maa | Yhteistöitä | Tekijöitä | Toistui |
|---|---|---|---|
| Suomi | 17 | 12 | 4 |
| Ruotsi | 16 | 9 | 3 |
| Saksa | 10 | 10 | **0** |
| Unkari | 8 | 5 | 2 |
| Viro | 6 | 3 | 1 |
| Puola | 3 | 3 | 0 |
| Ranska | 3 | 3 | 0 |
| Alankomaat, Tanska | 2 + 2 | 4 | 0 |
| Latvia, Liettua | 1 + 1 | 2 | 0 |

Kolme asiaa nousee esiin:

**Kotimarkkinat toimivat, muut eivät vielä.** Suomessa ja Ruotsissa neljäsosa tekijöistä toistuu.
Saksassa kymmenen yhteistyötä ja **nolla toistoa**, vaikka Saksa on heidän kasvumarkkinansa ja
sinne avattiin varasto 2026. Sama Puolassa, Ranskassa, Alankomaissa ja Tanskassa.

**Unkari on hiljainen menestys.** Kahdeksan yhteistyötä viidellä tekijällä ja kaksi toistoa, eli
parempi osumatarkkuus kuin Saksassa. Kukaan ei puhu Unkarista.

**Toistuminen on ainoa julkinen laatumittari joka meillä on.** 10 tekijää 51:stä toistui, ja ne
tuottivat 28 yhteistyötä eli 41 % kaikista. Toisto tarkoittaa että yhteistyö kannatti.

### Koko

| | Tekijöitä joilla luku | Mediaani | Haarukka |
|---|---|---|---|
| YouTube-tilaajat | 23 | 75 000 | 1 210 – 2 000 000 |
| TikTok-seuraajat | 30 | 20 500 | 2 000 – 1 900 000 |

YouTuben jakauma: alle 50k tilaajaa 10 tekijää, 50–250k 9 tekijää, yli 250k 4 tekijää.
TikTokin jakauma: alle 10k 9 tekijää, 10–50k 8 tekijää, yli 50k 13 tekijää.

**Akselin arvio pitää paikkansa.** YouTuben mediaani 75 000 osuu keskelle hänen mainitsemaansa
50k–250k haarukkaa. Painopiste ei siis ole sen alapuolella.

Tärkeämpi havainto on toinen: **puolella tekijöistä ei ole YouTube-lukua lainkaan** ja lähes
puolella ei TikTok-lukua. Pienin mukana oleva on 1 210 tilaajaa ja 2 000 seuraajaa. Häntä ei löydä
yhdeltäkään vaikuttaja-alustalta, ja juuri se on haasteen premissi.

### Nichet

Minecraft dominoi: 10 yhteistyötä 69:stä (Minecraft 5, Minecraft/Fortnite 5). Sen jälkeen Tech 5,
gaming news / tech 4, general games 4. Muut ovat yksittäisiä: ARK, GTA, CS2, Clash Royale,
Dark Souls, gaming gear, lifestyle, comedy.

Minecraft ja Fortnite tarkoittavat nuorta yleisöä. Prenewin tuotekategorioissa on
**Vanhempien valinta** ja sivu `gaming-pc-for-kids`. Ostaja on vanhempi, käyttäjä on lapsi, ja
kanava tavoittaa käyttäjän. Tämä kannattaa kysyä: onko se tarkoituksellista vai sattumaa.

### Agentuurit

**27 yhteistyötä 69:stä eli 39 % tuli agentuurin kautta.** Se on suora kustannus ja samalla
suora arvolupaus discovery-työkalulle: jokainen tekijä jonka kone löytää suoraan on yksi
agentuuripalkkio vähemmän.

Jakauma maittain on kuitenkin se kohta joka kannattaa näyttää kalvolla:

| Maa | Agentuurin kautta | Toistuneita tekijöitä |
|---|---|---|
| Viro | **0 / 6** | 1 |
| Suomi | 2 / 17 (12 %) | **4** |
| Ruotsi | 6 / 16 (38 %) | 3 |
| Unkari | 6 / 8 (75 %) | 2 |
| Saksa | **8 / 10 (80 %)** | **0** |

Mitä enemmän agentuuria, sitä vähemmän toistoa. Saksassa agentuurimerkintöjä on eniten ja
kestäviä kumppanuuksia vähiten. Kotimarkkinalla suhde on päinvastoin.

> Sarakkeen merkitys on varmistettava ennen kuin luku menee kalvolle: tarkoittaako `Agency: Yes`
> sitä että yhteistyö hankittiin agentuurin kautta, vai sitä että tekijällä on agentuuri?
> Kysytty Akselilta, ks. [`docs/riskit-ja-kysymykset.md`](docs/riskit-ja-kysymykset.md) B5.

**Tämä on koko discovery-työkalun arvolupaus heidän omilla numeroillaan.** Kone ei korvaa
agentuuria hinnan takia vaan siksi, että itse löydetty kumppani jää.

### Kanava

**TikTok on mukana 44 yhteistyössä 69:stä eli 64 %:ssa. YouTube 22:ssa eli 32 %:ssa.** Twitch 2,
Instagram 1, merkitsemättä 6.

TikTok ei siis ole tasavertainen YouTuben kanssa vaan kaksi kertaa isompi. Se sopii Akselin
ohjeeseen että TikTokissa raja on 4 000 seuraajaa, ja se on samalla rakentamisen vaikein kohta:
TikTokin virallinen tutkimusrajapinta on kaupallisilta suljettu. Reitti sen ympäri on kuvattu
tiedostossa [`docs/datalahteet.md`](docs/datalahteet.md).

---

## 3. Mitä tiedämme heidän nykyisestä mallistaan

Kaivettu julkisilta sivuilta 26.9.2026, ei heidän kertomaansa:

- **Oma sivu per vaikuttaja.** `prenew.com/kakkuh`, otsikko *Kakkuh × Prenew*, kicker *Vaikuttajaetu*
- **Attribuutio on alennuskoodi, ei linkki.** Koodi `KAKKUH50`, voimassa vain yli 700 € koneissa.
  Mittaus tapahtuu kassalla, ei evästeellä
- **Sivut ovat kovakoodattuja.** Kuva haetaan polusta `/images/creators/kakkuh.png`, ja sivu puuttuu
  sitemapista. Sitemapissa on 1 350 sivua 27 maassa, ei yhtään vaikuttajasivua
- **Julkisesti löytyi yksi.** Sitemap, yli 60 slug-arvausta, Wayback-arkiston 3 318 osoitetta ja
  kuusi koodisivustoa tuottivat yhden osuman

Eli kumppaniohjelmaa ei ole julkisesti olemassa, ja jokainen uusi kumppani vaatii koodimuutoksen.
**Jos discovery-kone tuottaa sata kandidaattia viikossa, nykyinen liittymismalli ei ota niitä
vastaan.** Se on toinen pullonkaula discoveryn vieressä, ja se kannattaa mainita vaikka sitä ei
ratkaistaisi.

---

## 4. Mitä rakennettaisiin

Sama muoto kuin Mergerossa: universumi sisään, pisteytys, valmis ulostulo. Vain lähde ja sanasto
vaihtuvat.

```
siemenet  →  laajennus  →  rikastus  →  pisteytys  →  CSV
```

**1. Siemenet.** Heidän omat 51 tekijäänsä ovat opetusaineisto, ei pelkkä esimerkki. Ne kertovat
mitä hyvä kumppani tarkoittaa juuri Prenewille: koko, niche, maa, kieli.

**2. Laajennus.** Jokaisesta siemenestä kanavan itse nostamat kanavat (`channelSections.list`,
tyyppi `multipleChannels`) ja videoiden kommentoijien kanavat (`commentThreads.list`). Tämä on se
kohta joka löytää pienet: iso tekijä löytyy haulla, pieni löytyy **isoa lähellä olevasta
verkostosta**.

> Aiempi versio nojasi `relatedToVideoId`-parametriin. Sitä ei ole olemassa, se poistettiin
> API:sta 2023. Korvikkeet yllä ja koko kiintiölaskelma: [`docs/datalahteet.md`](docs/datalahteet.md).

**3. Rikastus.** Akselin listaamat kentät: maa, tilaajat, keskimääräiset katselut per video
30 tai 90 päivän ikkunassa, niche ja peli, yhteystieto kanavan about-kentästä.

**4. Pisteytys.** Ei seuraajamäärä vaan sopivuus:
- Katselut suhteessa tilaajiin, eli onko yleisö elossa
- Niche-etäisyys siemeniin, eli onko yleisö oikea
- Kieli ja maa suhteessa Prenewin markkinoihin
- Onko jo tehnyt laitekaupallisia videoita, eli tunteeko formaatin
- Riskit: pitkä tauko, romahtaneet katselut, epäsuhtainen seuraajakasvu

**5. Ulostulo.** CSV jonka voi avata Excelissä, koska Akseli sanoi että se riittää. Mukaan
perustelu per rivi, samoin kuin Mergerossa: mitään ei esitetä ilman syytä.

**Demo yhdellä esimerkillä**, koska briiffi pyytää sitä nimenomaan: **Saksa, Minecraft ja
Fortnite**. Perustelu on heidän datastaan. Saksassa on kymmenen yhteistyötä ja nolla toistoa,
Minecraft on heidän toimivin nichensä kotimarkkinoilla, ja Saksa on se markkina johon he juuri
avasivat varaston. Jos kone löytää kymmenen saksalaista Minecraft-tekijää joita he eivät ole
kokeilleet, se on suoraan vastaus siihen mitä he pyysivät.

---

## 5. Kysymykset Akselille

1. Maksatteko vaikuttajalle provisiota, kiinteää palkkiota vai pelkän koneen?
2. Kuinka monta vaikuttajaa teillä on tänään yhteensä ja kuinka monessa maassa? Julkisesti löytyi yksi
3. Mitä tapahtuu kun vaikuttaja sanoo kyllä? Kuinka kauan menee ennen kuin sivu ja koodi ovat pystyssä?
4. **39 % yhteistöistänne on tullut agentuurin kautta. Mitä se maksaa?** Tämä on vaikutuslaskelman kerroin
5. Saksassa kymmenen yhteistyötä ja nolla toistoa. Tiedättekö miksi?
6. Mistä tiedätte että koodi toi asiakkaan, jos asiakas löysi koodin koodisivustolta?
7. Kun vaikuttaja suosittelee konetta, valitseeko hän sen itse vai annatteko te listan?
8. Kakkuh tekee Minecraftia ja teillä on kategoria Vanhempien valinta. Onko kohde lapsi vai vanhempi?

---

## Lähteet

- Prenewin haastebriiffi (PDF) ja avajaiskalvot 26.9.2026
- Akselin Q&A tapahtuman Discordissa 26.9.2026
- `Prenew example collaborations.xlsx`, 69 riviä, jäsennetty tiedostoon `data/collaborations.json`
- prenew.com julkiset sivut, sitemap ja Wayback-arkisto, tarkistettu 26.9.2026
