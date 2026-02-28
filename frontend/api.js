const API_BASE = 'http://localhost:8080';

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
  return { PENDING:'待审核', ADMIN_APPROVED:'待发布者审核', CLAIM_ADMIN_REVIEW:'管理员审核申请中', CLAIM_OWNER_REVIEW:'发布人审核申请中', CLAIM_ADMIN_REVIEWING:'管理员审核申请中', CLAIM_PUBLISHER_REVIEWING:'发布人审核申请中', APPROVED:'未匹配', REJECTED:'已驳回', MATCHED:'已匹配',
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

function uiDialog(options = {}) {
  const {
    title = '提示',
    message = '',
    mode = 'alert',
    confirmText = '确认',
    cancelText = '取消',
    placeholder = '',
    defaultValue = '',
    required = false
  } = options;

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.background = 'rgba(15,23,42,0.08)';
    overlay.style.zIndex = '2200';

    const inputHtml = mode === 'prompt'
      ? `<textarea id="uiDialogInput" style="width:100%;min-height:96px;padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:var(--bg-color);color:var(--text-main);font-size:14px;resize:vertical;box-sizing:border-box;outline:none">${esc(defaultValue)}</textarea>`
      : '';

    const cancelBtnHtml = mode === 'alert'
      ? ''
      : `<button class="btn-outline" id="uiDialogCancel" style="padding:10px 24px;border-radius:10px">${esc(cancelText)}</button>`;

    overlay.innerHTML = `
      <div class="modal-box" style="min-width:min(520px,92vw);max-width:92vw;padding:28px 28px 22px;">
        <h3 style="margin-bottom:14px">${esc(title)}</h3>
        <div style="font-size:15px;line-height:1.7;color:var(--text-main);margin-bottom:${mode === 'prompt' ? '12px' : '20px'};white-space:pre-wrap">${esc(message)}</div>
        ${inputHtml}
        <div id="uiDialogError" style="min-height:18px;color:var(--danger);font-size:13px;margin-top:8px"></div>
        <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:18px">
          ${cancelBtnHtml}
          <button class="btn-primary" id="uiDialogConfirm" style="padding:10px 24px;border-radius:10px">${esc(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    };

    const rejectWith = (value) => {
      cleanup();
      resolve(value);
    };

    const confirmBtn = overlay.querySelector('#uiDialogConfirm');
    const cancelBtn = overlay.querySelector('#uiDialogCancel');
    const errEl = overlay.querySelector('#uiDialogError');
    const inputEl = overlay.querySelector('#uiDialogInput');

    if (inputEl) {
      inputEl.placeholder = placeholder || '';
      setTimeout(() => inputEl.focus(), 0);
    }

    if (cancelBtn) {
      cancelBtn.onclick = () => rejectWith(mode === 'prompt' ? null : false);
    }

    confirmBtn.onclick = () => {
      if (mode === 'alert') return rejectWith(true);
      if (mode === 'confirm') return rejectWith(true);
      const val = (inputEl?.value || '').trim();
      if (required && !val) {
        if (errEl) errEl.textContent = '请输入内容';
        return;
      }
      rejectWith(val);
    };

    overlay.onclick = (e) => {
      if (e.target !== overlay) return;
      if (mode === 'alert') rejectWith(true);
      else rejectWith(mode === 'prompt' ? null : false);
    };
  });
}

function uiAlert(message, title = '提示') {
  return uiDialog({ mode: 'alert', title, message, confirmText: '确认' });
}

function uiConfirm(message, title = '确认操作') {
  return uiDialog({ mode: 'confirm', title, message, confirmText: '确认', cancelText: '取消' });
}

function uiPrompt(message, title = '请输入', options = {}) {
  return uiDialog({
    mode: 'prompt',
    title,
    message,
    confirmText: options.confirmText || '确认',
    cancelText: options.cancelText || '取消',
    placeholder: options.placeholder || '',
    defaultValue: options.defaultValue || '',
    required: !!options.required
  });
}
