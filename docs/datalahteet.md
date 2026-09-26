# Datalähteet ja kiintiöt

Prenew-haasteen löytökoneen tekninen pohja. Tarkistettu dokumentaatiosta 26.9.2026, ei muistista.
Jokainen luku tässä tiedostossa on lähteellinen, ja lähteet ovat lopussa.

Tämän tiedoston tarkoitus on yksi: **kertoa mistä pienet tekijät oikeasti löytyvät ja mitä se
maksaa**, ennen kuin riviäkään koodia kirjoitetaan.

---

## 0. Yhteenveto yhdellä silmäyksellä

| Asia | Tila |
|---|---|
| YouTube-löytö | Ilmainen, toimii, mekanismi vaihtui |
| Twitch-löytö | Ilmainen, natiivi kieli- ja pelisuodatin |
| TikTok-löytö virallisesti | **Suljettu meiltä**, ei rajoitteen vaan sääntöjen takia |
| TikTok käytännössä | Ristiinviittaus YouTubesta, vahvistus muutamalla eurolla |
| Koko demon kiintiökulutus | Noin 2 100 yksikköä 10 000:sta, yksi päivä, yksi avain |
| Koko demon rahakulu | Alle 5 € |

---

## 1. Korjaus README:hen

README kohta 4 rivi 139 nojaa YouTube Data API:n `relatedToVideoId`-parametriin.

**Sitä ei ole olemassa.** Google ilmoitti deprekaatiosta 12.6.2023 ja poisti parametrin
dokumentaatiosta kokonaan. Laajennusvaihe pitää siis rakentaa toisin.

Korvike on parempi kuin alkuperäinen, ks. kohta 2.2.

---

## 2. YouTube

### 2.1 Kiintiö ratkaisee arkkitehtuurin

Tämä on koko suunnittelun tärkein rajoite, ja se pitää ymmärtää ennen kuin mitään rakennetaan.

Haku on **omassa ämpärissään**: noin 100 `search.list`-kutsua päivässä. Kaikki muut endpointit
jakavat erillisen 10 000 yksikön päiväbudjetin, ja lähes jokainen niistä maksaa **1 yksikön**
per kutsu.

Ero käytännössä:

| Reitti | Mitä saa päivässä |
|---|---|
| `search.list` | 100 kutsua × 50 tulosta = **5 000 kanavaa**, sitten loppu |
| `channels.list` | 10 000 kutsua × 50 id = **500 000 kanavaa** |

Sata kertaa enemmän samalla ilmaisella avaimella. Ainoa ero on se, että id-pohjaiset kutsut
vaativat kanava-id:n etukäteen.

**Johtopäätös: älä etsi hakemalla, etsi verkostosta.** Haku käytetään vain siemeniin, jos edes
niihin. Kaikki laajennus tehdään id-pohjaisilla kutsuilla.

### 2.2 Löytöreitit, kaikki 1 yksikkö per kutsu

**a) Maakohtainen siemen: `videos.list`**

```
videos.list?part=snippet&chart=mostPopular&regionCode=DE&videoCategoryId=20&maxResults=50
```

Dokumentaatio vahvistaa että `regionCode` ja `videoCategoryId` toimivat nimenomaan yhdessä
`chart`-parametrin kanssa, eivät muuten. Yksi yksikkö palauttaa 50 videota ja niiden kanava-id:t.

Kategoria-id kannattaa hakea per maa `videoCategories.list`-kutsulla regionCodella, koska
kategoriavalikoima vaihtelee maittain. Gaming on yleisesti 20, mutta älä kovakoodaa sitä.

Tämä vastaa suoraan kysymykseen maakohtaisesta löydöstä: **maa tulee sisään tästä**, ei kanavan
omasta maakentästä johon ei voi luottaa (ks. 2.4).

**b) Verkostolaajennus: `channelSections.list`**

Tämä on `relatedToVideoId`:n korvike ja parempi kuin se.

Resurssin `snippet.type` voi olla `multipleChannels`, jolloin `contentDetails.channels[]` sisältää
listan kanava-id:itä jotka **tekijä on itse nostanut kanavalleen**. Sivulla ei ole
deprekaatiomerkintää.

Miksi tämä on parempi kuin algoritminen suositus: nostetut kanavat ovat ihmisen kuratoimia. Ne
ovat käytännössä aina samaa nicheä, samaa kieltä ja usein samaa maata. **Pieni tekijä löytyy
isomman etusivulta**, ja juuri se on haasteen ydin.

**c) Pitkä häntä: `commentThreads.list`**

```
commentThreads.list?part=snippet&videoId=<id>&maxResults=100&order=relevance
```

Yksi yksikkö, 100 kommenttia. Vastauksen `snippet.authorChannelId.value` antaa kommentoijan
kanava-id:n.

