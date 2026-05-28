/**
 * CDK Competiciones — App shell v1.2.0
 *
 * - Wizard: Deporte > Categoria > Equipo (filtrado por categoria real)
 * - Mi equipo: muestra Liga y Copa por separado (cuando hay ambas)
 * - Equipos extraidos del portal Clupik del CDK (temporada 2025-2026)
 */

let Browser, Share, Network, PushNotifications, Preferences, App, StatusBar;

async function loadCapacitorPlugins() {
  try {
    const cap = await import('@capacitor/core');
    if (!cap.Capacitor.isNativePlatform()) {
      console.log('[CDK] Modo navegador');
      return false;
    }
    [Browser] = [(await import('@capacitor/browser')).Browser];
    [Share] = [(await import('@capacitor/share')).Share];
    [Network] = [(await import('@capacitor/network')).Network];
    [PushNotifications] = [(await import('@capacitor/push-notifications')).PushNotifications];
    [Preferences] = [(await import('@capacitor/preferences')).Preferences];
    [App] = [(await import('@capacitor/app')).App];
    [StatusBar] = [(await import('@capacitor/status-bar')).StatusBar];
    return true;
  } catch (e) { return false; }
}

const BASE = 'https://competiciones.clubdeportivokolbe.com/es';
const URLS = {
  home: BASE + '/',
  competitions: BASE + '/tournaments',
  calendar: BASE + '/activities',
  news: BASE + '/posts',
  campus: BASE + '/section/campus-verano',
  info: BASE + '/information',
  facebook: 'https://www.facebook.com/cdkolbe',
  instagram: 'https://www.instagram.com/clubdeportivokolbe',
  web: BASE + '/',
};

/**
 * Equipos REALES por torneo (extraidos del portal Clupik temporada 2025-2026).
 * Algunos torneos tienen lista parcial (solo se scrapearon algunos grupos);
 * el boton "Buscar en el portal" abre el ranking completo como fallback.
 */
const TEAMS_BY_TOURNAMENT = {
  // === LIGAS Fútbol 7 ===
  '1322341': ['EVEREST "A"', 'EVEREST "B"', 'EVEREST "C"', 'COLEGIO HIGHLANDS LOS FRESNOS "A"', 'COLEGIO CEU MONTEPRINCIPE', 'CF QUIJORNA'],
  '1322342': ['ST. MICHAEL´S GREEN', 'CDE QUERCUS EDUCAJUNIOR "A"', 'COLEGIO HIGHLANDS LOS FRESNOS "A"', 'COLEGIO ZOLA "A"', 'EVEREST "B"', 'CD ARENALES ARROYOMOLINOS'],
  '1322343': ['CD KOLBE BLANCO', 'CD KOLBE VERDE', 'CD KOLBE MORADO', 'COLEGIO HIGHLANDS LOS FRESNOS', 'RAYO ZARZALEJO', 'CD ARENALES ARROYOMOLINOS', 'COLEGIO ZOLA "A"', 'COLEGIO ZOLA "B"', 'CD FRESNEDILLAS', 'AD VILLA DE NAVALAGAMELLA', 'CD VALLMONT "A"', 'COLEGIO CEU MONTEPRINCIPE', 'UNIÓN PARDILLO'],
  '1322344': ['CD KOLBE BLANCO', 'CD KOLBE VERDE', 'CD FRESNEDILLAS', 'AD VILLA DE NAVALAGAMELLA', 'QUIJORNA CITY', 'CD LA CAÑADA', 'CDE NUEVO VVA. DEL PARDILLO', 'SANTA MARIA DE LA ALAMEDA'],
  '1322345': ['CD KOLBE JUV.', 'CD KOLBE CADETE', 'CF QUIJORNA', 'CD FRESNEDILLAS', 'UNIÓN PARDILLO', 'COLEGIO ZOLA "A"', 'COLEGIO ZOLA "B"'],

  // === LIGAS Voleibol ===
  '1322346': ['CD KOLBE', 'C.D.E SEK EL CASTILLO – UCJC AMARILLO', 'C.D.E SEK EL CASTILLO – UCJC MORADO', 'C.D.E SEK EL CASTILLO – UCJC VERDE', 'COLEGIO EVEREST CELESTE', 'COLEGIO EVEREST AMARILLO', 'HIGHLANDS SCHOOL LOS FRESNOS A'],
  '1322347': ['CD KOLBE VERDE', 'C.D.E SEK EL CASTILLO – UCJC AZUL', 'C.D.E SEK EL CASTILLO – UCJC NARANJA', 'AVENGERS LFI MOLIÈRE ROJO', 'HIGHLANDS SCHOOL LOS FRESNOS A', "ST MICHAEL'S SCHOOL WHITE"],
  '1322348': ['CD KOLBE VERDE', 'AVENGERS LFI MOLIÈRE AZUL', 'AVENGERS LFI MOLIÈRE ROJO', 'C.D.E SEK EL CASTILLO – UCJC GREEN (mix)', 'C.D.E SEK EL CASTILLO – UCJC RED', 'COLEGIO HÉLADE'],
  '1322349': ['CD KOLBE BLANCO', 'CD KOLBE VERDE', 'AVENGERS LFI MOLIÈRE NARANJA JUV', 'CV BULLDOGS', 'ABV BOADILLA VOLEIBOL AMARILLO', 'ABV BOADILLA VOLEIBOL NEGRO', 'LAS ENCINAS - MQC (mix)'],
  '1324509': ['CD KOLBE BLANCO', 'CD KOLBE VERDE', 'AVENGERS LFI MOLIÈRE ROJO', 'AVENGERS LFI MOLIÈRE BLANCO (mix)', 'AVENGERS LFI MOLIÈRE AZUL', 'C.D.E SEK EL CASTILLO – UCJC (mix)'],

  // === LIGAS Fútbol Sala ===
  '1322350': ['CD VALLMONT 1', 'CD VALLMONT 2', 'ZOLA VILLAFRANCA A', 'ZOLA VILLAFRANCA B', 'CE FÚTSAL PARDILLO ARIANNAS COOKIES'],
  '1322351': ['CD KOLBE 3º BLANCO', 'CD KOLBE 4º', 'CE FÚTSAL PARDILLO GESTIÓN INMOBILIARIA', 'CE FUTSAL PARDILLO ARTRUX', 'MASERAL CARPE DIEM 1'],
  '1322352': ['CD KOLBE', 'CD VILLANUEVA DE LA CAÑADA', 'LOS BOLICHES G.', 'LOS BOLICHES M.', 'FS PyD SORIANO', 'FÚTSAL PARDILLO', 'MASERAL CARPE', 'COLEGIO ARCADIA', 'ED BRUNETE FS'],
};

