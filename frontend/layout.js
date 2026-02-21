function renderLayout(app, role, activeNav) {
  let navItems = [];
  if (role === 'USER') {
    navItems = [
      { id: 'home', label: '主页' },
      { id: 'search', label: '查询信息' },
      { id: 'publishChoose', label: '发布信息' },
      { id: 'history', label: '历史记录' },
      { id: 'myApplications', label: '我的申请' },
      { id: 'myChat', label: '我的聊天' },
      { id: 'annoPage', label: '公告' },
      { id: 'sysNotify', label: '系统通知' }
    ];
  } else if (role === 'ADMIN') {
    navItems = [
      { id: 'adminHome', label: '主页' },
      { id: 'adminReview', label: '审核消息' },
      { id: 'adminManage', label: '管理物品' },
      { id: 'adminMaintain', label: '维护信息' },
      { id: 'adminHistory', label: '历史审核记录' },
      { id: 'adminRegionAnno', label: '发送地区公告' },
      { id: 'adminViewAnno', label: '查看公告' },
      { id: 'adminNotify', label: '系统通知' },
      { id: 'adminChat', label: '我的聊天' }
    ];
  } else if (role === 'SUPER_ADMIN') {
    navItems = [
      { id: 'superHome', label: '主页' },
      { id: 'superGlobal', label: '全局管理' },
      { id: 'superAccounts', label: '账号和权限' },
      { id: 'superAnno', label: '公告与内容' },
      { id: 'superMessages', label: '消息查看与处理' },
      { id: 'superChat', label: '我的聊天' },
      { id: 'superBackup', label: '数据备份' }
    ];
  }

  const navHtml = navItems.map(n =>
    `<button class="nav-item${n.id === activeNav ? ' active' : ''}" data-nav="${n.id}">${n.label}</button>`
  ).join('');

  app.innerHTML = `
    <div class="topbar">
      <b>${esc(Auth.getUser())}同学，你好!</b>
      <a class="logout" id="logoutLink">退出登录</a>
    </div>
    <div class="layout">
      <div class="sidebar">${navHtml}</div>
      <div class="main" id="mainContent"></div>
    </div>
  `;

  document.getElementById('logoutLink').onclick = () => { Auth.clear(); Router.go('login'); };

  document.querySelectorAll('.sidebar .nav-item').forEach(btn => {
    btn.onclick = () => Router.go(btn.dataset.nav);
  });

  return document.getElementById('mainContent');
}

function renderPager(container, currentPage, totalPages, onPageChange) {
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = `<button class="pg-arrow" ${currentPage === 0 ? 'disabled' : ''} data-pg="${currentPage - 1}">&lt;</button>`;
  const maxShow = 7;
  for (let i = 0; i < totalPages; i++) {
    if (totalPages > maxShow + 2) {
      if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage + 2)) {
        html += `<span class="pg-num${i === currentPage ? ' active' : ''}" data-pg="${i}">${i + 1}</span>`;
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        html += '<span>...</span>';
      }
    } else {
      html += `<span class="pg-num${i === currentPage ? ' active' : ''}" data-pg="${i}">${i + 1}</span>`;
    }
  }
  html += `<button class="pg-arrow" ${currentPage === totalPages - 1 ? 'disabled' : ''} data-pg="${currentPage + 1}">&gt;</button>`;
  container.innerHTML = html;
  container.querySelectorAll('[data-pg]').forEach(el => {
    el.onclick = () => {
      const p = parseInt(el.dataset.pg);
      if (p >= 0 && p < totalPages && p !== currentPage) onPageChange(p);
    };
  });
}

function itemCardHtml(item) {
  const isLost = item.type === 'LOST';
  const typeLabel = isLost ? '寻物启事' : '失物招领';
  const locLabel = isLost ? '丢失地点' : '拾取地点';
  const timeLabel = isLost ? '丢失时间' : '拾得时间';
  const rawLoc = item.location || '';
  const loc = rawLoc;
  const time = item.lostTime || '';
  const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];

  return `
    <div class="item-card-row" data-id="${item.id}">
      <div class="card-left">
        <div class="item-type-label">${esc(typeLabel)}</div>
        <div class="item-status">目前进度：${statusLabel(item.status)}</div>
        ${(item.status === 'REJECTED' || item.status === 'ADMIN_DELETED') && item.rejectReason ? `<div style="color:#e74c3c;font-size:12px">原因：${esc(item.rejectReason)}</div>` : ''}
        <div class="item-info">
          <div>物品名称：${esc(item.title)}</div>
          <div>物品类型：${esc(item.category || '-')}</div>
          <div>${locLabel}：${esc(loc)}</div>
          <div>${timeLabel}：${esc(time || '-')}</div>
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
}
