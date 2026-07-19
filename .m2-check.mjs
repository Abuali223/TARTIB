import { buildSeed } from './src/lib/seed.js';
import { CAP, isManagerPerms, permissionsFor } from './src/lib/roles.js';
const { users, workspaces, memberships, tasks } = buildSeed();
console.log('users:', users.length, '| workspaces:', workspaces.length, '| memberships:', memberships.length, '| tasks:', tasks.length);
// Egasi (me) har makonda barcha ruxsatga egami?
for (const w of workspaces) {
  const me = memberships.find(m => m.workspaceId===w.id && m.userId==='me');
  console.log(`${w.type.padEnd(8)} owner(me) role=${me.role} manager=${isManagerPerms(me.permissions)} caps=${me.permissions.length}`);
}
// Voyaga yetmagan (Sardor m2 talim) faqat qabul qiladimi?
const sardor = memberships.find(m => m.workspaceId==='w_talim' && m.userId==='m2');
console.log('Sardor(talim) restricted=', sardor.restricted, 'perms=', JSON.stringify(sardor.permissions), 'manager=', isManagerPerms(sardor.permissions));
// O'qituvchi(Malika m1 talim) manager bo'lishi kerak
const malika = memberships.find(m => m.workspaceId==='w_talim' && m.userId==='m1');
console.log('Malika(talim) role=', malika.role, 'manager=', isManagerPerms(malika.permissions));
// Global inbox: menga berilgan vazifalar
const inbox = tasks.filter(t => t.assigneeUserId==='me');
console.log('Inbox (menga):', inbox.map(t=>t.id+'@'+t.workspaceId).join(', '));
// Har vazifa mas'uli o'sha makon a'zosimi?
let bad=0;
for (const t of tasks) {
  const ok = t.assigneeUserId==='me' || memberships.some(m=>m.workspaceId===t.workspaceId && m.userId===t.assigneeUserId);
  if(!ok){ bad++; console.log('  XATO: ',t.id,'mas\'ul',t.assigneeUserId,'makon a\'zosi emas',t.workspaceId); }
}
console.log(bad===0 ? '✓ Har vazifa mas\'uli makon a\'zosi' : `✗ ${bad} nomuvofiq vazifa`);
