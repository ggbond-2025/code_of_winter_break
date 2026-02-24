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
        main.innerHTML = '<div style="padding:20px"><div style="background:#fff3cd;border:1px solid #ffc107;padding:12px;margin-bottom:20px;border-radius:4px"><b style="color:#e74c3c">系统消息：</b> 暂无聊天记录</div></div>';
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
        <div style="padding:20px">
          <div style="background:#fff3cd;border:1px solid #ffc107;padding:12px;margin-bottom:20px;border-radius:4px">
            <b style="color:#e74c3c">系统消息：</b> 你有 ${contactKeys.size} 条已匹配的聊天记录
          </div>
          <div id="chatList"></div>
          <div id="chatPager" class="pager"></div>
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
          <div class="item-card-row" style="border:none;margin:0;cursor:pointer">
            <div class="card-left">
              <div class="item-type-label">${isLost ? '寻物启事' : '失物招领'}</div>
              <div class="item-status" style="font-weight:bold">目前进度：${statusLabel(item.status)}</div>
              <div class="item-info">
                <div>物品名称：${esc(item.title || '-')}</div>
                <div>物品类型：${esc(item.category || '-')}</div>
                <div>${isLost ? '丢失地点' : '拾取地点'}：${esc(item.location || '-')}</div>
                <div>${isLost ? '丢失时间' : '拾得时间'}：${esc(item.lostTime || '-')}</div>
              </div>
            </div>
            <div class="card-right-wrap">
              <div class="card-images">
                ${imgs.length > 0 ? imgs.slice(0, 2).map(u => imgTag(u, 100, 80)).join('') : '<div class="img-placeholder">暂无图片</div><div class="img-placeholder">暂无图片</div>'}
              </div>
              <div class="card-time">发布时间：${fmtTime(item.createdAt)}</div>
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
              <div style="padding:8px 16px 12px;border-top:1px solid #eee;cursor:pointer" class="chat-card" data-claim-id="${claim.id}" data-peer-id="${u.user.id}">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:32px;height:32px;border-radius:50%;background:${u.type === 'reviewer' ? '#b0c4de' : '#ddd'};display:flex;align-items:center;justify-content:center;font-size:14px">&#128100;</div>
                  <div style="flex:1">
                    <div><b>${esc(u.label)}：${esc(u.user?.username || '-')}</b></div>
                    <div style="color:#999;font-size:13px">点击进入会话</div>
                  </div>
                </div>
              </div>
            `);
          }
        }

        const groupHtml = `
          <div style="border:1px solid #ddd;margin-bottom:16px">
            ${itemInfoHtml}
            ${contactRows.length > 0 ? contactRows.join('') : '<div style="padding:8px 16px 12px;border-top:1px solid #eee;color:#999">暂无联系人</div>'}
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
      main.innerHTML = '<div id="myAppList"></div><div id="myAppPager" class="pager"></div>';
      const box = document.getElementById('myAppList');
      box.innerHTML = list.map(c => {
        const item = c.item || {};
        const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
        const claimImgs = c.imageUrls ? c.imageUrls.split(',').filter(Boolean) : [];
        const isLost = item.type === 'LOST';
        return `
          <div style="border:1px solid #ddd;margin-bottom:16px">
            <div class="item-card-row" style="border:none;margin:0;cursor:pointer" data-id="${item.id}">
              <div class="card-left">
                <div class="item-type-label">${isLost ? '寻物启事' : '失物招领'}</div>
                <div class="item-status">帖子状态：${statusLabel(item.status)}</div>
                <div class="item-info">
                  <div>物品名称：${esc(item.title || '-')}</div>
                  <div>物品类型：${esc(item.category || '-')}</div>
                  <div>${isLost ? '丢失' : '拾取'}地点：${esc(item.location || '-')}</div>
                  <div>${isLost ? '丢失' : '拾得'}时间：${esc(item.lostTime || '-')}</div>
                </div>
              </div>
              <div class="card-right-wrap">
                <div class="card-images">
                  ${imgs.length > 0 ? imgs.slice(0, 2).map(u => imgTag(u, 100, 80)).join('') : '<div class="img-placeholder">暂无图片</div><div class="img-placeholder">暂无图片</div>'}
                </div>
                <div class="card-time">发布时间：${fmtTime(item.createdAt)}</div>
              </div>
            </div>
            <div style="padding:10px 16px;border-top:1px solid #eee">
              <div><b>申请状态：</b>${claimStatusLabel(c.status)}</div>
              ${c.rejectReason ? `<div style="color:#e74c3c"><b>驳回原因：</b>${esc(c.rejectReason)}</div>` : ''}
              <div style="margin-top:6px"><b>我的申请信息：</b>${esc(c.message || c.proof || '-')}</div>
              ${claimImgs.length > 0 ? `<div style="display:flex;gap:6px;margin-top:8px">${claimImgs.map(u => imgTag(u, 80, 60)).join('')}</div>` : ''}
              <div style="font-size:12px;color:#999;margin-top:6px">提交时间：${fmtTime(c.createdAt)}</div>
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
      <div style="padding:20px;display:flex;flex-direction:column;height:calc(100vh - 120px)">
        <div style="margin-bottom:8px"><span class="back-arrow" id="chatBackBtn" style="cursor:pointer">&#x21A9;</span> <b>聊天</b></div>
        <div style="margin-bottom:8px;padding:8px 12px;background:#f5f5f5;border:1px solid #eee;border-radius:4px;font-size:13px">
          <div style="margin-bottom:4px"><b>物品：</b>${esc(item.title || '-')}</div>
          <div>${partLine}</div>
        </div>
        ${hasReportedChat ? '<div style="margin-bottom:8px;padding:8px 12px;background:#fff3cd;border:1px solid #ffc107;border-radius:4px;color:#8a6d3b">聊天被举报，请规范发言</div>' : ''}
        <div id="chatMessages" style="flex:1;overflow-y:auto;border:1px solid #ddd;padding:12px;background:#fafafa;margin-bottom:12px"></div>
        <div style="display:flex;gap:8px">
          <input id="chatInput" style="flex:1;padding:10px;border:1px solid #ccc;border-radius:4px;font-size:14px" placeholder="输入消息..." />
          <button class="btn-primary" id="chatSendBtn" style="padding:10px 24px">发送</button>
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
          <div style="display:flex;margin-bottom:12px;${isMine ? 'flex-direction:row-reverse' : ''}">
            <div style="width:36px;height:36px;border-radius:50%;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">&#128100;</div>
            <div style="max-width:70%;margin:0 8px">
              <div style="font-size:12px;color:#999;${isMine ? 'text-align:right' : ''}">${esc(m.sender?.username || '-')} <span style="margin-left:8px">${fmtTime(m.createdAt)}</span></div>
              <div style="background:${isMine ? '#dcf8c6' : '#fff'};border:1px solid #ddd;padding:8px 12px;border-radius:8px;margin-top:2px;word-break:break-all">${esc(m.content)}</div>
              ${!isMine ? `<div style="margin-top:4px;${isMine ? 'text-align:right' : ''}"><button class="btn-sm btn-outline" data-chat-report="${m.id}">举报发言</button></div>` : ''}
            </div>
          </div>
        `;
      }).join('');
      box.scrollTop = box.scrollHeight;

      box.querySelectorAll('[data-chat-report]').forEach(btn => {
        btn.onclick = async () => {
          const reason = prompt('请选择/输入举报原因：辱骂攻击、骚扰、虚假信息、其他');
          if (reason === null) return;
          const detail = prompt('请填写具体说明（可选）：') || '';
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
            alert('投诉已提交，等待超级管理员审核');
          } catch (e) {
            alert(e.message);
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
      } catch (e) { alert(e.message); }
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
    <div class="tab-bar">
      <button class="tab-btn active" id="tabGlobal">全体公告</button>
      <button class="tab-btn" id="tabRegion">地区公告</button>
    </div>
    <div id="annoContent"></div>
    <div id="annoPager" class="pager"></div>
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
        ? '<p class="empty">暂无公告</p>'
        : list.map(a => `
          <div class="anno-card">
            <h3>${esc(a.title)}</h3>
            ${a.scope === 'REGION' ? `<div style="font-size:12px;color:#888;text-align:center">地区公告：${esc(a.region || '-')}</div>` : ''}
            <p>${esc(a.content)}</p>
            <div class="anno-time">发布于：${fmtTime(a.createdAt)}</div>
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
