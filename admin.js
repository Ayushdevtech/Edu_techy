// ===== EDUTECHY ADMIN — admin.js =====
let ADMIN = null, allUsers = [], editingGame = null, editingPDF = null, viewingUser = null;

// ── AUTH ──────────────────────────────────────────────
async function adminLogin() {
  const email = document.getElementById('a-email').value.trim();
  const pass  = document.getElementById('a-pass').value;
  if (!email||!pass) return msg('a-msg','Enter email and password','err');
  msg('a-msg','Signing in...','ok');
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
  if (error) return msg('a-msg', error.message, 'err');
  ADMIN = data.user;
  showDash();
}
async function adminLogout() {
  await sb.auth.signOut();
  ADMIN = null;
  document.getElementById('admin-dash').classList.add('hidden');
  document.getElementById('admin-auth').classList.remove('hidden');
}
window.addEventListener('DOMContentLoaded', async () => {
  const { data:{ session } } = await sb.auth.getSession();
  if (session?.user) { ADMIN=session.user; showDash(); }
  loadSavedSettings();
});
function showDash() {
  document.getElementById('admin-auth').classList.add('hidden');
  document.getElementById('admin-dash').classList.remove('hidden');
  showSec('dashboard');
}

// ── NAVIGATION ────────────────────────────────────────
const secTitles = {
  dashboard:'Dashboard', users:'Users', games:'Games',
  pdfs:'PDFs', posts:'Post Moderation', chat:'Chat Moderation', settings:'Settings'
};
function showSec(sec) {
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(a=>a.classList.remove('active'));
  document.getElementById('sec-'+sec).classList.add('active');
  document.querySelector(`[data-sec="${sec}"]`)?.classList.add('active');
  document.getElementById('sec-title').textContent = secTitles[sec]||sec;
  document.getElementById('admin-sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay-m').classList.add('hidden');
  if (sec==='dashboard') loadDash();
  if (sec==='users')     loadUsers();
  if (sec==='games')     loadGames();
  if (sec==='pdfs')      loadPDFs();
  if (sec==='posts')     loadPosts();
  if (sec==='chat')      loadChat();
}
function toggleAdminSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay-m').classList.toggle('hidden');
}

// ── DASHBOARD ─────────────────────────────────────────
async function loadDash() {
  const [
    {count:uc},{count:pc},{count:gc},{count:dc},{count:mc},{data:xpd},{data:top},{data:acts}
  ] = await Promise.all([
    sb.from('profiles').select('*',{count:'exact',head:true}),
    sb.from('posts').select('*',{count:'exact',head:true}),
    sb.from('games').select('*',{count:'exact',head:true}).eq('is_active',true),
    sb.from('pdfs').select('*',{count:'exact',head:true}).eq('is_active',true),
    sb.from('chat_messages').select('*',{count:'exact',head:true}),
    sb.from('profiles').select('xp'),
    sb.from('profiles').select('name,username,xp,games_played').order('xp',{ascending:false}).limit(5),
    sb.from('activity_log').select('*,profiles(name,username)').order('created_at',{ascending:false}).limit(10)
  ]);
  document.getElementById('st-users').textContent = uc||0;
  document.getElementById('st-posts').textContent = pc||0;
  document.getElementById('st-games').textContent = gc||0;
  document.getElementById('st-pdfs').textContent  = dc||0;
  document.getElementById('st-msgs').textContent  = mc||0;
  document.getElementById('st-xp').textContent    = (xpd?.reduce((s,p)=>s+(p.xp||0),0)||0).toLocaleString();

  document.getElementById('top-students').innerHTML = top?.map((u,i)=>`
    <div class="dc-item">
      <div class="dc-rank">#${i+1}</div>
      <div><div class="dc-name">${x(u.name)}</div><div class="dc-sub">@${x(u.username)} · ${u.games_played||0} games</div></div>
      <div class="dc-xp">${u.xp||0} XP</div>
    </div>`).join('') || '<div class="dc-empty">No students yet</div>';

  const icons={game:'G',post:'P',pdf:'D',chat:'C'};
  document.getElementById('recent-acts').innerHTML = acts?.map(a=>`
    <div class="dc-item">
      <div class="dc-icon-sm">${icons[a.activity_type]||'?'}</div>
      <div><div class="dc-name">${x(a.activity_name)}</div><div class="dc-sub">@${x(a.profiles?.username||'?')}</div></div>
      <div class="dc-time">${ago(a.created_at)}</div>
    </div>`).join('') || '<div class="dc-empty">No activity yet</div>';
}

