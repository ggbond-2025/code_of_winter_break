Router.register('admin', function (app) {
  Router.go('adminHome');
});

Router.register('adminHome', function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminHome');
  main.innerHTML = `<h2 style="text-align:center;margin-top:60px"><b>管理员${esc(Auth.getUser())}，欢迎登录失物招领系统</b></h2>`;
});

Router.register('adminReview', function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminReview');
  main.innerHTML = `
    <h2 style="text-align:center;margin-bottom:20px">待审核消息</h2>
    <div class="tab-bar">
      <button class="tab-btn active" data-rtab="FOUND">失物招领</button>
      <button class="tab-btn" data-rtab="LOST">寻物启事</button>
      <button class="tab-btn" data-rtab="CLAIM">申请</button>
    </div>
    <div id="reviewList"></div>
    <div id="reviewPager" class="pager"></div>
  `;

  let currentTab = 'FOUND';
  let pg = 0;
  let config = null;

  async function ensureConfig() {
    if (config) return config;
    try { config = await getConfig(); } catch (_) { config = {}; }
    return config;
  }

  document.querySelectorAll('[data-rtab]').forEach(btn => {
    btn.onclick = async () => {
      const cfg = await ensureConfig();
      if (!cfg.enableReview && (btn.dataset.rtab === 'FOUND' || btn.dataset.rtab === 'LOST')) {
        currentTab = 'CLAIM';
      } else {
        currentTab = btn.dataset.rtab;
      }
      document.querySelectorAll('[data-rtab]').forEach(b => b.classList.remove('active'));
      const activeBtn = document.querySelector(`[data-rtab="${currentTab}"]`);
      if (activeBtn) activeBtn.classList.add('active');
      pg = 0;
      load();
    };
  });

  async function load() {
    const cfg = await ensureConfig();
    if (!cfg.enableReview && currentTab !== 'CLAIM') {
      document.getElementById('reviewList').innerHTML = '<p class="empty">已关闭发布审核</p>';
      document.getElementById('reviewPager').innerHTML = '';
      return;
    }
    if (currentTab === 'CLAIM') {
      loadClaims();
      return;
    }
    try {
      const data = await api(`/api/admin/items?status=PENDING&type=${currentTab}&page=${pg}&size=8`);
      const page = data.data;
      const list = page.content || [];
      document.getElementById('reviewList').innerHTML = list.length === 0
        ? '<p class="empty">暂无待审核消息</p>'
        : list.map(item => {
          const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
          return `
            <div class="review-card" data-review-item-id="${item.id}" style="cursor:pointer">
              <div class="info-line">物品名称：${esc(item.title)}</div>
              <div class="info-line">物品类型：${esc(item.category || '-')}</div>
              <div class="info-line">${item.type === 'LOST' ? '丢失' : '拾取'}地点：${esc(item.location || '-')}</div>
              <div class="info-line">${item.type === 'LOST' ? '丢失' : '拾得'}时间：${esc(item.lostTime || '-')}</div>
              <div class="info-line">领取地点：${esc(item.storageLocation || '-')}</div>
              <div class="info-line">联系方式：${esc((item.contactPhone || '') + ' ' + (item.contactName || ''))}</div>
              <div class="info-line">物品介绍：${esc(item.description || item.features || '-')}</div>
              <div class="review-images">
                ${imgs.length > 0 ? imgs.slice(0, 3).map(u => imgTag(u, 140, 110)).join('') : '<div class="img-placeholder"></div><div class="img-placeholder"></div><div class="img-placeholder"></div>'}
              </div>
              <div class="review-actions">
                <button class="btn-outline" data-open-detail="${item.id}">查看详情</button>
                <button class="btn-outline" data-approve="${item.id}">通过</button>
                <button class="btn-outline" data-reject="${item.id}">驳回</button>
              </div>
            </div>
          `;
        }).join('');

      bindReviewActions();
      renderPager(document.getElementById('reviewPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
    } catch (e) {
      document.getElementById('reviewList').innerHTML = `<p class="empty">${e.message}</p>`;
    }
  }

  async function loadClaims() {
    try {
      const data = await api('/api/admin/claims/pending');
      const list = data.data || [];
      document.getElementById('reviewPager').innerHTML = '';
      if (list.length === 0) {
        document.getElementById('reviewList').innerHTML = '<p class="empty">暂无待审核申请</p>';
        return;
      }
      document.getElementById('reviewList').innerHTML = list.map(c => {
        const item = c.item || {};
        const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
        const claimImgs = c.imageUrls ? c.imageUrls.split(',').filter(Boolean) : [];
        return `
          <div class="review-card" data-claim-id="${c.id}">
            <div class="info-line"><b>关联物品：</b>${esc(item.title || '-')}（${item.type === 'LOST' ? '寻物' : '招领'}）</div>
            <div class="info-line"><b>申请人：</b>${esc(c.claimer?.username || '-')}</div>
            <div class="info-line"><b>留言/证明：</b>${esc(c.message || '-')}</div>
            ${claimImgs.length > 0 ? `<div class="info-line">证明材料图：</div><div style="display:flex;gap:6px;margin:6px 0">${claimImgs.map(u => imgTag(u, 80, 60)).join('')}</div>` : ''}
            <div class="info-line">物品图：</div>
            <div style="display:flex;gap:6px;margin:6px 0">${imgs.length > 0 ? imgs.slice(0, 3).map(u => imgTag(u, 80, 60)).join('') : '<span>无</span>'}</div>
            <div class="review-actions" style="margin-top:12px">
              <button class="btn-outline" data-claim-approve="${c.id}">通过（转发布者审核）</button>
              <button class="btn-outline" data-claim-reject="${c.id}">驳回</button>
            </div>
          </div>
        `;
      }).join('');
      document.querySelectorAll('[data-claim-approve]').forEach(b => {
        b.onclick = async () => {
          try {
            await api(`/api/claims/${b.dataset.claimApprove}/review`, { method: 'PUT', body: JSON.stringify({ status: 'APPROVED', reason: '' }) });
            loadClaims();
          } catch (e) { alert(e.message); }
        };
      });
      document.querySelectorAll('[data-claim-reject]').forEach(b => {
        b.onclick = async () => {
          openRejectModal(async (reason) => {
            try {
              await api(`/api/claims/${b.dataset.claimReject}/review`, { method: 'PUT', body: JSON.stringify({ status: 'REJECTED', reason }) });
              loadClaims();
            } catch (e) { alert(e.message); }
          });
        };
      });
    } catch (e) {
      document.getElementById('reviewList').innerHTML = `<p class="empty">${e.message}</p>`;
      document.getElementById('reviewPager').innerHTML = '';
    }
  }

  function openRejectModal(onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1100;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = `
      <div style="background:#fff;border:2px solid #f39c12;min-width:520px;max-width:90%;padding:18px 20px;position:relative">
        <div style="position:absolute;right:10px;top:6px;font-size:20px;cursor:pointer" id="rejectClose">✖</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <div style="border:2px solid #f39c12;padding:4px 8px;font-weight:bold">驳回理由填写：</div>
        </div>
        <select id="rejectReasonSelect" style="width:220px;padding:6px 8px;border:1px solid #f39c12;margin-bottom:14px">
          <option value="消息不真实">消息不真实</option>
          <option value="信息不完整">信息不完整</option>
          <option value="图片不清晰">图片不清晰</option>
          <option value="与物品不符">与物品不符</option>
          <option value="其他">其他</option>
        </select>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="border:2px solid #f39c12;padding:4px 8px;font-weight:bold">填写具体理由：</div>
        </div>
        <textarea id="rejectReasonDetail" style="width:100%;min-height:90px;border:1px solid #f39c12;padding:8px;box-sizing:border-box"></textarea>
        <div id="rejectError" style="color:#e74c3c;margin-top:8px;min-height:18px"></div>
        <div style="text-align:right;margin-top:10px">
          <button class="btn-sm" id="rejectCancelBtn" style="margin-right:8px">取消</button>
          <button class="btn-sm btn-danger" id="rejectConfirmBtn">提交驳回</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#rejectClose').onclick = close;
    overlay.querySelector('#rejectCancelBtn').onclick = close;
    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };
    overlay.querySelector('#rejectConfirmBtn').onclick = async () => {
      const base = overlay.querySelector('#rejectReasonSelect').value || '';
      const detail = overlay.querySelector('#rejectReasonDetail').value.trim();
      const reason = detail ? `${base}：${detail}` : base;
      if (!reason.trim()) {
        overlay.querySelector('#rejectError').textContent = '请填写驳回原因';
        return;
      }
      await onConfirm(reason);
      close();
    };
  }

  function bindReviewActions() {
    const reviewList = document.getElementById('reviewList');
    if (reviewList && !reviewList._detailDelegated) {
      reviewList.addEventListener('click', (evt) => {
        if (evt.target.closest('[data-open-detail],[data-approve],[data-reject]')) return;
        const card = evt.target.closest('[data-review-item-id]');
        if (card) Router.go('detail', { id: card.dataset.reviewItemId });
      });
      reviewList._detailDelegated = true;
    }

    document.querySelectorAll('[data-open-detail]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        Router.go('detail', { id: btn.dataset.openDetail });
      };
    });

    document.querySelectorAll('[data-approve]').forEach(b => {
      b.onclick = async (e) => {
        e.stopPropagation();
        try { await api(`/api/admin/items/${b.dataset.approve}/approve`, { method: 'PUT' }); load(); }
        catch (e) { alert(e.message); }
      };
    });
    document.querySelectorAll('[data-reject]').forEach(b => {
      b.onclick = async (e) => {
        e.stopPropagation();
        const reason = prompt('请输入驳回原因（必填）:');
        if (!reason) return;
        try { await api(`/api/admin/items/${b.dataset.reject}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }); load(); }
        catch (e) { alert(e.message); }
      };
    });
  }

  (async () => {
    const cfg = await ensureConfig();
    if (!cfg.enableReview) {
      currentTab = 'CLAIM';
      document.querySelectorAll('[data-rtab]').forEach(b => b.classList.remove('active'));
      const activeBtn = document.querySelector('[data-rtab="CLAIM"]');
      if (activeBtn) activeBtn.classList.add('active');
    }
    load();
  })();
});

