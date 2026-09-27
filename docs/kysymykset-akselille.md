# Kysymykset Akselille 27.9.

Järjestetty sen mukaan paljonko vastaus muuttaa. Kolme ensimmäistä kannattaa kysyä vaikka aikaa
olisi vain minuutti.

Koko riskilista ja aiemmat kysymykset: [`riskit-ja-kysymykset.md`](riskit-ja-kysymykset.md).

---

## Kolme jotka ratkaisevat

### 1. Saatteko alennuskoodin tuoton ulos kassalta, koodikohtaisesti?

*Miksi kysyn:* Te mittaatte yhteistyön kassalla koodista. Se on paras olemassa oleva
onnistumismittari ja tällä hetkellä se ei ole kytketty mihinkään — moottori pisteyttää sen
perusteella toistuiko yhteistyö, mikä on huonompi mittari samasta asiasta.

Moottorissa on jo paikka tälle: `record_outcome` ottaa `orders`- ja `revenue`-kentät, ja siitä
lasketaan **mikä kokoluokka oikeasti myi koneita**. Tänään se osa sanoo rehellisesti *"ei dataa"*.

*Mitä tarvitsen:* tilausten määrä ja euromäärä koodia kohti, vaikka vain menneiltä kampanjoilta.
Neljä tekijää riittää siihen että luku alkaa vaikuttaa, kaksitoista siihen että se on luotettava.

*Mitä se muuttaa:* jos koodidata sanoo että 5 000 tilaajan tekijä myy enemmän koneita per euro kuin
80 000 tilaajan, koko pisteytyksen painopiste kääntyy — ja se on juuri se väite jota ei voi
testata ilman tätä dataa.

---

### 2. Mitä `Agency: Yes` tarkoittaa sarakkeessa?

*Miksi kysyn:* Tämä on kysytty aiemmin eikä siihen ole vastausta, ja koko johtopäätös kääntyy sen
mukaan. Tuliko yhteistyö agentuurin kautta, vai onko tekijällä agentuuri?

- Jos **hankittiin agentuurilta**: 39 % yhteistöistänne on ostettu välikädeltä, ja jokainen suoraan
  löydetty tekijä on yksi palkkio vähemmän. Se on suora rahamääräinen argumentti.
- Jos **tekijällä on agentuuri**: havainto kääntyy toisin päin. Kannattaa etsiä tekijöitä joilla
  *ei* ole manageria, ja se osoittaa täsmälleen tämän koneen vahvuuteen, koska kommentoijareitistä
  löytyvät 500–10 000 tilaajan tekijät eivät ole kenenkään edustuksessa.

*Mitä tarvitsen:* yhden lauseen.

---

### 3. Saksa: 10 yhteistyötä, 8 agentuurimerkinnällä, **nolla toistoa** — ja 13 hylkäystä 26:sta. Tiedättekö miksi?

*Miksi kysyn:* Tämä on aineiston selvin kuvio ja se osoittaa yhteen maahan. Saksa on kasvumarkkina,
sinne avattiin varasto 2026, ja se on samaan aikaan:

| | |
|---|---|
| Yhteistöitä | 10 |
| Toistuvia kumppanuuksia | **0** |
| Agentuurin kautta | 8/10 |
| Osuus kaikista hylkäyksistä | **13/26 eli puolet** |

Suomessa suhde on päinvastoin: 17 yhteistyötä, 4 toistuvaa, 2 agentuurimerkintää.

*Mitä se muuttaa:* jos syy on hinta, moottorin pitää karsia Saksassa aggressiivisemmin ylhäältä.
Jos syy on että agentuurin kautta ostettu yhteistyö ei synnytä suhdetta, vastaus on etsiä
Saksasta suoraan — ja se on juuri se mitä kohdennettu ajo tekee.

---

## Mitä uutta rakennettiin, ja mitä siitä pitää varmistaa

### 4. Onko "kiinnitä nyt" oikein päin?

Teidän datanne sanoo että yli 110 000 tilaajan kohdalla joku ehti jo ensin. Siitä seuraa että
kasvava pieni tekijä on halpa nyt ja kallis myöhemmin, ja moottori nostaa nyt kärkeen ne joilla
ikkuna on sulkeutumassa.

