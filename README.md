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
tuottivat 39 % kaikista yhteistöistä. Toisto tarkoittaa että yhteistyö kannatti.

### Koko

| | Mediaani | Haarukka |
|---|---|---|
| YouTube-tilaajat | 49 000 | 1 210 – 1 100 000 |
| TikTok-seuraajat | 20 000 | 2 000 – 349 000 |

YouTuben jakauma: **alle 50k tilaajaa 21 tekijää**, 50–250k 14 tekijää, yli 250k 4 tekijää.

Tämä on tärkeä ja se kannattaa sanoa Akselille ääneen: hän arvioi painopisteen olevan 50k–250k
haarukassa, mutta **heidän oma datansa on painottunut sen alapuolelle**. Enemmistö onnistuneista
yhteistöistä on tekijöiden kanssa jotka eivät näy vaikuttaja-alustoilla lainkaan. Se vahvistaa
haasteen premissin heidän omalla aineistollaan.

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
agentuuripalkkio vähemmän. Tämä on paras tapa vastata vaikutuskriteeriin euroina, ja luku on
heidän omastaan aineistostaan.

### Kanava

TikTok 26 yhteistyötä, YouTube 15, Twitch 2, molemmat 4. Loput merkitsemättä. TikTok on siis
volyymissa edellä, mikä sopii Akselin ohjeeseen että TikTokissa raja on 4 000 seuraajaa.

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

**2. Laajennus.** Jokaisesta siemenestä YouTube Data API:n `relatedToVideoId` ja kanavien
yhteisyleisö, TikTokista hashtagit ja ääniraidat. Tämä on se kohta joka löytää pienet: iso tekijä
löytyy haulla, pieni löytyy **isoa lähellä olevasta verkostosta**.

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
