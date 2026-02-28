// ═══════════════════════════════════════════════════════════════════════════
//  Prayer Journal 2026 — with Accounts & Editing
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://qhhvjuubsiitkrjqtdue.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaHZqdXVic2lpdGtyanF0ZHVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTk5MTMsImV4cCI6MjA4Nzg3NTkxM30.vSbHC9SxOqJHLhJkOraTHt-S8Bkn8n6qJ12t85oaC7I';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── People & Scripture ────────────────────────────────────────────────────
const PEOPLE = [
  { name: 'Grant',   scripture: 'Because the one who sows to his flesh will reap destruction from the flesh but the one who sows to the Spirit will reap eternal life from the Spirit.', reference: 'Galatians 6:8' },
  { name: 'Kaitlin', scripture: 'Now if any of you lacks wisdom, he should ask God\u2014who gives to all generously and ungrudgingly\u2014and it will be given to him.', reference: 'James 1:5' },
  { name: 'Ricky',   scripture: 'After these events, the word of the LORD came to Abram in a vision: \u2018Do not be afraid, Abram. I am your shield; your reward will be very great.\u2019 But Abram said, \u2018Lord GOD, what can you give me, since I am childless and the heir of my house is Eliezer of Damascus?\u2019 Abram continued, \u2018Look, you have given me no offspring, so a slave born in my house will be my heir.\u2019 Now the word of the LORD came to him: \u2018This one will not be your heir; instead, one who comes from your own body will be your heir.\u2019 He took him outside and said, \u2018Look at the sky and count the stars, if you are able to count them.\u2019 Then he said to him, \u2018Your offspring will be that numerous.\u2019 Abram believed the LORD, and he credited it to him as righteousness.', reference: 'Genesis 15:1-6' },
  { name: 'Katie',   scripture: 'For through faith you are all sons of God in Christ Jesus.', reference: 'Galatians 3:26' },
  { name: 'Forrest', scripture: 'The point is this: The person who sows sparingly will also reap sparingly, and the person who sows generously will also reap generously. Each person should do as he has decided in his heart \u2014 not reluctantly or out of compulsion, since God loves a cheerful giver.', reference: '2 Corinthians 9:6-7' },
  { name: 'Carissa', scripture: 'Trust in the LORD with all your heart, and do not rely on your own understanding; in all your ways know him, and he will make your paths straight.', reference: 'Proverbs 3:5-6' },
  { name: 'Savanna', scripture: '\u2018Do not remember the past events; pay no attention to things of old. Look, I am about to do something new; even now it is coming. Do you not see it? Indeed, I will make a way in the wilderness, rivers in the desert.\u2019', reference: 'Isaiah 43:18-19' },
  { name: 'Greg',    scripture: '\u2018Take my yoke upon you and learn from me, because I am lowly and humble in heart, and you will find rest for your souls.\u2019', reference: 'Matthew 11:29' },
  { name: 'Avery',   scripture: 'Send your light and your truth; let them lead me. Let them bring me to your holy mountain, to your dwelling place. Then I will come to the altar of God, to God, my greatest joy. I will praise you with the lyre, God, my God.', reference: 'Psalm 43:3-4' },
  { name: 'Mary',    scripture: '\u2018Peace I leave with you. My peace I give to you. I do not give to you as the world gives. Don\u2019t let your hearts be troubled or fearful.\u2019', reference: 'John 14:27' },
  { name: 'Maya',    scripture: 'Humble yourselves, therefore, under the mighty hand of God, so that he may exalt you at the proper time, casting all your cares on him, because he cares about you.', reference: '1 Peter 5:6-7' },
  { name: 'Hunter',  scripture: 'For this very reason, make every effort to supplement your faith with goodness, goodness with knowledge, knowledge with self-control, self-control with endurance, endurance with godliness, godliness with brotherly affection, and brotherly affection with love.', reference: '2 Peter 1:5-7' },
];

// ── State ─────────────────────────────────────────────────────────────────
let currentUser   = null;
let currentPerson = null;

// ── DOM refs ──────────────────────────────────────────────────────────────
const viewHome   = document.getElementById('view-home');
const viewPerson = document.getElementById('view-person');
const peopleGrid = document.getElementById('people-grid');
const navPeople  = document.getElementById('nav-people');
const backBtn    = document.getElementById('back-btn');