/**
 * Estructura: Deporte > Categoria > Liga + Copa.
 * Si una categoria tiene Copa, sus equipos se asumen iguales a los de la Liga.
 */
const COMPETITIONS = [
  {
    id: 'f7', name: 'Fútbol 7', short: 'F7',
    categories: [
      { id: 'f7-pre', name: 'Prebenjamín', leagueId: '1322341', cupId: '1322356' },
      { id: 'f7-ben', name: 'Benjamín',    leagueId: '1322342', cupId: '1322357' },
      { id: 'f7-ale', name: 'Alevín',      leagueId: '1322343', cupId: '1322358' },
      { id: 'f7-inf', name: 'Infantil',    leagueId: '1322344', cupId: '1322359' },
      { id: 'f7-cad', name: 'Cadete/Juvenil', leagueId: '1322345', cupId: '1322361' },
    ],
  },
  {
    id: 'fs', name: 'Fútbol Sala', short: 'FS',
    categories: [
      { id: 'fs-pre', name: 'Prebenjamín', leagueId: '1322350' },
      { id: 'fs-ben', name: 'Benjamín',    leagueId: '1322351' },
      { id: 'fs-ale', name: 'Alevín',      leagueId: '1322352' },
    ],
  },
  {
    id: 'vb', name: 'Voleibol', short: 'VB',
    categories: [
      { id: 'vb-ben', name: 'Benjamín', leagueId: '1322346' },
      { id: 'vb-ale', name: 'Alevín',   leagueId: '1322347', cupId: '1322353' },
      { id: 'vb-inf', name: 'Infantil', leagueId: '1322348', cupId: '1322354' },
      { id: 'vb-cad', name: 'Cadete',   leagueId: '1324509', cupId: '1322355' },
      { id: 'vb-juv', name: 'Juvenil',  leagueId: '1322349', cupId: '1334008' },
    ],
  },
];

const STORAGE_KEY = 'cdk.myTeam.v3';

