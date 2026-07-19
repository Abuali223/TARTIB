// Metro sozlamasi — Expo SDK 54.
// Firebase JS SDK (v11+) Metro'ning "package exports" bilan runtime'da to'qnashadi
// ("Component auth has not been registered yet" xatosi). Quyidagi ikki sozlama buni hal qiladi:
//  - .cjs kengaytmasini qo'shish (Firebase CommonJS build)
//  - package exports'ni o'chirish (Firebase react-native build'ini to'g'ri tanlaydi)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
