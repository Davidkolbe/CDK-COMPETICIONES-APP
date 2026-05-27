/**
 * CDK Competiciones — App shell
 *
 * Hub del Club Deportivo Kolbe. Esta es la pantalla de inicio nativa.
 * Las secciones de datos en vivo (calendario, resultados, etc.) las
 * abrimos en la web del CDK via plugin Browser de Capacitor, que ofrece
 * una experiencia tipo "in-app browser" nativa con barra de cierre.
 */

// Imports dinamicos para que la app shell funcione tambien fuera de Capacitor
let Browser, Share, Network, PushNotifications, Preferences, App, StatusBar;

async function loadCapacitorPlugins() {
  try {
    const cap = await import('@capacitor/core');
    if (!cap.Capacitor.isNativePlatform()) {
      console.log('[CDK] Modo navegador — plugins Capacitor desactivados');
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
    console.warn('[CDK] No se cargaron plugins Capacitor:', e);
    return false;
  }
}

// URLs del portal Clupik del CDK
const URLS = {
  home: 'https://competiciones.clubdeportivokolbe.com/es/',
  competitions: 'https://competiciones.clubdeportivokolbe.com/es/tournaments',
  calendar: 'https://competiciones.clubdeportivokolbe.com/es/activities',
  standings: 'https://competiciones.clubdeportivokolbe.com/es/tournaments',
  news: 'https://competiciones.clubdeportivokolbe.com/es/posts',
  campus: 'https://competiciones.clubdeportivokolbe.com/es/section/campus-verano',
  info: 'https://competiciones.clubdeportivokolbe.com/es/information',
  facebook: 'https://www.facebook.com/cdkolbe',
  instagram: 'https://www.instagram.com/clubdeportivokolbe',
  web: 'https://competiciones.clubdeportivokolbe.com/es/',
};

// Lista de equipos extraida del calendario actual del CDK
// (en una v2 se cargaria dinamicamente desde el API publico del Clupik)
const TEAMS = [
  { name: 'CD KOLBE BLANCO', competition: 'Liga / Copa CDK' },
  { name: 'CD KOLBE VERDE', competition: 'Liga / Copa CDK' },
  { name: 'CD KOLBE A', competition: 'Liga / Copa CDK' },
  { name: 'CD KOLBE B', competition: 'Liga / Copa CDK' },
  { name: 'CD ARENALES ARROYOMOLINOS', competition: 'Liga / Copa CDK' },
  { name: 'CD VALLMONT A', competition: 'Liga / Copa CDK' },
  { name: 'CD VALLMONT B', competition: 'Liga / Copa CDK' },
  { name: 'COLEGIO ZOLA A', competition: 'Liga / Copa CDK' },
  { name: 'COLEGIO ZOLA B', competition: 'Liga / Copa CDK' },
  { name: 'COLEGIO HIGHLANDS LOS FRESNOS', competition: 'Liga / Copa CDK' },
  { name: 'COLEGIO CEU MONTEPRINCIPE', competition: 'Liga / Copa CDK' },
  { name: 'RAYO ZARZALEJO', competition: 'Liga / Copa CDK' },
  { name: 'UNION PARDILLO', competition: 'Liga / Copa CDK' },
  { name: 'EVEREST POZUELO', competition: 'Liga / Copa CDK' },
  { name: 'QUERCUS BOADILLA', competition: 'Liga / Copa CDK' },
  { name: 'SEK VILLAFRANCA', competition: 'Liga / Copa CDK' },
  { name: 'BOLICHES VVA. CANADA', competition: 'Liga / Copa CDK' },
  { name: 'ENCINAS VVA. CANADA', competition: 'Liga / Copa CDK' },
  { name: 'GARRALDA VVA. CANADA', competition: 'Liga / Copa CDK' },
  { name: 'MASERAL PARDILLO', competition: 'Liga / Copa CDK' },
  { name: 'PYD SORIANO PARDILLO', competition: 'Liga / Copa CDK' },
  { name: 'BULLDOGS PARDILLO', competition: 'Liga / Copa CDK' },
  { name: 'HELADE PARDILLO', competition: 'Liga / Copa CDK' },
];

const STORAGE_KEY = 'cdk.myTeam';

// Preferencias: usa Capacitor en nativo, localStorage en web
async function getStored(key) {
  if (Preferences) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

async function setStored(key, value) {
  if (Preferences) {
    return Preferences.set({ key, value });
  }
  localStorage.setItem(key, value);
}

// Abrir URL: en nativo usa Browser plugin (in-app), en web abre pestana
async function openUrl(url) {
  if (Browser) {
    await Browser.open({
      url,
      windowName: '_self',
      presentationStyle: 'popover',
      toolbarColor: '#0BAB00',
    });
  } else {
    window.open(url, '_blank');
  }
}

async function shareText(title, text, url) {
  if (Share) {
    try {
      await Share.share({ title, text, url, dialogTitle: 'Compartir' });
    } catch (e) {
      console.log('[CDK] Share cancelado:', e);
    }
  } else if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  }
}

// MI EQUIPO — render
function renderMyTeam(team) {
  const card = document.getElementById('myTeamCard');
  if (!team) {
    card.innerHTML = `
      <div class="empty-state">
        <p>Aun no has elegido tu equipo</p>
        <button class="btn-primary" id="btnSelectTeam">Elegir mi equipo</button>
      </div>`;
    document.getElementById('btnSelectTeam').addEventListener('click', openTeamModal);
    return;
  }
  card.innerHTML = `
    <div class="team-active">
      <div class="logo-shield" style="background:var(--color-primary);color:white;font-size:20px;">
        ${team.name.charAt(0)}
      </div>
      <div class="team-active-info">
        <h3>${escapeHtml(team.name)}</h3>
        <div class="team-competition">${escapeHtml(team.competition)}</div>
      </div>
    </div>
    <div class="team-active-actions">
      <button class="team-action" data-team-action="calendar">Calendario</button>
      <button class="team-action" data-team-action="standings">Clasificacion</button>
      <button class="team-action" data-team-action="share">Compartir</button>
    </div>`;
  card.querySelectorAll('[data-team-action]').forEach((btn) => {
    btn.addEventListener('click', () => handleTeamAction(btn.dataset.teamAction, team));
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

async function handleTeamAction(action, team) {
  const q = encodeURIComponent(team.name);
  if (action === 'calendar') openUrl(URLS.calendar + '?search=' + q);
  else if (action === 'standings') openUrl(URLS.standings + '?search=' + q);
  else if (action === 'share') shareText(
    'CD Kolbe — ' + team.name,
    'Sigue al ' + team.name + ' en las competiciones del CD Kolbe',
    URLS.home
  );
}

// MODAL EQUIPOS
function openTeamModal() {
  const modal = document.getElementById('teamModal');
  modal.hidden = false;
  renderTeamList('');
  document.getElementById('teamSearch').focus();
}

function closeTeamModal() {
  document.getElementById('teamModal').hidden = true;
}

function renderTeamList(filter) {
  const list = document.getElementById('teamList');
  const f = filter.trim().toLowerCase();
  const filtered = f
    ? TEAMS.filter((t) => t.name.toLowerCase().includes(f))
    : TEAMS;
  list.innerHTML = filtered.length
    ? filtered.map((t) => `<li data-team="${escapeHtml(t.name)}">${escapeHtml(t.name)}</li>`).join('')
    : '<li style="color:var(--color-text-muted);text-align:center;">Sin resultados</li>';
  list.querySelectorAll('li[data-team]').forEach((li) => {
    li.addEventListener('click', async () => {
      const team = TEAMS.find((t) => t.name === li.dataset.team);
      await setStored(STORAGE_KEY, JSON.stringify(team));
      renderMyTeam(team);
      closeTeamModal();
    });
  });
}

// HANDLERS GENERALES
function bindGlobalHandlers() {
  // Tarjetas accion rapida
  document.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const action = el.dataset.action;
      if (action === 'competitions') openUrl(URLS.competitions);
      else if (action === 'calendar') openUrl(URLS.calendar);
      else if (action === 'standings') openUrl(URLS.standings);
      else if (action === 'news') openUrl(URLS.news);
      else if (action === 'campus') openUrl(URLS.campus);
      else if (action === 'info') openUrl(URLS.info);
      else if (action === 'open-fb') openUrl(URLS.facebook);
      else if (action === 'open-ig') openUrl(URLS.instagram);
      else if (action === 'open-web') openUrl(URLS.web);
    });
  });

  // Cambiar equipo
  document.getElementById('btnChangeTeam').addEventListener('click', openTeamModal);

  // Refresh
  document.getElementById('btnRefresh').addEventListener('click', async () => {
    const btn = document.getElementById('btnRefresh');
    btn.classList.add('refreshing');
    await init();
    setTimeout(() => btn.classList.remove('refreshing'), 700);
  });

  // Cerrar modal
  document.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeTeamModal);
  });

  // Busqueda equipos
  document.getElementById('teamSearch').addEventListener('input', (e) => {
    renderTeamList(e.target.value);
  });
}