// ── Helpers ───────────────────────────────────────────────────────────────
function displayName() {
  return currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'You';
}
function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function escNl(str) { return esc(str).replace(/\n/g,'<br>'); }
function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role','status');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3200);
}

// ── Boot ──────────────────────────────────────────────────────────────────
async function init() {
  buildStarfield();

  // Get existing session
  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user ?? null;

  // React to future sign-in / sign-out events
  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    renderNavAuth();
    renderPrayerForm();
    if (currentPerson) loadPrayers(currentPerson);
  });

  renderNavAuth();
  await loadHome();

  const splash = document.getElementById('splash');
  splash.classList.add('fade-out');
  setTimeout(() => splash.remove(), 520);
}

// ── Starfield ─────────────────────────────────────────────────────────────
function buildStarfield() {
  const sf = document.getElementById('starfield');
  for (let i = 0; i < 160; i++) {
    const s = document.createElement('div');
    const sz = Math.random() * 2.4 + 0.4;
    s.className = 'star';
    s.style.cssText = [
      `left:${Math.random()*100}%`, `top:${Math.random()*100}%`,
      `width:${sz}px`, `height:${sz}px`,
      `--dur:${(Math.random()*4+2).toFixed(1)}s`,
      `--op:${(Math.random()*0.55+0.08).toFixed(2)}`,
      `animation-delay:${(Math.random()*6).toFixed(1)}s`,
    ].join(';');
    sf.appendChild(s);
  }
}

// ── Nav auth ──────────────────────────────────────────────────────────────
function renderNavAuth() {
  const el = document.getElementById('nav-auth');
  if (currentUser) {
    const initial = displayName()[0].toUpperCase();
    el.innerHTML = `
      <span class="nav-user">
        <span class="nav-user-avatar">${initial}</span>
        <span>${esc(displayName())}</span>
      </span>
      <button class="nav-logout" id="nav-logout-btn">Sign Out</button>`;
    document.getElementById('nav-logout-btn').addEventListener('click', async () => {
      await supabase.auth.signOut();
      toast('Signed out. God bless!');
    });
  } else {
    el.innerHTML = `<button class="nav-signin-btn" id="nav-signin-btn">Sign In</button>`;
    document.getElementById('nav-signin-btn').addEventListener('click', () => showAuthModal());
  }
}

// ── Auth Modal ────────────────────────────────────────────────────────────
function showAuthModal(tab = 'signin') {
  switchAuthTab(tab);
  // Reset check-email state
  document.getElementById('auth-check-email').classList.remove('visible');
  document.querySelectorAll('.auth-form').forEach(f => f.style.display = '');
  document.getElementById('auth-overlay').classList.add('active');
}
function hideAuthModal() {
  document.getElementById('auth-overlay').classList.remove('active');
  document.getElementById('signin-error').textContent = '';
  document.getElementById('signup-error').textContent = '';
}

window.switchAuthTab = function(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.toggle('active', f.id === `form-${tab}`));
};

// Close on overlay click or X button
document.getElementById('auth-close').addEventListener('click', hideAuthModal);
document.getElementById('auth-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) hideAuthModal();
});

// Tab switcher buttons (in modal)
document.querySelectorAll('.auth-tab, .link-btn').forEach(btn => {
  btn.addEventListener('click', () => window.switchAuthTab(btn.dataset.tab));
});

// Sign In
document.getElementById('form-signin').addEventListener('submit', async e => {
  e.preventDefault();
  const email    = document.getElementById('signin-email').value.trim();
  const password = document.getElementById('signin-password').value;
  const errEl    = document.getElementById('signin-error');
  const btn      = e.target.querySelector('.submit-btn');

  btn.disabled = true;
  btn.innerHTML = '<span class="btn-cross">✝</span> Signing in…';
  errEl.textContent = '';

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    errEl.textContent = error.message;
  } else {
    hideAuthModal();
    toast(`Welcome back, ${displayName()}! ✝`);
  }
  btn.disabled = false;
  btn.innerHTML = '<span class="btn-cross">✝</span> Sign In';
});

// Sign Up
document.getElementById('form-signup').addEventListener('submit', async e => {
  e.preventDefault();
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const errEl    = document.getElementById('signup-error');
  const btn      = e.target.querySelector('.submit-btn');

  if (!name) { errEl.textContent = 'Please enter your name.'; return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="btn-cross">✝</span> Creating account…';
  errEl.textContent = '';

  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name } }
  });

  if (error) {
    errEl.textContent = error.message;
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-cross">✝</span> Create Account';
  } else if (data.session) {
    // Email confirmation disabled — auto logged in
    hideAuthModal();
    toast(`Welcome, ${name}! ✝`);
  } else {
    // Email confirmation required
    document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
    document.getElementById('auth-check-email').classList.add('visible');
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-cross">✝</span> Create Account';
  }
});