Router.register('adminManage', function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminManage');
  main.innerHTML = `
    <div class="filter-bar">
      <label>消息类型</label><select id="mType"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select>
      <label>物品类型</label><select id="mCat"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select>
      <label>地点</label><select id="mLoc"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
      <label>时间范围</label><select id="mTime"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select>
      <label>物品状态</label><select id="mStatus"><option value="">所有</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="MATCHED">已匹配</option><option value="CLAIMED">已认领</option><option value="ARCHIVED">已归档</option><option value="CANCELLED">已取消</option></select>
      <label>物品名查找</label><input type="text" id="mKeyword" />
      <span class="search-icon" id="mSearchBtn">&#128269;</span>
    </div>
    <div id="manageList"></div>
    <div id="managePager" class="pager"></div>
    <div id="statusModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1000;align-items:center;justify-content:center">
      <div style="background:#fff;padding:24px;border-radius:8px;min-width:280px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
        <div style="margin-bottom:12px;font-weight:bold">更改状态为:</div>
        <select id="statusModalSelect" style="width:100%;padding:8px 12px;margin-bottom:16px;border:1px solid #ddd;border-radius:4px;font-size:14px">
          <option value="APPROVED">未认领</option>
          <option value="MATCHED">已匹配</option>
          <option value="CLAIMED">已认领</option>
          <option value="ARCHIVED">已归档</option>
        </select>
        <button id="statusModalConfirm" class="btn-sm" style="width:100%;background:#333;color:#fff;border:1px solid #333;padding:8px">确认</button>
      </div>
    </div>
    <div id="archiveModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1001;align-items:center;justify-content:center">
      <div style="background:#fff;padding:18px 20px;min-width:540px;max-width:92%;position:relative;border:1px solid #ddd">
        <div id="archiveCloseBtn" style="position:absolute;right:12px;top:8px;font-size:34px;font-weight:bold;line-height:1;cursor:pointer">×</div>
        <div style="font-size:36px;font-weight:bold;line-height:1;margin:6px 0 20px">物品处理方式填写：</div>
        <select id="archiveMethodSelect" style="width:150px;padding:8px;border:1px solid #999;margin-bottom:20px">
          <option value="自行处理">自行处理</option>
          <option value="统一销毁">统一销毁</option>
          <option value="存储点存放">存储点存放</option>
        </select>
        <div style="font-size:34px;font-weight:bold;line-height:1;margin:0 0 18px">填写具体地点以及照片：</div>
        <input id="archiveLocationInput" style="width:360px;padding:8px;border:1px solid #999;margin-bottom:20px" />
        <div id="archiveImgBox" style="display:flex;gap:18px;align-items:center"></div>
        <div id="archiveError" style="color:#e74c3c;min-height:18px;margin-top:10px"></div>
        <div style="text-align:right;margin-top:10px">
          <button class="btn-sm btn-danger" id="archiveConfirmBtn">确认归档</button>
        </div>
      </div>
    </div>
    <div id="archiveGuardModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1002;align-items:center;justify-content:center">
      <div style="background:#fff;padding:24px;border-radius:8px;min-width:420px;max-width:90%;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
        <div style="font-size:30px;color:#333;text-align:center;margin:6px 0 30px;font-weight:bold">消息存在尚未超过规定天数，是否归档?</div>
        <div style="display:flex;justify-content:space-between;gap:20px">
          <button class="btn-sm" id="archiveGuardYes" style="flex:1;min-height:42px;font-size:24px;font-weight:bold">是</button>
          <button class="btn-sm" id="archiveGuardNo" style="flex:1;min-height:42px;font-size:24px;font-weight:bold">否</button>
        </div>
      </div>
    </div>
  `;

  let pg = 0;
  let claimExpireDays = 30;
  const itemMap = new Map();
  let archiveUploadedUrls = [];

  function renderArchiveImageSlots() {
    const box = document.getElementById('archiveImgBox');
    if (!box) return;
    const slots = [];
    for (let i = 0; i < 2; i++) {
      const url = archiveUploadedUrls[i];
      if (url) {
        slots.push(`
          <div style="position:relative;width:130px;height:130px;border:1px dashed #ddd;display:flex;align-items:center;justify-content:center">
            <img src="${imgUrl(url)}" style="width:100%;height:100%;object-fit:cover" />
            <span data-archive-rm="${esc(url)}" style="position:absolute;top:-8px;right:-8px;background:#e74c3c;color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer">×</span>
          </div>
        `);
      } else {
        slots.push(`
          <label style="width:130px;height:130px;border:1px dashed #ddd;display:flex;align-items:center;justify-content:center;font-size:52px;cursor:pointer;line-height:1">+
            <input type="file" accept="image/*" data-archive-upload="${i}" style="display:none" />
          </label>
        `);
      }
    }
    box.innerHTML = slots.join('');
  }

  async function uploadArchiveImage(file) {
    const formData = new FormData();
    formData.append('files', file);
    const token = Auth.getToken();
    const res = await fetch(API_BASE + '/api/files/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData
    });
    const d = await res.json();
    if (!res.ok || d.success === false) throw new Error(d.message || '上传失败');
    const urls = d.data || [];
    if (!urls.length) throw new Error('上传失败');
    return urls[0];
  }

  (async () => {
    try {
      const cfg = await getConfig();
      if (cfg && cfg.claimExpireDays && Number(cfg.claimExpireDays) > 0) {
        claimExpireDays = Number(cfg.claimExpireDays);
      }
    } catch (_) {}
  })();

  function daysSinceLastAction(item) {
    const base = item?.updatedAt || item?.createdAt;
    if (!base) return 0;
    const ts = new Date(base).getTime();
    if (Number.isNaN(ts)) return 0;
    return Math.max(0, Math.floor((Date.now() - ts) / 86400000));
  }

  function openArchiveModal(itemId) {
    const archiveModal = document.getElementById('archiveModal');
    archiveModal._itemId = itemId;
    archiveUploadedUrls = [];
    document.getElementById('archiveMethodSelect').value = '自行处理';
    document.getElementById('archiveLocationInput').value = '';
    document.getElementById('archiveError').textContent = '';
    renderArchiveImageSlots();
    archiveModal.style.display = 'flex';
  }

  function openArchiveGuardModal(itemId) {
    const guard = document.getElementById('archiveGuardModal');
    guard._itemId = itemId;
    guard.style.display = 'flex';
  }

  function closeArchiveGuardModal() {
    const guard = document.getElementById('archiveGuardModal');
    guard._itemId = null;
    guard.style.display = 'none';
  }

  function startArchiveFlow(itemId) {
    const item = itemMap.get(String(itemId));
    if (!item) return;
    const daysSince = daysSinceLastAction(item);
    if (daysSince < claimExpireDays) {
      openArchiveGuardModal(itemId);
      return;
    }
    if (item.type === 'FOUND') {
      openArchiveModal(itemId);
      return;
    }
    submitArchive(itemId, { method: '', location: '', imageUrls: '' }).catch(err => alert(err.message));
  }

  async function submitArchive(itemId, payload) {
    await api(`/api/admin/items/${itemId}/archive`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    const archiveModal = document.getElementById('archiveModal');
    archiveModal.style.display = 'none';
    load();
  }

  fillCategorySelect('mCat');
  async function load() {
    const type = document.getElementById('mType').value;
    const cat = document.getElementById('mCat').value;
    const loc = document.getElementById('mLoc').value;
    const status = document.getElementById('mStatus').value;
    const kw = document.getElementById('mKeyword').value.trim();
    try {
      const data = await api(`/api/admin/items?keyword=${encodeURIComponent(kw)}&type=${type}&category=${encodeURIComponent(cat)}&location=${encodeURIComponent(loc)}&status=${status}&page=${pg}&size=8`);
      const page = data.data;
      const list = page.content || [];
      itemMap.clear();
      list.forEach(item => itemMap.set(String(item.id), item));
      document.getElementById('manageList').innerHTML = list.length === 0
        ? '<p class="empty">暂无数据</p>'
        : list.map(item => {
          const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
          const isLost = item.type === 'LOST';
          const showArchiveDetail = item.status === 'ARCHIVED' && item.type === 'FOUND';
          const daysSince = daysSinceLastAction(item);
          return `
            <div class="manage-card">
              <div class="item-card-row" style="border:none;padding:0;margin:0;cursor:default">
                <div class="card-left">
                  <div class="item-type-label">${isLost ? '寻物启事' : '失物招领'}</div>
                  <div class="item-status">目前进度：${statusLabel(item.status)}</div>
                  <div class="item-info">
                    <div>物品名称：${esc(item.title)}</div>
                    <div>物品类型：${esc(item.category || '-')}</div>
                    <div>${isLost ? '丢失' : '拾取'}地点：${esc(item.location || '-')}</div>
                    <div>${isLost ? '丢失' : '拾得'}时间：${esc(item.lostTime || '-')}</div>
                    ${showArchiveDetail ? `<div>处理方式：${esc(item.archiveMethod || '自行处理')}</div>` : ''}
                    ${showArchiveDetail ? `<div>处理地点：${esc(item.archiveLocation || '-')}</div>` : ''}
                  </div>
                </div>
                <div class="card-right">
                  ${imgs.length > 0 ? imgs.slice(0, 2).map(u => imgTag(u, 100, 80)).join('') : '<div class="img-placeholder">暂无</div><div class="img-placeholder">暂无</div>'}
                  <div class="card-time">发布时间：${fmtTime(item.createdAt)}</div>
                </div>
              </div>
              <div class="days-info">
                <div>该物品距离最近操作已有 <b>${daysSince}</b> 天</div>
                <div>目前进行到 <b>${statusLabel(item.status)}</b> 阶段</div>
                ${daysSince >= claimExpireDays && item.status !== 'CANCELLED' ? '<div style="color:#e74c3c">该物品距离最近操作已有 ' + daysSince + ' 天，符合归档标准！</div>' : ''}
              </div>
              <div class="manage-actions">
                ${item.status === 'CANCELLED' ? '<span style="color:#888;font-size:13px">已取消，无法管理</span>' : `<button class="btn-sm" data-mstatus="${item.id}">更改状态</button>`}
              </div>
            </div>
          `;
        }).join('');

      document.querySelectorAll('[data-mstatus]').forEach(btn => {
        btn.onclick = () => {
          const modal = document.getElementById('statusModal');
          const select = document.getElementById('statusModalSelect');
          modal._itemId = btn.dataset.mstatus;
          select.value = 'APPROVED';
          modal.style.display = 'flex';
        };
      });

      renderPager(document.getElementById('managePager'), pg, page.totalPages || 1, p => { pg = p; load(); });
    } catch (e) {
      document.getElementById('manageList').innerHTML = `<p class="empty">${e.message}</p>`;
    }
  }

  document.getElementById('mSearchBtn').onclick = () => { pg = 0; load(); };
  ['mType', 'mCat', 'mLoc', 'mTime', 'mStatus'].forEach(id => {
    document.getElementById(id).onchange = () => { pg = 0; load(); };
  });
  document.getElementById('mKeyword').onkeydown = e => { if (e.key === 'Enter') { pg = 0; load(); } };

  document.getElementById('statusModalConfirm').onclick = async () => {
    const modal = document.getElementById('statusModal');
    const itemId = modal._itemId;
    if (!itemId) return;
    const newStatus = document.getElementById('statusModalSelect').value;
    if (newStatus === 'ARCHIVED') {
      modal.style.display = 'none';
      startArchiveFlow(itemId);
      return;
    }
    try {
      await api(`/api/admin/items/${itemId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      modal.style.display = 'none';
      load();
    } catch (e) {
      alert(e.message);
    }
  };
  document.getElementById('statusModal').addEventListener('click', function (e) {
    if (e.target === this) this.style.display = 'none';
  });

  document.getElementById('archiveCloseBtn').onclick = () => {
    document.getElementById('archiveModal').style.display = 'none';
  };

  document.getElementById('archiveImgBox').addEventListener('change', async (e) => {
    const input = e.target.closest('input[data-archive-upload]');
    if (!input || !input.files || !input.files.length) return;
    try {
      const url = await uploadArchiveImage(input.files[0]);
      if (archiveUploadedUrls.length < 2) {
        archiveUploadedUrls.push(url);
      }
      renderArchiveImageSlots();
    } catch (err) {
      document.getElementById('archiveError').textContent = err.message;
    }
  });

  document.getElementById('archiveImgBox').addEventListener('click', (e) => {
    const rm = e.target.closest('[data-archive-rm]');
    if (!rm) return;
    archiveUploadedUrls = archiveUploadedUrls.filter(u => u !== rm.dataset.archiveRm);
    renderArchiveImageSlots();
  });

  document.getElementById('archiveConfirmBtn').onclick = async () => {
    const archiveModal = document.getElementById('archiveModal');
    const itemId = archiveModal._itemId;
    if (!itemId) return;
    const method = document.getElementById('archiveMethodSelect').value;
    const location = (document.getElementById('archiveLocationInput').value || '').trim();
    if (!method.trim()) {
      document.getElementById('archiveError').textContent = '请选择处理方式';
      return;
    }
    try {
      await submitArchive(itemId, {
        method,
        location,
        imageUrls: archiveUploadedUrls.join(',')
      });
    } catch (e) {
      document.getElementById('archiveError').textContent = e.message;
    }
  };
  document.getElementById('archiveModal').addEventListener('click', function (e) {
    if (e.target === this) this.style.display = 'none';
  });

  document.getElementById('archiveGuardYes').onclick = () => {
    const guard = document.getElementById('archiveGuardModal');
    const itemId = guard._itemId;
    closeArchiveGuardModal();
    if (!itemId) return;
    const item = itemMap.get(String(itemId));
    if (!item) return;
    if (item.type === 'FOUND') {
      openArchiveModal(itemId);
      return;
    }
    submitArchive(itemId, { method: '', location: '', imageUrls: '' }).catch(err => alert(err.message));
  };
  document.getElementById('archiveGuardNo').onclick = () => {
    closeArchiveGuardModal();
  };
  document.getElementById('archiveGuardModal').addEventListener('click', function (e) {
    if (e.target === this) closeArchiveGuardModal();
  });

  load();
});

Router.register('adminMaintain', async function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminMaintain');
  main.innerHTML = `
    <div class="tab-bar">
      <button class="tab-btn" data-mtab="update">更新信息</button>
      <button class="tab-btn" data-mtab="overview">消息总览</button>
      <button class="tab-btn" data-mtab="filter">筛选统计</button>
    </div>
    <div id="maintainContent"></div>
  `;

  let currentTab = sessionStorage.getItem('adminMaintainTab') || 'update';
  document.querySelectorAll('[data-mtab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mtab === currentTab);
    btn.onclick = () => {
      document.querySelectorAll('[data-mtab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.mtab;
      sessionStorage.setItem('adminMaintainTab', currentTab);
      renderTab();
    };
  });

  async function renderTab() {
    sessionStorage.setItem('adminMaintainTab', currentTab);
    const box = document.getElementById('maintainContent');
    if (currentTab === 'update') {
      box.innerHTML = `
        <div class="filter-bar">
          <label>消息类型</label><select id="muType"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select>
          <label>物品类型</label><select id="muCat"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select>
          <label>地点</label><select id="muLoc"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
          <label>时间范围</label><select id="muTime"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select>
          <label>物品状态</label><select id="muStatus"><option value="">所有</option><option value="PENDING">待审核</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="REJECTED">已驳回</option><option value="MATCHED">已匹配</option><option value="CLAIMED">已认领</option><option value="ARCHIVED">已归档</option><option value="CANCELLED">已取消</option></select>
          <label>物品名查找</label><input type="text" id="muKeyword" />
          <span class="search-icon" id="muSearchBtn">&#128269;</span>
        </div>
        <div id="maintainList"></div>
        <div id="maintainPager" class="pager"></div>
      `;

      let pg = 0;
      fillCategorySelect('muCat');
      async function load() {
        const type = document.getElementById('muType').value;
        const cat = document.getElementById('muCat').value;
        const loc = document.getElementById('muLoc').value;
        const status = document.getElementById('muStatus').value;
        const kw = document.getElementById('muKeyword').value.trim();
        try {
          const data = await api(`/api/admin/items?keyword=${encodeURIComponent(kw)}&type=${type}&category=${encodeURIComponent(cat)}&location=${encodeURIComponent(loc)}&status=${status}&page=${pg}&size=8`);
          const page = data.data;
          const list = page.content || [];
          document.getElementById('maintainList').innerHTML = list.length === 0
            ? '<p class="empty">暂无数据</p>'
            : list.map(item => itemCardHtml(item)).join('');
          document.querySelectorAll('#maintainList .item-card-row[data-id]').forEach(c => {
            c.onclick = () => Router.go('adminEditItem', { id: c.dataset.id });
          });
          renderPager(document.getElementById('maintainPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
        } catch (e) {
          document.getElementById('maintainList').innerHTML = `<p class="empty">${e.message}</p>`;
          document.getElementById('maintainPager').innerHTML = '';
        }
      }

      document.getElementById('muSearchBtn').onclick = () => { pg = 0; load(); };
      ['muType', 'muCat', 'muLoc', 'muTime', 'muStatus'].forEach(id => {
        document.getElementById(id).onchange = () => { pg = 0; load(); };
      });
      document.getElementById('muKeyword').onkeydown = e => { if (e.key === 'Enter') { pg = 0; load(); } };
      load();
      return;
    }
    if (currentTab === 'overview') {
      box.innerHTML = '<p>加载中...</p>';
      try {
        const data = await api('/api/admin/stats/overview');
        const s = data.data || {};
        const monthly = s.monthlyStats || [];
        const statusCounts = s.statusCounts || {};
        const rate = (s.claimRate || 0).toFixed(1);
        const pieData = [
          { label: '未匹配', value: statusCounts.APPROVED || 0, color: '#4cb8c4' },
          { label: '已匹配', value: statusCounts.MATCHED || 0, color: '#7f8c8d' },
          { label: '已认领', value: statusCounts.CLAIMED || 0, color: '#2ecc71' },
          { label: '已归档', value: statusCounts.ARCHIVED || 0, color: '#f39c12' }
        ];
        const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0);

        function polar(cx, cy, r, ang) {
          const a = (ang - 90) * Math.PI / 180.0;
          return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
        }
        function arcPath(cx, cy, r, start, end) {
          const s = polar(cx, cy, r, end);
          const e = polar(cx, cy, r, start);
          const large = end - start <= 180 ? 0 : 1;
          return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
        }
        function pieSvg() {
          if (pieTotal === 0) {
            return `<svg width="220" height="220" viewBox="0 0 220 220"><circle cx="110" cy="110" r="90" fill="#e0e0e0"></circle></svg>`;
          }
          let start = 0;
          const parts = pieData.map(d => {
            const angle = (d.value / pieTotal) * 360;
            const path = arcPath(110, 110, 90, start, start + angle);
            start += angle;
            return `<path d="${path}" fill="${d.color}"></path>`;
          }).join('');
          return `<svg width="220" height="220" viewBox="0 0 220 220">${parts}</svg>`;
        }

        const maxMonthly = monthly.reduce((m, x) => Math.max(m, x.total || 0), 0);
        const bars = monthly.map(m => {
          const h = maxMonthly === 0 ? 0 : Math.round((m.total || 0) / maxMonthly * 160);
          return `
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
              <div style="width:28px;height:${h}px;background:#000"></div>
              <div style="font-size:12px">${m.label || ''}</div>
            </div>
          `;
        }).join('');
        const monthLines = monthly.map(m => {
          return `<div>${m.label || ''}：${m.lost || 0} 条失物 + ${m.found || 0} 条寻物</div>`;
        }).join('');

        box.innerHTML = `
          <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
            <div style="background:#d9d9d9;padding:18px 22px;min-width:360px">
              <div style="font-weight:bold;margin-bottom:10px">数据统计：</div>
              <div>总发布消息数量：${s.totalItems || 0}</div>
              <div>总失物招领数量：${s.foundCount || 0}</div>
              <div>总寻物启事数量：${s.lostCount || 0}</div>
              <div>已匹配消息数量：${s.matchedItems || 0}</div>
              <div>已认领消息数量：${s.claimedItems || 0}</div>
              <div>已归档消息数量：${s.archivedItems || 0}</div>
              <div>认领率：${rate}%</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px;min-width:260px">
              ${pieSvg()}
              <div style="font-weight:bold">失物招领消息状态饼图</div>
            </div>
          </div>
          <div style="margin-top:26px;font-weight:bold">近一年截至目前的统计数据</div>
          <div style="display:flex;gap:24px;align-items:flex-start;margin-top:12px;flex-wrap:wrap">
            <div style="background:#fff;border:1px solid #ddd;padding:20px 20px 16px;min-width:360px">
              <div style="display:flex;align-items:flex-end;gap:14px;height:200px">${bars}</div>
              <div style="text-align:center;margin-top:10px;font-weight:bold">每月发布消息条形图</div>
            </div>
            <div style="background:#d9d9d9;padding:16px 20px;min-width:300px">
              <div style="border:1px solid #f39c12;padding:10px 12px;line-height:1.8">${monthLines}</div>
            </div>
          </div>
        `;
      } catch (e) {
        box.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
      }
      return;
    }
    if (currentTab === 'filter') {
      box.innerHTML = `
        <button class="btn-outline" id="mfExportBtn" style="margin-bottom:12px">导出统计数据</button>
        <div class="filter-bar">
          <label>消息类型</label><select id="mfType"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option></select>
          <label>物品类型</label><select id="mfCat"><option value="">所有</option><option value="证件">证件</option><option value="电子产品">电子产品</option><option value="生活用品">生活用品</option><option value="文体">文体</option><option value="书籍">书籍</option><option value="其他">其他</option></select>
          <label>地点</label><select id="mfLoc"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
          <label>物品状态</label><select id="mfStatus"><option value="">所有</option><option value="PENDING">待审核</option><option value="CLAIM_ADMIN_REVIEW">管理员审核申请中</option><option value="CLAIM_OWNER_REVIEW">发布人审核申请中</option><option value="APPROVED">未匹配</option><option value="REJECTED">已驳回</option><option value="MATCHED">已匹配</option><option value="CLAIMED">已认领</option><option value="ARCHIVED">已归档</option><option value="CANCELLED">已取消</option></select>
          <label>时间范围</label><select id="mfTime"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select>
          <label>物品名查找</label><input type="text" id="mfKeyword" />
          <span class="search-icon" id="mfSearchBtn">&#128269;</span>
        </div>
        <div id="mfList"></div>
        <div id="mfPager" class="pager"></div>
      `;

      let pg = 0;
      fillCategorySelect('mfCat');

      function buildFilterParams(pageIndex, pageSize) {
        const type = document.getElementById('mfType').value;
        const cat = document.getElementById('mfCat').value;
        const loc = document.getElementById('mfLoc').value;
        const status = document.getElementById('mfStatus').value;
        const time = document.getElementById('mfTime').value;
        const kw = document.getElementById('mfKeyword').value.trim();
        const params = new URLSearchParams({
          keyword: kw,
          type,
          category: cat,
          location: loc,
          status,
          page: String(pageIndex),
          size: String(pageSize)
        });
        if (time) params.set('time', time);
        return params;
      }

      function csvEscape(val) {
        const s = String(val == null ? '' : val);
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      }

      async function load() {
        try {
          const params = buildFilterParams(pg, 8);
          const data = await api(`/api/admin/items?${params.toString()}`);
          const page = data.data;
          const list = page.content || [];
          document.getElementById('mfList').innerHTML = list.length === 0
            ? '<p class="empty">暂无数据</p>'
            : list.map(item => itemCardHtml(item)).join('');
          document.querySelectorAll('#mfList .item-card-row[data-id]').forEach(c => {
            c.onclick = () => Router.go('detail', { id: c.dataset.id });
          });
          renderPager(document.getElementById('mfPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
        } catch (e) {
          document.getElementById('mfList').innerHTML = `<p class="empty">${e.message}</p>`;
          document.getElementById('mfPager').innerHTML = '';
        }
      }

      document.getElementById('mfExportBtn').onclick = async () => {
        const btn = document.getElementById('mfExportBtn');
        const oldText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '导出中...';
        try {
          const pageSize = 200;
          const firstData = await api(`/api/admin/items?${buildFilterParams(0, pageSize).toString()}`);
          const firstPage = firstData.data || {};
          const totalPages = firstPage.totalPages || 1;
          const all = [...(firstPage.content || [])];

          for (let p = 1; p < totalPages; p++) {
            const d = await api(`/api/admin/items?${buildFilterParams(p, pageSize).toString()}`);
            const page = d.data || {};
            all.push(...(page.content || []));
          }

          if (all.length === 0) {
            alert('当前筛选条件下无可导出数据');
            return;
          }

          const headers = ['物品ID', '消息类型', '物品名称', '物品类型', '地点', '时间', '当前进度', '联系人', '联系方式', '发布时间'];
          const rows = all.map(item => [
            item.id || '',
            item.type === 'LOST' ? '寻物启事' : '失物招领',
            item.title || '',
            item.category || '',
            item.location || '',
            item.lostTime || '',
            statusLabel(item.status || ''),
            item.contactName || '',
            item.contactPhone || '',
            fmtTime(item.createdAt)
          ]);

          const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const now = new Date();
          const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
          a.href = url;
          a.download = `管理员筛选统计_${stamp}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          alert(e.message || '导出失败');
        } finally {
          btn.disabled = false;
          btn.textContent = oldText;
        }
      };

      document.getElementById('mfSearchBtn').onclick = () => { pg = 0; load(); };
      ['mfType', 'mfCat', 'mfLoc', 'mfStatus', 'mfTime'].forEach(id => {
        document.getElementById(id).onchange = () => { pg = 0; load(); };
      });
      document.getElementById('mfKeyword').onkeydown = e => { if (e.key === 'Enter') { pg = 0; load(); } };
      load();
      return;
    }
  }

  renderTab();
});

