# Riskit, epävarmuudet ja kysymykset

Kaikki mikä voi mennä pieleen, ja mitä sille tehdään. Jokaiselle riskille on ratkaisu tai
varasuunnitelma. Tarkistettu 26.9.2026.

Tämän tiedoston tarkoitus ei ole listata huolia vaan poistaa ne pöydältä ennen kuin ne yllättävät
kesken rakentamisen.

## Vaikeimmat asiat, järjestyksessä

Viisi asiaa joista tämä työ ratkeaa. Kaikki muu on toteutusta.

| # | Vaikein kohta | Miksi | Tila |
|---|---|---|---|
| 1 | TikTok-löytö ilman virallista rajapintaa | 64 % heidän yhteistöistään, eikä tutkimusrajapintaa saa | Ratkaisu on, maksaa muutaman euron (A7) |
| 2 | Kommentit pois lastensisällössä | Minecraft on isoin niche ja juuri siinä reitti on heikoin | Kolme reittiä rinnakkain, katko on myös signaali (A2) |
| 3 | Maapäättely pienissä markkinoissa | Koko haasteen ydin, ja kanavan maakenttä on usein tyhjä | Kolme signaalia, epävarma merkitään (A3, A4) |
| 4 | 30 päivän säilytysraja | Tuote ei voi olla staattinen tietokanta | Päivittyvä putki, virkistys ilmaiseksi (A6) |
| 5 | Aika ja Mergero | Tämä on toissijainen kohde | Jokainen vaihe esityskelpoinen erikseen (D1) |

Yksikään näistä ei ole umpikuja. Kohdat 1 ja 4 muuttavat tuotteen muotoa, kohdat 2 ja 3 vaativat
useaa rinnakkaista reittiä yhden sijaan, ja kohta 5 vaatii sen että työ pilkotaan oikein.

---

## A. Tekniset riskit

### A1. Featured channels voi olla tyhjä

**Riski.** Laajennus nojaa siihen että tekijät ovat nostaneet muita kanavia
(`channelSections.list`, tyyppi `multipleChannels`). Ominaisuus on olemassa ja API toimii, mutta
osa tekijöistä ei ole koskaan asettanut sitä. Jos suurin osa on tyhjä, reitti kuihtuu.

**Tila.** Avoin. Tämän ratkaisee savutesti, `scripts/smoke-test.mjs`.

**Ratkaisu.** Paino siirtyy kommentoijiin ja maakohtaisiin siemeniin, joita on 11 maata × oma
kategorialista.

**Tutkittu ja hylätty varasuunnitelma:** `subscriptions.list`. Ajattelin että tekijän julkiset
tilaukset olisivat neljäs reitti, mutta **YouTuben tilaukset ovat oletusarvoisesti yksityisiä**.
API palauttaa silloin `subscriptionForbidden (403)`. Reitti toimisi vain sille vähemmistölle joka
on erikseen kytkenyt tilauksensa julkisiksi, joten siihen ei voi nojata.

### A2. Kommentit ovat pois päältä lastensisällössä

**Riski.** Tämä on vakavin tekninen löytö. YouTube poistaa kommentit **automaattisesti** kaikista
videoista jotka on merkitty *made for kids*, COPPA-vaatimuksen takia. API palauttaa silloin
403 ja syyn `commentsDisabled`.

Minecraft on heidän isoin nichensä (10 yhteistyötä 69:stä) ja juuri se sisältö on useimmin
merkitty lapsille. Eli kommentoijareitti on heikoimmillaan täsmälleen siinä nichessä jossa sitä
eniten tarvittaisiin.

**Tila.** Vahvistettu dokumentaatiosta.

**Ratkaisu.**
1. Älä koskaan nojaa yhteen reittiin. Kolme rinnakkaista reittiä, ja kukin täydentää toisiaan.
2. 403 `commentsDisabled` on odotettu tila, ei virhe. Skripti ohittaa sen ja jatkaa.
3. Kaikki Minecraft-sisältö ei ole merkitty lapsille. Aikuisyleisölle suunnattu Minecraft-sisältö
   säilyttää kommentit, ja juuri ne kanavat ovat Prenewin kannalta kiinnostavampia, koska ostaja
   on vanhempi.
