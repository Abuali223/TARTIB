import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { googleAuthConfig } from '../lib/googleAuth';

// OAuth oynasi yopilgach sessiyani yakunlaydi (kerak)
WebBrowser.maybeCompleteAuthSession();

// Root (class komponent) hook ishlata olmaydi — shu funksional "ko'prik" hookni chaqiradi
// va promptAsync'ni yuqoriga (onReady) uzatadi, natijani (id_token) onToken orqali qaytaradi.
// Faqat googleConfigured bo'lganda mount qilinadi (Root'da tekshiriladi) — shu bois
// hooklar shartsiz chaqiriladi.
export default function GoogleBridge({ onReady, onToken, onError }) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(googleAuthConfig);

  useEffect(() => {
    // promptAsync tayyor bo'lganda Root'ga beramiz
    onReady(request ? promptAsync : null);
  }, [request]);

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken =
        response.params?.id_token || response.authentication?.idToken || null;
      if (idToken) onToken(idToken);
      else onError && onError('Google javobida token topilmadi');
    } else if (response.type === 'error') {
      onError && onError(response.error?.message || 'Google xatosi');
    }
    // 'dismiss' / 'cancel' — foydalanuvchi bekor qildi, xabar shart emas
  }, [response]);

  return null;
}
