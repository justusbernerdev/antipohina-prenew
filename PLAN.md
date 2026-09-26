# Suunnitelma

Prompt Marketing Hackathon 2026 · Prenew challenge · tiimi **antipöhinä**

Tämä on päätösdokumentti: mitä rakennetaan, miksi juuri se, missä järjestyksessä ja mitä jätetään
tekemättä. Tausta-analyysi on [`README.md`](README.md), tekninen pohja
[`docs/datalahteet.md`](docs/datalahteet.md) ja riskit
[`docs/riskit-ja-kysymykset.md`](docs/riskit-ja-kysymykset.md).

---

## 1. Ratkaisu yhdellä lauseella

**Kone joka löytää pienet pelitekijät sieltä mistä hakukone ei niitä löydä, eli isojen tekijöiden
ympäriltä, ja perustelee jokaisen rivin.**

Ei hakuliittymä. Ei vaikuttaja-alusta. Putki joka ajetaan, ja jonka ulostulo on avattavissa
Excelissä.

---

## 2. Miksi juuri tämä

Haasteen premissi ei ole työkalun puute. Akseli sanoi sen itse:

> *"Most of them haven't worked too well for us; especially in smaller markets they missed a lot
> of creators."*

Vaikuttaja-alustoja on kymmeniä ja ne kaikki näyttävät hyvältä. Ne epäonnistuivat yhdessä asiassa.
Siksi voittava mittari on yksi luku:

> **Montako oikeaa tekijää löydettiin, joita olemassa olevat työkalut eivät löydä.**

Kaikki muu tässä dokumentissa on tuon luvun tuottamista ja todistamista.

### Mitä heidän oma datansa sanoo

69 yhteistyötä, 51 tekijää, 11 maata. Neljä havaintoa ohjaavat rakennetta:

**Agentuuriin kytkeytyneet yhteistyöt eivät jää.** Toistuneista tekijöistä 20 % on merkitty
agentuuriin, kertaluonteisista 49 %. Maatasolla kuvio on jyrkempi: Saksassa 8 yhteistyötä
kymmenestä on agentuurimerkinnällä ja toistoja on **nolla**. Suomessa 2/17 ja toistoja neljä.

> Varaus: sarakkeen otsikko on pelkkä `Agency` ja arvo `Yes`. Tarkoittaako se että yhteistyö
> hankittiin agentuurin kautta, vai että tekijällä on agentuuri, on kysytty Akselilta. Havainto
> pitää kummassakin tapauksessa, mutta johtopäätös kääntyy: joko ostakaa suoraan, tai etsikää
> tekijöitä joilla ei ole manageria. Jälkimmäinen osoittaisi juuri tämän koneen vahvuuteen.
> Ks. [`docs/riskit-ja-kysymykset.md`](docs/riskit-ja-kysymykset.md) kohta B5.

**TikTok tuo volyymin, YouTube tuo suhteen.** TikTok on mukana 64 %:ssa yhteistöistä mutta se ei
erottele toistuneita kertaluonteisista lainkaan (70 % vs 68 %). YouTube erottelee yli
kaksinkertaisesti (60 % vs 27 %). Toistuneet tekijät ovat tyypillisesti **molemmilla alustoilla**.

**Painopiste on keskikokoisissa, mutta häntä ulottuu alas.** YouTube-mediaani 75 000, eli keskellä
Akselin mainitsemaa haarukkaa. Pienin mukana oleva on 1 210 tilaajaa ja 2 000 seuraajaa.

**Toisto on ainoa laatumittari joka aineistosta näkyy.** 10 tekijää 51:stä toistui ja tuotti 41 %
kaikista yhteistöistä.

### Mitä tästä seuraa

Pisteytys ei mittaa kokoa vaan sitä, **jääkö tekijä**. Vahvin yksittäinen signaali on läsnäolo
molemmilla alustoilla, ja se saadaan ilmaiseksi sivutuotteena arkkitehtuurista joka valittiin
alun perin halpuuden takia.

---

## 3. Arkkitehtuuri

```
maakohtainen siemen  →  verkostolaajennus  →  rikastus  →  maapäättely  →  pisteytys  →  CSV
```

Kaikki kutsut ovat id-pohjaisia. Haku on omassa kiintiöämpärissään (noin 100 kutsua päivässä),
kun muut endpointit jakavat 10 000 yksikköä ja `channels.list` ottaa 50 kanavaa yhdellä yksiköllä.
**Siksi ei etsitä hakemalla vaan verkostosta.**