4. Käänteinen hyöty: jos videon kommentit ovat pois, se on itsessään **signaali** siitä että
   yleisö on alle 13. Se menee CSV:hen riskisarakkeeseen, ei roskiin.

### A3. Kanavan maakenttä on usein tyhjä

**Riski.** `snippet.country` on vapaaehtoinen. Pelkkä sen varaan rakentaminen hukkaa juuri pienet
markkinat.

**Tila.** Tunnettu, ratkaisu suunniteltu.

**Ratkaisu.** Maa päätellään kolmesta signaalista jotka tulevat ilmaiseksi mukana: videon
`defaultAudioLanguage`, otsikoiden ja kuvausten kieli, ja millä `regionCode`-listalla kanava
esiintyi. Kolmesta kaksi riittää.

### A4. Kielentunnistus lyhyistä teksteistä

**Riski.** Pelivideon otsikko on usein kolme sanaa ja puolet englantia. Tunnistus menee pieleen
erityisesti virossa, latviassa ja liettuassa, eli juuri niissä markkinoissa joista haaste kertoo.

**Ratkaisu.** Älä tunnista otsikosta yksin. Yhdistä kuvaus (pidempi teksti), kanavan omat
avainsanat ja kommenttien kieli. Jos signaalit ovat ristiriidassa, merkitse maa epävarmaksi
CSV:hen sen sijaan että arvataan. Epävarma rivi on käyttökelpoinen, väärä rivi ei.

### A5. Kiintiö loppuu kesken

**Riski.** 10 000 yksikköä päivässä ja 100 hakukutsua.

**Tila.** Laskettu, ks. `docs/datalahteet.md` kohta 6. Demo kuluttaa noin 2 100 yksikköä ja
0 hakukutsua siemenvaiheen jälkeen.

**Ratkaisu.** Välimuisti levylle heti alusta. Jokainen kanava haetaan kerran, ei kerran per ajo.
Kehitys ja demo eivät saa kuluttaa samaa budjettia kahdesti.

### A6. YouTuben käyttöehdot rajoittavat datan säilytystä

**Riski.** Tämä on tutkituista riskeistä se joka muuttaa tuotteen muotoa, ei vain toteutusta.

YouTube Developer Policies kohta III.E.4.d: ei-valtuutettua API-dataa saa säilyttää väliaikaisesti,
**mutta enintään 30 kalenteripäivää**, minkä jälkeen se on joko poistettava tai päivitettävä.
Kohta III.E.2.a rajoittaa lisäksi datan yhdistelyä eri sisällönomistajien välillä.

Toisin sanoen: **pysyvä vaikuttajatietokanta jota ei päivitetä on ehtojen vastainen.** Sama sääntö
koskee kaikkia vaikuttaja-alustoja, myös niitä jotka Prenew on jo kokeillut.

**Ratkaisu, ja se sattuu olemaan sama asia joka tekee tuotteesta paremman.**

1. Rakennetaan päivittyvä putki, ei arkisto. Data on tuore tai sitä ei ole. Tämä on muutenkin
   ainoa tapa jolla tekijätiedot ovat hyödyllisiä: puolen vuoden vanha tilaajamäärä on väärä.
2. Päivityssykli on ilmainen. RSS-syöte ei kuluta kiintiötä lainkaan, joten koko universumin
   voi virkistää 30 päivän välein nollalla yksiköllä.
3. Lopputuote on **Prenewin oma ajo omalla avaimellaan**, ei meidän ylläpitämä palvelu.
   He ovat rekisterinpitäjä ja ehtojen osapuoli, kuten kuuluukin.
4. CSV on tilannekuva päätöksentekoa varten, ei jälleenmyytävä tietokanta.

Tämä kannattaa sanoa demossa ääneen. Se erottaa ratkaisun niistä alustoista joita he ovat
kokeilleet, ja selittää samalla miksi arkkitehtuuri on juuri tällainen.

### A7. TikTokin käyttöehdot

**Riski.** Virallinen Research API on kaupallisilta suljettu. Oma scraper rikkoisi käyttöehtoja.