// ── USERS ─────────────────────────────────────────────
async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="8" class="td-c">Loading...</td></tr>';
  const { data } = await sb.from('profiles').select('*').order('xp',{ascending:false});
  allUsers = data||[];
  renderUsers(allUsers);
}
function renderUsers(list) {
  const tbody = document.getElementById('users-tbody');
  if (!list.length) { tbody.innerHTML='<tr><td colspan="8" class="td-c">No students found</td></tr>'; return; }
  tbody.innerHTML = list.map(u=>`
    <tr>
      <td><b>${x(u.name)}</b></td>
      <td style="color:var(--violet)">@${x(u.username)}</td>
      <td>${u.age||'—'}</td>
      <td><span class="xp-tag">${u.xp||0} XP</span></td>
      <td>${u.games_played||0}</td>
      <td>${u.pdfs_read||0}</td>
      <td class="muted-td">${fmtDate(u.created_at)}</td>
      <td><button class="btn-sm" onclick="viewUser('${u.id}')">View</button></td>
    </tr>`).join('');
}
function searchUsers(q) {
  const filtered = allUsers.filter(u=>
    u.name?.toLowerCase().includes(q.toLowerCase()) ||
    u.username?.toLowerCase().includes(q.toLowerCase())
  );
  renderUsers(filtered);
}
async function viewUser(id) {
  viewingUser = id;
  const u = allUsers.find(u=>u.id===id);
  if (!u) return;
  const [{count:pc},{count:fc}] = await Promise.all([
    sb.from('posts').select('*',{count:'exact',head:true}).eq('user_id',id),
    sb.from('followers').select('*',{count:'exact',head:true}).eq('following_id',id)
  ]);
  document.getElementById('user-modal-body').innerHTML = `
    <div class="um-profile">
      <div class="um-av"><svg width="32" height="32" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="13" r="7" stroke="white" stroke-width="2"/><path d="M4 36c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="white" stroke-width="2"/></svg></div>
      <h3>${x(u.name)}</h3>
      <div class="um-handle">@${x(u.username)}</div>
    </div>
    <div class="um-grid">
      <div class="um-stat"><div class="um-n">${u.xp||0}</div><div class="um-l">XP Points</div></div>
      <div class="um-stat"><div class="um-n">${u.games_played||0}</div><div class="um-l">Games</div></div>
      <div class="um-stat"><div class="um-n">${pc||0}</div><div class="um-l">Posts</div></div>
      <div class="um-stat"><div class="um-n">${fc||0}</div><div class="um-l">Followers</div></div>
      <div class="um-stat"><div class="um-n">${u.pdfs_read||0}</div><div class="um-l">PDFs Read</div></div>
      <div class="um-stat"><div class="um-n">${u.age||'—'}</div><div class="um-l">Age</div></div>
    </div>
    ${u.bio?`<div class="um-bio">"${x(u.bio)}"</div>`:''}
    <div class="um-joined">Joined ${fmtDate(u.created_at)}</div>`;
  openModal('user-modal');
}
async function banUser() {
  if (!viewingUser) return;
  if (!confirm('Ban this student? This will delete their account and all data.')) return;
  await sb.from('posts').delete().eq('user_id',viewingUser);
  await sb.from('chat_messages').delete().eq('user_id',viewingUser);
  await sb.from('activity_log').delete().eq('user_id',viewingUser);
  await sb.from('profiles').delete().eq('id',viewingUser);
  closeModal('user-modal');
  toast('Student banned');
  loadUsers();
}

