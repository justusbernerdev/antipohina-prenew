# Mitä löydön jälkeen tapahtuu

Tämä ei ole osa haastetta. Akseli sanoi suoraan ettei outreach kuulu siihen ja että heillä on siihen
omat automaationsa, ja se kanta otetaan tässä todesta: löytö ja yhteydenotto ovat eri asioita eikä
toista pakoteta toisen mukana.

Dokumentti on olemassa siksi, että kysymys tulee joka tapauksessa. Kun Prenew näkee 1 000 tekijää
joista 130:llä on sähköposti, seuraava kysymys on mitä niille tehdään.

**Jos he kysyvät, vastaus on tämä. Jos he eivät kysy, tätä ei nosteta esiin.**

---

## Silmukka

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                                                             │
 │   1. SIGNAALI                    2. MOOTTORI                3. TARKISTUS    │
 │   ───────────                    ──────────                 ───────────     │
 │   markkina, niche,     ──MCP──▶  discover_creators   ─────▶  ihminen        │
 │   kokohaarukka                   pisteytys + perustelu       katsoo listan  │
 │   heidän omasta                  42 kenttää per tekijä       ja poimii      │
 │   järjestelmästään                                                          │
 │                                                                     │       │
 │                                                                     │       │
 │   5. TAKAISIN                    4. KONTEKSTI JA LÄHETYS           │       │
 │   ───────────                    ────────────────────────          ▼       │
 │   record_outcome      ◀──MCP───  Selda                                      │
 │   toteutui / hylättiin           analysis-kenttä = moottorin perustelu      │
 │   tilauksia, myynti €            + Brain: hinnat, tarjoussäännöt, tyyli     │
 │                                  + luonnos odottaa hyväksyntää              │
 │          │                                                                  │
 │          └──────────── rajat lasketaan uudelleen ──────────────────┐        │
 │                                                                    │        │
 └────────────────────────────────────────────────────────────────────┘        │
                                                                               │
   Seuraava ajo pisteyttää uusilla rajoilla ◀───────────────────────────────────┘