Sadan kommentoijan kanava-id:t yhdellä yksiköllä. Pienet tekijät kommentoivat isompia omassa
nichessään, joten tämä on se reitti joka löytää ne joita mikään vaikuttaja-alusta ei näe. Tämä on
suora vastaus siihen mitä Akseli sanoi: *"especially in smaller markets they missed a lot of
creators"*.

**d) Historia ilman hakua: `playlistItems.list`**

Kanavan uploads-soittolista antaa koko videohistorian 50 videota per yksikkö. Ei yhtään hakukutsua.

### 2.3 Rikastus

`channels.list` ottaa **50 kanava-id:tä yhdellä yksiköllä** ja palauttaa kerralla:

- `statistics.subscriberCount`, `viewCount`, `videoCount`
- `snippet.description`, josta yhteystieto ja muiden alustojen linkit (ks. 4)
- `snippet.country`, jos tekijä on sen asettanut
- `contentDetails.relatedPlaylists.uploads` seuraavaa vaihetta varten

Keskimääräiset katselut per video lasketaan `videos.list`-kutsulla uploads-listan videoille,
30 päivän ikkuna aktiivisille ja 90 päivän vähemmän aktiivisille, kuten Akseli pyysi.

### 2.4 Maapäättely, koska `snippet.country` valehtelee

Kanavan maakenttä on tekijän itse asettama ja vapaaehtoinen. Se on usein tyhjä ja joskus väärä.
Pelkkä sen varaan rakentaminen hukkaa juuri ne pienet markkinat joista koko haaste kertoo.

Päättele maa kolmesta ilmaisesta signaalista jotka tulevat jo haettujen kutsujen mukana:

1. Videon `defaultAudioLanguage` ja `defaultLanguage`
2. Otsikoiden ja kuvausten kieli, tunnistettuna
3. Millä `regionCode`-listalla kanava esiintyi kohdassa 2.2a

Tämä on koko pienen markkinan kattavuuden ydin. **Virolaista Minecraft-tekijää ei löydä
hakusanalla, mutta hänet tunnistaa viron kielestä toisen virolaisen kommenteissa.**

### 2.5 Ilmainen seuranta: RSS

```
https://www.youtube.com/feeds/videos.xml?channel_id=UC...
```

Testattu 26.9.2026: HTTP 200, ei API-avainta, **ei kiintiötä lainkaan**. Palauttaa `yt:channelId`,
kanavan nimen ja 15 viimeisintä videota julkaisuaikoineen.

Merkitys: kun universumi on kerran rakennettu, sen tuoreena pitäminen maksaa nolla yksikköä.
Julkaisutahdin ja tauon seuranta on ilmaista rajattomalle määrälle kanavia.

---

## 3. Twitch

Halvin maakohtainen löytöreitti mitä on, koska suodatus on natiivi eikä sitä tarvitse päätellä.

`Get Streams` hyväksyy `language`-parametrin ISO 639-1 -koodina ja `game_id`-parametrin, sivukoko
enintään 100, autentikointi app access tokenilla client credentials -virtauksella. Kiintiö on
token bucket, ja jäljellä oleva määrä luetaan `Ratelimit-Remaining`-otsikosta.

Eli `language=de` yhdistettynä Minecraftin `game_id`:hen antaa saksankieliset Minecraft-lähettäjät
yhdellä kutsulla, ilman kielentunnistusta ja ilman päättelyä.

**Rajoite:** endpoint näyttää vain juuri nyt livenä olevat lähetykset. Yksi ajo ei anna kattavuutta.
Aja sitä toistuvasti eri vuorokaudenaikoina, jolloin pitkä häntä kertyy muutamassa päivässä. Ajo
maksaa nolla.

Twitchillä on heidän datassaan vain 2 yhteistyötä 69:stä, joten tämä ei ole painopiste. Se on
kuitenkin halvin olemassa oleva tapa todistaa että kone toimii tietyssä maassa tietyssä nichessä,
ja siksi se kannattaa olla demossa mukana.

---

## 4. TikTok

**TikTok on heidän datassaan isoin kanava: 26 yhteistyötä 69:stä, kun YouTubella on 15.**
Se on myös ainoa alusta joka maksaa. Tämä ristiriita pitää ratkaista, ei ohittaa.

### 4.1 Virallinen reitti on meiltä suljettu

TikTok Research API:n kelpoisuusehdot: akateemiset laitokset Yhdysvalloissa, ETA-alueella,
Britanniassa, Kanadassa ja Sveitsissä, sekä EU:n voittoa tavoittelemattomat organisaatiot.
Hakijan pitää olla *"independent of commercial interests and able to conduct research on a
not-for-profit or non-commercial basis"*.

**Kaupallinen käyttö on nimenomaisesti kielletty.** Startup tai hackathon-tiimi ei täytä ehtoja.
Ei kannata edes hakea, eikä sitä kannata esittää suunnitelmassa reittinä.

