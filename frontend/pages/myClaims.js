let chatPollingTimer = null;

Router.register('myChat', async function (app) {
  const role = Auth.getRole();
  let layoutRole = 'USER';
  let activeNav = 'myChat';
  if (role === 'ADMIN') { layoutRole = 'ADMIN'; activeNav = 'adminChat'; }
  else if (role === 'SUPER_ADMIN') { layoutRole = 'SUPER_ADMIN'; activeNav = 'superChat'; }
  const main = renderLayout(app, layoutRole, activeNav);
  if (chatPollingTimer) {
    clearInterval(chatPollingTimer);
    chatPollingTimer = null;
    window.__lfChatPollTimer = null;
  }
  main.innerHTML = '<p>加载中...</p>';
  let pg = 0;
  async function load() {
    try {
      const data = await api(`/api/claims/chats?page=${pg}&size=8`);
      const page = data.data || {};
      const groups = page.content || [];
      if (groups.length === 0) {
        main.innerHTML = '<div style="padding:24px;max-width:1200px;margin:0 auto"><div style="background:rgba(var(--warning-rgb), 0.1);border-left:6px solid var(--warning);padding:20px;border-radius:12px;display:flex;align-items:center;gap:16px;box-shadow:0 4px 12px rgba(0,0,0,0.02)"><svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--warning)"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><span style="color:var(--text-main);font-size:16px;font-weight:500"><b style="color:var(--warning);margin-right:8px">系统消息：</b> 暂无聊天记录</span></div></div>';
        return;
      }

      const myId = Auth.getUserId();
      const contactKeys = new Set();
      for (const g of groups) {
        const item = g.item || {};
        const owner = item.creator;
        for (const claim of g.claims || []) {
          if (owner && String(owner.id) !== myId) contactKeys.add(`${claim.id}-${owner.id}`);
          if (claim.claimer && String(claim.claimer.id) !== myId) contactKeys.add(`${claim.id}-${claim.claimer.id}`);
          if (claim.reviewer && String(claim.reviewer.id) !== myId) contactKeys.add(`${claim.id}-${claim.reviewer.id}`);
        }
      }
      main.innerHTML = `
        <div style="padding:24px;animation:fadeIn 0.3s ease;max-width:1200px;margin:0 auto">
          <div style="background:rgba(var(--warning-rgb), 0.1);border-left:6px solid var(--warning);padding:20px;margin-bottom:32px;border-radius:12px;display:flex;align-items:center;gap:16px;box-shadow:0 4px 12px rgba(0,0,0,0.02)">
            <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--warning)"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <span style="color:var(--text-main);font-size:16px;font-weight:500"><b style="color:var(--warning);margin-right:8px">系统消息：</b> 你有 <span style="color:var(--warning);font-size:20px;font-weight:700;margin:0 4px">${contactKeys.size}</span> 条已匹配的聊天记录</span>
          </div>
          <div id="chatList" style="display:flex;flex-direction:column;gap:24px"></div>
          <div id="chatPager" class="pager" style="margin-top:40px"></div>
        </div>
      `;

      const chatListEl = document.getElementById('chatList');
      for (const group of groups) {
        const item = group.item || {};
        const claims = group.claims || [];
        const isLost = item.type === 'LOST';
        const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
        const owner = item.creator;
        const itemInfoHtml = `
          <div class="item-card-row" style="border:none;margin:0;cursor:pointer;background:transparent;box-shadow:none;padding:24px">
            <div class="card-left" style="display:flex;flex-direction:column;gap:16px">
              <div style="display:flex;align-items:center;gap:12px">
                <div class="item-type-label" style="background:${isLost ? 'rgba(var(--danger-rgb), 0.1)' : 'rgba(var(--success-rgb), 0.1)'};color:${isLost ? 'var(--danger)' : 'var(--success)'};padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:6px">
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  ${isLost ? '寻物启事' : '失物招领'}
                </div>
                <div class="item-status" style="font-weight:700;color:var(--text-main);font-size:16px;display:flex;align-items:center;gap:8px">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--primary)"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  目前进度：<span style="color:var(--primary)">${statusLabel(item.status)}</span>
                </div>
              </div>
              <div class="item-info" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;color:var(--text-secondary);font-size:14px">
                <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg><span style="color:var(--text-main);font-weight:500">物品名称：</span>${esc(item.title || '-')}</div>
                <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg><span style="color:var(--text-main);font-weight:500">物品类型：</span>${esc(item.category || '-')}</div>
                <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span style="color:var(--text-main);font-weight:500">${isLost ? '丢失地点' : '拾取地点'}：</span>${esc(item.location || '-')}</div>
                <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><span style="color:var(--text-main);font-weight:500">${isLost ? '丢失时间' : '拾得时间'}：</span>${esc(item.lostTime || '-')}</div>
              </div>
            </div>
            <div class="card-right-wrap" style="display:flex;flex-direction:column;align-items:flex-end;gap:16px;min-width:240px">
              <div class="card-images" style="display:flex;gap:12px">
                ${imgs.length > 0 ? imgs.slice(0, 2).map(u => `<img src="${imgUrl(u)}" style="width:110px;height:88px;object-fit:cover;border-radius:12px;border:1px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,0.05)" />`).join('') : '<div class="img-placeholder" style="width:110px;height:88px;background:var(--bg-color);border-radius:12px;border:2px dashed var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px;gap:4px"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>暂无图片</div>'}
              </div>
              <div class="card-time" style="font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:6px">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                发布时间：${fmtTime(item.createdAt)}
              </div>
            </div>
          </div>`;

        const contactRows = [];
        for (const claim of claims) {
          const claimer = claim.claimer;
          const reviewer = claim.reviewer;
          const users = [];
          if (owner && String(owner.id) !== myId) users.push({ label: '发布人', user: owner, type: 'owner' });
          if (claimer && String(claimer.id) !== myId) users.push({ label: isLost ? '归还人' : '认领人', user: claimer, type: 'claimer' });
          if (reviewer && String(reviewer.id) !== myId) users.push({ label: '审核管理员', user: reviewer, type: 'reviewer' });
          for (const u of users) {
            if (!u.user || !u.user.id) continue;
            contactRows.push(`
              <div style="padding:20px 24px;border-top:1px solid var(--border);cursor:pointer;transition:all 0.2s ease;background:var(--surface)" class="chat-card" data-claim-id="${claim.id}" data-peer-id="${u.user.id}" onmouseover="this.style.background='var(--bg-color)'" onmouseout="this.style.background='var(--surface)'">
                <div style="display:flex;align-items:center;gap:20px">
                  <div style="width:56px;height:56px;border-radius:50%;background:${u.type === 'reviewer' ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(var(--success-rgb), 0.1)'};color:${u.type === 'reviewer' ? 'var(--primary)' : 'var(--success)'};display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
                    <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <div style="flex:1">
                    <div style="font-size:16px;color:var(--text-main);margin-bottom:6px;font-weight:600">${esc(u.label)}：${esc(u.user?.username || '-')}</div>
                    <div style="color:var(--primary);font-size:14px;display:flex;align-items:center;gap:6px;font-weight:500">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      点击进入会话
                    </div>
                  </div>
                  <div style="color:var(--primary);opacity:0;transition:all 0.2s ease;transform:translateX(-10px)" class="chat-arrow">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                </div>
              </div>
            `);
          }
        }

        const groupHtml = `
          <div style="border:1px solid var(--border);border-radius:16px;background:var(--surface);box-shadow:0 4px 12px rgba(0,0,0,0.02);overflow:hidden;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.08)';this.style.borderColor='var(--primary)';this.querySelectorAll('.chat-arrow').forEach(el=>{el.style.opacity=1;el.style.transform='translateX(0)'})" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.02)';this.style.borderColor='var(--border)';this.querySelectorAll('.chat-arrow').forEach(el=>{el.style.opacity=0;el.style.transform='translateX(-10px)'})">
            ${itemInfoHtml}
            ${contactRows.length > 0 ? contactRows.join('') : '<div style="padding:24px;border-top:1px solid var(--border);color:var(--text-muted);text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.5" fill="none" style="opacity:0.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>暂无联系人</div>'}
          </div>
        `;
        chatListEl.insertAdjacentHTML('beforeend', groupHtml);
      }

      document.querySelectorAll('.chat-card[data-claim-id]').forEach(card => {
        card.onclick = () => Router.go('chatDetail', { claimId: card.dataset.claimId, peerId: card.dataset.peerId });
      });
      renderPager(document.getElementById('chatPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
    } catch (e) {
      main.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
    }
  }
  load();
});

Router.register('myApplications', async function (app) {
  const main = renderLayout(app, 'USER', 'myApplications');
  main.innerHTML = '<p>加载中...</p>';
  let pg = 0;
  async function load() {
    try {
      const data = await api(`/api/claims/my/applications?page=${pg}&size=8`);
      const page = data.data || {};
      const list = page.content || [];
      if (list.length === 0) {
        main.innerHTML = '<p class="empty">暂无申请记录</p>';
        return;
      }
      main.innerHTML = '<div id="myAppList" style="display:flex;flex-direction:column;gap:20px;padding:20px;animation:fadeIn 0.3s ease"></div><div id="myAppPager" class="pager" style="margin-top:32px"></div>';
      const box = document.getElementById('myAppList');
      box.innerHTML = list.map(c => {
        const item = c.item || {};
        const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
        const claimImgs = c.imageUrls ? c.imageUrls.split(',').filter(Boolean) : [];
        const isLost = item.type === 'LOST';
        return `
          <div style="border:1px solid var(--border);border-radius:16px;background:var(--surface);box-shadow:0 4px 12px rgba(0,0,0,0.02);overflow:hidden;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 24px rgba(0,0,0,0.08)';this.style.borderColor='var(--primary)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.02)';this.style.borderColor='var(--border)'">
            <div class="item-card-row" style="border:none;margin:0;cursor:pointer;background:transparent;box-shadow:none;padding:24px" data-id="${item.id}">
              <div class="card-left" style="display:flex;flex-direction:column;gap:16px">
                <div style="display:flex;align-items:center;gap:12px">
                  <div class="item-type-label" style="background:${isLost ? 'rgba(var(--danger-rgb), 0.1)' : 'rgba(var(--success-rgb), 0.1)'};color:${isLost ? 'var(--danger)' : 'var(--success)'};padding:6px 16px;border-radius:20px;font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:6px">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    ${isLost ? '寻物启事' : '失物招领'}
                  </div>
                  <div class="item-status" style="font-weight:700;color:var(--text-main);font-size:16px;display:flex;align-items:center;gap:8px">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--primary)"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    帖子状态：<span style="color:var(--primary)">${statusLabel(item.status)}</span>
                  </div>
                </div>
                <div class="item-info" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:12px;color:var(--text-secondary);font-size:14px">
                  <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg><span style="color:var(--text-main);font-weight:500">物品名称：</span>${esc(item.title || '-')}</div>
                  <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg><span style="color:var(--text-main);font-weight:500">物品类型：</span>${esc(item.category || '-')}</div>
                  <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><span style="color:var(--text-main);font-weight:500">${isLost ? '丢失' : '拾取'}地点：</span>${esc(item.location || '-')}</div>
                  <div style="display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--text-muted)"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><span style="color:var(--text-main);font-weight:500">${isLost ? '丢失' : '拾得'}时间：</span>${esc(item.lostTime || '-')}</div>
                </div>
              </div>
              <div class="card-right-wrap" style="display:flex;flex-direction:column;align-items:flex-end;gap:16px;min-width:240px">
                <div class="card-images" style="display:flex;gap:12px">
                  ${imgs.length > 0 ? imgs.slice(0, 2).map(u => `<img src="${imgUrl(u)}" style="width:110px;height:88px;object-fit:cover;border-radius:12px;border:1px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,0.05)" />`).join('') : '<div class="img-placeholder" style="width:110px;height:88px;background:var(--bg-color);border-radius:12px;border:2px dashed var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--text-muted);font-size:12px;gap:4px"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>暂无图片</div>'}
                </div>
                <div class="card-time" style="font-size:13px;color:var(--text-muted);display:flex;align-items:center;gap:6px">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  发布时间：${fmtTime(item.createdAt)}
                </div>
              </div>
            </div>
            <div style="padding:24px;border-top:1px dashed var(--border);background:var(--bg-color)">
              <div style="margin-bottom:16px;font-size:15px;color:var(--text-main);display:flex;align-items:center;gap:8px">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--primary)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <b>申请状态：</b>${claimStatusLabel(c.status)}
              </div>
              ${c.rejectReason ? `<div style="color:var(--danger);margin-bottom:16px;background:rgba(var(--danger-rgb), 0.1);padding:16px;border-radius:12px;font-size:14px;display:flex;align-items:flex-start;gap:8px;border:1px solid rgba(var(--danger-rgb), 0.2)"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="margin-top:2px"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><div><b>驳回原因：</b>${esc(c.rejectReason)}</div></div>` : ''}
              <div style="margin-top:8px;color:var(--text-main);font-size:15px;background:var(--surface);padding:20px;border-radius:12px;border:1px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,0.02)">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--primary)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  <b>我的申请信息：</b>
                </div>
                <div style="color:var(--text-secondary);line-height:1.6;padding-left:26px">${esc(c.message || c.proof || '-')}</div>
              </div>
              ${claimImgs.length > 0 ? `<div style="display:flex;gap:16px;margin-top:20px;padding-left:26px">${claimImgs.map(u => `<img src="${imgUrl(u)}" style="width:100px;height:100px;object-fit:cover;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);border:1px solid var(--border)" />`).join('')}</div>` : ''}
              <div style="font-size:13px;color:var(--text-muted);margin-top:20px;text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:6px">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                提交时间：${fmtTime(c.createdAt)}
              </div>
            </div>
          </div>
        `;
      }).join('');
      document.querySelectorAll('.item-card-row[data-id]').forEach(el => {
        el.onclick = () => Router.go('detail', { id: el.dataset.id });
      });
      renderPager(document.getElementById('myAppPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
    } catch (e) {
      main.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
    }
  }
  load();
});

Router.register('chatDetail', async function (app, params) {
  const role = Auth.getRole();
  let layoutRole = 'USER';
  let activeNav = 'myChat';
  if (role === 'ADMIN') { layoutRole = 'ADMIN'; activeNav = 'adminChat'; }
  else if (role === 'SUPER_ADMIN') { layoutRole = 'SUPER_ADMIN'; activeNav = 'superChat'; }
  const main = renderLayout(app, layoutRole, activeNav);
  if (chatPollingTimer) {
    clearInterval(chatPollingTimer);
    chatPollingTimer = null;
    window.__lfChatPollTimer = null;
  }
  main.innerHTML = '<p>加载中...</p>';

  const claimId = params.claimId;
  const peerId = params.peerId;
  const myId = Auth.getUserId();

  if (!claimId || !peerId) {
    main.innerHTML = '<p class="msg msg-err">会话参数不完整，请返回聊天列表重试</p>';
    return;
  }

  try {
    const [msgData, claimData, reportData] = await Promise.all([
      api(`/api/claims/${claimId}/messages?peerId=${encodeURIComponent(peerId)}`),
      api(`/api/claims/${claimId}`),
      api(`/api/complaints/chat/reported?claimId=${encodeURIComponent(claimId)}&peerId=${encodeURIComponent(peerId)}`)
    ]);
    const messages = msgData.data || [];
    const claim = claimData.data || {};
    const hasReportedChat = !!reportData.data;
    const item = claim.item || {};
    const owner = item.creator;
    const claimer = claim.claimer;
    const reviewer = claim.reviewer;
    const parts = [];
    const isLost = item.type === 'LOST';
    if (owner) parts.push({ label: '发布人', name: owner.username });
    if (claimer) parts.push({ label: isLost ? '归还人' : '认领人', name: claimer.username });
    if (reviewer) parts.push({ label: '审核管理员', name: reviewer.username });
    const partLine = parts.map(p => `<span style="margin-right:12px"><b>${esc(p.label)}：</b>${esc(p.name || '-')}</span>`).join('');

    main.innerHTML = `
      <div style="padding:24px;display:flex;flex-direction:column;height:calc(100vh - 120px);max-width:900px;margin:0 auto;animation:fadeIn 0.3s ease">
        <div style="margin-bottom:32px;display:flex;align-items:center;gap:16px">
          <span class="back-arrow" id="chatBackBtn" style="cursor:pointer;font-size:24px;color:var(--text-main);transition:transform 0.2s ease;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:var(--surface);box-shadow:0 2px 8px rgba(0,0,0,0.05)" onmouseover="this.style.transform='translateX(-4px)';this.style.color='var(--primary)'" onmouseout="this.style.transform='none';this.style.color='var(--text-main)'"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></span> 
          <h3 style="margin:0;font-size:24px;font-weight:800;color:var(--text-main);letter-spacing:0.5px">聊天会话</h3>
        </div>
        <div style="margin-bottom:24px;padding:24px;background:var(--surface);border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.02);border:1px solid var(--border)">
          <div style="margin-bottom:16px;font-size:18px;font-weight:700;color:var(--text-main);display:flex;align-items:center;gap:8px"><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" style="color:var(--primary)"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>物品：${esc(item.title || '-')}</div>
          <div style="color:var(--text-secondary);font-size:14px;display:flex;gap:24px;flex-wrap:wrap;background:var(--bg-color);padding:12px 16px;border-radius:8px">${partLine}</div>
        </div>
        ${hasReportedChat ? '<div style="margin-bottom:24px;padding:16px 20px;background:rgba(var(--warning-rgb), 0.1);border-left:6px solid var(--warning);border-radius:12px;color:var(--warning);font-weight:600;display:flex;align-items:center;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,0.02)"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> 聊天被举报，请规范发言</div>' : ''}
        <div id="chatMessages" style="flex:1;overflow-y:auto;border-radius:16px;padding:24px;background:var(--surface);margin-bottom:24px;box-shadow:0 4px 12px rgba(0,0,0,0.02);border:1px solid var(--border);display:flex;flex-direction:column;gap:20px"></div>
        <div style="display:flex;gap:16px;background:var(--surface);padding:20px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.02);border:1px solid var(--border)">
          <input id="chatInput" style="flex:1;padding:16px 24px;border:1px solid var(--border);border-radius:12px;font-size:15px;background:var(--bg-color);outline:none;transition:all 0.2s ease" placeholder="输入消息..." onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(var(--primary-rgb), 0.1)'" onblur="this.style.borderColor='var(--border)';this.style.boxShadow='none'" />
          <button class="btn-primary" id="chatSendBtn" style="padding:16px 36px;font-size:16px;font-weight:600;border-radius:12px;background:var(--primary);color:#fff;border:none;cursor:pointer;transition:all 0.3s ease;box-shadow:0 4px 12px rgba(var(--primary-rgb), 0.3);display:flex;align-items:center;gap:8px" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(var(--primary-rgb), 0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(var(--primary-rgb), 0.3)'"><svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>发送</button>
        </div>
      </div>
    `;

    document.getElementById('chatBackBtn').onclick = () => Router.go('myChat');

    function renderMessages(msgs) {
      const box = document.getElementById('chatMessages');
      if (msgs.length === 0) {
        box.innerHTML = '<p style="text-align:center;color:#999">暂无消息，发送第一条消息开始聊天吧</p>';
        return;
      }
      box.innerHTML = msgs.map(m => {
        const isMine = String(m.sender?.id) === myId;
        return `
          <div style="display:flex;margin-bottom:24px;${isMine ? 'flex-direction:row-reverse' : ''};animation:fadeIn 0.3s ease">
            <div style="width:48px;height:48px;border-radius:50%;background:${isMine ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--surface)'};color:${isMine ? 'var(--primary)' : 'var(--text-main)'};border:1px solid ${isMine ? 'rgba(var(--primary-rgb), 0.2)' : 'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.05)">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div style="max-width:75%;margin:0 16px;display:flex;flex-direction:column;${isMine ? 'align-items:flex-end' : 'align-items:flex-start'}">
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;display:flex;align-items:center;gap:8px">${esc(m.sender?.username || '-')} <span style="font-size:12px;opacity:0.8;display:flex;align-items:center;gap:4px"><svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${fmtTime(m.createdAt)}</span></div>
              <div style="background:${isMine ? 'var(--primary)' : 'var(--surface)'};color:${isMine ? '#fff' : 'var(--text-main)'};border:1px solid ${isMine ? 'var(--primary)' : 'var(--border)'};padding:16px 20px;border-radius:20px;${isMine ? 'border-top-right-radius:4px' : 'border-top-left-radius:4px'};word-break:break-all;box-shadow:0 4px 12px rgba(0,0,0,0.05);font-size:15px;line-height:1.6;position:relative" class="chat-bubble">
                ${esc(m.content)}
              </div>
              ${!isMine ? `<div style="margin-top:8px;opacity:0;transition:opacity 0.2s ease" class="chat-actions"><button class="btn-sm" style="font-size:12px;padding:6px 16px;color:var(--danger);border:1px solid rgba(var(--danger-rgb), 0.2);background:rgba(var(--danger-rgb), 0.05);border-radius:12px;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;gap:4px" onmouseover="this.style.background='rgba(var(--danger-rgb), 0.1)'" onmouseout="this.style.background='rgba(var(--danger-rgb), 0.05)'" data-chat-report="${m.id}"><svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>举报发言</button></div>` : ''}
            </div>
          </div>
        `;
      }).join('');
      box.scrollTop = box.scrollHeight;

      // Add hover effect for chat actions
      box.querySelectorAll('.chat-bubble').forEach(bubble => {
        const actions = bubble.nextElementSibling;
        if (actions && actions.classList.contains('chat-actions')) {
          bubble.parentElement.onmouseover = () => actions.style.opacity = 1;
          bubble.parentElement.onmouseout = () => actions.style.opacity = 0;
        }
      });

      box.querySelectorAll('[data-chat-report]').forEach(btn => {
        btn.onclick = async () => {
          const reason = await uiPrompt('可输入：辱骂攻击、骚扰、虚假信息、其他', '举报原因', { required: true, placeholder: '请输入举报原因' });
          if (reason === null) return;
          const detail = (await uiPrompt('请填写具体说明（可选）', '补充说明', { placeholder: '可不填' })) || '';
          try {
            await api('/api/complaints', {
              method: 'POST',
              body: JSON.stringify({
                targetType: 'CHAT_MESSAGE',
                messageId: Number(btn.dataset.chatReport),
                reason: reason.trim() || '其他',
                detail: detail.trim()
              })
            });
            await uiAlert('投诉已提交，等待超级管理员审核', '提交成功');
          } catch (e) {
            await uiAlert(e.message, '提交失败');
          }
        };
      });
    }

    renderMessages(messages);

    document.getElementById('chatSendBtn').onclick = async () => {
      const input = document.getElementById('chatInput');
      const content = input.value.trim();
      if (!content) return;
      try {
        await api(`/api/claims/${claimId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ peerId: Number(peerId), content })
        });
        input.value = '';
        const refreshed = await api(`/api/claims/${claimId}/messages?peerId=${encodeURIComponent(peerId)}`);
        renderMessages(refreshed.data || []);
      } catch (e) { await uiAlert(e.message, '发送失败'); }
    };

    document.getElementById('chatInput').onkeydown = (e) => {
      if (e.key === 'Enter') document.getElementById('chatSendBtn').click();
    };

    chatPollingTimer = setInterval(async () => {
      try {
        const refreshed = await api(`/api/claims/${claimId}/messages?peerId=${encodeURIComponent(peerId)}`);
        renderMessages(refreshed.data || []);
      } catch (_) {}
    }, 5000);
    window.__lfChatPollTimer = chatPollingTimer;
  } catch (e) {
    main.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
  }
});

Router.register('annoPage', async function (app) {
  const main = renderLayout(app, 'USER', 'annoPage');
  main.innerHTML = `
    <div class="tab-bar" style="display:flex;gap:16px;margin-bottom:24px;border-bottom:2px solid var(--border);padding-bottom:12px;animation:fadeIn 0.3s ease">
      <button class="tab-btn active" id="tabGlobal" style="padding:8px 24px;background:transparent;border:none;font-size:16px;font-weight:600;color:var(--text-muted);cursor:pointer;position:relative;transition:all 0.3s ease" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-muted)'">全体公告</button>
      <button class="tab-btn" id="tabRegion" style="padding:8px 24px;background:transparent;border:none;font-size:16px;font-weight:600;color:var(--text-muted);cursor:pointer;position:relative;transition:all 0.3s ease" onmouseover="if(!this.classList.contains('active'))this.style.color='var(--primary)'" onmouseout="if(!this.classList.contains('active'))this.style.color='var(--text-muted)'">地区公告</button>
    </div>
    <style>
      .tab-btn.active { color: var(--primary) !important; }
      .tab-btn.active::after { content: ''; position: absolute; bottom: -14px; left: 0; width: 100%; height: 3px; background: var(--primary); border-radius: 3px 3px 0 0; }
    </style>
    <div id="annoContent" style="display:flex;flex-direction:column;gap:20px"></div>
    <div id="annoPager" class="pager" style="margin-top:32px"></div>
  `;

  let currentTab = 'global';

  async function load() {
    try {
      const region = Auth.getRegion() || '';
      const scope = currentTab === 'global' ? 'GLOBAL' : 'REGION';
      const qs = new URLSearchParams({ scope });
      if (scope === 'REGION' && region) qs.set('region', region);
      const data = await api(`/api/announcements?${qs.toString()}`);
      const list = data.data || [];
      document.getElementById('annoContent').innerHTML = list.length === 0
        ? '<p class="empty" style="text-align:center;padding:40px;color:var(--text-muted);background:var(--surface);border-radius:var(--radius-lg);box-shadow:0 4px 12px rgba(0,0,0,0.05)">暂无公告</p>'
        : list.map(a => `
          <div class="anno-card" style="background:var(--surface);border-radius:var(--radius-lg);padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);transition:all 0.3s ease;border-left:4px solid ${a.scope === 'REGION' ? 'var(--warning)' : 'var(--primary)'};animation:fadeIn 0.3s ease" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'">
            <h3 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:var(--text-main)">${esc(a.title)}</h3>
            ${a.scope === 'REGION' ? `<div style="display:inline-block;padding:4px 12px;background:rgba(var(--warning-rgb), 0.1);color:var(--warning);border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px">地区公告：${esc(a.region || '-')}</div>` : ''}
            <p style="margin:0 0 20px 0;font-size:15px;color:var(--text-main);line-height:1.6;white-space:pre-wrap;background:var(--bg-color);padding:16px;border-radius:var(--radius-md)">${esc(a.content)}</p>
            <div class="anno-time" style="font-size:13px;color:var(--text-muted);text-align:right">发布于：${fmtTime(a.createdAt)}</div>
          </div>
        `).join('');
    } catch (e) {
      document.getElementById('annoContent').innerHTML = '<p class="empty">暂无公告</p>';
    }
  }

  document.getElementById('tabGlobal').onclick = () => {
    document.getElementById('tabGlobal').classList.add('active');
    document.getElementById('tabRegion').classList.remove('active');
    currentTab = 'global';
    load();
  };
  document.getElementById('tabRegion').onclick = () => {
    document.getElementById('tabRegion').classList.add('active');
    document.getElementById('tabGlobal').classList.remove('active');
    currentTab = 'region';
    load();
  };

  load();
});

Router.register('myClaims', function (app) {
  Router.go('home');
});