// ── GAMES ─────────────────────────────────────────────
async function loadGames() {
  const el = document.getElementById('games-cards');
  el.innerHTML = '<div class="card-loading">Loading games...</div>';
  const { data } = await sb.from('games').select('*').order('created_at',{ascending:false});
  if (!data?.length) { el.innerHTML='<div class="card-loading">No games yet. Click + Add Game to get started.</div>'; return; }
  el.innerHTML = data.map(g=>`
    <div class="item-card">
      <div class="ic-top">
        <div class="ic-icon">${g.icon||'G'}</div>
        <div>
          <div class="ic-name">${x(g.name)}</div>
          <div class="ic-date">Added ${fmtDate(g.created_at)}</div>
        </div>
      </div>
      <div class="ic-desc">${x(g.description||'No description')}</div>
      <div class="ic-meta">
        <span class="ic-xp">+${g.xp_reward} XP</span>
        <span class="ic-status ${g.is_active?'on':'off'}">${g.is_active?'Active':'Hidden'}</span>
      </div>
      <div class="ic-url">${x(g.game_url)}</div>
      <div class="ic-actions">
        <button class="btn-edit" onclick='editGame(${JSON.stringify(g).replace(/"/g,"&quot;")})'>Edit</button>
        <button class="btn-del" onclick="deleteGame('${g.id}')">Delete</button>
      </div>
    </div>`).join('');
}
function openGameModal(g=null) {
  editingGame = g;
  document.getElementById('gm-title').textContent = g?'Edit Game':'Add Game';
  document.getElementById('gm-id').value          = g?.id||'';
  document.getElementById('gm-name').value        = g?.name||'';
  document.getElementById('gm-icon').value        = g?.icon||'';
  document.getElementById('gm-desc').value        = g?.description||'';
  document.getElementById('gm-url').value         = g?.game_url||'';
  document.getElementById('gm-xp').value          = g?.xp_reward||50;
  document.getElementById('gm-active').checked    = g?.is_active!==false;
  openModal('game-modal');
}
function editGame(g) { openGameModal(typeof g==='string'?JSON.parse(g):g); }
async function saveGame() {
  const name       = document.getElementById('gm-name').value.trim();
  const icon       = document.getElementById('gm-icon').value.trim()||'G';
  const description= document.getElementById('gm-desc').value.trim();
  const game_url   = document.getElementById('gm-url').value.trim();
  const xp_reward  = parseInt(document.getElementById('gm-xp').value)||50;
  const is_active  = document.getElementById('gm-active').checked;
  const id         = document.getElementById('gm-id').value;
  if (!name)     return toast('Game name is required','err');
  if (!game_url) return toast('Game URL is required','err');
  if (id) {
    await sb.from('games').update({name,icon,description,game_url,xp_reward,is_active}).eq('id',id);
    toast('Game updated');
  } else {
    await sb.from('games').insert({name,icon,description,game_url,xp_reward,is_active});
    toast('Game added');
  }
  closeModal('game-modal'); loadGames();
}
async function deleteGame(id) {
  if (!confirm('Delete this game?')) return;
  await sb.from('games').delete().eq('id',id);
  toast('Game deleted'); loadGames();
}