**1. Siemen.** `videos.list` parametreilla `chart=mostPopular`, `regionCode`, `videoCategoryId`.
Yksi yksikkö per maa. Maa tulee sisään tästä, ei kanavan omasta maakentästä.

**2. Laajennus, kolme rinnakkaista reittiä.**
Kanavan itse nostamat kanavat (`channelSections.list`, tyyppi `multipleChannels`) ovat ihmisen
kuratoima lista samaa nicheä ja kieltä. Videoiden kommentoijat (`commentThreads.list`, 100
kommenttia yhdellä yksiköllä) ovat se reitti joka löytää ne joita alustat eivät näe. Maakohtaiset
siemenet täydentävät kun kaksi ensimmäistä ovat ohuita.

**3. Rikastus.** `channels.list` 50 kanavaa per yksikkö: tilaajat, katselut, kuvaus, maa, uploads.
Katselut per video lasketaan uploads-listalta 30 tai 90 päivän ikkunassa.

**4. Maapäättely.** Kanavan maakenttä on vapaaehtoinen ja usein tyhjä. Maa päätellään videon
äänikielestä, tekstien kielestä ja siitä millä maalistalla kanava esiintyi. Ristiriita merkitään
epävarmaksi, ei arvata.

**5. TikTok ilman TikTokia.** Handle poimitaan YouTube-kanavan kuvauksesta samalla yksiköllä joka
haetaan muutenkin. Seuraajaluvut vahvistetaan maksullisesta lähteestä vain finalisteille.

**6. Pisteytys.** Molemmilla alustoilla, yleisö elossa (katselut per tilaaja), niche-etäisyys
siemeniin, kieli ja maa, riskit (tauko, romahtaneet katselut, epäsuhtainen kasvu).

**7. Ulostulo.** CSV ja JSON. Jokaisella rivillä **perustelu**: mistä löytyi ja miksi se sopii.

---

## 4. Mitä toimitetaan

| Toimitus | Kenelle | Miksi |
|---|---|---|
| CSV | Prenew | Akseli sanoi että se riittää |
| Lähdekoodi | Prenew | He ajavat sen omalla avaimellaan |
| Näkymä ruudulla | demo | Live-demo vaatii tarinan, ei tiedostoa |
| Tämä repo | molemmat | Perustelut ja riskit auki |

Lopputuote on **Prenewin oma ajo heidän omalla avaimellaan**, ei meidän ylläpitämä palvelu.
Se ei ole vain siisti ratkaisu vaan myös ainoa ehtojen mukainen: YouTuben Developer Policies
rajoittaa API-datan säilytyksen 30 päivään, joten pysyvä vaikuttajatietokanta on sääntöjen
vastainen. Päivittyvä putki ei ole. Virkistys maksaa nolla, koska RSS-syöte ei kuluta kiintiötä.

---

## 5. Järjestys

Jokainen vaihe tuottaa esityskelpoisen tuloksen. Ei kaikki tai ei mitään.

| # | Vaihe | Aika | Valmiina on |
|---|---|---|---|
| 0 | **Savutesti** | 20 min | Tieto siitä tuottaako laajennus pieniä tekijöitä |
| 1 | Siemenet + laajennus | 1 h | Lista kanavia, oikeaa dataa |
| 2 | Rikastus + maapäättely | 1,5 h | Akselin pyytämät kentät täytettyinä |
| 3 | TikTok-ristiinviittaus | 1 h | Molempien alustojen signaali, eli pisteytyksen ydin |
| 4 | Pisteytys + CSV | 1 h | **Valmis tuote** |
| 5 | Näkymä ruudulla | 1 h | Demon tarina |
| 6 | Vienti liidivarastoon | 30 min | Bonus, irrallinen, saa jäädä tekemättä |

Yhteensä noin 6 tuntia. Vaiheet 5 ja 6 ovat pudotettavissa ilman että mikään hajoaa.

**Vaihe 0 tehdään ensin ja se on ehdoton.** Se on ainoa avoin tekninen kysymys johon dokumentaatio
ei vastaa: tuottaako verkostolaajennus oikeasti uusia pieniä tekijöitä. Skripti on valmis,
`scripts/smoke-test.mjs`, ja kuluttaa alle prosentin päivän kiintiöstä.

Ehto: Mergero on lukittu pääkohde. Tämä rakennetaan vain jos moottori on valmis ajoissa.