// ── Home ──────────────────────────────────────────────────────────────────
async function loadHome() {
  peopleGrid.innerHTML = '<p style="color:var(--text-dim);font-family:\'EB Garamond\',serif;font-style:italic;text-align:center;padding:3rem;animation:fade-pulse 1.5s infinite">Loading prayer family…</p>';

  const { data: rows } = await supabase.from('prayers').select('person_name');
  const countMap = {};
  rows?.forEach(r => { countMap[r.person_name] = (countMap[r.person_name] || 0) + 1; });

  navPeople.innerHTML = PEOPLE.map(p =>
    `<button class="nav-btn" data-name="${esc(p.name)}">${esc(p.name)}</button>`
  ).join('');
  navPeople.querySelectorAll('.nav-btn').forEach(btn =>
    btn.addEventListener('click', () => openPerson(btn.dataset.name))
  );

  peopleGrid.innerHTML = PEOPLE.map((p, i) => `
    <div class="person-card" style="animation-delay:${(i*.045).toFixed(2)}s"
         data-name="${esc(p.name)}" role="button" tabindex="0"
         aria-label="View prayers for ${esc(p.name)}">
      <div class="card-ref">${esc(p.reference)}</div>
      <div class="card-name">${esc(p.name)}</div>
      <p class="card-scripture">${esc(p.scripture)}</p>
      <div class="card-footer">
        <span class="prayer-count">
          <span class="pc-cross" aria-hidden="true">✝</span>
          ${countMap[p.name]||0} ${(countMap[p.name]||0)===1?'prayer':'prayers'}
        </span>
        <button class="view-btn" data-name="${esc(p.name)}">View Prayers →</button>
      </div>
    </div>`).join('');

  peopleGrid.querySelectorAll('.person-card').forEach(card => {
    card.addEventListener('click',   () => openPerson(card.dataset.name));
    card.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') openPerson(card.dataset.name); });
  });
  peopleGrid.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openPerson(btn.dataset.name); });
  });
}

// ── Person detail ─────────────────────────────────────────────────────────
async function openPerson(name) {
  currentPerson = name;
  const person = PEOPLE.find(p => p.name === name);
  if (!person) return;

  document.getElementById('detail-name').textContent      = name;
  document.getElementById('detail-scripture').textContent = person.scripture;
  document.getElementById('detail-ref').textContent       = '— ' + person.reference;

  viewHome.classList.remove('active');
  viewPerson.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });

  renderPrayerForm();
  await loadPrayers(name);
}