Router.register('adminEditItem', async function (app, params) {
  const main = renderLayout(app, 'ADMIN', 'adminMaintain');
  main.innerHTML = '<p>加载中...</p>';

  try {
    const data = await api(`/api/items/${params.id}`);
    const item = data.data;
    const isLost = item.type === 'LOST';
    const canEdit = item.status !== 'ARCHIVED' && item.status !== 'CLAIMED';
    const dis = canEdit ? '' : 'disabled';
    const locLabel = isLost ? '丢失大致地点' : '拾取具体地点';
    const timeLabel = isLost ? '丢失大致时间' : '拾取时间';
    const campusLabel = isLost ? '丢失校区' : '拾取校区';
    const existingImgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
    const locParts = (item.location || '').split(' — ');
    const campusVal = locParts.length > 1 ? locParts[0] : '';
    const specificLoc = locParts.length > 1 ? locParts.slice(1).join(' — ') : (item.location || '');

    main.innerHTML = `
      <div class="publish-form">
        <span class="back-arrow" id="backMaintain">&#x21A9;</span>
        <h3>修改发布信息 ${canEdit ? '' : '<span style="color:#888;font-size:13px">（已归档/已认领，无法修改）</span>'}</h3>
        <div class="form-group"><label>物品名称 <span class="req">*</span>:</label><input id="eTitle" value="${esc(item.title || '')}" ${dis} /></div>
        <div class="form-group"><label>${esc(locLabel)} <span class="req">*</span>:</label><input id="eLocation" value="${esc(specificLoc)}" ${dis} /></div>
        <div class="form-group"><label>${esc(timeLabel)} <span class="req">*</span>:</label><input id="eLostTime" value="${esc(item.lostTime || '')}" ${dis} /></div>
        ${isLost ? `<div class="form-group"><label>悬赏（可选）：</label><input id="eReward" type="number" value="${item.reward || ''}" ${dis} /></div>` : `<div class="form-group"><label>领取地点：</label><input id="eStorage" value="${esc(item.storageLocation || '')}" ${dis} /></div>`}
        <div class="form-group"><label>物品介绍 <span class="req">*</span>:</label><textarea id="eDesc" ${dis}>${esc(item.description || '')}</textarea></div>
        <div class="form-group"><label>${esc(campusLabel)} <span class="req">*</span>:</label>
          <select id="eCampus" ${dis}>
            <option value="朝晖校区" ${campusVal.includes('朝晖') ? 'selected' : ''}>朝晖校区</option>
            <option value="屏峰校区" ${campusVal.includes('屏峰') ? 'selected' : ''}>屏峰校区</option>
            <option value="莫干山校区" ${campusVal.includes('莫干山') ? 'selected' : ''}>莫干山校区</option>
          </select>
        </div>
        <div class="form-group"><label>物品类型 <span class="req">*</span>:</label>
          <select id="eCategory" ${dis}>
            <option value="文体" ${item.category === '文体' ? 'selected' : ''}>文体</option>
            <option value="证件" ${item.category === '证件' ? 'selected' : ''}>证件</option>
            <option value="电子产品" ${item.category === '电子产品' ? 'selected' : ''}>电子产品</option>
            <option value="生活用品" ${item.category === '生活用品' ? 'selected' : ''}>生活用品</option>
            <option value="书籍" ${item.category === '书籍' ? 'selected' : ''}>书籍</option>
            <option value="其他" ${item.category === '其他' ? 'selected' : ''}>其他</option>
          </select>
        </div>
        <div class="form-group">
          <label>图片${canEdit ? '' : '（不可修改）'}：</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap" id="eImgBox">
            ${existingImgs.map(u => `<div style="position:relative;width:80px;height:80px" class="eimg-wrap"><img src="${imgUrl(u)}" style="width:80px;height:80px;object-fit:cover;border:1px solid #ccc" />${canEdit ? `<span style="position:absolute;top:-6px;right:-6px;background:#e74c3c;color:#fff;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer" data-ermurl="${esc(u)}">&times;</span>` : ''}</div>`).join('')}
            ${canEdit && existingImgs.length < 3 ? `<label class="upload-area" id="eUploadLabel">+<input type="file" id="eImgInput" accept="image/*" multiple style="display:none" /></label>` : ''}
          </div>
        </div>
        <div class="form-group"><label>联系人名称/班级 <span class="req">*</span>:</label><input id="eContact" value="${esc(item.contactName || '')}" ${dis} /></div>
        <div class="form-group"><label>联系方式 <span class="req">*</span>:</label><input id="ePhone" value="${esc(item.contactPhone || '')}" ${dis} /></div>
        <div class="form-actions">
          <button class="btn-outline" id="eCancelBtn">取消</button>
          <button class="btn-primary" id="eSaveBtn" ${canEdit ? '' : 'disabled'}>保存修改</button>
        </div>
        <p id="eMsg" class="msg"></p>
      </div>
    `;

    let editImgUrls = [...existingImgs];
    const eImgBox = document.getElementById('eImgBox');

    if (canEdit) {
      const eImgInput = document.getElementById('eImgInput');
      const eUploadLabel = document.getElementById('eUploadLabel');

      if (eImgInput) {
        eImgInput.onchange = async () => {
          const files = eImgInput.files;
          if (!files || files.length === 0) return;
          const remaining = 3 - editImgUrls.length;
          if (remaining <= 0) return;
          const formData = new FormData();
          for (let i = 0; i < Math.min(files.length, remaining); i++) formData.append('files', files[i]);
          try {
            const token = Auth.getToken();
            const res = await fetch(API_BASE + '/api/files/upload', { method: 'POST', headers: token ? { 'Authorization': 'Bearer ' + token } : {}, body: formData });
            const d = await res.json();
            if (!res.ok || d.success === false) throw new Error(d.message || '上传失败');
            (d.data || []).forEach(url => {
              if (editImgUrls.length >= 3) return;
              editImgUrls.push(url);
              const wrap = document.createElement('div');
              wrap.className = 'eimg-wrap';
              wrap.style.cssText = 'position:relative;width:80px;height:80px;';
              wrap.innerHTML = '<img src="' + imgUrl(url) + '" style="width:80px;height:80px;object-fit:cover;border:1px solid #ccc" /><span style="position:absolute;top:-6px;right:-6px;background:#e74c3c;color:#fff;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer" data-ermurl="' + url + '">&times;</span>';
              eImgBox.insertBefore(wrap, eUploadLabel);
            });
            if (editImgUrls.length >= 3 && eUploadLabel) eUploadLabel.style.display = 'none';
          } catch (e) { alert(e.message); }
          eImgInput.value = '';
        };
      }

      eImgBox.addEventListener('click', (e) => {
        const rm = e.target.closest('[data-ermurl]');
        if (!rm) return;
        editImgUrls = editImgUrls.filter(u => u !== rm.dataset.ermurl);
        rm.parentElement.remove();
        if (eUploadLabel) eUploadLabel.style.display = '';
      });
    }

    document.getElementById('backMaintain').onclick = () => Router.go('adminMaintain');
    document.getElementById('eCancelBtn').onclick = () => Router.go('adminMaintain');
    document.getElementById('eSaveBtn').onclick = async () => {
      try {
        const body = {
          title: document.getElementById('eTitle').value,
          location: document.getElementById('eCampus').value + ' — ' + document.getElementById('eLocation').value,
          lostTime: document.getElementById('eLostTime').value,
          category: document.getElementById('eCategory').value,
          contactName: document.getElementById('eContact').value,
          contactPhone: document.getElementById('ePhone').value,
          imageUrls: editImgUrls.join(','),
          description: document.getElementById('eDesc').value,
          features: ''
        };
        const rw = document.getElementById('eReward');
        if (rw) body.reward = rw.value ? parseFloat(rw.value) : null;
        const st = document.getElementById('eStorage');
        if (st) body.storageLocation = st.value;
        await api(`/api/admin/items/${item.id}`, { method: 'PUT', body: JSON.stringify(body) });
        document.getElementById('eMsg').textContent = '修改成功';
        document.getElementById('eMsg').className = 'msg msg-ok';
        setTimeout(() => Router.go('adminMaintain'), 800);
      } catch (e) {
        document.getElementById('eMsg').textContent = e.message;
        document.getElementById('eMsg').className = 'msg msg-err';
      }
    };
  } catch (e) {
    main.innerHTML = `<p class="msg msg-err">${e.message}</p>`;
  }
});

