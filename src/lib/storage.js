import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@tartib/state:v1';

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveState(slice) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(slice));
  } catch (e) {
    // Persist errors are non-fatal; app keeps in-memory state
  }
}

export async function clearState() {
  try { await AsyncStorage.removeItem(KEY); } catch (e) { /* noop */ }
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
