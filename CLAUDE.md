# hangszerszallitas.hu – szabályok Claude Code-nak

Statikus HU/EN oldal (build nélkül). A fő cél: SEO, hogy a Google, a Bing és az AI-keresők (ChatGPT, Perplexity) megtalálják. Mielőtt oldalt vagy képet adsz hozzá, olvasd el ezt.

## Képek: alt szöveg és fájlnév

Minden új vagy módosított képnél:

1. **Nézd meg a képet** (Read), és csak azt írd le, ami tényleg látszik rajta. Helyszínt, nevet, márkát ne találj ki; ha nem biztos, hagyd ki.
2. **Alt szöveg**: egy leíró mondat, magyar oldalon magyarul, angol oldalon angolul (nem fordítás, hanem önálló leírás). Mit csinál, mi látszik, hol (pl. „Becsomagolt hangversenyzongora lépcsőjáró gépen egy budapesti bérház lépcsőjén").
   - Soha ne legyen „Zongora szállítása 1", „kép", „image", „photo".
   - Kb. 8–16 szó, kulcsszó-halmozás nélkül (a „zongoraszállítás Budapest" szót ne erőltesd minden képre).
   - Díszítő képnél (logó a szövegben, elválasztó) üres `alt=""`.
3. **Fájlnév** új képnél: kisbetű, ékezet nélkül, kötőjellel, leíró (pl. `zongora-lepcsojaro-budapest.jpg`), ne `PXL_2026…jpg`. A meglévő `pictures/PXL_…` fájlokat ne nevezd át, ha az oldalak, a sitemap vagy az og:image hivatkozik rájuk, csak ha mindenhol átírod.
4. **Méretek**: a `<img>` kapjon `width` és `height` attribútumot, a galéria `thumb_`/`og_` változatait tartsd meg (`pictures/thumb_*`, `pictures/og_*`).
5. A galéria nagyított nézete (`index.html`, `getLightboxPoolImg`) is használja a kép saját alt szövegét, ne a generikus „Galéria nagy kép" szöveget.

## Tartalom és duplikáció (tanulság: 2026. okt.)

- **Nem lehet két oldal ugyanaz a sablon más városnévvel.** A négy településoldal 61–67%-ban azonos volt, ezért `noindex` lett (Érd, Szentendre, Gödöllő). Új oldal előtt mérd meg az átfedést (5 szavas szakaszok), cél: 30% alatt.
- **Csak igaz, ellenőrizhető tényeket írj** (az üzemeltető adta: pl. Budaörsön magánszemélyeknek szállítottak, az út ~20 perc, nincs hozzáférési gond). Ne találj ki referenciát, helyszínt, számot.
- Minden indexelhető oldalnak legyen: egyedi `<title>`, meta description, H1, saját canonical, HU↔EN `hreflang` pár, szerepeljen a `sitemap.xml`-ben.
- `noindex` oldal ne legyen a sitemapben, és a `robots.txt` ne tiltsa le (különben a Google nem látja a noindexet).
- A fő kulcsszó a „zongoraszállítás", de a „hangszerszállítás" is szerepeljen a főoldal címében/leírásában (a felhasználók így is keresnek).
- Az angol oldalak fontosak (Bing → ChatGPT): ne noindexeld őket, és külön írd, ne fordítsd géppel szó szerint.
- Fotó **nem kötelező** az ajánlatkéréshez: a szövegekben „elég szóban elmondani, fotó nem kötelező".

## Deploy után

1. `sitemap.xml` frissítése (új oldal hozzáadása, `lastmod`).
2. `node scripts/indexnow.js /uj-oldal/ /en/uj-oldal/` a Bingnek.
3. Search Console: sitemap újra beküldése, fontos oldalakra Request indexing (napi ~10).
4. Bing Webmaster Tools: sitemap és URL Submission az angol oldalakra.

## Egyéb

- Árak: pianínó 39 000 Ft (+5 000/emelet), grand 59 000 Ft (+9 000/emelet), Pest megye +6 000 Ft, Pest megyén kívül +250 Ft/km. Változtatásnál minden oldalon (HU, EN, `llms.txt`, séma) javítsd.
- Kapcsolat: +36 20 962 9001. Ne írj ki más elérhetőséget.
- Commit üzenet és PR leírás angolul, rövid; a változtatást külön branchen add be, PR-ral.