```

Olennaista on että **tieto kulkee ympyrää eikä putkessa.** Jokainen vaihe on kytkettävissä joko
MCP:llä tai rajapinnalla, ja jokainen vaihe on ohitettavissa: he voivat ottaa vain vaiheen 2 ja
tehdä loput itse, mikä on se mitä he tänään pyysivät.

---

## Vaihe 1 — signaali sisään

Heidän oma järjestelmänsä tai agenttiprosessinsa kysyy kandidaatteja. Ei käyttöliittymää, ei
kirjautumista.

```
discover_creators({
  markets: ["DE"],
  niches: ["minecraft", "fortnite"],
  maxSubs: 50000,
  segment: "parents"
})
```

Signaali voi tulla mistä tahansa: varaston avaaminen uuteen maahan, kampanjan aloitus, tai
kuukausittainen ajastus. Se on kutsu eikä työnkulku.

---

## Vaihe 2 — moottori

Palauttaa pisteytetyt tekijät, ja jokaisella rivillä on perustelu. Tämä on se osa joka rakennettiin
haasteeseen, ja se toimii yksinään ilman mitään muuta tässä dokumentissa.

---

## Vaihe 3 — ihminen katsoo

Lista tarkistetaan. Tämä vaihe ei ole automatisoitavissa eikä sitä yritetä automatisoida: kukaan ei
lähetä viestiä tekijälle jota ihminen ei ole katsonut.

Perustelusarake on juuri tätä varten. Rivin hyväksyminen tai hylkääminen on yhden silmäyksen
päätös, koska rivi kertoo itse miksi se on siellä.

---

## Vaihe 4 — konteksti ja lähetys

Poimitut tekijät siirtyvät Seldaan. Siirto on yksi kutsu, ja ratkaiseva kenttä on `analysis`.

Seldan oma kuvaus kentästä: *tutkimus jonka olet jo tehnyt tästä yrityksestä; Selda kirjoittaa
yhteydenoton tästä sen sijaan että se kaivaisi tiedot uudelleen.*

Moottorin perustelu **on** se tutkimus. Esimerkki, generoitu oikeasta rivistä:

> Fireonyx on saksalainen YouTube-tekijä, 7 150 tilaajaa ja 4 215 katselua per video (30d ikkuna).
> Sisältö: Minecraft (myös Fortnite ja GTA). Yleisö on aktiivinen: video tavoittaa 59 %
> tilaajamäärästä, ja kanava julkaisee 20 videota kuussa, edellisestä 1 päivää. Tekijä luettelee
> oman kokoonpanonsa kanavan tiedoissa, eli puhuu laitteistosta jo nyt omasta aloitteestaan. Kone
> ei ole hänen kanavallaan väkinäinen aihe. Löytyi kommentoijareitistä, eli ei ole
> vaikuttaja-alustoilla löydettävissä.

Tämän päälle Selda tuo oman osansa: hinnat, tarjoussäännöt, äänensävy ja ne asiat joita ei saa
luvata. Lopputulos on luonnos joka odottaa ihmisen hyväksyntää.

**Selda ei lähetä mitään itse.** Luonnos jää Sales Inboxiin ja ihminen painaa lähetä.

Silta on rakennettu: `node scripts/to-selda.mjs` kirjoittaa tiedoston joka menee suoraan Seldan
`selda_add_leads`-työkalulle. Se ei kutsu mitään eikä lähetä mitään, vain kirjoittaa tiedoston.

```
node scripts/to-selda.mjs out/de-minecraft/creators.json --limit=20 --require-email
```

---

## Vaihe 5 — tieto takaisin

Kun yhteistyö päättyy johonkin, tulos palaa moottoriin.

```
record_outcome({
  channel: "Fireonyx",
  outcome: "realised",
  subs: 7150,
  code: "FIREONYX10",
  orders: 14,
  revenue: 11200
})
```

Ja jos se ei toteutunut:

```
record_outcome({
  channel: "JokuMuu",
  outcome: "rejected",
  reason: "Competitor / exclusivity",
  subs: 62000
})
```

Tämä on se kohta jota kukaan muu ei tarjoa. Rajat lasketaan uudelleen heidän datastaan, ja työkalu
palauttaa suoraan mikä raja liikkui ja mihin uusi raja perustuu. Mitattu esimerkki: yksi kirjattu
hylkäys 62 000 tilaajan kohdalla siirsi ylärajan 110 000 → 62 000.

**`orders` ja `revenue` ovat niistä tärkeimmät.** Prenew mittaa yhteistyön kassalla alennuskoodista,
eli koodin tuotto on paras olemassa oleva onnistumismittari — parempi kuin "toistuiko yhteistyö",
koska se mittaa myytyjä koneita eikä vastattuja viestejä. Moottori laskee siitä mikä kokoluokka
oikeasti myi, ja kun mittaustuloksia on riittävästi, se raja korvaa arvion.

Tänään tuo osa on kytketty mutta tyhjä, ja kone sanoo sen ääneen: *"Ei yhtään kirjattua koodin
tuottoa."* Se ei esitä tietävänsä.

---

## Miksi tämä järjestys

Prenew sanoi kaksi asiaa jotka ohjaavat tätä:

1. **Ei erillistä työkalua eikä uutta työnkulkua.** Siksi jokainen vaihe on kutsu heidän omasta
   järjestelmästään eikä sivu johon kirjaudutaan.
2. **Outreach ei kuulu haasteeseen.** Siksi vaiheet 4 ja 5 ovat erillisiä ja valinnaisia, ja
   vaihe 2 toimii ilman niitä.

Ja kolmas asia jonka he sanoivat melkein ohimennen: **he eivät oikeastaan dokumentoi huonoja
diilejä.** Vaihe 5 tekee dokumentoinnista sivutuotteen eikä erillistä työtä, ja se on koko syy
siihen miksi silmukka on ympyrä eikä putki.
