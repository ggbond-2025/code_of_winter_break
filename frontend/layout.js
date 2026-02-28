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
      { id: 'superBackup', label: '数据管理' }
    ];
  }

  const navHtml = navItems.map(n =>
    `<button class="nav-item${n.id === activeNav ? ' active' : ''}" data-nav="${n.id}">${n.label}</button>`
  ).join('');

  const existingLayout = document.querySelector('.layout');
  if (existingLayout && document.querySelector('.topbar') && existingLayout.dataset.role === role) {
    // Layout already exists and role matches, just update the active nav item
    document.querySelectorAll('.sidebar .nav-item').forEach(btn => {
      if (btn.dataset.nav === activeNav) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = ''; // Clear main content for new page
    return mainContent;
  }

  const userVersionIntro = role === 'USER'
    ? `<a id="userVersionIntro" style="font-size:12px;color:var(--primary);cursor:pointer;text-decoration:none;width:fit-content">版本信息</a>`
    : '';

  app.innerHTML = `
    <div class="topbar">
      <div style="display:flex;flex-direction:column;gap:2px">
        <b>${esc(Auth.getUser())}同学，你好!</b>
        ${userVersionIntro}
      </div>
      <a class="logout" id="logoutLink">退出登录</a>
    </div>
    <div class="layout" data-role="${role}">
      <div class="sidebar">${navHtml}</div>
      <div class="main" id="mainContent"></div>
    </div>
  `;

  document.getElementById('logoutLink').onclick = () => { Auth.clear(); Router.go('login'); };

  if (role === 'USER') {
    const introEl = document.getElementById('userVersionIntro');
    if (introEl) {
      introEl.onclick = async (e) => {
        e.preventDefault();
        try {
          const [cfgRes, adminsRes] = await Promise.all([
            getConfig().catch(() => ({})),
            api('/api/config/admin-contacts').then(r => r.data || []).catch(() => [])
          ]);

          const version = cfgRes?.systemVersion || cfgRes?.version || 'v1.0.0';
          const publishDate = cfgRes?.releaseDate || cfgRes?.updatedAt || '未提供';
          const admins = Array.isArray(adminsRes) ? adminsRes : [];
          const phoneLines = admins.length
            ? admins.map((a, idx) => {
                const roleLabel = a.role === 'SUPER_ADMIN' ? '超级管理员' : '管理员';
                const name = a.name || a.username || `管理员${idx + 1}`;
                const region = a.region ? `（${a.region}）` : '';
                return `${idx + 1}. ${name}${region} - ${a.phone || '未填写'}`;
              }).join('\n')
            : '暂无管理员电话信息';

          const message = `当前版本：${version}\n更新时间：${publishDate}\n\n本系统用于校园失物招领信息发布、查询与认领流程管理。\n\n管理员电话（全部）：\n${phoneLines}`;
          await uiAlert(message, '版本信息');
        } catch (_) {
          await uiAlert('版本信息暂时不可用，请稍后重试。', '版本信息');
        }
      };
    }
  }

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
  const showArchiveDetail = item.status === 'ARCHIVED' && item.type === 'FOUND';

  return `
    <div class="item-card-row" data-id="${item.id}" style="cursor:pointer;background:var(--bg-color);border:1px solid var(--border);border-radius:var(--radius-md);padding:20px;display:flex;justify-content:space-between;gap:24px;transition:all 0.3s ease;position:relative;overflow:hidden" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.08)';this.style.borderColor='var(--primary)'" onmouseout="this.style.transform='none';this.style.boxShadow='none';this.style.borderColor='var(--border)'">
      <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${isLost ? 'var(--warning)' : 'var(--success)'}"></div>
      <div class="card-left" style="flex:1;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="item-type-label" style="font-size:14px;font-weight:600;color:white;background:${isLost ? 'var(--warning)' : 'var(--success)'};padding:4px 12px;border-radius:var(--radius-sm)">${esc(typeLabel)}</div>
          <div class="item-status" style="font-size:14px;font-weight:600;color:var(--text-main)">目前进度：${statusLabel(item.status)}</div>
        </div>
        ${(item.status === 'REJECTED' || item.status === 'ADMIN_DELETED') && item.rejectReason ? `<div style="color:var(--danger);font-size:13px;background:var(--danger-light);padding:6px 12px;border-radius:var(--radius-sm);display:inline-block;width:fit-content">原因：${esc(item.rejectReason)}</div>` : ''}
        <div class="item-info" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:8px;font-size:14px;color:var(--text-muted)">
          <div style="display:flex;align-items:center;gap:6px"><span style="color:var(--text-main)">物品名称：</span>${esc(item.title)}</div>
          <div style="display:flex;align-items:center;gap:6px"><span style="color:var(--text-main)">物品类型：</span>${esc(item.category || '-')}</div>
          <div style="display:flex;align-items:center;gap:6px"><span style="color:var(--text-main)">${locLabel}：</span>${esc(loc)}</div>
          <div style="display:flex;align-items:center;gap:6px"><span style="color:var(--text-main)">${timeLabel}：</span>${esc(time || '-')}</div>
          ${showArchiveDetail ? `<div style="display:flex;align-items:center;gap:6px"><span style="color:var(--text-main)">处理方式：</span>${esc(item.archiveMethod || '自行处理')}</div>` : ''}
          ${showArchiveDetail && item.archiveLocation ? `<div style="display:flex;align-items:center;gap:6px"><span style="color:var(--text-main)">处理地点：</span>${esc(item.archiveLocation)}</div>` : ''}
        </div>
      </div>
      <div class="card-right-wrap" style="display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;min-width:220px">
        <div class="card-images" style="display:flex;gap:12px">
          ${imgs.length > 0 ? imgs.slice(0, 2).map(u => `<img src="${imgUrl(u)}" style="width:100px;height:80px;object-fit:cover;border-radius:var(--radius-sm);border:1px solid var(--border);box-shadow:0 2px 4px rgba(0,0,0,0.05)" />`).join('') : '<div class="img-placeholder" style="width:100px;height:80px;background:var(--surface);border-radius:var(--radius-sm);border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px">暂无图片</div><div class="img-placeholder" style="width:100px;height:80px;background:var(--surface);border-radius:var(--radius-sm);border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px">暂无图片</div>'}
        </div>
        <div class="card-time" style="font-size:13px;color:var(--text-muted);margin-top:12px">发布时间：${fmtTime(item.createdAt)}</div>
      </div>
    </div>
  `;
}