async function getStored(k) {
  if (Preferences) { const { value } = await Preferences.get({ key: k }); return value; }
  return localStorage.getItem(k);
}
async function setStored(k, v) {
  if (Preferences) return Preferences.set({ key: k, value: v });
  localStorage.setItem(k, v);
}
async function openUrl(url) {
  if (Browser) {
    await Browser.open({ url, windowName: '_self', presentationStyle: 'popover', toolbarColor: '#0BAB00' });
  } else { window.open(url, '_blank'); }
}
async function shareText(title, text, url) {
  if (Share) { try { await Share.share({ title, text, url, dialogTitle: 'Compartir' }); } catch (e) {} }
  else if (navigator.share) navigator.share({ title, text, url }).catch(() => {});
}
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// === Mi equipo ===
function renderMyTeam(data) {
  const card = document.getElementById('myTeamCard');
  if (!data || !data.team) {
    card.innerHTML = '<div class="empty-state"><p>Aun no has elegido tu equipo</p><button class="btn-primary" id="btnSelectTeam">Elegir mi equipo</button></div>';
    document.getElementById('btnSelectTeam').addEventListener('click', openWizard);
    return;
  }

  // Header con escudo + nombre + deporte/categoria
  let html =
    '<div class="team-active">' +
      '<div class="logo-shield" style="background:var(--color-primary);color:white;font-size:20px;">' +
        escapeHtml(data.team.charAt(0)) +
      '</div>' +
      '<div class="team-active-info">' +
        '<h3>' + escapeHtml(data.team) + '</h3>' +
        '<div class="team-competition">' + escapeHtml(data.sport) + ' · ' + escapeHtml(data.category) + '</div>' +
      '</div>' +
    '</div>';

  // Bloque Liga (siempre)
  html +=
    '<div class="comp-block">' +
      '<div class="comp-block-label">Liga</div>' +
      '<div class="comp-block-actions">' +
        '<button class="team-action" data-act="cal-liga">Calendario</button>' +
        '<button class="team-action" data-act="rank-liga">Clasificación</button>' +
      '</div>' +
    '</div>';

  // Bloque Copa (si existe)
  if (data.cupId) {
    html +=
      '<div class="comp-block">' +
        '<div class="comp-block-label">Copa</div>' +
        '<div class="comp-block-actions">' +
          '<button class="team-action" data-act="cal-copa">Calendario</button>' +
          '<button class="team-action" data-act="rank-copa">Clasificación</button>' +
        '</div>' +
      '</div>';
  }

  // Compartir abajo
  html += '<button class="btn-share" data-act="share">Compartir</button>';

  card.innerHTML = html;
  card.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.act;
      if (a === 'cal-liga') openUrl(`${BASE}/tournament/${data.leagueId}/calendar`);
      else if (a === 'rank-liga') openUrl(`${BASE}/tournament/${data.leagueId}/ranking`);
      else if (a === 'cal-copa') openUrl(`${BASE}/tournament/${data.cupId}/calendar`);
      else if (a === 'rank-copa') openUrl(`${BASE}/tournament/${data.cupId}/ranking`);
      else if (a === 'share') shareText('CD Kolbe — ' + data.team, `Sigo al ${data.team} (${data.sport} ${data.category})`, URLS.home);
    });
  });
}

// === Wizard ===
let wizardState = { step: 1, sport: null, category: null };

function openWizard() {
  wizardState = { step: 1, sport: null, category: null };
  document.getElementById('teamModal').hidden = false;
  renderWizard();
}
function closeWizard() { document.getElementById('teamModal').hidden = true; }
function wizardBack() { if (wizardState.step > 1) { wizardState.step--; renderWizard(); } }

