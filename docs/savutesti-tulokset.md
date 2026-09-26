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

## Kolme kanavaa lähiluettuna, ja mitä ne paljastivat

Yksittäisten osumien tarkastelu (`scripts/inspect-channel.mjs`) tuotti kaksi suodatinta joita
suunnitelmassa ei ollut.

**Täysosuma: Minecraft Tietäjä** (FI, 9 290 tilaajaa, 185 videota). 8 415 katselua per video eli
**91 % tilaajamäärästä**, julkaisee lähes päivittäin, kieli `fi`, maa merkitty, ja tekee
yhteistöitä muiden suomalaisten kanssa. Minecraft on Prenewin isoin niche. Tällaista ei löydä
yhdeltäkään vaikuttaja-alustalta.

**Väärä osuma joka näyttää parhaalta: JectroSpec** (HU, 19 600 tilaajaa). Katselusuhde **478 %**,
mikä näyttää luvuissa poikkeukselliselta. Kuvaus paljastaa miksi: *"Nem hivatalos TheVR és Nessaj
rajongói montázsok"*, eli epävirallisia fanimontaaseja toisista tekijöistä. Kanavalla ei ole omaa
persoonaa jota seurattaisiin, joten vaikuttajayhteistyö ei toimi.

**Rajatapaus: SPIKE** (EE, 839 tilaajaa). Kuvaus alkaa *"I'm a young trans Estonian geometry dash
player"*. Tekijä kertoo itse olevansa nuori, eli tämä on juuri se tapaus jota varten
alaikäisyysmerkintä on olemassa. Lisäksi Geometry Dash pyörii millä tahansa koneella, eli niche ei
myy pelitietokonetta vaikka se on peliaiheinen.

### Uusi suodatin 1: sivu- ja klippikanavat

Kansalliset trendilistat täyttyvät isojen tekijöiden sivukanavista. **Mitattu: 16 kanavaa 335:stä
ja 10 osumaa 97:stä haarukan sisällä**, eli kymmenesosa. Tunnusmerkit ovat nimessä tai kuvauksessa:
`+`, `VOD`, `Clips`, `Extra`, `PLUS`, `Best of`, `montage`, tai kuvauksessa *unofficial*,
*nem hivatalos*, *rajongói*, *fan channel*.

Esimerkkejä merkityistä: Zsozeatya VOD, Wojan PLUS, DrDonut Clips, Barni. VOD, Shogy +,
Royalistiq Extra, Kevko +.

Yksi säännönmukaisuus riittää suodattimeksi, ja **haarukkaan jää 87 käyttökelpoista**.

### Uusi suodatin 2: myykö niche konetta

Peliaiheinen ei riitä. Minecraft ja Fortnite ovat Prenewin toimivimmat nichet heidän omassa
datassaan, ja ne vaativat koneen. Geometry Dash ei. Nichen painotus tulee heidän omista
onnistumisistaan, ei siitä että video on pelivideo.

### Katselusuhde on signaali kahteen suuntaan

91 % tilaajamäärästä on terve yleisö. **478 % on varoitusmerkki**, ei kiitettävä tulos: se kertoo
tyypillisesti että sisältö ei ole tekijän omaa vaan lainattua. Pisteytyksessä tarvitaan siis
molemmat rajat, ylä- ja alaraja.

---

## Mitä tämä tarkoittaa demon kannalta

Maakohtainen lista on julkinen ja kenen tahansa haettavissa, joten pelkkä reitti C ei riitä
vastaukseksi kysymykseen *"löytääkö se ne joita työkalut eivät löydä"*. Se vastaus tulee reitistä
B: kommentoijista löytyneet 500–9 000 tilaajan tekijät eivät ole yhdelläkään vaikuttaja-alustalla.

Demossa kannattaa siis näyttää molemmat ja sanoa ero ääneen: **reitti C tuottaa listan jonka he
voisivat periaatteessa koostaa itse, reitti B tuottaa sen jota he eivät löydä mistään.**