Router.register('adminHistory', function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminHistory');
  main.innerHTML = `
    <h2 style="text-align:center;margin-bottom:20px">历史审核记录</h2>
    <div class="filter-bar">
      <label>消息类型</label><select id="ahType"><option value="">所有</option><option value="LOST">寻物启事</option><option value="FOUND">失物招领</option><option value="CLAIM">申请</option></select>
      <label>地点</label><select id="ahLoc"><option value="">所有</option><option value="朝晖校区">朝晖校区</option><option value="屏峰校区">屏峰校区</option><option value="莫干山校区">莫干山校区</option></select>
      <label>时间范围</label><select id="ahTime"><option value="">所有</option><option value="7">近7天</option><option value="30">近30天</option><option value="90">近90天</option></select>
      <label>物品名查找</label><input type="text" id="ahKeyword" />
      <span class="search-icon" id="ahSearchBtn">&#128269;</span>
    </div>
    <div id="ahList"></div>
    <div id="ahPager" class="pager"></div>
  `;

  let pg = 0;
  function reviewCardHtml(r) {
    const item = r.item || {};
    const claim = r.claim || {};
    const isLost = item.type === 'LOST';
    const typeLabel = r.type === 'CLAIM' ? '申请' : (isLost ? '寻物启事' : '失物招领');
    const locLabel = isLost ? '丢失地点' : '拾取地点';
    const timeLabel = isLost ? '丢失时间' : '拾得时间';
    const imgs = item.imageUrls ? item.imageUrls.split(',').filter(Boolean) : [];
    const resultLabel = r.result === 'REJECTED' ? '驳回' : '通过';
    const reason = r.result === 'REJECTED'
      ? (r.type === 'CLAIM' ? claim.rejectReason : item.rejectReason)
      : '';
    const claimInfo = r.type === 'CLAIM'
      ? `
        <div>申请人：${esc(claim.claimer?.username || '-')}</div>
        <div>申请留言：${esc(claim.message || claim.proof || '-')}</div>
      `
      : '';
    return `
      <div style="border:1px solid #ddd;margin-bottom:12px">
        <div class="item-card-row" style="border:none;margin:0;cursor:pointer" data-id="${item.id || ''}">
          <div class="card-left">
            <div class="item-type-label">${esc(typeLabel)}</div>
            <div class="item-info">
              <div>物品名称：${esc(item.title || '-')}</div>
              <div>物品类型：${esc(item.category || '-')}</div>
              <div>${locLabel}：${esc(item.location || '-')}</div>
              <div>${timeLabel}：${esc(item.lostTime || '-')}</div>
              ${claimInfo}
            </div>
          </div>
          <div class="card-right-wrap">
            <div class="card-images">
              ${imgs.length > 0 ? imgs.slice(0, 2).map(u => imgTag(u, 100, 80)).join('') : '<div class="img-placeholder">暂无图片</div><div class="img-placeholder">暂无图片</div>'}
            </div>
            <div class="card-time">审核时间：${fmtTime(r.reviewTime)}</div>
          </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid #eee">
          <div><b>审核结果：</b>${resultLabel}</div>
          ${r.result === 'REJECTED' ? `<div><b>原因：</b>${esc(reason || '-')}</div>` : ''}
        </div>
      </div>
    `;
  }
  async function load() {
    try {
      const type = document.getElementById('ahType').value;
      const loc = document.getElementById('ahLoc').value;
      const time = document.getElementById('ahTime').value;
      const kw = document.getElementById('ahKeyword').value.trim();
      const params = new URLSearchParams({ type, location: loc, keyword: kw, page: String(pg), size: '8' });
      if (time) params.set('time', time);
      const data = await api(`/api/admin/reviews/history?${params.toString()}`);
      const page = data.data;
      const list = page.content || [];
      document.getElementById('ahList').innerHTML = list.length === 0
        ? '<p class="empty">暂无历史审核记录</p>'
        : list.map(r => reviewCardHtml(r)).join('');
      document.querySelectorAll('.item-card-row[data-id]').forEach(c => {
        c.onclick = () => c.dataset.id && Router.go('detail', { id: c.dataset.id });
      });
      renderPager(document.getElementById('ahPager'), pg, page.totalPages || 1, p => { pg = p; load(); });
    } catch (e) {
      document.getElementById('ahList').innerHTML = `<p class="empty">${e.message}</p>`;
    }
  }
  document.getElementById('ahSearchBtn').onclick = () => { pg = 0; load(); };
  ['ahType', 'ahLoc', 'ahTime'].forEach(id => {
    document.getElementById(id).onchange = () => { pg = 0; load(); };
  });
  load();
});

