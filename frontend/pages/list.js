Router.register('home', async function (app) {
  const main = renderLayout(app, 'USER', 'home');
  main.innerHTML = `
    <h2 style="text-align:center;margin:20px 0 30px"><b>${esc(Auth.getUser())}，欢迎登录失物招领系统</b></h2>
    <h3 style="margin-bottom:16px"><b>目前进度：</b></h3>
    <div id="myPostList"></div>
    <div id="myPostPager" class="pager"></div>
  `;

  let pg = 0;
  const pageSize = 8;
  const hiddenStatuses = new Set(['APPROVED', 'CLAIMED', 'ARCHIVED']);

  async function fetchAllPages(pathBuilder) {
    let current = 0;
    let totalPages = 1;
    const all = [];
    while (current < totalPages) {
      const data = await api(pathBuilder(current, 50));
      const page = data.data || {};
      all.push(...(page.content || []));
      totalPages = page.totalPages || 1;
      current += 1;
    }
    return all;
  }

  async function load() {
    try {
      const [myItems, myApplications] = await Promise.all([
        fetchAllPages((page, size) => `/api/items/my?page=${page}&size=${size}`),
        fetchAllPages((page, size) => `/api/claims/my/applications?page=${page}&size=${size}`)
      ]);

      const ownEntries = myItems
        .filter(item => item && !hiddenStatuses.has(item.status))
        .map(item => ({
          item,
          source: 'PUBLISHED',
          sortAt: item.updatedAt || item.createdAt || ''
        }));

      const applyMap = new Map();
      for (const claim of myApplications) {
        const item = claim?.item;
        if (!item || hiddenStatuses.has(item.status) || applyMap.has(item.id)) continue;
        applyMap.set(item.id, {
          item,
          source: 'APPLIED',
          sortAt: claim.updatedAt || claim.createdAt || item.updatedAt || item.createdAt || ''
        });
      }
      const all = [...ownEntries, ...Array.from(applyMap.values())]
        .sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());

      if (all.length === 0) {
        document.getElementById('myPostList').innerHTML = '<p class="empty">暂无进度记录</p>';
        document.getElementById('myPostPager').innerHTML = '';
        return;
      }
      const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
      const from = pg * pageSize;
      const pageList = all.slice(from, from + pageSize);

      document.getElementById('myPostList').innerHTML = pageList.map(entry => {
        const item = entry.item;
        const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
        const isLost = item.type === 'LOST';
        return `
          <div class="item-card-row" data-id="${item.id}" style="cursor:pointer">
            <div class="card-left">
              <div class="item-status">目前进度：${statusLabel(item.status)}</div>
              <div class="item-info">
                <div style="color:#666">来源：${entry.source === 'PUBLISHED' ? '我发布的帖子' : '我提交申请的帖子'}</div>
                <div>物品名称：${esc(item.title || '-')}</div>
                <div>物品类型：${esc(item.category || '-')}</div>
                <div>${isLost ? '丢失' : '拾取'}地点：${esc(item.location || '-')}</div>
                <div>${isLost ? '丢失' : '拾得'}时间：${esc(item.lostTime || '-')}</div>
                <div style="color:#666">点击可查看详情及申请情况</div>
              </div>
            </div>
            <div class="card-right-wrap">
              <div class="card-images">
                ${imgs.length > 0 ? imgs.slice(0, 2).map(u => imgTag(u, 100, 80)).join('') : '<div class="img-placeholder">暂无图片</div><div class="img-placeholder">暂无图片</div>'}
              </div>
              <div class="card-time">发布时间：${fmtTime(item.createdAt)}</div>
            </div>
          </div>
        `;
      }).join('');
      document.querySelectorAll('#myPostList .item-card-row[data-id]').forEach(c => {
        c.onclick = () => {
          sessionStorage.removeItem('lf_detail_from');
          sessionStorage.removeItem('lf_detail_from_item');
          sessionStorage.removeItem('lf_claim_back_route');
          Router.go('detail', { id: c.dataset.id });
        };
      });
      renderPager(document.getElementById('myPostPager'), pg, totalPages, p => { pg = p; load(); });
    } catch (e) {
      document.getElementById('myPostList').innerHTML = '<p class="empty">暂无进度记录</p>';
      document.getElementById('myPostPager').innerHTML = '';
    }
  }
  load();
});

