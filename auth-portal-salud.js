/**
 * Auth demo unificado — Numia Salud
 * Valida credenciales contra la API de DebMedia.
 * Registra accesos en Google Sheets — hoja "Salud".
 * Solo apto para demos estáticas, no seguridad real.
 */
(function (global) {

  var STORAGE_KEY    = 'numiaPortalSaludAuth';
  var SESSION_MAX_MS = 12 * 60 * 60 * 1000;
  var AUTH_API_URL   = 'https://debq2.debmedia.com/api/authenticate';
  var SHEET_URL      = 'https://script.google.com/macros/s/AKfycbxJ8QAIZtZUD88k_4L00dhsukOCvgbXT0-rpbGLsMeAyRXeIrDlam4uN7PA0VSAP0D6/exec';

  var ADMIN_EMAIL    = 'jmacera.root@numia.co';
  var ADMIN_PASSWORD = 'Registros$2026';
  var ADMIN_KEY      = 'numiaAdminSaludAuth';

  /* ── Sesión de usuario ── */

  function readState() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || typeof o.t !== 'number') return null;
      if (Date.now() - o.t > SESSION_MAX_MS) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return o;
    } catch (e) { return null; }
  }

  function isAuthenticated() { return !!readState(); }

  function login(email, password) {
    return fetch(AUTH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
    .then(function (res) {
      if (res.ok) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ t: Date.now(), email: email }));
        return recordAccess(email).then(function () { return true; });
      }
      return false;
    })
    .catch(function () { return false; });
  }

  function logout() { sessionStorage.removeItem(STORAGE_KEY); }

  /* ── Registro → hoja Salud ── */

  function recordAccess(email) {
    return fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ email: email, action: 'login', ts: new Date().toISOString(), source: 'salud' }),
      mode: 'no-cors'
    }).catch(function () {});
  }

  /* ── Admin session ── */

  function adminLogin(email, password) {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_KEY, '1');
      return true;
    }
    return false;
  }

  function isAdminAuthenticated() { return sessionStorage.getItem(ADMIN_KEY) === '1'; }
  function adminLogout() { sessionStorage.removeItem(ADMIN_KEY); }

  function requireAdmin() {
    if (!isAdminAuthenticated()) global.location.replace('admin-login-salud.html');
  }

  /* ── Helpers ── */

  function safeNextUrl(next) {
    if (!next || typeof next !== 'string') return 'index.html';
    try {
      var u = new URL(next, global.location.href);
      if (u.origin !== global.location.origin) return 'index.html';
      return u.pathname + u.search + u.hash;
    } catch (e) { return 'index.html'; }
  }

  function require() {
    if (!isAuthenticated()) {
      var next = encodeURIComponent(global.location.pathname + global.location.search + global.location.hash);
      global.location.replace('login-salud.html?next=' + next);
    }
  }

  global.AuthPortal = {
    isAuthenticated:      isAuthenticated,
    login:                login,
    logout:               logout,
    require:              require,
    safeNextUrl:          safeNextUrl,
    adminLogin:           adminLogin,
    isAdminAuthenticated: isAdminAuthenticated,
    adminLogout:          adminLogout,
    requireAdmin:         requireAdmin
  };

})(typeof window !== 'undefined' ? window : globalThis);