Router.register('adminRegionAnno', function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminRegionAnno');
  const region = Auth.getRegion() || '';
  main.innerHTML = `
    <div style="max-width:700px">
      <div style="font-size:18px;font-weight:bold;margin-bottom:18px">发送地区：</div>
      <div class="form-group">
        <select id="regionAnnoRegion" style="width:240px">
          <option value="朝晖校区">朝晖校区</option>
          <option value="屏峰校区">屏峰校区</option>
          <option value="莫干山校区">莫干山校区</option>
        </select>
      </div>
      <div class="form-group">
        <label>标题:</label>
        <input id="regionAnnoTitle" style="width:420px" />
      </div>
      <div class="form-group">
        <label>内容:</label>
        <textarea id="regionAnnoContent" style="width:520px;min-height:220px"></textarea>
      </div>
      <div style="display:flex;justify-content:space-between;max-width:520px;margin-top:30px">
        <button class="btn-outline" id="regionAnnoClear">删除</button>
        <button class="btn-outline" id="regionAnnoSend">发送</button>
      </div>
      <p id="regionAnnoMsg" class="msg" style="margin-top:12px"></p>
    </div>
    <div id="regionAnnoConfirm" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1000;align-items:center;justify-content:center">
      <div style="background:#fff;padding:24px;border-radius:8px;min-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
        <div style="font-weight:bold;margin-bottom:8px">确认发送地区公告</div>
        <div style="font-size:13px;color:#666;margin-bottom:12px">发送后将对所属校区生效</div>
        <div style="text-align:right;margin-top:12px">
          <button class="btn-sm" id="regionAnnoCancel" style="margin-right:8px">取消</button>
          <button class="btn-sm btn-danger" id="regionAnnoConfirmSend">确认发送</button>
        </div>
      </div>
    </div>
  `;

  const confirmBox = document.getElementById('regionAnnoConfirm');
  document.getElementById('regionAnnoClear').onclick = () => {
    document.getElementById('regionAnnoTitle').value = '';
    document.getElementById('regionAnnoContent').value = '';
  };
  const regionSelect = document.getElementById('regionAnnoRegion');
  if (region) regionSelect.value = region;
  document.getElementById('regionAnnoSend').onclick = () => {
    document.getElementById('regionAnnoMsg').textContent = '';
    confirmBox.style.display = 'flex';
  };
  document.getElementById('regionAnnoCancel').onclick = () => { confirmBox.style.display = 'none'; };
  confirmBox.addEventListener('click', function (e) { if (e.target === this) this.style.display = 'none'; });
  document.getElementById('regionAnnoConfirmSend').onclick = async () => {
    try {
      const title = document.getElementById('regionAnnoTitle').value.trim();
      const content = document.getElementById('regionAnnoContent').value.trim();
      const region = document.getElementById('regionAnnoRegion').value;
      await api('/api/admin/announcements/region', { method: 'POST', body: JSON.stringify({ title, content, region }) });
      document.getElementById('regionAnnoMsg').textContent = '已提交审核';
      document.getElementById('regionAnnoMsg').className = 'msg msg-ok';
      confirmBox.style.display = 'none';
      document.getElementById('regionAnnoTitle').value = '';
      document.getElementById('regionAnnoContent').value = '';
    } catch (e) {
      document.getElementById('regionAnnoMsg').textContent = e.message;
      document.getElementById('regionAnnoMsg').className = 'msg msg-err';
    }
  };
});

