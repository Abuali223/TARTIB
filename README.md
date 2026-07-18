# TARTIB

Ibodat, niyat va tartib — namoz vaqtlari, zikr, odatlar hamda oila / ta'lim / ishxona vazifalarini bir joyda yurituvchi mobil ilova. **React Native (Expo)** da qurilgan, Android APK chiqarishga tayyor.

## Xususiyatlar

- **Namoz vaqtlari** — [adhan](https://github.com/batoulapps/adhan-js) kutubxonasi bilan foydalanuvchi GPS koordinatasidan **offline** hisoblanadi (Muslim World League burchaklari, Hanafiy Asr usuli). Joylashuvga ruxsat berilmasa, Andijon koordinatalari bo'yicha taxminiy hisob.
- **Qibla kompas** — koordinatadan Makkaga great-circle bearing hisoblanadi, telefon **magnetometri** (`expo-sensors`) bilan jonli yo'nalish. Sensor bo'lmasa (emulator), barmoq bilan aylantirish rejimi ishlaydi.
- **Hijriy sana** — offline tabular (civil) algoritm.
- **Saqlash** — amallar, odatlar, vazifalar, tasbeh, sozlamalar `AsyncStorage`da; ilova yopilsa ham yo'qolmaydi. Kunlik amallar har yangi kunda avtomatik tozalanadi.
- **Makonlar** — Shaxsiy / Oila / Ta'lim / Ishxona rejimlari, vazifa oqimi (yuborildi → qabul → bajarilmoqda → bajarildi / rad).
- **Jamoa qismi hozircha mock** — a'zolar va topshiriqlar lokal namunaviy ma'lumot; keyingi bosqichda Firebase ulanadi.

## Ishga tushirish

```bash
npm install
npx expo start
```

Telefonda **Expo Go** ilovasi bilan QR kodni skanerlang, yoki Android emulatorda `a` bosing.

## Android APK yig'ish

EAS bilan (tavsiya etiladi):

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Yoki lokal Gradle bilan:

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## Tuzilma

```
App.js                  — shriftlar (Spectral, Manrope, Amiri) va kirish nuqtasi
src/Root.js             — butun holat: navigatsiya, vazifalar, persist, GPS
src/theme.js            — ranglar va tipografiya
src/lib/prayer.js       — adhan o'rami: vaqtlar, keyingi namoz, qibla bearing
src/lib/hijri.js        — offline hijriy sana
src/lib/storage.js      — AsyncStorage saqlash
src/screens/            — Bugun, Namoz, Reja, Jamoa, Profil, Onboarding
src/overlays/           — Tasbeh, Qibla, Statistika, Odatlar, Sozlamalar,
                          A'zo, Vazifa, Topshiriq yuborish, A'zo qo'shish, Makon
src/components/         — TabBar, umumiy UI, SVG ikonlar
```

## Keyingi bosqich (reja)

- Firebase (auth + Firestore) — jamoa makonlarini real sinxronlash
- Push bildirishnomalar (namoz va vazifa eslatmalari)
- Azon ovozi