**Ratkaisu.** Älä kirjoita omaa scraperia. Käytä kaupallista palveluntarjoajaa, joka toimii
julkisen datan varassa ja kantaa itse vastuun toteutuksestaan. Pay-as-you-go, ei tilausta, kulu
muutamia euroja. Tämä on myös rehellinen vastaus jos sitä kysytään demossa.

---

## B. Menetelmän epävarmuudet

### B1. Otos on pieni

10 toistunutta tekijää ja 41 kertaluonteista. Havainnot toistosta ovat suunta, eivät laki.

**Ratkaisu.** Esitä ne havaintoina heidän omasta datastaan, älä mallina. Sano otoskoko ääneen.
Akseli tietää aineistonsa koon ja arvostaa varovaisuutta enemmän kuin liikaa luvattua.

### B2. Datassa on vain onnistumiset

Tämä on suurin metodologinen aukko. Aineisto sisältää tehdyt yhteistyöt. Siitä puuttuu kokonaan:
kenelle otettiin yhteyttä eikä vastannut, kuka kieltäytyi, ja mikä yhteistyö tehtiin mutta floppasi.

Ilman negatiivisia esimerkkejä emme voi oppia mikä **ei** toimi, vain mikä toistui.

**Ratkaisu.** Kysytään (kysymys 3 alla). Jos sitä ei saada, toisto on paras käytettävissä oleva
mittari ja se sanotaan suoraan.

### B3. "Niche merkitty" korreloi toiston kanssa

Toistuneista 80 %:lla niche on merkitty, kertaluonteisista 49 %:lla. Tämä on lähes varmasti
kirjausartefakti: tutumpi kumppani on kirjattu huolellisemmin. **Ei käytetä signaalina.**

### B4. Aineistossa on aukkoja

26 riviltä puuttuu niche, 16:sta viikko, 6:lta alusta. Puolelta tekijöistä puuttuu YouTube-luku.

**Ratkaisu.** Lasketaan aina n näkyviin, ei prosenttia tyhjästä. Korjattu jo `README.md`:hen.

### B5. Emme tiedä agentuurin hintaa

Agentuurihavainto on vahva (toistuneista 20 %, kertaluonteisista 49 %), mutta euromääräinen
vaikutuslaskelma vaatii palkkion suuruuden.

**Ratkaisu.** Kysytään (kysymys 1). Ilman sitä puhutaan osuuksista, ei euroista.

---

## C. Vastuullisuus

### C1. Alaikäiset tekijät

Minecraft ja Fortnite tarkoittavat nuorta yleisöä ja osin nuoria tekijöitä. Työkalu joka tuottaa
listan tekijöistä ja yhteystiedoista voi tuottaa listan lapsista.

**Ratkaisu, ja tämä on myös erottautumistekijä.** CSV:hen oma sarake: viitteitä alaikäisyydestä.
Signaalit ovat jo haettuja: kommentit pois (made for kids), kanavan oma ikäraja, sisällön tyyppi.
Riviä ei poisteta vaan se merkitään, ja päätös jää ihmiselle.

Yksikään vaikuttaja-alusta ei tee tätä. Prenewillä on kategoria **Vanhempien valinta** ja sivu
`gaming-pc-for-kids`, eli ostaja on vanhempi ja käyttäjä on lapsi. Tämä sarake puhuu suoraan
heidän omaan tuotelogiikkaansa.

### C2. Henkilötiedot

Tekijät ovat luonnollisia henkilöitä. Kerättävä tieto on julkista ja itse julkaistua (kanavan
kuvaus, tilaajamäärä), mutta se on silti henkilötietoa.

**Ratkaisu.** Kerätään vain se mikä on julkista ja tarpeellista, ei tallenneta arkaluontoista,
ja jokaisesta rivistä kerrotaan mistä se on peräisin. Perustelusarake on samalla
läpinäkyvyysmekanismi. Käyttöönoton jälkeen rekisterinpitäjä on Prenew, ja se mainitaan.

---

## D. Kilpailuun liittyvät

### D1. Aika ja Mergero

Mergero on lukittu pääkohde. Tämä rakennetaan vain jos moottori on valmis ajoissa.

