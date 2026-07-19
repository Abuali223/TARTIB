// TARTIB — rollar va ruxsatlar modeli (backend-agnostik).
// Audit spetsifikatsiyasi asosida: Foydalanuvchi × Makon × Rol × Ruxsatlar.

export const MINOR_AGE = 16;

// Qobiliyatlar (capabilities)
export const CAP = {
  MANAGE_WORKSPACE: 'MANAGE_WORKSPACE',
  MANAGE_MEMBERS: 'MANAGE_MEMBERS',
  ASSIGN_TASKS: 'ASSIGN_TASKS',
  VIEW_BOARD: 'VIEW_BOARD',
  RECEIVE_TASKS: 'RECEIVE_TASKS',
};
const ALL = [CAP.MANAGE_WORKSPACE, CAP.MANAGE_MEMBERS, CAP.ASSIGN_TASKS, CAP.VIEW_BOARD, CAP.RECEIVE_TASKS];

// Makon turlari
export const WS_TYPES = {
  oila: { label: 'Oila', membersLabel: "A'zolar", sub: 'Oila vazifalari nazorati' },
  talim: { label: "Ta'lim", membersLabel: 'Talabalar', sub: 'Talabalarga eslatma va vazifa' },
  ishxona: { label: 'Ishxona', membersLabel: 'Xodimlar', sub: 'Xodimlar oqimi nazorati' },
};
export const WS_TYPE_LIST = ['oila', 'talim', 'ishxona'];

// Tanlash uchun rol variantlari
export function roleOptionsFor(type) {
  return type === 'talim' ? ["O'quvchi", 'Talaba', "O'qituvchi", 'Assistent', 'Mudir']
    : type === 'ishxona' ? ['Rahbar', 'Menejer', 'Xodim', 'Ishchi', 'Amaliyotchi']
      : ['Ota', 'Ona', "O'g'il", 'Qiz', 'Farzand', 'Boshqa'];
}

// Egaga (owner) beriladigan standart rol
export function defaultOwnerRole(type) {
  return type === 'talim' ? 'Mudir' : type === 'ishxona' ? 'Rahbar' : 'Ota';
}

// Rol → qobiliyatlar shabloni (owner emas a'zolar uchun)
const MANAGER_ROLES = {
  oila: { Ota: ALL, Ona: ALL },
  talim: {
    Mudir: ALL,
    "O'qituvchi": [CAP.MANAGE_MEMBERS, CAP.ASSIGN_TASKS, CAP.VIEW_BOARD, CAP.RECEIVE_TASKS],
    Assistent: [CAP.ASSIGN_TASKS, CAP.VIEW_BOARD, CAP.RECEIVE_TASKS],
  },
  ishxona: {
    Rahbar: ALL,
    Menejer: [CAP.MANAGE_MEMBERS, CAP.ASSIGN_TASKS, CAP.VIEW_BOARD, CAP.RECEIVE_TASKS],
  },
};

// Berilgan (tur, rol) uchun RUXSATLARni hisoblaydi.
// isOwner — makon egasi barcha ruxsatga ega. restricted — voyaga yetmagan a'zo faqat qabul qiladi.
export function permissionsFor(type, role, { isOwner = false, restricted = false } = {}) {
  let perms;
  if (isOwner) perms = ALL.slice();
  else {
    const tpl = (MANAGER_ROLES[type] || {})[role];
    perms = Array.isArray(tpl) ? tpl.slice() : [CAP.RECEIVE_TASKS];
  }
  if (restricted) perms = perms.filter(p => p === CAP.RECEIVE_TASKS); // voyaga yetmagan cheklovi
  if (!perms.includes(CAP.RECEIVE_TASKS)) perms.push(CAP.RECEIVE_TASKS);
  return perms;
}

// "Manager" belgisi (oltin badge) — vazifa bera oladi yoki boardni ko'radi
export function isManagerPerms(perms) {
  return perms.includes(CAP.ASSIGN_TASKS) || perms.includes(CAP.VIEW_BOARD);
}

export function isMinorAge(birthYear, now = new Date()) {
  if (!birthYear) return false;
  return (now.getFullYear() - birthYear) < MINOR_AGE;
}

// Qisqa taklif kodi (masalan "ISH-7QK2")
export function makeJoinCode(type, seed) {
  const prefix = type === 'ishxona' ? 'ISH' : type === 'talim' ? 'EDU' : 'OILA';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  let n = Math.abs(seed || 1);
  for (let i = 0; i < 4; i++) { s += chars[n % chars.length]; n = Math.floor(n / chars.length) + 7 * (i + 1); }
  return prefix + '-' + s;
}
