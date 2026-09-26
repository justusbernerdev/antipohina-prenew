# Savutestin tulokset

Ajettu 26.9.2026 oikealla YouTube Data API -avaimella. Kaikki luvut alla ovat mittaustuloksia,
eivät arvioita. Skriptit: `scripts/smoke-test.mjs` ja `scripts/smoke-test-regions.mjs`.

Testin tarkoitus oli vastata yhteen kysymykseen: **tuottaako verkostolaajennus oikeasti tekijöitä
joita valmiit työkalut eivät löydä?** Vastaus on kyllä, mutta ei siitä reitistä josta sitä odotettiin.

---

## Tulokset reiteittäin

| Reitti | Kiintiö | Löytyi | Prenewin haarukassa | Tuotto per yksikkö |
|---|---|---|---|---|
| A. Featured channels | 5 yks. | **0** | 0 | **0** |
| B. Kommentoijat | 30 yks. | 233 kanavaa, 12 tekijää | 0 | 0,4 |
| C. Maakohtaiset listat | 29 yks. | 335 kanavaa | **97** | **3,3** |

## A. Featured channels on kuollut

`channelSections.list` tyypillä `multipleChannels` palautti **nolla nostettua kanavaa kaikilta
viideltä** testatulta tekijältä. Ominaisuus on API:ssa olemassa ja dokumentoitu, mutta tekijät
eivät käytä sitä.

**Reitti poistetaan suunnitelmasta.** Se oli aiemmin kuvattu korvikkeeksi poistetulle
`relatedToVideoId`-parametrille, ja se hypoteesi kaatui mittaukseen.

## B. Kommentoijat löytävät oikeaa tyyppiä, väärää kokoa

Kymmenestä videosta 233 uniikkia kommentoijakanavaa, joista 12 läpäisi tekijäsuodattimen
(vähintään 5 videota ja 500 tilaajaa). Läpäisyprosentti 5.

Löydetyt olivat 508–9 290 tilaajan välissä, esimerkiksi Minecraft Tietäjä (9 290, FI),
SPIKE (839, EE) ja Eetu23 (1 840, FI, TikTok-handle kuvauksessa).

**Laatu on juuri oikea, kokoluokka ei.** Nämä ovat täsmälleen niitä joita vaikuttaja-alustat eivät
näe, mutta Prenewin YouTube-mediaani on 75 000. Reitti on siis arvokas hännän löytämiseen, ei
päälistan tuottamiseen.

Yksi video tuotti keskimäärin 1,2 tekijää, joten reitti skaalautuu lineaarisesti ja halvalla.

## C. Maakohtaiset listat ovat pääreitti

`videos.list` parametreilla `chart=mostPopular` + `regionCode` + pelikategoria, 11 markkinaa,
**29 yksikköä yhteensä**:

- 335 uniikkia kanavaa
- **97 osuu Prenewin haarukkaan** (4 000–250 000)
- 17 alle 50 000 tilaajan
- **269 esiintyy vain yhdessä maassa**, eli aitoja paikallisia tekijöitä eikä globaaleja
- 10 linkittää TikTokinsa kanavan kuvauksessa
- Kieli tuli valmiina mukana: hu, fi, sv, pl, da, fr, nl, de

Esimerkkejä haarukan alapäästä: FoxlyBlox (17 400, HU), JectroSpec (19 600, HU, TikTok),
EskoLivePlus (22 800, FI), LiveLuc (33 100, DE), Leon Roblox (42 500, PL).

Sivuhavainto: pienissä maissa lista on lyhyempi. Viro palautti 27 videota ja Latvia 41, kun isot
markkinat palauttivat täydet 50. Pienessä markkinassa kansallinen lista siis loppuu kesken, ja
juuri siellä kommentoijareittiä tarvitaan täydennykseksi.

---

## Mitä tämä muuttaa

**Ketju kääntyy.** Aiemmin suunnitelma oli: heidän 51 tekijäänsä siemeninä, laajennus nostetuista
kanavista ja kommentoijista. Mittaus sanoo toisin.

```
maakohtainen lista  →  keskikokoiset paikalliset tekijät  →  heidän kommentoijansa  →  pieni häntä
```

Maasiemen ei ole aloitus vaan pääreitti. Kommentoijat ovat syvennys sen päälle, eivät heidän oman
listansa päälle.

**Skaalauslaskelma mitatuilla luvuilla.** 97 osuvaa tekijää 29 yksiköllä. Kun niiden päälle ajetaan
kommentoijareitti (5 videota per kanava, 485 yksikköä), tuotto on noin 1,2 tekijää per video eli
noin 580 tekijää pienestä päästä. **Yhteensä noin 680 tekijää noin 600 kiintiöyksiköllä**, eli
16 kertaa päivän budjetin sisällä.

**Tuomio: rakennetaan.** Reitti C yksin tuottaa käyttökelpoisen listan alle kolmenkymmenen
yksikön hinnalla, ja reitti B tuottaa sen hännän joka vastaa haasteen varsinaiseen kysymykseen.

---

## Mitä tämä tarkoittaa demon kannalta

Maakohtainen lista on julkinen ja kenen tahansa haettavissa, joten pelkkä reitti C ei riitä
vastaukseksi kysymykseen *"löytääkö se ne joita työkalut eivät löydä"*. Se vastaus tulee reitistä
B: kommentoijista löytyneet 500–9 000 tilaajan tekijät eivät ole yhdelläkään vaikuttaja-alustalla.

Demossa kannattaa siis näyttää molemmat ja sanoa ero ääneen: **reitti C tuottaa listan jonka he
voisivat periaatteessa koostaa itse, reitti B tuottaa sen jota he eivät löydä mistään.**