**Ratkaisu.** Putki rakennetaan niin että jokainen vaihe tuottaa esityskelpoisen tuloksen.
Siemenet yksin ovat jo demo, löytö ilman pisteytystä on demo, ja pisteytetty CSV on koko tuote.
Ei kaikki tai ei mitään.

### D2. Liian moni alusta

Akseli: *"Tiktok ja Youtube are most important, but more platforms are considered a plus."*
Houkutus tehdä viisi alustaa pinnallisesti on todellinen.

**Ratkaisu.** Kaksi alustaa kunnolla. Twitch mukaan vain siksi että se maksaa nolla ja todistaa
maakohtaisen suodatuksen yhdellä kutsulla.

### D3. Demo on live ruudulla

Olivia: live-demo omalla ruudulla, ja materiaalit sähköpostilla. CSV yksin ei kerro tarinaa
kymmenessä sekunnissa.

**Ratkaisu.** Ohut näkymä JSONin päälle, tehdään vasta kun dataa on. Ruudulla kaksi asiaa
vierekkäin: agentuuritaulukko (Saksa 8/10, nolla toistoa) ja lista löydetyistä saksalaisista
tekijöistä perusteluineen.

---

## E. Kysymykset Akselille

Järjestetty sen mukaan, kuinka paljon vastaus muuttaa ratkaisua.

**Ratkaisevat:**

1. **Mitä agentuuripalkkio maksaa?** 39 % yhteistöistänne tuli agentuurin kautta ja Saksassa
   8 kymmenestä. Tämä luku on vaikutuslaskelman kerroin.
2. **Onko toistuva yhteistyö teille oikea onnistumisen mittari?** Rakennamme pisteytyksen sen
   varaan, koska se on ainoa mittari joka aineistosta näkyy. Jos teillä on parempi, käytämme sitä.
3. **Onko teillä dataa epäonnistumisista?** Kenelle otitte yhteyttä eikä vastannut, kuka kieltäytyi,
   mikä yhteistyö tehtiin mutta ei tuottanut. Nyt näemme vain onnistumiset, emmekä voi oppia
   mikä ei toimi.

**Tarkentavat:**

4. **Saksassa 8 yhteistyötä 10:stä agentuurin kautta ja nolla toistoa. Tiedättekö miksi?**
   Kotimarkkinalla suhde on päinvastoin.
5. **TikTok on mukana 64 %:ssa yhteistöistänne, mutta YouTube-tekijät toistuvat useammin.**
   Onko teillä sama havainto?
6. Teettekö yhteistöitä kanavien kanssa joiden yleisö on alle 13? Se muuttaa sitä, mitä työkalun
   pitää merkitä ja mitä jättää pois.
7. Kun vaikuttaja suosittelee konetta, valitseeko hän sen itse vai annatteko listan?
8. Mitä tapahtuu kun vaikuttaja sanoo kyllä? Kuinka kauan menee ennen kuin sivu ja koodi ovat
   pystyssä?
9. Kuinka monta vaikuttajaa teillä on tänään yhteensä ja kuinka monessa maassa? Julkisesti löytyi
   yksi.
10. Mistä tiedätte että koodi toi asiakkaan, jos asiakas löysi koodin koodisivustolta?

---

## Lähteet

- [Made for kids: disabled features | YouTube Help](https://support.google.com/youtube/answer/9527654)
- [Errors | YouTube Data API](https://developers.google.com/youtube/v3/docs/errors)
- [ChannelSections | YouTube Data API](https://developers.google.com/youtube/v3/docs/channelSections)
- [YouTube API Services Developer Policies](https://developers.google.com/youtube/terms/developer-policies), kohdat III.E.2 ja III.E.4
- [YouTube API Services Terms of Service](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- [Subscriptions: list | YouTube Data API](https://developers.google.com/youtube/v3/docs/subscriptions/list)
- [Change your subscription privacy settings | YouTube Help](https://support.google.com/youtube/answer/7280190)
- `docs/datalahteet.md` samassa repossa
- Akselin ja Olivian Q&A tapahtuman Discordissa 26.9.2026