// CONECTIVIDAD
async function initNetworkBanner() {
  const banner = document.getElementById('offlineBanner');
  const update = (connected) => { banner.hidden = connected; };
  if (Network) {
    const status = await Network.getStatus();
    update(status.connected);
    Network.addListener('networkStatusChange', (s) => update(s.connected));
  } else {
    update(navigator.onLine);
    window.addEventListener('online', () => update(true));
    window.addEventListener('offline', () => update(false));
  }
}

// PUSH NOTIFICATIONS — preparado, no envia. Solo registra token.
async function initPushNotifications() {
  if (!PushNotifications) return;
  try {
    const perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt') {
      const req = await PushNotifications.requestPermissions();
      if (req.receive !== 'granted') {
        console.log('[CDK] Push notifications no autorizadas');
        return;
      }
    } else if (perm.receive !== 'granted') {
      return;
    }
    await PushNotifications.register();
    PushNotifications.addListener('registration', (token) => {
      console.log('[CDK] Push token:', token.value);
      // TODO Fase 2: enviar el token a un servidor para poder mandar push
    });
    PushNotifications.addListener('registrationError', (err) => {
      console.warn('[CDK] Push registration error:', err);
    });
    PushNotifications.addListener('pushNotificationReceived', (n) => {
      console.log('[CDK] Push recibida:', n);
    });
    PushNotifications.addListener('pushNotificationActionPerformed', (a) => {
      console.log('[CDK] Push tocada:', a);
      // Si la notificacion trae una URL, abrirla
      if (a.notification.data && a.notification.data.url) {
        openUrl(a.notification.data.url);
      }
    });
  } catch (e) {
    console.warn('[CDK] Push init error:', e);
  }
}

// BOTON ATRAS Android
function initBackButton() {
  if (App) {
    App.addListener('backButton', () => {
      // Si hay modal abierto, cerrarlo
      if (!document.getElementById('teamModal').hidden) {
        closeTeamModal();
      } else {
        App.exitApp();
      }
    });
  }
}

// INIT
async function init() {
  const team = await getStored(STORAGE_KEY);
  renderMyTeam(team ? JSON.parse(team) : null);
}

(async function main() {
  await loadCapacitorPlugins();
  bindGlobalHandlers();
  await init();
  await initNetworkBanner();
  await initPushNotifications();
  initBackButton();
  // Status bar
  if (StatusBar) {
    try {
      await StatusBar.setBackgroundColor({ color: '#0BAB00' });
    } catch (e) { /* ios sin setBackgroundColor */ }
  }
  console.log('[CDK] App lista');
})();