Router.register('adminViewAnno', async function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminViewAnno');
  main.innerHTML = `
    <div class="tab-bar">
      <button class="tab-btn active" data-atab="global">全体公告</button>
      <button class="tab-btn" data-atab="region">地区公告</button>
    </div>
    <div id="adminAnnoList"></div>
  `;
  let currentTab = 'global';
  document.querySelectorAll('[data-atab]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-atab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.atab;
      load();
    };
  });
  async function load() {
    try {
      const region = Auth.getRegion() || '';
      const scope = currentTab === 'global' ? 'GLOBAL' : 'REGION';
      const qs = new URLSearchParams({ scope });
      if (scope === 'REGION' && region) qs.set('region', region);
      const data = await api(`/api/announcements?${qs.toString()}`);
      const list = data.data || [];
      document.getElementById('adminAnnoList').innerHTML = list.length === 0
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
      document.getElementById('adminAnnoList').innerHTML = '<p class="empty">暂无公告</p>';
    }
  }
  load();
});

Router.register('adminNotify', async function (app) {
  const main = renderLayout(app, 'ADMIN', 'adminNotify');
  main.innerHTML = '<div id="adminNotifyList"></div>';
  try {
    const data = await api('/api/notifications?page=0&size=8');
    const list = (data.data && data.data.content) ? data.data.content : (data.data || []);
    document.getElementById('adminNotifyList').innerHTML = list.length === 0
      ? '<p class="empty">暂无系统通知</p>'
      : list.map(n => `
        <div class="notify-card">
          <div class="notify-content">${esc(n.content || '')}</div>
          <div class="notify-time">发布于：${fmtTime(n.createdAt)}</div>
        </div>
      `).join('');
  } catch (e) {
    document.getElementById('adminNotifyList').innerHTML = `<p class="empty">${e.message}</p>`;
  }
});

Router.register('adminChat', function (app) {
  Router.go('myChat');
});