// ── PDFs ──────────────────────────────────────────────
async function loadPDFs() {
  const el = document.getElementById('pdfs-cards');
  el.innerHTML = '<div class="card-loading">Loading PDFs...</div>';
  const { data } = await sb.from('pdfs').select('*').order('created_at',{ascending:false});
  if (!data?.length) { el.innerHTML='<div class="card-loading">No PDFs yet. Click + Add PDF to get started.</div>'; return; }
  el.innerHTML = data.map(p=>`
    <div class="item-card">
      <div class="ic-top">
        <div class="pdf-thumb-sm">${p.thumbnail_url?`<img src="${p.thumbnail_url}" class="pdf-th-img"/>`:'<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 2h8l4 4v12H4z" stroke="#6B7280" stroke-width="1.5"/><path d="M12 2v4h4M7 11h6M7 14h4" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round"/></svg>'}</div>
        <div>
          <div class="ic-name">${x(p.title)}</div>
          <div class="ic-date">${x(p.topic||'General')} · Added ${fmtDate(p.created_at)}</div>
        </div>
      </div>
      <div class="ic-desc">${x(p.description||'No description')}</div>
      <div class="ic-meta">
        <span class="ic-xp">+${p.xp_reward} XP</span>
        <span class="ic-status ${p.is_active?'on':'off'}">${p.is_active?'Active':'Hidden'}</span>
      </div>
      <div class="ic-url">${x(p.pdf_url)}</div>
      <div class="ic-actions">
        <button class="btn-edit" onclick='editPDF(${JSON.stringify(p).replace(/"/g,"&quot;")})'>Edit</button>
        <button class="btn-del" onclick="deletePDF('${p.id}')">Delete</button>
      </div>
    </div>`).join('');
}
function openPDFModal(p=null) {
  editingPDF = p;
  document.getElementById('pm-title-label').textContent = p?'Edit PDF':'Add PDF';
  document.getElementById('pm-id').value          = p?.id||'';
  document.getElementById('pm-title').value       = p?.title||'';
  document.getElementById('pm-topic').value       = p?.topic||'';
  document.getElementById('pm-desc').value        = p?.description||'';
  document.getElementById('pm-url').value         = p?.pdf_url||'';
  document.getElementById('pm-xp').value          = p?.xp_reward||30;
  document.getElementById('pm-active').checked    = p?.is_active!==false;
  // Thumbnail
  document.getElementById('pm-thumb').value       = p?.thumbnail_url||'';
  updateThumbPreview(p?.thumbnail_url||'');
  openModal('pdf-modal');
}
function editPDF(p) { openPDFModal(typeof p==='string'?JSON.parse(p):p); }
function updateThumbPreview(url) {
  const wrap = document.getElementById('thumb-prev-wrap');
  const img  = document.getElementById('thumb-prev-img');
  if (url) { img.src=url; wrap.classList.remove('hidden'); }
  else { wrap.classList.add('hidden'); }
}
async function savePDF() {
  const title        = document.getElementById('pm-title').value.trim();
  const topic        = document.getElementById('pm-topic').value.trim();
  const description  = document.getElementById('pm-desc').value.trim();
  const pdf_url      = document.getElementById('pm-url').value.trim();
  const thumbnail_url= document.getElementById('pm-thumb').value.trim();
  const xp_reward    = parseInt(document.getElementById('pm-xp').value)||30;
  const is_active    = document.getElementById('pm-active').checked;
  const id           = document.getElementById('pm-id').value;
  if (!title)   return toast('PDF title is required','err');
  if (!pdf_url) return toast('PDF URL is required','err');
  if (id) {
    await sb.from('pdfs').update({title,topic,description,pdf_url,thumbnail_url,xp_reward,is_active}).eq('id',id);
    toast('PDF updated');
  } else {
    await sb.from('pdfs').insert({title,topic,description,pdf_url,thumbnail_url,xp_reward,is_active});
    toast('PDF added');
  }
  closeModal('pdf-modal'); loadPDFs();
}
async function deletePDF(id) {
  if (!confirm('Delete this PDF?')) return;
  await sb.from('pdfs').delete().eq('id',id);
  toast('PDF deleted'); loadPDFs();
}

// ── POSTS MOD ─────────────────────────────────────────
async function loadPosts() {
  const el = document.getElementById('posts-list');
  el.innerHTML = '<div class="card-loading">Loading...</div>';
  const { data } = await sb.from('posts').select('*,profiles(name,username)').order('created_at',{ascending:false}).limit(60);
  if (!data?.length) { el.innerHTML='<div class="card-loading">No posts</div>'; return; }
  el.innerHTML = data.map(p=>`
    <div class="mod-item" id="mpost-${p.id}">
      <div class="mod-info">
        <div class="mod-author">${x(p.profiles?.name)} (@${x(p.profiles?.username)})</div>
        <div class="mod-text">${x(p.content)}</div>
        <div class="mod-meta">${p.likes||0} likes · ${ago(p.created_at)}</div>
      </div>
      ${p.image_url?`<img src="${p.image_url}" class="mod-img"/>` : ''}
      <button class="btn-del-sm" onclick="deletePost('${p.id}')">Delete</button>
    </div>`).join('');
}
async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  await sb.from('posts').delete().eq('id',id);
  document.getElementById('mpost-'+id)?.remove();
  toast('Post deleted');
}

