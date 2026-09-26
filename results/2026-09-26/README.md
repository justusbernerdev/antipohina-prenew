# Ajon tulos 26.9.2026

Ensimmäinen täysi ajo yhdellätoista markkinalla. Tiedostot tässä hakemistossa ovat sen ajon
todellinen ulostulo, ei näyte eikä käsin siistitty versio.

Komento:

```
node --env-file=.env scripts/discover.mjs --seeds=8 --videos=3 --budget=2500
```

## Luvut

| | |
|---|---|
| Tekijöitä listalla | **473** |
| Uusia löytöjä | 469 |
| Prenewin haarukassa (4k–250k) | 123 |
| Alle 50 000 tilaajaa | **246** |
| Löytyi kommentoijareitistä | **249** |
| Sähköposti tiedossa | **108** |
| Puhuu laitteistosta kuvauksessa | 8 |
| Myös TikTokissa | 13 |
| Merkitty nuori yleisö | 33 |
| Kiintiö | 1 345 yksikköä eli 13 % päivän ilmaisesta budjetista |

Maittain: PL 116, DE 73, HU 70, FR 65, NL 39, FI 23, SE 18, DK 15, LT 5, LV 3, tuntematon 46.

## Validointi

Kone löysi neljä Prenewin omaa kumppania **tuntematta niitä**: Kakkuh, MrRockis, Jyksedi ja
Hunter. Ne ovat tiedostossa merkittynä (`jo_kumppani = kyllä`) ja siirrettynä pois kärjestä.

Tämä on ainoa tapa osoittaa että pisteytys tunnistaa oikean tyypin: se löysi samat tekijät jotka
he ovat itse valinneet, ilman että niitä syötettiin sisään.

## Mitä listalla oikeasti on

Kaksi eri joukkoa, ja ero kannattaa sanoa ääneen.

**Maakohtaisilta listoilta** tulleet 224 tekijää ovat julkisesti löydettävissä. Prenew voisi
periaatteessa koostaa ne itse, joten ne eivät yksin vastaa haasteen kysymykseen.

**Kommentoijareitistä** tulleet 249 tekijää eivät näy yhdelläkään vaikuttaja-alustalla. Ne ovat
tyypillisesti 500–10 000 tilaajan paikallisia tekijöitä, ja juuri niistä Akseli sanoi:
*"especially in smaller markets they missed a lot of creators."*

## Avoin puute

**Viro ei tuottanut yhtään tekijää**, vaikka heillä on sieltä kuusi yhteistyötä. Viron
trendilista oli vain 27 videota pitkä ja kommentoijareitti ei tavoittanut virolaisia. Pienin
markkina on vaikein, mikä on täsmälleen se ongelma jonka haaste kuvaa.

Sama koskee Latviaa (3) ja Liettuaa (5).

## Sarakkeet

`perustelu` on tärkein: se kertoo miksi rivi on listalla. Lista jonka jokainen rivi selittää
itsensä on tarkistettavissa, ja se erottaa tämän niistä alustoista jotka Prenew on jo hylännyt.

`nuori_yleiso` merkitsee viitteet alle 13-vuotiaasta yleisöstä tai nuoresta tekijästä. Rivejä ei
poisteta, päätös jää ihmiselle. Prenewillä on kategoria Vanhempien valinta, joten tämä on heille
liiketoimintatietoa eikä pelkkä varoitus.

`puhuu_laitteistosta` löytyi lukemalla heidän omien kumppaniensa kanavakuvauksia: Kakkuh ja
MrRockis luettelevat koneensa speksit. Tekijä joka tekee niin myy pelikoneita jo nyt ilmaiseksi.
