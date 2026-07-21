# TARTIB — Qur'on ajratuvchi (oyatma-oyat)

To'liq **sura MP3'ini** olib, uni **oyatlarga bo'ladi** va har birini
`SSSAAA.mp3` (sura + oyat, masalan Fotihaning 1-oyati → `001001.mp3`) qilib
nomlaydi. Bu — TARTIB ilovasi va everyayah.com ishlatadigan format.

**Nima uchun?** O'zbek qorilari asosan **butun surani** to'liq o'qigan. Oyatma-oyat
tinglash dasturlariga esa har oyat alohida fayl bo'lishi kerak. Bu vosita o'sha
to'liq yozuvlarni oyatlarga ajratib, o'zbek qorilaridan **oyatma-oyat kutubxona**
tuzishga imkon beradi.

---

## ⚠️ Aniqlik haqida rostini aytganda

Kesish **Qur'on matni bilan taqqoslab** amalga oshiriladi: har suraning aniq oyat
soni ma'lum, har oyat matnining nisbiy uzunligi (mora — harakat/madd hisobi)
hisoblanadi, jimliklar (qori har oyatda to'xtaydi) topiladi va chegaralar shu
matnga mos joylarga qo'yiladi.

Lekin **hech qanday avtomatik usul 100% aniq emas**:

- Ko'p suralarda qori har oyatda bir marta aniq to'xtaydi → jimliklar soni oyat
  soniga teng bo'ladi va kesish **avtomatik to'g'ri** chiqadi.
- Ba'zan qori uzun oyat ichida **nafas** oladi (ortiqcha jimlik), yoki qisqa
  oyatlarni **ulab** o'qiydi (jimlik yetishmaydi). Bunday holatlar noaniq.

Shuning uchun vosita har sura uchun **ishonch bahosi** beradi va past ishonchli
suralarni **tekshirish** uchun belgilaydi. Qur'on uchun har bir oyat to'g'ri
kesilganini **quloq bilan tekshirish shart** — buning uchun qulay
**tekshirish sahifasi** (`review.html`) tayyorlanadi (pastga qarang).

> Qisqasi: vosita ishning 80–90%'ini avtomat bajaradi, qolganini siz sahifada
> bir-ikki surish bilan to'g'rilaysiz.

---

## O'rnatish

Kerak: **Python 3.9+**. `ffmpeg` bo'lsa yaxshi; bo'lmasa quyidagi paket uni o'zi
bilan olib keladi.

```bash
cd tools/quran-splitter
python3 -m pip install -r requirements.txt
```

Tekshirish: `python3 split.py --help`

---

## Tez boshlash — bitta sura

```bash
python3 split.py 001__FOTIHA.mp3 --surah 1 -o chiqish --reciter uzbek_qori
```

Natija:

```
chiqish/uzbek_qori/001001.mp3   ← Fotiha 1-oyat
chiqish/uzbek_qori/001002.mp3
...
chiqish/uzbek_qori/001007.mp3
chiqish/uzbek_qori/_review/001.review.html   ← tekshirish sahifasi
chiqish/uzbek_qori/_review/001.cuts.json     ← chegaralar (tahrirlanadi)
```

Terminalda har sura uchun ishonch chizig'i chiqadi:

```
[██████····]  58.2%  001 Al-Fatiha   oyat:  7  jimlik:  7  kesildi:  7  [TEKSHIRING]
         · jimliklar soni (7) oyat chegaralariga (6) mos kelmadi
```

`--surah` ni yozmasangiz, fayl nomidagi raqamdan (`001...`) aniqlanadi.

---

## Butun Qur'on — ommaviy (batch)

Fayllarni sura raqami bilan nomlang (`001.mp3`, `002.mp3`, … yoki
`001__FOTIHA.mp3`), bitta papkaga qo'ying:

```bash
python3 split.py --batch surahs/ -o chiqish --reciter uzbek_qori
```

Oxirida qaysi suralarni tekshirish kerakligi ishonch bo'yicha ro'yxatlanadi:

```
— Jami 114 sura. Tekshirish tavsiya etiladi: 12 ta.
  Tekshirish sahifalari: chiqish/uzbek_qori/_review/SSS.review.html
    · 002 Al-Baqara — 61%
    · 018 Al-Kahf — 68%
    ...
```

Ishonchi yuqori suralar avtomat to'g'ri chiqqan bo'ladi; ro'yxatdagilarni
tekshiring.

---

## Tekshirish va tuzatish (eng muhim qadam)

1. `_review/SSS.review.html` faylini **brauzerda** oching (Chrome/Edge).
2. Yuqoridan o'sha suraning **MP3'ini tanlang** (butun sura fayli).
3. Sahifada:
   - **To'lqin** (waveform) va undagi **rangli oraliqlar** — aniqlangan jimliklar.
   - **Oq chiziqlar** — oyat chegaralari (suriladi).
   - Har oyatni tinglash: jadvaldagi **▶** yoki to'lqinda o'sha oyat ustiga bosing.
4. Chegara noto'g'ri bo'lsa, uni **sichqoncha bilan to'g'ri jimlikka suring**
   ("jimlikka yopishsin" yoqilgan bo'lsa, o'zi eng yaqin jimlikka tushadi).
5. Hammasi joyida bo'lgach, **⤓ cuts.json yuklab olish** tugmasini bosing —
   `SSS.cuts.json` yuklanadi.
6. Shu to'g'rilangan fayl bilan qayta kesing:

```bash
python3 split.py 001__FOTIHA.mp3 --from-cuts 001.cuts.json -o chiqish --reciter uzbek_qori
```

Tayyor — endi `001001.mp3 … 001007.mp3` aniq kesilgan bo'ladi.

> Maslahat: avval `--plan-only` bilan **faqat tekshirish sahifasini** yaratib,
> hammasini to'g'rilab, keyin `--from-cuts` bilan kessangiz — ortiqcha ish bo'lmaydi.

---

## Bismillah

Ko'p suralar oldida Bismillah alohida o'qiladi (raqamlanmaydi). Standart holatda
vosita buni **1-oyat fayliga qo'shib** yuboradi (`SSS001.mp3` = Bismillah + 1-oyat).

| Sozlama | Ma'nosi |
|---|---|
| `--bismillah auto` | (standart) o'zi aniqlaydi |
| `--bismillah separate` | Bismillah oldida alohida o'qilgan → 1-oyatga qo'shiladi |
| `--bismillah merged` | Bismillah 1-oyat ichida (qori to'xtamagan) |
| `--bismillah file` | Bismillahni alohida `SSS000.mp3` qilib saqlaydi |
| `--bismillah none` | Bismillahsiz (Tavba surasi — avtomat) |

Fotiha (Bismillah = 1-oyat) va Tavba (Bismillahsiz) o'zi to'g'ri hisoblanadi.

---

## Barcha sozlamalar

| Sozlama | Standart | Izoh |
|---|---|---|
| `--surah N` | — | Sura raqami (1–114) |
| `--batch PAPKA` | — | Papkadagi barcha suralar |
| `--from-cuts FAYL` | — | To'g'rilangan cuts.json'dan qayta kesish |
| `-o, --out` | `chiqish` | Chiqish papkasi |
| `--reciter NOM` | `qori` | Qori nomi (ichki papka) |
| `--pad SONIYA` | `0.25` | Kesim atrofidagi jimlik zaxirasi |
| `--min-sil SONIYA` | `0.30` | Eng qisqa e'tiborga olinadigan jimlik |
| `--thresh dB` | avtomatik | Jimlik chegarasi (baland-pastlik) |
| `--bitrate` | `128k` | Chiqish MP3 sifati |
| `--plan-only` | — | Faqat tahlil + tekshirish sahifasi (kesmaydi) |

Agar juda ko'p yoki juda kam jimlik topilsa: tinchroq yozuvda `--thresh -35`
kabi qiymat bering yoki `--min-sil` ni o'zgartiring.

---

## TARTIB ilovasiga ulash

Tayyor `SSSAAA.mp3` fayllarni internetga (hosting/CDN) joylang — masalan
`https://mening-saytim.uz/uzbek_qori/001001.mp3`. So'ng `src/lib/quran.js`
dagi `RECITERS` ro'yxatiga qo'shing:

```js
{ id: 'uz_sample', name: "O'zbek qori", folder: 'https://mening-saytim.uz/uzbek_qori' },
```

`folder` to'liq URL bo'lsa, ilova oyatlarni o'sha manzildan oladi (fayl nomlashi
bir xil: `SSSAAA.mp3`). Ichki tuzilishni o'zgartirish shart emas — oflayn yuklash
ham ishlaydi.

---

## Ishlash tamoyili (qisqa)

1. `ffmpeg` audio → PCM (16 kHz, tahlil uchun).
2. RMS (baland-pastlik) bo'yicha **jimlik** oraliqlari.
3. Suraning **aniq oyat soni** + har oyat matnining **nisbiy uzunligi** (mora) →
   chegaralar joylashtiriladi va eng yaqin jimlikka **yopishtiriladi**.
4. Bismillah qoidasi hisobga olinadi.
5. Har bo'lak asl MP3'dan **to'liq sifatda** kesib olinadi.

Fayllar: `splitter.py` (yadro), `split.py` (buyruq qatori),
`review.py` (tekshirish sahifasi), `data/` (oflayn oyat ma'lumoti),
`dev/gen_meta.py` (ma'lumotni qayta yaratish).

## Manba / litsenziya

Qur'on matni: **Tanzil.net** (Uthmani 1.0.2, CC BY 3.0). Batafsil: `data/SOURCE.txt`.