Router.register('search', function (app) {
  const main = renderLayout(app, 'USER', 'search');
  main.innerHTML = `
    <div class="filter-bar">
      <label>消息类型</label><select id="fType"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select>
      <label>物品类型</label><select id="fCat"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select>
      <label>地点</label><select id="fLoc"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
      <label>时间范围</label><select id="fTime"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select>
      <label>物品状态</label><select id="fStatus"><option value="">所有</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="MATCHED">已匹配</option></select>
      <label>物品名查找</label><input type="text" id="fKeyword" />
      <span class="search-icon" id="searchBtn">&#128269;</span>
    </div>
    <div id="itemList"></div>
    <div id="pager" class="pager"></div>
    <div id="reportModal" class="modal-overlay hidden">
      <div class="modal-box">
        <span class="close-btn" id="reportClose">&times;</span>
        <h3>举报信息</h3>
        <div class="modal-row"><label>举报原因</label>
          <select id="reportReason">
            <option value="违规广告">违规广告</option>
            <option value="虚假信息">虚假信息</option>
            <option value="侵权图片">侵权图片</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="modal-row"><label>具体说明</label><textarea id="reportDetail" style="width:260px;min-height:80px"></textarea></div>
        <div style="display:flex;gap:20px;justify-content:center;margin-top:20px">
          <button class="btn-outline" id="reportSubmit">提交举报</button>
          <button class="btn-outline" id="reportCancel">取消</button>
        </div>
        <p id="reportMsg" class="msg" style="text-align:center"></p>
      </div>
    </div>
  `;

  let currentPage = 0;
  fillCategorySelect('fCat');
  let reportItemId = null;
  const reportModal = document.getElementById('reportModal');
  const closeReportModal = () => {
    reportModal.classList.add('hidden');
    reportItemId = null;
  };
  document.getElementById('reportClose').onclick = closeReportModal;
  document.getElementById('reportCancel').onclick = closeReportModal;
  reportModal.addEventListener('click', function (e) { if (e.target === this) closeReportModal(); });
  document.getElementById('reportSubmit').onclick = async () => {
    try {
      const reason = document.getElementById('reportReason').value;
      const detail = document.getElementById('reportDetail').value.trim();
      await api('/api/complaints', { method: 'POST', body: JSON.stringify({ itemId: reportItemId, reason, detail }) });
      alert('举报已提交');
      closeReportModal();
    } catch (e) {
      document.getElementById('reportMsg').textContent = e.message;
      document.getElementById('reportMsg').className = 'msg msg-err';
    }
  };
  async function load() {
    const kw = document.getElementById('fKeyword').value;
    const type = document.getElementById('fType').value;
    const cat = document.getElementById('fCat').value;
    const loc = document.getElementById('fLoc').value;
    const status = document.getElementById('fStatus').value;
    const qs = `keyword=${encodeURIComponent(kw)}&type=${type}&category=${encodeURIComponent(cat)}&location=${encodeURIComponent(loc)}&status=${status}&page=${currentPage}&size=8`;
    try {
      const data = await api(`/api/items?${qs}`);
      const pg = data.data;
      const list = pg.content || [];
      document.getElementById('itemList').innerHTML = list.length === 0
        ? '<p class="empty">暂无数据</p>'
        : list.map(item => `
          <div class="item-entry">
            ${itemCardHtml(item)}
            <div class="item-actions">
              <button class="btn-sm" data-report="${item.id}">举报</button>
            </div>
          </div>
        `).join('');
      document.querySelectorAll('.item-card-row[data-id]').forEach(c => {
        c.onclick = () => {
          sessionStorage.setItem('lf_detail_from', 'search');
          sessionStorage.setItem('lf_detail_from_item', String(c.dataset.id));
          sessionStorage.setItem('lf_claim_back_route', 'search');
          Router.go('detail', { id: c.dataset.id });
        };
      });
      document.querySelectorAll('[data-report]').forEach(b => {
        b.onclick = (e) => {
          e.stopPropagation();
          reportItemId = b.dataset.report;
          document.getElementById('reportReason').value = '违规广告';
          document.getElementById('reportDetail').value = '';
          document.getElementById('reportMsg').textContent = '';
          reportModal.classList.remove('hidden');
        };
      });
      renderPager(document.getElementById('pager'), currentPage, pg.totalPages || 1, p => { currentPage = p; load(); });
    } catch (e) {
      document.getElementById('itemList').innerHTML = `<p class="empty">${e.message}</p>`;
    }
  }

  document.getElementById('searchBtn').onclick = () => { currentPage = 0; load(); };
  document.getElementById('fKeyword').onkeydown = e => { if (e.key === 'Enter') { currentPage = 0; load(); } };
  ['fType', 'fCat', 'fLoc', 'fTime', 'fStatus'].forEach(id => {
    document.getElementById(id).onchange = () => { currentPage = 0; load(); };
  });
  load();
});