// ── CHAT MOD ──────────────────────────────────────────
async function loadChat() {
  const el = document.getElementById('chat-list');
  el.innerHTML = '<div class="card-loading">Loading...</div>';
  const { data } = await sb.from('chat_messages').select('*').order('created_at',{ascending:false}).limit(100);
  if (!data?.length) { el.innerHTML='<div class="card-loading">No messages</div>'; return; }
  el.innerHTML = data.map(m=>`
    <div class="mod-item" id="mmsg-${m.id}">
      <div class="mod-info">
        <div class="mod-author">@${x(m.username)}</div>
        <div class="mod-text">${x(m.content)}</div>
        <div class="mod-meta">${ago(m.created_at)}</div>
      </div>
      <button class="btn-del-sm" onclick="deleteMsg('${m.id}')">Delete</button>
    </div>`).join('');
}
async function deleteMsg(id) {
  await sb.from('chat_messages').delete().eq('id',id);
  document.getElementById('mmsg-'+id)?.remove();
  toast('Message deleted');
}
async function clearChat() {
  if (!confirm('Clear ALL chat messages? Cannot be undone.')) return;
  await sb.from('chat_messages').delete().neq('id','00000000-0000-0000-0000-000000000000');
  loadChat(); toast('Chat cleared');
}

// ── SETTINGS (Gemini key + Supabase) ──────────────────
function loadSavedSettings() {
  ['s-url','s-key','s-gemini','s-gsearch','s-cx'].forEach(id=>{
    const v = localStorage.getItem('et_'+id);
    if (v) document.getElementById(id).value = v;
  });
}
async function saveSettings() {
  const keys = { 's-url':'supabase_url', 's-key':'supabase_key', 's-gemini':'gemini_api_key', 's-gsearch':'google_search_key', 's-cx':'google_cx' };
  for (const [elId, cfgKey] of Object.entries(keys)) {
    const val = document.getElementById(elId).value.trim();
    if (val) {
      localStorage.setItem('et_'+elId, val);
      // Save gemini key to Supabase so the app can read it
      if (cfgKey==='gemini_api_key') {
        await sb.from('app_config').upsert({ key:'gemini_api_key', value:val, updated_at:new Date().toISOString() });
      }
    }
  }
  msg('settings-msg','Settings saved. Reload page to apply Supabase changes.','ok');
  setTimeout(()=>{ document.getElementById('settings-msg').textContent=''; },4000);
}
async function changePass() {
  const p = document.getElementById('s-newpass').value;
  if (!p||p.length<6) return toast('Password must be 6+ characters','err');
  const { error } = await sb.auth.updateUser({ password:p });
  if (error) return toast(error.message,'err');
  toast('Password updated');
}
function toggleVis(id) {
  const el = document.getElementById(id);
  el.type = el.type==='password'?'text':'password';
}

// ── MODALS ────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.getElementById('modal-overlay').classList.add('hidden');
}
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ── TOAST ─────────────────────────────────────────────
function toast(m, type='ok') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id='toast';
    t.style.cssText='position:fixed;bottom:24px;right:24px;z-index:9999;padding:13px 20px;border-radius:12px;font-size:0.88rem;font-weight:600;box-shadow:0 8px 30px rgba(0,0,0,0.4);transition:opacity 0.3s;font-family:Space Grotesk,sans-serif;';
    document.body.appendChild(t);
  }
  t.textContent=m;
  t.style.background=type==='err'?'#EF4444':'#10B981';
  t.style.color=type==='err'?'white':'#022c22';
  t.style.opacity='1';
  setTimeout(()=>{ t.style.opacity='0'; },3000);
}

// ── UTILS ─────────────────────────────────────────────
function msg(id, m, type) {
  const el=document.getElementById(id);
  if (!el) return;
  el.textContent=m; el.className='auth-msg '+type;
}
function x(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function ago(d) {
  const s=Math.floor((Date.now()-new Date(d).getTime())/1000);
  if (s<60) return 'just now';
  if (s<3600) return Math.floor(s/60)+'m ago';
  if (s<86400) return Math.floor(s/3600)+'h ago';
  return Math.floor(s/86400)+'d ago';
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}
