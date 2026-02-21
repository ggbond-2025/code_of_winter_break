const API_BASE = 'http://a6da8e29.natappfree.cc';

const Auth = {
  getToken()    { return localStorage.getItem('lf_token') || ''; },
  getUser()     { return localStorage.getItem('lf_user')  || ''; },
  getUserId()   { return localStorage.getItem('lf_uid')   || ''; },
  getRole()     { return localStorage.getItem('lf_role')  || 'USER'; },
  getRegion()   { return localStorage.getItem('lf_region') || ''; },
  isFirst()     { return localStorage.getItem('lf_first') === 'true'; },
  isLoggedIn()  { return !!this.getToken(); },
  save(data) {
    localStorage.setItem('lf_token', data.token);
    localStorage.setItem('lf_user',  data.username);
    localStorage.setItem('lf_uid',   data.userId);
    localStorage.setItem('lf_role',  data.role);
    localStorage.setItem('lf_region', data.region || '');
    localStorage.setItem('lf_first', data.firstLogin);
  },
  clearFirst() { localStorage.setItem('lf_first', 'false'); },
  clear() {
    ['lf_token','lf_user','lf_uid','lf_role','lf_region','lf_first'].forEach(k => localStorage.removeItem(k));
  }
};

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = Auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (res.status === 401) {
    Auth.clear();
    Router.go('login');
    throw new Error(data.message || '请先登录');
  }
  if (!res.ok || data.success === false) {
    throw new Error(data.message || '请求失败');
  }
  return data;
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

let _configCache = null;
async function getConfig() {
  if (_configCache) return _configCache;
  const data = await api('/api/config');
  _configCache = data.data || {};
  return _configCache;
}
function parseCategories(raw) {
  return (raw || '').split(/[,，;]/).map(s => s.trim()).filter(Boolean);
}
async function fillCategorySelect(selectId, includeAll = true) {
  const el = typeof selectId === 'string' ? document.getElementById(selectId) : selectId;
  if (!el) return;
  const cfg = await getConfig();
  const cats = parseCategories(cfg.categories || '');
  const options = (includeAll ? '<option value="">所有</option>' : '') + cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  if (options) el.innerHTML = options;
}

function statusLabel(s) {
  return { PENDING:'待审核', ADMIN_APPROVED:'待发布者审核', APPROVED:'未匹配', REJECTED:'已驳回', MATCHED:'已匹配',
           CLAIMED:'已认领', ARCHIVED:'已归档', CANCELLED:'已取消', ADMIN_DELETED:'管理员删除',
           LOST:'遗失', FOUND:'拾到' }[s] || s;
}
function claimStatusLabel(s) {
  return { PENDING:'待管理员审核', ADMIN_APPROVED:'待发布者审核', APPROVED:'已通过', REJECTED:'已驳回' }[s] || s;
}

function statusClass(s) {
  return { PENDING:'pending', APPROVED:'approved', REJECTED:'rejected',
           CLAIMED:'claimed', ARCHIVED:'archived', CANCELLED:'cancelled',
           LOST:'lost', FOUND:'found' }[s] || '';
}

function imgUrl(path) {
  if (!path) return '';
  path = path.trim();
  if (path.startsWith('http')) return path;
  return API_BASE + path;
}

function imgTag(url, w, h) {
  w = w || 100; h = h || 80;
  return `<img src="${imgUrl(url)}" style="width:${w}px;height:${h}px;object-fit:cover;border:1px solid #ddd;background:#f0f0f0" onerror="this.style.display='none'" />`;
}

function fmtTime(str) {
  if (!str) return '-';
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate()
      + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  } catch (_) { return str; }
}