Router.register('list', function (app) {
  Router.go('search');
});

Router.register('sysNotify', async function (app) {
  const main = renderLayout(app, 'USER', 'sysNotify');
  main.innerHTML = `
    <div class="filter-bar">
      <label>消息类型</label>
      <select id="nType">
        <option value="">所有</option>
        <option value="归还申请">归还申请</option>
        <option value="认领申请">认领申请</option>
        <option value="失物招领">失物招领</option>
        <option value="寻物启事">寻物启事</option>
        <option value="举报">举报</option>
      </select>
      <label>时间范围</label>
      <select id="nTime">
        <option value="">所有</option>
        <option value="7">近7天</option>
        <option value="30">近30天</option>
        <option value="90">近90天</option>
      </select>
    </div>
    <div id="sysNotifyList"></div>
  `;

  const STATUS_MAP = {
    PENDING: '待审核',
    ADMIN_APPROVED: '管理员已通过',
    CLAIM_ADMIN_REVIEW: '管理员审核申请中',
    CLAIM_OWNER_REVIEW: '发布人审核申请中',
    APPROVED: '未匹配',
    REJECTED: '已驳回',
    MATCHED: '已匹配',
    CLAIMED: '已认领',
    ARCHIVED: '已归档',
    CANCELLED: '已取消',
    ADMIN_DELETED: '管理员删除',
    RESOLVED: '已处理'
  };

  function normalizeStatusText(text) {
    return String(text || '').replace(/\b(PENDING|ADMIN_APPROVED|CLAIM_ADMIN_REVIEW|CLAIM_OWNER_REVIEW|APPROVED|REJECTED|MATCHED|CLAIMED|ARCHIVED|CANCELLED|ADMIN_DELETED|RESOLVED)\b/g, s => STATUS_MAP[s] || s);
  }

  function parseNotify(raw) {
    const normalized = normalizeStatusText(raw);
    const objectMatch = normalized.match(/对象：([^；。]+)/);
    const eventMatch = normalized.match(/事件：([^；。]+)/);
    const detailMatch = normalized.match(/说明：([^。]+)/);
    const object = objectMatch ? objectMatch[1].trim() : '';
    let event = eventMatch ? eventMatch[1].trim() : '系统事件';
    let detail = detailMatch ? detailMatch[1].trim() : normalized.replace(/^【[^】]+】/, '').trim();
    if (event === '帖子状态跟踪') {
      event = '状态变更';
    }
    if (detail.startsWith('你申请过的帖子状态由')) {
      detail = detail.replace('你申请过的帖子状态由', '状态由');
    }

    const postMatch = object.match(/(失物招领|寻物启事)《([^》]+)》#?(\d+)?/);
    const claimMatch = object.match(/(认领申请|归还申请)《([^》]+)》#?(\d+)?/);
    const chatMatch = object.match(/聊天消息#?(\d+)?/);
    const isReport = event.includes('举报');

    let type = '失物招领';
    if (isReport) {
      type = '举报';
    } else if (claimMatch) {
      type = claimMatch[1] || '认领申请';
    } else if (postMatch) {
      type = postMatch[1];
    } else if (event.includes('申请')) {
      type = '认领申请';
    }

    const itemName = postMatch ? postMatch[2] : (claimMatch ? claimMatch[2] : '');
    const itemId = postMatch && postMatch[3] ? Number(postMatch[3])
      : (claimMatch && claimMatch[3] ? Number(claimMatch[3]) : null);
    const chatClaimId = chatMatch && chatMatch[1] ? Number(chatMatch[1]) : null;

    let reportTargetType = '';
    if (type === '举报') {
      if (object.includes('聊天消息')) reportTargetType = '聊天消息';
      else if (object.includes('认领申请') || object.includes('归还申请') || object.includes('申请')) reportTargetType = '申请';
      else if (object.includes('寻物启事')) reportTargetType = '寻物启事';
      else if (object.includes('失物招领')) reportTargetType = '失物招领';
      else reportTargetType = '申请';
    }

    let detailAction = 'none';
    if (type === '失物招领' || type === '寻物启事' || type === '认领申请' || type === '归还申请') {
      if (itemId) detailAction = 'item';
    } else if (type === '举报') {
      if (reportTargetType === '聊天消息') detailAction = 'chat';
      else if (itemId) detailAction = 'item';
    }

    return {
      type,
      event,
      itemName,
      itemId,
      chatClaimId,
      reportTargetType,
      detailAction,
      detail,
      normalized
    };
  }

  function withinDays(createdAt, days) {
    if (!days) return true;
    if (!createdAt) return false;
    const t = new Date(createdAt).getTime();
    if (Number.isNaN(t)) return false;
    return Date.now() - t <= Number(days) * 24 * 60 * 60 * 1000;
  }

  try {
    const data = await api('/api/notifications');
    const rawList = data.data || [];
    const list = rawList.map(n => ({
      ...n,
      __parsed: parseNotify(n.content || '')
    }));

    function render() {
      const type = document.getElementById('nType').value;
      const days = document.getElementById('nTime').value;

      const filtered = list.filter(n => {
        const p = n.__parsed;
        if (type && p.type !== type) return false;
        if (!withinDays(n.createdAt, days)) return false;
        return true;
      });

      document.getElementById('sysNotifyList').innerHTML = filtered.length === 0
        ? '<p class="empty">暂无系统通知</p>'
        : filtered.map(n => `
          <div class="notify-card" ${n.__parsed.itemId && (n.__parsed.type === '失物招领' || n.__parsed.type === '寻物启事') ? `data-item-id="${n.__parsed.itemId}"` : ''}>
            <div class="notify-head">
              <span class="notify-type">${esc(n.__parsed.type)}</span>
            </div>
            <div class="notify-content">
              <div class="notify-line"><b>事件：</b>${esc(n.__parsed.event)}</div>
              <div class="notify-line"><b>说明：</b>${esc(n.__parsed.detail || '无')}</div>
              ${(n.__parsed.type === '失物招领' || n.__parsed.type === '寻物启事')
                ? `<div class="notify-line"><b>物品名称：</b>${esc(n.__parsed.itemName || '无')}</div>
                   <div class="notify-line">${n.__parsed.itemId ? '<button class="btn-sm notify-link" data-detail-id="' + n.__parsed.itemId + '">查看帖子详情</button>' : '<span style="color:#999">暂无可跳转详情</span>'}</div>`
                : ''}
              ${(n.__parsed.type === '认领申请' || n.__parsed.type === '归还申请')
                ? `<div class="notify-line"><b>物品名称：</b>${esc(n.__parsed.itemName || '无')}</div>
                   <div class="notify-line">${n.__parsed.itemId ? '<button class="btn-sm notify-link" data-detail-id="' + n.__parsed.itemId + '">查看申请详情</button>' : '<span style="color:#999">暂无可跳转详情</span>'}</div>`
                : ''}
              ${n.__parsed.type === '举报'
                ? `<div class="notify-line"><b>举报对象类型：</b>${esc(n.__parsed.reportTargetType || '申请')}</div>
                   <div class="notify-line">${n.__parsed.detailAction === 'item' ? '<button class="btn-sm notify-link" data-detail-id="' + (n.__parsed.itemId || '') + '">查看举报对象详情</button>' : (n.__parsed.detailAction === 'chat' ? '<button class="btn-sm notify-chat-link">查看聊天详情</button>' : '<span style="color:#999">暂无可跳转详情</span>')}</div>`
                : ''}
            </div>
            <div class="notify-time">发布时间：${fmtTime(n.createdAt)}</div>
          </div>
        `).join('');

      document.querySelectorAll('[data-detail-id]').forEach(btn => {
        btn.onclick = () => {
          const id = Number(btn.getAttribute('data-detail-id'));
          if (!id) return;
          Router.go('detail', { id });
        };
      });
      document.querySelectorAll('.notify-chat-link').forEach(btn => {
        btn.onclick = () => Router.go('myChat');
      });
    }

    ['nType', 'nTime'].forEach(id => {
      document.getElementById(id).onchange = render;
    });
    render();
  } catch (e) {
    document.getElementById('sysNotifyList').innerHTML = `<p class="empty">${e.message}</p>`;
  }
});
