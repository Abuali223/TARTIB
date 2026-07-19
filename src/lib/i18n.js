// TARTIB — Til: O'zbekcha lotin ↔ kirill.
// Yondashuv: tarjima jadvali emas, avtomatik transliteratsiya. t() lotin holatida
// matnni O'ZGARTIRMAYDI (identity) — shu bois standart holat mutlaqo xavfsiz.
// Kirill tanlanganda t(str) ni kirillga o'giradi.

const APOS = "['‘’ʻʼ'ʹ`]"; // turli apostrof belgilari

export function toCyrillic(input) {
  if (input == null || typeof input !== 'string' || !input) return input;
  let s = input;

  // o' / g' (apostrofli digraflar) — birinchi
  s = s.replace(new RegExp('O' + APOS, 'g'), 'Ў').replace(new RegExp('o' + APOS, 'g'), 'ў');
  s = s.replace(new RegExp('G' + APOS, 'g'), 'Ғ').replace(new RegExp('g' + APOS, 'g'), 'ғ');

  // Digraflar (katta-kichik harf hisobga olingan)
  const digraphs = [
    ['Sh', 'Ш'], ['SH', 'Ш'], ['sh', 'ш'],
    ['Ch', 'Ч'], ['CH', 'Ч'], ['ch', 'ч'],
    ['Ya', 'Я'], ['YA', 'Я'], ['ya', 'я'],
    ['Yo', 'Ё'], ['YO', 'Ё'], ['yo', 'ё'],
    ['Yu', 'Ю'], ['YU', 'Ю'], ['yu', 'ю'],
    ['Ye', 'Е'], ['YE', 'Е'], ['ye', 'е'],
    ['Ts', 'Ц'], ['ts', 'ц'],
  ];
  for (const [lat, cyr] of digraphs) s = s.split(lat).join(cyr);

  // Qolgan apostroflar — tutuq belgisi (ъ)
  s = s.replace(new RegExp(APOS, 'g'), 'ъ');

  const map = {
    A:'А',a:'а', B:'Б',b:'б', D:'Д',d:'д', E:'Е',e:'е', F:'Ф',f:'ф',
    G:'Г',g:'г', H:'Ҳ',h:'ҳ', I:'И',i:'и', J:'Ж',j:'ж', K:'К',k:'к',
    L:'Л',l:'л', M:'М',m:'м', N:'Н',n:'н', O:'О',o:'о', P:'П',p:'п',
    Q:'Қ',q:'қ', R:'Р',r:'р', S:'С',s:'с', T:'Т',t:'т', U:'У',u:'у',
    V:'В',v:'в', X:'Х',x:'х', Y:'Й',y:'й', Z:'З',z:'з', C:'К',c:'к',
    W:'В',w:'в',
  };
  let out = '';
  for (const ch of s) out += (map[ch] !== undefined ? map[ch] : ch);
  return out;
}

// Joriy til — modul darajasida (render paytida t() shuni o'qiydi).
// Root state o'zgarganda butun daraxt qayta chiziladi, shuning uchun t() qayta hisoblanadi.
let _lang = 'lotin';
export function setLang(l) { _lang = l === 'kirill' ? 'kirill' : 'lotin'; }
export function getLang() { return _lang; }

export const LANGS = [
  { key: 'lotin', name: "O'zbekcha (lotin)" },
  { key: 'kirill', name: 'Ўзбекча (кирилл)' },
];

// Asosiy tarjima funksiyasi
export function t(str) {
  if (_lang === 'kirill') return toCyrillic(str);
  return str;
}