// ── Load prayers ──────────────────────────────────────────────────────────
async function loadPrayers(name) {
  const list = document.getElementById('prayers-list');
  list.innerHTML = '<p style="color:var(--text-dim);font-family:\'EB Garamond\',serif;font-style:italic;text-align:center;padding:2rem;animation:fade-pulse 1.5s infinite">Loading prayers…</p>';

  const { data: prayers, error } = await supabase
    .from('prayers').select('*')
    .eq('person_name', name)
    .order('created_at', { ascending: true });

  if (error) { list.innerHTML = '<p style="color:#e07070;text-align:center;padding:2rem">Error loading prayers.</p>'; return; }

  if (!prayers || prayers.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="empty-cross" aria-hidden="true">✝</span>Be the first to lift up ${esc(name)} in prayer…</div>`;
    return;
  }
  list.innerHTML = prayers.map(renderPrayer).join('');
}

// ── Render prayer card ────────────────────────────────────────────────────
function renderPrayer(p) {
  const initials  = p.author_name.split(/\s+/).map(w=>w[0]||'').join('').toUpperCase().slice(0,2);
  const isLeader  = p.author_name.trim().toLowerCase() === 'avery';
  const isAnon    = p.user_id === null || p.user_id === undefined;
  const isOwner   = currentUser && currentUser.id === p.user_id;
  const canEdit   = isOwner;
  const canDelete = currentUser && (isOwner || isAnon);
  const date      = new Date(p.created_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});

  return `
    <div class="prayer-card" data-prayer-id="${p.id}" data-content="${esc(p.content)}">
      <div class="prayer-author-row">
        <div class="author-avatar${isLeader?' leader':''}" aria-hidden="true">${initials}</div>
        <div class="author-meta">
          <div class="author-name-row">
            <span class="author-name">${esc(p.author_name)}</span>
            ${isLeader ? '<span class="leader-badge">✝ Prayer Leader</span>' : ''}
          </div>
          <div class="prayer-date">${date}</div>
        </div>
        ${(canEdit || canDelete) ? `
          <div class="prayer-actions">
            ${canEdit   ? `<button class="edit-btn"   data-id="${p.id}">✎ Edit</button>`   : ''}
            ${canDelete ? `<button class="delete-btn" data-id="${p.id}">✕ Delete</button>` : ''}
          </div>` : ''}
      </div>
      <p class="prayer-text">${escNl(p.content)}</p>
    </div>`;
}

// ── Edit & Delete prayers (event delegation) ──────────────────────────────
document.getElementById('prayers-list').addEventListener('click', async e => {
  const editBtn    = e.target.closest('.edit-btn');
  const deleteBtn  = e.target.closest('.delete-btn');
  const confirmBtn = e.target.closest('.delete-confirm-btn');
  const cancelBtn  = e.target.closest('.delete-cancel-btn');

  if (editBtn)    handleEdit(editBtn.dataset.id);
  if (deleteBtn)  handleDeletePrompt(deleteBtn.dataset.id);
  if (confirmBtn) await handleDeleteExecute(confirmBtn.dataset.id);
  if (cancelBtn)  handleDeleteCancel(cancelBtn.closest('[data-prayer-id]').dataset.prayerId);
});

function handleEdit(id) {
  const card = document.querySelector(`[data-prayer-id="${id}"]`);
  if (!card || card.querySelector('.edit-area')) return;

  const original  = card.dataset.content;
  const textEl    = card.querySelector('.prayer-text');
  const actionsEl = card.querySelector('.prayer-actions');
  textEl.style.display    = 'none';
  if (actionsEl) actionsEl.style.display = 'none';

  const editArea = document.createElement('div');
  editArea.className = 'edit-area';
  editArea.innerHTML = `
    <textarea class="edit-textarea" maxlength="3000">${esc(original)}</textarea>
    <div class="edit-actions">
      <button class="edit-cancel">Cancel</button>
      <button class="submit-btn sm" id="save-${id}">
        <span class="btn-cross">✝</span> Save
      </button>
    </div>`;
  card.appendChild(editArea);
  editArea.querySelector('textarea').focus();

  editArea.querySelector('.edit-cancel').addEventListener('click', () => {
    textEl.style.display = '';
    if (actionsEl) actionsEl.style.display = '';
    editArea.remove();
  });

  editArea.querySelector(`#save-${id}`).addEventListener('click', async () => {
    const newContent = editArea.querySelector('textarea').value.trim();
    if (!newContent) return;
    const saveBtn = editArea.querySelector(`#save-${id}`);
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="btn-cross">✝</span> Saving…';

    const { error } = await supabase.from('prayers').update({ content: newContent }).eq('id', id);
    if (error) {
      toast('Could not save — please try again.');
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span class="btn-cross">✝</span> Save';
    } else {
      textEl.innerHTML = escNl(newContent);
      card.dataset.content = newContent;
      textEl.style.display = '';
      if (actionsEl) actionsEl.style.display = '';
      editArea.remove();
      toast('Prayer updated. ✝');
    }
  });
}

function handleDeletePrompt(id) {
  const card = document.querySelector(`[data-prayer-id="${id}"]`);
  if (!card) return;
  const actionsEl = card.querySelector('.prayer-actions');
  if (!actionsEl) return;
  // Save original so cancel can restore it
  actionsEl.dataset.original = actionsEl.innerHTML;
  actionsEl.innerHTML = `
    <span class="delete-confirm-text">Delete this prayer?</span>
    <button class="delete-cancel-btn">Cancel</button>
    <button class="delete-confirm-btn" data-id="${id}">Delete</button>`;
}

function handleDeleteCancel(id) {
  const card = document.querySelector(`[data-prayer-id="${id}"]`);
  if (!card) return;
  const actionsEl = card.querySelector('.prayer-actions');
  if (actionsEl?.dataset.original) {
    actionsEl.innerHTML = actionsEl.dataset.original;
    delete actionsEl.dataset.original;
  }
}

