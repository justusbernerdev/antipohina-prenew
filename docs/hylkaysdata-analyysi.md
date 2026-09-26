# Hylkäysdatan analyysi

Akseli toimitti 26.9.2026 tiedoston *Prenew not realised collabs example.xlsx*: **26 yhteistyötä
jotka eivät toteutuneet, syineen.** Tämä oli kysymyslistan kärjessä, koska ilman negatiivisia
esimerkkejä kone osaa vain etsiä samannäköisiä kuin ne jotka jo onnistuivat.

Aineisto on jäsennetty tiedostoon `data/not-realised.json`. Se muutti pisteytystä viidessä
kohdassa, ja yhden aiemman oletuksen se kumosi kokonaan.

---

## Hylkäyssyyt

| Syy | Kpl | YouTube-mediaani |
|---|---|---|
| **Kilpailija tai eksklusiivisuus** | **5** | **479 000** (110k–629k) |
| Liian kallis (+1 hiljeni hinnan jälkeen) | 5 | 42 100, mutta **TikTok 79k–340k** |
| Hiljeni | 3 | 15k–240k |
| Brändi tai kanava ei sopinut | 2 | 261 000 |
| Epätasaiset katselut | 2 | 259 000 |
| **Liian pieni** | 2 | **7 700** |
| Muut yksittäiset | 7 | ajoitus, kieli, sisältö, alusta, passiivisuus, ei tekijä |

Vertailukohta: **toteutuneiden YouTube-mediaani on 75 000.**

Markkinoittain hylkäykset: DE 13, DK 5, SE 4, FI 2, EE 1, LT 1. Saksa on siis sekä
agentuurivetoisin että hylätyin markkina.

---

## Neljä havaintoa jotka muuttavat konetta

### 1. Yli 110 000 tilaajaa tarkoittaa että joku ehti ensin

Kaikki viisi kilpailija- tai eksklusiivisuussyyllä hylättyä olivat 110 000–629 000 tilaajan
kanavia, mediaani 479 000. Yksikään pienempi ei kaatunut siihen syyhyn.

Tämä on käytännön yläraja, ja se on **paljon alempi kuin briiffistä pääteltävä 250 000.** Kone
rankaisee nyt tämän rajan ylittäviä 30 pisteellä ja kertoo syyn perustelurivillä.

Vaikutus oli välitön: ennen tätä kärjessä oli 155k, 199k ja 233k tilaajan kanavia. Niiden
tavoittelu olisi ollut ajanhukkaa, ja demossa Akseli olisi tunnistanut sen heti.

### 2. Iso TikTok on hintariski, ei etu

Tämä kumosi aiemman oletuksen. Neljä hintasyyllä hylättyä näyttivät YouTubessa pieniltä
(33k–48k) mutta heillä oli **TikTokissa 79 000–340 000 seuraajaa.** Hinta tuli TikTokista.

Pisteytys antoi aiemmin +25 pistettä pelkästä TikTok-läsnäolosta. Läsnäolo on edelleen hyvä
merkki, koska se korreloi toistuvien kumppanuuksien kanssa, mutta **kokoa ei voi ohittaa.**
Tätä ei voi vielä toteuttaa loppuun, koska TikTok-seuraajamäärä vaatii suoran TikTok-haun.
Se on kirjattu taskiin 5 ja on nyt selvästi tärkeämpi kuin ennen.

### 3. Aiemmin hylätyt pitää tunnistaa

**Lewa oli koneen kärjessä sadalla pisteellä. Prenew oli jo hylännyt hänet syyllä "content fit".**
Sama koski Jyksediä, joka hiljeni ensin mutta teki yhteistyön myöhemmin.

Ilman hylkäysdataa kone olisi tarjonnut heille takaisin sitä mitä he ovat jo katsoneet ja
hylänneet. Se on täsmälleen se ominaisuus joka saa työkalun näyttämään tyhmältä.

Nyt hylätyt merkitään (`aiemmin_hylatty`-sarake syineen) ja siirretään pois kärjestä. Niitä ei
poisteta, koska neljä hylätystä teki yhteistyön myöhemmin: **"Did collab later" on 4/26**, joten
hylkäys ei ole lopullinen. Ne saavat lievemmän rangaistuksen kuin lopullisesti hylätyt.

### 4. Kilpailijan mainitseminen on suurin yksittäinen hylkäyssyy

Viisi kahdestakymmenestäkuudesta. Ja se on havaittavissa ilmaiseksi: jos kanavan kuvauksessa on
toisen konekaupan nimi tai alennuskoodi, tekijä on jo jonkun muun. Kone tarkistaa nyt tunnetut
PC- ja kunnostuskauppiaat kohdemarkkinoissa ja rankaisee 40 pisteellä.

---

## Kaksi pienempää

**Organisaatiot eivät ole tekijöitä.** "Big clan" hylättiin syyllä *not a creator*. Nimessä
esiintyvät clan, esports, team ja academy tunnistetaan ja rankaistaan.

**Alaraja on olemassa mutta epäselvä.** Liian pieniksi hylätyt olivat YouTubessa 1 990 ja 7 700
tilaajaa. Silti onnistuneissa on LeiskaGG, jolla on 1 210 YouTube-tilaajaa ja 17 700
TikTok-seuraajaa. Eli TikTok kompensoi pienen YouTuben. **Alarajaa ei siis aseteta kovaksi
suodattimeksi**, vaan pieni koko näkyy perustelurivillä ja päätös jää ihmiselle. Pienten
löytäminen on koko haasteen ydin, joten niitä ei poisteta arvaamalla.

---

## Mitä tämä tarkoittaa

Pisteytys ei enää nojaa kymmenen toistuneen tekijän otokseen. Nyt sen takana on **69 onnistumista
ja 26 dokumentoitua epäonnistumista syineen**, ja rajat on laskettu niistä eikä arvattu.

Tämä on myös se asia joka kannattaa sanoa demossa. Malli ei kerro kenet kannattaa löytää, vaan
kenet kannattaa **ohittaa**, ja se tieto tulee heidän omasta CRM:stään.