---

## 6. Mitä ei tehdä

Rajaus on osa suunnitelmaa, ei puute.

**Ei outreachia.** Akseli: *"No. The focus of the challenge is to find the influencers. We have
existing automations."* Siitä ei saa pisteitä.

**Ei viittä alustaa pinnallisesti.** TikTok ja YouTube kunnolla. Twitch mukaan vain siksi että se
maksaa nolla ja todistaa maakohtaisen suodatuksen yhdellä kutsulla.

**Ei käyttöliittymää ennen dataa.** Hieno näkymä tyhjän päällä näkyy demossa heti. Näkymä tehdään
vasta kun JSONissa on oikeita nimiä.

**Ei omaa TikTok-scraperia.** Käyttöehdot. Kaupallinen palveluntarjoaja hoitaa sen muutamalla
eurolla ja kantaa itse vastuun.

**Ei generoitua dataa.** Akseli: *"It would ideally be real world data."* Putki tuottaa oikeaa
dataa siitä hetkestä kun avain on olemassa.

---

## 7. Miten arvosteluperusteet täyttyvät

Briiffin viisi kriteeriä, ja mikä kunkin kohdalla on todiste.

**1. Vähentää merkittävästi käsityötä.** Yksi komento, ei ihmistä välissä. Vertailukohtana heidän
nykyinen mallinsa: 39 % yhteistöistä ostetaan agentuurilta, eli käsityö on tällä hetkellä
ulkoistettu ja laskutettu.

**2. Toimii pienille ja niche-tekijöille.** Kommentoija- ja nostoreitit eivät ole hakuun
sidottuja, joten kanavan koko ei vaikuta löytymiseen. Savutesti raportoi erikseen montako
löydetyistä on alle 50 000 tilaajan.

**3. Toimii isoilla ja pienillä markkinoilla.** Maa tulee maakohtaisesta siemenlistasta ja
kielipäättelystä, ei hakusanoista. Demossa mukana sekä iso markkina (Saksa) että pieni (Viro).

**4. Liitettävissä työnkulkuun.** CSV ja JSON, ja Akseli vahvisti että se riittää. Päälle
valinnainen vienti liidivarastoon.

**5. Näytetty oikealla esimerkillä.** Saksa, Minecraft ja Fortnite. Perustelu tulee heidän
datastaan: Saksassa on kymmenen yhteistyötä, kahdeksan agentuurin kautta, nolla toistoa, ja sinne
avattiin varasto 2026.

---

## 8. Demon käsikirjoitus

Live-demo omalla ruudulla, materiaalit sähköpostilla. Ruudulla kaksi asiaa vierekkäin.

Vasemmalla heidän oma datansa: **Saksa 8/10 agentuurin kautta, nolla toistuvaa kumppanuutta.**
Oikealla lista saksalaisia tekijöitä jotka kone löysi suoraan, jokaisella perustelu ja se tieto
onko hän molemmilla alustoilla.

Yksi lause johon demo tiivistyy:

> Löysimme X saksalaista pelitekijää joita ette ole kokeilleet, Y niistä on alle 50 000 tilaajan
> kokoisia, ja tällä hetkellä 8 kymmenestä Saksan yhteistyöstänne kulkee agentuurin kautta
> ilman yhtään toistuvaa kumppanuutta.

X ja Y ovat mittaustuloksia, eivät lupauksia. Savutesti kertoo ne.

Loppuun se mitä ei kannata jättää sanomatta: **työkalu merkitsee myös sen, milloin tekijän yleisö
on todennäköisesti alle 13-vuotias.** Prenewillä on kategoria Vanhempien valinta ja sivu
`gaming-pc-for-kids`, eli ostaja on vanhempi ja käyttäjä on lapsi. Yksikään vaikuttaja-alusta ei
tee tätä erottelua.

---

## 9. Mitä kysytään Akselilta

Kolme ratkaisevaa, koko lista tiedostossa
[`docs/riskit-ja-kysymykset.md`](docs/riskit-ja-kysymykset.md).

1. **Mitä agentuuripalkkio maksaa?** Se on vaikutuslaskelman kerroin.
2. **Onko toistuva yhteistyö teille oikea onnistumisen mittari?** Pisteytys rakentuu sen varaan.
3. **Onko teillä dataa epäonnistumisista?** Aineistossa on vain tehdyt yhteistyöt, joten emme näe
   kuka ei vastannut tai mikä ei tuottanut.
