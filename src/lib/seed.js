// Namunaviy (demo) makon/a'zo/vazifa ma'lumotlari — yangi model shaklida.
// Joriy foydalanuvchi ('me') uch makonning egasi. Firebase (M4) ulanmaguncha lokal.

import { defaultOwnerRole, permissionsFor } from './roles';

const CURRENT = 'me';

export function buildSeed() {
  const users = [
    { id: 'm1', name: 'Malika', color: '#E0916F', online: true },
    { id: 'm2', name: 'Sardor', color: '#6FB3E0', online: false, birthYear: 2011 }, // voyaga yetmagan
    { id: 'm3', name: 'Zaynab', color: '#A98FE0', online: true },
    { id: 'm4', name: 'Jahongir', color: '#43C08D', online: false, birthYear: 2009 }, // voyaga yetmagan
    { id: 'uKarim', name: 'Ustoz Karim', color: '#D9B36A', external: true },
    { id: 'uKamola', name: "O'qituvchi Kamola", color: '#E0785F', external: true },
  ];

  const workspaces = [
    { id: 'w_oila', type: 'oila', name: 'Mening oilam', ownerUserId: CURRENT, code: 'OILA-2K7Q' },
    { id: 'w_talim', type: 'talim', name: 'Sinfim', ownerUserId: CURRENT, code: 'EDU-9X3M' },
    { id: 'w_ishxona', type: 'ishxona', name: 'Ishxonam', ownerUserId: CURRENT, code: 'ISH-5B1T' },
  ];
  const wsById = Object.fromEntries(workspaces.map(w => [w.id, w]));

  const mem = (wid, uid, role, group = null, restricted = false) => {
    const ws = wsById[wid];
    const isOwner = ws.ownerUserId === uid;
    return {
      id: `mem_${wid}_${uid}`, workspaceId: wid, userId: uid, role,
      permissions: permissionsFor(ws.type, role, { isOwner, restricted }),
      status: 'active', group, restricted,
    };
  };

  const memberships = [
    // Egasi (me)
    mem('w_oila', CURRENT, defaultOwnerRole('oila')),
    mem('w_talim', CURRENT, defaultOwnerRole('talim')),
    mem('w_ishxona', CURRENT, defaultOwnerRole('ishxona')),
    // Oila
    mem('w_oila', 'm1', 'Ona'),
    mem('w_oila', 'm2', "O'g'il", null, true),
    mem('w_oila', 'm3', 'Qiz'),
    mem('w_oila', 'm4', "O'g'il", null, true),
    // Ta'lim
    mem('w_talim', 'm1', "O'qituvchi"),
    mem('w_talim', 'm2', "O'quvchi", '9-sinf', true),
    mem('w_talim', 'm3', 'Talaba', '1-kurs'),
    mem('w_talim', 'm4', 'Talaba', '11-sinf', true),
    // Ishxona
    mem('w_ishxona', 'm1', 'Menejer'),
    mem('w_ishxona', 'm3', 'Xodim'),
    mem('w_ishxona', 'm4', 'Ishchi'),
  ];

  const T = (id, wid, assigner, assignee, title, desc, status, due, cat, type = 'vazifa') =>
    ({ id, workspaceId: wid, assignerUserId: assigner, assigneeUserId: assignee, title, desc, status, due, cat, type });

  const tasks = [
    T('k1', 'w_oila', CURRENT, 'm2', "Bomdodni jamoat bilan o'qish", 'Mahalla masjidida jamoat namozida ishtirok etish.', 'bajarildi', 'Bugun', 'Namoz'),
    T('k2', 'w_talim', CURRENT, 'm3', "Qur'on: Baqara 1-20 oyat", "Tajvid qoidalari bilan o'qib, yodlashni boshlash.", 'bajarilmoqda', 'Bugun', "Qur'on"),
    T('k3', 'w_talim', CURRENT, 'm2', 'Matematika uy vazifasi', "5-mavzu bo'yicha 1-10 misollarni yechish.", 'yuborildi', 'Ertaga', "Ta'lim"),
    T('k4', 'w_ishxona', CURRENT, 'm1', 'Oylik hisobotni tayyorlash', "Iyul oyi bo'yicha moliyaviy hisobot.", 'qabul', 'Bu hafta', 'Ish'),
    T('k5', 'w_oila', CURRENT, 'm4', 'Kechki sadaqa ulashish', 'Ehtiyojmand oilalarga yordam yetkazish.', 'rad', 'Bugun', 'Sadaqa'),
    // Menga (me) berilgan — global inbox uchun
    T('k6', 'w_talim', 'uKarim', CURRENT, 'Kahf surasini yodlash', 'Juma kuniga birinchi 10 oyatni tayyorlab keling.', 'yuborildi', 'Juma', "Qur'on"),
    T('k7', 'w_talim', 'uKamola', CURRENT, 'Ertaga imtihon — tayyorlaning', "3-bob bo'yicha yozma imtihon. Konspektlaringizni ko'rib chiqing.", 'yuborildi', 'Ertaga', 'Imtihon', 'eslatma'),
    T('k8', 'w_talim', CURRENT, 'm2', "Insho: Vatan tuyg'usi", "Kamida bir bet, qo'lda yozilsin.", 'bajarilmoqda', 'Chorshanba', 'Dars'),
  ];

  return { users, workspaces, memberships, tasks, seeded: true };
}