*Onko tämä teille oikea päättelysuunta, vai onko iso tekijä silti arvokkaampi vaikka kalliimpi?*

### 5. Vanhempien valinta: onko nuori yleisö tavoite vai sivutuote?

Teillä on kategoria Vanhempien valinta ja sivu `gaming-pc-for-kids`, ja Minecraft on suurin
nichenne. Moottorissa on nyt `--segment=parents`, joka nostaa kanavat joilla tekijä itse sanoo
kanavan olevan lapsiystävällinen — 23 tällaista löytyi.

*Onko tämä tarkoituksellinen kohderyhmä jolle halutaan lisää, vai sattumaa jota ei haluta korostaa?*
Vastaus kääntyy myös toisin päin: jos ette halua tehdä yhteistöitä kanavien kanssa joiden yleisö on
alle 13, merkintä on suodatin eikä nosto.

### 6. Kilpailijalista: onko siitä hyötyä?

Kuusi tekijää mainitsee kilpailijan kuvauksessaan (Alternate, Corsair, HyperX). Ne putoavat
kärjestä, koska kilpailijamaininta on suurin yksittäinen hylkäyssyynne. Mutta samat rivit ovat
myös lista siitä keitä kilpailijat maksavat, ja se syntyy ilmaiseksi.

*Onko tämä teille käyttökelpoista, ja onko kilpailijalistassa nimiä jotka puuttuvat?* Tunnistus on
sanalista, eli siihen voi lisätä nimiä minuutissa.

### 7. Mikä tahti?

YouTuben ehdot eivät anna säilyttää API-dataa yli 30 päivää, joten tämä on ajo eikä tietokanta.
Moottori tietää kuka on jo nähty, joten ajastettu ajo tuottaa vain uudet.

*Mikä tahti istuu teille — viikko, kuukausi, vai kampanjan mukaan?* Sanoitte että kone on varastossa
keskimäärin viikon; jos sama rytmi sopii tähän, viikoittainen ajo on luonteva.

---

## Loput, jos aikaa jää

8. **Kuinka monta vaikuttajaa teillä on tänään yhteensä ja kuinka monessa maassa?** Julkisesti
   löytyi yksi sivu.
9. **Kun vaikuttaja suosittelee konetta, valitseeko hän sen itse vai annatteko listan?** Vaikuttaa
   siihen pitääkö niche osua tuotteeseen vai riittääkö että yleisö on oikea.
10. **Mitä tapahtuu kun vaikuttaja sanoo kyllä?** Kuinka kauan menee ennen kuin sivu ja koodi ovat
    pystyssä? Jos se on hidas, löytönopeus ei ole pullonkaula.
11. **Mistä tiedätte että koodi toi asiakkaan**, jos asiakas löysi koodin koodisivustolta?
12. **TikTok on mukana 64 %:ssa yhteistöistänne mutta YouTube-tekijät toistuvat useammin.** Onko
    teillä sama havainto?
13. **Onko teillä mieluummin yksi iso ajo vai jatkuva virta?** Tämä ratkaisee sen kannattaako
    rakentaa ajastus vai jättää komento.

---

## Ja yksi jota ei kysytä vaan kerrotaan

He sanoivat ettei heillä ole juuri dataa huonoista diileistä, ja että ne yksittäiset eivät ole
tilastollisesti merkittäviä.

**Se yksi tiedosto jonka he silti lähettivät muutti pisteytyksen rajoja neljässä kohdassa.** 26
riviä. Sillä ei ole väliä onko se tilastollisesti merkittävä, koska se ei ole tutkimus vaan
kalibrointi: yläraja 110 000 tulee suoraan siitä, samoin hintaraja 79 000 ja se että aiemmin
hylätty tekijä ei enää nouse kärkeen.

Tämä kannattaa sanoa ääneen, koska siitä seuraa suoraan pyyntö numero 1: **kirjatkaa epäonnistumiset
jatkuvasti, syy mukana.** Se on parasta opetusdataa mitä tästä voi saada, ja `record_outcome` tekee
siitä yhden kutsun eikä erillistä työtä.