function renderWizard() {
  const body = document.getElementById('wizardBody');
  const title = document.getElementById('wizardTitle');
  const back = document.getElementById('wizardBack');
  if (!body || !title || !back) return;
  back.hidden = wizardState.step === 1;

  if (wizardState.step === 1) {
    title.textContent = 'Elige competición';
    let html = '<p class="wizard-help">¿En qué deporte juega?</p><div class="wizard-grid">';
    COMPETITIONS.forEach(c => {
      html += `<button class="wizard-card" data-sport="${c.id}"><div class="wizard-card-icon">${c.short}</div><span>${escapeHtml(c.name)}</span></button>`;
    });
    html += '</div>';
    body.innerHTML = html;
    body.querySelectorAll('[data-sport]').forEach(btn => {
      btn.addEventListener('click', () => {
        wizardState.sport = COMPETITIONS.find(c => c.id === btn.dataset.sport);
        wizardState.step = 2;
        renderWizard();
      });
    });
  } else if (wizardState.step === 2) {
    title.textContent = wizardState.sport.name + ' — Categoría';
    let html = '<p class="wizard-help">¿En qué categoría?</p><ul class="wizard-list">';
    wizardState.sport.categories.forEach(c => {
      const teamCount = (TEAMS_BY_TOURNAMENT[c.leagueId] || []).length;
      const hint = teamCount ? `<span class="cat-count">${teamCount} equipos</span>` : '';
      html += `<li data-cat="${c.id}"><span>${escapeHtml(c.name)}</span>${hint}<span class="chev">›</span></li>`;
    });
    html += '</ul>';
    body.innerHTML = html;
    body.querySelectorAll('[data-cat]').forEach(li => {
      li.addEventListener('click', () => {
        wizardState.category = wizardState.sport.categories.find(c => c.id === li.dataset.cat);
        wizardState.step = 3;
        renderWizard();
      });
    });
  } else if (wizardState.step === 3) {
    const teams = TEAMS_BY_TOURNAMENT[wizardState.category.leagueId] || [];
    title.textContent = wizardState.category.name + ' — Equipo';
    body.innerHTML =
      '<p class="wizard-help">Elige tu equipo. Si no aparece, ábrelo en el portal con el botón de abajo.</p>' +
      (teams.length > 8 ? '<input type="search" id="teamSearch" placeholder="Buscar equipo..." />' : '') +
      '<ul class="wizard-list" id="teamList"></ul>' +
      '<button class="btn-secondary wizard-fallback" id="btnSearchPortal">Buscar en el portal del CDK</button>';

    function renderList(filter) {
      const list = document.getElementById('teamList');
      const f = (filter || '').trim().toLowerCase();
      const filtered = f ? teams.filter(t => t.toLowerCase().includes(f)) : teams;
      list.innerHTML = filtered.length
        ? filtered.map(t => `<li data-team="${escapeHtml(t)}"><span>${escapeHtml(t)}</span></li>`).join('')
        : '<li class="muted">Sin coincidencias</li>';
      list.querySelectorAll('[data-team]').forEach(li => {
        li.addEventListener('click', () => selectTeam(li.dataset.team));
      });
    }
    renderList('');
    const search = document.getElementById('teamSearch');
    if (search) search.addEventListener('input', e => renderList(e.target.value));
    document.getElementById('btnSearchPortal').addEventListener('click', () => {
      openUrl(`${BASE}/tournament/${wizardState.category.leagueId}/ranking`);
      closeWizard();
    });
  }
}

async function selectTeam(team) {
  const data = {
    sport: wizardState.sport.name,
    category: wizardState.category.name,
    leagueId: wizardState.category.leagueId,
    cupId: wizardState.category.cupId || null,
    team,
  };
  await setStored(STORAGE_KEY, JSON.stringify(data));
  renderMyTeam(data);
  closeWizard();
}

// === Bindings globales ===
function bindGlobalHandlers() {
  document.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const a = el.dataset.action;
      if (a === 'competitions') openUrl(URLS.competitions);
      else if (a === 'calendar') openUrl(URLS.calendar);
      else if (a === 'standings') openUrl(URLS.competitions);
      else if (a === 'news') openUrl(URLS.news);
      else if (a === 'campus') openUrl(URLS.campus);
      else if (a === 'info') openUrl(URLS.info);
      else if (a === 'open-fb') openUrl(URLS.facebook);
      else if (a === 'open-ig') openUrl(URLS.instagram);
      else if (a === 'open-web') openUrl(URLS.web);
    });
  });
  document.getElementById('btnChangeTeam').addEventListener('click', openWizard);
  document.getElementById('btnRefresh').addEventListener('click', async () => {
    const btn = document.getElementById('btnRefresh');
    btn.classList.add('refreshing');
    await init();
    setTimeout(() => btn.classList.remove('refreshing'), 700);
  });
  document.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeWizard));
  document.getElementById('wizardBack').addEventListener('click', wizardBack);
}

async function initNetworkBanner() {
  const banner = document.getElementById('offlineBanner');
  const update = c => { banner.hidden = c; };
  if (Network) {
    const s = await Network.getStatus();
    update(s.connected);
    Network.addListener('networkStatusChange', s => update(s.connected));
  } else {
    update(navigator.onLine);
    window.addEventListener('online', () => update(true));
    window.addEventListener('offline', () => update(false));
  }
}

async function initPushNotifications() {
  if (!PushNotifications) return;
  try {
    const perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt') {
      const req = await PushNotifications.requestPermissions();
      if (req.receive !== 'granted') return;
    } else if (perm.receive !== 'granted') return;
    await PushNotifications.register();
  } catch (e) {}
}

function initBackButton() {
  if (App) {
    App.addListener('backButton', () => {
      if (!document.getElementById('teamModal').hidden) {
        if (wizardState.step > 1) wizardBack();
        else closeWizard();
      } else App.exitApp();
    });
  }
}

async function init() {
  const stored = await getStored(STORAGE_KEY);
  renderMyTeam(stored ? JSON.parse(stored) : null);
}

(async function main() {
  await loadCapacitorPlugins();
  bindGlobalHandlers();
  await init();
  await initNetworkBanner();
  await initPushNotifications();
  initBackButton();
  if (StatusBar) { try { await StatusBar.setBackgroundColor({ color: '#0BAB00' }); } catch (e) {} }
  console.log('[CDK] App v1.2.0 lista');
})();
