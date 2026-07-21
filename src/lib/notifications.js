// TARTIB — namoz vaqti bildirishnomalari (lokal, rejalashtirilgan).
// Eslatma: Expo Go (Android)'da lokal bildirishnoma ishlaydi, lekin azon uchun
// maxsus ovoz va to'liq imkoniyatlar development build (APK)'da to'liq ishlaydi.

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { prayerList } from './prayer';

// Ilova ochiq turganda ham bildirishnoma ko'rinsin
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const PRAYER_LABEL = { fajr: 'Bomdod', dhuhr: 'Peshin', asr: 'Asr', maghrib: 'Shom', isha: 'Xufton' };
const AR = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
const DAYS_AHEAD = 5; // necha kunlik oldindan rejalashtiriladi

export async function ensurePermission() {
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted || cur.status === 'granted') return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted || req.status === 'granted';
  } catch (e) {
    return false;
  }
}

// Har namoz vaqtiga lokal bildirishnoma rejalashtiradi. enabled=false bo'lsa tozalaydi.
export async function schedulePrayerReminders(coords, { enabled = true, sound = true, madhab } = {}) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return 0;
    const ok = await ensurePermission();
    if (!ok) return 0;

    // Android 8+ da ovozni KANAL boshqaradi (har bildirishnoma emas), va kanal
    // yaratilgach uning ovozini o'zgartirib bo'lmaydi. Shu bois ikki kanal:
    //  - 'azan'  — to'liq azon ovozi bilan (azon yoqilgan bo'lsa)
    //  - 'prayer'— oddiy bildirishnoma tovushi bilan (azon o'chirilgan bo'lsa)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('azan', {
        name: 'Azon (namoz vaqti)',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'azan.aac',
        vibrationPattern: [0, 350, 250, 350],
        lightColor: '#D9B36A',
      });
      await Notifications.setNotificationChannelAsync('prayer', {
        name: 'Namoz eslatmalari',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D9B36A',
      });
    }

    const channelId = sound ? 'azan' : 'prayer';
    const now = new Date();
    let count = 0;
    for (let day = 0; day < DAYS_AHEAD; day++) {
      const d = new Date(now); d.setDate(d.getDate() + day);
      const list = prayerList(coords, d, madhab).filter(p => !p.info);
      for (const p of list) {
        if (p.date <= now) continue; // o'tib ketgan vaqtni o'tkazib yuborish
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${PRAYER_LABEL[p.k]} namozi vaqti · ${AR[p.k]}`,
            body: `${PRAYER_LABEL[p.k]} namozi vaqti kirdi. Allohu akbar.`,
            sound: sound ? 'azan.aac' : 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: p.date,
            channelId,
          },
        });
        count++;
      }
    }
    return count;
  } catch (e) {
    // Expo Go cheklovi yoki ruxsat yo'q — jim o'tkazamiz
    return 0;
  }
}

// Test bildirishnoma — darrov (2s) yuboradi. Ikonка/ovoz/kanalni tekshirish uchun.
export async function sendTestNotification() {
  try {
    const ok = await ensurePermission();
    if (!ok) return false;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prayer', {
        name: 'Namoz eslatmalari',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D9B36A',
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'TARTIB — test bildirishnoma',
        body: 'Bildirishnoma ishlayapti ✓ Allohu akbar.',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, channelId: 'prayer' },
    });
    return true;
  } catch (e) { return false; }
}

// Test AZON bildirishnomasi — 20 soniyadan keyin 'azan' kanalida (to'liq azon ovozi).
// 20s — foydalanuvchi ilovani YOPIB (recents'dan olib tashlab) qulflaguncha ulguradi;
// shu bilan ilova butunlay yopiq holatda azon kelishini tekshiradi.
export async function sendTestAdhan(seconds = 20) {
  try {
    const ok = await ensurePermission();
    if (!ok) return false;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('azan', {
        name: 'Azon (namoz vaqti)',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'azan.aac',
        vibrationPattern: [0, 350, 250, 350],
        lightColor: '#D9B36A',
      });
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'TARTIB — azon sinovi',
        body: 'Namoz vaqti kirdi. Allohu akbar.',
        sound: 'azan.aac',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: 'azan' },
    });
    return true;
  } catch (e) { return false; }
}

export async function cancelAll() {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch (e) { /* noop */ }
}
