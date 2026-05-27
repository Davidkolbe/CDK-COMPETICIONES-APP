/**
 * CDK Competiciones — App shell
 *
 * Hub del Club Deportivo Kolbe. Pantalla de inicio nativa que abre la web
 * del CDK con el plugin Browser para experiencia in-app.
 *
 * Esta version (1.1.0) anade modal jerarquico Deporte > Categoria > Equipo.
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
  } catch (e) {
    console.warn('[CDK] No se cargaron plugins:', e);
    return false;
  }
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
 * Estructura jerarquica del portal del CDK temporada 2025-2026.
 * Cada categoria tiene leagueId (Liga regular) y opcionalmente cupId (Copa).
 * Los IDs son los reales de Clupik/Leverade.
 */
const COMPETITIONS = [
  {
    id: 'f7',
    name: 'Fútbol 7',
    short: 'F7',
    icon: 'soccer',
    categories: [
      { id: 'f7-pre', name: 'Prebenjamín', leagueId: '1322341', cupId: '1322356' },
      { id: 'f7-ben', name: 'Benjamín', leagueId: '1322342', cupId: '1322357' },
      { id: 'f7-ale', name: 'Alevín', leagueId: '1322343', cupId: '1322358' },
      { id: 'f7-inf', name: 'Infantil', leagueId: '1322344', cupId: '1322359' },
      { id: 'f7-cad', name: 'Cadete/Juvenil', leagueId: '1322345', cupId: '1322361' },
    ],
  },
  {
    id: 'fs',
    name: 'Fútbol Sala',
    short: 'FS',
    icon: 'futsal',
    categories: [
      { id: 'fs-pre', name: 'Prebenjamín', leagueId: '1322350' },
      { id: 'fs-ben', name: 'Benjamín', leagueId: '1322351' },
      { id: 'fs-ale', name: 'Alevín', leagueId: '1322352' },
    ],
  },
  {
    id: 'vb',
    name: 'Voleibol',
    short: 'VB',
    icon: 'volleyball',
    categories: [
      { id: 'vb-ben', name: 'Benjamín', leagueId: '1322346' },
      { id: 'vb-ale', name: 'Alevín', leagueId: '1322347', cupId: '1322353' },
      { id: 'vb-inf', name: 'Infantil', leagueId: '1322348', cupId: '1322354' },
      { id: 'vb-cad', name: 'Cadete', leagueId: '1324509', cupId: '1322355' },
      { id: 'vb-juv', name: 'Juvenil', leagueId: '1322349', cupId: '1334008' },
    ],
  },
];

/**
 * Lista provisional de equipos por club. Cubre los clubes habituales del
 * Area 16 organizados por el CDK. En Fase 2 esta lista se cargara dinamica
 * desde la API de Leverade por torneo concreto.
 *
 * Si el equipo del usuario no esta aqui, puede usar "Buscar en el portal"
 * que abre el ranking del torneo donde aparecen todos.
 */
const TEAMS_BY_CLUB = [
  // CDK propios
  'CD KOLBE BLANCO', 'CD KOLBE VERDE', 'CD KOLBE A', 'CD KOLBE B', 'CD KOLBE',
  // Villanueva del Pardillo
  'UNION PARDILLO', 'MASERAL PARDILLO', 'PYD SORIANO PARDILLO', 'BULLDOGS PARDILLO', 'HELADE PARDILLO',
  // Villanueva de la Canada
  'BOLICHES VVA. CANADA', 'ENCINAS VVA. CANADA', 'GARRALDA VVA. CANADA',
  // Otros del Area 16
  'CD ARENALES ARROYOMOLINOS', 'CD VALLMONT A', 'CD VALLMONT B',
  'COLEGIO ZOLA A', 'COLEGIO ZOLA B', 'COLEGIO HIGHLANDS LOS FRESNOS',
  'COLEGIO CEU MONTEPRINCIPE', 'RAYO ZARZALEJO',
  'EVEREST POZUELO', 'QUERCUS BOADILLA', 'SEK VILLAFRANCA',
];