Jos ehdot täyttyisivät, API tukisi kyselykenttiä `region_code`, `hashtag_name`, `keyword` ja
`create_date`. Vastaus sisältää käyttäjänimen mutta **ei seuraajamäärää**, joten se ei edes
yksin riittäisi pisteytykseen.

### 4.2 Halpa reitti: ristiinviittaus

Älä etsi TikTokista. **Etsi YouTubesta ja Twitchistä, ja poimi TikTok-handle kanavan kuvauksesta.**

`channels.list` palauttaa `snippet.description` samalla yhdellä yksiköllä joka haetaan joka
tapauksessa rikastuksessa. Pienet pelitekijät linkittävät TikTokinsa sinne lähes poikkeuksetta.
Handle irrotetaan kuvauksesta osoitemuodosta `tiktok.com/@<handle>`.

Kustannus tälle vaiheelle: **nolla.** Se on jo maksettu.

### 4.3 Vahvistus maksaa, mutta vain finalisteista

Seuraajaluvut ja katselukeskiarvot pitää hakea maksullisesta lähteestä. Hinnat 2026:

| Lähde | Hinta | Muoto |
|---|---|---|
| Pay-as-you-go -palvelut | 0,001–0,01 $ per pyyntö | ei tilausta |
| Apify-toimijat | noin 0,50 $ per 1 000 tulosta | ei tilausta |
| EnsembleData | 100–1 400 $/kk | kuukausitilaus |

**Kuukausitilaus on tähän väärä muoto.** Kysyntä on kertaluontoinen piikki, ei jatkuva virta.

Laskelma: 500 finalistin TikTok-vahvistus maksaa **alle 5 €**.

### 4.4 Periaate

> Löydä ilmaiseksi, vahvista maksullisesti vain se kymmenesosa joka menee CSV:hen.

Tämä on myös oikea vastaus vaikutuskriteeriin. Heidän datassaan **39 % yhteistöistä tuli
agentuurin kautta**. Jokainen tekijä jonka kone löytää suoraan on yksi agentuuripalkkio vähemmän,
ja löytö maksaa alle sentin.

---

## 5. Instagram

Ei tutkittu. Briiffissä IG, FB ja Twitch ovat plussaa eivätkä vaatimus, joten sitä ei väitetä
suuntaan eikä toiseen ennen kuin ehdot on luettu.

---

## 6. Demon kiintiöbudjetti

Saksa, Minecraft ja Fortnite, eli README kohdan 4 esimerkki.

| Vaihe | Kutsu | Määrä | Yksikköä |
|---|---|---|---|
| Siemenet 11 maasta | `videos.list` chart | 11 | 11 |
| Siemenkanavien nostot | `channelSections.list` | 350 | 350 |
| Kommentoijat | `commentThreads.list` | 550 | 550 |
| Rikastus, 10 000 kanavaa | `channels.list` 50/kutsu | 200 | 200 |
| Finalistien uploads | `playlistItems.list` | 500 | 500 |
| Finalistien katselut | `videos.list` 50/kutsu | 500 | 500 |
| | | **Yhteensä** | **2 111** |

Mahtuu yhden päivän 10 000 yksikköön noin viisinkertaisella marginaalilla, yhdellä ilmaisella
avaimella. Hakukutsuja: **0**.

Twitch-osuus ei kuluta YouTube-kiintiötä lainkaan. TikTok-vahvistus alle 5 €.

**Koko demo maksaa alle viisi euroa ja mahtuu yhteen päivään.** Skaalaus tuhansiin kanaviin on
sama koodi isommalla siemenjoukolla, koska pullonkaula oli haku ja haku poistettiin.

---

## Lähteet

Kaikki tarkistettu 26.9.2026.

- [ChannelSections | YouTube Data API](https://developers.google.com/youtube/v3/docs/channelSections)
- [CommentThreads: list | YouTube Data API](https://developers.google.com/youtube/v3/docs/commentThreads/list)
- [Comments | YouTube Data API](https://developers.google.com/youtube/v3/docs/comments)
- [Videos: list | YouTube Data API](https://developers.google.com/youtube/v3/docs/videos/list)
- [Determine quota cost | YouTube Data API](https://developers.google.com/youtube/v3/determine_quota_cost)
- [Revision History | YouTube Data API](https://developers.google.com/youtube/v3/revision_history)
- [Twitch API Reference](https://dev.twitch.tv/docs/api/reference/)
- [Twitch API Guide](https://dev.twitch.tv/docs/api/guide/)
- [TikTok Research API](https://developers.tiktok.com/products/research-api/)
- [TikTok Research API: Query Videos](https://developers.tiktok.com/doc/research-api-specs-query-videos/)
- [TikTok Hashtag Scraper | Apify](https://apify.com/clockworks/tiktok-hashtag-scraper)
- [TikTok API Pricing 2026 | Xpoz](https://www.xpoz.ai/blog/guides/tiktok-api-pricing-2026/)
- YouTube RSS-syöte testattu suoraan, HTTP 200