async function handleDeleteExecute(id) {
  const card      = document.querySelector(`[data-prayer-id="${id}"]`);
  const confirmBtn = card?.querySelector('.delete-confirm-btn');
  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Deleting…'; }

  const { error } = await supabase.from('prayers').delete().eq('id', id);

  if (error) {
    toast('Could not delete — please try again.');
    handleDeleteCancel(id);
  } else {
    card.style.transition = 'opacity .3s, transform .3s';
    card.style.opacity    = '0';
    card.style.transform  = 'translateX(20px)';
    setTimeout(() => {
      card.remove();
      const list = document.getElementById('prayers-list');
      if (list && !list.querySelector('.prayer-card')) {
        list.innerHTML = `<div class="empty-state"><span class="empty-cross" aria-hidden="true">✝</span>Be the first to lift up ${esc(currentPerson)} in prayer…</div>`;
      }
    }, 300);
    toast('Prayer removed. ✝');
  }
}

// ── Prayer form (auth-aware) ──────────────────────────────────────────────
function renderPrayerForm() {
  const card = document.getElementById('add-prayer-card');
  if (!card || !currentPerson) return;

  if (!currentUser) {
    card.innerHTML = `
      <div class="signin-prompt">
        <span class="sp-cross" aria-hidden="true">✝</span>
        <p class="sp-text">Sign in to add your prayer for ${esc(currentPerson)}</p>
        <button class="submit-btn" id="form-signin-btn">
          <span class="btn-cross" aria-hidden="true">✝</span> Sign In / Create Account
        </button>
      </div>`;
    document.getElementById('form-signin-btn').addEventListener('click', () => showAuthModal());
    return;
  }

  const initial = displayName()[0].toUpperCase();
  card.innerHTML = `
    <h3 class="form-heading">Add Your Prayer</h3>
    <form id="prayer-form" novalidate>
      <div class="form-group">
        <label>Posting as</label>
        <div class="posting-as">
          <span class="posting-avatar">${initial}</span>
          <span class="posting-name">${esc(displayName())}</span>
        </div>
      </div>
      <div class="form-group">
        <label for="prayer-content">Your Prayer</label>
        <textarea id="prayer-content" rows="6"
          placeholder="Write your prayer for ${esc(currentPerson)}…"
          maxlength="3000" required></textarea>
      </div>
      <div class="form-actions">
        <span class="char-count" id="char-count">0 / 3000</span>
        <button type="submit" class="submit-btn" id="submit-btn">
          <span class="btn-cross" aria-hidden="true">✝</span> Post Prayer
        </button>
      </div>
    </form>`;

  document.getElementById('prayer-content').addEventListener('input', e => {
    document.getElementById('char-count').textContent = `${e.target.value.length} / 3000`;
  });
  document.getElementById('prayer-form').addEventListener('submit', submitPrayer);
}

// ── Submit prayer ─────────────────────────────────────────────────────────
async function submitPrayer(e) {
  e.preventDefault();
  if (!currentUser) { showAuthModal(); return; }

  const content   = document.getElementById('prayer-content').value.trim();
  const submitBtn = document.getElementById('submit-btn');
  if (!content) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-cross">✝</span> Posting…';

  const { data: newPrayer, error } = await supabase
    .from('prayers')
    .insert([{ person_name: currentPerson, author_name: displayName(), content, user_id: currentUser.id }])
    .select().single();

  if (error) {
    toast('Something went wrong. Please try again.');
  } else {
    document.getElementById('prayer-content').value = '';
    document.getElementById('char-count').textContent = '0 / 3000';
    const list  = document.getElementById('prayers-list');
    const empty = list.querySelector('.empty-state');
    if (empty) empty.remove();
    list.insertAdjacentHTML('beforeend', renderPrayer(newPrayer));
    list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    toast('✝  Prayer posted — may it rise before the Lord.');
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = '<span class="btn-cross">✝</span> Post Prayer';
}

// ── Navigation ────────────────────────────────────────────────────────────
function goHome() {
  viewPerson.classList.remove('active');
  viewHome.classList.add('active');
  currentPerson = null;
  window.scrollTo({ top: 0, behavior: 'instant' });
  loadHome();
}
backBtn.addEventListener('click', goHome);
document.getElementById('nav-brand-btn').addEventListener('click', goHome);

// ── Go ────────────────────────────────────────────────────────────────────
init();