const STORAGE_KEY = 'cdk.myTeam.v2';

async function getStored(key) {
  if (Preferences) { const { value } = await Preferences.get({ key }); return value; }
  return localStorage.getItem(key);
}
async function setStored(key, value) {
  if (Preferences) return Preferences.set({ key, value });
  localStorage.setItem(key, value);
}

async function openUrl(url) {
  if (Browser) {
    await Browser.open({ url, windowName: '_self', presentationStyle: 'popover', toolbarColor: '#0BAB00' });
  } else {
    window.open(url, '_blank');
  }
}

async function shareText(title, text, url) {
  if (Share) { try { await Share.share({ title, text, url, dialogTitle: 'Compartir' }); } catch (e) {} }
  else if (navigator.share) navigator.share({ title, text, url }).catch(() => {});
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// === Mi equipo (render) ===
function renderMyTeam(data) {
  const card = document.getElementById('myTeamCard');
  if (!data || !data.team) {
    card.innerHTML = `
      <div class="empty-state">
        <p>Aun no has elegido tu equipo</p>
        <button class="btn-primary" id="btnSelectTeam">Elegir mi equipo</button>
      </div>`;
    document.getElementById('btnSelectTeam').addEventListener('click', () => openWizard());
    return;
  }
  card.innerHTML = `
    <div class="team-active">
      <div class="logo-shield" style="background:var(--color-primary);color:white;font-size:20px;">
        ${escapeHtml(data.team.charAt(0))}
      </div>
      <div class="team-active-info">
        <h3>${escapeHtml(data.team)}</h3>
        <div class="team-competition">${escapeHtml(data.sport)} · ${escapeHtml(data.category)}</div>
      </div>
    </div>
    <div class="team-active-actions">
      <button class="team-action" data-team-action="calendar">Calendario</button>
      <button class="team-action" data-team-action="standings">Clasificación</button>
      <button class="team-action" data-team-action="share">Compartir</button>
    </div>`;
  card.querySelectorAll('[data-team-action]').forEach(btn => {
    btn.addEventListener('click', () => handleTeamAction(btn.dataset.teamAction, data));
  });
}

async function handleTeamAction(action, data) {
  const tournamentId = data.leagueId || data.cupId;
  if (action === 'calendar') openUrl(`${BASE}/tournament/${tournamentId}/calendar`);
  else if (action === 'standings') openUrl(`${BASE}/tournament/${tournamentId}/ranking`);
  else if (action === 'share') shareText(
    'CD Kolbe — ' + data.team,
    `Sigo al ${data.team} (${data.sport} ${data.category}) en CD Kolbe Competiciones`,
    URLS.home
  );
}

// === Wizard "Elegir equipo" (3 pasos) ===
let wizardState = { step: 1, sport: null, category: null, team: null };

function openWizard() {
  wizardState = { step: 1, sport: null, category: null, team: null };
  document.getElementById('teamModal').hidden = false;
  renderWizard();
}
function closeWizard() {
  document.getElementById('teamModal').hidden = true;
}

function renderWizard() {
  const body = document.getElementById('wizardBody');
  const title = document.getElementById('wizardTitle');
  const back = document.getElementById('wizardBack');
  back.hidden = wizardState.step === 1;

  if (wizardState.step === 1) {
    title.textContent = 'Elige competición';
    body.innerHTML = `
      <p class="wizard-help">¿En qué deporte juega?</p>
      <div class="wizard-grid">
        ${COMPETITIONS.map(c => `
          <button class="wizard-card" data-sport="${c.id}">
            <div class="wizard-card-icon">${c.short}</div>
            <span>${escapeHtml(c.name)}</span>
          </button>
        `).join('')}
      </div>`;
    body.querySelectorAll('[data-sport]').forEach(btn => {
      btn.addEventListener('click', () => {
        wizardState.sport = COMPETITIONS.find(c => c.id === btn.dataset.sport);
        wizardState.step = 2;
        renderWizard();
      });
    });
  } else if (wizardState.step === 2) {
    title.textContent = wizardState.sport.name + ' — Categoría';
    body.innerHTML = `
      <p class="wizard-help">¿En qué categoría?</p>
      <ul class="wizard-list">
        ${wizardState.sport.categories.map(cat => `
          <li data-cat="${cat.id}"><span>${escapeHtml(cat.name)}</span><span class="chev">›</span></li>
        `).join('')}
      </ul>`;
    body.querySelectorAll('[data-cat]').forEach(li => {
      li.addEventListener('click', () => {
        wizardState.category = wizardState.sport.categories.find(c => c.id === li.dataset.cat);
        wizardState.step = 3;
        renderWizard();
      });
    });
  } else if (wizardState.step === 3) {
    title.textContent = wizardState.category.name + ' — Equipo';
    body.innerHTML = `
      <p class="wizard-help">Elige tu equipo. Si no lo encuentras, toca el botón inferior para verlo en el portal.</p>
      <input type="search" id="teamSearch" placeholder="Buscar equipo..." autofocus />
      <ul class="wizard-list" id="teamList"></ul>
      <button class="btn-secondary wizard-fallback" id="btnSearchPortal">
        Buscar en el portal del CDK
      </button>`;
    const renderList = (filter) => {
      const list = document.getElementById('teamList');
      const f = (filter || '').trim().toLowerCase();
      const filtered = f ? TEAMS_BY_CLUB.filter(t => t.toLowerCase().includes(f)) : TEAMS_BY_CLUB;
      list.innerHTML = filtered.length
        ? filtered.map(t => `<li data-team="${escapeHtml(t)}"><span>${escapeHtml(t)}</span></li>`).join('')
        : '<li class="muted">Sin coincidencias</li>';
      list.querySelectorAll('[data-team]').forEach(li => {
        li.addEventListener('click', () => selectTeam(li.dataset.team));
      });
    };
    renderList('');
    document.getElementById('teamSearch').addEventListener('input', e => renderList(e.target.value));
    document.getElementById('btnSearchPortal').addEventListener('click', () => {
      const tid = wizardState.category.leagueId;
      openUrl(`${BASE}/tournament/${tid}/ranking`);
      closeWizard();
    });
  }
}

async function selectTeam(teamName) {
  const data = {
    sport: wizardState.sport.name,
    category: wizardState.category.name,
    leagueId: wizardState.category.leagueId,
    cupId: wizardState.category.cupId,
    team: teamName,
  };
  await setStored(STORAGE_KEY, JSON.stringify(data));
  renderMyTeam(data);
  closeWizard();
}

function wizardBack() {
  if (wizardState.step > 1) {
    wizardState.step--;
    renderWizard();
  }
}

// === Handlers generales ===
function bindGlobalHandlers() {
  document.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const a = el.dataset.action;
      if (URLS[a]) openUrl(URLS[a]);
      else if (a === 'open-fb') openUrl(URLS.facebook);
      else if (a === 'open-ig') openUrl(URLS.instagram);
      else if (a === 'open-web') openUrl(URLS.web);
      else if (a === 'competitions') openUrl(URLS.competitions);
      else if (a === 'standings') openUrl(URLS.competitions);
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

// === Conectividad y push ===
async function initNetworkBanner() {
  const banner = document.getElementById('offlineBanner');
  const update = (c) => { banner.hidden = c; };
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
    PushNotifications.addListener('registration', t => console.log('[CDK] Push token:', t.value));
    PushNotifications.addListener('pushNotificationActionPerformed', a => {
      if (a.notification.data?.url) openUrl(a.notification.data.url);
    });
  } catch (e) { console.warn('[CDK] Push init error:', e); }
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
  console.log('[CDK] App lista — v1.1.0');
})();
