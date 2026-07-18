# TARTIB — Real ishlashga o'tkazish rejasi va talablari

> Holat: **tasdiqlash bosqichида**. Dizayn tayyor, ilova telefonда ishlaydi (Expo SDK 54). Ichki ma'lumot hozircha mock. Ushbu hujjat ilovani real ishlaydigan mahsulotга aylantirish rejasini belgilaydi.

## 1. Tanlangan qarorlar

| Mavzu | Qaror |
|---|---|
| Backend | **Firebase** (Auth + Firestore + Cloud Messaging) |
| Kirish usullari | **Google Sign-In + Telefon (SMS) + Email/parol** |
| Ishlab chiqish tartibi | Ikkala yo'nalish (A: Backend/Rollar, B: Ibodat) **parallel** |
| Firebase loyihasi | **Noldan yaratiladi** (yo'riqnoma bilan) |
| Namoz aniqligi | **islom.uz rasmiy taqvimи bilan daqiqама-daqiqа mos** (jadval bundle) |
| Til | O'zbekcha (lotin) |
| Paket | `uz.tartib.app` |

## 2. ⚠️ Muhim texnik shart — Development Build

Firebase **telefon (SMS) auth** va **native Google Sign-In** Expo Go'да ishlamaydi — ular native modul talab qiladi.

- **Email/parol** — Firebase JS SDK bilan Expo Go'да ishlaydi (tez sinov uchun).
- **SMS + Google** — bir marta **development build** (EAS Build yoki `expo prebuild` bilan APK) yig'ib telefonга o'rnatish kerak.

Reja: A-yo'nalish boshiда dev build sozlanadi, keyingi sinovlar shu APK'да o'tadi.

**Kerak bo'ladi (foydalanuvchidан):** Firebase loyihasi (`google-services.json`), yoki noldan yaratish uchun ruxsat va yo'riqnoma.

---

## A yo'nalish — Backend, Auth, Rollar oqimi

### A0. Firebase ulash
- Firebase loyihasi, `google-services.json`, EAS dev build.
- Firebase JS SDK (auth, firestore, messaging) yoki `@react-native-firebase/*`.
- Xavfsizlik qoidalari (Firestore security rules) — ruxsat matritsasiga mos.

### A1. Auth (3 usul)
- Google Sign-In (`expo-auth-session` yoki native), Telefon/SMS (reCAPTCHA + kod), Email/parol.
- Onboarding: kirish → profil (ism, **tug'ilgan sana**, avatar) → makon yaratish/qo'shilish.
- **Yosh — snapshot emas, tug'ilgan sana saqlanadi** (`isMinor` har safar hisoblanadi).

### A2. Rollar modeli (audit asosida — ildiz muammoni hal qiladi)

Hozirgi muammo: **kimlik + makon + rol** bitta `mode` satrида qorishган. To'g'ri model — 5 ta to'plam:

```
User          — bitta real hisob (ism, telefon/email, tug'ilgan sana, avatar)
Workspace     — aniq makon nusxasi (turi: oila/talim/ishxona, egasi, taklif kodi)
Membership    — User × Workspace × ROL × RUXSATLAR × holat   ← rollar oqimining yuragi
Invitation    — kutilayotган taklif (kod / havola / telefon)
Task          — makonга bog'langан, real bergan va mas'ul
```

Asosiy o'zgarishlar:
- Bir foydalanuvchi **har makonда alohida rol** (ishxonaда rahbar, ta'limда talaba, oilaда ota).
- Bir turdан **bir nechта makon** bo'lishi mumkin (ikkita ishxona).
- **`shaxsiy` — makon emas**, foydalanuvchining shaxsiy ko'rinishi (amallar/odatlar/tasbeh).
- **Bola (16-)** — foydalanuvchi xususiyati, makon emas. Bola har qanday makonда **cheklangan a'zo**; jumladан **ta'limда talaba** bo'la oladi. "Majburан oila" mantig'i olib tashlanadi.

### A3. Ruxsatlar matritsasi (`canManage` o'rniga)

Qobiliyatlar: `MANAGE_WORKSPACE`, `MANAGE_MEMBERS`, `ASSIGN_TASKS`, `VIEW_BOARD`, `RECEIVE_TASKS`.

| Makon | Rahbar rol | Ruxsatlar | Oddiy a'zo |
|---|---|---|---|
| Oila | Ota/Ona | hammasi | O'g'il/Qiz/Farzand → faqat RECEIVE_TASKS |
| Ta'lim | Mudir/O'qituvchi/Assistent | ASSIGN + VIEW_BOARD (+MANAGE_MEMBERS o'z guruhi) | O'quvchi/Talaba → RECEIVE_TASKS |
| Ishxona | Rahbar/Menejer | ASSIGN + VIEW_BOARD (+MANAGE_MEMBERS) | Xodim/Ishchi/Amaliyotchi → RECEIVE_TASKS |

- **Ega** (`ownerUserId`) — barcha ruxsatlar avtomatik.
- **Bola cheklovi** — ruxsatlar `['RECEIVE_TASKS']` bilan kesiladi; hech qachon "manager" bo'la olmaydi.
- `isManager = ASSIGN_TASKS yoki VIEW_BOARD` (gold badge shunга bog'lanadi, ismlар ro'yxatига emas).

### A4. Taklif / qo'shilish oqimi
- Manager taklif yaratadi: **kod** (6 belgi), **havola** (`tartib://join/<kod>`), yoki **telefon**.
- Holatlar: `pending → accepted / declined / expired / revoked`.
- Qo'shilish: taklifni ochish → (kerak bo'lsa) ro'yxatдан o'tish → `Membership{status:active}`.
- O'chirish — soft delete (`status:removed`), vazifa tarixi saqlanadi.

### A5. Vazifa oqimi (real kimliklar bilan)
```
vazifa:  yuborildi →(qabul)→ qabul →(boshlash)→ bajarilmoqda →(bajarildi)→ bajarildi
                └→(rad)→ rad                          (bajarildi|rad) →(qayta ochish)→ yuborildi
eslatma: yuborildi →(tushunarli)→ bajarildi
```
- **Qabul/rad/boshlash/bajarildi — faqat mas'ul** (`assigneeUserId === currentUserId`).
- **Qayta ochish/bekor qilish — bergан yoki VIEW_BOARD manager.**
- `setStatus` har o'tishда ruxsatни tekshiradi (hozir ko'r-ko'rona o'rnatadi).

### A6. Migratsiya (mock → yangi model)
Hozirgi mock struktura deterministik ravishда yangi modelга o'giriladi (ME→User, members→Users, mode→activeWorkspaceId, roles{}→Membership'lar). Batafsil — audit spetsifikatsiyasида.

### A7. "Makon = ma'lumot, Inbox = global" prinsipi (jahon tajribasi)
Tadqiqot: Slack (ko'p makon, lekin bildirishnoma silo — xato), Google Classroom (kod/havola bilan self-join), multi-tenant SaaS (tenant scoped data).

**Ajratish qoidasi:**
- **Makon (kontekst)** — board, a'zolar, natija, reyting har makonда **alohida** (scoped).
- **Inbox / push — global**: "Menga berilган vazifалар" hamma makondан yig'iladi, har vazифада makon yorlig'и ("Ishxona"/"Maktab"/"Oila").
- **Push bildirishnoma makonга bog'liq emas** — shaxsiy makonда tursangiz ham, boshqa makon vazифа berса, push + inbox'да chiqadi. (Slack'ning silo xatosини takrorlamаймиz.)
- Makon almashтириш faqat **boshqaruv ko'rinишини** o'zgartiradi (board/a'zолар), **qabul qilишни emas**.

**Amaliy o'zgarish:** `myTasks` (Bugun ekrani + kelajакдаги Inbox) — **cross-workspace** (hamma makondан), har kартада makon nishonи. Push har vazифа yaratилганда/holат o'zgarганда — active makonга qaramай.

**Kechikиш:** vazифа o'z muddатига ega (ko'rish makonга bog'liq emas); muddат yaqin → qo'shimcha eslatма; "Yuborilди"да qolса beruvchi "kutilmoqда" ko'radi; muddат o'tса "Kechikди" belgisи.

**Qo'shilish (gibrid — Google Classroom modeli):** egаси (ota/o'qituvchi/boshliq) makon yaratadi + taklif (kod/QR/havola/telefon); a'zо **o'zи qo'shiladi** va qabul qiladi. A'zо makon yaratmaydi. To'liq self-forming (Discord) faqat ochиq jamoалар uchun — TARTIB'да tabiiy rahbар bor, shунга egаси boshqаради.

---

## B yo'nalish — Ibodat aniqligi va bildirishnomalar

### B1. Namoz vaqtlari — jadval bundle (TANLANGAN: islom.uz bilan daqiqама-daqiqа mos)
- **Bajarildi (oraliq):** Fajr/Isha `18°/17°` → **`15°/15°`** hisob. Bomdod 02:57 → **03:20**. Bu — jadvaldан tashqаридаги GPS nuqtalар uchun **zaxira** (fallback) bo'lib qoladi.
- **Asosiy manba (qilinadi):** islom.uz rasmiy taqvимини **viloyатlар bo'yicha JSON jadval** qilib ilovага bundle qilamiz (yil bo'yi, har kун 6 vaqт). Foydalanuvchi shahri jadvалда bo'lsa — aynан rasmiy vaqт ko'rsatiladi.
- **Oqim:** GPS/tanlangан shahar → eng yaqin jadval shahri → o'sha kунги rasmiy vaqт. Jadvалда yo'q bo'lsa → `15°` hisобга qaytiladi.
- **Manba parserи:** islom.uz taqvимини bir marта yig'ib JSON'ga aylantirадиган skript (masalan `namoz-vaqtlari-parser` uslуbида). Litsензия/foydalanish shartlаriга e'tibор beriladi.
- **Ma'lумот hajми:** ~14 viloyат × 365 kун × 6 vaqт ≈ kичик JSON (bir necha yuz KB), offline saqlanadi.

### B2. Qibla
- Bearing hisobi to'g'ri. Magnetometr kalibratsiyasи va aniqlik ko'rsatkichи yaxshilanadi; deklinatsiya (magnit ↔ haqiqiy shimol) hisobga olinadi.

### B3. Push-bildirishnomalar
- `expo-notifications` + Firebase Cloud Messaging.
- **Namoz eslatmalari** (har vaqt uchun rejalashtirilgan lokal bildirishnoma), **azon ovozi**, **vazifa bildirishnomalari** (yangi vazifa / holat o'zgarishi).
- Sozlamalардаги toggle'lар shunга ulanadi.

---

## 3. Tekshiruv (agent bo'yicha)
Har yo'nalishда: **qurish agenti → tekshiruv (review) agenti → sizning telefoningizда sinov**.
- Namoz aniqligi — ✅ audit o'tdi.
- Rollar modeli — ✅ audit/dizayn o'tdi.
- Keyingi qurilган qismlar `/code-review` va real qurilma sinovidан o'tadi.

## 4. Milestone'lар (taxminiy tartib)

1. **M0 — Firebase + dev build** (asos): loyiha, config, EAS build, email/parol auth ishlaydi.
2. **M1 — Auth to'liq**: Google + SMS + email, real profil, onboarding.
3. **M2 — Rollar modeli**: User/Workspace/Membership/Task refaktori, ruxsatlar, migratsiya.
4. **M3 — Makon oqimi**: yaratish, taklif (kod/havola/telefon), qo'shilish, a'zo boshqaruvi.
5. **M4 — Vazifa oqimi real sinxron**: Firestore realtime, ruxsatли o'tishlар.
6. **M5 — Bildirishnomalар**: namoz + vazifa push, azon.
7. **M6 — Sifat/relly**: xatolarни ushlash, testlар, Play Store tayyorlik.

M0–M1 ketma-ket (asos), keyin A (M2–M4) va B (namoz ✅ / B2–B3) parallel.

## 5. Savollar holati
1. ~~Firebase loyihasi~~ → **Noldan yaratiladi** (hal qilindi).
2. ~~Rasmiy taqvim aniqligi~~ → **islom.uz jadvali bundle qilinadi** (hal qilindi, B1).
3. **SMS narxi (ochiq)** — telefon auth SMS pullik. Firebase Phone Auth bepul kvotasi cheklangan; ko'p foydalanuvchida byudjet yoki muqobil provayder (masalan Eskiz.uz) kerak bo'lishi mumkin. M1'da aniqlanadi.
